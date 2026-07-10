// lib/evaluateSubmission.ts

import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type EvaluationType = "code" | "writing" | "design" | "general";

type EvaluationResult = {
  evaluation_type: EvaluationType;
  ai_score: number;
  ai_feedback: string;
  strengths: string[];
  improvements: string[];
  plagiarism_risk: "low" | "medium" | "high";
  plagiarism_score: number;
  grammar_score: number | null;
  code_quality_score: number | null;
  design_quality_score: number | null;
  correctness_score: number | null;
  raw_ai_response: unknown;
};

function safeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(100, num));
}

function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return valid JSON.");
    return JSON.parse(match[0]);
  }
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function similarity(a: string, b: string) {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));

  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) intersection++;
  }

  const union = new Set([...aTokens, ...bTokens]).size;

  return union === 0 ? 0 : intersection / union;
}

function formatCodeFiles(codeFiles: unknown) {
  if (!Array.isArray(codeFiles)) return "";

  return codeFiles
    .filter((file) => {
      if (!file || typeof file !== "object") return false;

      const item = file as {
        path?: unknown;
        language?: unknown;
        content?: unknown;
      };

      return (
        String(item.path || "").trim().length > 0 ||
        String(item.content || "").trim().length > 0
      );
    })
    .map((file, index) => {
      const item = file as {
        path?: unknown;
        language?: unknown;
        content?: unknown;
      };

      return [
        `===== FILE ${index + 1}: ${String(item.path || "untitled").trim()} =====`,
        `Language: ${String(item.language || "plain text").trim()}`,
        String(item.content || "").trim(),
      ].join("\n");
    })
    .join("\n\n");
}

function getSubmissionContent(submission: any) {
  const structuredCode = formatCodeFiles(submission.code_files);

  return [
    submission.submission_text,
    structuredCode,
    submission.code_snippets,
    submission.notes,
    submission.figma_url,
    submission.submission_url,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function inferEvaluationType(task: any): EvaluationType {
  if (task?.evaluation_type) {
    const value = String(task.evaluation_type).toLowerCase();

    if (["code", "writing", "design", "general"].includes(value)) {
      return value as EvaluationType;
    }
  }

  if (task?.deliverable_type === "code_files") return "code";
  if (task?.deliverable_type === "github_link") return "code";
  if (task?.deliverable_type === "figma_url") return "design";
  if (task?.deliverable_type === "text") return "writing";

  return "general";
}

function buildPrompt(params: {
  evaluationType: EvaluationType;
  task: any;
  submission: any;
  originalitySimilarity: number;
}) {
  const { evaluationType, task, submission, originalitySimilarity } = params;

  const content = getSubmissionContent(submission);
  const structuredCode = formatCodeFiles(submission.code_files);

  return `
You are an AI evaluator for a virtual internship and freelancing training platform.

Evaluate the student's submission according to the task requirements.

Task:
Title: ${task.title}
Description: ${task.description}
Difficulty: ${task.difficulty_level}
Deliverable Type: ${task.deliverable_type}
Evaluation Type: ${evaluationType}
Instructions: ${task.instructions || "No special instructions"}
Evaluation Criteria: ${JSON.stringify(task.evaluation_criteria || {})}

Student Submission:
Submission URL: ${submission.submission_url || "N/A"}
Figma URL: ${submission.figma_url || "N/A"}

Structured Code Files:
${structuredCode || "N/A"}

Combined Code Snippet:
${submission.code_snippets || "N/A"}

Submission Text / Notes:
${content || "N/A"}

Checklist:
${JSON.stringify(submission.checklist || {})}

Similarity with previous submissions:
${(originalitySimilarity * 100).toFixed(2)}%

Return valid JSON only in this exact format:
{
  "ai_score": 0,
  "ai_feedback": "clear feedback paragraph",
  "strengths": ["point 1", "point 2"],
  "improvements": ["point 1", "point 2"],
  "plagiarism_risk": "low | medium | high",
  "grammar_score": 0,
  "code_quality_score": 0,
  "design_quality_score": 0,
  "correctness_score": 0
}

Rules:
- Score must be from 0 to 100.
- For code tasks, evaluate the pasted multi-file project structure.
- For code tasks, check whether file paths, components, modules, logic, readability, error handling, and requirement completion are reasonable.
- For code tasks, do not expect a GitHub repository.
- For code tasks, if code is incomplete, missing important files, or has unclear structure, reduce the score and mention what is missing.
- For writing tasks, focus on grammar, clarity, structure, relevance, and originality.
- For design tasks, focus on layout, readability, creativity, consistency, and task relevance.
- For general tasks, evaluate overall completion quality.
- Plagiarism risk should consider both similarity percentage and your judgment.
- Do not use markdown.
- Return JSON only.
`;
}

export async function evaluateSubmission(submissionId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from("task_submissions")
    .select(
      `
      *,
      task:tasks(*),
      assignment:task_assignments(*)
    `,
    )
    .eq("id", submissionId)
    .single();

  if (submissionError || !submission) {
    throw new Error("Submission not found.");
  }

  const task = submission.task;

  if (!task) {
    throw new Error("Task metadata missing.");
  }

  const evaluationType = inferEvaluationType(task);
  const currentContent = getSubmissionContent(submission);

  const { data: previousSubmissions } = await supabaseAdmin
    .from("task_submissions")
    .select(
      "id, submission_text, code_snippets, code_files, notes, figma_url, submission_url",
    )
    .eq("task_id", submission.task_id)
    .neq("id", submission.id)
    .limit(30);

  let maxSimilarity = 0;

  for (const previous of previousSubmissions || []) {
    const previousContent = getSubmissionContent(previous);
    const score = similarity(currentContent, previousContent);

    if (score > maxSimilarity) {
      maxSimilarity = score;
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    const fallback: EvaluationResult = {
      evaluation_type: evaluationType,
      ai_score: 60,
      ai_feedback:
        "Submission received. AI key is missing, so only a basic fallback evaluation was generated.",
      strengths: ["Submission was provided before the deadline."],
      improvements: ["Configure OPENAI_API_KEY to enable full AI evaluation."],
      plagiarism_risk:
        maxSimilarity >= 0.65 ? "high" : maxSimilarity >= 0.35 ? "medium" : "low",
      plagiarism_score: Number((maxSimilarity * 100).toFixed(2)),
      grammar_score: evaluationType === "writing" ? 60 : null,
      code_quality_score: evaluationType === "code" ? 60 : null,
      design_quality_score: evaluationType === "design" ? 60 : null,
      correctness_score: evaluationType === "code" ? 60 : null,
      raw_ai_response: { fallback: true },
    };

    return await saveEvaluation(submission, fallback);
  }

  const prompt = buildPrompt({
    evaluationType,
    task,
    submission,
    originalitySimilarity: maxSimilarity,
  });

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a strict but fair AI evaluator for student freelancing internship submissions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim();

  if (!raw) {
    throw new Error("AI returned empty response.");
  }

  const parsed = extractJson(raw);

  const result: EvaluationResult = {
    evaluation_type: evaluationType,
    ai_score: safeNumber(parsed.ai_score),
    ai_feedback:
      typeof parsed.ai_feedback === "string"
        ? parsed.ai_feedback
        : "AI evaluation completed.",
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map(String)
      : [],
    improvements: Array.isArray(parsed.improvements)
      ? parsed.improvements.map(String)
      : [],
    plagiarism_risk: ["low", "medium", "high"].includes(parsed.plagiarism_risk)
      ? parsed.plagiarism_risk
      : maxSimilarity >= 0.65
        ? "high"
        : maxSimilarity >= 0.35
          ? "medium"
          : "low",
    plagiarism_score: Number((maxSimilarity * 100).toFixed(2)),
    grammar_score:
      parsed.grammar_score === null || parsed.grammar_score === undefined
        ? null
        : safeNumber(parsed.grammar_score),
    code_quality_score:
      parsed.code_quality_score === null || parsed.code_quality_score === undefined
        ? null
        : safeNumber(parsed.code_quality_score),
    design_quality_score:
      parsed.design_quality_score === null || parsed.design_quality_score === undefined
        ? null
        : safeNumber(parsed.design_quality_score),
    correctness_score:
      parsed.correctness_score === null || parsed.correctness_score === undefined
        ? null
        : safeNumber(parsed.correctness_score),
    raw_ai_response: parsed,
  };

  return await saveEvaluation(submission, result);
}

async function saveEvaluation(submission: any, result: EvaluationResult) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: evaluation, error: evaluationError } = await supabaseAdmin
    .from("task_evaluations")
    .insert({
      submission_id: submission.id,
      assignment_id: submission.assignment_id,
      student_id: submission.student_id,
      task_id: submission.task_id,
      evaluation_type: result.evaluation_type,
      ai_score: result.ai_score,
      ai_feedback: result.ai_feedback,
      strengths: result.strengths,
      improvements: result.improvements,
      plagiarism_risk: result.plagiarism_risk,
      plagiarism_score: result.plagiarism_score,
      grammar_score: result.grammar_score,
      code_quality_score: result.code_quality_score,
      design_quality_score: result.design_quality_score,
      correctness_score: result.correctness_score,
      raw_ai_response: result.raw_ai_response,
    })
    .select()
    .single();

  if (evaluationError) {
    throw evaluationError;
  }

  await supabaseAdmin
    .from("task_submissions")
    .update({
      status: "evaluated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submission.id);

  await supabaseAdmin
    .from("task_assignments")
    .update({
      status: "reviewed",
    })
    .eq("id", submission.assignment_id);

  return evaluation;
}