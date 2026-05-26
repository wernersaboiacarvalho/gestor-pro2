import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { type, quantity, description } = await request.json()

  if (!type || !["in", "out"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido (in/out)" }, { status: 400 })
  }
  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 })
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })

  if (type === "out" && item.quantity < quantity) {
    return NextResponse.json({ error: "Estoque insuficiente" }, { status: 400 })
  }

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        inventoryItemId: id,
        tenantId: item.tenantId,
        type,
        quantity,
        description: description ?? null,
      },
    }),
    prisma.inventoryItem.update({
      where: { id },
      data: { quantity: type === "in" ? { increment: quantity } : { decrement: quantity } },
    }),
  ])

  return NextResponse.json(movement, { status: 201 })
}
