import { CustomerForm } from "@/components/customers/customer-form"
import { DeleteButton } from "@/components/shared/delete-button"
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
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editando Cliente</h1>
        <DeleteButton
          endpoint={`/api/customers/${id}`}
          label="o cliente"
          redirectTo={`/workspace/${tenantSlug}/clientes`}
        />
      </div>
      <CustomerForm
        tenantSlug={tenantSlug}
        tenantId={tenant.id}
        defaultValues={{
          id: customer.id,
          name: customer.name,
          cpf: customer.cpf ?? undefined,
          cnpj: customer.cnpj ?? undefined,
          phone: customer.phone,
          email: customer.email ?? undefined,
          address: customer.address ?? undefined,
          notes: customer.notes ?? undefined,
        }}
      />
    </>
  )
}
