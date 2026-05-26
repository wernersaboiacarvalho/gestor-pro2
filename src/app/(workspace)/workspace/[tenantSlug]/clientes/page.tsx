import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { Plus, Search, Users, Phone, Mail, Car } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function CustomersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q } = await searchParams
  const tenant = await getTenantContext(tenantSlug)

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where: where as Record<string, unknown>,
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: "asc" },
  })

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

      <form className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Buscar por nome, CPF ou telefone..." className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      </form>

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
      )}
    </div>
  )
}
