import * as Sentry from "@sentry/nextjs"

function initSentry() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: !!dsn,
  })
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    initSentry()
  }
}

export const onRequestError = Sentry.captureRequestError
