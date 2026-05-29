import "next-auth"
import "@auth/core/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      tenantId?: string
    }
  }

  interface User {
    role: string
    tenantId?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: string
    tenantId?: string
    sessionVersion?: number
  }
}
