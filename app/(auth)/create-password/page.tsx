"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

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
  const [sessionReady, setSessionReady] = useState(false)

  const passwordsValid = password.length >= 6 && password === confirmPassword

  // Check magic signup session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        setSessionReady(true)
      } else {
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            setSessionReady(true)
          } else {
            router.push("/login")
          }
        }, 1000)
      }
    }

    checkSession()
  }, [])

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

    // Optional: sign out recovery session before redirect
    await supabase.auth.signOut()

    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Preparing page...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center">
          <CardTitle>Create Your Password</CardTitle>
          <CardDescription>
            Set a secure password to complete your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {confirmPassword && !passwordsValid && (
              <p className="text-sm text-red-500">
                Passwords must match and be at least 6 characters.
              </p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Password set successfully. Redirecting to login...
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!passwordsValid || loading}
            >
              {loading ? "Setting..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}