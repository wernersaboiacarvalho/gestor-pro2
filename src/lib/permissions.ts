export type Role = "super_admin" | "admin" | "mecanico" | "administrativo" | "user"

export type Permission =
  | "customers.view" | "customers.create" | "customers.edit" | "customers.delete"
  | "vehicles.view" | "vehicles.create" | "vehicles.edit" | "vehicles.delete"
  | "orders.view" | "orders.create" | "orders.edit" | "orders.delete" | "orders.status"
  | "mechanics.view" | "mechanics.create" | "mechanics.edit" | "mechanics.delete"
  | "partners.view" | "partners.create" | "partners.edit" | "partners.delete"
  | "inventory.view" | "inventory.create" | "inventory.edit" | "inventory.delete" | "inventory.movement"
  | "suppliers.view" | "suppliers.create" | "suppliers.edit" | "suppliers.delete"
  | "financial.view" | "financial.create" | "financial.edit" | "financial.delete" | "financial.status"
  | "reports.view"
  | "settings.view" | "settings.edit"
  | "users.view" | "users.create" | "users.edit" | "users.delete"

const rolePermissions: Record<Role, Permission[]> = {
  super_admin: [
    "customers.view", "customers.create", "customers.edit", "customers.delete",
    "vehicles.view", "vehicles.create", "vehicles.edit", "vehicles.delete",
    "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status",
    "mechanics.view", "mechanics.create", "mechanics.edit", "mechanics.delete",
    "partners.view", "partners.create", "partners.edit", "partners.delete",
    "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.movement",
    "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete",
    "financial.view", "financial.create", "financial.edit", "financial.delete", "financial.status",
    "reports.view",
    "settings.view", "settings.edit",
    "users.view", "users.create", "users.edit", "users.delete",
  ],
  admin: [
    "customers.view", "customers.create", "customers.edit", "customers.delete",
    "vehicles.view", "vehicles.create", "vehicles.edit", "vehicles.delete",
    "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status",
    "mechanics.view", "mechanics.create", "mechanics.edit", "mechanics.delete",
    "partners.view", "partners.create", "partners.edit", "partners.delete",
    "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.movement",
    "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete",
    "financial.view", "financial.create", "financial.edit", "financial.delete", "financial.status",
    "reports.view",
    "settings.view", "settings.edit",
    "users.view", "users.create", "users.edit", "users.delete",
  ],
  mecanico: [
    "customers.view",
    "vehicles.view",
    "orders.view", "orders.edit", "orders.status",
    "mechanics.view",
    "partners.view",
    "inventory.view",
    "suppliers.view",
  ],
  administrativo: [
    "customers.view", "customers.create", "customers.edit",
    "vehicles.view", "vehicles.create", "vehicles.edit",
    "orders.view",
    "financial.view", "financial.create", "financial.edit", "financial.status",
    "reports.view",
    "inventory.view",
  ],
  user: [
    "customers.view",
    "vehicles.view",
    "orders.view",
    "inventory.view",
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: Role, ...permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}
