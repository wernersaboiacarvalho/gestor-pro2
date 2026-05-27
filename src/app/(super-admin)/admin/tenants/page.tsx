import { prisma } from "@/lib/db/prisma"
import { TenantActions } from "./tenant-actions"

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function TenantsPage({ searchParams }: Props) {
  const { q, status } = await searchParams

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ]
  }
  if (status && ["active", "suspended", "cancelled"].includes(status)) where.status = status

  const tenants = await prisma.tenant.findMany({
    where: where as Record<string, unknown>,
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Gerenciar Tenants</h1>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <input name="q" defaultValue={q} placeholder="Buscar por nome ou slug..." className="w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-900" />
        </div>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-900">
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="suspended">Suspensos</option>
          <option value="cancelled">Cancelados</option>
        </select>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Buscar
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <p className="text-sm text-muted-foreground">Nenhum tenant encontrado</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Usuários</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.slug}</td>
                  <td className="px-4 py-3 text-xs">{t.plan}</td>
                  <td className="px-4 py-3">{t._count.users}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : t.status === "suspended" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}>
                      {t.status === "active" ? "Ativo" : t.status === "suspended" ? "Suspenso" : "Cancelado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.createdAt.toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <TenantActions tenantId={t.id} currentStatus={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
