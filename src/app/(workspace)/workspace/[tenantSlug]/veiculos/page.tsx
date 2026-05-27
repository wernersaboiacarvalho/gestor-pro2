import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, Car, Users } from "lucide-react"
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
  return { title: `Veículos - ${tenantSlug}` }
}

export default async function VehiclesPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 12
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { plate: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
    ]
  }

  const total = await prisma.vehicle.count({ where: where as Record<string, unknown> })

  const vehicles = await prisma.vehicle.findMany({
    where: where as Record<string, unknown>,
    include: { customer: { select: { name: true } } },
    orderBy: { plate: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os veículos dos seus clientes</p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/veiculos/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Veículo
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput placeholder="Buscar por placa, marca ou modelo..." basePath={`/workspace/${tenantSlug}/veiculos`} defaultValue={q} />
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Car className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{q ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"}</p>
          {!q && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/workspace/${tenantSlug}/veiculos/novo`}>
                <Plus className="mr-2 size-4" />Cadastrar primeiro veículo
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
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
                  <Users className="size-3 text-zinc-400" />
                  <span className="text-muted-foreground">{v.customer.name}</span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/veiculos`} searchParams={{ q }} />
        </>
      )}
    </div>
  )
}
