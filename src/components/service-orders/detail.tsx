"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Car,
  Calendar,
  Wrench,
  ClipboardList,
  Send,
  CheckCircle2,
  Play,
  Truck,
  XCircle,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800" },
  sent: { label: "Enviado", className: "bg-blue-100 text-blue-700 dark:bg-blue-950" },
  approved: { label: "Aprovado", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950" },
  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700 dark:bg-red-950" },
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-950" },
  in_progress: { label: "Em Andamento", className: "bg-blue-100 text-blue-700 dark:bg-blue-950" },
  completed: { label: "Concluída", className: "bg-violet-100 text-violet-700 dark:bg-violet-950" },
  delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950" },
  cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-950" },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatDate(date: string | Date | null) {
  if (!date) return "--"
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface OrderItem {
  id: string
  type: string
  description: string
  quantity: number
  unitValue: number
  totalValue: number
}

interface OrderData {
  id: string
  orderNumber: string
  type: string
  status: string
  description: string
  totalValue: number
  discount: number
  notes: string | null
  createdAt: string
  approvedAt: string | null
  startedAt: string | null
  completedAt: string | null
  deliveredAt: string | null
  vehicle: { plate: string; brand: string; model: string; year: number; color: string | null }
  mechanic: { id: string; name: string } | null
  items: OrderItem[]
}

export function ServiceOrderDetail({ order, tenantSlug }: { order: OrderData; tenantSlug: string }) {
  const router = useRouter()
  const [acting, setActing] = useState(false)
  const st = statusConfig[order.status] ?? { label: order.status, className: "" }

  async function handleAction(action: string) {
    setActing(true)
    await fetch(`/api/service-orders/${order.id}/${action}`, { method: "PATCH" })
    router.refresh()
    setActing(false)
  }

  const totalItems = order.items?.reduce((sum, i) => sum + i.quantity * i.unitValue, 0) ?? 0
  const final = totalItems - order.discount

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-primary">#{order.orderNumber}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.className}`}>{st.label}</span>
            <span className="text-xs font-medium text-muted-foreground">
              {order.type === "budget" ? "Orçamento" : "Ordem de Serviço"}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{order.description}</p>
        </div>

        <div className="flex gap-2">
          {order.type === "budget" && order.status === "draft" && (
            <>
              <Button size="sm" onClick={() => handleAction("send")} disabled={acting}>
                <Send className="mr-1.5 size-3.5" />
                {acting ? "..." : "Enviar ao cliente"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/workspace/${tenantSlug}/ordens-servico/${order.id}/editar`}>
                  <Pencil className="mr-1.5 size-3.5" />
                  Editar
                </Link>
              </Button>
            </>
          )}
          {order.type === "budget" && order.status === "sent" && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("approve")} disabled={acting}>
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Aprovar
              </Button>
              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleAction("reject")} disabled={acting}>
                <XCircle className="mr-1.5 size-3.5" />
                Rejeitar
              </Button>
            </>
          )}
          {order.type === "budget" && order.status === "approved" && (
            <Button size="sm" onClick={() => handleAction("convert")} disabled={acting}>
              <Play className="mr-1.5 size-3.5" />
              Iniciar Ordem de Serviço
            </Button>
          )}
          {order.type === "service_order" && order.status === "pending" && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAction("start")} disabled={acting}>
              <Play className="mr-1.5 size-3.5" />
              Iniciar
            </Button>
          )}
          {order.type === "service_order" && order.status === "in_progress" && (
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={() => handleAction("complete")} disabled={acting}>
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Concluir
            </Button>
          )}
          {order.type === "service_order" && order.status === "completed" && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction("deliver")} disabled={acting}>
              <Truck className="mr-1.5 size-3.5" />
              Entregar
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Car className="size-3" /> Veículo</p>
          <p className="font-semibold text-sm">{order.vehicle.plate}</p>
          <p className="text-sm text-muted-foreground">{order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wrench className="size-3" /> Mecânico</p>
          <p className="font-semibold text-sm">{order.mechanic?.name ?? "Não atribuído"}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="size-3" /> Datas</p>
          <div className="space-y-1 text-xs">
            <p>Criado: {formatDate(order.createdAt)}</p>
            {order.approvedAt && <p>Aprovado: {formatDate(order.approvedAt)}</p>}
            {order.startedAt && <p>Iniciado: {formatDate(order.startedAt)}</p>}
            {order.completedAt && <p>Concluído: {formatDate(order.completedAt)}</p>}
            {order.deliveredAt && <p>Entregue: {formatDate(order.deliveredAt)}</p>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ClipboardList className="size-4" />
          <h2 className="font-semibold">Itens ({order.items?.length ?? 0})</h2>
        </div>
        {order.items?.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-3 pl-5 text-left font-medium">Tipo</th>
                <th className="py-3 text-left font-medium">Descrição</th>
                <th className="py-3 text-right font-medium">Qtd</th>
                <th className="py-3 text-right font-medium">Valor Un.</th>
                <th className="py-3 pr-5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b text-sm last:border-b-0">
                  <td className="py-3 pl-5">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${item.type === "service" ? "bg-blue-100 text-blue-700 dark:bg-blue-950" : "bg-amber-100 text-amber-700 dark:bg-amber-950"}`}>
                      {item.type === "service" ? "Serviço" : "Peça"}
                    </span>
                  </td>
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(item.unitValue)}</td>
                  <td className="py-3 pr-5 text-right tabular-nums font-medium">{formatCurrency(item.quantity * item.unitValue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t text-sm">
                <td colSpan={4} className="py-3 pl-5 text-right text-muted-foreground">Subtotal</td>
                <td className="py-3 pr-5 text-right tabular-nums">{formatCurrency(totalItems)}</td>
              </tr>
              {order.discount > 0 && (
                <tr className="text-sm text-red-600">
                  <td colSpan={4} className="py-1 pl-5 text-right">Desconto</td>
                  <td className="py-1 pr-5 text-right tabular-nums">-{formatCurrency(order.discount)}</td>
                </tr>
              )}
              <tr className="text-sm font-bold">
                <td colSpan={4} className="py-3 pl-5 text-right">Total</td>
                <td className="py-3 pr-5 text-right tabular-nums text-primary">{formatCurrency(final)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum item adicionado
          </div>
        )}
      </div>

      {order.notes && (
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
          <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
