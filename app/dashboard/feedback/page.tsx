"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/progress-bar"
import { Award, Download, TrendingUp, Code, Palette, FileText, Lightbulb, CheckCircle2 } from "lucide-react"

const scoreBreakdown = [
  { label: "Code Quality", score: 85, icon: Code },
  { label: "Design & Layout", score: 92, icon: Palette },
  { label: "Documentation", score: 78, icon: FileText },
  { label: "Best Practices", score: 88, icon: CheckCircle2 },
]

const suggestions = [
  "Consider adding error boundaries to handle runtime errors gracefully.",
  "Implement lazy loading for images to improve page performance scores.",
  "Add ARIA labels to interactive elements for better accessibility.",
  "Use CSS custom properties for theming instead of hardcoded color values.",
  "Consider adding unit tests for critical components to improve maintainability.",
]

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Feedback</h1>
          <p className="text-muted-foreground mt-1">Detailed evaluation of your latest submission.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Score */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary/20">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">87</p>
                        <p className="text-xs text-muted-foreground">/ 100</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-2">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Above Average
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground">Build a Responsive Landing Page</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted on February 18, 2026
                  </p>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    Great work on this task! Your landing page demonstrates strong fundamentals in responsive design
                    and modern CSS techniques. There are a few areas for improvement noted below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {scoreBreakdown.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.score}%</span>
                  </div>
                  <ProgressBar value={item.score} showValue={false} size="sm" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Feedback */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                AI-Generated Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">Strengths</p>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    Excellent use of CSS Grid and Flexbox for responsive layouts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    Clean semantic HTML structure with proper heading hierarchy
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    Smooth scroll navigation implementation works flawlessly
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Areas to Improve</p>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                    Form validation could be more robust with better error messages
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                    Image optimization needed for better page load performance
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Ranking</p>
                <p className="text-4xl font-bold text-primary mt-2">Top 15%</p>
                <p className="text-xs text-muted-foreground mt-1">of all Web Development submissions</p>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>
      </div>
    </div>
  )
}
