"use client"

import { Brain } from "lucide-react"
import { Briefcase } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { FolderOpen } from "lucide-react"
import { MessageSquare } from "lucide-react"
import { Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "AI Skill Assessment",
    description: "Take intelligent assessments to discover your strengths and get personalized learning paths.",
  },
  {
    icon: Briefcase,
    title: "Simulated Freelance Tasks",
    description: "Work on realistic projects across web dev, design, writing, and data science domains.",
  },
  {
    icon: BarChart3,
    title: "AI-Powered Feedback",
    description: "Receive detailed, actionable feedback on every submission with AI-generated scores and insights.",
  },
  {
    icon: FolderOpen,
    title: "Portfolio Builder",
    description: "Automatically generate a professional portfolio showcasing your best work and AI scores.",
  },
  {
    icon: MessageSquare,
    title: "AI Career Chatbot",
    description: "Get personalized career advice and guidance from an AI assistant trained on freelancing.",
  },
  {
    icon: Shield,
    title: "Mentor Support",
    description: "Connect with experienced mentors who track your progress and provide expert feedback.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 border border-indigo-300/30 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/20">Features</Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            Everything you need to become a successful freelancer
          </h2>
          <p className="mt-4 leading-relaxed text-slate-300">
            Our AI-powered platform guides you from beginner to professional with structured internships and real-time feedback.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <Card
              key={feature.title}
              className="group border-white/10 bg-white/4 shadow-lg shadow-black/20 transition-all hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/6"
              style={{ animationDelay: `${idx * 90}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 transition-colors group-hover:bg-cyan-300/20">
                  <feature.icon className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}