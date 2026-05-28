import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/api-auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { id, action } = await params

  const order = await prisma.serviceOrder.findUnique({ where: { id } })
  if (!order || (auth.ctx.role !== "super_admin" && order.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }

  switch (action) {
    case "approve": {
      if (order.type !== "budget") {
        return NextResponse.json({ error: "Apenas orçamentos podem ser aprovados" }, { status: 400 })
      }
      if (order.status !== "sent") {
        return NextResponse.json({ error: "Apenas orçamentos enviados podem ser aprovados" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "approved", approvedAt: new Date() },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "convert": {
      if (order.type !== "budget" || order.status !== "approved") {
        return NextResponse.json({ error: "Apenas orçamentos aprovados podem virar OS" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { type: "service_order", status: "pending", startedAt: new Date() },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "reject": {
      if (order.type !== "budget" || order.status !== "sent") {
        return NextResponse.json({ error: "Apenas orçamentos enviados podem ser rejeitados" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "rejected" },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "send": {
      if (order.type !== "budget" || order.status !== "draft") {
        return NextResponse.json({ error: "Apenas orçamentos em rascunho podem ser enviados" }, { status: 400 })
      }
      if (Number(order.totalValue) <= 0) {
        return NextResponse.json({ error: "Adicione itens ao orçamento antes de enviar" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "sent" },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "start": {
      if (order.type !== "service_order" || order.status !== "pending") {
        return NextResponse.json({ error: "Apenas OS pendentes podem ser iniciadas" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "in_progress", startedAt: order.startedAt ?? new Date() },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "complete": {
      if (order.type !== "service_order" || order.status !== "in_progress") {
        return NextResponse.json({ error: "Apenas OS em andamento podem ser concluídas" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "completed", completedAt: new Date() },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "deliver": {
      if (order.type !== "service_order" || order.status !== "completed") {
        return NextResponse.json({ error: "Apenas OS concluídas podem ser entregues" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "delivered", deliveredAt: new Date() },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    case "cancel": {
      if (order.status === "delivered" || order.status === "cancelled") {
        return NextResponse.json({ error: "Não é possível cancelar esta ordem" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "cancelled" },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      return NextResponse.json(updated)
    }

    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  }
}
