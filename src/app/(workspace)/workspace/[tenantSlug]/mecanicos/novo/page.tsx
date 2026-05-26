import { MechanicForm } from "@/components/mechanics/mechanic-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function NewMechanicPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  return <MechanicForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
