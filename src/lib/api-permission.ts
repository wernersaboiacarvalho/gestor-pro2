import { NextResponse } from "next/server"
import { requireAuth, type AuthContext } from "@/lib/auth/api-auth"
import { hasPermission, type Permission } from "@/lib/permissions"

export async function requirePermission(
  permission: Permission
): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }
> {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult

  if (!hasPermission(authResult.ctx.role as never, permission)) {
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
