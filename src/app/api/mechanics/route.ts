import { prisma } from "@/lib/db/prisma"
import { mechanicSchema } from "@/lib/validations/schemas"
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
      { specialty: { contains: q, mode: "insensitive" } },
    ]
  }

  const mechanics = await prisma.mechanic.findMany({
    where: where as Record<string, unknown>,
    orderBy: { name: "asc" },
  })

  return NextResponse.json(mechanics)
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
  const parsed = mechanicSchema.safeParse({ active: true, ...body })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const mechanic = await prisma.mechanic.create({
    data: { ...parsed.data, tenantId },
  })

  return NextResponse.json(mechanic, { status: 201 })
}
