import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { requireTenantAccess } from "@/lib/auth/api-auth"

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const type = searchParams.get("type") || "os"
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

  let csv = ""
  let filename = ""

  if (type === "os") {
    const orders = await prisma.serviceOrder.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: { vehicle: { select: { plate: true } } },
      orderBy: { createdAt: "desc" },
    })
    csv = "Número,Descrição,Veículo,Status,Valor,Data\n"
    for (const o of orders) {
      csv += [
        o.orderNumber,
        escapeCSV(o.description),
        o.vehicle.plate,
        o.status,
        String(Number(o.totalValue)),
        formatDate(o.createdAt),
      ].join(",") + "\n"
    }
    filename = `ordens-servico-${formatDate(start)}-${formatDate(end)}.csv`
  } else if (type === "financeiro") {
    const records = await prisma.financialRecord.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      orderBy: { dueDate: "desc" },
    })
    csv = "Descrição,Tipo,Status,Valor,Vencimento,Categoria\n"
    for (const r of records) {
      csv += [
        escapeCSV(r.description),
        r.type === "receivable" ? "A Receber" : "A Pagar",
        r.status,
        String(Number(r.value)),
        formatDate(r.dueDate),
        r.category ?? "",
      ].join(",") + "\n"
    }
    filename = `financeiro-${formatDate(start)}-${formatDate(end)}.csv`
  } else if (type === "estoque") {
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    })
    csv = "Nome,SKU,Categoria,Quantidade,Qtd Mínima,Preço Unitário,Custo\n"
    for (const i of items) {
      csv += [
        escapeCSV(i.name),
        i.sku ?? "",
        i.category ?? "",
        String(i.quantity),
        String(i.minQuantity),
        String(Number(i.unitPrice)),
        String(Number(i.costPrice)),
      ].join(",") + "\n"
    }
    filename = `estoque-${formatDate(new Date())}.csv`
  } else if (type === "clientes") {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: { _count: { select: { vehicles: true } } },
      orderBy: { name: "asc" },
    })
    csv = "Nome,CPF,CNPJ,Telefone,Email,Endereço,Viículos\n"
    for (const c of customers) {
      csv += [
        escapeCSV(c.name),
        c.cpf ?? "",
        c.cnpj ?? "",
        c.phone,
        c.email ?? "",
        escapeCSV(c.address ?? ""),
        String(c._count.vehicles),
      ].join(",") + "\n"
    }
    filename = `clientes-${formatDate(new Date())}.csv`
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
