import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { DeleteButton } from "@/components/shared/delete-button"
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
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editando Veículo</h1>
        <DeleteButton
          id={id}
          endpoint={`/api/vehicles/${id}`}
          label="o veículo"
          redirectTo={`/workspace/${tenantSlug}/veiculos`}
        />
      </div>
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
    </>
  )
}
