"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI-Powered Virtual Internships
          </Badge>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
            Launch Your Freelancing Career with{" "}
            <span className="bg-linear-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">AI-Powered</span>{" "}
            Virtual Internships
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-300">
            Complete real-world simulated tasks, receive instant AI-based evaluation,
            track your progress, and generate a professional portfolio that lands you clients.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full bg-cyan-400 px-8 text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-300 sm:w-auto">
                Start Free Internship <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full border-white/20 bg-white/5 px-8 text-slate-100 hover:bg-white/10 hover:text-white sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-5 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 backdrop-blur">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>AI-evaluated tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>Build your portfolio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}