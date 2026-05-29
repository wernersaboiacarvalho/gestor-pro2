"use server"

import { prisma } from "@/lib/db/prisma"
import { randomUUID, createHash } from "crypto"
import type { ApiResponse } from "@/types"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function requestPasswordResetAction(email: string): Promise<ApiResponse<void>> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  // Sempre retorna sucesso — não vaza se o email existe
  if (!user) {
    return { success: true, message: "Se o email existir, você receberá um link" }
  }

  // Invalida tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const plainToken = randomUUID()
  const token = hashToken(plainToken)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    },
  })

  // TODO: send email with link /reset-password/{plainToken}
  console.log(`[reset-password] Link: /reset-password/${plainToken} for ${email}`)

  return { success: true, message: "Se o email existir, você receberá um link" }
}

export async function resetPasswordAction(
  plainToken: string,
  password: string,
  confirmPassword: string
): Promise<ApiResponse<void>> {
  try {
    const { resetPasswordSchema } = await import("@/lib/validations/schemas")
    const parsed = resetPasswordSchema.safeParse({ token: plainToken, password, confirmPassword })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const token = hashToken(plainToken)

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!resetToken || resetToken.usedAt) {
      return { success: false, error: "Link inválido ou já utilizado" }
    }
    if (new Date() > resetToken.expiresAt) {
      return { success: false, error: "Link expirado" }
    }

    const passwordHash = await (await import("bcryptjs")).hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: passwordHash, sessionVersion: { increment: 1 } },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    // Invalidate session via Redis
    try {
      const { redis } = await import("@/lib/db/redis")
      if (redis) {
        await redis.incr(`session:${resetToken.userId}`)
      }
    } catch {
      // non-critical
    }

    return { success: true, message: "Senha redefinida com sucesso" }
  } catch (error) {
    console.error("[resetPassword]", error)
    return { success: false, error: "Erro ao redefinir senha" }
  }
}
