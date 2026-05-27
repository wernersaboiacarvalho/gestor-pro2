import { FinancialForm } from "@/components/financeiro/financial-form"
import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import { notFound } from "next/navigation"

interface Props { params: Promise<{ tenantSlug: string; id: string }> }

export default async function EditFinancialPage({ params }: Props) {
  const { tenantSlug, id } = await params
  const tenant = await getTenantContext(tenantSlug)

  const record = await prisma.financialRecord.findUnique({ where: { id, tenantId: tenant.id } })
  if (!record) notFound()

  return (
    <FinancialForm
      tenantSlug={tenantSlug}
      tenantId={tenant.id}
      defaultValues={{
        id: record.id,
        type: record.type as "receivable" | "payable",
        description: record.description,
        value: Number(record.value),
        status: record.status as "pending" | "paid" | "cancelled",
        dueDate: record.dueDate.toISOString().split("T")[0],
        category: record.category ?? undefined,
      }}
    />
  )
}
