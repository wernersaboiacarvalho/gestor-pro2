import { prisma } from "@/lib/db/prisma"
import { redis } from "@/lib/db/redis"

interface TenantContext {
  id: string
  name: string
  slug: string
  status: string
  businessType: string
}

export async function getTenantContext(tenantSlug: string): Promise<TenantContext> {
  const cacheKey = `tenant:${tenantSlug}`

  if (redis) {
    try {
      const cached = await redis.get<TenantContext>(cacheKey)
      if (cached) return cached
    } catch {
      // cache miss
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, status: true, businessType: true },
  })

  if (!tenant || tenant.status !== "active") {
    throw new Error("Tenant not found or inactive")
  }

  if (redis) {
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(tenant))
    } catch {
      // non-critical
    }
  }

  return tenant
}

export async function invalidateTenantCache(slug: string) {
  if (redis) {
    try {
      await redis.del(`tenant:${slug}`)
    } catch {
      // non-critical
    }
  }
}
