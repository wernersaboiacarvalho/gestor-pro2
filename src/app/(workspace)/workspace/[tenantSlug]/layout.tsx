import { getTenantContext } from "@/lib/auth/tenant-context"
import { auth } from "@/lib/auth/auth"
import { WorkspaceShell } from "@/components/workspace/sidebar"

interface Props {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const { tenantSlug } = await params
  const session = await auth()
  const tenant = await getTenantContext(tenantSlug)

  if (session?.user?.role !== "super_admin" && session?.user?.tenantId !== tenant.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Acesso não autorizado a este workspace.</p>
      </div>
    )
  }

  return (
    <WorkspaceShell tenant={tenant}>
      {children}
    </WorkspaceShell>
  )
}
