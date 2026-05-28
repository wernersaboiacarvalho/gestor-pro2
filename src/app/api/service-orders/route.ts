import { prisma } from "@/lib/db/prisma"
import { serviceOrderSchema } from "@/lib/validations/schemas"
import { requireTenantAccess } from "@/lib/auth/api-auth"
import type { Prisma } from "@/generated/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")
  const type = searchParams.get("type") // "budget" | "service_order"
  const status = searchParams.get("status")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const auth = await requireTenantAccess(tenantId)
  if (!auth.ok) return auth.response

  const where: Prisma.ServiceOrderWhereInput = { tenantId }
  if (type) where.type = type as "budget" | "service_order"
  if (status) where.status = status as string

  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      mechanic: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
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
  const parsed = serviceOrderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { items, ...data } = parsed.data

  // Generate order number
  const today = new Date()
  const prefix = `OS-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`
  const lastOrder = await prisma.serviceOrder.findFirst({
    where: { tenantId, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  })
  const seq = lastOrder ? parseInt(lastOrder.orderNumber.split("-").pop()!) + 1 : 1
  const orderNumber = `${prefix}-${String(seq).padStart(4, "0")}`

  const totalValue = items?.reduce((sum, item) => sum + item.quantity * item.unitValue, 0) ?? 0

  const order = await prisma.serviceOrder.create({
    data: {
      ...data,
      tenantId,
      orderNumber,
      totalValue,
      items: items?.length ? {
          create: items.map((item) => ({
          ...item,
          tenantId,
          totalValue: item.quantity * item.unitValue,
          partnerId: item.partnerId ?? null,
          partnerCost: item.partnerCost ?? null,
        })),
      } : undefined,
    },
    include: {
      vehicle: { select: { plate: true, brand: true, model: true } },
      items: true,
    },
  })

  return NextResponse.json(order, { status: 201 })
}
