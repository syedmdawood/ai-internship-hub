"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

import {
  ClipboardCheck,
  Timer,
  ArrowRight,
} from "lucide-react"

import { cn } from "@/lib/utils"

export default function AssessmentPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)

  const [domainScores, setDomainScores] = useState<Record<string, number>>({})
  const [recommendedDomains, setRecommendedDomains] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(5)
  const [skillLevel, setSkillLevel] = useState("")


  // ================= FETCH QUESTIONS =================
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          options,
          correct_answer,
          domains(name)
        `)

      if (!error && data) {
        setQuestions(data)
      }

      setLoading(false)
    }

    fetchQuestions()
  }, [])

  useEffect(() => {
    if (!started) return
    if (showResult) return
    if (timeLeft <= 0) {
      evaluateAssessment()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [started, timeLeft, showResult])

  // ================= PROGRESS =================
  const progress = questions.length
    ? ((currentQuestion + 1) / questions.length) * 100
    : 0

  // ================= HANDLE ANSWER =================
  const handleAnswer = (questionId: string, selectedOption: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }))
  }

  // ================= NEXT BUTTON =================
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      evaluateAssessment()
    }
  }

  // ================= EVALUATION LOGIC =================
  const evaluateAssessment = async () => {
    let scores: Record<string, number> = {}

    questions.forEach((q) => {
      const domainName = q.domains.name

      if (!scores[domainName]) {
        scores[domainName] = 0
      }

      if (answers[q.id] === q.correct_answer) {
        scores[domainName] += 1
      }
    })

    setDomainScores(scores)

    const values = Object.values(scores)
    const maxScore = Math.max(...values)

    let recommended: string[] = []

    if (maxScore === 0) {
      recommended = ["Beginner Freelancing Path"]
    } else {
      recommended = Object.keys(scores).filter(
        (domain) => scores[domain] === maxScore
      )
    }

    setRecommendedDomains(recommended)

    const totalScore = values.reduce((a, b) => a + b, 0)

    const percentage = (totalScore / questions.length) * 100

    let computedSkillLevel = ""
    if (percentage >= 80) {
      computedSkillLevel = "Advanced"
    } else if (percentage >= 50) {
      computedSkillLevel = "Intermediate"
    } else {
      computedSkillLevel = "Beginner"
    }

    setSkillLevel(computedSkillLevel)

    const { data: userData } = await supabase.auth.getUser()

    if (userData?.user) {
      await supabase.from("assessment_results").insert({
        user_id: userData.user.id,
        domain_scores: scores,
        recommended_domain: recommended,
        total_score: totalScore,
        skill_level: computedSkillLevel,
      })
    }

    setShowResult(true)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const totalCorrect = Object.values(domainScores).reduce(
    (a, b) => a + b,
    0
  )

  // ================= LOADING =================
  if (loading) {
    return <div className="p-6">Loading assessment...</div>
  }

  // ================= START SCREEN =================
  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Skill Assessment</h1>
          <p className="text-muted-foreground mt-1">
            Discover your strengths and get personalized domain recommendations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Freelancing Skill Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="h-4 w-4" /> 5 minutes
              </span>
              <span>
                {questions.length} questions
              </span>
            </div>

            <Button onClick={() => setStarted(true)} className="w-full">
              Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ================= QUESTION SCREEN =================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Skill Assessment
          </h1>
          <p className="text-muted-foreground mt-1">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <Badge variant="outline">
          <Timer className="mr-2 h-4 w-4" />
          {formatTime(timeLeft)}
        </Badge>
      </div>

      <Progress value={progress} />

      <Card>
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">
            {questions[currentQuestion]?.question_text}
          </h2>

          <RadioGroup
            value={answers[questions[currentQuestion]?.id]}
            onValueChange={(val) =>
              handleAnswer(questions[currentQuestion]?.id, val)
            }
          >
            <div className="space-y-3">
              {questions[currentQuestion]?.options.map(
                (option: string, idx: number) => (
                  <Label
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition hover:bg-secondary/50",
                      answers[questions[currentQuestion]?.id] === option &&
                      "border-primary bg-primary/5"
                    )}
                  >
                    <RadioGroupItem value={option} />
                    <span>{option}</span>
                  </Label>
                )
              )}
            </div>
          </RadioGroup>

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={
                answers[questions[currentQuestion]?.id] === undefined
              }
            >
              {currentQuestion < questions.length - 1
                ? "Next Question"
                : "Submit Assessment"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= RESULT MODAL ================= */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-h-[90vh] flex flex-col [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Assessment Complete!
            </DialogTitle>
            <DialogDescription className="text-center">
              Here are your results and recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl font-bold text-primary">
                  {Math.round(
                    (totalCorrect / questions.length) * 100
                  )}
                  %
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {totalCorrect} / {questions.length} correct answers
              </p>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="rounded-xl bg-secondary/50 p-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Domain-wise Scores
                </p>

                {Object.entries(domainScores).map(([domain, score]) => (
                  <div
                    key={domain}
                    className="flex justify-between text-sm"
                  >
                    <span>{domain}</span>
                    <span className="font-medium">
                      {score}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Recommended Domain
                </p>
                <p className="text-sm font-semibold mt-1">
                  {recommendedDomains.join(", ")}
                </p>
                <p className="mt-2 text-sm font-medium">
                  Skill Level: <span className="text-primary">{skillLevel}</span>
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
                setDomainScores({})
                setRecommendedDomains([])
                setTimeLeft(300)
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