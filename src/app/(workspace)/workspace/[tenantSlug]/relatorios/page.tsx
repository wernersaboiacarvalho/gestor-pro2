import { getTenantContext } from "@/lib/auth/tenant-context"
import { prisma } from "@/lib/db/prisma"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ tab?: string; startDate?: string; endDate?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug } = await params
  return { title: `Relatórios - ${tenantSlug}` }
}

export default async function RelatoriosPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { tab, startDate, endDate } = await searchParams
  const tenant = await getTenantContext(tenantSlug)
  const activeTab = tab || "os"

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const end = endDate ? new Date(endDate + "T23:59:59") : new Date()

  // Fetch data based on active tab
  let data: unknown[] = []

  if (activeTab === "os") {
    data = await prisma.serviceOrder.findMany({
      where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
      include: { vehicle: { select: { plate: true } } },
      orderBy: { createdAt: "desc" },
    })
  } else if (activeTab === "financeiro") {
    data = await prisma.financialRecord.findMany({
      where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
      orderBy: { dueDate: "desc" },
    })
  } else if (activeTab === "estoque") {
    data = await prisma.inventoryItem.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
    })
  } else if (activeTab === "clientes") {
    data = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      include: { _count: { select: { vehicles: true } } },
      orderBy: { name: "asc" },
    })
  }

  const tabs = [
    { value: "os", label: "Ordens de Serviço" },
    { value: "financeiro", label: "Financeiro" },
    { value: "estoque", label: "Estoque" },
    { value: "clientes", label: "Clientes" },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workspace/${tenantSlug}/dashboard`}>
              <ArrowLeft className="mr-1 size-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/reports/export?type=${activeTab}&startDate=${start.toISOString()}&endDate=${end.toISOString()}&tenantId=${tenant.id}`} download>
            <Download className="mr-1.5 size-3.5" />
            Exportar CSV
          </a>
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-lg border bg-white p-1 dark:bg-zinc-900">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/workspace/${tenantSlug}/relatorios?tab=${t.value}`}
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-all ${
              activeTab === t.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            {activeTab === "os" && (
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Veículo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            )}
            {activeTab === "financeiro" && (
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
              </tr>
            )}
            {activeTab === "estoque" && (
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Qtd</th>
                <th className="px-4 py-3 font-medium text-right">Preço Unit.</th>
              </tr>
            )}
            {activeTab === "clientes" && (
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CPF/CNPJ</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium text-right">Veículos</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhum registro encontrado para o período selecionado
                </td>
              </tr>
            ) : (
              (data as Record<string, unknown>[]).map((item) => {
                if (activeTab === "os") {
                  const o = item
                  const v = o.vehicle as { plate: string } | undefined
                  const statusColors: Record<string, string> = {
                    completed: "bg-green-100 text-green-700", delivered: "bg-emerald-100 text-emerald-700",
                    in_progress: "bg-blue-100 text-blue-700", pending: "bg-amber-100 text-amber-700",
                    cancelled: "bg-red-100 text-red-700",
                  }
                  return (
                    <tr key={o.id as string} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-mono text-xs font-medium">#{o.orderNumber as string}</td>
                      <td className="px-4 py-3">{(o.description as string)?.substring(0, 40)}</td>
                      <td className="px-4 py-3 text-xs">{v?.plate ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status as string] ?? "bg-zinc-100 text-zinc-500"}`}>
                          {o.status as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(o.totalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.createdAt as string).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  )
                }
                if (activeTab === "financeiro") {
                  const r = item
                  return (
                    <tr key={r.id as string} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3">{r.description as string}</td>
                      <td className="px-4 py-3 text-xs">{r.type === "receivable" ? "A Receber" : "A Pagar"}</td>
                      <td className="px-4 py-3 text-xs">{r.status as string}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(r.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.dueDate as string).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  )
                }
                if (activeTab === "estoque") {
                  const i = item
                  return (
                    <tr key={i.id as string} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-medium">{i.name as string}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{(i.sku as string) ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{(i.category as string) ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{i.quantity as number}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(i.unitPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    </tr>
                  )
                }
                // clientes
                const c = item
                const count = (c._count as { vehicles: number })?.vehicles ?? 0
                return (
                  <tr key={c.id as string} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium">{c.name as string}</td>
                    <td className="px-4 py-3 text-xs">{(c.cpf as string) ?? (c.cnpj as string) ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{c.phone as string}</td>
                    <td className="px-4 py-3 text-xs">{(c.email as string) ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{count}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
