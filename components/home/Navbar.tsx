"use client"

import { Brain, ArrowRight, User } from "lucide-react"
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
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    dispatch(logout())
    router.push("/")
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            InternHub AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</Link>
        </nav>

        <div className="flex items-center gap-3 relative">
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
              >
                <User className="h-5 w-5" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg p-2">

                  {role === "admin" && (
                    <Link href="/admin" className="block px-3 py-2 text-sm hover:bg-muted rounded">
                      Admin Dashboard
                    </Link>
                  )}

                  {role === "mentor" && (
                    <Link href="/mentor" className="block px-3 py-2 text-sm hover:bg-muted rounded">
                      Mentor Dashboard
                    </Link>
                  )}

                  <Link href="/dashboard" className="block px-3 py-2 text-sm hover:bg-muted rounded">
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted rounded"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}