import { describe, it, expect } from "vitest"
import { hasPermission, hasAnyPermission, type Role } from "@/lib/permissions"

describe("permissions", () => {
  describe("hasPermission", () => {
    it("admin has all permissions", () => {
      const adminPerms = [
        "customers.view", "customers.create", "customers.edit", "customers.delete",
        "vehicles.view", "vehicles.create", "vehicles.edit", "vehicles.delete",
        "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status",
        "financial.view", "financial.create", "financial.edit", "financial.delete",
        "inventory.view", "inventory.create", "inventory.edit", "inventory.delete",
        "reports.view", "settings.view", "settings.edit",
        "users.view", "users.create", "users.edit", "users.delete",
      ] as const

      for (const perm of adminPerms) {
        expect(hasPermission("admin", perm)).toBe(true)
      }
    })

    it("mecanico can view orders but not financial", () => {
      expect(hasPermission("mecanico", "orders.view")).toBe(true)
      expect(hasPermission("mecanico", "orders.edit")).toBe(true)
      expect(hasPermission("mecanico", "orders.status")).toBe(true)
      expect(hasPermission("mecanico", "financial.view")).toBe(false)
      expect(hasPermission("mecanico", "financial.create")).toBe(false)
    })

    it("mecanico cannot delete orders", () => {
      expect(hasPermission("mecanico", "orders.delete")).toBe(false)
    })

    it("administrativo can view financial but not inventory edit", () => {
      expect(hasPermission("administrativo", "financial.view")).toBe(true)
      expect(hasPermission("administrativo", "financial.create")).toBe(true)
      expect(hasPermission("administrativo", "inventory.view")).toBe(true)
      expect(hasPermission("administrativo", "inventory.edit")).toBe(false)
      expect(hasPermission("administrativo", "inventory.delete")).toBe(false)
    })

    it("administrativo can view reports", () => {
      expect(hasPermission("administrativo", "reports.view")).toBe(true)
    })

    it("user has limited permissions", () => {
      expect(hasPermission("user", "customers.view")).toBe(true)
      expect(hasPermission("user", "vehicles.view")).toBe(true)
      expect(hasPermission("user", "orders.view")).toBe(true)
      expect(hasPermission("user", "customers.create")).toBe(false)
      expect(hasPermission("user", "orders.edit")).toBe(false)
      expect(hasPermission("user", "financial.view")).toBe(false)
    })

    it("unknown role has no permissions", () => {
      expect(hasPermission("unknown" as Role, "customers.view")).toBe(false)
    })
  })

  describe("hasAnyPermission", () => {
    it("returns true if user has at least one permission", () => {
      expect(hasAnyPermission("mecanico", "orders.view", "financial.view")).toBe(true)
    })

    it("returns false if user has none of the permissions", () => {
      expect(hasAnyPermission("user", "financial.view", "financial.create")).toBe(false)
    })
  })
})
