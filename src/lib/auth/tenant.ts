import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

export type AuthenticatedContext = {
  userId: string
  tenantId: string
  role: string
}

/**
 * Use em toda Server Action que precisa de tenant.
 * Redireciona para /login se não autenticado ou sem tenant.
 * Nunca retorna sem tenantId.
 */
export async function requireTenantContext(): Promise<AuthenticatedContext> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (!session.user.tenantId) {
    redirect("/login")
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  }
}

/**
 * Use em Server Actions exclusivas do painel super_admin.
 */
export async function requireAdminContext(): Promise<{
  userId: string
  role: "super_admin"
}> {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "super_admin") {
    redirect("/login")
  }

  return { userId: session.user.id, role: "super_admin" }
}
