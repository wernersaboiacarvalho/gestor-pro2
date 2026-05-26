import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceOrderList } from "@/components/service-orders/list"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ tab?: string; q?: string }>
}

export default async function ServiceOrdersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { tab, q } = await searchParams
  const tenant = await getTenantContext(tenantSlug)
  const activeTab = tab === "os" ? "service_order" : "budget"

  const where: Prisma.ServiceOrderWhereInput = { tenantId: tenant.id, type: activeTab as "budget" | "service_order" }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { vehicle: { plate: { contains: q, mode: "insensitive" } } },
    ]
  }

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      mechanic: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Counts for tabs
  const [budgetCount, osCount] = await Promise.all([
    prisma.serviceOrder.count({ where: { tenantId: tenant.id, type: "budget" } }),
    prisma.serviceOrder.count({ where: { tenantId: tenant.id, type: "service_order" } }),
  ])

  const serializedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    type: o.type,
    status: o.status,
    description: o.description,
    totalValue: Number(o.totalValue),
    discount: Number(o.discount),
    createdAt: o.createdAt.toISOString(),
    vehicle: o.vehicle,
    mechanic: o.mechanic,
    _count: o._count,
  }))

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie orçamentos e ordens de serviço
          </p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${tenantSlug}/ordens-servico/novo`}>
            <Plus className="mr-2 size-4" />
            Novo Orçamento
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 w-fit">
        <Link
          href={`/workspace/${tenantSlug}/ordens-servico`}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "budget"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          }`}
        >
          Orçamentos ({budgetCount})
        </Link>
        <Link
          href={`/workspace/${tenantSlug}/ordens-servico?tab=os`}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "service_order"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          }`}
        >
          Ordens de Serviço ({osCount})
        </Link>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por número, descrição ou placa..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
          {q && <input type="hidden" name="tab" value={tab ?? ""} />}
        </div>
      </form>

      <ServiceOrderList orders={serializedOrders} tenantSlug={tenantSlug} />
    </div>
  )
}
