"use client"

import { Brain } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">InternHub AI</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            2026 InternHub AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}