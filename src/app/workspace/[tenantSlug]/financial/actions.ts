"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { financialRecordSchema, type FinancialRecordInput } from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { FinancialRecord } from "@/generated/prisma"
import { Prisma, type FinancialStatus, type FinancialType } from "@/generated/prisma"
const Decimal = Prisma.Decimal

export type FinancialSummary = {
  totalReceivable: number
  totalPayable: number
  totalOverdue: number
  balance: number
}

export type FinancialRecordWithOrder = FinancialRecord & {
  serviceOrder: { id: string; orderNumber: string } | null
}

export async function getFinancialRecords(
  page = 1,
  pageSize = 20,
  filters?: {
    type?: "receivable" | "payable"
    status?: "pending" | "paid" | "cancelled"
    search?: string
    overdueOnly?: boolean
  }
): Promise<ApiResponse<PaginatedResult<FinancialRecordWithOrder>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const now = new Date()

    const where: Prisma.FinancialRecordWhereInput = {
      tenantId,
      ...(filters?.type   ? { type:   filters.type as FinancialType } : {}),
      ...(filters?.status ? { status: filters.status as FinancialStatus } : {}),
      ...(filters?.overdueOnly ? {
        status:  "pending" as FinancialStatus,
        dueDate: { lt: now },
      } : {}),
      ...(filters?.search ? {
        description: { contains: filters.search, mode: "insensitive" as const },
      } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        include: {
          serviceOrder: { select: { id: true, orderNumber: true } },
        },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.financialRecord.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: data as FinancialRecordWithOrder[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("[getFinancialRecords]", error)
    return { success: false, error: "Erro ao buscar registros financeiros" }
  }
}

export async function getFinancialSummary(): Promise<ApiResponse<FinancialSummary>> {
  try {
    const { tenantId } = await requireTenantContext()
    const now = new Date()

    const [receivable, payable, overdue] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { tenantId, type: "receivable", status: "pending" },
        _sum: { value: true },
      }),
      prisma.financialRecord.aggregate({
        where: { tenantId, type: "payable", status: "pending" },
        _sum: { value: true },
      }),
      prisma.financialRecord.aggregate({
        where: { tenantId, status: "pending", dueDate: { lt: now } },
        _sum: { value: true },
      }),
    ])

    const totalReceivable = Number(receivable._sum.value ?? 0)
    const totalPayable    = Number(payable._sum.value    ?? 0)
    const totalOverdue    = Number(overdue._sum.value    ?? 0)

    return {
      success: true,
      data: {
        totalReceivable,
        totalPayable,
        totalOverdue,
        balance: totalReceivable - totalPayable,
      },
    }
  } catch (error) {
    console.error("[getFinancialSummary]", error)
    return { success: false, error: "Erro ao calcular resumo financeiro" }
  }
}

export async function getFinancialRecordById(
  id: string
): Promise<ApiResponse<FinancialRecordWithOrder>> {
  try {
    const { tenantId } = await requireTenantContext()

    const record = await prisma.financialRecord.findUnique({
      where: { id },
      include: { serviceOrder: { select: { id: true, orderNumber: true } } },
    })

    if (!record || record.tenantId !== tenantId) {
      return { success: false, error: "Registro não encontrado" }
    }

    return { success: true, data: record as FinancialRecordWithOrder }
  } catch (error) {
    console.error("[getFinancialRecordById]", error)
    return { success: false, error: "Erro ao buscar registro financeiro" }
  }
}

export async function createFinancialRecord(
  input: FinancialRecordInput
): Promise<ApiResponse<FinancialRecord>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = financialRecordSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    if (parsed.data.serviceOrderId) {
      const order = await prisma.serviceOrder.findUnique({
        where: { id: parsed.data.serviceOrderId },
        select: { tenantId: true },
      })
      if (!order || order.tenantId !== tenantId) {
        return { success: false, error: "Ordem de serviço não encontrada" }
      }
    }

    const record = await prisma.financialRecord.create({
      data: {
        tenantId,
        type:          parsed.data.type,
        description:   parsed.data.description,
        value:         new Decimal(parsed.data.value),
        status:        parsed.data.status,
        dueDate:       new Date(parsed.data.dueDate),
        category:      parsed.data.category ?? null,
        serviceOrderId: parsed.data.serviceOrderId ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "create",
        entity:   "financial_record",
        entityId: record.id,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/financial", "page")
    return { success: true, data: record }
  } catch (error) {
    console.error("[createFinancialRecord]", error)
    return { success: false, error: "Erro ao criar registro financeiro" }
  }
}

export async function updateFinancialRecord(
  id: string,
  input: FinancialRecordInput
): Promise<ApiResponse<FinancialRecord>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = financialRecordSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.financialRecord.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Registro não encontrado" }
    }

    if (existing.status === "paid") {
      return { success: false, error: "Não é possível editar um registro já pago" }
    }

    if (parsed.data.serviceOrderId) {
      const order = await prisma.serviceOrder.findUnique({
        where: { id: parsed.data.serviceOrderId },
        select: { tenantId: true },
      })
      if (!order || order.tenantId !== tenantId) {
        return { success: false, error: "Ordem de serviço não encontrada" }
      }
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        type:          parsed.data.type,
        description:   parsed.data.description,
        value:         new Decimal(parsed.data.value),
        status:        parsed.data.status,
        dueDate:       new Date(parsed.data.dueDate),
        category:      parsed.data.category ?? null,
        serviceOrderId: parsed.data.serviceOrderId ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "update",
        entity:   "financial_record",
        entityId: id,
        oldValues: existing,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/financial", "page")
    return { success: true, data: record }
  } catch (error) {
    console.error("[updateFinancialRecord]", error)
    return { success: false, error: "Erro ao atualizar registro financeiro" }
  }
}

export async function markAsPaid(
  id: string,
  paidAt?: Date
): Promise<ApiResponse<FinancialRecord>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.financialRecord.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Registro não encontrado" }
    }

    if (existing.status !== "pending") {
      return {
        success: false,
        error: `Registro já está com status "${existing.status}"`,
      }
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: paidAt ?? new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "update",
        entity:   "financial_record",
        entityId: id,
        oldValues: { status: "pending" },
        newValues: { status: "paid", paidAt: record.paidAt },
      },
    })

    revalidatePath("/workspace/[tenantSlug]/financial", "page")
    return { success: true, data: record }
  } catch (error) {
    console.error("[markAsPaid]", error)
    return { success: false, error: "Erro ao marcar como pago" }
  }
}

export async function cancelFinancialRecord(id: string): Promise<ApiResponse<FinancialRecord>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.financialRecord.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Registro não encontrado" }
    }

    if (existing.status === "paid") {
      return { success: false, error: "Não é possível cancelar um registro já pago" }
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data: { status: "cancelled" },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "update",
        entity:   "financial_record",
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: "cancelled" },
      },
    })

    revalidatePath("/workspace/[tenantSlug]/financial", "page")
    return { success: true, data: record }
  } catch (error) {
    console.error("[cancelFinancialRecord]", error)
    return { success: false, error: "Erro ao cancelar registro financeiro" }
  }
}

export async function deleteFinancialRecord(id: string): Promise<ApiResponse<void>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.financialRecord.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Registro não encontrado" }
    }

    if (existing.status !== "cancelled") {
      return {
        success: false,
        error: "Só é possível deletar registros cancelados. Cancele primeiro.",
      }
    }

    await prisma.financialRecord.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   "delete",
        entity:   "financial_record",
        entityId: id,
        oldValues: existing,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/financial", "page")
    return { success: true }
  } catch (error) {
    console.error("[deleteFinancialRecord]", error)
    return { success: false, error: "Erro ao deletar registro financeiro" }
  }
}
