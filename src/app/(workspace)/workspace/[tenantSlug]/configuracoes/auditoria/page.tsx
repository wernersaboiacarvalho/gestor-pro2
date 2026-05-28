import { getTenantContext } from "@/lib/auth/tenant-context"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { Pagination } from "@/components/shared/pagination"
import { SearchInput } from "@/components/shared/search-input"
import { redirect } from "next/navigation"
import { Shield, Plus, Pencil, Trash2 } from "lucide-react"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ page?: string; entity?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  return { title: `Auditoria - ${tenantSlug}` }
}

const actionIcons = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
}

const actionLabels = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
}

const actionColors = {
  create: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
  update: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  delete: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
}

const entityLabels: Record<string, string> = {
  customer: "Cliente",
  vehicle: "Veículo",
  service_order: "Ordem de Serviço",
  inventory: "Estoque",
  financial_record: "Registro Financeiro",
}

export default async function AuditoriaPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { page: rawPage, entity } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const PAGE_SIZE = 20

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const tenant = await getTenantContext(tenantSlug)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    redirect(`/workspace/${tenantSlug}/configuracoes`)
  }

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (entity && entity !== "all") {
    where.entity = entity
  }

  const total = await prisma.auditLog.count({ where })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[]
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  }) : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const basePath = `/workspace/${tenantSlug}/configuracoes/auditoria`

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
            <p className="mt-1 text-sm text-muted-foreground">Histórico de ações realizadas no sistema</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            placeholder="Filtrar por entidade..."
            basePath={basePath}
            defaultValue={entity}
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <Shield className="size-8 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {entity ? "Nenhum registro encontrado para este filtro" : "Nenhum registro de auditoria"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entidade</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const Icon = actionIcons[log.action as keyof typeof actionIcons]
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColors[log.action as keyof typeof actionColors]}`}
                          >
                            {Icon && <Icon className="size-3" />}
                            {actionLabels[log.action as keyof typeof actionLabels]}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {entityLabels[log.entity] || log.entity}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.entityId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.userId ? (userMap.get(log.userId)?.name || userMap.get(log.userId)?.email || "—") : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={basePath}
            searchParams={{ entity }}
          />
        </>
      )}
    </div>
  )
}
