import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const tenantId = auth.ctx.tenantId
  const take = 5

  const [customers, vehicles, serviceOrders, suppliers, inventoryItems] = await Promise.all([
    prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { cpf: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      select: { id: true, name: true, phone: true },
    }),
    prisma.vehicle.findMany({
      where: {
        tenantId,
        OR: [
          { plate: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      select: { id: true, plate: true, brand: true, model: true },
    }),
    prisma.serviceOrder.findMany({
      where: {
        tenantId,
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      select: { id: true, orderNumber: true, description: true, status: true, type: true },
    }),
    prisma.supplier.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { cnpj: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      select: { id: true, name: true, cnpj: true },
    }),
    prisma.inventoryItem.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      take,
      select: { id: true, name: true, sku: true, quantity: true },
    }),
  ])

  const results = [
    ...customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      title: c.name,
      subtitle: c.phone ?? "",
      href: `clientes/${c.id}`,
    })),
    ...vehicles.map((v) => ({
      type: "vehicle" as const,
      id: v.id,
      title: `${v.plate} — ${v.brand} ${v.model}`,
      subtitle: "",
      href: `veiculos/${v.id}`,
    })),
    ...serviceOrders.map((o) => ({
      type: "order" as const,
      id: o.id,
      title: `#${o.orderNumber}`,
      subtitle: o.description.substring(0, 50),
      href: `ordens-servico/${o.id}`,
    })),
    ...suppliers.map((s) => ({
      type: "supplier" as const,
      id: s.id,
      title: s.name,
      subtitle: s.cnpj ?? "",
      href: `fornecedores/${s.id}`,
    })),
    ...inventoryItems.map((i) => ({
      type: "inventory" as const,
      id: i.id,
      title: i.name,
      subtitle: i.sku ?? `Qtd: ${i.quantity}`,
      href: `estoque/${i.id}`,
    })),
  ]

  return NextResponse.json(results)
}
