"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Wrench,
  Package,
  Truck,
  DollarSign,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

interface TenantInfo {
  name: string
  slug: string
  businessType: string
}

interface Props {
  tenant: TenantInfo
  children: React.ReactNode
}

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/veiculos", label: "Veículos", icon: Car },
  { href: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList },
  { href: "/mecanicos", label: "Mecânicos", icon: Wrench },
  { href: "/terceirizados", label: "Terceirizados", icon: Building2 },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
]

const bottomItems = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

const businessLabels: Record<string, string> = {
  workshop: "Oficina",
  salon: "Salão",
  gym: "Academia",
}

export function WorkspaceShell({ tenant, children }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = `/workspace/${tenant.slug}`

  function isActive(href: string) {
    if (href === "") return pathname === base || pathname === `${base}/dashboard`
    return pathname.startsWith(`${base}${href}`)
  }

  function closeNav() {
    setOpen(false)
  }

  const sidebar = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-6 dark:border-zinc-800">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <span className="text-sm font-bold">G</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{tenant.name}</p>
          <p className="truncate text-xs text-muted-foreground">{businessLabels[tenant.businessType] ?? tenant.businessType}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              onClick={closeNav}
              href={`${base}${item.href === "" ? "/dashboard" : item.href}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                active
                  ? "bg-zinc-100 text-primary dark:bg-zinc-800 dark:text-primary-foreground"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <item.icon className={`size-4 ${active ? "text-primary" : ""}`} />
              {item.label}
              {active && (
                <div className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            onClick={closeNav}
            href={`${base}${item.href}`}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              isActive(item.href)
                ? "bg-zinc-100 text-primary dark:bg-zinc-800 dark:text-primary-foreground"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-50 flex size-10 items-center justify-center rounded-lg border bg-white shadow-sm md:hidden dark:bg-zinc-900"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-zinc-200 md:bg-white md:dark:border-zinc-800 md:dark:bg-zinc-900">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeNav} />
          <aside className="relative flex w-64 flex-col bg-white pt-16 dark:bg-zinc-900 h-full">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:pl-64">
        <div className="mx-auto max-w-7xl p-4 pt-16 md:p-8 md:pt-8">{children}</div>
      </main>
    </div>
  )
}
