"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-semibold text-zinc-600">Algo deu errado</p>
            <p className="mt-1 text-sm text-zinc-400">{this.state.error?.message}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => this.setState({ hasError: false })}
            >
              Tentar novamente
            </Button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
