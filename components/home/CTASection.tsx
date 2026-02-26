"use client"

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:px-12 sm:py-20 text-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl text-balance">
              Ready to launch your freelancing career?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 leading-relaxed">
              Join thousands of students who are building real skills and portfolios with AI-powered virtual internships.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8">
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