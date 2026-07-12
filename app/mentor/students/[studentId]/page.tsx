"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Code2,
  Download,
  FileArchive,
  FileCode2,
  FolderArchive,
  UserRound,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Loader2, MessageSquareText, Save } from "lucide-react";

type StudentProfile = {
  id: string;
  full_name: string | null;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  skill_level: string | null;
  current_skill_level: string | null;
  recommended_domain: string | null;
  primary_domain: string | null;
  secondary_domains: string[] | null;
};

type TaskInformation = {
  id: string;
  title: string;
  description: string | null;
  difficulty_level: string | null;
  estimated_minutes: number | null;
  evaluation_type: string | null;
  deliverable_type: string | null;
  instructions: string | null;
  tags: string[] | null;
};

type TaskSubmission = {
  id: string;
  assignment_id: string;
  student_id?: string;
  submission_text: string | null;
  submission_url: string | null;
  code_snippets: unknown;
  code_files: unknown;
  figma_url: string | null;
  screenshot_url: string | null;
  files: unknown;
  notes: string | null;
  checklist: unknown;
  status: string | null;
  submitted_at: string | null;
};

type TaskEvaluation = {
  id: string;
  assignment_id: string;
  submission_id: string | null;
  evaluation_type: string | null;
  ai_score: number | string | null;
  ai_feedback: string | null;
  strengths: unknown;
  improvements: unknown;
  plagiarism_risk: string | null;
  plagiarism_score: number | string | null;
  grammar_score: number | string | null;
  code_quality_score: number | string | null;
  design_quality_score: number | string | null;
  correctness_score: number | string | null;
  evaluated_at: string | null;
};

type StudentAssignment = {
  id: string;
  student_id: string;
  task_id: string;
  status: string;
  recommendation_score: number | string | null;
  recommendation_reason: string | null;
  assigned_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  mentor_score: number | string | null;
  task: TaskInformation | null;
  submission: TaskSubmission | null;
  evaluation: TaskEvaluation | null;
  mentorFeedback: MentorFeedback | null;
};

type StudentDetailResponse = {
  success: boolean;
  student: StudentProfile;
  latestAssessment: unknown;
  assessmentHistory: unknown[];
  assignments: StudentAssignment[];
  generalFeedback: MentorFeedback[];
};

type CodeSnippetFile = {
  id: string;
  filename: string;
  language: string | null;
  content: string;
};

type UploadedFile = {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
};

type MentorFeedback = {
  id: string;
  mentor_id: string;
  student_id?: string;
  assignment_id: string | null;
  submission_id: string | null;
  subject: string;
  message: string;
  mentor_score: number | string | null;
  decision: string | null;
  is_visible_to_student: boolean;
  created_at: string | null;
  updated_at?: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return String(value);
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").trim();

  return cleaned || "code-snippet.txt";
}

function extensionFromLanguage(language: string | null) {
  const normalized = language?.trim().toLowerCase() ?? "";

  const extensions: Record<string, string> = {
    javascript: "js",
    js: "js",
    typescript: "ts",
    ts: "ts",
    react: "tsx",
    tsx: "tsx",
    jsx: "jsx",
    python: "py",
    py: "py",
    java: "java",
    c: "c",
    "c++": "cpp",
    cpp: "cpp",
    "c#": "cs",
    csharp: "cs",
    php: "php",
    html: "html",
    css: "css",
    json: "json",
    sql: "sql",
    dart: "dart",
    kotlin: "kt",
    swift: "swift",
    ruby: "rb",
    go: "go",
    rust: "rs",
    shell: "sh",
    bash: "sh",
  };

  return extensions[normalized] ?? "txt";
}

function firstString(object: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function normalizeCodeSnippets(value: unknown): CodeSnippetFile[] {
  const results: CodeSnippetFile[] = [];

  function addSnippet(
    content: string,
    index: number,
    preferredName?: string | null,
    language?: string | null,
  ) {
    if (!content.trim()) {
      return;
    }

    const extension = extensionFromLanguage(language ?? null);

    let filename =
      preferredName?.trim() || `code-snippet-${index + 1}.${extension}`;

    if (!filename.includes(".")) {
      filename = `${filename}.${extension}`;
    }

    results.push({
      id: `${index}-${results.length}`,
      filename: safeFilename(filename),
      language: language ?? null,
      content,
    });
  }

  function walk(currentValue: unknown, preferredName?: string) {
    if (currentValue === null || currentValue === undefined) {
      return;
    }

    if (typeof currentValue === "string") {
      const trimmedValue = currentValue.trim();

      if (!trimmedValue) {
        return;
      }

      /*
       * Some database values may be stored as
       * JSON strings. Try parsing them first.
       */
      if (trimmedValue.startsWith("[") || trimmedValue.startsWith("{")) {
        try {
          const parsedValue = JSON.parse(trimmedValue);

          if (typeof parsedValue === "object" && parsedValue !== null) {
            walk(parsedValue, preferredName);
            return;
          }
        } catch {
          // Treat it as normal source code.
        }
      }

      addSnippet(currentValue, results.length, preferredName);

      return;
    }

    if (Array.isArray(currentValue)) {
      currentValue.forEach((item, index) => {
        walk(item, preferredName || `code-snippet-${index + 1}`);
      });

      return;
    }

    if (typeof currentValue === "object") {
      const object = currentValue as Record<string, unknown>;

      const content = firstString(object, [
        "content",
        "code",
        "snippet",
        "source",
        "value",
      ]);

      const filename = firstString(object, [
        "filename",
        "file_name",
        "name",
        "title",
      ]);

      const language = firstString(object, ["language", "lang", "type"]);

      if (content) {
        addSnippet(
          content,
          results.length,
          filename || preferredName,
          language,
        );

        return;
      }

      Object.entries(object).forEach(([key, nestedValue]) => {
        walk(nestedValue, key);
      });
    }
  }

  walk(value);

  return results;
}

function normalizeUploadedFiles(value: unknown): UploadedFile[] {
  const results: UploadedFile[] = [];

  function addFile(
    url: string,
    filename?: string | null,
    mimeType?: string | null,
  ) {
    if (!url.trim()) {
      return;
    }

    let resolvedFilename = filename?.trim() || "";

    if (!resolvedFilename) {
      try {
        const parsedUrl = new URL(url);

        resolvedFilename = decodeURIComponent(
          parsedUrl.pathname.split("/").pop() || "uploaded-file",
        );
      } catch {
        resolvedFilename = "uploaded-file";
      }
    }

    if (results.some((item) => item.url === url)) {
      return;
    }

    results.push({
      id: `${results.length}-${url}`,
      filename: resolvedFilename,
      url,
      mimeType: mimeType ?? null,
    });
  }

  function walk(currentValue: unknown) {
    if (currentValue === null || currentValue === undefined) {
      return;
    }

    if (typeof currentValue === "string") {
      const trimmedValue = currentValue.trim();

      if (!trimmedValue) {
        return;
      }

      if (trimmedValue.startsWith("[") || trimmedValue.startsWith("{")) {
        try {
          walk(JSON.parse(trimmedValue));
          return;
        } catch {
          // Continue and treat as URL/path.
        }
      }

      if (
        trimmedValue.startsWith("http://") ||
        trimmedValue.startsWith("https://")
      ) {
        addFile(trimmedValue);
      }

      return;
    }

    if (Array.isArray(currentValue)) {
      currentValue.forEach(walk);
      return;
    }

    if (typeof currentValue === "object") {
      const object = currentValue as Record<string, unknown>;

      const url = firstString(object, [
        "url",
        "publicUrl",
        "public_url",
        "downloadUrl",
        "download_url",
        "signedUrl",
        "signed_url",
      ]);

      const filename = firstString(object, [
        "filename",
        "file_name",
        "name",
        "title",
      ]);

      const mimeType = firstString(object, ["mime_type", "mimeType", "type"]);

      if (url) {
        addFile(url, filename, mimeType);
        return;
      }

      Object.values(object).forEach(walk);
    }
  }

  walk(value);

  return results;
}

function isZipFile(file: UploadedFile) {
  const filename = file.filename.toLowerCase();

  const mimeType = file.mimeType?.toLowerCase() ?? "";

  return (
    filename.endsWith(".zip") ||
    mimeType.includes("zip") ||
    mimeType.includes("compressed")
  );
}

function downloadCodeSnippet(snippet: CodeSnippetFile) {
  const blob = new Blob([snippet.content], {
    type: "text/plain;charset=utf-8",
  });

  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = snippet.filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();

  if (normalized === "completed" || normalized === "approved") {
    return "default";
  }

  if (normalized === "reviewed" || normalized === "submitted") {
    return "secondary";
  }

  return "outline";
}

function MentorFeedbackForm({
  assignment,
  onSaved,
}: {
  assignment: StudentAssignment;
  onSaved: () => Promise<void> | void;
}) {
  const existingFeedback = assignment.mentorFeedback;

  const [subject, setSubject] = useState(existingFeedback?.subject ?? "");

  const [message, setMessage] = useState(existingFeedback?.message ?? "");

  const [mentorScore, setMentorScore] = useState(
    existingFeedback?.mentor_score !== null &&
      existingFeedback?.mentor_score !== undefined
      ? String(existingFeedback.mentor_score)
      : "",
  );

  const [decision, setDecision] = useState<"reviewed" | "approved">(
    existingFeedback?.decision === "approved" ? "approved" : "reviewed",
  );

  const [isVisibleToStudent, setIsVisibleToStudent] = useState(
    existingFeedback ? existingFeedback.is_visible_to_student : true,
  );

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSubject(assignment.mentorFeedback?.subject ?? "");

    setMessage(assignment.mentorFeedback?.message ?? "");

    setMentorScore(
      assignment.mentorFeedback?.mentor_score !== null &&
        assignment.mentorFeedback?.mentor_score !== undefined
        ? String(assignment.mentorFeedback.mentor_score)
        : "",
    );

    setDecision(
      assignment.mentorFeedback?.decision === "approved"
        ? "approved"
        : "reviewed",
    );

    setIsVisibleToStudent(
      assignment.mentorFeedback
        ? assignment.mentorFeedback.is_visible_to_student
        : true,
    );
  }, [assignment.mentorFeedback]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError(null);

      const trimmedSubject = subject.trim();

      const trimmedMessage = message.trim();

      if (!trimmedSubject) {
        throw new Error("Feedback subject is required");
      }

      if (!trimmedMessage) {
        throw new Error("Feedback message is required");
      }

      if (!mentorScore.trim()) {
        throw new Error("Mentor score is required");
      }

      const numericScore = Number(mentorScore);

      if (
        !Number.isFinite(numericScore) ||
        numericScore < 0 ||
        numericScore > 100
      ) {
        throw new Error("Mentor score must be between 0 and 100");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch("/api/mentor/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          studentId: assignment.student_id,

          assignmentId: assignment.id,

          subject: trimmedSubject,

          message: trimmedMessage,

          mentorScore: numericScore,

          decision,

          isVisibleToStudent,
        }),
      });

      const responseText = await response.text();

      let result: {
        success?: boolean;
        message?: string;
        error?: string;
        alreadyReviewed?: boolean;
      } = {};

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error("The feedback API returned an invalid response");
        }
      }

      if (!response.ok) {
        throw new Error(result.error || "Unable to save feedback");
      }

      toast.success(result.message || "Feedback saved successfully");

      await onSaved();
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save feedback";

      console.error("Mentor feedback error:", saveError);

      setFormError(errorMessage);

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!assignment.submission) {
    return (
      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
        Feedback cannot be provided because the student has not submitted this
        task.
      </div>
    );
  }

  /*
   * Your feedback API requires AI evaluation
   * before mentor review.
   */
  if (!assignment.evaluation) {
    return (
      <div className="rounded-lg border border-dashed p-5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-muted-foreground" />

          <p className="font-medium">Mentor feedback unavailable</p>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          AI evaluation must be completed before the mentor can review this
          task.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/10 p-4 sm:p-5">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />

          <h3 className="font-semibold">
            {existingFeedback
              ? "Update Mentor Feedback"
              : "Give Mentor Feedback"}
          </h3>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Review the student&apos;s work, provide a score and select the final
          task decision.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`subject-${assignment.id}`}>Feedback Subject</Label>

          <input
            id={`subject-${assignment.id}`}
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Example: Good implementation with minor improvements"
            disabled={saving}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`message-${assignment.id}`}>Detailed Feedback</Label>

          <Textarea
            id={`message-${assignment.id}`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Explain what the student did well and what should be improved..."
            rows={6}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`score-${assignment.id}`}>Mentor Score</Label>

            <input
              id={`score-${assignment.id}`}
              type="number"
              min={0}
              max={100}
              step={1}
              value={mentorScore}
              onChange={(event) => setMentorScore(event.target.value)}
              placeholder="0 - 100"
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`decision-${assignment.id}`}>Task Decision</Label>

            <select
              id={`decision-${assignment.id}`}
              value={decision}
              onChange={(event) =>
                setDecision(event.target.value as "reviewed" | "approved")
              }
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="reviewed">Complete Review</option>

              <option value="approved">Approve Task</option>
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
          <input
            type="checkbox"
            checked={isVisibleToStudent}
            onChange={(event) => setIsVisibleToStudent(event.target.checked)}
            disabled={saving}
            className="mt-1 h-4 w-4"
          />

          <div>
            <p className="text-sm font-medium">Visible to student</p>

            <p className="text-xs text-muted-foreground">
              Allow the student to view this feedback and mentor score.
            </p>
          </div>
        </label>

        {formError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Feedback...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />

                {existingFeedback ? "Update Feedback" : "Submit Feedback"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SubmittedTaskCard({
  assignment,
  onFeedbackSaved,
}: {
  assignment: StudentAssignment;
  onFeedbackSaved: () => Promise<void> | void;
}) {
  const codeSnippets = useMemo(
    () => normalizeCodeSnippets(assignment.submission?.code_snippets),
    [assignment.submission?.code_snippets],
  );

  const uploadedFiles = useMemo(() => {
    const fromCodeFiles = normalizeUploadedFiles(
      assignment.submission?.code_files,
    );

    const fromGeneralFiles = normalizeUploadedFiles(
      assignment.submission?.files,
    );

    const combined = [...fromCodeFiles, ...fromGeneralFiles];

    return combined.filter(
      (file, index, array) =>
        array.findIndex((current) => current.url === file.url) === index,
    );
  }, [assignment.submission?.code_files, assignment.submission?.files]);

  /*
   * Files inside code_files are considered code
   * archives. General uploaded files are shown only
   * when their extension or MIME type is ZIP.
   */
  const zipFiles = uploadedFiles.filter(isZipFile);

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              {assignment.task?.title || "Untitled Task"}
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {assignment.task?.description || "No task description available."}
            </p>
          </div>

          <Badge
            variant={statusVariant(assignment.status)}
            className="w-fit capitalize"
          >
            {assignment.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Difficulty
            </p>

            <p className="mt-1 text-sm font-medium capitalize">
              {displayValue(assignment.task?.difficulty_level)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Deliverable
            </p>

            <p className="mt-1 text-sm font-medium capitalize">
              {displayValue(assignment.task?.deliverable_type)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Submitted
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatDate(
                assignment.submission?.submitted_at || assignment.submitted_at,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Completed
            </p>

            <p className="mt-1 text-sm font-medium">
              {formatDate(assignment.completed_at)}
            </p>
          </div>
        </div>

        {assignment.submission?.submission_text && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Submission description
            </h3>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
              {assignment.submission.submission_text}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Code2 className="h-5 w-5" />

            <h3 className="font-semibold">Submitted code snippets</h3>

            <Badge variant="secondary">{codeSnippets.length}</Badge>
          </div>

          {codeSnippets.length > 0 ? (
            <div className="space-y-3">
              {codeSnippets.map((snippet) => (
                <div key={snippet.id} className="rounded-lg border">
                  <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-muted-foreground" />

                      <div>
                        <p className="text-sm font-medium">
                          {snippet.filename}
                        </p>

                        {snippet.language && (
                          <p className="text-xs text-muted-foreground">
                            Language: {snippet.language}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCodeSnippet(snippet)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download snippet
                    </Button>
                  </div>

                  <pre className="max-h-72 overflow-auto p-4 text-xs">
                    <code>{snippet.content}</code>
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              No code snippets were found for this submission.
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <FolderArchive className="h-5 w-5" />

            <h3 className="font-semibold">Submitted ZIP folder</h3>
          </div>

          {zipFiles.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {zipFiles.map((file) => (
                <Button key={file.id} asChild variant="outline">
                  <a
                    href={file.url}
                    download={file.filename}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileArchive className="mr-2 h-4 w-4" />
                    Download {file.filename}
                  </a>
                </Button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              The student did not upload an optional ZIP folder.
            </div>
          )}
        </div>

        {assignment.evaluation && (
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />

                <h3 className="font-semibold">AI Evaluation</h3>
              </div>

              <Badge>
                Score: {displayValue(assignment.evaluation.ai_score)}%
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Correctness</p>

                <p className="font-medium">
                  {displayValue(assignment.evaluation.correctness_score)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Code quality</p>

                <p className="font-medium">
                  {displayValue(assignment.evaluation.code_quality_score)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Grammar</p>

                <p className="font-medium">
                  {displayValue(assignment.evaluation.grammar_score)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Plagiarism risk</p>

                <p className="font-medium capitalize">
                  {displayValue(assignment.evaluation.plagiarism_risk)}
                </p>
              </div>
            </div>

            {assignment.evaluation.ai_feedback && (
              <div className="mt-4">
                <p className="mb-1 text-xs text-muted-foreground">
                  AI feedback
                </p>

                <p className="text-sm whitespace-pre-wrap">
                  {assignment.evaluation.ai_feedback}
                </p>
              </div>
            )}
          </div>
        )}

        {assignment.mentorFeedback && (
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />

              <h3 className="font-semibold">Mentor Feedback</h3>
            </div>

            <p className="font-medium">{assignment.mentorFeedback.subject}</p>

            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {assignment.mentorFeedback.message}
            </p>

            {assignment.mentorFeedback.mentor_score !== null && (
              <Badge variant="outline" className="mt-3">
                Mentor score: {assignment.mentorFeedback.mentor_score}%
              </Badge>
            )}
          </div>
        )}

        <MentorFeedbackForm assignment={assignment} onSaved={onFeedbackSaved} />
      </CardContent>
    </Card>
  );
}

export default function StudentDetailPage() {
  const params = useParams();

  const parameterValue = params?.studentId;

  const studentId = Array.isArray(parameterValue)
    ? parameterValue[0]
    : parameterValue;

  const [data, setData] = useState<StudentDetailResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    if (typeof studentId !== "string" || !studentId.trim()) {
      setError("Student ID is missing");
      setLoading(false);
      return;
    }

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
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(
        `/api/mentor/students/${encodeURIComponent(studentId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load student progress");
      }

      setData(result as StudentDetailResponse);
    } catch (loadError) {
      console.error("Student detail loading error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load student progress",
      );
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  /*
   * A task is shown when the student has submitted
   * work for it. This includes submitted, reviewed,
   * completed and approved task states.
   */
  const completedTasks = useMemo(() => {
    if (!data) {
      return [];
    }

    const completedStatuses = new Set([
      "submitted",
      "reviewed",
      "completed",
      "approved",
    ]);

    return data.assignments.filter(
      (assignment) =>
        Boolean(assignment.submission) ||
        completedStatuses.has(assignment.status.toLowerCase()),
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading student progress...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/mentor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Students
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-destructive">
              {error || "Student information is unavailable"}
            </p>

            <Button onClick={loadStudent}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const studentName = data.student.full_name || "Unnamed Student";

  const domain =
    data.student.primary_domain ||
    data.student.recommended_domain ||
    "Not selected";

  const skillLevel =
    data.student.current_skill_level ||
    data.student.skill_level ||
    "Not assessed";

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/mentor">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Students
        </Link>
      </Button>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {data.student.avatar_url ? (
                  <AvatarImage
                    src={data.student.avatar_url}
                    alt={studentName}
                  />
                ) : null}

                <AvatarFallback className="text-lg">
                  {getInitials(studentName)}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-muted-foreground" />

                  <h1 className="text-2xl font-bold">{studentName}</h1>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {data.student.email || "Email unavailable"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{domain}</Badge>

                  <Badge variant="outline">{skillLevel}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border px-5 py-3 text-center">
              <p className="text-2xl font-bold">{completedTasks.length}</p>

              <p className="text-xs text-muted-foreground">Submitted tasks</p>
            </div>
          </div>

          {data.student.skills && data.student.skills.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Skills</p>

              <div className="flex flex-wrap gap-2">
                {data.student.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold">Completed and Submitted Tasks</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Review the student&apos;s submitted source code, optional ZIP folders
          and AI evaluation results.
        </p>
      </div>

      {completedTasks.length > 0 ? (
        <div className="space-y-5">
          {completedTasks.map((assignment) => (
            <SubmittedTaskCard
              key={assignment.id}
              assignment={assignment}
              onFeedbackSaved={loadStudent}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCode2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

            <p className="font-medium">No submitted tasks</p>

            <p className="mt-1 text-sm text-muted-foreground">
              This student has not submitted any task work yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
