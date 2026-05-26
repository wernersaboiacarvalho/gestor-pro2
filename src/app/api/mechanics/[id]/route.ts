import { prisma } from "@/lib/db/prisma"
import { mechanicSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const mechanic = await prisma.mechanic.findUnique({ where: { id } })
  if (!mechanic) return NextResponse.json({ error: "Mecânico não encontrado" }, { status: 404 })
  return NextResponse.json(mechanic)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = mechanicSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const mechanic = await prisma.mechanic.update({ where: { id }, data: parsed.data })
  return NextResponse.json(mechanic)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.mechanic.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
