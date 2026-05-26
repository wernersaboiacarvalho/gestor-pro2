import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function EditVehiclePage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const vehicle = await prisma.vehicle.findUnique({ where: { id, tenantId: tenant.id } })
  if (!vehicle) notFound()

  return (
    <VehicleForm
      tenantSlug={tenantSlug}
      tenantId={tenant.id}
      defaultValues={{
        id: vehicle.id,
        customerId: vehicle.customerId,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color ?? undefined,
        notes: vehicle.notes ?? undefined,
      }}
    />
  )
}
