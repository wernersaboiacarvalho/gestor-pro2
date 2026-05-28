import { getTenantContext } from "@/lib/auth/tenant-context"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { SettingsForm } from "./settings-form"
import Link from "next/link"
import { Shield } from "lucide-react"

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function ConfiguracoesPage({ params }: Props) {
  const { tenantSlug } = await params
  const session = await auth()
  const tenant = await getTenantContext(tenantSlug)

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true },
  })

  const isAdmin = user?.role === "admin" || user?.role === "super_admin"

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

      {isAdmin && (
        <div className="mt-8">
          <Link
            href={`/workspace/${tenantSlug}/configuracoes/auditoria`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium transition-all hover:border-primary/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Shield className="size-4 text-muted-foreground" />
            <div className="text-left">
              <div>Auditoria</div>
              <div className="text-xs text-muted-foreground">Visualizar histórico de ações</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
