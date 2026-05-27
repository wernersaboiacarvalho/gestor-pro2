import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, Wrench, Phone, Mail, Star } from "lucide-react"
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
  return { title: `Mecânicos - ${tenantSlug}` }
}

export default async function MechanicsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 12
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { specialty: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const total = await prisma.mechanic.count({ where: where as Record<string, unknown> })

  const mechanics = await prisma.mechanic.findMany({
    where: where as Record<string, unknown>,
    orderBy: { name: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mecânicos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os mecânicos da sua oficina</p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/mecanicos/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Mecânico
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome, especialidade ou telefone..." basePath={`/workspace/${tenantSlug}/mecanicos`} defaultValue={q} />
      </div>

      {mechanics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Wrench className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{q ? "Nenhum mecânico encontrado" : "Nenhum mecânico cadastrado"}</p>
          {!q && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/workspace/${tenantSlug}/mecanicos/novo`}>
                <Plus className="mr-2 size-4" />Cadastrar primeiro mecânico
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mechanics.map((m) => (
              <Link
                key={m.id}
                href={`/workspace/${tenantSlug}/mecanicos/${m.id}/editar`}
                className="group rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{m.name}</h3>
                  {!m.active && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">Inativo</span>
                  )}
                </div>
                {m.specialty && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Star className="size-3" />
                    {m.specialty}
                  </div>
                )}
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {m.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3" />{m.phone}
                    </p>
                  )}
                  {m.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3" />
                      <span className="truncate">{m.email}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/mecanicos`} searchParams={{ q }} />
        </>
      )}
    </div>
  )
}
