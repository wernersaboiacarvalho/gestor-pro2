import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { prisma } from "@/lib/db/prisma"
import { redis } from "@/lib/db/redis"

async function checkRateLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) return false
  const key = `rate_limit:login:${identifier}`
  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000))
  }
  return current > limit
}

async function getClientIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers")
    const h = await headers()
    return (h.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim()
  } catch {
    return "127.0.0.1"
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        // Rate limiting
        const ip = await getClientIp()
        const isBlocked = await checkRateLimit(email, 10, 15 * 60 * 1000)
        const isIpBlocked = await checkRateLimit(`ip:${ip}`, 20, 15 * 60 * 1000)
        if (isBlocked || isIpBlocked) {
          throw new Error("Muitas tentativas. Tente novamente em alguns minutos.")
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, password: true, role: true, tenantId: true, active: true },
        })

        if (!user || !user.active) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        // Clear rate limit on success
        if (redis) {
          await Promise.all([
            redis.del(`rate_limit:login:${email}`),
            redis.del(`rate_limit:login:ip:${ip}`),
          ])
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId ?? undefined,
        }
      },
    }),
  ],
})
