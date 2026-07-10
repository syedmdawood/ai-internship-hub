// app/api/task/submit/route.ts

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { evaluateSubmission } from "@/lib/evaluateSubmission";

export const runtime = "nodejs";

function isFigmaUrl(value: string | null | undefined) {
  return Boolean(value && value.toLowerCase().includes("figma.com"));
}

function normalizeCodeFiles(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((file) => {
      if (!file || typeof file !== "object") return false;

      const item = file as {
        path?: unknown;
        language?: unknown;
        content?: unknown;
      };

      return (
        String(item.path || "").trim().length > 0 &&
        String(item.content || "").trim().length > 0
      );
    })
    .map((file) => {
      const item = file as {
        path?: unknown;
        language?: unknown;
        content?: unknown;
      };

      return {
        path: String(item.path || "").trim(),
        language: String(item.language || "").trim() || "plain text",
        content: String(item.content || "").trim(),
      };
    });
}

function buildCombinedCodeSnippet(codeFiles: ReturnType<typeof normalizeCodeFiles>) {
  return codeFiles
    .map((file, index) => {
      return [
        `===== FILE ${index + 1}: ${file.path} =====`,
        `Language: ${file.language}`,
        file.content,
      ].join("\n");
    })
    .join("\n\n");
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const userResult = await supabaseAdmin.auth.getUser(token);

    if (userResult.error || !userResult.data.user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const user = userResult.data.user;

    const body = await req.json();

    const {
      assignmentId,
      taskId,
      files,
      codeSnippet,
      codeFiles,
      notes,
      projectUrl,
      checklist,
      submissionText,
      screenshotUrl,
    } = body;

    if (!assignmentId || !taskId) {
      return NextResponse.json(
        { error: "assignmentId and taskId are required" },
        { status: 400 },
      );
    }

    const assignmentRes = await supabaseAdmin
      .from("task_assignments")
      .select("*, task:tasks(*)")
      .eq("id", assignmentId)
      .eq("student_id", user.id)
      .eq("task_id", taskId)
      .single();

    if (assignmentRes.error || !assignmentRes.data) {
      return NextResponse.json(
        { error: "Task assignment not found" },
        { status: 404 },
      );
    }

    const assignment = assignmentRes.data;
    const task = assignment.task;

    if (!task) {
      return NextResponse.json(
        { error: "Task metadata missing" },
        { status: 500 },
      );
    }

    const blockedStatuses = [
      "submitted",
      "under_review",
      "reviewed",
      "completed",
      "approved",
      "cancelled",
    ];

    if (blockedStatuses.includes(String(assignment.status).toLowerCase())) {
      return NextResponse.json(
        { error: "Task already submitted" },
        { status: 409 },
      );
    }

    if (!assignment.started_at) {
      return NextResponse.json(
        { error: "Task was not started correctly" },
        { status: 400 },
      );
    }

    const startedAt = new Date(assignment.started_at).getTime();
    const deadlineMs =
      startedAt + Number(task.estimated_minutes || 0) * 60 * 1000;

    if (Date.now() > deadlineMs) {
      await supabaseAdmin
        .from("task_assignments")
        .update({ status: "expired" })
        .eq("id", assignment.id);

      return NextResponse.json(
        { error: "Submission time is over" },
        { status: 403 },
      );
    }

    const evaluationType = String(task.evaluation_type || "general").toLowerCase();

    const safeCodeFiles = normalizeCodeFiles(codeFiles);
    const finalCodeSnippet =
      String(codeSnippet || "").trim() || buildCombinedCodeSnippet(safeCodeFiles);

    if (evaluationType === "code" && safeCodeFiles.length === 0 && !finalCodeSnippet) {
      return NextResponse.json(
        {
          error:
            "Code tasks require pasted code. Please add at least one file path and code content.",
        },
        { status: 400 },
      );
    }

    if (evaluationType === "writing" && !submissionText && !notes) {
      return NextResponse.json(
        {
          error: "Writing tasks require written submission text or notes.",
        },
        { status: 400 },
      );
    }

    if (evaluationType === "design" && !isFigmaUrl(projectUrl) && !screenshotUrl) {
      return NextResponse.json(
        {
          error:
            "Design tasks require a Figma URL or screenshot URL for evaluation.",
        },
        { status: 400 },
      );
    }

    const { data: existingSubmission } = await supabaseAdmin
      .from("task_submissions")
      .select("id")
      .eq("assignment_id", assignmentId)
      .maybeSingle();

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Submission already exists for this assignment" },
        { status: 409 },
      );
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("task_submissions")
      .insert({
        assignment_id: assignmentId,
        student_id: user.id,
        task_id: taskId,

        submission_text: submissionText || null,

        // For code tasks, projectUrl/GitHub URL is removed.
        // For design/general tasks, projectUrl can still be saved.
        submission_url: evaluationType === "code" ? null : projectUrl || null,
        github_url: null,

        code_snippets: evaluationType === "code" ? finalCodeSnippet : null,
        code_files: evaluationType === "code" ? safeCodeFiles : [],

        figma_url:
          evaluationType === "design" && isFigmaUrl(projectUrl)
            ? projectUrl
            : null,
        screenshot_url: screenshotUrl || null,

        files: Array.isArray(files) ? files : [],
        notes: notes || null,
        checklist:
          checklist && typeof checklist === "object" && !Array.isArray(checklist)
            ? checklist
            : {},

        status: "under_review",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submissionError || !submission) {
      console.error("submission insert error:", submissionError);

      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 },
      );
    }

    await supabaseAdmin
      .from("task_assignments")
      .update({
        status: "under_review",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    let evaluation = null;
    let evaluationErrorMessage = null;

    try {
      evaluation = await evaluateSubmission(submission.id);
    } catch (evaluationError) {
      console.error("AI evaluation error:", evaluationError);

      evaluationErrorMessage =
        evaluationError instanceof Error
          ? evaluationError.message
          : "AI evaluation failed";

      await supabaseAdmin
        .from("task_submissions")
        .update({
          status: "failed",
          evaluation_error: evaluationErrorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", submission.id);
    }

    return NextResponse.json({
      success: true,
      submission,
      evaluation,
      evaluationError: evaluationErrorMessage,
      message: evaluation
        ? "Task submitted and evaluated successfully."
        : "Task submitted successfully, but AI evaluation failed. Mentor can review it manually.",
    });
  } catch (err) {
    console.error("submit task unexpected error:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}