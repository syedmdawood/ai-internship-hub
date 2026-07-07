"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Award,
  Download,
  TrendingUp,
  Code,
  Palette,
  FileText,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Calendar,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/progress-bar";

type TaskData = {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  deliverable_type: string;
  evaluation_type: string;
};

type SubmissionData = {
  id: string;
  submitted_at: string;
  submission_text: string | null;
  submission_url: string | null;
  github_url: string | null;
  figma_url: string | null;
  screenshot_url: string | null;
  code_snippets: string | null;
  notes: string | null;
  files: unknown;
  status: string;
};

type EvaluationData = {
  id: string;
  assignment_id: string;
  evaluation_type: string;
  ai_score: number;
  ai_feedback: string | null;
  strengths: unknown;
  improvements: unknown;
  plagiarism_risk: string | null;
  plagiarism_score: number | null;
  grammar_score: number | null;
  code_quality_score: number | null;
  design_quality_score: number | null;
  correctness_score: number | null;
  evaluated_at: string;
  task: TaskData | null;
  submission: SubmissionData | null;
};

function normalizeList(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
      return [value];
    } catch {
      return [value];
    }
  }

  return [];
}

function normalizeFiles(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
      return [value];
    } catch {
      return [value];
    }
  }

  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getPerformanceLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

function getRiskLabel(risk?: string | null) {
  if (!risk) return "Not Available";

  const value = risk.toLowerCase();

  if (value === "low") return "Low Risk";
  if (value === "medium") return "Medium Risk";
  if (value === "high") return "High Risk";

  return risk;
}

export default function FeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);

  const evaluation = evaluations[0] || null;

  const strengths = useMemo(
    () => normalizeList(evaluation?.strengths),
    [evaluation]
  );

  const improvements = useMemo(
    () => normalizeList(evaluation?.improvements),
    [evaluation]
  );

  const files = useMemo(
    () => normalizeFiles(evaluation?.submission?.files),
    [evaluation]
  );

  const scoreBreakdown = useMemo(() => {
    if (!evaluation) return [];

    const items: {
      label: string;
      score: number;
      icon: typeof Code;
    }[] = [];

    if (evaluation.correctness_score !== null && evaluation.correctness_score !== undefined) {
      items.push({
        label: "Correctness",
        score: Number(evaluation.correctness_score),
        icon: CheckCircle2,
      });
    }

    if (evaluation.code_quality_score !== null && evaluation.code_quality_score !== undefined) {
      items.push({
        label: "Code Quality",
        score: Number(evaluation.code_quality_score),
        icon: Code,
      });
    }

    if (evaluation.grammar_score !== null && evaluation.grammar_score !== undefined) {
      items.push({
        label: "Grammar Quality",
        score: Number(evaluation.grammar_score),
        icon: FileText,
      });
    }

    if (evaluation.design_quality_score !== null && evaluation.design_quality_score !== undefined) {
      items.push({
        label: "Design Quality",
        score: Number(evaluation.design_quality_score),
        icon: Palette,
      });
    }

    if (evaluation.plagiarism_score !== null && evaluation.plagiarism_score !== undefined) {
      items.push({
        label: "Originality",
        score: Math.max(0, 100 - Number(evaluation.plagiarism_score)),
        icon: ShieldCheck,
      });
    }

    if (items.length === 0) {
      items.push({
        label: "Overall AI Score",
        score: Number(evaluation.ai_score || 0),
        icon: Award,
      });
    }

    return items;
  }, [evaluation]);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session) {
          router.replace("/login");
          return;
        }

        const url = assignmentId
          ? `/api/task/evaluation?assignmentId=${assignmentId}`
          : "/api/task/evaluation";

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Failed to load feedback.");
        }

        setEvaluations(result.evaluations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [assignmentId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading AI feedback...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Feedback could not be loaded
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>

          <Button asChild className="mt-6">
            <Link href="/dashboard/tasks">Back to Tasks</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />

          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No AI feedback available yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Submit a task first. After AI evaluation is completed, your feedback
            will appear here.
          </p>

          <Button asChild className="mt-6">
            <Link href="/dashboard/tasks">Go to Tasks</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overallScore = Number(evaluation.ai_score || 0);
  const task = evaluation.task;
  const submission = evaluation.submission;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 px-0">
            <Link href="/dashboard/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>

          <h1 className="text-2xl font-bold text-foreground">AI Feedback</h1>
          <p className="mt-1 text-muted-foreground">
            Automated evaluation result for your submitted task.
          </p>
        </div>

        <Button variant="outline" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Print / Save Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary/20">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {overallScore}
                        </p>
                        <p className="text-xs text-muted-foreground">/ 100</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <Badge className="mb-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {getPerformanceLabel(overallScore)}
                  </Badge>

                  <h2 className="text-xl font-bold text-foreground">
                    {task?.title || "Submitted Task"}
                  </h2>

                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {task?.evaluation_type && (
                      <Badge variant="secondary">
                        {task.evaluation_type}
                      </Badge>
                    )}

                    {task?.difficulty_level && (
                      <Badge variant="outline">
                        {task.difficulty_level}
                      </Badge>
                    )}

                    <Badge variant="outline">
                      AI Evaluated
                    </Badge>
                  </div>

                  <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                    <Calendar className="h-4 w-4" />
                    Submitted on {formatDate(submission?.submitted_at)}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Evaluated on {formatDate(evaluation.evaluated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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

                    <span className="flex-1 text-sm font-medium text-foreground">
                      {item.label}
                    </span>

                    <span className="text-sm font-bold text-foreground">
                      {item.score}%
                    </span>
                  </div>

                  <ProgressBar value={item.score} showValue={false} size="sm" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-primary" />
                AI-Generated Feedback
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Feedback
                </p>

                <p className="text-sm leading-relaxed text-foreground">
                  {evaluation.ai_feedback || "No feedback provided."}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-700">
                  Strengths
                </p>

                {strengths.length > 0 ? (
                  <ul className="space-y-2 text-sm text-emerald-800">
                    {strengths.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-800">
                    No strengths listed.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-700">
                  Areas to Improve
                </p>

                {improvements.length > 0 ? (
                  <ul className="space-y-2 text-sm text-amber-800">
                    {improvements.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-800">
                    No improvement points listed.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Originality Check
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Plagiarism / Similarity Risk
                </p>

                <p className="mt-1 text-lg font-bold text-foreground">
                  {getRiskLabel(evaluation.plagiarism_risk)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Similarity Score
                </p>

                <p className="mt-1 text-lg font-bold text-foreground">
                  {evaluation.plagiarism_score ?? 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Submission Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {submission?.github_url && (
                <div>
                  <p className="text-xs text-muted-foreground">GitHub URL</p>
                  <a
                    href={submission.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-primary hover:underline"
                  >
                    Open GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {submission?.figma_url && (
                <div>
                  <p className="text-xs text-muted-foreground">Figma URL</p>
                  <a
                    href={submission.figma_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-primary hover:underline"
                  >
                    Open Figma
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {submission?.submission_url && !submission?.github_url && !submission?.figma_url && (
                <div>
                  <p className="text-xs text-muted-foreground">Project URL</p>
                  <a
                    href={submission.submission_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-primary hover:underline"
                  >
                    Open Submission
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {files.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Files</p>

                  <ul className="mt-2 space-y-1">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className="rounded-md border border-border/50 px-3 py-2 text-muted-foreground"
                      >
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submission?.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Student Notes</p>
                  <p className="mt-1 rounded-md border border-border/50 p-3 text-muted-foreground">
                    {submission.notes}
                  </p>
                </div>
              )}

              {!submission?.github_url &&
                !submission?.figma_url &&
                !submission?.submission_url &&
                files.length === 0 &&
                !submission?.notes && (
                  <p className="text-sm text-muted-foreground">
                    No additional submission details available.
                  </p>
                )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Overall Score
              </p>

              <p className="mt-2 text-4xl font-bold text-primary">
                {overallScore}/100
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {getPerformanceLabel(overallScore)} performance
              </p>
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Print / Save Report
          </Button>
        </div>
      </div>
    </div>
  );
}