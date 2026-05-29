"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { vehicleSchema, type VehicleInput } from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { Vehicle } from "@/generated/prisma"

export type VehicleWithCustomer = Vehicle & {
  customer: { id: string; name: string; phone: string }
}

export async function getVehicles(
  page = 1,
  pageSize = 20,
  search?: string,
  customerId?: string
): Promise<ApiResponse<PaginatedResult<VehicleWithCustomer>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { plate: { contains: search.toUpperCase() } },
          { brand: { contains: search, mode: "insensitive" as const } },
          { model: { contains: search, mode: "insensitive" as const } },
          { customer: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: data as VehicleWithCustomer[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("[getVehicles]", error)
    return { success: false, error: "Erro ao buscar veículos" }
  }
}

export async function getVehicleById(
  id: string
): Promise<ApiResponse<VehicleWithCustomer>> {
  try {
    const { tenantId } = await requireTenantContext()

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    })

    if (!vehicle || vehicle.tenantId !== tenantId) {
      return { success: false, error: "Veículo não encontrado" }
    }

    return { success: true, data: vehicle as VehicleWithCustomer }
  } catch (error) {
    console.error("[getVehicleById]", error)
    return { success: false, error: "Erro ao buscar veículo" }
  }
}

export async function createVehicle(
  input: VehicleInput
): Promise<ApiResponse<Vehicle>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = vehicleSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { tenantId: true },
    })
    if (!customer || customer.tenantId !== tenantId) {
      return { success: false, error: "Cliente não encontrado" }
    }

    const vehicle = await prisma.vehicle.create({
      data: { ...parsed.data, tenantId },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "create",
        entity: "vehicle",
        entityId: vehicle.id,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/vehicles", "page")
    revalidatePath(`/workspace/[tenantSlug]/customers/${parsed.data.customerId}`, "page")
    return { success: true, data: vehicle }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Já existe um veículo com essa placa" }
    }
    console.error("[createVehicle]", error)
    return { success: false, error: "Erro ao criar veículo" }
  }
}

export async function updateVehicle(
  id: string,
  input: VehicleInput
): Promise<ApiResponse<Vehicle>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = vehicleSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Veículo não encontrado" }
    }

    if (parsed.data.customerId !== existing.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: parsed.data.customerId },
        select: { tenantId: true },
      })
      if (!customer || customer.tenantId !== tenantId) {
        return { success: false, error: "Cliente não encontrado" }
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "update",
        entity: "vehicle",
        entityId: id,
        oldValues: existing,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/vehicles", "page")
    return { success: true, data: vehicle }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Já existe um veículo com essa placa" }
    }
    console.error("[updateVehicle]", error)
    return { success: false, error: "Erro ao atualizar veículo" }
  }
}

export async function deleteVehicle(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Veículo não encontrado" }
    }

    const openOrders = await prisma.serviceOrder.count({
      where: {
        vehicleId: id,
        status: { in: ["pending", "in_progress", "draft", "sent", "approved"] },
      },
    })
    if (openOrders > 0) {
      return {
        success: false,
        error: `Veículo possui ${openOrders} ordem(ns) de serviço em aberto`,
      }
    }

    await prisma.vehicle.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "delete",
        entity: "vehicle",
        entityId: id,
        oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/vehicles", "page")
    return { success: true }
  } catch (error) {
    console.error("[deleteVehicle]", error)
    return { success: false, error: "Erro ao deletar veículo" }
  }
}
