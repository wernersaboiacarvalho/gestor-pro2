"use server"

import { prisma } from "@/lib/db/prisma"
import { hash } from "bcryptjs"
import { registerSchema } from "@/lib/validations/schemas"
import type { ApiResponse } from "@/types"
import { slugify } from "@/lib/utils/formatters"

export async function registerTenantAction(
  input: { name: string; email: string; password: string; tenantName: string; tenantSlug: string }
): Promise<ApiResponse<{ slug: string }>> {
  try {
    const parsed = registerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })
    if (existingEmail) {
      return { success: false, error: "Email já está em uso" }
    }

    const existingSlug = await prisma.tenant.findUnique({ where: { slug: parsed.data.tenantSlug }, select: { id: true } })
    if (existingSlug) {
      return { success: false, error: "Slug já está em uso. Escolha outro." }
    }

    const passwordHash = await hash(parsed.data.password, 10)

    await prisma.$transaction([
      prisma.tenant.create({
        data: {
          name: parsed.data.tenantName,
          slug: parsed.data.tenantSlug,
          businessType: "workshop",
          plan: "free",
          status: "active",
        },
      }),
      prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: passwordHash,
          role: "admin",
          tenant: {
            connect: { slug: parsed.data.tenantSlug },
          },
        },
      }),
    ])

    return { success: true, data: { slug: parsed.data.tenantSlug } }
  } catch (error) {
    console.error("[registerTenant]", error)
    return { success: false, error: "Erro ao criar conta" }
  }
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
  if (slug.length < 3) return { available: false }
  const slugged = slugify(slug)
  const existing = await prisma.tenant.findUnique({ where: { slug: slugged }, select: { id: true } })
  return { available: !existing }
}

export async function generateSlug(name: string): Promise<{ slug: string }> {
  return { slug: slugify(name) }
}
