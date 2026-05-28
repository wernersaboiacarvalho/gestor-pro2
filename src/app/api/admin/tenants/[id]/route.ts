import { prisma } from "@/lib/db/prisma"
import { requireRole } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("super_admin")
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!status || !["active", "suspended", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 })
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, slug: true, status: true, plan: true, createdAt: true },
  })

  return NextResponse.json(tenant)
}
