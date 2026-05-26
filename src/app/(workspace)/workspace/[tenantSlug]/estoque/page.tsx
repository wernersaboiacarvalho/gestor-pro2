interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function EstoquePage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Estoque</h1>
      <p className="text-zinc-500">Controle de estoque será exibido aqui.</p>
    </div>
  )
}
