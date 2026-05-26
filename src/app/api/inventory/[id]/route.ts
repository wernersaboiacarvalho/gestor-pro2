import { prisma } from "@/lib/db/prisma"
import { inventorySchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { supplier: { select: { name: true } }, movements: { orderBy: { createdAt: "desc" }, take: 20 } },
  })
  if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = inventorySchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const item = await prisma.inventoryItem.update({ where: { id }, data: parsed.data })
  return NextResponse.json(item)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.inventoryItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
