import { prisma } from "@/lib/db/prisma"
import { inventorySchema } from "@/lib/validations/schemas"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const q = searchParams.get("q")
  const category = searchParams.get("category")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const where: Record<string, unknown> = { tenantId }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }
  if (category) where.category = category

  const items = await prisma.inventoryItem.findMany({
    where: where as Record<string, unknown>,
    include: { supplier: { select: { name: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(items)
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
  const parsed = inventorySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const item = await prisma.inventoryItem.create({ data: { ...parsed.data, tenantId } })
  return NextResponse.json(item, { status: 201 })
}
