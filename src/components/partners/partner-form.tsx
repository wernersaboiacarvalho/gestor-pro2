"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { partnerSchema, type PartnerInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Partner {
  id?: string
  name?: string
  cnpj?: string | null
  phone?: string | null
  email?: string | null
  contactName?: string | null
  serviceType?: string | null
  address?: string | null
  notes?: string | null
  active?: boolean
}

interface Props {
  partner?: Partner
  tenantSlug: string
  tenantId: string
}

const serviceOptions = [
  { value: "", label: "Selecione..." },
  { value: "funilaria", label: "Funilaria" },
  { value: "pintura", label: "Pintura" },
  { value: "retifica", label: "Retífica" },
  { value: "ar-condicionado", label: "Ar Condicionado" },
  { value: "eletrica", label: "Elétrica" },
  { value: "tapecaria", label: "Tapeçaria" },
  { value: "vidros", label: "Vidros" },
  { value: "suspensao", label: "Suspensão" },
  { value: "escapamento", label: "Escapamento" },
  { value: "borracharia", label: "Borracharia" },
  { value: "guincho", label: "Guincho" },
  { value: "outro", label: "Outro" },
]

export function PartnerForm({ partner, tenantSlug, tenantId }: Props) {
  const router = useRouter()
  const isEditing = !!partner?.id

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartnerInput>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: partner?.name ?? "",
      cnpj: partner?.cnpj ?? "",
      phone: partner?.phone ?? "",
      email: partner?.email ?? "",
      contactName: partner?.contactName ?? "",
      serviceType: partner?.serviceType ?? "",
      address: partner?.address ?? "",
      notes: partner?.notes ?? "",
      active: partner?.active ?? true,
    },
  })

  async function onSubmit(data: PartnerInput) {
    try {
      const url = isEditing
        ? `/api/partners/${partner!.id}`
        : `/api/partners?tenantId=${tenantId}`

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

      toast.success(isEditing ? "Terceirizado atualizado com sucesso!" : "Terceirizado criado com sucesso!")
      router.push(`/workspace/${tenantSlug}/terceirizados`)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar terceirizado")
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/terceirizados`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Terceirizado" : "Novo Terceirizado"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing ? partner?.name : "Cadastre uma empresa parceira"}
            </p>
          </div>
        </div>
      </div>

      {errors.root && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informações da Empresa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome da Empresa *</label>
              <input {...register("name")} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input {...register("cnpj")} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Serviço</label>
              <select {...register("serviceType")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                {serviceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input {...register("phone")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="(11) 99999-9999" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} type="email" className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pessoa de Contato</label>
              <input {...register("contactName")} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input {...register("address")} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea {...register("notes")} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" {...register("active")} className="size-4 rounded border-zinc-300" />
              <label htmlFor="active" className="text-sm font-medium">Ativo</label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/terceirizados`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
