"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

export default function AdminMentorsPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleInvite = async () => {
    if (!email) return

    setLoading(true)
    setMessage(null)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    if (!token) {
      setError("You are not authenticated.")
      setLoading(false)
      return
    }

    const res = await fetch("/api/admin/invite-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Something went wrong")
    } else {
      setMessage("Mentor invitation sent successfully ✅")
      setEmail("")
    }

    setLoading(false)
  }

  return (
    <div className="p-6">
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle>Manage Admins</CardTitle>
          <CardDescription>
            Invite admins to join the platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Admin</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Admin</DialogTitle>
                <DialogDescription>
                  Enter the admin's email address below
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                {message && (
                  <p className="text-sm text-green-600">{message}</p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleInvite}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}