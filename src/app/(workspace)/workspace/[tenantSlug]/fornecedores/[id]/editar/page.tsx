import { SupplierForm } from "@/components/suppliers/supplier-form"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function EditSupplierPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const supplier = await prisma.supplier.findUnique({ where: { id, tenantId: tenant.id } })
  if (!supplier) notFound()

  return (
    <SupplierForm
      tenantSlug={tenantSlug}
      tenantId={tenant.id}
      defaultValues={{
        id: supplier.id,
        name: supplier.name,
        cnpj: supplier.cnpj ?? undefined,
        phone: supplier.phone ?? undefined,
        email: supplier.email ?? undefined,
        address: supplier.address ?? undefined,
        notes: supplier.notes ?? undefined,
      }}
    />
  )
}
