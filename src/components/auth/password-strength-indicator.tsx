"use client"

import { getPasswordStrength } from "@/lib/validations/schemas"

interface Props {
  password: string
}

export function PasswordStrengthIndicator({ password }: Props) {
  const { score, label, color } = getPasswordStrength(password)

  if (!password) return null

  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? color : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        score <= 2 ? "text-red-600" : score <= 3 ? "text-amber-600" : "text-emerald-600"
      }`}>
        {label}
      </p>
    </div>
  )
}
