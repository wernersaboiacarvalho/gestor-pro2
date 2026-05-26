import { SupplierForm } from "@/components/suppliers/supplier-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function NewSupplierPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  return <SupplierForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
