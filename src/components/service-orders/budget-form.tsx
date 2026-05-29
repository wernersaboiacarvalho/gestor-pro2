"use client"
"use no memo"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { serviceOrderSchema, type ServiceOrderInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Props {
  tenantSlug: string
  tenantId: string
  defaultValues?: {
    id?: string
    vehicleId?: string
    mechanicId?: string | null
    description?: string
    notes?: string
    discount?: number
    items?: { type: "service" | "part"; description: string; quantity: number; unitValue: number; partnerId?: string | null; partnerCost?: number }[]
  }
}

export function BudgetForm({ tenantSlug, tenantId, defaultValues }: Props) {
  const router = useRouter()
  const isEditing = !!defaultValues?.id
  const [vehicles, setVehicles] = useState<{ id: string; plate: string; brand: string; model: string }[]>([])
  const [mechanics, setMechanics] = useState<{ id: string; name: string }[]>([])
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceOrderInput>({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: {
      vehicleId: defaultValues?.vehicleId ?? "",
      mechanicId: defaultValues?.mechanicId ?? null,
      description: defaultValues?.description ?? "",
      notes: defaultValues?.notes ?? "",
      discount: defaultValues?.discount ?? 0,
      items: defaultValues?.items?.length ? defaultValues.items.map(i => ({ ...i, partnerId: i.partnerId ?? null, partnerCost: i.partnerCost ?? undefined })) : [{ type: "service" as const, description: "", quantity: 1, unitValue: 0, partnerId: null, partnerCost: undefined }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  useEffect(() => {
    if (tenantId) {
      fetch(`/api/vehicles?tenantId=${tenantId}`)
        .then((r) => r.json())
        .then(setVehicles)
        .catch((err) => console.error("[budget-form] vehicles", err))

      fetch(`/api/users?tenantId=${tenantId}&role=mechanic`)
        .then((r) => r.json())
        .then(setMechanics)
        .catch((err) => console.error("[budget-form] mechanics", err))
      fetch(`/api/partners?tenantId=${tenantId}`)
        .then((r) => r.json())
        .then(setPartners)
        .catch((err) => console.error("[budget-form] partners", err))
    }
  }, [tenantId])

  async function onSubmit(data: ServiceOrderInput) {
    try {
      const url = isEditing
        ? `/api/service-orders/${defaultValues!.id}`
        : `/api/service-orders?tenantId=${tenantId}`

      const method = isEditing ? "PATCH" : "POST"

      const payload = {
        ...data,
        ...(isEditing ? {} : {}), // items are managed separately via PATCH
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json()
        setError("root", { message: json.error ?? "Erro ao salvar" })
        return
      }

      const result = await res.json()
      toast.success(isEditing ? "Ordem de serviço atualizada com sucesso!" : "Ordem de serviço criada com sucesso!")
      router.push(`/workspace/${tenantSlug}/ordens-servico/${result.id}`)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar ordem de serviço")
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/ordens-servico`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
            </h1>
          </div>
        </div>
      </div>

      {errors.root && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Vehicle and description */}
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Veículo *</label>
              <select {...register("vehicleId")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Selecione um veículo...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
              {errors.vehicleId && <p className="text-sm text-red-500 mt-1">{errors.vehicleId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mecânico</label>
              <select {...register("mechanicId")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Não atribuído</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição do serviço *</label>
              <textarea {...register("description")} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Descreva o problema ou serviço a ser realizado..." />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Desconto (R$)</label>
              <input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea {...register("notes")} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold text-sm">Itens do Orçamento</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ type: "service" as const, description: "", quantity: 1, unitValue: 0, partnerId: null, partnerCost: undefined })}
            >
              <Plus className="mr-1 size-3.5" />
              Adicionar Item
            </Button>
          </div>

          <div className="divide-y">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 p-4 sm:grid-cols-12 items-start">
                <div className="sm:col-span-1">
                  <select {...register(`items.${index}.type`)} className="w-full rounded-lg border px-2 py-1.5 text-xs bg-white dark:bg-zinc-900">
                    <option value="service">Serviço</option>
                    <option value="part">Peça</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <input {...register(`items.${index}.description`)} placeholder="Descrição" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
                </div>
                <div className="sm:col-span-1">
                  <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} placeholder="Qtd" className="w-full rounded-lg border px-2 py-1.5 text-sm text-center" />
                </div>
                <div className="sm:col-span-1">
                  <input type="number" step="0.01" {...register(`items.${index}.unitValue`, { valueAsNumber: true })} placeholder="R$" className="w-full rounded-lg border px-2 py-1.5 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <select {...register(`items.${index}.partnerId`)} className="w-full rounded-lg border px-2 py-1.5 text-xs bg-white dark:bg-zinc-900">
                    <option value="">Sem terceirizado</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <input type="number" step="0.01" {...register(`items.${index}.partnerCost`, { valueAsNumber: true })} placeholder="Custo" className="w-full rounded-lg border px-2 py-1.5 text-xs" />
                </div>
                <div className="sm:col-span-2">
                  <p className="py-1.5 text-sm font-semibold tabular-nums text-right">
                    {(Number(watch(`items.${index}.quantity`) ?? 0) * Number(watch(`items.${index}.unitValue`) ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button type="button" onClick={() => { if (fields.length > 1) remove(index) }} className="rounded p-1 text-zinc-400 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {fields.length > 0 && (
            <div className="border-t px-6 py-3 text-right">
              <span className="text-sm text-muted-foreground mr-4">Total:</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {fields.reduce((sum, _, i) => sum + (Number(watch(`items.${i}.quantity`) ?? 0) * Number(watch(`items.${i}.unitValue`) ?? 0)), 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar Orçamento"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/ordens-servico`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
