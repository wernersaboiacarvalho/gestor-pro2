"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { vehicleSchema, type VehicleInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Props {
  tenantSlug: string
  tenantId: string
  defaultValues?: {
    id?: string
    customerId?: string
    plate?: string
    brand?: string
    model?: string
    year?: number
    color?: string
    notes?: string
  }
}

export function VehicleForm({ tenantSlug, tenantId, defaultValues }: Props) {
  const router = useRouter()
  const isEditing = !!defaultValues?.id
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      customerId: defaultValues?.customerId ?? "",
      plate: defaultValues?.plate ?? "",
      brand: defaultValues?.brand ?? "",
      model: defaultValues?.model ?? "",
      year: defaultValues?.year ?? new Date().getFullYear(),
      color: defaultValues?.color ?? "",
      notes: defaultValues?.notes ?? "",
    },
  })

  useEffect(() => {
    fetch(`/api/customers?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then(setCustomers)
      .catch((err) => console.error("[vehicle-form] customers", err))
  }, [tenantId])

  async function onSubmit(data: VehicleInput) {
    try {
      const url = isEditing
        ? `/api/vehicles/${defaultValues!.id}`
        : `/api/vehicles?tenantId=${tenantId}`

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

      toast.success(isEditing ? "Veículo atualizado com sucesso!" : "Veículo criado com sucesso!")
      router.push(`/workspace/${tenantSlug}/veiculos`)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar veículo")
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/veiculos`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Veículo" : "Novo Veículo"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing ? `${defaultValues?.brand} ${defaultValues?.model}` : "Cadastre um novo veículo"}
            </p>
          </div>
        </div>
      </div>

      {errors.root && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dados do Veículo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <select {...register("customerId")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customerId && <p className="text-sm text-red-500 mt-1">{errors.customerId.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Placa *</label>
              <input {...register("plate")} className="w-full rounded-lg border px-3 py-2 text-sm font-mono uppercase" placeholder="ABC1A23" maxLength={7} />
              {errors.plate && <p className="text-sm text-red-500 mt-1">{errors.plate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marca *</label>
              <input {...register("brand")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Chevrolet, Volkswagen..." />
              {errors.brand && <p className="text-sm text-red-500 mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo *</label>
              <input {...register("model")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Onix, Gol..." />
              {errors.model && <p className="text-sm text-red-500 mt-1">{errors.model.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ano *</label>
              <input type="number" {...register("year", { valueAsNumber: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cor</label>
              <input {...register("color")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Preto, Branco..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea {...register("notes")} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/veiculos`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
