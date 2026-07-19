import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import Providers from "@/components/Provider"
import "./globals.css"
import AuthRedirect from "@/components/AuthRedirect"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata: Metadata = {
  title: "InternHub AI - Virtual Internship Platform",
  description: "AI-powered virtual internship hub",
}

export const viewport: Viewport = {
  themeColor: "#4f46e5",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AuthRedirect />
            {children}
          </Providers>

          <Toaster />
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  )
}