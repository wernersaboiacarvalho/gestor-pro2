"use client"
"use no memo"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { financialRecordSchema, type FinancialRecordInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Props {
  tenantSlug: string
  tenantId: string
  defaultValues?: {
    id?: string
    type?: "receivable" | "payable"
    description?: string
    value?: number
    status?: "pending" | "paid" | "cancelled"
    dueDate?: string
    category?: string | null
  }
}

const categories = [
  "Serviços", "Peças", "Mão de Obra", "Aluguel", "Água", "Luz",
  "Telefone", "Salários", "Impostos", "Material de Escritório",
  "Ferramentas", "Terceirizados", "Marketing", "Outros",
]

export function FinancialForm({ tenantSlug, tenantId, defaultValues }: Props) {
  const router = useRouter()
  const isEditing = !!defaultValues?.id

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FinancialRecordInput>({
    resolver: zodResolver(financialRecordSchema),
    defaultValues: {
      type: defaultValues?.type ?? "receivable",
      description: defaultValues?.description ?? "",
      value: defaultValues?.value ?? 0,
      status: defaultValues?.status ?? "pending",
      dueDate: defaultValues?.dueDate ?? "",
      category: defaultValues?.category ?? "",
    },
  })

  const selectedType = useWatch({ control, name: "type" })

  async function onSubmit(data: FinancialRecordInput) {
    try {
      const url = isEditing
        ? `/api/financial-records/${defaultValues!.id}`
        : `/api/financial-records?tenantId=${tenantId}`
      const method = isEditing ? "PATCH" : "POST"
      const body = { ...data, category: data.category || undefined, serviceOrderId: undefined }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        setError("root", { message: json.error ?? "Erro ao salvar" })
        return
      }

      toast.success(isEditing ? "Registro financeiro atualizado com sucesso!" : "Registro financeiro criado com sucesso!")
      router.push(`/workspace/${tenantSlug}/financeiro`)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar registro financeiro")
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/workspace/${tenantSlug}/financeiro`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Lançamento" : "Novo Lançamento"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedType === "receivable" ? "Conta a receber" : "Conta a pagar"}
          </p>
        </div>
      </div>

      {errors.root && <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.root.message}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dados do Lançamento</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select {...register("type")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="receivable">A Receber</option>
                <option value="payable">A Pagar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select {...register("status")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <input {...register("description")} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" {...register("value", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.value && <p className="text-sm text-red-500 mt-1">{errors.value.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vencimento *</label>
              <input type="date" {...register("dueDate")} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.dueDate && <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select {...register("category")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Selecione...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/financeiro`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
