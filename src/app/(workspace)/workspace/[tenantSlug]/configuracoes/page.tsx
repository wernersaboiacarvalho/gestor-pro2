import { getTenantContext } from "@/lib/auth/tenant-context"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { SettingsForm } from "./settings-form"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function ConfiguracoesPage({ params }: Props) {
  const { tenantSlug } = await params
  const session = await auth()
  const tenant = await getTenantContext(tenantSlug)

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie as configurações da sua oficina</p>
      </div>

      <SettingsForm
        tenant={{ id: tenant.id, name: tenant.name, businessType: tenant.businessType }}
        user={{ name: user?.name ?? "", email: user?.email ?? "" }}
      />
    </div>
  )
}
