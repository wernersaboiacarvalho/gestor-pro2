import { prisma } from "@/lib/db/prisma"
import { registerSchema } from "@/lib/validations/schemas"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, tenantName, tenantSlug } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 })
    }

    const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (existingTenant) {
      return NextResponse.json({ error: "Slug já está em uso" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          businessType: "workshop",
          plan: "free",
          status: "active",
        },
      })

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "admin",
          tenantId: tenant.id,
        },
      })

      return { tenant, user }
    })

    return NextResponse.json(
      {
        message: "Conta criada com sucesso!",
        tenant: { slug: result.tenant.slug },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
