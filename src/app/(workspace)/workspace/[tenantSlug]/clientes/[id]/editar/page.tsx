import { CustomerForm } from "@/components/customers/customer-form"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function EditCustomerPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const customer = await prisma.customer.findUnique({ where: { id, tenantId: tenant.id } })
  if (!customer) notFound()

  return (
    <CustomerForm
      tenantSlug={tenantSlug}
      tenantId={tenant.id}
      defaultValues={{
        id: customer.id,
        name: customer.name,
        cpf: customer.cpf,
        cnpj: customer.cnpj,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
      }}
    />
  )
}
