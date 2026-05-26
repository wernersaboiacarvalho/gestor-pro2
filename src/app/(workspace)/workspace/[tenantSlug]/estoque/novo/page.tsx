import { InventoryForm } from "@/components/inventory/inventory-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function NewInventoryPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  return <InventoryForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
