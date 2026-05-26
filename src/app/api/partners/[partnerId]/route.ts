import { prisma } from "@/lib/db/prisma"
import { partnerSchema } from "@/lib/validations/schemas"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params

  const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
  if (!partner) {
    return NextResponse.json({ error: "Terceirizado não encontrado" }, { status: 404 })
  }

  return NextResponse.json(partner)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params
  const body = await request.json()
  const parsed = partnerSchema.partial().safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: parsed.data,
  })

  return NextResponse.json(partner)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params

  await prisma.partner.delete({ where: { id: partnerId } })
  return NextResponse.json({ ok: true })
}
