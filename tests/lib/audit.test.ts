import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "log-1" }),
    },
  },
}))

import { logAudit } from "@/lib/audit"
import { prisma } from "@/lib/db/prisma"

describe("logAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates audit log with correct data", async () => {
    await logAudit({
      tenantId: "tenant-1",
      userId: "user-1",
      action: "create",
      entity: "customer",
      entityId: "cust-1",
      newValues: { name: "João" },
    })

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
    const call = vi.mocked(prisma.auditLog.create).mock.calls[0][0]
    expect(call.data.tenantId).toBe("tenant-1")
    expect(call.data.userId).toBe("user-1")
    expect(call.data.action).toBe("create")
    expect(call.data.entity).toBe("customer")
    expect(call.data.entityId).toBe("cust-1")
    expect(call.data.newValues).toEqual({ name: "João" })
  })

  it("creates audit log with old and new values", async () => {
    await logAudit({
      tenantId: "tenant-1",
      userId: "user-1",
      action: "update",
      entity: "service_order",
      entityId: "so-1",
      oldValues: { status: "pending" },
      newValues: { status: "completed" },
    })

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
    const call = vi.mocked(prisma.auditLog.create).mock.calls[0][0]
    expect(call.data.oldValues).toEqual({ status: "pending" })
    expect(call.data.newValues).toEqual({ status: "completed" })
  })

  it("creates audit log without userId", async () => {
    await logAudit({
      tenantId: "tenant-1",
      action: "delete",
      entity: "customer",
      entityId: "cust-1",
    })

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
    const call = vi.mocked(prisma.auditLog.create).mock.calls[0][0]
    expect(call.data.userId).toBeNull()
  })

  it("does not throw on database error", async () => {
    vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(new Error("DB error"))

    await expect(
      logAudit({
        tenantId: "tenant-1",
        action: "create",
        entity: "customer",
        entityId: "cust-1",
      })
    ).resolves.not.toThrow()
  })
})
