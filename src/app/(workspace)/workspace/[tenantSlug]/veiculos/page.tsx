interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function VeiculosPage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Veículos</h1>
      <p className="text-zinc-500">Lista de veículos será exibida aqui.</p>
    </div>
  )
}
