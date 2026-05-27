import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const [totalTenants, activeTenants, totalUsers, totalOrders, totalRevenue] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "active" } }),
    prisma.user.count({ where: { role: { not: "super_admin" } } }),
    prisma.serviceOrder.count(),
    prisma.financialRecord.aggregate({
      where: { type: "receivable", status: "paid" },
      _sum: { value: true },
    }),
  ])

  return NextResponse.json({
    totalTenants,
    activeTenants,
    totalUsers,
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.value ?? 0),
  })
}
