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
  const { userId } = auth.ctx

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order || (auth.ctx.role !== "super_admin" && order.tenantId !== auth.ctx.tenantId)) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 })
  }

  const now = new Date()

  async function logHistory(fromStatus: string | null, toStatus: string, notes?: string) {
    await prisma.serviceOrderHistory.create({
      data: {
        tenantId: order!.tenantId,
        serviceOrderId: order!.id,
        userId,
        action,
        fromStatus,
        toStatus,
        notes: notes ?? null,
      },
    })
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
        data: { status: "approved", approvedAt: now },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory("sent", "approved")
      return NextResponse.json(updated)
    }

    case "convert": {
      if (order.type !== "budget" || order.status !== "approved") {
        return NextResponse.json({ error: "Apenas orçamentos aprovados podem virar OS" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { type: "service_order", status: "pending", startedAt: now },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory("approved", "pending")
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
      await logHistory("sent", "rejected")
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
      await logHistory("draft", "sent")
      return NextResponse.json(updated)
    }

    case "start": {
      if (order.type !== "service_order" || order.status !== "pending") {
        return NextResponse.json({ error: "Apenas OS pendentes podem ser iniciadas" }, { status: 400 })
      }
      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "in_progress", startedAt: order.startedAt ?? now },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory("pending", "in_progress")
      return NextResponse.json(updated)
    }

    case "complete": {
      if (order.type !== "service_order" || order.status !== "in_progress") {
        return NextResponse.json({ error: "Apenas OS em andamento podem ser concluídas" }, { status: 400 })
      }

      // Deduct stock for parts with inventoryItemId
      const partsToDeduct = order.items.filter(
        (item) => item.type === "part" && item.inventoryItemId
      )

      if (partsToDeduct.length > 0) {
        // Check stock availability first
        for (const part of partsToDeduct) {
          const inventoryItem = await prisma.inventoryItem.findUnique({
            where: { id: part.inventoryItemId! },
          })
          if (!inventoryItem || inventoryItem.quantity < part.quantity) {
            return NextResponse.json(
              {
                error: `Estoque insuficiente para "${inventoryItem?.name ?? part.description}": disponível ${inventoryItem?.quantity ?? 0}, necessário ${part.quantity}`,
              },
              { status: 400 }
            )
          }
        }

        // Create stock movements and update quantities in a transaction
        await prisma.$transaction(async (tx) => {
          for (const part of partsToDeduct) {
            await tx.inventoryMovement.create({
              data: {
                tenantId: order!.tenantId,
                inventoryItemId: part.inventoryItemId!,
                type: "out",
                quantity: part.quantity,
                description: `Baixa automática - OS #${order!.orderNumber}`,
              },
            })
            await tx.inventoryItem.update({
              where: { id: part.inventoryItemId! },
              data: { quantity: { decrement: part.quantity } },
            })
          }
        })
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "completed", completedAt: now },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory("in_progress", "completed")
      return NextResponse.json(updated)
    }

    case "deliver": {
      if (order.type !== "service_order" || order.status !== "completed") {
        return NextResponse.json({ error: "Apenas OS concluídas podem ser entregues" }, { status: 400 })
      }

      // Generate financial records in a transaction
      const netValue = Number(order.totalValue) - Number(order.discount)

      await prisma.$transaction([
        // Receivable record (customer payment)
        prisma.financialRecord.create({
          data: {
            tenantId: order!.tenantId,
            type: "receivable",
            description: `OS #${order!.orderNumber} - ${order!.description}`,
            value: netValue,
            status: "pending",
            dueDate: (() => { const d = new Date(now); d.setDate(d.getDate() + 30); return d })(),
            category: "Serviços",
            serviceOrderId: order!.id,
          },
        }),
        // Payable records for partner costs
        ...order.items
          .filter((item) => item.partnerId && item.partnerCost)
          .map((item) =>
            prisma.financialRecord.create({
              data: {
                tenantId: order!.tenantId,
                type: "payable",
                description: `Terceirizado - OS #${order!.orderNumber} - ${item.description}`,
                value: Number(item.partnerCost!) * item.quantity,
                status: "pending",
                dueDate: (() => { const d = new Date(now); d.setDate(d.getDate() + 15); return d })(),
                category: "Terceirizados",
                serviceOrderId: order!.id,
              },
            })
          ),
      ])

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "delivered", deliveredAt: now },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory("completed", "delivered")
      return NextResponse.json(updated)
    }

    case "cancel": {
      if (order.status === "delivered" || order.status === "cancelled") {
        return NextResponse.json({ error: "Não é possível cancelar esta ordem" }, { status: 400 })
      }

      // Revert stock deductions if order was completed
      if (order.status === "completed") {
        const partsToRevert = order.items.filter(
          (item) => item.type === "part" && item.inventoryItemId
        )

        if (partsToRevert.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const part of partsToRevert) {
              await tx.inventoryMovement.create({
                data: {
                  tenantId: order!.tenantId,
                  inventoryItemId: part.inventoryItemId!,
                  type: "in",
                  quantity: part.quantity,
                  description: `Revertido por cancelamento - OS #${order!.orderNumber}`,
                },
              })
              await tx.inventoryItem.update({
                where: { id: part.inventoryItemId! },
                data: { quantity: { increment: part.quantity } },
              })
            }
          })
        }
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "cancelled" },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory(order.status, "cancelled")
      return NextResponse.json(updated)
    }

    case "reopen": {
      if (order.type !== "service_order") {
        return NextResponse.json({ error: "Apenas OS podem ser reabertas" }, { status: 400 })
      }
      if (order.status !== "cancelled") {
        return NextResponse.json({ error: "Apenas OS canceladas podem ser reabertas" }, { status: 400 })
      }

      // Revert stock deductions if they exist
      const partsToRevert = order.items.filter(
        (item) => item.type === "part" && item.inventoryItemId
      )

      if (partsToRevert.length > 0) {
        // Check if stock was already deducted (movements exist)
        const existingMovements = await prisma.inventoryMovement.findMany({
          where: {
            inventoryItemId: { in: partsToRevert.map((p) => p.inventoryItemId!) },
            description: { contains: `OS #${order.orderNumber}` },
            type: "out",
          },
        })

        if (existingMovements.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const part of partsToRevert) {
              await tx.inventoryMovement.create({
                data: {
                  tenantId: order!.tenantId,
                  inventoryItemId: part.inventoryItemId!,
                  type: "in",
                  quantity: part.quantity,
                  description: `Revertido por reabertura - OS #${order!.orderNumber}`,
                },
              })
              await tx.inventoryItem.update({
                where: { id: part.inventoryItemId! },
                data: { quantity: { increment: part.quantity } },
              })
            }
          })
        }
      }

      const updated = await prisma.serviceOrder.update({
        where: { id },
        data: { status: "pending", completedAt: null, deliveredAt: null },
        include: { vehicle: { select: { plate: true, brand: true, model: true } }, items: true },
      })
      await logHistory("cancelled", "pending", "OS reaberta")
      return NextResponse.json(updated)
    }

    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  }
}
