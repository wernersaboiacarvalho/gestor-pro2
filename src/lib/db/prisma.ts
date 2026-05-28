import { PrismaClient } from "@/generated/prisma"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
}

function makePrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

  // Prisma Accelerate — descomente as linhas abaixo quando configurar
  // o Accelerate no console.prisma.io e definir DATABASE_URL com
  // o protocolo prisma+postgres://:
  //
  // import { withAccelerate } from "@prisma/extension-accelerate"
  // return client.$extends(withAccelerate())

  return client
}

export const prisma =
  globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
