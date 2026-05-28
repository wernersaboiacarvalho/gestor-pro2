import { prisma } from "@/lib/db/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number }> = {}

  // Database check
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart }
  } catch {
    checks.database = { status: "error", latencyMs: Date.now() - dbStart }
  }

  // Redis check (optional)
  try {
    const { redis } = await import("@/lib/db/redis")
    if (redis) {
      const redisStart = Date.now()
      await redis.ping()
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart }
    } else {
      checks.redis = { status: "disabled" }
    }
  } catch {
    checks.redis = { status: "error" }
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === "ok" || c.status === "disabled"
  )

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
