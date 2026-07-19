"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Eye, EyeOff } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { setSession } from "@/redux/features/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  async function ensureUserProfile(user: any) {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    // User does not exist in profiles table
    if (!existingProfile) {
      throw new Error("User does not exist.");
    }

    return existingProfile;
  }

  async function getUserRole(user: any) {
    const appRole = user?.app_metadata?.role;
    if (appRole) return appRole;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return profile?.role || "student";
  }

  function redirectByRole(role: string) {
    if (role === "admin") {
      router.replace("/admin");
    } else if (role === "mentor") {
      router.replace("/mentor");
    } else {
      router.replace("/dashboard");
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session) {
          setCheckingAuth(false);
          return;
        }

        const user = session.user;
        const role = await getUserRole(user);
        redirectByRole(role);
      } catch {
        setCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const trimmedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setErrorMsg("User does not exist or invalid credentials.");
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMsg("User does not exist.");
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // User exists in Auth but deleted from profiles
      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMsg("User does not exist.");
        setLoading(false);
        return;
      }

      dispatch(setSession(data.session));

      redirectByRole(profile.role);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <p className="relative text-slate-300">Checking authentication...</p>
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
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Brain className="h-6 w-6 text-slate-950" />
            </div>
            <span className="text-xl font-bold text-slate-100">
              InternHub AI
            </span>
          </Link>
        </div>

        <Card className="border-white/10 bg-white/4 shadow-2xl shadow-black/30 backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-slate-100">
              Welcome back
            </CardTitle>
            <CardDescription className="text-slate-300">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-200">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-500 text-center">{errorMsg}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                size="lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-300">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-cyan-300 hover:text-cyan-200 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
