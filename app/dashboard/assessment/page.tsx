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

import { Timer, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AssessmentPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)

  const [domainScores, setDomainScores] = useState<Record<string, number>>({})
  const [recommendedDomains, setRecommendedDomains] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(300)
  const [skillLevel, setSkillLevel] = useState("")
  const [showDomainSelect, setShowDomainSelect] = useState(false)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [aiRecommendation, setAiRecommendation] = useState("")

  // ================= FETCH QUESTIONS =================
  const fetchQuestions = async () => {
    setLoading(true)

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
      const filtered = data.filter((q) =>
        selectedDomains.includes(q.domains?.[0]?.name)
      )

      const grouped: Record<string, any[]> = {}

      filtered.forEach((q) => {
        const domain = q.domains?.[0]?.name
        if (!grouped[domain]) grouped[domain] = []
        grouped[domain].push(q)
      })

      let finalQuestions: any[] = []

      Object.values(grouped).forEach((arr) => {
        finalQuestions.push(...arr.slice(0, 5))
      })

      setQuestions(finalQuestions)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (started) {
      fetchQuestions()
    }
  }, [started])

  // ================= TIMER =================
  useEffect(() => {
    if (!started || showResult) return

    if (timeLeft <= 0) {
      evaluateAssessment()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [started, timeLeft, showResult])

  // ================= HANDLE ANSWER =================
  const handleAnswer = (questionId: string, selectedOption: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }))
  }

  // ================= NEXT =================
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      evaluateAssessment()
    }
  }

  // ================= EVALUATION =================
  const evaluateAssessment = async () => {
    let scores: Record<string, number> = {}

    questions.forEach((q) => {
      const domain = q.domains?.[0]?.name
      if (!scores[domain]) scores[domain] = 0

      if (answers[q.id] === q.correct_answer) {
        scores[domain]++
      }
    })

    setDomainScores(scores)

    const values = Object.values(scores)
    const maxScore = Math.max(...values)

    let recommended: string[] =
      maxScore === 0
        ? ["Beginner Freelancing Path"]
        : Object.keys(scores).filter((d) => scores[d] === maxScore)

    setRecommendedDomains(recommended)

    const totalScore = values.reduce((a, b) => a + b, 0)
    const percentage = (totalScore / questions.length) * 100

    let level =
      percentage >= 80
        ? "Advanced"
        : percentage >= 50
          ? "Intermediate"
          : "Beginner"

    setSkillLevel(level)

    // ================= AI CALL =================
    let aiText = "AI recommendation not available." // ✅ DEFINE HERE

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scores }),
      })

      const aiData = await res.json()
      aiText = aiData.result || "No AI response"

      setAiRecommendation(aiText)

    } catch (err) {
      console.error("AI Error:", err)
      aiText = "AI recommendation not available."
      setAiRecommendation(aiText)
    }

    // ================= SAVE =================
    const { data: userData } = await supabase.auth.getUser()

    if (userData?.user) {
      await supabase.from("assessment_results").insert({
        user_id: userData.user.id,
        domain_scores: scores,
        recommended_domain: recommended,
        total_score: totalScore,
        skill_level: level,
        ai_recommendation: aiText,
      })
    }
    setShowResult(true)
  }

  // ================= RESET =================
  const resetAssessment = () => {
    setShowResult(false)
    setStarted(false)
    setCurrentQuestion(0)
    setAnswers({})
    setDomainScores({})
    setRecommendedDomains([])
    setSelectedDomains([])
    setAiRecommendation("")
    setTimeLeft(300)
  }

  // ================= UI =================
  if (!started) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Skill Assessment</h1>

        <Card>
          <CardHeader>
            <CardTitle>Freelancing Skill Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowDomainSelect(true)} className="w-full">
              Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* DOMAIN SELECT */}
        <Dialog open={showDomainSelect} onOpenChange={setShowDomainSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Domains</DialogTitle>
              <DialogDescription>Max 3</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              {["Frontend", "Backend", "Python", "Content Writing", "Graphic Design"].map((domain) => {
                const selected = selectedDomains.includes(domain)

                return (
                  <div
                    key={domain}
                    onClick={() => {
                      if (selected) {
                        setSelectedDomains(selectedDomains.filter(d => d !== domain))
                      } else if (selectedDomains.length < 3) {
                        setSelectedDomains([...selectedDomains, domain])
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4",
                      selected && "border-primary bg-primary/10"
                    )}
                  >
                    {domain}
                  </div>
                )
              })}
            </div>

            <Button
              className="w-full mt-4"
              disabled={!selectedDomains.length}
              onClick={() => {
                setShowDomainSelect(false)
                setStarted(true)
              }}
            >
              Start Test
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ================= QUESTIONS =================
  return (
    <div className="space-y-6">
      <Badge>{timeLeft}s</Badge>

      <Progress value={((currentQuestion + 1) / questions.length) * 100} />

      <Card>
        <CardContent className="p-6 space-y-6">
          <h2>{questions[currentQuestion]?.question_text}</h2>

          <RadioGroup
            value={answers[questions[currentQuestion]?.id]}
            onValueChange={(val) =>
              handleAnswer(questions[currentQuestion]?.id, val)
            }
          >
            {questions[currentQuestion]?.options.map((opt: string) => (
              <Label key={opt}>
                <RadioGroupItem value={opt} /> {opt}
              </Label>
            ))}
          </RadioGroup>

          <Button onClick={handleNext}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* RESULT */}
      <Dialog open={showResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Result</DialogTitle>
          </DialogHeader>

          <p>Domains: {recommendedDomains.join(", ")}</p>
          <p>Level: {skillLevel}</p>

          {/* AI */}
          <div className="p-3 border rounded">
            <p className="text-xs">AI Recommendation</p>
            <p>{aiRecommendation}</p>
          </div>

          <Button onClick={resetAssessment}>Restart</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}