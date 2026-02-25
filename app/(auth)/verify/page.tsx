"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingEmail")
    if (!storedEmail) {
      router.push("/register")
    } else {
      setEmail(storedEmail)
    }
  }, [])

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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Verify Your Email</h1>
        <p className="text-muted-foreground">
          We’ve sent a magic link to your email.
        </p>

        <Button onClick={resendLink} disabled={loading}>
          {loading ? "Sending..." : "Resend Link"}
        </Button>

        {message && (
          <p className="text-green-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}