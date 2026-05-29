"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { inventorySchema, type InventoryInput } from "@/lib/validations/schemas"
import { z } from "zod"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { InventoryItem, InventoryMovement } from "@/generated/prisma"

export type InventoryItemWithSupplier = InventoryItem & {
  supplier: { id: string; name: string } | null
}

export type LowStockItem = {
  id: string
  name: string
  sku: string | null
  quantity: number
  minQuantity: number
  category: string | null
}

const movementSchema = z.object({
  type: z.enum(["in", "out"]),
  quantity: z.number().int().min(1, "Quantidade mínima é 1"),
  description: z.string().optional(),
})
export type MovementInput = z.infer<typeof movementSchema>

export async function getInventoryItems(
  page = 1,
  pageSize = 20,
  search?: string,
  category?: string,
  lowStockOnly = false
): Promise<ApiResponse<PaginatedResult<InventoryItemWithSupplier>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(category && { category }),
      ...(lowStockOnly && {
        quantity: { lte: prisma.inventoryItem.fields.minQuantity },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const allItems = await prisma.inventoryItem.findMany({
      where: lowStockOnly
        ? { tenantId, ...(category && { category }), ...(search && { name: { contains: search, mode: "insensitive" as const } }) }
        : where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    })

    const filtered = lowStockOnly
      ? allItems.filter((i) => i.quantity <= i.minQuantity)
      : allItems

    const total = filtered.length
    const data = filtered.slice((page - 1) * pageSize, page * pageSize)

    return {
      success: true,
      data: {
        data: data as InventoryItemWithSupplier[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("[getInventoryItems]", error)
    return { success: false, error: "Erro ao buscar itens do estoque" }
  }
}

export async function getLowStockItems(): Promise<ApiResponse<LowStockItem[]>> {
  try {
    const { tenantId } = await requireTenantContext()

    const items = await prisma.$queryRaw<LowStockItem[]>`
      SELECT id, name, sku, quantity, "minQuantity", category
      FROM "InventoryItem"
      WHERE "tenantId" = ${tenantId}
        AND quantity <= "minQuantity"
      ORDER BY (quantity - "minQuantity") ASC
    `

    return { success: true, data: items }
  } catch (error) {
    console.error("[getLowStockItems]", error)
    return { success: false, error: "Erro ao buscar itens com estoque baixo" }
  }
}

export async function getInventoryCategories(): Promise<ApiResponse<string[]>> {
  try {
    const { tenantId } = await requireTenantContext()

    const categories = await prisma.inventoryItem.findMany({
      where: { tenantId, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })

    return {
      success: true,
      data: categories.map((c) => c.category!).filter(Boolean),
    }
  } catch (error) {
    console.error("[getInventoryCategories]", error)
    return { success: false, error: "Erro ao buscar categorias" }
  }
}

export async function getInventoryItemById(
  id: string
): Promise<ApiResponse<InventoryItemWithSupplier & { movements: InventoryMovement[] }>> {
  try {
    const { tenantId } = await requireTenantContext()

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        movements: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    })

    if (!item || item.tenantId !== tenantId) {
      return { success: false, error: "Item não encontrado" }
    }

    return { success: true, data: item as InventoryItemWithSupplier & { movements: InventoryMovement[] } }
  } catch (error) {
    console.error("[getInventoryItemById]", error)
    return { success: false, error: "Erro ao buscar item" }
  }
}

export async function createInventoryItem(
  input: InventoryInput
): Promise<ApiResponse<InventoryItem>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = inventorySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    if (parsed.data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parsed.data.supplierId },
        select: { tenantId: true },
      })
      if (!supplier || supplier.tenantId !== tenantId) {
        return { success: false, error: "Fornecedor não encontrado" }
      }
    }

    const item = await prisma.inventoryItem.create({
      data: { ...parsed.data, tenantId },
    })

    if (parsed.data.quantity > 0) {
      await prisma.inventoryMovement.create({
        data: {
          tenantId,
          inventoryItemId: item.id,
          type: "in",
          quantity: parsed.data.quantity,
          description: "Estoque inicial",
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "create",
        entity: "inventory",
        entityId: item.id,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/inventory", "page")
    return { success: true, data: item }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Já existe um item com esse SKU" }
    }
    console.error("[createInventoryItem]", error)
    return { success: false, error: "Erro ao criar item no estoque" }
  }
}

export async function updateInventoryItem(
  id: string,
  input: InventoryInput
): Promise<ApiResponse<InventoryItem>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = inventorySchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Item não encontrado" }
    }

    if (parsed.data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parsed.data.supplierId },
        select: { tenantId: true },
      })
      if (!supplier || supplier.tenantId !== tenantId) {
        return { success: false, error: "Fornecedor não encontrado" }
      }
    }

    const quantityDiff = parsed.data.quantity - existing.quantity
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: parsed.data,
      })

      if (quantityDiff !== 0) {
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            inventoryItemId: id,
            type: quantityDiff > 0 ? "in" : "out",
            quantity: Math.abs(quantityDiff),
            description: "Ajuste manual de estoque",
          },
        })
      }

      return updated
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "update",
        entity: "inventory",
        entityId: id,
        oldValues: existing,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/inventory", "page")
    return { success: true, data: item }
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { success: false, error: "Já existe um item com esse SKU" }
    }
    console.error("[updateInventoryItem]", error)
    return { success: false, error: "Erro ao atualizar item" }
  }
}

export async function registerMovement(
  itemId: string,
  input: MovementInput
): Promise<ApiResponse<InventoryItem>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = movementSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Item não encontrado" }
    }

    if (parsed.data.type === "out" && existing.quantity < parsed.data.quantity) {
      return {
        success: false,
        error: `Estoque insuficiente. Disponível: ${existing.quantity}`,
      }
    }

    const newQuantity =
      parsed.data.type === "in"
        ? existing.quantity + parsed.data.quantity
        : existing.quantity - parsed.data.quantity

    const item = await prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          inventoryItemId: itemId,
          type: parsed.data.type,
          quantity: parsed.data.quantity,
          description: parsed.data.description,
        },
      })

      return tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      })
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "update",
        entity: "inventory",
        entityId: itemId,
        oldValues: { quantity: existing.quantity },
        newValues: { quantity: newQuantity, movement: parsed.data },
      },
    })

    revalidatePath("/workspace/[tenantSlug]/inventory", "page")
    return { success: true, data: item }
  } catch (error) {
    console.error("[registerMovement]", error)
    return { success: false, error: "Erro ao registrar movimentação" }
  }
}

export async function deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Item não encontrado" }
    }

    await prisma.inventoryItem.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "delete",
        entity: "inventory",
        entityId: id,
        oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/inventory", "page")
    return { success: true }
  } catch (error) {
    console.error("[deleteInventoryItem]", error)
    return { success: false, error: "Erro ao deletar item do estoque" }
  }
}
