"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Domain = {
  id: string;
  name: string;
};

type Question = {
  id: string;
  question_text: string;
  options: string[];
  domains?: {
    name: string;
  } | null;
};

type AssessmentResult = {
  recommendedDomains: string[];
  skillLevel: string;
  aiRecommendation: string;
  totalScore: number;
  totalQuestions: number;
  percentageScore: number;
  domainScores: Record<
    string,
    {
      correct: number;
      total: number;
      percentage: number;
    }
  >;
};

export default function AssessmentPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [started, setStarted] = useState(false);
  const [showDomainSelect, setShowDomainSelect] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(300);

  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    const loadDomains = async () => {
      setLoadingDomains(true);

      const { data, error } = await supabase
        .from("domains")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setDomains(data);
      } else {
        console.error(error);
      }

      setLoadingDomains(false);
    };

    loadDomains();
  }, []);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);

    const { data, error } = await supabase.from("questions").select(`
      id,
      question_text,
      options,
      domains ( name )
    `);

    if (!error && data) {
      const filtered = data.filter((q) =>
        selectedDomains.includes(q.domains?.name || ""),
      );

      const parsed: Question[] = filtered.map((q) => {
        let options = q.options;

        if (typeof options === "string") {
          try {
            options = JSON.parse(options);
          } catch {
            options = [];
          }
        }

        return {
          ...q,
          options: Array.isArray(options) ? options : [],
        };
      });

      parsed.sort(() => Math.random() - 0.5);
      setQuestions(parsed.slice(0, 30));
    } else {
      console.error(error);
    }

    setLoadingQuestions(false);
  };

  useEffect(() => {
    if (started && selectedDomains.length) {
      fetchQuestions();
    }
  }, [started, selectedDomains]);

  useEffect(() => {
    if (!started || showResult || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, showResult, submitting]);

  const handleAnswer = (questionId: string, selectedOption: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    handleSubmitAssessment();
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitAssessment = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // ✅ GET CURRENT USER SESSION
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("User not authenticated");
      }

      // ✅ CALL YOUR API WITH TOKEN
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // ⭐ IMPORTANT
        },
        body: JSON.stringify({
          selectedDomains,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assessment");
      }

      // ✅ SET RESULT FROM BACKEND
      setResult(data);
      setShowResult(true);
    } catch (error) {
      console.error("Assessment submit failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setStarted(false);
    setShowDomainSelect(false);
    setSelectedDomains([]);
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(300);
    setResult(null);
    setShowResult(false);
  };

  if (!started) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Skill Assessment</h1>

        <Card>
          <CardHeader>
            <CardTitle>Freelancing Skill Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select up to 3 domains and take a timed assessment to get your
              recommended freelancing path.
            </p>

            <Button
              onClick={() => setShowDomainSelect(true)}
              className="w-full"
              disabled={loadingDomains}
            >
              Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showDomainSelect} onOpenChange={setShowDomainSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Domains</DialogTitle>
              <DialogDescription>Choose up to 3 domains</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3">
              {domains.map((domain) => {
                const selected = selectedDomains.includes(domain.name);

                return (
                  <div
                    key={domain.id}
                    onClick={() => {
                      if (selected) {
                        setSelectedDomains((prev) =>
                          prev.filter((d) => d !== domain.name),
                        );
                      } else if (selectedDomains.length < 3) {
                        setSelectedDomains((prev) => [...prev, domain.name]);
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 text-center transition",
                      selected && "border-primary bg-primary/10",
                    )}
                  >
                    {domain.name}
                  </div>
                );
              })}
            </div>

            <Button
              className="mt-4 w-full"
              disabled={!selectedDomains.length}
              onClick={() => {
                setShowDomainSelect(false);
                setStarted(true);
              }}
            >
              Start Test
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (loadingQuestions) return <p>Loading questions...</p>;
  if (!questions.length) return <p>No questions found for selected domains.</p>;

  const currentQuestionId = questions[currentQuestion]?.id;
  const hasAnsweredCurrent = !!answers[currentQuestionId];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Badge className="px-4 py-2 text-lg">{timeLeft}s</Badge>
        <Badge variant="outline">
          Question {currentQuestion + 1} of {questions.length}
        </Badge>
      </div>

      <Progress value={((currentQuestion + 1) / questions.length) * 100} />

      <Card className="shadow-lg">
        <CardContent className="space-y-6 p-6">
          <h2 className="text-lg font-semibold">
            {questions[currentQuestion]?.question_text}
          </h2>

          <RadioGroup
            value={answers[currentQuestionId]}
            onValueChange={(val) => handleAnswer(currentQuestionId, val)}
          >
            {questions[currentQuestion]?.options.map((opt) => (
              <Label
                key={opt}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted"
              >
                <RadioGroupItem value={opt} />
                {opt}
              </Label>
            ))}
          </RadioGroup>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent || submitting}
            >
              {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assessment Result</DialogTitle>
          </DialogHeader>

          <p>
            <strong>Recommended Domains:</strong>{" "}
            {result?.recommendedDomains.join(", ")}
          </p>
          <p>
            <strong>Skill Level:</strong> {result?.skillLevel}
          </p>
          <p>
            <strong>Score:</strong> {result?.totalScore} /{" "}
            {result?.totalQuestions} ({result?.percentageScore}%)
          </p>

          <div className="rounded border p-3">
            <p className="text-xs font-medium">AI Recommendation</p>
            <p>{result?.aiRecommendation}</p>
          </div>

          <Button onClick={resetAssessment}>Restart</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
