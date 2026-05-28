"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useCallback } from "react"
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { Permission, Role } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"

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
  { href: "", label: "Dashboard", icon: LayoutDashboard, permission: "" as Permission },
  { href: "/clientes", label: "Clientes", icon: Users, permission: "customers.view" as Permission },
  { href: "/veiculos", label: "Veículos", icon: Car, permission: "vehicles.view" as Permission },
  { href: "/ordens-servico", label: "Ordens de Serviço", icon: ClipboardList, permission: "orders.view" as Permission },
  { href: "/mecanicos", label: "Mecânicos", icon: Wrench, permission: "mechanics.view" as Permission },
  { href: "/terceirizados", label: "Terceirizados", icon: Building2, permission: "partners.view" as Permission },
  { href: "/estoque", label: "Estoque", icon: Package, permission: "inventory.view" as Permission },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck, permission: "suppliers.view" as Permission },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign, permission: "financial.view" as Permission },
]

const bottomItems = [
  { href: "/configuracoes", label: "Configurações", icon: Settings, permission: "settings.view" as Permission },
]

const businessLabels: Record<string, string> = {
  workshop: "Oficina",
  salon: "Salão",
  gym: "Academia",
}

const SIDEBAR_WIDTH = 16
const SIDEBAR_COLLAPSED_WIDTH = 4

function SidebarNav({
  tenant,
  base,
  isActive,
  collapsed,
  onLinkClick,
  role,
}: {
  tenant: TenantInfo
  base: string
  isActive: (href: string) => boolean
  collapsed: boolean
  onLinkClick?: () => void
  role: Role
}) {
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(role, item.permission)
  )
  const visibleBottomItems = bottomItems.filter(
    (item) => !item.permission || hasPermission(role, item.permission)
  )
  return (
    <>
      <div className={`flex h-14 items-center gap-3 border-b border-zinc-200 px-3 dark:border-zinc-800 ${collapsed ? "justify-center px-0" : "px-4"}`}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <span className="text-sm font-bold">G</span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{tenant.name}</p>
            <p className="truncate text-xs text-muted-foreground">{businessLabels[tenant.businessType] ?? tenant.businessType}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {visibleNavItems.map((item) => {
          const active = isActive(item.href)
          const link = (
            <Link
              key={item.href}
              href={`${base}${item.href === "" ? "/dashboard" : item.href}`}
              onClick={onLinkClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                collapsed ? "justify-center px-2" : ""
              } ${
                active
                  ? "bg-zinc-100 text-primary dark:bg-zinc-800 dark:text-primary-foreground"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <item.icon className={`size-4 shrink-0 ${active ? "text-primary" : ""}`} />
              {!collapsed && (
                <>
                  {item.label}
                  {active && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
                </>
              )}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return <div key={item.href}>{link}</div>
        })}
      </nav>

      <div className="border-t border-zinc-200 px-2 py-3 dark:border-zinc-800">
        {visibleBottomItems.map((item) => {
          const active = isActive(item.href)
          const link = (
            <Link
              key={item.href}
              href={`${base}${item.href}`}
              onClick={onLinkClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                collapsed ? "justify-center px-2" : ""
              } ${
                active
                  ? "bg-zinc-100 text-primary dark:bg-zinc-800 dark:text-primary-foreground"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return <div key={item.href}>{link}</div>
        })}

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                className="mt-2 w-full justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                <LogOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="mt-2 w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        )}
      </div>
    </>
  )
}

export function WorkspaceShell({ tenant, children }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role ?? "user") as Role
  const base = `/workspace/${tenant.slug}`
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("sidebar-collapsed") === "true"
  })

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sidebar-collapsed", String(next))
      return next
    })
  }, [])

  function isActive(href: string) {
    if (href === "") return pathname === base || pathname === `${base}/dashboard`
    return pathname.startsWith(`${base}${href}`)
  }

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <div
      className="grid min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-[grid-template-columns] duration-200"
      style={{ gridTemplateColumns: `${sidebarWidth}rem minmax(0,1fr)` }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shrink-0">
        <SidebarNav
          tenant={tenant}
          base={base}
          isActive={isActive}
          collapsed={collapsed}
          role={role}
        />
      </aside>

      {/* Mobile header */}
      <div className="col-span-full flex items-center border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="mr-3"
        >
          <Menu className="size-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
            <span className="text-xs font-bold">G</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{tenant.name}</p>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SidebarNav
            tenant={tenant}
            base={base}
            isActive={isActive}
            collapsed={false}
            onLinkClick={() => setMobileOpen(false)}
            role={role}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="min-w-0">
        {/* Desktop collapse toggle */}
        <div className="hidden lg:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="fixed top-3 z-30 border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            style={{ left: `${sidebarWidth * 4 + 0.5}rem` }}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            <span className="sr-only">{collapsed ? "Expandir menu" : "Recolher menu"}</span>
          </Button>
        </div>
        <div className="w-full max-w-none p-4 lg:p-8 lg:pt-14">{children}</div>
      </main>
    </div>
  )
}
