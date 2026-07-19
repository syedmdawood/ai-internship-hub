"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const passwordsValid = password.length >= 6 && password === confirmPassword;
  // Check recovery session
  useEffect(() => {
    let mounted = true;
    const checkExistingSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setError(error.message);
        setSessionReady(false);
        return;
      }
      if (session) {
        setSessionReady(true);
      }
    };
    void checkExistingSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
        setError(null);
        return;
      }
      if (event === "SIGNED_IN" && session) {
        setSessionReady(true);
      }
    });
    const timeout = window.setTimeout(async () => {
      if (!mounted) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      }
    }, 5000);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router]);
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsValid) return;
    setLoading(true);
    setError(null);
    // Reset password but do NOT update setPassword metadata
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    // Sign out recovery session
    await supabase.auth.signOut();
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };
  if (!sessionReady) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <p className="relative text-slate-300">Preparing page...</p>
      </div>
    );
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
            <span className="text-xl font-bold text-slate-100">
              InternHub AI
            </span>
          </Link>
        </div>
        <Card className="w-full border-white/10 bg-white/4 shadow-2xl shadow-black/30 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-slate-300">
              Enter a new password to recover your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">New Password</Label>
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
                  Password updated successfully. Redirecting to login...
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                disabled={!passwordsValid || loading}
              >
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
