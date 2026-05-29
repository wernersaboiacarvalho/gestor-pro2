"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { mechanicSchema, type MechanicInput } from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { Mechanic } from "@/generated/prisma"

export async function getMechanics(
  page = 1,
  pageSize = 50,
  search?: string,
  activeOnly = false
): Promise<ApiResponse<PaginatedResult<Mechanic>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(activeOnly && { active: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { specialty: { contains: search, mode: "insensitive" as const } },
          { cpf: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.mechanic.findMany({
        where,
        orderBy: [{ active: "desc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.mechanic.count({ where }),
    ])

    return {
      success: true,
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (error) {
    console.error("[getMechanics]", error)
    return { success: false, error: "Erro ao buscar mecânicos" }
  }
}

export async function getMechanicsForSelect(): Promise<
  ApiResponse<{ id: string; name: string; specialty: string | null }[]>
> {
  try {
    const { tenantId } = await requireTenantContext()

    const mechanics = await prisma.mechanic.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: mechanics }
  } catch (error) {
    console.error("[getMechanicsForSelect]", error)
    return { success: false, error: "Erro ao buscar mecânicos" }
  }
}

export async function getMechanicById(
  id: string
): Promise<ApiResponse<Mechanic>> {
  try {
    const { tenantId } = await requireTenantContext()

    const mechanic = await prisma.mechanic.findUnique({ where: { id } })
    if (!mechanic || mechanic.tenantId !== tenantId) {
      return { success: false, error: "Mecânico não encontrado" }
    }

    return { success: true, data: mechanic }
  } catch (error) {
    console.error("[getMechanicById]", error)
    return { success: false, error: "Erro ao buscar mecânico" }
  }
}

export async function createMechanic(
  input: MechanicInput
): Promise<ApiResponse<Mechanic>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = mechanicSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const mechanic = await prisma.mechanic.create({
      data: { ...parsed.data, tenantId },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "create",
        entity: "mechanic",
        entityId: mechanic.id,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/mechanics", "page")
    return { success: true, data: mechanic }
  } catch (error) {
    console.error("[createMechanic]", error)
    return { success: false, error: "Erro ao criar mecânico" }
  }
}

export async function updateMechanic(
  id: string,
  input: MechanicInput
): Promise<ApiResponse<Mechanic>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = mechanicSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.mechanic.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Mecânico não encontrado" }
    }

    const mechanic = await prisma.mechanic.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "update",
        entity: "mechanic",
        entityId: id,
        oldValues: existing,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/mechanics", "page")
    return { success: true, data: mechanic }
  } catch (error) {
    console.error("[updateMechanic]", error)
    return { success: false, error: "Erro ao atualizar mecânico" }
  }
}

export async function toggleMechanicActive(
  id: string
): Promise<ApiResponse<Mechanic>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.mechanic.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Mecânico não encontrado" }
    }

    const mechanic = await prisma.mechanic.update({
      where: { id },
      data: { active: !existing.active },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "update",
        entity: "mechanic",
        entityId: id,
        oldValues: { active: existing.active },
        newValues: { active: mechanic.active },
      },
    })

    revalidatePath("/workspace/[tenantSlug]/mechanics", "page")
    return { success: true, data: mechanic }
  } catch (error) {
    console.error("[toggleMechanicActive]", error)
    return { success: false, error: "Erro ao atualizar mecânico" }
  }
}

export async function deleteMechanic(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.mechanic.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Mecânico não encontrado" }
    }

    const activeOrders = await prisma.serviceOrder.count({
      where: {
        mechanicId: id,
        status: { in: ["pending", "in_progress"] },
      },
    })
    if (activeOrders > 0) {
      return {
        success: false,
        error: `Mecânico possui ${activeOrders} ordem(ns) de serviço em andamento. Desative-o em vez de deletar.`,
      }
    }

    await prisma.mechanic.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "delete",
        entity: "mechanic",
        entityId: id,
        oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/mechanics", "page")
    return { success: true }
  } catch (error) {
    console.error("[deleteMechanic]", error)
    return { success: false, error: "Erro ao deletar mecânico" }
  }
}
