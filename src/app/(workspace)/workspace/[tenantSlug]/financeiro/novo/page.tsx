import { FinancialForm } from "@/components/financeiro/financial-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function NewFinancialPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)
  return <FinancialForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
