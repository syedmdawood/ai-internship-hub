"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ClipboardCheck, Timer, Brain, TrendingUp, Target, ArrowRight } from "lucide-react"
import { assessmentQuestions } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function AssessmentPage() {
  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [timeLeft] = useState(300)

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleNext = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResult(true)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const score = Object.entries(answers).reduce((acc, [qId, aId]) => {
    const question = assessmentQuestions.find((q) => q.id === Number(qId))
    return acc + (question && question.correct === aId ? 1 : 0)
  }, 0)

  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Assessment</h1>
          <p className="text-muted-foreground mt-1">
            Discover your strengths and get personalized task recommendations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg mt-4">Web Development Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test your knowledge in HTML, CSS, JavaScript, and modern frameworks.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" /> 5 minutes
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" /> {assessmentQuestions.length} questions
                </span>
              </div>
              <Button onClick={() => setStarted(true)} className="w-full">
                Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg mt-4">UI/UX Design Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Evaluate your design thinking, user research, and visual design skills.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" /> 5 minutes
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" /> 5 questions
                </span>
              </div>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Previous Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Content Writing Assessment</p>
                  <p className="text-xs text-muted-foreground">Completed on Feb 10, 2026</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Score: 82%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Web Development Assessment</h1>
          <p className="text-muted-foreground mt-1">
            Question {currentQuestion + 1} of {assessmentQuestions.length}
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          <Timer className="mr-2 h-4 w-4" />
          {formatTime(timeLeft)}
        </Badge>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">
            {assessmentQuestions[currentQuestion].question}
          </h2>

          <RadioGroup
            value={answers[assessmentQuestions[currentQuestion].id]?.toString()}
            onValueChange={(val) =>
              handleAnswer(assessmentQuestions[currentQuestion].id, parseInt(val))
            }
          >
            <div className="space-y-3">
              {assessmentQuestions[currentQuestion].options.map((option, idx) => (
                <Label
                  key={idx}
                  htmlFor={`option-${idx}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border/50 p-4 cursor-pointer transition-colors hover:bg-secondary/50",
                    answers[assessmentQuestions[currentQuestion].id] === idx &&
                      "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <span className="text-sm text-foreground">{option}</span>
                </Label>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={answers[assessmentQuestions[currentQuestion].id] === undefined}
            >
              {currentQuestion < assessmentQuestions.length - 1 ? "Next Question" : "Submit Assessment"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Assessment Complete!</DialogTitle>
            <DialogDescription className="text-center">
              {"Here are your results and recommendations."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl font-bold text-primary">
                  {Math.round((score / assessmentQuestions.length) * 100)}%
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {score}/{assessmentQuestions.length} correct answers
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recommended Domain
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">Web Development</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Skill Level
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">Intermediate</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Suggested Roadmap
                </p>
                <p className="text-sm text-foreground mt-1">
                  Focus on React fundamentals, then progress to Next.js and TypeScript for full-stack development.
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setShowResult(false)
                setStarted(false)
                setCurrentQuestion(0)
                setAnswers({})
              }}
            >
              Back to Assessments
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
