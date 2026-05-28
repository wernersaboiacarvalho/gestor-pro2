import { FinancialForm } from "@/components/financeiro/financial-form"
import { DeleteButton } from "@/components/shared/delete-button"
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
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editando Lançamento</h1>
        <DeleteButton
          endpoint={`/api/financial-records/${id}`}
          label="o registro financeiro"
          redirectTo={`/workspace/${tenantSlug}/financeiro`}
        />
      </div>
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
    </>
  )
}
