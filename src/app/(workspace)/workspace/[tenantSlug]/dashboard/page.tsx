interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function TenantDashboardPage({ params }: Props) {
  const { tenantSlug } = await params

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard - {tenantSlug}</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">OS Pendentes</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Em Andamento</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Concluídas (mês)</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Faturamento (mês)</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
      </div>
    </div>
  )
}
