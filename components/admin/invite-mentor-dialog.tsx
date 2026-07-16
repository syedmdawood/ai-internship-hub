"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  onSuccess?: () => void;
}

export default function InviteMentorDialog({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleInvite() {
    if (!email) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setError("You are not authenticated.");
        return;
      }

      const res = await fetch("/api/admin/invite-mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");

        return;
      }

      setMessage("Mentor invitation sent successfully ✅");

      setEmail("");

      onSuccess?.();
    } catch (error) {
      console.error(error);

      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className=" text-slate-950">
          Add Mentor
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-white/15 bg-slate-900/95 text-slate-100">
        <DialogHeader>
          <DialogTitle>Invite Mentor</DialogTitle>

          <DialogDescription className="text-slate-300">
            Enter mentor email address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>

            <Input
              type="email"
              placeholder="mentor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-white/15"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {message && <p className="text-sm text-emerald-300">{message}</p>}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="bg-slate-700 text-slate-100 hover:bg-slate-600"> 
            Cancel
          </Button>

          <Button
            disabled={loading}
            onClick={handleInvite}
            className=""
          >
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
