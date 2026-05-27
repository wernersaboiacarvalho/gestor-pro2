"use client"

import { useEffect, useRef } from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    // Show toasts from sessionStorage (set by server form submissions)
    const msg = sessionStorage.getItem("toast")
    if (msg) {
      sessionStorage.removeItem("toast")
      // Import toast dynamically to avoid circular deps
      import("sonner").then(({ toast }) => {
        try {
          const parsed = JSON.parse(msg)
          if (parsed.type === "success") toast.success(parsed.message)
          else if (parsed.type === "error") toast.error(parsed.message)
        } catch {
          // plain string
        }
      })
    }
  }, [])

  return <SonnerToaster richColors closeButton />
}
