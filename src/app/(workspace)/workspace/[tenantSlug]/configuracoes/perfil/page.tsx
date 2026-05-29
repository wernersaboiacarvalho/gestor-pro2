"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { changePasswordAction } from "./actions"

export default function ProfilePage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPassword = watch("newPassword")

  async function onSubmit(data: ChangePasswordInput) {
    const result = await changePasswordAction(data.currentPassword, data.newPassword, data.confirmPassword)
    if (!result.success) {
      setError("root", { message: result.error ?? "Erro ao alterar senha" })
      return
    }
    router.push("/login?passwordChanged=true")
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-8">Perfil</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alterar Senha</h2>

        {errors.root && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600">{errors.root.message}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Senha Atual</label>
          <input type="password" {...register("currentPassword")} className="w-full rounded-lg border px-3 py-2 text-sm" />
          {errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nova Senha</label>
          <input type="password" {...register("newPassword")} className="w-full rounded-lg border px-3 py-2 text-sm" />
          {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword.message}</p>}
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
          <input type="password" {...register("confirmPassword")} className="w-full rounded-lg border px-3 py-2 text-sm" />
          {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Alterando..." : "Alterar Senha"}
        </Button>
      </form>
    </div>
  )
}
