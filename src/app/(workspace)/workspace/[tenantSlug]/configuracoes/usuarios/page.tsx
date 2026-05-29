"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  getTenantUsers, getPendingInvites, inviteUserAction,
  cancelInviteAction, changeUserRoleAction, deactivateUserAction,
} from "./actions"

interface UserInfo { id: string; name: string; email: string; role: string; createdAt: Date }
interface InviteInfo { id: string; email: string; role: string; expiresAt: Date; inviter: { name: string } | null }

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [invites, setInvites] = useState<InviteInfo[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function load() {
    const [r1, r2] = await Promise.all([getTenantUsers(), getPendingInvites()])
    if (r1.data) setUsers(r1.data)
    if (r2.data) setInvites(r2.data as unknown as InviteInfo[])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  async function handleInvite() {
    if (!inviteEmail) return
    setLoading(true)
    setError("")
    const result = await inviteUserAction(inviteEmail, inviteRole)
    if (result.success) {
      setShowInvite(false)
      setInviteEmail("")
      load()
    } else {
      setError(result.error ?? "Erro")
    }
    setLoading(false)
  }

  async function handleCancel(inviteId: string) {
    await cancelInviteAction(inviteId)
    load()
  }

  async function handleRoleChange(userId: string, role: "admin" | "user") {
    await changeUserRoleAction(userId, role)
    load()
  }

  async function handleDeactivate(userId: string) {
    await deactivateUserAction(userId)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <Button onClick={() => setShowInvite(!showInvite)}>
          {showInvite ? "Cancelar" : "Convidar Usuário"}
        </Button>
      </div>

      {showInvite && (
        <div className="mb-6 rounded-lg border bg-white dark:bg-zinc-900 p-4 max-w-md">
          <h3 className="text-sm font-semibold mb-3">Novo Convite</h3>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="colaborador@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Cargo</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "user")}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <Button onClick={handleInvite} disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="rounded-lg border bg-white dark:bg-zinc-900">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Usuários Ativos ({users.length})</p>
        </div>
        <div className="divide-y">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">
                  {u.role === "admin" ? "Admin" : "Usuário"}
                </span>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as "admin" | "user")}
                  className="text-xs rounded border px-1 py-0.5 bg-white dark:bg-zinc-900"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-600"
                  onClick={() => handleDeactivate(u.id)}
                >
                  Desativar
                </Button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-8">Nenhum usuário</p>
          )}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mt-6 rounded-lg border bg-white dark:bg-zinc-900">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">Convites Pendentes ({invites.length})</p>
          </div>
          <div className="divide-y">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm">{inv.email}</p>
                  <p className="text-xs text-zinc-500">
                    {inv.role === "admin" ? "Admin" : "Usuário"} · Convite expira {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-600"
                  onClick={() => handleCancel(inv.id)}
                >
                  Cancelar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
