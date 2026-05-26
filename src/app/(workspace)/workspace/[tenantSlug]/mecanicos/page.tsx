import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, Search, Wrench, Phone, Mail, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function MechanicsPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q } = await searchParams
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { specialty: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const mechanics = await prisma.mechanic.findMany({
    where: where as Record<string, unknown>,
    orderBy: { name: "asc" },
  })

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

      <form className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Buscar por nome, especialidade ou telefone..." className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      </form>

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
      )}
    </div>
  )
}
