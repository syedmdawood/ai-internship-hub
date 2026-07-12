"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  Bot,
  Calendar,
  CheckCircle2,
  Code,
  Download,
  ExternalLink,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Palette,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/progress-bar";

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  difficulty_level: string | null;
  deliverable_type: string | null;
  evaluation_type: string | null;
};

type AssignmentData = {
  id: string;
  student_id: string;
  task_id: string;
  status: string;
  mentor_score: number | string | null;
  assigned_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
};

type SubmissionData = {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string | null;
  submission_text: string | null;
  submission_url: string | null;
  github_url: string | null;
  figma_url: string | null;
  screenshot_url: string | null;
  code_snippets: unknown;
  code_files: unknown;
  notes: string | null;
  files: unknown;
  status: string | null;
};

type EvaluationData = {
  id: string;
  assignment_id: string;
  submission_id: string | null;
  student_id: string;
  evaluation_type: string | null;
  ai_score: number | string | null;
  ai_feedback: string | null;
  strengths: unknown;
  improvements: unknown;
  plagiarism_risk: string | null;
  plagiarism_score: number | string | null;
  grammar_score: number | string | null;
  code_quality_score:
    | number
    | string
    | null;
  design_quality_score:
    | number
    | string
    | null;
  correctness_score:
    | number
    | string
    | null;
  evaluated_at: string | null;
};

type MentorFeedbackData = {
  id: string;
  assignment_id: string;
  submission_id: string | null;
  student_id: string;
  mentor_id: string;
  subject: string;
  message: string;
  mentor_score: number | string | null;
  decision: string | null;
  is_visible_to_student: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type FeedbackItem = {
  assignment: AssignmentData;
  task: TaskData | null;
  submission: SubmissionData | null;
  evaluation: EvaluationData | null;
  mentorFeedback: MentorFeedbackData | null;
  latestActivityAt: string | null;
};

type FeedbackResponse = {
  success: boolean;
  feedbackItems: FeedbackItem[];
  error?: string;
};

function normalizeList(
  value: unknown
): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null
        ) {
          const object =
            item as Record<
              string,
              unknown
            >;

          const text =
            object.text ??
            object.message ??
            object.value ??
            object.description;

          return typeof text === "string"
            ? text
            : JSON.stringify(item);
        }

        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return normalizeList(parsed);
      }

      return [value];
    } catch {
      return [value];
    }
  }

  return [];
}

function normalizeFiles(
  value: unknown
): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null
        ) {
          const object =
            item as Record<
              string,
              unknown
            >;

          const filename =
            object.filename ??
            object.file_name ??
            object.name ??
            object.url;

          return typeof filename === "string"
            ? filename
            : JSON.stringify(item);
        }

        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return normalizeFiles(parsed);
      }

      return [value];
    } catch {
      return [value];
    }
  }

  return [];
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function numericValue(
  value:
    | number
    | string
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getPerformanceLabel(
  score: number
) {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 80) {
    return "Strong";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 50) {
    return "Needs Improvement";
  }

  return "Poor";
}

function getRiskLabel(
  risk?: string | null
) {
  if (!risk) {
    return "Not available";
  }

  const value = risk.toLowerCase();

  if (value === "low") {
    return "Low Risk";
  }

  if (value === "medium") {
    return "Medium Risk";
  }

  if (value === "high") {
    return "High Risk";
  }

  return risk;
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getStatusVariant(
  status: string
):
  | "default"
  | "secondary"
  | "outline"
  | "destructive" {
  const normalized =
    status.toLowerCase();

  if (
    normalized === "approved" ||
    normalized === "completed"
  ) {
    return "default";
  }

  if (
    normalized === "submitted" ||
    normalized === "reviewed"
  ) {
    return "secondary";
  }

  return "outline";
}

function TaskFeedbackCard({
  item,
  isLatest,
}: {
  item: FeedbackItem;
  isLatest: boolean;
}) {
  const evaluation = item.evaluation;
  const submission = item.submission;
  const mentorFeedback =
    item.mentorFeedback;

  const strengths = useMemo(
    () =>
      normalizeList(
        evaluation?.strengths
      ),
    [evaluation?.strengths]
  );

  const improvements = useMemo(
    () =>
      normalizeList(
        evaluation?.improvements
      ),
    [evaluation?.improvements]
  );

  const files = useMemo(
    () =>
      normalizeFiles(
        submission?.files
      ),
    [submission?.files]
  );

  const aiScore =
    numericValue(
      evaluation?.ai_score
    );

  const mentorScore =
    numericValue(
      mentorFeedback?.mentor_score ??
        item.assignment.mentor_score
    );

  const scoreBreakdown = useMemo(() => {
    if (!evaluation) {
      return [];
    }

    const items: {
      label: string;
      score: number;
      icon: typeof Code;
    }[] = [];

    const correctness =
      numericValue(
        evaluation.correctness_score
      );

    const codeQuality =
      numericValue(
        evaluation.code_quality_score
      );

    const grammar =
      numericValue(
        evaluation.grammar_score
      );

    const design =
      numericValue(
        evaluation.design_quality_score
      );

    const plagiarism =
      numericValue(
        evaluation.plagiarism_score
      );

    if (correctness !== null) {
      items.push({
        label: "Correctness",
        score: correctness,
        icon: CheckCircle2,
      });
    }

    if (codeQuality !== null) {
      items.push({
        label: "Code Quality",
        score: codeQuality,
        icon: Code,
      });
    }

    if (grammar !== null) {
      items.push({
        label: "Grammar Quality",
        score: grammar,
        icon: FileText,
      });
    }

    if (design !== null) {
      items.push({
        label: "Design Quality",
        score: design,
        icon: Palette,
      });
    }

    if (plagiarism !== null) {
      items.push({
        label: "Originality",
        score: Math.max(
          0,
          100 - plagiarism
        ),
        icon: ShieldCheck,
      });
    }

    if (
      items.length === 0 &&
      aiScore !== null
    ) {
      items.push({
        label: "Overall AI Score",
        score: aiScore,
        icon: Award,
      });
    }

    return items;
  }, [evaluation, aiScore]);

  return (
    <Card
      id={`feedback-${item.assignment.id}`}
      className={
        isLatest
          ? "border-primary/50 shadow-md"
          : "border-border/50 shadow-sm"
      }
    >
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">
                {item.task?.title ||
                  "Submitted Task"}
              </CardTitle>

              {isLatest && (
                <Badge>
                  Latest Feedback
                </Badge>
              )}

              <Badge
                variant={getStatusVariant(
                  item.assignment.status
                )}
              >
                {formatStatus(
                  item.assignment.status
                )}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {item.task?.description ||
                "No task description available."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {item.task
                ?.evaluation_type && (
                <Badge variant="secondary">
                  {
                    item.task
                      .evaluation_type
                  }
                </Badge>
              )}

              {item.task
                ?.difficulty_level && (
                <Badge variant="outline">
                  {
                    item.task
                      .difficulty_level
                  }
                </Badge>
              )}

              {item.task
                ?.deliverable_type && (
                <Badge variant="outline">
                  {
                    item.task
                      .deliverable_type
                  }
                </Badge>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground sm:text-right">
            <p className="flex items-center gap-2 sm:justify-end">
              <Calendar className="h-4 w-4" />

              Latest activity
            </p>

            <p className="mt-1 font-medium text-foreground">
              {formatDate(
                item.latestActivityAt
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              Submitted
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatDate(
                submission?.submitted_at ??
                  item.assignment
                    .submitted_at
              )}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              AI Score
            </p>

            <p className="mt-1 text-xl font-bold">
              {aiScore !== null
                ? `${aiScore}%`
                : "Pending"}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              Mentor Score
            </p>

            <p className="mt-1 text-xl font-bold">
              {mentorScore !== null
                ? `${mentorScore}%`
                : "Pending"}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">
              Review Decision
            </p>

            <p className="mt-1 text-sm font-semibold capitalize">
              {mentorFeedback?.decision
                ? formatStatus(
                    mentorFeedback.decision
                  )
                : "Not reviewed"}
            </p>
          </div>
        </div>

        {evaluation ? (
          <div className="space-y-5 rounded-xl border bg-muted/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />

                <h3 className="font-semibold">
                  AI Evaluation
                </h3>
              </div>

              {aiScore !== null && (
                <Badge variant="secondary">
                  <TrendingUp className="mr-1 h-3 w-3" />

                  {getPerformanceLabel(
                    aiScore
                  )}
                </Badge>
              )}
            </div>

            {scoreBreakdown.length >
              0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {scoreBreakdown.map(
                  (scoreItem) => (
                    <div
                      key={
                        scoreItem.label
                      }
                      className="space-y-2 rounded-lg border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <scoreItem.icon className="h-4 w-4 text-primary" />

                        <span className="flex-1 text-sm font-medium">
                          {
                            scoreItem.label
                          }
                        </span>

                        <span className="text-sm font-bold">
                          {
                            scoreItem.score
                          }
                          %
                        </span>
                      </div>

                      <ProgressBar
                        value={
                          scoreItem.score
                        }
                        showValue={false}
                        size="sm"
                      />
                    </div>
                  )
                )}
              </div>
            )}

            <div className="rounded-lg border bg-background p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                AI Feedback
              </p>

              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {evaluation.ai_feedback ||
                  "No AI feedback was provided."}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Strengths
                </p>

                {strengths.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {strengths.map(
                      (
                        strength,
                        index
                      ) => (
                        <li
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                          {strength}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm">
                    No strengths listed.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4" />
                  Areas to Improve
                </p>

                {improvements.length >
                0 ? (
                  <ul className="space-y-2 text-sm">
                    {improvements.map(
                      (
                        improvement,
                        index
                      ) => (
                        <li
                          key={index}
                          className="flex items-start gap-2"
                        >
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />

                          {improvement}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm">
                    No improvement points
                    listed.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  Plagiarism Risk
                </p>

                <p className="mt-1 font-semibold">
                  {getRiskLabel(
                    evaluation.plagiarism_risk
                  )}
                </p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  Similarity Score
                </p>

                <p className="mt-1 font-semibold">
                  {numericValue(
                    evaluation.plagiarism_score
                  ) ?? 0}
                  %
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-5">
            <p className="font-medium">
              AI evaluation is pending
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              The task was submitted, but its
              AI evaluation is not available
              yet.
            </p>
          </div>
        )}

        {mentorFeedback ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" />

                <h3 className="font-semibold">
                  Mentor Feedback
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {mentorFeedback.decision && (
                  <Badge className="capitalize">
                    {formatStatus(
                      mentorFeedback.decision
                    )}
                  </Badge>
                )}

                {mentorScore !== null && (
                  <Badge variant="outline">
                    Mentor Score:{" "}
                    {mentorScore}%
                  </Badge>
                )}
              </div>
            </div>

            <p className="font-semibold">
              {mentorFeedback.subject}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {mentorFeedback.message}
            </p>

            <p className="mt-4 text-xs text-muted-foreground">
              Reviewed on{" "}
              {formatDate(
                mentorFeedback.updated_at ??
                  mentorFeedback.created_at
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-5">
            <p className="font-medium">
              Mentor feedback is pending
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              A mentor has not reviewed this
              task yet.
            </p>
          </div>
        )}

        {submission && (
          <div className="rounded-xl border p-5">
            <h3 className="mb-4 font-semibold">
              Submission Details
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {submission.github_url && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    GitHub Repository
                  </p>

                  <a
                    href={
                      submission.github_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open GitHub

                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {submission.figma_url && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Figma Design
                  </p>

                  <a
                    href={
                      submission.figma_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open Figma

                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {submission.submission_url &&
                !submission.github_url &&
                !submission.figma_url && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Project URL
                    </p>

                    <a
                      href={
                        submission.submission_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open Submission

                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
            </div>

            {submission.submission_text && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Submission Description
                </p>

                <p className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
                  {
                    submission.submission_text
                  }
                </p>
              </div>
            )}

            {submission.notes && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Student Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
                  {submission.notes}
                </p>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Submitted Files
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map(
                    (file, index) => (
                      <Badge
                        key={`${file}-${index}`}
                        variant="outline"
                      >
                        {file}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedbackPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [
    feedbackItems,
    setFeedbackItems,
  ] = useState<FeedbackItem[]>([]);

  const fetchFeedback =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.replace("/login");
          return;
        }

        /*
         * Always fetch the full feedback
         * history. Do not limit the page to
         * one assignment.
         */
        const response = await fetch(
          "/api/task/evaluation",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
              Accept:
                "application/json",
            },
            cache: "no-store",
          }
        );

        const responseText =
          await response.text();

        let result: FeedbackResponse;

        try {
          result = responseText
            ? JSON.parse(responseText)
            : {
                success: false,
                feedbackItems: [],
              };
        } catch {
          throw new Error(
            "The feedback API returned an invalid response"
          );
        }

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Failed to load feedback"
          );
        }

        const items = Array.isArray(
          result.feedbackItems
        )
          ? result.feedbackItems
          : [];

        /*
         * Sort again in the frontend as a
         * defensive measure.
         */
        items.sort(
          (first, second) => {
            const firstTime =
              first.latestActivityAt
                ? new Date(
                    first.latestActivityAt
                  ).getTime()
                : 0;

            const secondTime =
              second.latestActivityAt
                ? new Date(
                    second.latestActivityAt
                  ).getTime()
                : 0;

            return secondTime - firstTime;
          }
        );

        setFeedbackItems(items);
      } catch (fetchError) {
        console.error(
          "Feedback loading error:",
          fetchError
        );

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }, [router]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />

          <p className="mt-3 text-sm text-muted-foreground">
            Loading your feedback history...
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

          <h2 className="mt-4 text-lg font-semibold">
            Feedback could not be loaded
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={fetchFeedback}
            >
              Try Again
            </Button>

            <Button asChild>
              <Link href="/dashboard/tasks">
                Back to Tasks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedbackItems.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />

          <h2 className="mt-4 text-lg font-semibold">
            No feedback available yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Submit a task first. AI evaluation
            and mentor feedback will appear here
            when they become available.
          </p>

          <Button asChild className="mt-6">
            <Link href="/dashboard/tasks">
              Go to Tasks
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const aiReviewedCount =
    feedbackItems.filter(
      (item) => item.evaluation
    ).length;

  const mentorReviewedCount =
    feedbackItems.filter(
      (item) => item.mentorFeedback
    ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-2 px-0"
          >
            <Link href="/dashboard/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" />

              Back to Tasks
            </Link>
          </Button>

          <h1 className="text-2xl font-bold">
            Feedback History
          </h1>

          <p className="mt-1 text-muted-foreground">
            View AI evaluations and mentor
            feedback for all submitted and
            completed tasks.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => window.print()}
        >
          <Download className="mr-2 h-4 w-4" />

          Print / Save All
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Submitted Tasks
            </p>

            <p className="mt-1 text-2xl font-bold">
              {feedbackItems.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              AI Evaluated
            </p>

            <p className="mt-1 text-2xl font-bold">
              {aiReviewedCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Mentor Reviewed
            </p>

            <p className="mt-1 text-2xl font-bold">
              {mentorReviewedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {feedbackItems.map(
          (item, index) => (
            <TaskFeedbackCard
              key={item.assignment.id}
              item={item}
              isLatest={index === 0}
            />
          )
        )}
      </div>
    </div>
  );
}