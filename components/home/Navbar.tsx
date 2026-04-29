"use client"

import { Brain, ArrowRight, User, Menu, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { logout } from "@/redux/features/authSlice"
import { supabase } from "@/lib/supabaseClient"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    dispatch(logout())
    router.push("/")
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
            <Brain className="h-5 w-5 text-slate-950" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            InternHub AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">Features</Link>
          <Link href="#how-it-works" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">How It Works</Link>
          <Link href="#testimonials" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">Testimonials</Link>
        </nav>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-slate-100 ring-1 ring-white/10 transition hover:bg-white/20 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {!isAuthenticated ? (
            <>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" size="sm" className="text-slate-200 hover:bg-white/10 hover:text-white">
                  Log In
                </Button>
              </Link>
              <Link href="/register" className="hidden md:block">
                <Button size="sm" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-100 ring-1 ring-white/10 transition hover:bg-white/20"
              >
                <User className="h-5 w-5" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-white/15 bg-slate-900/95 p-2 shadow-xl shadow-black/30 backdrop-blur">

                  {role === "admin" && (
                    <Link href="/admin" className="block rounded px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                      Admin Dashboard
                    </Link>
                  )}

                  {role === "mentor" && (
                    <Link href="/mentor" className="block rounded px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                      Mentor Dashboard
                    </Link>
                  )}

                  <Link href="/dashboard" className="block rounded px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10">
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full rounded px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link onClick={() => setMobileNavOpen(false)} href="#features" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">Features</Link>
            <Link onClick={() => setMobileNavOpen(false)} href="#how-it-works" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">How It Works</Link>
            <Link onClick={() => setMobileNavOpen(false)} href="#testimonials" className="text-sm text-slate-300 transition-colors hover:text-cyan-300">Testimonials</Link>

            {!isAuthenticated ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-slate-200 hover:bg-white/10 hover:text-white">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileNavOpen(false)}>
                  <Button size="sm" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  )
}