"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Play,
  Truck,
  Ban,
  ClipboardList,
} from "lucide-react"
import { useState } from "react"

interface OrderItem {
  id: string
  orderNumber: string
  type: string
  status: string
  description: string
  totalValue: number
  discount: number
  createdAt: string
  vehicle: { plate: string; brand: string; model: string }
  mechanic: { name: string } | null
  _count: { items: number }
}

interface Props {
  orders: OrderItem[]
  tenantSlug: string
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Rascunho", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", icon: <ClipboardList className="size-3" /> },
  sent: { label: "Enviado", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", icon: <Send className="size-3" /> },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", icon: <CheckCircle2 className="size-3" /> },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", icon: <XCircle className="size-3" /> },
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400", icon: <Clock className="size-3" /> },
  in_progress: { label: "Em Andamento", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", icon: <Play className="size-3" /> },
  completed: { label: "Concluída", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400", icon: <CheckCircle2 className="size-3" /> },
  delivered: { label: "Entregue", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400", icon: <Truck className="size-3" /> },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", icon: <Ban className="size-3" /> },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function ServiceOrderList({ orders, tenantSlug }: Props) {
  const router = useRouter()
  const [actingId, setActingId] = useState<string | null>(null)

  async function handleAction(id: string, action: string) {
    setActingId(id)
    await fetch(`/api/service-orders/${id}/${action}`, { method: "PATCH" })
    router.refresh()
    setActingId(null)
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
        <Car className="size-8 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">Nenhum registro encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const st = statusMap[order.status] ?? { label: order.status, color: "bg-zinc-100", icon: null }
        return (
          <div
            key={order.id}
            className="rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/workspace/${tenantSlug}/ordens-servico/${order.id}`}
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    #{order.orderNumber}
                  </Link>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                    {st.icon}
                    {st.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{order.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Car className="size-3" />
                    {order.vehicle.plate} — {order.vehicle.brand} {order.vehicle.model}
                  </span>
                  {order.mechanic && (
                    <span>{order.mechanic.name}</span>
                  )}
                  <span>{order._count.items} itens</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <p className="text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(Number(order.totalValue))}
                </p>

                {/* Actions */}
                {order.type === "budget" && order.status === "draft" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAction(order.id, "send")}
                      disabled={actingId === order.id}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {actingId === order.id ? "..." : "Enviar"}
                    </button>
                    <Link
                      href={`/workspace/${tenantSlug}/ordens-servico/${order.id}/editar`}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Editar
                    </Link>
                  </div>
                )}

                {order.type === "budget" && order.status === "sent" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAction(order.id, "approve")}
                      disabled={actingId === order.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actingId === order.id ? "..." : "Aprovar"}
                    </button>
                    <button
                      onClick={() => handleAction(order.id, "reject")}
                      disabled={actingId === order.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}

                {order.type === "budget" && order.status === "approved" && (
                  <button
                    onClick={() => handleAction(order.id, "convert")}
                    disabled={actingId === order.id}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {actingId === order.id ? "..." : "Iniciar OS"}
                  </button>
                )}

                {order.type === "service_order" && order.status === "pending" && (
                  <button
                    onClick={() => handleAction(order.id, "start")}
                    disabled={actingId === order.id}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actingId === order.id ? "..." : "Iniciar"}
                  </button>
                )}

                {order.type === "service_order" && order.status === "in_progress" && (
                  <button
                    onClick={() => handleAction(order.id, "complete")}
                    disabled={actingId === order.id}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {actingId === order.id ? "..." : "Concluir"}
                  </button>
                )}

                {order.type === "service_order" && order.status === "completed" && (
                  <button
                    onClick={() => handleAction(order.id, "deliver")}
                    disabled={actingId === order.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actingId === order.id ? "..." : "Entregar"}
                  </button>
                )}

                {order.status !== "cancelled" && order.status !== "delivered" && order.status !== "rejected" && (
                  <button
                    onClick={() => handleAction(order.id, "cancel")}
                    disabled={actingId === order.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
