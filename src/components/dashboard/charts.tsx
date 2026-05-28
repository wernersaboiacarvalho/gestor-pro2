"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface OrdersByStatus {
  status: string
  count: number
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluída",
  delivered: "Entregue",
  cancelled: "Cancelada",
}

const statusColors: Record<string, string> = {
  draft: "#a1a1aa",
  sent: "#3b82f6",
  approved: "#10b981",
  rejected: "#ef4444",
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function DashboardCharts({
  monthlyRevenue,
  ordersByStatus,
}: {
  monthlyRevenue: MonthlyRevenue[]
  ordersByStatus: OrdersByStatus[]
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly Revenue Line Chart */}
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold">Faturamento Mensal</h2>
        {monthlyRevenue.some((m) => m.revenue > 0) ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "#a1a1aa" }} />
              <YAxis className="text-xs" tick={{ fill: "#a1a1aa" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "8px", color: "#fff" }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Sem dados de faturamento</p>
        )}
      </div>

      {/* Orders by Status Bar Chart */}
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold">OS por Status</h2>
        {ordersByStatus.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="status" className="text-xs" tick={{ fill: "#a1a1aa" }} tickFormatter={(v) => statusLabels[v] ?? v} />
              <YAxis className="text-xs" tick={{ fill: "#a1a1aa" }} allowDecimals={false} />
              <Tooltip
                formatter={(value, _name, props) => [value, statusLabels[(props as { payload: { status: string } }).payload.status] ?? ""]}
                contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "8px", color: "#fff" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ordersByStatus.map((entry) => (
                  <rect key={entry.status} fill={statusColors[entry.status] ?? "#71717a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Sem OS registradas</p>
        )}
      </div>
    </div>
  )
}
