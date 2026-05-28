import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

export type AuthenticatedContext = {
  userId: string
  tenantId: string
  role: string
}

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

export async function requireAdminContext(): Promise<{ userId: string; role: string }> {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "super_admin") {
    redirect("/login")
  }

  return { userId: session.user.id, role: session.user.role }
}
