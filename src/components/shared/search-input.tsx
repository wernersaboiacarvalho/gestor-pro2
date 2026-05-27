"use client"

import { useRouter } from "next/navigation"
import { useRef, useCallback } from "react"
import { Search } from "lucide-react"

interface Props {
  placeholder?: string
  basePath: string
  defaultValue?: string
}

export function SearchInput({ placeholder = "Buscar...", basePath, defaultValue }: Props) {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (value) params.set("q", value)
      else params.delete("q")
      params.delete("page")
      router.push(`${basePath}${params.toString() ? `?${params.toString()}` : ""}`)
    }, 400)
  }, [basePath, router])

  return (
    <div className="relative max-w-md flex-1">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        defaultValue={defaultValue ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      />
    </div>
  )
}
