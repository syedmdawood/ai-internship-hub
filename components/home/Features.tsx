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
    <section id="features" className="py-20 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Everything you need to become a successful freelancer
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our AI-powered platform guides you from beginner to professional with structured internships and real-time feedback.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}