import { MechanicForm } from "@/components/mechanics/mechanic-form"
import { DeleteButton } from "@/components/shared/delete-button"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function EditMechanicPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const mechanic = await prisma.mechanic.findUnique({ where: { id, tenantId: tenant.id } })
  if (!mechanic) notFound()

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editando Mecânico</h1>
        <DeleteButton
          id={id}
          endpoint={`/api/mechanics/${id}`}
          label="o mecânico"
          redirectTo={`/workspace/${tenantSlug}/mecanicos`}
        />
      </div>
      <MechanicForm
        tenantSlug={tenantSlug}
        tenantId={tenant.id}
        defaultValues={{
          id: mechanic.id,
          name: mechanic.name,
          email: mechanic.email ?? undefined,
          phone: mechanic.phone ?? undefined,
          cpf: mechanic.cpf ?? undefined,
          specialty: mechanic.specialty ?? undefined,
          active: mechanic.active,
        }}
      />
    </>
  )
}
