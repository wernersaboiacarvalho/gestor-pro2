import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, Truck, Phone, Mail, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  return { title: `Fornecedores - ${tenantSlug}` }
}

export default async function SuppliersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 12
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { cnpj: { contains: q, mode: "insensitive" } },
    ]
  }

  const total = await prisma.supplier.count({ where: where as Record<string, unknown> })

  const suppliers = await prisma.supplier.findMany({
    where: where as Record<string, unknown>,
    include: { _count: { select: { inventoryItems: true } } },
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus fornecedores de peças e serviços</p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/fornecedores/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Fornecedor
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome ou CNPJ..." basePath={`/workspace/${tenantSlug}/fornecedores`} defaultValue={q} />
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Truck className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{q ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}</p>
          {!q && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/workspace/${tenantSlug}/fornecedores/novo`}>
                <Plus className="mr-2 size-4" />Cadastrar primeiro fornecedor
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <Link
                key={s.id}
                href={`/workspace/${tenantSlug}/fornecedores/${s.id}/editar`}
                className="group rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-semibold truncate">{s.name}</h3>
                {s.cnpj && <p className="mt-1 font-mono text-xs text-zinc-400">{s.cnpj}</p>}
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {s.phone && (
                    <p className="flex items-center gap-1.5"><Phone className="size-3" />{s.phone}</p>
                  )}
                  {s.email && (
                    <p className="flex items-center gap-1.5"><Mail className="size-3" /><span className="truncate">{s.email}</span></p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Package className="size-3 text-zinc-400" />
                  <span className="text-muted-foreground">{s._count.inventoryItems} item(ns)</span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/fornecedores`} searchParams={{ q }} />
        </>
      )}
    </div>
  )
}
