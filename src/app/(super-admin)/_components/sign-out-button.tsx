"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-800 text-sm text-zinc-400"
    >
      Sair
    </button>
  )
}
