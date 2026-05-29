import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Providers } from "@/components/shared/providers"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Gestor Pro",
  description: "Sistema de Gestão Multi-tenant para Negócios",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground font-sans">
        <Providers>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
