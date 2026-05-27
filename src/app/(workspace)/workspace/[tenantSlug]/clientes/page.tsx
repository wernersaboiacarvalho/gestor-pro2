import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, Users, Phone, Mail, Car } from "lucide-react"
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
  return { title: `Clientes - ${tenantSlug}` }
}

export default async function CustomersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 12
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const total = await prisma.customer.count({ where: where as Record<string, unknown> })

  const customers = await prisma.customer.findMany({
    where: where as Record<string, unknown>,
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus clientes e seus veículos</p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/clientes/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome, CPF ou telefone..." basePath={`/workspace/${tenantSlug}/clientes`} defaultValue={q} />
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Users className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
          {!q && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/workspace/${tenantSlug}/clientes/novo`}>
                <Plus className="mr-2 size-4" />Cadastrar primeiro cliente
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/workspace/${tenantSlug}/clientes/${c.id}/editar`}
                className="group rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-semibold truncate">{c.name}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {c.cpf && <p>{c.cpf}</p>}
                  {c.cnpj && <p className="font-mono text-xs text-zinc-400">{c.cnpj}</p>}
                  {c.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3" />{c.phone}
                    </p>
                  )}
                  {c.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3" />
                      <span className="truncate">{c.email}</span>
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <Car className="size-3 text-zinc-400" />
                  <span className="text-muted-foreground">{c._count.vehicles} veículo(s)</span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/clientes`} searchParams={{ q }} />
        </>
      )}
    </div>
  )
}
