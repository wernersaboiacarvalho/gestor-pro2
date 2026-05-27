import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, ArrowUpRight, ArrowDownRight, AlertTriangle, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/shared/pagination"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ type?: string; status?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  return { title: `Financeiro - ${tenantSlug}` }
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
}

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  paid: CheckCircle,
  cancelled: XCircle,
}

export default async function FinanceiroPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { type: tabType, status, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 20
  const tenant = await getTenantContext(tenantSlug)

  const activeTab = tabType === "payable" ? "payable" : "receivable"

  const where: Record<string, unknown> = { tenantId: tenant.id, type: activeTab }
  if (status && ["pending", "paid", "cancelled"].includes(status)) where.status = status

  const total = await prisma.financialRecord.count({ where: where as Record<string, unknown> })

  const records = await prisma.financialRecord.findMany({
    where: where as Record<string, unknown>,
    orderBy: { dueDate: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const [receivableAgg, payableAgg, overdue] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { tenantId: tenant.id, type: "receivable", status: { not: "cancelled" } },
      _sum: { value: true },
    }),
    prisma.financialRecord.aggregate({
      where: { tenantId: tenant.id, type: "payable", status: { not: "cancelled" } },
      _sum: { value: true },
    }),
    prisma.financialRecord.findMany({
      where: { tenantId: tenant.id, status: "pending", dueDate: { lt: new Date() } },
      select: { description: true, value: true, dueDate: true, type: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ])

  const receivableTotal = Number(receivableAgg._sum.value ?? 0)
  const payableTotal = Number(payableAgg._sum.value ?? 0)
  const balance = receivableTotal - payableTotal

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Controle de contas a receber e a pagar</p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/financeiro/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Lançamento
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <ArrowUpRight className="size-4" />
            <span className="font-medium">A Receber</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-green-600">
            {receivableTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <ArrowDownRight className="size-4" />
            <span className="font-medium">A Pagar</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-red-600">
            {payableTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="size-4" />
            <span className="font-medium">Saldo</span>
          </div>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-medium">{overdue.length} conta(s) vencida(s)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {overdue.map((o, i) => (
              <span key={i} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
                {o.description} — {Number(o.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({o.dueDate.toLocaleDateString("pt-BR")})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-lg border bg-white p-1 dark:bg-zinc-900">
        <Link
          href={`/workspace/${tenantSlug}/financeiro?type=receivable${status ? `&status=${status}` : ""}`}
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-all ${activeTab === "receivable" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          A Receber
        </Link>
        <Link
          href={`/workspace/${tenantSlug}/financeiro?type=payable${status ? `&status=${status}` : ""}`}
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-all ${activeTab === "payable" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          A Pagar
        </Link>
      </div>

      {/* Status filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: "", label: "Todas" },
          { value: "pending", label: "Pendentes" },
          { value: "paid", label: "Pagas" },
          { value: "cancelled", label: "Canceladas" },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/workspace/${tenantSlug}/financeiro?type=${activeTab}${f.value ? `&status=${f.value}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              (status ?? "") === f.value
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Records table */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <DollarSign className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">Nenhum registro encontrado</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/workspace/${tenantSlug}/financeiro/novo`}>
              <Plus className="mr-2 size-4" />Criar primeiro lançamento
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Vencimento</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((r) => {
                  const StatusIcon = statusIcons[r.status]
                  const isOverdue = r.status === "pending" && new Date(r.dueDate) < new Date()
                  return (
                    <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <Link href={`/workspace/${tenantSlug}/financeiro/${r.id}`} className="font-medium hover:text-primary">
                          {r.description}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {Number(r.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {new Date(r.dueDate).toLocaleDateString("pt-BR")}
                        {isOverdue && <AlertTriangle className="ml-1 inline size-3 text-red-500" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>
                          <StatusIcon className="size-3" />
                          {statusLabels[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.category || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/workspace/${tenantSlug}/financeiro/${r.id}/editar`}>Editar</Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/financeiro`} searchParams={{ type: activeTab, status }} />
        </>
      )}
    </div>
  )
}
