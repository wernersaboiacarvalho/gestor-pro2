import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit, Car, Wrench, DollarSign, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string; id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Cliente - ${id}` }
}

const osStatusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluído",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const osStatusColors: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
}

const finStatusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
}

const finStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
}

const finStatusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  paid: CheckCircle,
  cancelled: XCircle,
}

export default async function CustomerDetailPage({ params, searchParams }: Props) {
  const { tenantSlug, id } = await params
  const { tab } = await searchParams
  const tenant = await getTenantContext(tenantSlug)
  const activeTab = tab || "dados"

  const customer = await prisma.customer.findUnique({
    where: { id, tenantId: tenant.id },
  })
  if (!customer) notFound()

  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: id, tenantId: tenant.id },
    include: {
      _count: { select: { serviceOrders: true } },
    },
    orderBy: { plate: "asc" },
  })

  const vehicleIds = vehicles.map((v) => v.id)

  const orders = vehicleIds.length > 0
    ? await prisma.serviceOrder.findMany({
        where: { vehicleId: { in: vehicleIds }, tenantId: tenant.id },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
        orderBy: { createdAt: "desc" },
      })
    : []

  const orderIds = orders.map((o) => o.id)

  const financialRecords = orderIds.length > 0
    ? await prisma.financialRecord.findMany({
        where: { serviceOrderId: { in: orderIds }, tenantId: tenant.id },
        orderBy: { dueDate: "asc" },
      })
    : []

  const totalSpent = orders
    .filter((o) => o.type === "service_order")
    .reduce((sum, o) => sum + Number(o.totalValue), 0)

  const totalPending = financialRecords
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.value), 0)

  const tabs = [
    { key: "dados", label: "Dados" },
    { key: "veiculos", label: "Veículos" },
    { key: "os", label: "OS" },
    { key: "financeiro", label: "Financeiro" },
  ]

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href={`/workspace/${tenantSlug}/clientes`}>
            <ArrowLeft className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <Button variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/clientes/${id}/editar`}>
              <Edit className="mr-2 size-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="size-4" />
            <span>Veículos</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{vehicles.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="size-4" />
            <span>Ordens de Serviço</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <DollarSign className="size-4" />
            <span className="font-medium">Total Gasto</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-green-600">
            {totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertTriangle className="size-4" />
            <span className="font-medium">Pendente</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-600">
            {totalPending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/workspace/${tenantSlug}/clientes/${id}${t.key === "dados" ? "" : `?tab=${t.key}`}`}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "dados" && (
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Informações do Cliente</h3>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Nome</span>
              <p className="font-medium">{customer.name}</p>
            </div>
            {customer.cpf && (
              <div>
                <span className="text-muted-foreground">CPF</span>
                <p className="font-medium">{customer.cpf}</p>
              </div>
            )}
            {customer.cnpj && (
              <div>
                <span className="text-muted-foreground">CNPJ</span>
                <p className="font-medium">{customer.cnpj}</p>
              </div>
            )}
            {customer.phone && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="size-3" /> Telefone
                </span>
                <p className="font-medium">{customer.phone}</p>
              </div>
            )}
            {customer.email && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3" /> E-mail
                </span>
                <p className="font-medium">{customer.email}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3" /> Endereço
                </span>
                <p className="font-medium">{customer.address}</p>
              </div>
            )}
            {customer.notes && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Observações</span>
                <p className="font-medium">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "veiculos" && (
        <div>
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
              <Car className="size-8 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Nenhum veículo cadastrado</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/workspace/${tenantSlug}/veiculos/${v.id}/editar`}
                  className="group rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{v.plate}</h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                      {v.year}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{v.brand} {v.model}</p>
                  {v.color && <p className="text-xs text-zinc-400">{v.color}</p>}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Wrench className="size-3 text-zinc-400" />
                    <span className="text-muted-foreground">{v._count.serviceOrders} OS</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "os" && (
        <div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
              <Wrench className="size-8 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Número</th>
                      <th className="px-4 py-3 font-medium">Veículo</th>
                      <th className="px-4 py-3 font-medium">Descrição</th>
                      <th className="px-4 py-3 font-medium">Valor</th>
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3">
                          <Link href={`/workspace/${tenantSlug}/ordens-servico/${o.id}`} className="font-medium hover:text-primary">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{o.vehicle.plate}</td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{o.description}</td>
                        <td className="px-4 py-3 font-medium tabular-nums">
                          {Number(o.totalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {o.createdAt.toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${osStatusColors[o.status]}`}>
                            {osStatusLabels[o.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "financeiro" && (
        <div>
          {financialRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
              <DollarSign className="size-8 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">Nenhum registro financeiro encontrado</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Vencimento</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {financialRecords.map((r) => {
                    const StatusIcon = finStatusIcons[r.status]
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
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${finStatusColors[r.status]}`}>
                            <StatusIcon className="size-3" />
                            {finStatusLabels[r.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{r.category || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
