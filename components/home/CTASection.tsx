"use client"

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-linear-to-br from-cyan-500/20 via-sky-500/15 to-emerald-500/15 px-6 py-16 text-center shadow-2xl shadow-cyan-500/10 sm:px-12 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.25),transparent_45%)]" />
          <div className="relative z-10">
            <h2 className="text-balance text-3xl font-bold text-slate-100 sm:text-4xl">
              Ready to launch your freelancing career?
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-200/90">
              Join thousands of students who are building real skills and portfolios with AI-powered virtual internships.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full bg-cyan-300 px-8 text-slate-950 shadow-lg shadow-cyan-400/30 hover:bg-cyan-200 sm:w-auto">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}