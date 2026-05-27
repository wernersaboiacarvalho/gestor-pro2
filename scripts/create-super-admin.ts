import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { hash } from "bcryptjs"
import "dotenv/config"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const pw = await hash("123456", 10)
  const user = await prisma.user.upsert({
    where: { email: "super@admin.com" },
    update: {},
    create: {
      email: "super@admin.com",
      password: pw,
      name: "Super Admin",
      role: "super_admin",
    },
  })
  console.log("Super admin criado:", user.email, user.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
