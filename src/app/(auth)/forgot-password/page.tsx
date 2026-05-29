"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { requestPasswordResetAction } from "./actions"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>()
  const [sent, setSent] = useState(false)

  async function onSubmit(data: { email: string }) {
    await requestPasswordResetAction(data.email)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Verifique seu email</h1>
          <p className="text-sm text-zinc-500">Se o email existir, você receberá um link para redefinir sua senha.</p>
          <a href="/login" className="text-sm text-primary underline">Voltar para o login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Esqueceu a senha?</h1>
          <p className="text-sm text-zinc-500 mt-1">Digite seu email para receber o link de redefinição</p>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" type="email" {...register("email", { required: true })} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar link"}
        </Button>
        <p className="text-center text-sm text-zinc-500">
          <a href="/login" className="text-primary underline">Voltar para o login</a>
        </p>
      </form>
    </div>
  )
}
