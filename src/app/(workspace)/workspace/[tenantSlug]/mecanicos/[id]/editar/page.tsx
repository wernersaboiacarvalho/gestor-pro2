import { MechanicForm } from "@/components/mechanics/mechanic-form"
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
  )
}
