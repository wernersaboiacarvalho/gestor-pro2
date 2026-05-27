"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface Props {
  tenantId: string
  currentStatus: string
}

export function TenantActions({ tenantId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) router.refresh()
    setLoading(false)
  }

  if (currentStatus === "active") {
    return (
      <button
        onClick={() => updateStatus("suspended")}
        disabled={loading}
        className="text-xs text-amber-600 hover:text-amber-800 disabled:opacity-50"
      >
        {loading ? "..." : "Suspender"}
      </button>
    )
  }

  if (currentStatus === "suspended") {
    return (
      <div className="flex gap-2">
        <button onClick={() => updateStatus("active")} disabled={loading} className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50">
          {loading ? "..." : "Ativar"}
        </button>
        <button onClick={() => updateStatus("cancelled")} disabled={loading} className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50">
          {loading ? "..." : "Cancelar"}
        </button>
      </div>
    )
  }

  return null
}
