interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function OrdensServicoPage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ordens de Serviço</h1>
      <p className="text-zinc-500">Lista de ordens de serviço será exibida aqui.</p>
    </div>
  )
}
