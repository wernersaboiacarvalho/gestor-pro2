"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/schemas"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PasswordStrengthIndicator } from "./password-strength-indicator"
import { registerTenantAction, checkSlugAvailability, generateSlug } from "@/app/(auth)/register/actions"
import { useState, useEffect } from "react"

export function RegisterForm() {
  const router = useRouter()
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch("password")
  const tenantName = watch("tenantName")
  const tenantSlug = watch("tenantSlug")

  // Auto-generate slug from tenant name
  useEffect(() => {
    if (!tenantSlug && tenantName) {
      generateSlug(tenantName).then((r) => {
        if (!tenantSlug) setValue("tenantSlug", r.slug)
      })
    }
  }, [tenantName, tenantSlug, setValue])

  // Debounce slug availability check
  useEffect(() => {
    if (!tenantSlug || tenantSlug.length < 3) {
      setSlugAvailable(null)
      return
    }
    const timeout = setTimeout(async () => {
      setCheckingSlug(true)
      const result = await checkSlugAvailability(tenantSlug)
      setSlugAvailable(result.available)
      setCheckingSlug(false)
      if (!result.available && tenantSlug.length >= 3) {
        setError("tenantSlug", { message: "Slug já está em uso" })
      } else {
        clearErrors("tenantSlug")
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [tenantSlug, setError, clearErrors])

  async function onSubmit(data: RegisterInput) {
    const result = await registerTenantAction(data)
    if (!result.success) {
      setError("root", { message: result.error ?? "Erro ao criar conta" })
      return
    }
    router.push(`/login?registered=${result.data?.slug}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Criar Conta</h1>
        <p className="text-sm text-zinc-500 mt-1">Cadastre sua empresa no Gestor Pro</p>
      </div>

      {errors.root && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Seu Nome</label>
        <input id="name" {...register("name")} className="w-full rounded-lg border px-3 py-2 text-sm" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input id="email" type="email" {...register("email")} className="w-full rounded-lg border px-3 py-2 text-sm" />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
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

      <div>
        <label htmlFor="tenantName" className="block text-sm font-medium mb-1">Nome da Empresa</label>
        <input id="tenantName" {...register("tenantName")} className="w-full rounded-lg border px-3 py-2 text-sm" />
        {errors.tenantName && <p className="text-sm text-red-500 mt-1">{errors.tenantName.message}</p>}
      </div>

      <div>
        <label htmlFor="tenantSlug" className="block text-sm font-medium mb-1">
          Slug da Empresa
          {checkingSlug && <span className="ml-2 text-xs text-zinc-400">verificando...</span>}
          {slugAvailable === true && <span className="ml-2 text-xs text-emerald-600">disponível</span>}
        </label>
        <input id="tenantSlug" {...register("tenantSlug")} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="minha-oficina" />
        {errors.tenantSlug && <p className="text-sm text-red-500 mt-1">{errors.tenantSlug.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta..." : "Criar Conta"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <a href="/login" className="text-primary underline">Entrar</a>
      </p>
    </form>
  )
}
