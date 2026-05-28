import { prisma } from "@/lib/db/prisma"
import { partnerSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { partnerId } = await params

  const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
  if (!partner || (auth.ctx.role !== "super_admin" && partner.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Terceirizado não encontrado" }, { status: 404 })
  }

  return NextResponse.json(partner)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { partnerId } = await params
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
  if (!partner || (auth.ctx.role !== "super_admin" && partner.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Terceirizado não encontrado" }, { status: 404 })
  }
  const body = await request.json()
  const parsed = partnerSchema.partial().safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const updated = await prisma.partner.update({
    where: { id: partnerId },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { partnerId } = await params
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
  if (!partner || (auth.ctx.role !== "super_admin" && partner.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Terceirizado não encontrado" }, { status: 404 })
  }

  await prisma.partner.delete({ where: { id: partnerId } })
  return NextResponse.json({ ok: true })
}
