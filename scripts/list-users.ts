import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { not: "super_admin" } },
    include: { tenant: { select: { name: true, slug: true, businessType: true, status: true } } },
    orderBy: [{ tenant: { name: "asc" } }, { role: "asc" }],
  })

  console.log("=".repeat(70))
  console.log("  USUÁRIOS DOS TENANTS")
  console.log("  Senha padrão: 123456")
  console.log("=".repeat(70))

  for (const u of users) {
    const tenant = u.tenant!
    console.log(
      `  ${tenant.name.padEnd(22)} ` +
      `${(u.email).padEnd(35)} ` +
      `${u.role.padEnd(12)} ` +
      `${tenant.status}`
    )
  }

  console.log("=".repeat(70))
  console.log(`  Total: ${users.length} usuários em ${new Set(users.map(u => u.tenant?.slug)).size} tenants`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
