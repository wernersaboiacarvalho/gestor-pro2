import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function NewVehiclePage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  return <VehicleForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
