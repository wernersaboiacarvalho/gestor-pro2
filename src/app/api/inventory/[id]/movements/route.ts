import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const { type, quantity, description } = await request.json()

  if (!type || !["in", "out"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido (in/out)" }, { status: 400 })
  }
  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 })
  }

  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item || (auth.ctx.role !== "super_admin" && item.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
  }

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
