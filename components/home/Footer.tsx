"use client"

import { Brain } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 py-12 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Brain className="h-5 w-5 text-slate-950" />
            </div>
            <span className="text-lg font-bold text-slate-100">InternHub AI</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="#features" className="transition-colors hover:text-cyan-300">Features</Link>
            <Link href="#how-it-works" className="transition-colors hover:text-cyan-300">How It Works</Link>
            <Link href="#testimonials" className="transition-colors hover:text-cyan-300">Testimonials</Link>
            <Link href="/login" className="transition-colors hover:text-cyan-300">Log In</Link>
          </nav>
          <p className="text-xs text-slate-500">
            2026 InternHub AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}