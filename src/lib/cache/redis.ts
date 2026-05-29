import { redis } from "@/lib/db/redis"

function cacheKey(tenantId: string, entity: string, suffix = "") {
  return `cache:${tenantId}:${entity}${suffix ? `:${suffix}` : ""}`
}

export async function getCached<T>(tenantId: string, entity: string, suffix = ""): Promise<T | null> {
  if (!redis) return null
  try {
    const key = cacheKey(tenantId, entity, suffix)
    const data = await redis.get<T>(key)
    return data
  } catch {
    return null
  }
}

export async function setCache<T>(tenantId: string, entity: string, data: T, ttl = 30, suffix = ""): Promise<void> {
  if (!redis) return
  try {
    const key = cacheKey(tenantId, entity, suffix)
    await redis.setex(key, ttl, JSON.parse(JSON.stringify(data)))
  } catch {
    // cache write failures are non-critical
  }
}

export async function invalidateCache(tenantId: string, entity: string): Promise<void> {
  if (!redis) return
  try {
    const pattern = cacheKey(tenantId, entity, "*")
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // non-critical
  }
}

export function hashForCache(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
