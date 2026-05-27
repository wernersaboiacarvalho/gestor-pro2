"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Save, Building2, User } from "lucide-react"
import { tenantSchema } from "@/lib/validations/schemas"

interface Props {
  tenant: { id: string; name: string; businessType: string }
  user: { name: string; email: string }
}

export function SettingsForm({ tenant, user }: Props) {
  const router = useRouter()

  const [tenantName, setTenantName] = useState(tenant.name)
  const [businessType, setBusinessType] = useState(tenant.businessType)
  const [tenantSaving, setTenantSaving] = useState(false)
  const [tenantMsg, setTenantMsg] = useState("")

  const [userName, setUserName] = useState(user.name)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [userSaving, setUserSaving] = useState(false)
  const [userMsg, setUserMsg] = useState("")

  async function saveTenant(e: React.FormEvent) {
    e.preventDefault()
    setTenantSaving(true)
    setTenantMsg("")

    const parsed = tenantSchema.partial().safeParse({ name: tenantName, businessType })
    if (!parsed.success) { setTenantMsg(parsed.error.issues[0].message); setTenantSaving(false); return }

    const res = await fetch(`/api/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tenantName, businessType }),
    })

    if (!res.ok) { const j = await res.json(); setTenantMsg(j.error ?? "Erro"); setTenantSaving(false); return }
    setTenantMsg("Salvo com sucesso!")
    setTenantSaving(false)
    router.refresh()
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault()
    setUserSaving(true)
    setUserMsg("")

    const body: Record<string, string> = { name: userName }
    if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword }

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) { const j = await res.json(); setUserMsg(j.error ?? "Erro"); setUserSaving(false); return }
    setUserMsg("Salvo com sucesso!")
    setCurrentPassword("")
    setNewPassword("")
    setUserSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Workspace Settings */}
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Dados da Oficina</h2>
        </div>

        <form onSubmit={saveTenant} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Oficina</label>
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Negócio</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900"
            >
              <option value="workshop">Oficina Mecânica</option>
              <option value="salon">Salão de Beleza</option>
              <option value="gym">Academia</option>
            </select>
          </div>
          {tenantMsg && (
            <p className={`text-sm ${tenantMsg === "Salvo com sucesso!" ? "text-green-600" : "text-red-600"}`}>
              {tenantMsg}
            </p>
          )}
          <Button type="submit" disabled={tenantSaving}>
            <Save className="mr-2 size-4" />
            {tenantSaving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </div>

      {/* User Profile */}
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <User className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Meu Perfil</h2>
        </div>

        <form onSubmit={saveUser} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={user.email} disabled className="w-full rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-800" />
          </div>
          <hr className="border-zinc-200 dark:border-zinc-700" />
          <p className="text-xs text-muted-foreground">Alterar senha (deixe em branco para manter)</p>
          <div>
            <label className="block text-sm font-medium mb-1">Senha Atual</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nova Senha</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
          {userMsg && (
            <p className={`text-sm ${userMsg === "Salvo com sucesso!" ? "text-green-600" : "text-red-600"}`}>
              {userMsg}
            </p>
          )}
          <Button type="submit" disabled={userSaving}>
            <Save className="mr-2 size-4" />
            {userSaving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
