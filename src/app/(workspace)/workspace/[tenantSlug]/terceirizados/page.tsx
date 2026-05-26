import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma"
import Link from "next/link"
import { Plus, Phone, Mail, MapPin, Building2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ q?: string }>
}

const serviceLabels: Record<string, string> = {
  "funilaria": "Funilaria",
  "pintura": "Pintura",
  "retifica": "Retífica",
  "ar-condicionado": "Ar Condicionado",
  "eletrica": "Elétrica",
  "tapecaria": "Tapeçaria",
  "vidros": "Vidros",
  "suspensao": "Suspensão",
  "escapamento": "Escapamento",
  "borracharia": "Borracharia",
  "guincho": "Guincho",
}

export default async function PartnersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { q } = await searchParams
  const tenant = await getTenantContext(tenantSlug)

  const where: Prisma.PartnerWhereInput = { tenantId: tenant.id }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { serviceType: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
    ]
  }

  const partners = await prisma.partner.findMany({
    where,
    orderBy: { name: "asc" },
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Terceirizados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Empresas parceiras que prestam serviços externos para sua oficina
          </p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/terceirizados/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Terceirizado
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, serviço ou contato..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
      </form>

      {/* Partners grid */}
      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Building2 className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {q ? "Nenhum terceirizado encontrado" : "Nenhum terceirizado cadastrado"}
          </p>
          {!q && (
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/workspace/${tenantSlug}/terceirizados/novo`}>
                <Plus className="mr-2 size-4" />
                Cadastrar primeiro terceirizado
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <Link
              key={partner.id}
              href={`/workspace/${tenantSlug}/terceirizados/${partner.id}/editar`}
              className="group rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{partner.name}</h3>
                  {partner.serviceType && (
                    <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {serviceLabels[partner.serviceType] ?? partner.serviceType}
                    </span>
                  )}
                </div>
                <div className={`ml-3 size-2 rounded-full ${partner.active ? "bg-emerald-500" : "bg-zinc-300"}`} />
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {partner.contactName && (
                  <p className="flex items-center gap-2">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{partner.contactName}</span>
                  </p>
                )}
                {partner.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="size-3" />
                    {partner.phone}
                  </p>
                )}
                {partner.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="size-3" />
                    <span className="truncate">{partner.email}</span>
                  </p>
                )}
                {partner.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{partner.address}</span>
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
