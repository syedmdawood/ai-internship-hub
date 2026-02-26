"use client"

import { Badge } from "@/components/ui/badge"
import { GraduationCap } from "lucide-react"
import { Briefcase } from "lucide-react"
import { Zap } from "lucide-react"
import { Star } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: GraduationCap,
    title: "Take Skill Assessment",
    description: "Complete an AI-powered assessment to identify your current skills and recommended domains.",
  },
  {
    step: "02",
    icon: Briefcase,
    title: "Complete Virtual Tasks",
    description: "Work on industry-realistic freelancing tasks tailored to your skill level and interests.",
  },
  {
    step: "03",
    icon: Zap,
    title: "Get AI Feedback",
    description: "Receive instant, detailed AI-generated feedback and scores for every submission.",
  },
  {
    step: "04",
    icon: Star,
    title: "Build Your Portfolio",
    description: "Automatically curate your best work into a professional portfolio ready for clients.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">How It Works</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            From student to freelancer in 4 simple steps
          </h2>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="text-center group">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-4 text-xs font-bold text-primary uppercase tracking-widest">Step {s.step}</p>
              <h3 className="mt-2 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}