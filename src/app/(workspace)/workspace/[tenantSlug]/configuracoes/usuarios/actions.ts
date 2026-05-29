"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { randomUUID, createHash } from "crypto"
import type { ApiResponse } from "@/types"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function getTenantUsers() {
  const { tenantId } = await requireTenantContext()
  const users = await prisma.user.findMany({
    where: { tenantId, active: true },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
    },
    orderBy: { name: "asc" },
  })
  return { success: true, data: users }
}

export async function getPendingInvites() {
  const { tenantId } = await requireTenantContext()
  const invites = await prisma.userInvite.findMany({
    where: { tenantId, acceptedAt: null },
    include: { inviter: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return { success: true, data: invites }
}

export async function inviteUserAction(
  email: string,
  role: "admin" | "user"
): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId, role: inviterRole } = await requireTenantContext()
    if (inviterRole !== "admin" && inviterRole !== "super_admin") {
      return { success: false, error: "Apenas administradores podem convidar usuários" }
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existingUser) {
      return { success: false, error: "Este email já pertence a um usuário ativo" }
    }

    const existingInvite = await prisma.userInvite.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })

    if (existingInvite && !existingInvite.acceptedAt && new Date() < existingInvite.expiresAt) {
      return { success: false, error: "Convite já enviado para este email" }
    }

    if (existingInvite) {
      await prisma.userInvite.delete({ where: { id: existingInvite.id } })
    }

    const plainToken = randomUUID()
    const token = hashToken(plainToken)

    await prisma.userInvite.create({
      data: {
        tenantId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        invitedBy: userId,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/configuracoes/usuarios", "page")
    return { success: true, message: "Convite enviado com sucesso" }
  } catch (error) {
    console.error("[inviteUser]", error)
    return { success: false, error: "Erro ao criar convite" }
  }
}

export async function cancelInviteAction(inviteId: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, role } = await requireTenantContext()
    if (role !== "admin" && role !== "super_admin") {
      return { success: false, error: "Apenas administradores podem cancelar convites" }
    }

    const invite = await prisma.userInvite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.tenantId !== tenantId) {
      return { success: false, error: "Convite não encontrado" }
    }

    await prisma.userInvite.delete({ where: { id: inviteId } })
    revalidatePath("/workspace/[tenantSlug]/configuracoes/usuarios", "page")
    return { success: true }
  } catch (error) {
    console.error("[cancelInvite]", error)
    return { success: false, error: "Erro ao cancelar convite" }
  }
}

export async function changeUserRoleAction(
  userId: string,
  newRole: "admin" | "user"
): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId: myId, role: myRole } = await requireTenantContext()
    if (myRole !== "admin" && myRole !== "super_admin") {
      return { success: false, error: "Permissão insuficiente" }
    }
    if (userId === myId) {
      return { success: false, error: "Você não pode alterar seu próprio cargo" }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } })
    if (!user || user.tenantId !== tenantId) {
      return { success: false, error: "Usuário não encontrado" }
    }

    await prisma.user.update({ where: { id: userId }, data: { role: newRole } })
    revalidatePath("/workspace/[tenantSlug]/configuracoes/usuarios", "page")
    return { success: true }
  } catch (error) {
    console.error("[changeUserRole]", error)
    return { success: false, error: "Erro ao alterar cargo" }
  }
}

export async function deactivateUserAction(userId: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId: myId, role: myRole } = await requireTenantContext()
    if (myRole !== "admin" && myRole !== "super_admin") {
      return { success: false, error: "Permissão insuficiente" }
    }
    if (userId === myId) {
      return { success: false, error: "Você não pode desativar a si mesmo" }
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } })
    if (!user || user.tenantId !== tenantId) {
      return { success: false, error: "Usuário não encontrado" }
    }

    await prisma.user.update({ where: { id: userId }, data: { active: false } })
    revalidatePath("/workspace/[tenantSlug]/configuracoes/usuarios", "page")
    return { success: true }
  } catch (error) {
    console.error("[deactivateUser]", error)
    return { success: false, error: "Erro ao desativar usuário" }
  }
}
