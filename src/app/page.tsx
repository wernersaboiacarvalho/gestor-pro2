import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role === "super_admin") {
    redirect("/admin/dashboard")
  }

  if (session.user.tenantId) {
    const tenant = await import("@/lib/db/prisma").then(({ prisma }) =>
      prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { slug: true },
      })
    )
    if (tenant) {
      redirect(`/workspace/${tenant.slug}/dashboard`)
    }
  }

  redirect("/api/auth/signout?callbackUrl=/login")
}
