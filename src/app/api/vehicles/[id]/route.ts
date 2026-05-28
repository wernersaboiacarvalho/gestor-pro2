import { prisma } from "@/lib/db/prisma"
import { vehicleSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { customer: { select: { name: true } } },
  })
  if (!vehicle || (auth.ctx.role !== "super_admin" && vehicle.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
  }
  return NextResponse.json(vehicle)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({ where: { id } })
  if (!vehicle || (auth.ctx.role !== "super_admin" && vehicle.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
  }
  const body = await request.json()
  const parsed = vehicleSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const updated = await prisma.vehicle.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({ where: { id } })
  if (!vehicle || (auth.ctx.role !== "super_admin" && vehicle.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
  }
  await prisma.vehicle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
