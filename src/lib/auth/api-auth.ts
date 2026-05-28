import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"

export interface AuthContext {
  userId: string
  tenantId: string
  role: string
}

export async function requireAuth(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    }
  }

  if (!session.user.tenantId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Usuário sem tenant associado" }, { status: 403 }),
    }
  }

  return {
    ok: true,
    ctx: {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      role: session.user.role,
    },
  }
}

export async function requireTenantAccess(
  requestedTenantId: string
): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult

  const { ctx } = authResult

  if (ctx.role === "super_admin") {
    return { ok: true, ctx }
  }

  if (ctx.tenantId !== requestedTenantId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado a este tenant" },
        { status: 403 }
      ),
    }
  }

  return { ok: true, ctx }
}

export async function requireRole(
  ...allowedRoles: string[]
): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult

  if (!allowedRoles.includes(authResult.ctx.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Permissão insuficiente" },
        { status: 403 }
      ),
    }
  }

  return { ok: true, ctx: authResult.ctx }
}
