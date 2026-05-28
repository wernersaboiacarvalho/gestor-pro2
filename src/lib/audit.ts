import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@/generated/prisma"

export async function logAudit({
  tenantId,
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
}: {
  tenantId: string
  userId?: string
  action: "create" | "update" | "delete"
  entity: string
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: userId ?? null,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : Prisma.DbNull,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : Prisma.DbNull,
      },
    })
  } catch {
    // Audit log failure should not block the main operation
  }
}
