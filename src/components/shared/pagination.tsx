import Link from "next/link"

interface Props {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string | undefined>
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: Props) {
  if (totalPages <= 1) return null

  function href(page: number) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v)
    }
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    return `${basePath}${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link href={href(currentPage - 1)} className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
          Anterior
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={`rounded-lg px-3 py-2 text-sm ${p === currentPage ? "bg-primary text-primary-foreground" : "border hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
        >
          {p}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link href={href(currentPage + 1)} className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
          Próxima
        </Link>
      )}
    </div>
  )
}
