"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [checkingAuth, setCheckingAuth] = useState(true)
  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingEmail")
    if (!storedEmail) {
      router.push("/register")
    } else {
      setEmail(storedEmail)
    }
  }, [])

  
    // 🔥 Guard: Prevent logged-in users from accessing login page
    useEffect(() => {
      const checkSession = async () => {
        const { data } = await supabase.auth.getSession()
        const session = data.session
  
        if (session) {
          const user = session.user
          const role = user.app_metadata?.role
  
          if (role === "admin") {
            router.replace("/admin")
          } else if (role === "mentor") {
            router.replace("/mentor")
          } else {
            router.replace("/dashboard")
          }
  
          return
        }
  
        setCheckingAuth(false)
      }
  
      checkSession()
    }, [router])

  const resendLink = async () => {
    if (!email) return

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/create-password`,
      },
    })

    if (!error) {
      setMessage("New link sent successfully.")
    }

    setLoading(false)
  }
    if (checkingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <p className="relative text-slate-300">Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-6 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/4 p-6 text-center shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
            <Brain className="h-6 w-6 text-slate-950" />
          </div>
          <span className="text-xl font-bold text-slate-100">InternHub AI</span>
        </Link>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-slate-100">Verify Your Email</h1>
          <p className="text-slate-300">
            We’ve sent a magic link to your email.
          </p>

          <Button onClick={resendLink} disabled={loading} className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:w-auto">
            {loading ? "Sending..." : "Resend Link"}
          </Button>

          {message && (
            <p className="text-sm text-emerald-300">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}