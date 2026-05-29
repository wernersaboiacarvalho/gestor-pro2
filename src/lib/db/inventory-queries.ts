import { prisma } from "@/lib/db/prisma"

export interface LowStockItem {
  id: string
  name: string
  sku: string | null
  quantity: number
  minQuantity: number
}

export async function getLowStockItems(tenantId: string, take = 5): Promise<LowStockItem[]> {
  return prisma.$queryRaw<LowStockItem[]>`
    SELECT id, name, sku, quantity, "minQuantity"
    FROM "InventoryItem"
    WHERE "tenantId" = ${tenantId}
      AND quantity <= "minQuantity"
    ORDER BY quantity ASC, name ASC
    LIMIT ${take}
  `
}

export async function countLowStockItems(tenantId: string): Promise<number> {
  const [result] = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM "InventoryItem"
    WHERE "tenantId" = ${tenantId}
      AND quantity <= "minQuantity"
  `

  return result?.count ?? 0
}
