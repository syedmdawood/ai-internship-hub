"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { MentorNavbar } from "@/components/mentor/admin-navbar"
import { MentorSidebar } from "@/components/mentor/mentor-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

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
        // Admin is allowed, so stop checking
        setCheckingAuth(false)
        return
      } else {
        // Any other role not allowed in admin
        router.replace("/login")
        return
      }
    }

    checkSession()
  }, [router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MentorSidebar />
      <div className="ml-64">
        <MentorNavbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}