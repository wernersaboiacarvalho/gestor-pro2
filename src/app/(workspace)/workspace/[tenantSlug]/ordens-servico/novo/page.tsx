import { BudgetForm } from "@/components/service-orders/budget-form"
import { getTenantContext } from "@/lib/auth/tenant-context"

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function NewBudgetPage({ params }: Props) {
  const { tenantSlug } = await params
  const tenant = await getTenantContext(tenantSlug)

  return <BudgetForm tenantSlug={tenantSlug} tenantId={tenant.id} />
}
