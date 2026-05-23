import { Fraunces, Geist_Mono, Manrope } from "next/font/google"

import "./globals.css"
import { PlaygroundCommandMenu } from "@/components/playground/command-menu"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        manrope.variable,
        fraunces.variable,
        "font-sans",
      )}
    >
      <body className="playground-body min-h-svh">
        <ThemeProvider>
          <div className="playground-shell">{children}</div>
          <PlaygroundCommandMenu />
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
