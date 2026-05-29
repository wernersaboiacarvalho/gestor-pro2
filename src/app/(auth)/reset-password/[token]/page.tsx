"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/schemas"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { resetPasswordAction } from "@/app/(auth)/forgot-password/actions"
import { useState } from "react"

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>()
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.token },
  })

  const password = watch("password")

  async function onSubmit(data: ResetPasswordInput) {
    const result = await resetPasswordAction(data.token, data.password, data.confirmPassword)
    if (!result.success) {
      setError("root", { message: result.error ?? "Erro ao redefinir senha" })
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-emerald-600">Senha redefinida!</h1>
          <p className="text-sm text-zinc-500">Sua senha foi alterada com sucesso.</p>
          <a href="/login" className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Fazer login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Redefinir Senha</h1>
          <p className="text-sm text-zinc-500 mt-1">Digite sua nova senha</p>
        </div>

        {errors.root && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.root.message}</div>
        )}

        <input type="hidden" {...register("token")} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Nova Senha</label>
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
          {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
        </Button>
      </form>
    </div>
  )
}
