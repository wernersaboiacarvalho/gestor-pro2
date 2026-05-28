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

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

  // Prisma Accelerate — quando configurar no console.prisma.io:
  // 1. Remova o `pool`, `adapter` e `PrismaPg` acima
  // 2. Descomente as linhas abaixo
  // 3. Defina DATABASE_URL com o protocolo prisma+postgres://
  //
  // import { withAccelerate } from "@prisma/extension-accelerate"
  // const client = new PrismaClient().$extends(withAccelerate())

  return client
}

export const prisma =
  globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
