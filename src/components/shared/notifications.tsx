"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, AlertTriangle, Clock, Package, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationItem {
  id: string
  title: string
  subtitle: string
  href: string
}

interface NotificationGroup {
  type: string
  count: number
  items: NotificationItem[]
  severity: "high" | "medium" | "low"
}

const typeConfig: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  overdue_bills: { label: "Contas atrasadas", icon: AlertTriangle, color: "text-red-600" },
  low_stock: { label: "Estoque baixo", icon: Package, color: "text-amber-600" },
  stale_orders: { label: "OS paradas", icon: Clock, color: "text-orange-600" },
  pending_budgets: { label: "Orçamentos pendentes", icon: ClipboardList, color: "text-blue-600" },
}

export function Notifications({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationGroup[]>([])
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    function load() {
      fetch("/api/notifications")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (!cancelled) setNotifications(data)
        })
        .catch((err) => console.error("[notifications]", err))
    }

    load()
    const interval = setInterval(load, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0)

  function handleLinkClick(href: string) {
    router.push(`${baseUrl}${href}`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="relative"
      >
        <Bell className="size-5" />
        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-white shadow-2xl dark:bg-zinc-900 dark:border-zinc-700">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Notificações</p>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação
                </p>
              )}
              {notifications.map((group) => {
                const config = typeConfig[group.type]
                const Icon = config?.icon ?? Bell
                return (
                  <div key={group.type} className="mb-2">
                    <div className="flex items-center justify-between px-2 py-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {config?.label ?? group.type}
                      </p>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                        {group.count}
                      </span>
                    </div>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLinkClick(item.href)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Icon className={`size-4 shrink-0 ${config?.color ?? "text-zinc-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}