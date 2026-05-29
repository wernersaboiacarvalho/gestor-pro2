import { getInviteByToken } from "./actions"
import { InviteAcceptForm } from "@/components/auth/invite-accept-form"

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const invite = await getInviteByToken(token)

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md text-center">
          <p className="text-lg font-semibold text-red-600">Convite inválido ou expirado</p>
          <p className="mt-2 text-sm text-zinc-500">Solicite um novo convite ao administrador do workspace.</p>
          <a href="/login" className="mt-4 inline-block text-sm text-primary underline">Voltar para o login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <InviteAcceptForm token={token} invite={invite} />
      </div>
    </div>
  )
}
