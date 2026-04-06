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

    if (!existingProfile) {
      const fullName = `${user.user_metadata?.first_name || ""} ${
        user.user_metadata?.last_name || ""
      }`.trim();

      const role =
        user.app_metadata?.role || user.user_metadata?.role || "student";

      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: fullName,
          role,
        },
      ]);

      if (insertError) {
        throw insertError;
      }
    }
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
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErrorMsg("User not found.");
      setLoading(false);
      return;
    }

    const setPassword = user.user_metadata?.setPassword;

    if (setPassword === false) {
      setLoading(false);
      router.push("/create-password");
      return;
    }

    try {
      await ensureUserProfile(user);

      dispatch(setSession(data.session));

      const finalRole = await getUserRole(user);
      redirectByRole(finalRole);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong during login.");
      setLoading(false);
      return;
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              InternHub AI
            </span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
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
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
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
