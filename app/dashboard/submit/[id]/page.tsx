"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  FileText,
  Code,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StartedTask = {
  id: string;
  status: string;
  assigned_at: string;
  started_at: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  recommendation_score?: number | null;
  recommendation_reason?: string | null;
  task: {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    estimated_minutes: number;
    deliverable_type: string;
    evaluation_type: "code" | "writing" | "design" | "general";
    evaluation_criteria?: any | null;
    instructions: string | null;
    tags: string[] | null;
  } | null;
};

type CodeFile = {
  id: string;
  path: string;
  language: string;
  content: string;
};

const FINAL_STATUSES = [
  "submitted",
  "under_review",
  "reviewed",
  "completed",
  "approved",
  "expired",
  "finished",
  "cancelled",
];

function createCodeFile(): CodeFile {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  return {
    id,
    path: "",
    language: "tsx",
    content: "",
  };
}

function normalizeStatus(status: string | null | undefined) {
  return (status || "").toLowerCase().replace(/\s+/g, "_");
}

function isFinalStatus(status: string | null | undefined) {
  return FINAL_STATUSES.includes(normalizeStatus(status));
}

function getTaskDeadlineMs(item: StartedTask) {
  if (!item.started_at || !item.task?.estimated_minutes) return null;

  const startedMs = new Date(item.started_at).getTime();
  if (Number.isNaN(startedMs)) return null;

  return startedMs + item.task.estimated_minutes * 60 * 1000;
}

function isTaskExpired(item: StartedTask, now: number) {
  if (!item.started_at || isFinalStatus(item.status)) return false;

  const deadlineMs = getTaskDeadlineMs(item);
  if (!deadlineMs) return false;

  return now >= deadlineMs;
}

function isTaskActive(item: StartedTask, now: number) {
  if (!item.started_at) return false;
  if (isFinalStatus(item.status)) return false;
  if (isTaskExpired(item, now)) return false;

  return true;
}

function formatRemainingTime(ms: number) {
  if (ms <= 0) return "Time over";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function getRemainingText(item: StartedTask, now: number) {
  const deadlineMs = getTaskDeadlineMs(item);
  if (!deadlineMs) return "-";

  return formatRemainingTime(deadlineMs - now);
}

function formatDeliverableType(
  deliverableType: string | null | undefined,
  evaluationType: string | null | undefined,
) {
  const value = String(deliverableType || "").toLowerCase();

  if (evaluationType === "code" || value === "github_link" || value === "code_files") {
    return "Structured Code Files";
  }

  if (value === "figma_url") return "Figma / Screenshot";
  if (value === "document_url") return "Document / Project URL";
  if (value === "text") return "Written Text";

  return deliverableType || "-";
}

function buildCombinedCodeSnippet(codeFiles: CodeFile[]) {
  return codeFiles
    .filter((file) => file.path.trim() || file.content.trim())
    .map((file, index) => {
      return [
        `===== FILE ${index + 1}: ${file.path.trim() || "untitled"} =====`,
        `Language: ${file.language.trim() || "plain text"}`,
        file.content,
      ].join("\n");
    })
    .join("\n\n");
}

export default function SubmitPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [myTasks, setMyTasks] = useState<StartedTask[]>([]);
  const [now, setNow] = useState(Date.now());

  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([
    {
      ...createCodeFile(),
      path: "src/App.tsx",
      language: "tsx",
    },
  ]);

  const [notes, setNotes] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    "All requirements addressed": false,
    "Code is clean and documented": false,
    "Files are properly organized": false,
    "Tested across browsers": false,
    "Mobile responsive": false,
  });

  useEffect(() => {
    loadMyTasks();

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const activeTask = useMemo(() => {
    return myTasks.find((item) => isTaskActive(item, now)) || null;
  }, [myTasks, now]);

  const evaluationType = activeTask?.task?.evaluation_type || "general";

  const isCodeTask = evaluationType === "code";
  const isWritingTask = evaluationType === "writing";
  const isDesignTask = evaluationType === "design";
  const isGeneralTask = evaluationType === "general";

  const expiredTask = useMemo(() => {
    return myTasks.find((item) => isTaskExpired(item, now)) || null;
  }, [myTasks, now]);

  const remainingText = activeTask ? getRemainingText(activeTask, now) : "-";
  const deadlineMs = activeTask ? getTaskDeadlineMs(activeTask) : null;

  async function getAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) return null;
    return session.access_token;
  }

  async function loadMyTasks() {
    try {
      setLoading(true);

      const token = await getAccessToken();

      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const res = await fetch("/api/task/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load your active task.");
        return;
      }

      setMyTasks(data.tasks || []);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while loading your active task.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileAdd = () => {
    if (!activeTask) {
      toast.error("No active task found.");
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);

    if (uploadedFiles.length === 0) return;

    const validFiles = uploadedFiles.filter((file) => {
      const maxSize = 10 * 1024 * 1024;

      const allowedTypes = [
        "application/zip",
        "application/x-zip-compressed",
        "application/pdf",
        "image/png",
        "image/jpeg",
      ];

      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB.`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} type is not allowed.`);
        return false;
      }

      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFiles((prev) => [...prev, ...validFiles.map((file) => file.name)]);

    e.target.value = "";
  };

  function removeUploadedFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const handleChecklistChange = (item: string) => {
    setChecklist((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  function updateCodeFile(id: string, field: keyof CodeFile, value: string) {
    setCodeFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? {
              ...file,
              [field]: value,
            }
          : file,
      ),
    );
  }

  function addCodeFile() {
    setCodeFiles((prev) => [...prev, createCodeFile()]);
  }

  function removeCodeFile(id: string) {
    setCodeFiles((prev) => {
      if (prev.length === 1) {
        toast.error("At least one code file is required.");
        return prev;
      }

      return prev.filter((file) => file.id !== id);
    });
  }

  async function handleSubmit() {
    try {
      if (!activeTask) {
        toast.error("No active task found. Please start a task first.");
        return;
      }

      if (isTaskExpired(activeTask, Date.now())) {
        toast.error("Submission time is over. You cannot submit this task.");
        return;
      }

      const validCodeFiles = codeFiles.filter(
        (file) => file.path.trim() && file.content.trim(),
      );

      if (isCodeTask && validCodeFiles.length === 0) {
        toast.error("Please paste at least one code file with file path and code.");
        return;
      }

      setSubmitting(true);

      const token = await getAccessToken();

      if (!token) {
        toast.error("You are not logged in.");
        return;
      }

      const payload = {
        assignmentId: activeTask.id,
        taskId: activeTask.task?.id,
        files,
        codeFiles: isCodeTask ? validCodeFiles : [],
        codeSnippet: isCodeTask ? buildCombinedCodeSnippet(validCodeFiles) : "",
        submissionText,
        screenshotUrl,
        notes,
        projectUrl: isCodeTask ? "" : projectUrl,
        checklist,
      };

      const res = await fetch("/api/task/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || "Failed to submit task.");
        return;
      }

      setEvaluation(data?.evaluation || null);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while submitting your task.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Submission Received!
        </h1>

        <p className="mt-2 max-w-md text-muted-foreground">
          Your work has been submitted successfully. AI evaluation is in
          progress. You will receive feedback shortly.
        </p>

        <Badge
          variant="outline"
          className="mt-4 border-amber-200 bg-amber-100 text-amber-700"
        >
          {evaluation ? "AI Evaluated" : "Under Review"}
        </Badge>

        {evaluation ? (
          <Card className="mt-6 w-full max-w-2xl text-left">
            <CardHeader>
              <CardTitle>AI Evaluation Result</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">AI Score</p>
                <p className="text-2xl font-bold">{evaluation.ai_score}/100</p>
              </div>

              <div>
                <p className="text-sm font-medium">Feedback</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {evaluation.ai_feedback}
                </p>
              </div>

              {evaluation.plagiarism_risk ? (
                <div>
                  <p className="text-sm font-medium">
                    Originality / Plagiarism Risk
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Risk: {evaluation.plagiarism_risk} | Similarity:{" "}
                    {evaluation.plagiarism_score || 0}%
                  </p>
                </div>
              ) : null}

              {Array.isArray(evaluation.strengths) &&
              evaluation.strengths.length > 0 ? (
                <div>
                  <p className="text-sm font-medium">Strengths</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {evaluation.strengths.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {Array.isArray(evaluation.improvements) &&
              evaluation.improvements.length > 0 ? (
                <div>
                  <p className="text-sm font-medium">Improvements</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {evaluation.improvements.map(
                      (item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-8 flex gap-3">
          <Link href="/dashboard/feedback">
            <Button>View Feedback</Button>
          </Link>

          <Link href="/dashboard/tasks">
            <Button variant="outline">Browse Tasks</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        Loading active task...
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to tasks</span>
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Submit Work</h1>
            <p className="mt-1 text-muted-foreground">
              No active task is available for submission.
            </p>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            {expiredTask ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Your previous task submission time is over. You cannot submit it
                now.
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                Please start one recommended task first, then come back to the
                submit page.
              </div>
            )}

            <div className="mt-6">
              <Link href="/dashboard/tasks">
                <Button>Go to Tasks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to tasks</span>
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit Work</h1>
          <p className="mt-1 text-muted-foreground">
            {activeTask.task?.title || "Active Task"}
          </p>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-amber-900">
              Active Task Submission Timer
            </p>
            <p className="text-sm text-amber-800">
              Submit your work before the timer ends.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-800">
            <Clock className="h-4 w-4" />
            Remaining: {remainingText}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Title:</span>{" "}
                {activeTask.task?.title || "-"}
              </p>

              <p>
                <span className="font-medium">Description:</span>{" "}
                {activeTask.task?.description || "-"}
              </p>

              <p>
                <span className="font-medium">Difficulty:</span>{" "}
                {activeTask.task?.difficulty_level || "-"}
              </p>

              <p>
                <span className="font-medium">Deliverable:</span>{" "}
                {formatDeliverableType(
                  activeTask.task?.deliverable_type,
                  activeTask.task?.evaluation_type,
                )}
              </p>

              <p>
                <span className="font-medium">Evaluation Type:</span>{" "}
                {activeTask.task?.evaluation_type || "general"}
              </p>

              <p>
                <span className="font-medium">Estimated Time:</span>{" "}
                {activeTask.task?.estimated_minutes || "-"} minutes
              </p>

              <p>
                <span className="font-medium">Deadline:</span>{" "}
                {deadlineMs ? new Date(deadlineMs).toLocaleString() : "-"}
              </p>

              {activeTask.task?.instructions ? (
                <div className="rounded-lg bg-muted p-3">
                  <span className="font-medium">Instructions:</span>{" "}
                  {activeTask.task.instructions}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" />
                Upload Files
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onClick={handleFileAdd}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5",
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleFileAdd()}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isCodeTask
                    ? "Optional ZIP as supporting evidence. AI evaluates pasted code below."
                    : "ZIP, PDF, PNG, JPG up to 10MB"}
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{file}</span>
                      </div>

                      <button
                        onClick={() => removeUploadedFile(idx)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${file}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isCodeTask && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Code className="h-4 w-4" />
                  Code Task Submission
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  Paste your code file by file. GitHub URL is not required.
                  At least one file path and code content is required for AI
                  evaluation.
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                {codeFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="space-y-3 rounded-xl border bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">File {index + 1}</p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCodeFile(file.id)}
                        disabled={codeFiles.length === 1}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Folder / File Path *</Label>
                        <Input
                          value={file.path}
                          onChange={(e) =>
                            updateCodeFile(file.id, "path", e.target.value)
                          }
                          placeholder="Example: src/components/Navbar.tsx"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Language / Extension</Label>
                        <Input
                          value={file.language}
                          onChange={(e) =>
                            updateCodeFile(file.id, "language", e.target.value)
                          }
                          placeholder="Example: tsx, js, py, html, css"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Code *</Label>
                      <Textarea
                        value={file.content}
                        onChange={(e) =>
                          updateCodeFile(file.id, "content", e.target.value)
                        }
                        placeholder={`Paste code for ${
                          file.path || "this file"
                        } here...`}
                        className="min-h-[220px] font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addCodeFile}>
                  + Add Another File
                </Button>
              </CardContent>
            </Card>
          )}

          {isWritingTask && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Writing Task Submission
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Paste your written content here..."
                  className="min-h-[220px]"
                />
              </CardContent>
            </Card>
          )}

          {isDesignTask && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Design Task Submission
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Figma URL</Label>
                  <Input
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://figma.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Screenshot URL</Label>
                  <Input
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="Paste screenshot/image URL"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isGeneralTask && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Project URL</CardTitle>
              </CardHeader>

              <CardContent>
                <Input
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://your-project-link.com"
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Additional Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your approach, challenges faced, or any notes for the reviewer..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Submission Checklist</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {Object.keys(checklist).map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item]}
                    onChange={() => handleChecklistChange(item)}
                    className="rounded border-border accent-primary"
                  />
                  {item}
                </label>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}