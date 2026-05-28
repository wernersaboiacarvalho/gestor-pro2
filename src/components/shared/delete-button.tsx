"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Props {
  endpoint: string
  label: string
  redirectTo: string
}

export function DeleteButton({ endpoint, label, redirectTo }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(endpoint, { method: "DELETE" })
      if (!res.ok) throw new Error()
      router.push(redirectTo)
      router.refresh()
    } catch {
      alert("Erro ao excluir " + label)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)} disabled={loading}>
        {loading ? "Excluindo..." : "Excluir"}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
            <h3 className="text-lg font-semibold">Confirmar exclusão</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Tem certeza que deseja excluir {label}? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? "Excluindo..." : "Sim, excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
