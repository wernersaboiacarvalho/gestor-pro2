import { prisma } from "@/lib/db/prisma"
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

  const [receivable, payable, overdue] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { tenantId, type: "receivable", status: { not: "cancelled" } },
      _sum: { value: true },
    }),
    prisma.financialRecord.aggregate({
      where: { tenantId, type: "payable", status: { not: "cancelled" } },
      _sum: { value: true },
    }),
    prisma.financialRecord.findMany({
      where: {
        tenantId,
        status: "pending",
        dueDate: { lt: new Date() },
      },
      select: { id: true, description: true, value: true, dueDate: true, type: true },
      orderBy: { dueDate: "asc" },
    }),
  ])

  return NextResponse.json({
    receivableTotal: Number(receivable._sum.value ?? 0),
    payableTotal: Number(payable._sum.value ?? 0),
    overdue,
  })
}
