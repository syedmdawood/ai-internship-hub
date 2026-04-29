"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { ShieldCheck, Plus } from "lucide-react"

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
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-20 h-52 w-52 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="mb-6 rounded-2xl border border-white/10 bg-linear-to-r from-slate-900/95 via-slate-900/85 to-cyan-900/35 px-4 py-5 shadow-xl shadow-black/20 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Manage Admins</h1>
            <p className="text-sm text-slate-300">Invite and grant admin access securely.</p>
          </div>
        </div>
      </div>

      <Card className="border-white/10 bg-white/4 shadow-lg shadow-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-100">Invite New Admin</CardTitle>
          <CardDescription className="text-slate-300">
            Invite admins to join the platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                <Plus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md border-white/15 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/40">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Invite Admin</DialogTitle>
                <DialogDescription className="text-slate-300">
                  Enter the admin's email address below
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-white/15 bg-slate-800 text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                {message && (
                  <p className="text-sm text-emerald-300">{message}</p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-white/15 bg-transparent text-slate-200 hover:bg-white/10 hover:text-slate-100"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleInvite}
                  disabled={loading}
                  className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
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