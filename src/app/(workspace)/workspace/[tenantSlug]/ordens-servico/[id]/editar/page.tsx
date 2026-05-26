import { BudgetForm } from "@/components/service-orders/budget-form"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ tenantSlug: string; id: string }>
}

export default async function EditBudgetPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const order = await prisma.serviceOrder.findUnique({
    where: { id, tenantId: tenant.id, type: "budget", status: "draft" },
    include: { items: true },
  })

  if (!order) notFound()

  return (
    <BudgetForm
      tenantSlug={tenantSlug}
      tenantId={tenant.id}
      defaultValues={{
        id: order.id,
        vehicleId: order.vehicleId,
        mechanicId: order.mechanicId,
        description: order.description,
        notes: order.notes ?? undefined,
        discount: Number(order.discount),
        items: order.items.map((i) => ({
          type: i.type as "service" | "part",
          description: i.description,
          quantity: i.quantity,
          unitValue: Number(i.unitValue),
        })),
      }}
    />
  )
}
