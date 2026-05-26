import { prisma } from "@/lib/db/prisma"
import { supplierSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
  return NextResponse.json(supplier)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = supplierSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data })
  return NextResponse.json(supplier)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.supplier.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
