"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { customerSchema, type CustomerInput } from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { Customer, Vehicle } from "@/generated/prisma"

export type CustomerWithVehicles = Customer & {
  vehicles: Vehicle[]
}

export async function getCustomers(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<ApiResponse<PaginatedResult<Customer>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(search && {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { cpf:   { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ])

    return {
      success: true,
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (error) {
    console.error("[getCustomers]", error)
    return { success: false, error: "Erro ao buscar clientes" }
  }
}

export async function getCustomerById(
  id: string
): Promise<ApiResponse<CustomerWithVehicles>> {
  try {
    const { tenantId } = await requireTenantContext()

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { vehicles: { orderBy: { createdAt: "desc" } } },
    })

    if (!customer || customer.tenantId !== tenantId) {
      return { success: false, error: "Cliente não encontrado" }
    }

    return { success: true, data: customer }
  } catch (error) {
    console.error("[getCustomerById]", error)
    return { success: false, error: "Erro ao buscar cliente" }
  }
}

export async function getCustomersForSelect(): Promise<
  ApiResponse<{ id: string; name: string; phone: string }[]>
> {
  try {
    const { tenantId } = await requireTenantContext()

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: customers }
  } catch (error) {
    console.error("[getCustomersForSelect]", error)
    return { success: false, error: "Erro ao buscar clientes" }
  }
}

export async function createCustomer(
  input: CustomerInput
): Promise<ApiResponse<Customer>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = customerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const customer = await prisma.customer.create({
      data: { ...parsed.data, tenantId },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "create",
        entity:   "customer",
        entityId: customer.id,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/customers", "page")
    return { success: true, data: customer }
  } catch (error) {
    console.error("[createCustomer]", error)
    return { success: false, error: "Erro ao criar cliente" }
  }
}

export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<ApiResponse<Customer>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = customerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Cliente não encontrado" }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "update",
        entity:   "customer",
        entityId: id,
        oldValues: existing,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/customers", "page")
    return { success: true, data: customer }
  } catch (error) {
    console.error("[updateCustomer]", error)
    return { success: false, error: "Erro ao atualizar cliente" }
  }
}

export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Cliente não encontrado" }
    }

    const openOrders = await prisma.serviceOrder.count({
      where: {
        tenantId,
        vehicle: { customerId: id },
        status: { in: ["draft", "sent", "approved", "pending", "in_progress"] },
      },
    })
    if (openOrders > 0) {
      return {
        success: false,
        error: `Cliente possui ${openOrders} ordem(ns) de serviço em aberto`,
      }
    }

    await prisma.customer.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "delete",
        entity:   "customer",
        entityId: id,
        oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/customers", "page")
    return { success: true }
  } catch (error) {
    console.error("[deleteCustomer]", error)
    return { success: false, error: "Erro ao deletar cliente" }
  }
}
