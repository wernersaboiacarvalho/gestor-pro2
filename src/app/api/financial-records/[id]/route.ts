import { prisma } from "@/lib/db/prisma"
import { financialRecordSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const record = await prisma.financialRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = financialRecordSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.dueDate) data.dueDate = new Date(data.dueDate as string)

  // If marking as paid, set paidAt
  if (data.status === "paid") data.paidAt = new Date()

  const record = await prisma.financialRecord.update({ where: { id }, data })
  return NextResponse.json(record)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.financialRecord.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
