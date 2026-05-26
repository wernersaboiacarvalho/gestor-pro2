import { CustomerForm } from "@/components/customers/customer-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function NewCustomerPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  return <CustomerForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
