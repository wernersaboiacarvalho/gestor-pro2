import { prisma } from "@/lib/db/prisma"
import { financialRecordSchema } from "@/lib/validations/schemas"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const q = searchParams.get("q")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const where: Record<string, unknown> = { tenantId }
  if (type && ["receivable", "payable"].includes(type)) where.type = type
  if (status && ["pending", "paid", "cancelled"].includes(status)) where.status = status
  if (q) where.description = { contains: q, mode: "insensitive" }

  const records = await prisma.financialRecord.findMany({
    where: where as Record<string, unknown>,
    orderBy: { dueDate: "asc" },
  })

  return NextResponse.json(records)
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = financialRecordSchema.safeParse({ status: "pending", ...body })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const record = await prisma.financialRecord.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      tenantId,
    },
  })

  return NextResponse.json(record, { status: 201 })
}
