import { prisma } from "@/lib/db/prisma"
import { vehicleSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { customer: { select: { name: true } } },
  })
  if (!vehicle) return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
  return NextResponse.json(vehicle)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = vehicleSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const vehicle = await prisma.vehicle.update({ where: { id }, data: parsed.data })
  return NextResponse.json(vehicle)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.vehicle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
