import { prisma } from "@/lib/db/prisma"
import { partnerSchema } from "@/lib/validations/schemas"
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

  const partners = await prisma.partner.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(partners)
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
  const parsed = partnerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const partner = await prisma.partner.create({
    data: { ...parsed.data, tenantId },
  })

  return NextResponse.json(partner, { status: 201 })
}
