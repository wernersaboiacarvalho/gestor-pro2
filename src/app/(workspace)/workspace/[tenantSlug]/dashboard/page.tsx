import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Wrench, CheckCircle, DollarSign, AlertTriangle, ArrowRight, Clock, Calendar, TrendingUp, Users } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard/charts"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function TenantDashboardPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  const tenantId = tenant.id

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    pendingOrders,
    inProgressOrders,
    completedThisMonth,
    monthlyRevenue,
    recentOrders,
    upcomingBills,
    lowStockItems,
    totalCustomers,
    overdueCount,
    newCustomersThisMonth,
    ordersByStatus,
    monthlyRevenueHistory,
    ticketAvg,
  ] = await Promise.all([
    prisma.serviceOrder.count({ where: { tenantId, status: "pending" } }),
    prisma.serviceOrder.count({ where: { tenantId, status: "in_progress" } }),
    prisma.serviceOrder.count({ where: { tenantId, status: "completed", completedAt: { gte: startOfMonth } } }),
    prisma.serviceOrder.aggregate({
      where: { tenantId, status: { in: ["completed", "delivered"] }, completedAt: { gte: startOfMonth } },
      _sum: { totalValue: true },
    }),
    prisma.serviceOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { vehicle: { select: { plate: true, brand: true, model: true } } },
    }),
    prisma.financialRecord.findMany({
      where: { tenantId, type: "payable", status: "pending", dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { quantity: "asc" },
      take: 50,
    }).then(items => items.filter(i => i.quantity <= i.minQuantity).slice(0, 5)),
    prisma.customer.count({ where: { tenantId } }),
    prisma.financialRecord.count({
      where: { tenantId, status: "pending", dueDate: { lt: now } },
    }),
    prisma.customer.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    }),
    prisma.serviceOrder.groupBy({
      by: ["status"],
      where: { tenantId, type: "service_order" },
      _count: { status: true },
    }),
    (async () => {
      const rows = await prisma.$queryRaw<{ month: Date; revenue: number }[]>`
        SELECT
          date_trunc('month', "completedAt") AS month,
          COALESCE(SUM("totalValue"), 0)::float AS revenue
        FROM "ServiceOrder"
        WHERE "tenantId" = ${tenantId}
          AND status IN ('completed', 'delivered')
          AND "completedAt" >= date_trunc('month', now()) - interval '5 months'
        GROUP BY month
        ORDER BY month ASC
      `

      const months: { month: string; revenue: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const found = rows.find(
          (r) => new Date(r.month).getMonth() === d.getMonth() && new Date(r.month).getFullYear() === d.getFullYear()
        )
        months.push({
          month: d.toLocaleDateString("pt-BR", { month: "short" }),
          revenue: found ? found.revenue : 0,
        })
      }
      return months
    })(),
    (async () => {
      const completedOrders = await prisma.serviceOrder.aggregate({
        where: { tenantId, status: { in: ["completed", "delivered"] }, completedAt: { gte: startOfMonth } },
        _sum: { totalValue: true },
        _count: { id: true },
      })
      const count = completedOrders._count.id
      const total = Number(completedOrders._sum.totalValue ?? 0)
      return count > 0 ? total / count : 0
    })(),
  ])

  const revenue = Number(monthlyRevenue._sum.totalValue ?? 0)

  const ordersByStatusData = ordersByStatus.map((s) => ({
    status: s.status,
    count: s._count.status,
  }))

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Clock className="size-4" />
            <span className="font-medium">OS Pendentes</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{pendingOrders}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Wrench className="size-4" />
            <span className="font-medium">Em Andamento</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{inProgressOrders}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="size-4" />
            <span className="font-medium">Concluídas (mês)</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{completedThisMonth}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <DollarSign className="size-4" />
            <span className="font-medium">Faturamento (mês)</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-violet-600">
            <TrendingUp className="size-4" />
            <span className="font-medium">Ticket Médio</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{ticketAvg.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span className="font-medium">Clientes</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{totalCustomers}</p>
          <p className="text-xs text-muted-foreground">+{newCustomersThisMonth} novos no mês</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-medium">{overdueCount} conta(s) vencida(s)</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="mb-8">
        <DashboardCharts
          monthlyRevenue={monthlyRevenueHistory}
          ordersByStatus={ordersByStatusData}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-lg border bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-sm font-semibold">Últimas Ordens de Serviço</h2>
            <Link href={`/workspace/${tenantSlug}/ordens-servico`} className="flex items-center gap-1 text-xs text-primary hover:underline">
              Ver todas <ArrowRight className="size-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhuma OS ainda</p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((o) => (
                <Link key={o.id} href={`/workspace/${tenantSlug}/ordens-servico/${o.id}`} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <div>
                    <p className="font-medium">{o.description.substring(0, 40)}{o.description.length > 40 ? "..." : ""}</p>
                    <p className="text-xs text-muted-foreground">{o.vehicle.brand} {o.vehicle.model} — {o.vehicle.plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{Number(o.totalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.status === "completed" ? "bg-green-100 text-green-700" : o.status === "in_progress" ? "bg-blue-100 text-blue-700" : o.status === "pending" ? "bg-amber-100 text-amber-700" : o.status === "delivered" ? "bg-zinc-100 text-zinc-700" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {o.status === "completed" ? "Concluída" : o.status === "in_progress" ? "Em Andamento" : o.status === "pending" ? "Pendente" : o.status === "delivered" ? "Entregue" : o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bills & Low Stock */}
        <div className="space-y-6">
          {/* Upcoming Bills */}
          <div className="rounded-lg border bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="size-4 text-red-500" />
                Próximas Contas a Pagar
              </h2>
              <Link href={`/workspace/${tenantSlug}/financeiro?type=payable`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                Ver todas <ArrowRight className="size-3" />
              </Link>
            </div>
            {upcomingBills.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhuma conta a pagar</p>
            ) : (
              <div className="divide-y">
                {upcomingBills.map((b) => (
                  <Link key={b.id} href={`/workspace/${tenantSlug}/financeiro/${b.id}`} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <div>
                      <p className="font-medium">{b.description}</p>
                      <p className="text-xs text-muted-foreground">Vence {new Date(b.dueDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p className="font-medium tabular-nums text-red-600">{Number(b.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="rounded-lg border bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4 text-amber-500" />
                Estoque Baixo
              </h2>
              <Link href={`/workspace/${tenantSlug}/estoque`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                Ver estoque <ArrowRight className="size-3" />
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">Estoque ok</p>
            ) : (
              <div className="divide-y">
                {lowStockItems.map((i) => (
                  <Link key={i.id} href={`/workspace/${tenantSlug}/estoque/${i.id}`} className="flex items-center justify-between px-6 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <p className="font-medium">{i.name}</p>
                    <p className="font-medium tabular-nums text-red-600">{i.quantity} / {i.minQuantity}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
