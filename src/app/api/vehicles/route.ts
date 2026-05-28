import { prisma } from "@/lib/db/prisma"
import { vehicleSchema } from "@/lib/validations/schemas"
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
      { plate: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
    ]
  }

  const vehicles = await prisma.vehicle.findMany({
    where: where as Record<string, unknown>,
    include: { customer: { select: { name: true } } },
    orderBy: { plate: "asc" },
  })

  return NextResponse.json(vehicles)
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
  const parsed = vehicleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const vehicle = await prisma.vehicle.create({
    data: { ...parsed.data, tenantId },
  })

  return NextResponse.json(vehicle, { status: 201 })
}
