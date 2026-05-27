"use client"

import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

interface Props {
  q?: string
  category?: string
  categories: { category: string | null }[]
  basePath: string
}

export function InventoryFilters({ q, category, categories, basePath }: Props) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    const qVal = form.get("q") as string
    const catVal = form.get("category") as string
    if (qVal) params.set("q", qVal)
    if (catVal) params.set("category", catVal)
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome ou SKU..."
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      <select
        name="category"
        defaultValue={category ?? ""}
        onChange={(e) => {
          const form = e.currentTarget.form
          if (form) form.requestSubmit()
        }}
        className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900"
      >
        <option value="">Todas categorias</option>
        {categories.map((c) => c.category && <option key={c.category} value={c.category!}>{c.category}</option>)}
      </select>
    </form>
  )
}
