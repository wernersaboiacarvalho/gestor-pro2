import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, AlertTriangle, DollarSign, Truck } from "lucide-react"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function InventoryDetailPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const item = await prisma.inventoryItem.findUnique({
    where: { id, tenantId: tenant.id },
    include: { supplier: true, movements: { orderBy: { createdAt: "desc" }, take: 20 } },
  })

  if (!item) notFound()

  const isLow = item.quantity <= item.minQuantity
  const margin = Number(item.unitPrice) - Number(item.costPrice)
  const marginPct = Number(item.costPrice) > 0 ? (margin / Number(item.costPrice)) * 100 : 0

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/estoque`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{item.sku && <span className="font-mono">{item.sku} — </span>}{item.category}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/workspace/${tenantSlug}/estoque/${item.id}/editar`}>Editar</Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="size-4" />
            <span>Quantidade</span>
          </div>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${isLow ? "text-red-600" : ""}`}>
            {item.quantity}
          </p>
          {isLow && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="size-3" />
              Estoque baixo (mín: {item.minQuantity})
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="size-4" />
            <span>Margem</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-green-600">
              {Number(item.unitPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Custo: {Number(item.costPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} ({marginPct.toFixed(0)}% margem)
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4" />
            <span>Fornecedor</span>
          </div>
          <p className="mt-2 text-xl font-bold">{item.supplier?.name || "—"}</p>
          {item.supplier?.phone && <p className="mt-1 text-xs text-muted-foreground">{item.supplier.phone}</p>}
        </div>
      </div>

      {item.description && (
        <div className="mt-6 rounded-lg border bg-white p-5 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-muted-foreground">Descrição</h3>
          <p className="mt-1 text-sm">{item.description}</p>
        </div>
      )}

      {item.movements.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold">Últimas Movimentações</h3>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium text-right">Qtd</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {item.movements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-2 text-xs text-muted-foreground">{m.createdAt.toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.type === "in" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                        {m.type === "in" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{m.quantity}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{m.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
