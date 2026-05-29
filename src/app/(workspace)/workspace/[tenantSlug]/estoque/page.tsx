import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { countLowStockItems, getLowStockItems } from "@/lib/db/inventory-queries"
import Link from "next/link"
import { Plus, Package, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { InventoryFilters } from "./inventory-filters"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  return { title: `Estoque - ${tenantSlug}` }
}

export default async function InventoryPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q, category, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 20
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ]
  }
  if (category) where.category = category

  const [total, items, categories, lowStockTotal, lowStockPreview] = await Promise.all([
    prisma.inventoryItem.count({ where: where as Record<string, unknown> }),
    prisma.inventoryItem.findMany({
      where: where as Record<string, unknown>,
      include: { supplier: { select: { name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId: tenant.id, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
    countLowStockItems(tenant.id),
    getLowStockItems(tenant.id, 5),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie suas peças e materiais</p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/estoque/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Item
          </Link>
        </Button>
      </div>

      {lowStockTotal > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-medium">{lowStockTotal} item(ns) com estoque baixo</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockPreview.map((i) => (
              <span key={i.id} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {i.name} ({i.quantity}/{i.minQuantity})
              </span>
            ))}
            {lowStockTotal > lowStockPreview.length && (
              <span className="text-xs text-amber-600">e mais {lowStockTotal - lowStockPreview.length}...</span>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome ou SKU..." basePath={`/workspace/${tenantSlug}/estoque`} defaultValue={q} />
      </div>

      <InventoryFilters category={category} categories={categories} basePath={`/workspace/${tenantSlug}/estoque`} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Package className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{q || category ? "Nenhum item encontrado" : "Nenhum item no estoque"}</p>
          {!q && !category && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/workspace/${tenantSlug}/estoque/novo`}>
                <Plus className="mr-2 size-4" />Cadastrar primeiro item
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Qtd</th>
                  <th className="px-4 py-3 font-medium text-right">Venda</th>
                  <th className="px-4 py-3 font-medium text-right">Custo</th>
                  <th className="px-4 py-3 font-medium">Fornecedor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i) => {
                  const isLow = i.quantity <= i.minQuantity
                  return (
                    <tr key={i.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <Link href={`/workspace/${tenantSlug}/estoque/${i.id}`} className="font-medium hover:text-primary">
                          {i.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{i.sku || "—"}</td>
                      <td className="px-4 py-3 text-xs">{i.category || "—"}</td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${isLow ? "text-red-600" : ""}`}>
                        {i.quantity}
                        {isLow && <AlertTriangle className="ml-1 inline size-3 text-red-500" />}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(i.unitPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-500">{Number(i.costPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i.supplier?.name || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/estoque`} searchParams={{ q, category }} />
        </>
      )}
    </div>
  )
}
