"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import {
  supplierSchema, type SupplierInput,
  partnerSchema, type PartnerInput,
} from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { Supplier, Partner } from "@/generated/prisma"

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

export async function getPartners(
  page = 1,
  pageSize = 20,
  search?: string,
  serviceType?: string,
  activeOnly = false
): Promise<ApiResponse<PaginatedResult<Partner>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(activeOnly && { active: true }),
      ...(serviceType && { serviceType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { serviceType: { contains: search, mode: "insensitive" as const } },
          { cnpj: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: [{ active: "desc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.partner.count({ where }),
    ])

    return {
      success: true,
      data: { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (error) {
    console.error("[getPartners]", error)
    return { success: false, error: "Erro ao buscar terceirizados" }
  }
}

export async function getPartnersForSelect(
  serviceType?: string
): Promise<ApiResponse<{ id: string; name: string; serviceType: string | null }[]>> {
  try {
    const { tenantId } = await requireTenantContext()
    const partners = await prisma.partner.findMany({
      where: { tenantId, active: true, ...(serviceType && { serviceType }) },
      select: { id: true, name: true, serviceType: true },
      orderBy: { name: "asc" },
    })
    return { success: true, data: partners }
  } catch (error) {
    console.error("[getPartnersForSelect]", error)
    return { success: false, error: "Erro ao buscar terceirizados" }
  }
}

export async function createPartner(
  input: PartnerInput
): Promise<ApiResponse<Partner>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = partnerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const partner = await prisma.partner.create({
      data: { ...parsed.data, tenantId },
    })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "create", entity: "partner",
        entityId: partner.id, newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/partners", "page")
    return { success: true, data: partner }
  } catch (error) {
    console.error("[createPartner]", error)
    return { success: false, error: "Erro ao criar terceirizado" }
  }
}

export async function updatePartner(
  id: string,
  input: PartnerInput
): Promise<ApiResponse<Partner>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = partnerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.partner.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Terceirizado não encontrado" }
    }

    const partner = await prisma.partner.update({ where: { id }, data: parsed.data })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "update", entity: "partner",
        entityId: id, oldValues: existing, newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/partners", "page")
    return { success: true, data: partner }
  } catch (error) {
    console.error("[updatePartner]", error)
    return { success: false, error: "Erro ao atualizar terceirizado" }
  }
}

export async function togglePartnerActive(id: string): Promise<ApiResponse<Partner>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.partner.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Terceirizado não encontrado" }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: { active: !existing.active },
    })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "update", entity: "partner",
        entityId: id,
        oldValues: { active: existing.active },
        newValues: { active: partner.active },
      },
    })

    revalidatePath("/workspace/[tenantSlug]/partners", "page")
    return { success: true, data: partner }
  } catch (error) {
    console.error("[togglePartnerActive]", error)
    return { success: false, error: "Erro ao atualizar terceirizado" }
  }
}

export async function deletePartner(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.partner.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Terceirizado não encontrado" }
    }

    await prisma.partner.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId, userId,
        action: "delete", entity: "partner",
        entityId: id, oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/partners", "page")
    return { success: true }
  } catch (error) {
    console.error("[deletePartner]", error)
    return { success: false, error: "Erro ao deletar terceirizado" }
  }
}
