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

  const cached = await redis.get<TenantContext>(cacheKey)
  if (cached) return cached

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true, status: true, businessType: true },
  })

  if (!tenant || tenant.status !== "active") {
    throw new Error("Tenant not found or inactive")
  }

  await redis.setex(cacheKey, 300, JSON.stringify(tenant))
  return tenant
}

export async function invalidateTenantCache(slug: string) {
  await redis.del(`tenant:${slug}`)
}
