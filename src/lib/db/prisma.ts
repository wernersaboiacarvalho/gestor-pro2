import { PrismaClient } from "@/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
}

function makePrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma =
  globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
