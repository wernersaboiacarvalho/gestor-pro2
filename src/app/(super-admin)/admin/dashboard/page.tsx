export default function SuperAdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Global</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Total de Tenants</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Usuários Ativos</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-zinc-500">Faturamento Global</p>
          <p className="text-3xl font-bold mt-1">--</p>
        </div>
      </div>
    </div>
  )
}
