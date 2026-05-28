"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Car, ClipboardList, Package, Truck, ArrowRight } from "lucide-react"

interface SearchResult {
  type: "customer" | "vehicle" | "order" | "supplier" | "inventory"
  id: string
  title: string
  subtitle: string
  href: string
}

const typeConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
  customer: { label: "Cliente", icon: Users, color: "text-blue-600" },
  vehicle: { label: "Veículo", icon: Car, color: "text-amber-600" },
  order: { label: "OS", icon: ClipboardList, color: "text-violet-600" },
  supplier: { label: "Fornecedor", icon: Truck, color: "text-emerald-600" },
  inventory: { label: "Estoque", icon: Package, color: "text-orange-600" },
}

export function GlobalSearch({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        setResults(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleSelect(result: SearchResult) {
    router.push(`${baseUrl}/${result.href}`)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline dark:border-zinc-600 dark:bg-zinc-700">
          Ctrl+K
        </kbd>
      </button>
    )
  }

  const grouped = results.reduce(
    (acc, r) => {
      acc[r.type] = acc[r.type] ?? []
      acc[r.type].push(r)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-xl border bg-white shadow-2xl dark:bg-zinc-900 dark:border-zinc-700">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, placa, OS, fornecedor, peça..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Buscando...</p>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum resultado encontrado</p>
          )}

          {!loading && query.length < 2 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Digite pelo menos 2 caracteres</p>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            const config = typeConfig[type]
            const Icon = config?.icon ?? Search
            return (
              <div key={type} className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{config?.label ?? type}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Icon className={`size-4 shrink-0 ${config?.color ?? "text-zinc-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
                    </div>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
