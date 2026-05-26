import { PartnerForm } from "@/components/partners/partner-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function NewPartnerPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)

  return <PartnerForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
