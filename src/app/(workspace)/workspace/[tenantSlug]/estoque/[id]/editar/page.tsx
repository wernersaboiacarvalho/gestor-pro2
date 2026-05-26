import { InventoryForm } from "@/components/inventory/inventory-form"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function EditInventoryPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const item = await prisma.inventoryItem.findUnique({ where: { id, tenantId: tenant.id } })
  if (!item) notFound()

  return (
    <InventoryForm
      tenantSlug={tenantSlug}
      tenantId={tenant.id}
      defaultValues={{
        id: item.id,
        name: item.name,
        sku: item.sku ?? undefined,
        description: item.description ?? undefined,
        category: item.category ?? undefined,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unitPrice: Number(item.unitPrice),
        costPrice: Number(item.costPrice),
        supplierId: item.supplierId ?? undefined,
      }}
    />
  )
}
