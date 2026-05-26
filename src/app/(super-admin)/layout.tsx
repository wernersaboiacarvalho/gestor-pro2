import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.role !== "super_admin") redirect("/login")

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-zinc-900 text-zinc-50 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Gestor Pro</h2>
          <p className="text-sm text-zinc-400">Admin</p>
        </div>
        <nav className="space-y-1">
          <a href="/admin/dashboard" className="block px-3 py-2 rounded hover:bg-zinc-800 text-sm">Dashboard</a>
          <a href="/admin/tenants" className="block px-3 py-2 rounded hover:bg-zinc-800 text-sm">Tenants</a>
          <p className="text-xs text-zinc-500 mt-6">Admin</p>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
