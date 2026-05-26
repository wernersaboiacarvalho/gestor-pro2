import { redis } from "@/lib/db/redis"

const DEFAULT_TTL = 60

const TTL_MAP: Record<string, number> = {
  tenant: 300,
  session: 1800,
  list: 60,
  dashboard: 120,
}

export function ttl(key: string): number {
  const prefix = key.split(":")[0]
  return TTL_MAP[prefix] ?? DEFAULT_TTL
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    return data ?? null
  } catch {
    return null
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  await redis.setex(key, ttl(key), JSON.stringify(data))
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

export function cacheKey(...parts: string[]): string {
  return parts.join(":")
}
