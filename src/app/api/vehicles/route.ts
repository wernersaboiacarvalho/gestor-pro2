import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get("tenantId")

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório" }, { status: 400 })
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { tenantId },
    select: { id: true, plate: true, brand: true, model: true },
    orderBy: { plate: "asc" },
  })

  return NextResponse.json(vehicles)
}
