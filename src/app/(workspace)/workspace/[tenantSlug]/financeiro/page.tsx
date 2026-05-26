interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function FinanceiroPage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Financeiro</h1>
      <p className="text-zinc-500">Relatórios financeiros serão exibidos aqui.</p>
    </div>
  )
}
