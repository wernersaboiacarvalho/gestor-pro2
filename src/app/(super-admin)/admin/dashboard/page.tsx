import { prisma } from "@/lib/db/prisma"
import { Building2, Users, ClipboardList, DollarSign, Activity } from "lucide-react"

export default async function SuperAdminDashboardPage() {
  const [totalTenants, activeTenants, totalUsers, totalOrders, totalRevenue] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "active" } }),
    prisma.user.count({ where: { role: { not: "super_admin" } } }),
    prisma.serviceOrder.count(),
    prisma.financialRecord.aggregate({
      where: { type: "receivable", status: "paid" },
      _sum: { value: true },
    }),
  ])

  const recentTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, slug: true, status: true, plan: true, createdAt: true },
  })

  const revenue = Number(totalRevenue._sum.value ?? 0)

  const cards = [
    { label: "Total de Tenants", value: totalTenants, icon: Building2, color: "text-blue-600" },
    { label: "Ativos", value: activeTenants, icon: Activity, color: "text-green-600" },
    { label: "Usuários", value: totalUsers, icon: Users, color: "text-violet-600" },
    { label: "Ordens de Serviço", value: totalOrders, icon: ClipboardList, color: "text-amber-600" },
    { label: "Receita Global", value: revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), icon: DollarSign, color: "text-emerald-600" },
  ]

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Dashboard Global</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className={`size-4 ${c.color}`} />
              <span>{c.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white dark:bg-zinc-900">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold">Últimos Tenants</h2>
        </div>
        <div className="divide-y">
          {recentTenants.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.slug} · {t.plan}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                t.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : t.status === "suspended" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}>
                {t.status === "active" ? "Ativo" : t.status === "suspended" ? "Suspenso" : "Cancelado"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
