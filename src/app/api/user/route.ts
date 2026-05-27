import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { NextResponse } from "next/server"

const profileSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Mínimo 6 caracteres").optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, tenantId: true },
  })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await request.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const data: Record<string, unknown> = {}

  if (parsed.data.name) data.name = parsed.data.name

  if (parsed.data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

    const isValid = await bcrypt.compare(parsed.data.currentPassword ?? "", user.password)
    if (!isValid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })

    data.password = await bcrypt.hash(parsed.data.newPassword, 12)
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(user)
}
