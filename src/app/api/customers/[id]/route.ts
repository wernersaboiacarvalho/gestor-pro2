import { prisma } from "@/lib/db/prisma"
import { customerSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { vehicles: { select: { id: true, plate: true, brand: true, model: true, year: true } } },
  })
  if (!customer || (auth.ctx.role !== "super_admin" && customer.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
  }
  return NextResponse.json(customer)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer || (auth.ctx.role !== "super_admin" && customer.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
  }
  const body = await request.json()
  const parsed = customerSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const updated = await prisma.customer.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id } = await params
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer || (auth.ctx.role !== "super_admin" && customer.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
  }
  await prisma.customer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
