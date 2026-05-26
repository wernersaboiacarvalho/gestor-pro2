interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function FornecedoresPage({ params }: Props) {
  await params
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Fornecedores</h1>
      <p className="text-zinc-500">Lista de fornecedores será exibida aqui.</p>
    </div>
  )
}
