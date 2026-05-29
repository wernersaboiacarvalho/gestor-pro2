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
      const isSuperAdmin = auth?.user?.role === "super_admin"

      if (isAuthPage) {
        if (isLoggedIn) {
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
