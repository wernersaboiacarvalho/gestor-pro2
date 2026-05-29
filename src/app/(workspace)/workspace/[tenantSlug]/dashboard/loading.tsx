export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-5 dark:bg-zinc-900">
            <div className="mb-3 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
    </div>
  )
}
