"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mechanicSchema, type MechanicInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface Props {
  tenantSlug: string
  tenantId: string
  defaultValues?: {
    id?: string
    name?: string
    email?: string | null
    phone?: string | null
    cpf?: string | null
    specialty?: string | null
    active?: boolean
  }
}

const specialties = [
  "Motor", "Suspensão", "Freios", "Elétrica", "Ar Condicionado",
  "Injeção Eletrônica", "Câmbio", "Funilaria", "Pintura", "Gerai",
]

export function MechanicForm({ tenantSlug, tenantId, defaultValues }: Props) {
  const router = useRouter()
  const isEditing = !!defaultValues?.id
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MechanicInput>({
    resolver: zodResolver(mechanicSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      cpf: defaultValues?.cpf ?? "",
      specialty: defaultValues?.specialty ?? "",
      active: defaultValues?.active ?? true,
    },
  })

  async function onSubmit(data: MechanicInput) {
    const url = isEditing
      ? `/api/mechanics/${defaultValues!.id}`
      : `/api/mechanics?tenantId=${tenantId}`

    const method = isEditing ? "PATCH" : "POST"

    const body = { ...data, email: data.email || undefined }

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

    router.push(`/workspace/${tenantSlug}/mecanicos`)
    router.refresh()
  }

  async function handleDelete() {
    if (!defaultValues?.id || !confirm("Tem certeza que deseja excluir este mecânico?")) return
    setDeleting(true)
    await fetch(`/api/mechanics/${defaultValues.id}`, { method: "DELETE" })
    router.push(`/workspace/${tenantSlug}/mecanicos`)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/mecanicos`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Mecânico" : "Novo Mecânico"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isEditing ? defaultValues?.name : "Cadastre um novo mecânico"}</p>
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
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dados do Mecânico</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input {...register("name")} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} type="email" className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input {...register("phone")} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <input {...register("cpf")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Especialidade</label>
              <select {...register("specialty")} className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900">
                <option value="">Selecione...</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("active")} className="rounded border-zinc-300" />
                <span className="text-sm font-medium">Ativo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/mecanicos`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
