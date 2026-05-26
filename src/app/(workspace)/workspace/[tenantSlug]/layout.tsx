import { getTenantContext } from "@/lib/auth/tenant-context"
import { auth } from "@/lib/auth/auth"

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
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white dark:bg-zinc-900 p-6 space-y-1">
        <div className="mb-6">
          <h2 className="text-lg font-bold">{tenant.name}</h2>
          <p className="text-sm text-zinc-500 capitalize">{tenant.businessType}</p>
        </div>
        <nav className="space-y-1">
          <a href={`/workspace/${tenantSlug}/dashboard`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Dashboard</a>
          <a href={`/workspace/${tenantSlug}/clientes`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Clientes</a>
          <a href={`/workspace/${tenantSlug}/veiculos`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Veículos</a>
          <a href={`/workspace/${tenantSlug}/ordens-servico`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Ordens de Serviço</a>
          <a href={`/workspace/${tenantSlug}/mecanicos`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Mecânicos</a>
          <a href={`/workspace/${tenantSlug}/estoque`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Estoque</a>
          <a href={`/workspace/${tenantSlug}/fornecedores`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Fornecedores</a>
          <a href={`/workspace/${tenantSlug}/financeiro`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Financeiro</a>
          <a href={`/workspace/${tenantSlug}/configuracoes`} className="block px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm">Configurações</a>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-zinc-50 dark:bg-zinc-950">{children}</main>
    </div>
  )
}
