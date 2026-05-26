interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function MecanicosPage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mecânicos</h1>
      <p className="text-zinc-500">Lista de mecânicos será exibida aqui.</p>
    </div>
  )
}
