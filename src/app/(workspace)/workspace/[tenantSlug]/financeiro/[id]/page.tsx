import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Calendar, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

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

export default async function FinancialDetailPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const record = await prisma.financialRecord.findUnique({ where: { id, tenantId: tenant.id } })
  if (!record) notFound()

  const isOverdue = record.status === "pending" && new Date(record.dueDate) < new Date()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/financeiro`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{record.description}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.type === "receivable" ? "Conta a Receber" : "Conta a Pagar"}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/workspace/${tenantSlug}/financeiro/${record.id}/editar`}>Editar</Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="size-4" />
            <span>Valor</span>
          </div>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${record.type === "receivable" ? "text-green-600" : "text-red-600"}`}>
            {Number(record.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>Vencimento</span>
          </div>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${isOverdue ? "text-red-600" : ""}`}>
            {new Date(record.dueDate).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`rounded-full p-1 ${record.type === "receivable" ? "text-green-600" : "text-red-600"}`}>
              {record.type === "receivable" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            </span>
            <span>Tipo</span>
          </div>
          <p className="mt-2 text-xl font-bold">
            {record.type === "receivable" ? "A Receber" : "A Pagar"}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Status</span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusColors[record.status]}`}>
              {record.status === "pending" && <Clock className="size-4" />}
              {record.status === "paid" && <CheckCircle className="size-4" />}
              {record.status === "cancelled" && <XCircle className="size-4" />}
              {statusLabels[record.status]}
            </span>
          </div>
          {record.paidAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Pago em: {new Date(record.paidAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-5 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-muted-foreground">Detalhes</h3>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Categoria:</span>
            <p className="font-medium">{record.category || "—"}</p>
          </div>
          {record.serviceOrderId && (
            <div>
              <span className="text-muted-foreground">Ordem de Serviço:</span>
              <p className="font-medium">{record.serviceOrderId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
