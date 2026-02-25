"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  const passwordsValid = password.length >= 6 && password === confirmPassword

  // Check recovery session
  useEffect(() => {
    const checkRecoverySession = async () => {
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

    checkRecoverySession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsValid) return

    setLoading(true)
    setError(null)

    // Reset password but do NOT update setPassword metadata
    const { error } = await supabase.auth.updateUser({
      password,
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
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter a new password to recover your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">

            <div className="space-y-2">
              <Label>New Password</Label>
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
                Password updated successfully. Redirecting to login...
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!passwordsValid || loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}