import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true, year: true, color: true } },
      mechanic: { select: { id: true, name: true } },
      items: { include: { partner: { select: { name: true } } } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { items, ...data } = body

  const order = await prisma.serviceOrder.update({
    where: { id },
    data: {
      ...data,
      ...(items ? {
        items: {
          deleteMany: {},
          create: items.map((item: { type: string; description: string; quantity: number; unitValue: number; tenantId: string; partnerId?: string | null; partnerCost?: number | null; inventoryItemId?: string | null }) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitValue: item.unitValue,
            tenantId: item.tenantId,
            totalValue: item.quantity * item.unitValue,
            partnerId: item.partnerId ?? null,
            partnerCost: item.partnerCost ?? null,
            inventoryItemId: item.inventoryItemId,
          })),
        },
      } : {}),
    },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      items: { include: { partner: { select: { name: true } } } },
    },
  })

  return NextResponse.json(order)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const order = await prisma.serviceOrder.findUnique({ where: { id } })
  if (!order) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }

  if (order.type === "service_order" && order.status !== "cancelled") {
    return NextResponse.json({ error: "Apenas orçamentos ou OS canceladas podem ser excluídas" }, { status: 400 })
  }

  await prisma.serviceOrder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
