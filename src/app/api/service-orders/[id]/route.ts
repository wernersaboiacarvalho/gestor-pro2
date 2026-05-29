import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"
import { serviceOrderSchema } from "@/lib/validations/schemas"
import { Prisma } from "@/generated/prisma"
const Decimal = Prisma.Decimal

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true, year: true, color: true } },
      mechanic: { select: { id: true, name: true } },
      items: { include: { partner: { select: { name: true } } } },
    },
  })

  if (!order || (auth.ctx.role !== "super_admin" && order.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const order = await prisma.serviceOrder.findUnique({ where: { id } })
  if (!order || (auth.ctx.role !== "super_admin" && order.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }
  const body = await request.json()
  const parsed = serviceOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const editableStatuses = ["draft", "pending", "rejected"]
  if (!editableStatuses.includes(order.status)) {
    return NextResponse.json(
      { error: `NÃ£o Ã© possÃ­vel editar uma OS com status "${order.status}"` },
      { status: 400 }
    )
  }

  const invalidRelation = await validateServiceOrderRelations(order.tenantId, parsed.data)
  if (invalidRelation) return invalidRelation

  const items = parsed.data.items ?? []
  const itemsTotal = items.reduce((sum, item) => sum + item.unitValue * item.quantity, 0)

  const updated = await prisma.$transaction(async (tx) => {
    await tx.serviceOrderItem.deleteMany({ where: { serviceOrderId: id } })

    return tx.serviceOrder.update({
      where: { id },
      data: {
        vehicleId: parsed.data.vehicleId,
        mechanicId: parsed.data.mechanicId ?? null,
        description: parsed.data.description,
        notes: parsed.data.notes,
        discount: new Decimal(parsed.data.discount),
        totalValue: new Decimal(itemsTotal),
        items: {
          create: items.map((item) => ({
            tenantId: order.tenantId,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitValue: new Decimal(item.unitValue),
            totalValue: new Decimal(item.quantity * item.unitValue),
            partnerId: item.partnerId ?? null,
            partnerCost: item.partnerCost ? new Decimal(item.partnerCost) : null,
            inventoryItemId: item.inventoryItemId ?? null,
          })),
        },
      },
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        items: { include: { partner: { select: { name: true } } } },
      },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params

  const order = await prisma.serviceOrder.findUnique({ where: { id } })
  if (!order || (auth.ctx.role !== "super_admin" && order.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }

  if (order.type === "service_order" && order.status !== "cancelled") {
    return NextResponse.json({ error: "Apenas orçamentos ou OS canceladas podem ser excluídas" }, { status: 400 })
  }

  await prisma.serviceOrder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
