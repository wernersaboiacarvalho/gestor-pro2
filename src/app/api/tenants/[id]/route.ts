import { prisma } from "@/lib/db/prisma"
import { tenantSchema } from "@/lib/validations/schemas"
import { requireRole } from "@/lib/auth/api-auth"
import { NextResponse } from "next/server"
import { invalidateTenantCache } from "@/lib/auth/tenant-context"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole("super_admin")
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  const parsed = tenantSchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const tenant = await prisma.tenant.update({ where: { id }, data: parsed.data })

  await invalidateTenantCache(tenant.slug)

  return NextResponse.json(tenant)
}
