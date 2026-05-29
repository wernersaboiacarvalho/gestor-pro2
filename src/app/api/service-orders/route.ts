import { prisma } from "@/lib/db/prisma"
import { serviceOrderSchema } from "@/lib/validations/schemas"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import type { Prisma, ServiceOrderStatus, ServiceOrderType } from "@/generated/prisma"
import { Prisma as PrismaRuntime } from "@/generated/prisma"
import { NextResponse } from "next/server"

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof PrismaRuntime.PrismaClientKnownRequestError && error.code === "P2002"
}

async function validateServiceOrderRelations(
  tenantId: string,
  data: {
    vehicleId: string
    mechanicId?: string | null
    items?: { partnerId?: string | null; inventoryItemId?: string | null }[]
  }
): Promise<NextResponse | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: data.vehicleId },
    select: { tenantId: true },
  })
  if (!vehicle || vehicle.tenantId !== tenantId) {
    return NextResponse.json({ error: "VeÃ­culo nÃ£o encontrado" }, { status: 404 })
  }

  if (data.mechanicId) {
    const mechanic = await prisma.user.findUnique({
      where: { id: data.mechanicId },
      select: { tenantId: true },
    })
    if (!mechanic || mechanic.tenantId !== tenantId) {
      return NextResponse.json({ error: "MecÃ¢nico nÃ£o encontrado" }, { status: 404 })
    }
  }

  const partnerIds = [...new Set(data.items?.map((item) => item.partnerId).filter(Boolean) ?? [])] as string[]
  if (partnerIds.length > 0) {
    const partnerCount = await prisma.partner.count({ where: { tenantId, id: { in: partnerIds } } })
    if (partnerCount !== partnerIds.length) {
      return NextResponse.json({ error: "Terceirizado nÃ£o encontrado" }, { status: 404 })
    }
  }

  const inventoryItemIds = [...new Set(data.items?.map((item) => item.inventoryItemId).filter(Boolean) ?? [])] as string[]
  if (inventoryItemIds.length > 0) {
    const inventoryCount = await prisma.inventoryItem.count({ where: { tenantId, id: { in: inventoryItemIds } } })
    if (inventoryCount !== inventoryItemIds.length) {
      return NextResponse.json({ error: "Item de estoque nÃ£o encontrado" }, { status: 404 })
    }
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const type = searchParams.get("type") // "budget" | "service_order"
  const status = searchParams.get("status")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const where: Prisma.ServiceOrderWhereInput = { tenantId }
  if (type) where.type = type as ServiceOrderType
  if (status) where.status = status as ServiceOrderStatus

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      mechanic: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = serviceOrderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const invalidRelation = await validateServiceOrderRelations(tenantId, parsed.data)
  if (invalidRelation) return invalidRelation

  const { items, ...data } = parsed.data

  const totalValue = items?.reduce((sum, item) => sum + item.quantity * item.unitValue, 0) ?? 0

  let order = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const today = new Date()
    const prefix = `OS-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`
    const lastOrder = await prisma.serviceOrder.findFirst({
      where: { tenantId, orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    })
    const seq = lastOrder ? Number.parseInt(lastOrder.orderNumber.split("-").pop() ?? "0", 10) + 1 : 1
    const orderNumber = `${prefix}-${String(seq).padStart(4, "0")}`

    try {
      order = await prisma.serviceOrder.create({
        data: {
          ...data,
          tenantId,
          orderNumber,
          totalValue,
          items: items?.length ? {
            create: items.map((item) => ({
              ...item,
              tenantId,
              totalValue: item.quantity * item.unitValue,
              partnerId: item.partnerId ?? null,
              partnerCost: item.partnerCost ?? null,
              inventoryItemId: item.inventoryItemId ?? null,
            })),
          } : undefined,
        },
        include: {
          vehicle: { select: { plate: true, brand: true, model: true } },
          items: true,
        },
      })
      break
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === 2) throw error
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Erro ao gerar nÃºmero da ordem" }, { status: 500 })
  }

  return NextResponse.json(order, { status: 201 })
}
