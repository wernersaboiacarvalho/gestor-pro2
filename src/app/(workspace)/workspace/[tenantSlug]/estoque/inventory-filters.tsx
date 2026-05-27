"use client"

import { useRouter } from "next/navigation"

interface Props {
  category?: string
  categories: { category: string | null }[]
  basePath: string
}

export function InventoryFilters({ category, categories, basePath }: Props) {
  const router = useRouter()

  function handleCategoryChange(value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set("category", value)
    else params.delete("category")
    params.delete("page")
    router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={category ?? ""}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-zinc-900"
      >
        <option value="">Todas categorias</option>
        {categories.map((c) => c.category && <option key={c.category} value={c.category!}>{c.category}</option>)}
      </select>
    </div>
  )
}
