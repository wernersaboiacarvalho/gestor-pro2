import { PartnerForm } from "@/components/partners/partner-form"
import { DeleteButton } from "@/components/shared/delete-button"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ tenantSlug: string; partnerId: string }>
}

export default async function EditPartnerPage({ params }: Props) {
  const { tenantSlug, partnerId } = await params
  const tenant = await getTenantContext(tenantSlug)

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId, tenantId: tenant.id },
  })

  if (!partner) notFound()

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editando Terceirizado</h1>
        <DeleteButton
          endpoint={`/api/partners/${partnerId}`}
          label="o terceirizado"
          redirectTo={`/workspace/${tenantSlug}/terceirizados`}
        />
      </div>
      <PartnerForm
        partner={{
          id: partner.id,
          name: partner.name,
          cnpj: partner.cnpj,
          phone: partner.phone,
          email: partner.email,
          contactName: partner.contactName,
          serviceType: partner.serviceType,
          address: partner.address,
          notes: partner.notes,
          active: partner.active,
        }}
        tenantSlug={tenantSlug}
        tenantId={tenant.id}
      />
    </>
  )
}
