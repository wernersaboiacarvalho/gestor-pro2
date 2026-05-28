import { prisma } from "@/lib/db/prisma"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const role = searchParams.get("role")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const where: Record<string, unknown> = { tenantId }
  if (role) where.role = role

  const users = await prisma.user.findMany({
    where: where as Record<string, unknown>,
    select: { id: true, name: true, role: true, email: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}
