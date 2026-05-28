import { prisma } from "@/lib/db/prisma"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const result = await prisma.inventoryItem.findMany({
    where: { tenantId, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  })

  const categories = result.map((r) => r.category).filter(Boolean)
  return NextResponse.json(categories)
}
