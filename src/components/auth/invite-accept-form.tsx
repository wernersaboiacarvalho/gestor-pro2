"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { inviteAcceptSchema, type InviteAcceptInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { acceptInviteAction } from "@/app/invite/[token]/actions"

interface Props {
  token: string
  invite: { email: string; role: string; tenantName: string }
}

export function InviteAcceptForm({ token, invite }: Props) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteAcceptInput>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: { token },
  })

  const password = watch("password")

  async function onSubmit(data: InviteAcceptInput) {
    const result = await acceptInviteAction(data)
    if (!result.success) {
      setError("root", { message: result.error ?? "Erro ao aceitar convite" })
      return
    }
    router.push(`/login?invite=accepted`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Aceitar Convite</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Você foi convidado para <strong>{invite.tenantName}</strong> como <strong>{invite.role === "admin" ? "Administrador" : "Usuário"}</strong>
        </p>
        <p className="text-xs text-zinc-400 mt-1">{invite.email}</p>
      </div>

      {errors.root && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600">{errors.root.message}</div>
      )}

      <input type="hidden" {...register("token")} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Seu Nome</label>
        <input id="name" {...register("name")} className="w-full rounded-lg border px-3 py-2 text-sm" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Senha</label>
        <input id="password" type="password" {...register("password")} className="w-full rounded-lg border px-3 py-2 text-sm" />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
        <PasswordStrengthIndicator password={password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirmar Senha</label>
        <input id="confirmPassword" type="password" {...register("confirmPassword")} className="w-full rounded-lg border px-3 py-2 text-sm" />
        {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta..." : "Aceitar Convite"}
      </Button>
    </form>
  )
}
