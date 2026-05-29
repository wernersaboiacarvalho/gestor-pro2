import { prisma } from "@/lib/db/prisma"
import { requireAuth } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"
import { countLowStockItems, getLowStockItems } from "@/lib/db/inventory-queries"

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { tenantId } = auth.ctx
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    overdueFinancialRecords,
    overdueFinancialRecordsTotal,
    lowStockItemsTop5,
    lowStockItemsTotal,
    staleOrders,
    staleOrdersTotal,
    pendingBudgets,
    pendingBudgetsTotal,
  ] = await Promise.all([
    prisma.financialRecord.findMany({
      where: {
        tenantId,
        status: "pending",
        dueDate: { lt: now },
      },
      select: {
        id: true,
        description: true,
        value: true,
        dueDate: true,
        type: true,
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.financialRecord.count({
      where: {
        tenantId,
        status: "pending",
        dueDate: { lt: now },
      },
    }),
    getLowStockItems(tenantId, 5),
    countLowStockItems(tenantId),
    prisma.serviceOrder.findMany({
      where: {
        tenantId,
        type: "service_order",
        status: "in_progress",
        startedAt: { lt: sevenDaysAgo },
      },
      select: {
        id: true,
        orderNumber: true,
        description: true,
        startedAt: true,
        vehicle: { select: { plate: true } },
      },
      orderBy: { startedAt: "asc" },
      take: 5,
    }),
    prisma.serviceOrder.count({
      where: {
        tenantId,
        type: "service_order",
        status: "in_progress",
        startedAt: { lt: sevenDaysAgo },
      },
    }),
    prisma.serviceOrder.findMany({
      where: {
        tenantId,
        type: "budget",
        status: "sent",
      },
      select: {
        id: true,
        orderNumber: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.serviceOrder.count({
      where: {
        tenantId,
        type: "budget",
        status: "sent",
      },
    }),
  ])

  const notifications = [
    {
      type: "overdue_bills",
      count: overdueFinancialRecordsTotal,
      items: overdueFinancialRecords.map((r) => ({
        id: r.id,
        title: r.description,
        subtitle: `${r.type === "receivable" ? "Receber" : "Pagar"} — R$ ${r.value}`,
        href: `/financeiro`,
      })),
      severity: "high",
    },
    {
      type: "low_stock",
      count: lowStockItemsTotal,
      items: lowStockItemsTop5.map((i) => ({
        id: i.id,
        title: i.name,
        subtitle: `${i.quantity} / ${i.minQuantity} — ${i.sku ?? "Sem SKU"}`,
        href: `/estoque`,
      })),
      severity: "medium",
    },
    {
      type: "stale_orders",
      count: staleOrdersTotal,
      items: staleOrders.map((o) => ({
        id: o.id,
        title: `#${o.orderNumber}`,
        subtitle: `${o.vehicle.plate} — ${o.description.substring(0, 40)}`,
        href: `/ordens-servico`,
      })),
      severity: "medium",
    },
    {
      type: "pending_budgets",
      count: pendingBudgetsTotal,
      items: pendingBudgets.map((b) => ({
        id: b.id,
        title: `#${b.orderNumber}`,
        subtitle: b.description.substring(0, 50),
        href: `/ordens-servico`,
      })),
      severity: "low",
    },
  ]

  return NextResponse.json(notifications)
}
