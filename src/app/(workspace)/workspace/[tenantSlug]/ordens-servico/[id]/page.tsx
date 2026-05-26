import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { ServiceOrderDetail } from "@/components/service-orders/detail"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ tenantSlug: string; id: string }>
}

export default async function ServiceOrderDetailPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const order = await prisma.serviceOrder.findUnique({
    where: { id, tenantId: tenant.id },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true, year: true, color: true } },
      mechanic: { select: { id: true, name: true } },
      items: true,
    },
  })

  if (!order) notFound()

  const serialized = {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    approvedAt: order.approvedAt?.toISOString() ?? null,
    startedAt: order.startedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    totalValue: Number(order.totalValue),
    discount: Number(order.discount),
    vehicle: { plate: order.vehicle.plate, brand: order.vehicle.brand, model: order.vehicle.model, year: order.vehicle.year, color: order.vehicle.color ?? null },
    mechanic: order.mechanic ? { id: order.mechanic.id, name: order.mechanic.name } : null,
    items: order.items.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitValue: Number(item.unitValue),
      totalValue: Number(item.totalValue),
    })),
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href={`/workspace/${tenantSlug}/ordens-servico${order.type === "service_order" ? "?tab=os" : ""}`}>
            <ArrowLeft className="mr-1 size-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <ServiceOrderDetail order={serialized} tenantSlug={tenantSlug} />
    </div>
  )
}
