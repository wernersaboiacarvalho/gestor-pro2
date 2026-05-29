"use server"

import { prisma } from "@/lib/db/prisma"
import { hash } from "bcryptjs"
import { inviteAcceptSchema } from "@/lib/validations/schemas"
import { createHash } from "crypto"
import type { ApiResponse } from "@/types"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function getInviteByToken(plainToken: string) {
  const token = hashToken(plainToken)
  const invite = await prisma.userInvite.findUnique({
    where: { token },
    include: { tenant: { select: { name: true, slug: true } } },
  })

  if (!invite || invite.acceptedAt) return null
  if (new Date() > invite.expiresAt) return null

  return { email: invite.email, role: invite.role, tenantName: invite.tenant.name, tenantSlug: invite.tenant.slug }
}

export async function acceptInviteAction(
  input: { token: string; name: string; password: string; confirmPassword: string }
): Promise<ApiResponse<{ slug: string }>> {
  try {
    const parsed = inviteAcceptSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const hashedToken = hashToken(parsed.data.token)
    const invite = await prisma.userInvite.findUnique({
      where: { token: hashedToken },
      include: { tenant: { select: { slug: true } } },
    })

    if (!invite || invite.acceptedAt) {
      return { success: false, error: "Convite inválido ou já utilizado" }
    }
    if (new Date() > invite.expiresAt) {
      return { success: false, error: "Convite expirado" }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } })
    if (existingUser) {
      return { success: false, error: "Já existe um usuário com esse email" }
    }

    const passwordHash = await hash(parsed.data.password, 10)

    await prisma.$transaction([
      prisma.user.create({
        data: {
          name: parsed.data.name,
          email: invite.email,
          password: passwordHash,
          role: invite.role,
          tenantId: invite.tenantId,
        },
      }),
      prisma.userInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ])

    return { success: true, data: { slug: invite.tenant?.slug ?? "" } }
  } catch (error) {
    console.error("[acceptInvite]", error)
    return { success: false, error: "Erro ao aceitar convite" }
  }
}
