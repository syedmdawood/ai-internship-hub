"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const passwordsValid = password.length >= 6 && password === confirmPassword;

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session) {
        const user = session.user;
        const role = user.app_metadata?.role;

        if (role === "admin") {
          router.replace("/admin");
        } else if (role === "mentor") {
          router.replace("/mentor");
        } else {
          router.replace("/dashboard");
        }
        return;
      }

      setCheckingAuth(false);
    };

    checkSession();
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      setError("All fields are required.");
      return;
    }

    if (!passwordsValid) {
      setError("Passwords must match and be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (user) {
      const fullName = `${trimmedFirstName} ${trimmedLastName}`.trim();

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: fullName,
          role: "student",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    setMessage(
      "Account created successfully. Please check your email to verify your account before signing in.",
    );
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 2000);
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
              Create your account
            </CardTitle>
            <CardDescription className="text-slate-300">
              Start your freelancing journey today
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-200">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-200">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="border-white/15 bg-slate-900/60 text-slate-100 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {confirmPassword && !passwordsValid && (
                <p className="text-sm text-red-500">
                  Passwords must match and be at least 6 characters.
                </p>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-emerald-300">{message}</p>}

              <Button
                type="submit"
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                size="lg"
                disabled={loading || !passwordsValid}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-300">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-cyan-300 hover:text-cyan-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
