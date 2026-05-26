interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function ConfiguracoesPage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      <p className="text-zinc-500">Configurações do workspace serão exibidas aqui.</p>
    </div>
  )
}
