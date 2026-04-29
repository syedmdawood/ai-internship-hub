"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!session) {
        router.replace("/login")
        return
      }

      const user = session.user
      const role = user.app_metadata?.role
      const setPassword = user.app_metadata?.setPassword

      // Redirect if password not set
      if (setPassword === false) {
        router.replace("/create-password")
        return
      }

      if (role === "admin") {
        router.replace("/admin")
        return
      } else if (role === "mentor") {
        router.replace("/mentor")
        return
      }

      // If role is student or allowed user, stop checking
      setCheckingAuth(false)
    }

    checkSession()
  }, [router])

  if (checkingAuth) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <DashboardSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="md:ml-64">
        <DashboardNavbar onOpenMobileMenu={() => setMobileNavOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}