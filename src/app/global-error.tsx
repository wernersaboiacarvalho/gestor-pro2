"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
          <p className="text-lg font-semibold text-zinc-600">Erro inesperado</p>
          <button
            onClick={reset}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
