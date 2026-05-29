import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role!
        token.tenantId = user.tenantId!
        token.sessionVersion = 1

        // Cache session version in Redis on login
        try {
          const { redis } = await import("@/lib/db/redis")
          if (redis) {
            await redis.setex(`session:${user.id}`, 86400, 1)
          }
        } catch { /* non-critical */ }
      }

      // Validate session version via Redis (lightweight, no pg)
      if (token.id && token.sessionVersion !== undefined) {
        try {
          const { redis } = await import("@/lib/db/redis")
          if (redis) {
            const current = await redis.get(`session:${token.id}`)
            if (current !== null && Number(current) !== token.sessionVersion) {
              return {} as typeof token
            }
          }
        } catch { /* allow on cache miss */ }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | undefined
      }
      return session
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register")
      const isPublicPage =
        isAuthPage ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password") ||
        nextUrl.pathname.startsWith("/invite")
      const isSuperAdmin = auth?.user?.role === "super_admin"

      if (isPublicPage) {
        if (isLoggedIn && isAuthPage) {
          if (isSuperAdmin) return Response.redirect(new URL("/admin/dashboard", nextUrl))
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl))

      if (nextUrl.pathname.startsWith("/admin") && !isSuperAdmin) {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
  },
  providers: [],
}
