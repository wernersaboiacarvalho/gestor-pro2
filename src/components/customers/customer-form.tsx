"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customerSchema, type CustomerInput } from "@/lib/validations/schemas"
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
    cpf?: string | null
    cnpj?: string | null
    phone?: string
    email?: string | null
    address?: string | null
    notes?: string | null
  }
}

export function CustomerForm({ tenantSlug, tenantId, defaultValues }: Props) {
  const router = useRouter()
  const isEditing = !!defaultValues?.id
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      cpf: defaultValues?.cpf ?? "",
      cnpj: defaultValues?.cnpj ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      address: defaultValues?.address ?? "",
      notes: defaultValues?.notes ?? "",
    },
  })

  async function onSubmit(data: CustomerInput) {
    const url = isEditing
      ? `/api/customers/${defaultValues!.id}`
      : `/api/customers?tenantId=${tenantId}`

    const method = isEditing ? "PATCH" : "POST"

    const body = { ...data, email: data.email || undefined, cpf: data.cpf || undefined, cnpj: data.cnpj || undefined }

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

    router.push(`/workspace/${tenantSlug}/clientes`)
    router.refresh()
  }

  async function handleDelete() {
    if (!defaultValues?.id || !confirm("Tem certeza que deseja excluir este cliente?")) return
    setDeleting(true)
    await fetch(`/api/customers/${defaultValues.id}`, { method: "DELETE" })
    router.push(`/workspace/${tenantSlug}/clientes`)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/workspace/${tenantSlug}/clientes`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Editar Cliente" : "Novo Cliente"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isEditing ? defaultValues?.name : "Cadastre um novo cliente"}</p>
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dados do Cliente</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input {...register("name")} className="w-full rounded-lg border px-3 py-2 text-sm" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <input {...register("cpf")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input {...register("cnpj")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone *</label>
              <input {...register("phone")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="(11) 99999-9999" />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} type="email" className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input {...register("address")} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea {...register("notes")} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 size-4" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/workspace/${tenantSlug}/clientes`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
