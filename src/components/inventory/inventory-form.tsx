"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { inventorySchema, type InventoryInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Props {
  tenantSlug: string
  tenantId: string
  defaultValues?: {
    id?: string
    name?: string
    sku?: string | null
    description?: string | null
    category?: string | null
    quantity?: number
    minQuantity?: number
    unitPrice?: number
    costPrice?: number
    supplierId?: string | null
  }
}

const categories = [
  "Filtros", "Óleos e Lubrificantes", "Pastilhas de Freio", "Correias",
  "Velas", "Baterias", "Lâmpadas", "Suspensão", "Escapamento",
  "Sistema Elétrico", "Arrefecimento", "Embreagem", "Outros",
]

export function InventoryForm({ tenantSlug, tenantId, defaultValues }: Props) {
  const router = useRouter()
  const isEditing = !!defaultValues?.id
  const [deleting, setDeleting] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InventoryInput>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      sku: defaultValues?.sku ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "",
      quantity: defaultValues?.quantity ?? 0,
      minQuantity: defaultValues?.minQuantity ?? 0,
      unitPrice: defaultValues?.unitPrice ?? 0,
      costPrice: defaultValues?.costPrice ?? 0,
      supplierId: defaultValues?.supplierId ?? null,
    },
  })

  useEffect(() => {
    fetch(`/api/suppliers?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {})
  }, [tenantId])

  async function onSubmit(data: InventoryInput) {
    const url = isEditing
      ? `/api/inventory/${defaultValues!.id}`
      : `/api/inventory?tenantId=${tenantId}`
    const method = isEditing ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json()
      setError("root", { message: json.error ?? "Erro ao salvar" })
      return
    }

    router.push(`/workspace/${tenantSlug}/estoque`)
    router.refresh()
  }

  async function handleDelete() {
    if (!defaultValues?.id || !confirm("Tem certeza que deseja excluir este item?")) return
    setDeleting(true)
    await fetch(`/api/inventory/${defaultValues.id}`, { method: "DELETE" })
    router.push(`/workspace/${tenantSlug}/estoque`)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/estoque`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Item" : "Novo Item"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isEditing ? defaultValues?.name : "Cadastre um novo item no estoque"}</p>
          </div>
        </div>
        {isEditing && (
          <Button variant="ghost" className="text-red-600" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 size-4" />
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        )}
      </div>

      {errors.root && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dados do Item</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input {...register("name")} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU / Código</label>
              <input {...register("sku")} className="w-full rounded-lg border px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select {...register("category")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Selecione...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantidade</label>
              <input type="number" {...register("quantity", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantidade Mínima</label>
              <input type="number" {...register("minQuantity", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço de Venda (R$)</label>
              <input type="number" step="0.01" {...register("unitPrice", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.unitPrice && <p className="text-sm text-red-500 mt-1">{errors.unitPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço de Custo (R$)</label>
              <input type="number" step="0.01" {...register("costPrice", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Fornecedor</label>
              <select {...register("supplierId")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Nenhum</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea {...register("description")} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/estoque`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
