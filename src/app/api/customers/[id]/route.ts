import { prisma } from "@/lib/db/prisma"
import { customerSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { vehicles: { select: { id: true, plate: true, brand: true, model: true, year: true } } },
  })
  if (!customer) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = customerSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const customer = await prisma.customer.update({ where: { id }, data: parsed.data })
  return NextResponse.json(customer)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.customer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
