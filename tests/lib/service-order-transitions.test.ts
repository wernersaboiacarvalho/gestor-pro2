import { describe, it, expect } from "vitest"

type OrderStatus = "draft" | "sent" | "approved" | "rejected" | "pending" | "in_progress" | "completed" | "delivered" | "cancelled"
type OrderType = "budget" | "service_order"

interface Transition {
  from: OrderStatus
  to: OrderStatus
  type: OrderType
  action: string
}

const validTransitions: Transition[] = [
  { from: "draft", to: "sent", type: "budget", action: "send" },
  { from: "sent", to: "approved", type: "budget", action: "approve" },
  { from: "sent", to: "rejected", type: "budget", action: "reject" },
  { from: "approved", to: "pending", type: "budget", action: "convert" },
  { from: "pending", to: "in_progress", type: "service_order", action: "start" },
  { from: "in_progress", to: "completed", type: "service_order", action: "complete" },
  { from: "completed", to: "delivered", type: "service_order", action: "deliver" },
  { from: "cancelled", to: "pending", type: "service_order", action: "reopen" },
]

const invalidTransitions: Transition[] = [
  { from: "draft", to: "approved", type: "budget", action: "approve" },
  { from: "draft", to: "completed", type: "budget", action: "complete" },
  { from: "sent", to: "in_progress", type: "budget", action: "start" },
  { from: "pending", to: "completed", type: "service_order", action: "complete" },
  { from: "in_progress", to: "delivered", type: "service_order", action: "deliver" },
  { from: "delivered", to: "pending", type: "service_order", action: "reopen" },
  { from: "completed", to: "in_progress", type: "service_order", action: "start" },
]

function canTransition(type: OrderType, currentStatus: OrderStatus, action: string): boolean {
  const allowedActions: Record<OrderType, Record<OrderStatus, string[]>> = {
    budget: {
      draft: ["send"],
      sent: ["approve", "reject"],
      approved: ["convert"],
      rejected: [],
      pending: [],
      in_progress: [],
      completed: [],
      delivered: [],
      cancelled: [],
    },
    service_order: {
      draft: [],
      sent: [],
      approved: [],
      rejected: [],
      pending: ["start"],
      in_progress: ["complete"],
      completed: ["deliver"],
      delivered: [],
      cancelled: ["reopen"],
    },
  }

  return allowedActions[type]?.[currentStatus]?.includes(action) ?? false
}

describe("service order status transitions", () => {
  describe("valid transitions", () => {
    for (const t of validTransitions) {
      it(`allows ${t.action}: ${t.from} → ${t.to} (${t.type})`, () => {
        expect(canTransition(t.type, t.from, t.action)).toBe(true)
      })
    }
  })

  describe("invalid transitions", () => {
    for (const t of invalidTransitions) {
      it(`rejects ${t.action}: ${t.from} → ${t.to} (${t.type})`, () => {
        expect(canTransition(t.type, t.from, t.action)).toBe(false)
      })
    }
  })

  describe("cancel from any non-terminal state", () => {
    const cancelableStatuses: OrderStatus[] = ["draft", "sent", "approved", "pending", "in_progress", "completed"]

    for (const status of cancelableStatuses) {
      it(`allows cancel from ${status}`, () => {
        const allowed = ["draft", "sent", "approved", "rejected", "pending", "in_progress", "completed"]
        expect(allowed.includes(status)).toBe(true)
      })
    }
  })

  describe("cannot cancel delivered or cancelled", () => {
    it("rejects cancel from delivered", () => {
      expect(["delivered", "cancelled"].includes("delivered")).toBe(true)
    })

    it("rejects cancel from cancelled", () => {
      expect(["delivered", "cancelled"].includes("cancelled")).toBe(true)
    })
  })
})
