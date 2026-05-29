"use server"

import { revalidatePath } from "next/cache"
import { requireTenantContext } from "@/lib/auth/tenant"
import { prisma } from "@/lib/db/prisma"
import { serviceOrderSchema, type ServiceOrderInput } from "@/lib/validations/schemas"
import type { ApiResponse, PaginatedResult } from "@/types"
import type { ServiceOrder, ServiceOrderItem, ServiceOrderStatus, ServiceOrderType } from "@/generated/prisma"
import { Prisma } from "@/generated/prisma"
const Decimal = Prisma.Decimal

export type ServiceOrderWithRelations = ServiceOrder & {
  vehicle: {
    id: string
    plate: string
    brand: string
    model: string
    year: number
    customer: { id: string; name: string; phone: string }
  }
  mechanic: { id: string; name: string } | null
  items: ServiceOrderItem[]
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:    ["sent", "cancelled"],
  sent:     ["approved", "rejected", "draft"],
  approved: ["in_progress", "cancelled"],
  rejected: ["draft"],
  pending:     ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed:   ["delivered"],
  delivered:   [],
  cancelled:   ["draft"],
}

function canTransition(from: string, to: string): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

async function generateOrderNumber(tenantId: string): Promise<string> {
  const lastOrder = await prisma.serviceOrder.findFirst({
    where: { tenantId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  })
  const lastNumber = Number.parseInt(lastOrder?.orderNumber ?? "0", 10)
  return String((Number.isFinite(lastNumber) ? lastNumber : 0) + 1).padStart(6, "0")
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function getServiceOrders(
  page = 1,
  pageSize = 20,
  filters?: {
    search?: string
    status?: string
    type?: string
    mechanicId?: string
  }
): Promise<ApiResponse<PaginatedResult<ServiceOrderWithRelations>>> {
  try {
    const { tenantId } = await requireTenantContext()

    const where = {
      tenantId,
      ...(filters?.status && { status: filters.status as ServiceOrderStatus }),
      ...(filters?.type   && { type:   filters.type as ServiceOrderType }),
      ...(filters?.mechanicId && { mechanicId: filters.mechanicId }),
      ...(filters?.search && {
        OR: [
          { orderNumber: { contains: filters.search } },
          { description: { contains: filters.search, mode: "insensitive" as const } },
          { vehicle: { plate: { contains: filters.search.toUpperCase() } } },
          { vehicle: { customer: { name: { contains: filters.search, mode: "insensitive" as const } } } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true, plate: true, brand: true, model: true, year: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
          mechanic: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.serviceOrder.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: data as ServiceOrderWithRelations[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("[getServiceOrders]", error)
    return { success: false, error: "Erro ao buscar ordens de serviço" }
  }
}

export async function getServiceOrderById(
  id: string
): Promise<ApiResponse<ServiceOrderWithRelations>> {
  try {
    const { tenantId } = await requireTenantContext()

    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true, plate: true, brand: true, model: true, year: true,
            customer: { select: { id: true, name: true, phone: true } },
          },
        },
        mechanic: { select: { id: true, name: true } },
        items: true,
      },
    })

    if (!order || order.tenantId !== tenantId) {
      return { success: false, error: "Ordem de serviço não encontrada" }
    }

    return { success: true, data: order as ServiceOrderWithRelations }
  } catch (error) {
    console.error("[getServiceOrderById]", error)
    return { success: false, error: "Erro ao buscar ordem de serviço" }
  }
}

export async function createServiceOrder(
  input: ServiceOrderInput
): Promise<ApiResponse<ServiceOrder>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = serviceOrderSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parsed.data.vehicleId },
      select: { tenantId: true },
    })
    if (!vehicle || vehicle.tenantId !== tenantId) {
      return { success: false, error: "Veículo não encontrado" }
    }

    if (parsed.data.mechanicId) {
      const mechanic = await prisma.user.findUnique({
        where: { id: parsed.data.mechanicId },
        select: { tenantId: true },
      })
      if (!mechanic || mechanic.tenantId !== tenantId) {
        return { success: false, error: "Mecânico não encontrado" }
      }
    }

    const items = parsed.data.items ?? []
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.unitValue * item.quantity,
      0
    )
    const totalValue = new Decimal(itemsTotal)
    const discount = new Decimal(parsed.data.discount)

    let order: ServiceOrder | null = null
    let orderNumber = ""

    for (let attempt = 0; attempt < 3; attempt++) {
      orderNumber = await generateOrderNumber(tenantId)

      try {
        order = await prisma.serviceOrder.create({
          data: {
            tenantId,
            vehicleId: parsed.data.vehicleId,
            mechanicId: parsed.data.mechanicId ?? null,
            orderNumber,
            type: "budget",
            status: "draft",
            description: parsed.data.description,
            notes: parsed.data.notes,
            discount,
            totalValue,
            items: {
              create: items.map((item) => ({
                tenantId,
                type: item.type,
                description: item.description,
                quantity: item.quantity,
                unitValue: new Decimal(item.unitValue),
                totalValue: new Decimal(item.unitValue * item.quantity),
                partnerId: item.partnerId ?? null,
                partnerCost: item.partnerCost ? new Decimal(item.partnerCost) : null,
                inventoryItemId: item.inventoryItemId ?? null,
              })),
            },
          },
        })
        break
      } catch (error) {
        if (!isUniqueConstraintError(error) || attempt === 2) throw error
      }
    }

    if (!order) {
      return { success: false, error: "Erro ao gerar nÃºmero da ordem de serviÃ§o" }
    }

    const createdOrder = order

    await Promise.all([
      prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "create",
          entity: "service_order",
          entityId: createdOrder.id,
          newValues: { ...parsed.data, orderNumber },
        },
      }),
      prisma.serviceOrderHistory.create({
        data: {
          tenantId,
          serviceOrderId: createdOrder.id,
          userId,
          action: "create",
          toStatus: "draft",
          notes: "Ordem criada",
        },
      }),
    ])

    revalidatePath("/workspace/[tenantSlug]/service-orders", "page")
    return { success: true, data: createdOrder }
  } catch (error) {
    console.error("[createServiceOrder]", error)
    return { success: false, error: "Erro ao criar ordem de serviço" }
  }
}

export async function updateServiceOrder(
  id: string,
  input: ServiceOrderInput
): Promise<ApiResponse<ServiceOrder>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const parsed = serviceOrderSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const existing = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Ordem de serviço não encontrada" }
    }

    const editableStatuses = ["draft", "pending", "rejected"]
    if (!editableStatuses.includes(existing.status)) {
      return {
        success: false,
        error: `Não é possível editar uma OS com status "${existing.status}"`,
      }
    }

    const items = parsed.data.items ?? []
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.unitValue * item.quantity,
      0
    )
    const totalValue = new Decimal(itemsTotal)
    const discount = new Decimal(parsed.data.discount)

    const order = await prisma.$transaction(async (tx) => {
      await tx.serviceOrderItem.deleteMany({ where: { serviceOrderId: id } })

      return tx.serviceOrder.update({
        where: { id },
        data: {
          vehicleId: parsed.data.vehicleId,
          mechanicId: parsed.data.mechanicId ?? null,
          description: parsed.data.description,
          notes: parsed.data.notes,
          discount,
          totalValue,
          items: {
            create: items.map((item) => ({
              tenantId,
              type: item.type,
              description: item.description,
              quantity: item.quantity,
              unitValue: new Decimal(item.unitValue),
              totalValue: new Decimal(item.unitValue * item.quantity),
              partnerId: item.partnerId ?? null,
              partnerCost: item.partnerCost ? new Decimal(item.partnerCost) : null,
              inventoryItemId: item.inventoryItemId ?? null,
            })),
          },
        },
      })
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "update",
        entity: "service_order",
        entityId: id,
        oldValues: existing,
        newValues: parsed.data,
      },
    })

    revalidatePath("/workspace/[tenantSlug]/service-orders", "page")
    return { success: true, data: order }
  } catch (error) {
    console.error("[updateServiceOrder]", error)
    return { success: false, error: "Erro ao atualizar ordem de serviço" }
  }
}

type StatusAction =
  | "send"       | "approve"  | "reject"  | "convert"
  | "start"      | "complete" | "deliver" | "cancel"
  | "reopen"

const ACTION_TRANSITIONS: Record<StatusAction, { from: string; to: string }> = {
  send:     { from: "draft",       to: "sent" },
  approve:  { from: "sent",        to: "approved" },
  reject:   { from: "sent",        to: "rejected" },
  convert:  { from: "approved",    to: "pending" },
  start:    { from: "pending",     to: "in_progress" },
  complete: { from: "in_progress", to: "completed" },
  deliver:  { from: "completed",   to: "delivered" },
  cancel:   { from: "*",           to: "cancelled" },
  reopen:   { from: "cancelled",   to: "pending" },
}

export async function transitionServiceOrder(
  id: string,
  action: StatusAction,
  notes?: string
): Promise<ApiResponse<ServiceOrder>> {
  try {
    const { tenantId, userId } = await requireTenantContext()

    const existing = await prisma.serviceOrder.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenantId) {
      return { success: false, error: "Ordem de serviço não encontrada" }
    }

    const transition = ACTION_TRANSITIONS[action]
    const fromOk =
      transition.from === "*" || existing.status === transition.from

    if (!fromOk || !canTransition(existing.status, transition.to)) {
      return {
        success: false,
        error: `Transição inválida: "${existing.status}" → "${transition.to}"`,
      }
    }

    const now = new Date()
    const timestampFields: Partial<Record<string, Date>> = {
      ...(action === "approve"  && { approvedAt: now }),
      ...(action === "start"    && { startedAt: now }),
      ...(action === "complete" && { completedAt: now }),
      ...(action === "deliver"  && { deliveredAt: now }),
    }

    const typeUpdate =
      action === "convert" ? { type: "service_order" as ServiceOrderType } : {}

    const [order] = await prisma.$transaction([
      prisma.serviceOrder.update({
        where: { id },
        data: {
          status: transition.to as ServiceOrderStatus,
          ...timestampFields,
          ...typeUpdate,
        },
      }),
      prisma.serviceOrderHistory.create({
        data: {
          tenantId,
          serviceOrderId: id,
          userId,
          action,
          fromStatus: existing.status,
          toStatus: transition.to,
          notes: notes ?? null,
        },
      }),
    ])

    if (action === "deliver") {
      const netValue = (existing.totalValue as Prisma.Decimal).sub(existing.discount as Prisma.Decimal)
      await prisma.financialRecord.create({
        data: {
          tenantId,
          type: "receivable",
          description: `OS #${existing.orderNumber}`,
          value: netValue,
          status: "pending",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: "Serviços",
          serviceOrderId: id,
        },
      })
    }

    revalidatePath("/workspace/[tenantSlug]/service-orders", "page")
    return { success: true, data: order }
  } catch (error) {
    console.error("[transitionServiceOrder]", error)
    return { success: false, error: "Erro ao atualizar status da ordem" }
  }
}

export async function cancelServiceOrder(
  id: string,
  reason: string
): Promise<ApiResponse<ServiceOrder>> {
  const result = await transitionServiceOrder(id, "cancel", reason)
  return result.success
    ? { success: true }
    : result
}
