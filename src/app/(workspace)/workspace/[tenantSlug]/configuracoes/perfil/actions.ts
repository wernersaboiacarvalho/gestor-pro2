"use server"

import { prisma } from "@/lib/db/prisma"
import { hash } from "bcryptjs"
import { changePasswordSchema } from "@/lib/validations/schemas"
import { requireTenantContext } from "@/lib/auth/tenant"
import type { ApiResponse } from "@/types"

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse<{ loggedOut: boolean }>> {
  try {
    const { userId } = await requireTenantContext()

    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })
    if (!user) {
      return { success: false, error: "Usuário não encontrado" }
    }

    const { compare } = await import("bcryptjs")
    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return { success: false, error: "Senha atual incorreta" }
    }

    const passwordHash = await hash(newPassword, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          password: passwordHash,
          sessionVersion: { increment: 1 },
        },
      }),
    ])

    // Invalidate session via Redis
    try {
      const { redis } = await import("@/lib/db/redis")
      if (redis) {
        await redis.incr(`session:${userId}`)
      }
    } catch {
      // non-critical
    }

    return { success: true, data: { loggedOut: true } }
  } catch (error) {
    console.error("[changePassword]", error)
    return { success: false, error: "Erro ao alterar senha" }
  }
}
