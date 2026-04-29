"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Brain } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreatePasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [checkingAuth, setCheckingAuth] = useState(true)

  const passwordsValid = password.length >= 6 && password === confirmPassword

  // 🔥 Auth Guard (NO REDUX)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      // ❌ Not logged in
      if (!session) {
        router.replace("/login")
        return
      }

      const user = session.user
      const role = user.app_metadata?.role
      const setPasswordFlag = user.user_metadata?.setPassword

      // ✅ If password already set → redirect based on role
      if (setPasswordFlag === true) {
        if (role === "admin") {
          router.replace("/admin")
        } else if (role === "mentor") {
          router.replace("/mentor")
        } else {
          router.replace("/dashboard")
        }
        return
      }

      // ✅ Allow page access
      setCheckingAuth(false)
    }

    checkSession()
  }, [router])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsValid) return

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password,
      data: { setPassword: true },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)

    // Sign out recovery session
    await supabase.auth.signOut()

    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  // 🔥 Prevent Flicker
  if (checkingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <p className="relative text-slate-300">Preparing page...</p>
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

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Brain className="h-6 w-6 text-slate-950" />
            </div>
            <span className="text-xl font-bold text-slate-100">InternHub AI</span>
          </Link>
        </div>

      <Card className="w-full border-white/10 bg-white/4 shadow-2xl shadow-black/30 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-slate-100">Create Your Password</CardTitle>
          <CardDescription className="text-slate-300">
            Set a secure password to complete your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">

            <div className="space-y-2">
              <Label className="text-slate-200">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {confirmPassword && !passwordsValid && (
              <p className="text-sm text-red-500">
                Passwords must match and be at least 6 characters.
              </p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-300">
                Password set successfully. Redirecting to login...
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              disabled={!passwordsValid || loading}
            >
              {loading ? "Setting..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}