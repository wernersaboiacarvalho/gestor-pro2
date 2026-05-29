"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import {
  supplierSchema, type SupplierInput,
} from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { Supplier } from "@/generated/prisma"

export async function getSuppliers(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<ApiResponse<PaginatedResult<Supplier>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { cnpj: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supplier.count({ where }),
    ])

    return {
      success: true,
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (error) {
    console.error("[getSuppliers]", error)
    return { success: false, error: "Erro ao buscar fornecedores" }
  }
}

export async function getSuppliersForSelect(): Promise<
  ApiResponse<{ id: string; name: string }[]>
> {
  try {
    const { tenantId } = await requireTenantContext()
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
    return { success: true, data: suppliers }
  } catch (error) {
    console.error("[getSuppliersForSelect]", error)
    return { success: false, error: "Erro ao buscar fornecedores" }
  }
}

export async function createSupplier(
  input: SupplierInput
): Promise<ApiResponse<Supplier>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = supplierSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const supplier = await prisma.supplier.create({
      data: { ...parsed.data, tenantId },
    })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "create", entity: "supplier",
        entityId: supplier.id, newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/suppliers", "page")
    return { success: true, data: supplier }
  } catch (error) {
    console.error("[createSupplier]", error)
    return { success: false, error: "Erro ao criar fornecedor" }
  }
}

export async function updateSupplier(
  id: string,
  input: SupplierInput
): Promise<ApiResponse<Supplier>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = supplierSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Fornecedor não encontrado" }
    }

    const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "update", entity: "supplier",
        entityId: id, oldValues: existing, newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/suppliers", "page")
    return { success: true, data: supplier }
  } catch (error) {
    console.error("[updateSupplier]", error)
    return { success: false, error: "Erro ao atualizar fornecedor" }
  }
}

export async function deleteSupplier(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Fornecedor não encontrado" }
    }

    const itemCount = await prisma.inventoryItem.count({ where: { supplierId: id } })
    if (itemCount > 0) {
      return {
        success: false,
        error: `Fornecedor possui ${itemCount} item(ns) no estoque. Reatribua-os antes de deletar.`,
      }
    }

    await prisma.supplier.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "delete", entity: "supplier",
        entityId: id, oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/suppliers", "page")
    return { success: true }
  } catch (error) {
    console.error("[deleteSupplier]", error)
    return { success: false, error: "Erro ao deletar fornecedor" }
  }
}
