import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/shared/search-input"
import { Pagination } from "@/components/shared/pagination"
import { ServiceOrderList } from "@/components/service-orders/list"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  return { title: `Ordens de Serviço - ${tenantSlug}` }
}

export default async function ServiceOrdersPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { tab, q, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 20
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

  const total = await prisma.serviceOrder.count({ where })

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      mechanic: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  // Counts for tabs
  const [budgetCount, osCount] = await Promise.all([
    prisma.serviceOrder.count({ where: { tenantId: tenant.id, type: "budget" } }),
    prisma.serviceOrder.count({ where: { tenantId: tenant.id, type: "service_order" } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

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

      <div className="mb-6">
        <SearchInput placeholder="Buscar por número, descrição ou placa..." basePath={`/workspace/${tenantSlug}/ordens-servico`} defaultValue={q} />
      </div>

      <ServiceOrderList orders={serializedOrders} tenantSlug={tenantSlug} />

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/workspace/${tenantSlug}/ordens-servico`} searchParams={{ q, tab }} />
    </div>
  )
}
