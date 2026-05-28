import { prisma } from "@/lib/db/prisma"
import { customerSchema } from "@/lib/validations/schemas"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const q = searchParams.get("q")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const where: Record<string, unknown> = { tenantId }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where: where as Record<string, unknown>,
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(customers)
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
  const parsed = customerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const customer = await prisma.customer.create({
    data: { ...parsed.data, tenantId },
  })

  return NextResponse.json(customer, { status: 201 })
}
