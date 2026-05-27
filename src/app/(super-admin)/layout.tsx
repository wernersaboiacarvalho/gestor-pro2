import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "./_components/sign-out-button"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.role !== "super_admin") redirect("/login")

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-zinc-900 text-zinc-50 p-6 flex flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Gestor Pro</h2>
          <p className="text-sm text-zinc-400">Admin</p>
        </div>
        <nav className="space-y-1 flex-1">
          <a href="/admin/dashboard" className="block px-3 py-2 rounded hover:bg-zinc-800 text-sm">Dashboard</a>
          <a href="/admin/tenants" className="block px-3 py-2 rounded hover:bg-zinc-800 text-sm">Tenants</a>
        </nav>
        <div className="border-t border-zinc-700 pt-4">
          <p className="text-xs text-zinc-500 mb-2">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
