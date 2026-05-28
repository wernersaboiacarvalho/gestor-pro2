"use client"

import { useSession } from "next-auth/react"
import type { Permission, Role } from "@/lib/permissions"
import { hasPermission } from "@/lib/permissions"

interface CanProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined

  if (!role || !hasPermission(role, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface CanAnyProps {
  permissions: Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanAny({ permissions, children, fallback = null }: CanAnyProps) {
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined

  if (!role || !permissions.some((p) => hasPermission(role, p))) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
