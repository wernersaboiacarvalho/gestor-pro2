import { prisma } from "@/lib/db/prisma"
import { mechanicSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const mechanic = await prisma.mechanic.findUnique({ where: { id } })
  if (!mechanic || (auth.ctx.role !== "super_admin" && mechanic.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Mecânico não encontrado" }, { status: 404 })
  }
  return NextResponse.json(mechanic)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const mechanic = await prisma.mechanic.findUnique({ where: { id } })
  if (!mechanic || (auth.ctx.role !== "super_admin" && mechanic.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Mecânico não encontrado" }, { status: 404 })
  }
  const body = await request.json()
  const parsed = mechanicSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const updated = await prisma.mechanic.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const mechanic = await prisma.mechanic.findUnique({ where: { id } })
  if (!mechanic || (auth.ctx.role !== "super_admin" && mechanic.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Mecânico não encontrado" }, { status: 404 })
  }
  await prisma.mechanic.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
