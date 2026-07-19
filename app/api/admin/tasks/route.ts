import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
const ALLOWED_DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
const ALLOWED_DELIVERABLE_TYPES = [
  "github",
  "figma",
  "document",
  "text",
  "image",
  "general",
] as const;
const ALLOWED_EVALUATION_TYPES = [
  "code",
  "writing",
  "design",
  "general",
] as const;
function normalizeString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return normalized || fallback;
}
// GET ALL TASKS
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) {
    return auth.error;
  }
  const { supabaseAdmin } = auth;
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select(
        `
*,
domains(
id,
name
)
`,
      )
      .order("created_at", {
        ascending: false,
      });
    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }
    return NextResponse.json({
      success: true,
      tasks: data ?? [],
    });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks",
      },
      {
        status: 500,
      },
    );
  }
}
// CREATE TASK
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.error) {
    return auth.error;
  }
  const { supabaseAdmin } = auth;
  try {
    const body = await req.json();
    console.log("CREATE TASK BODY:", body);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const domainId =
      typeof body.domain_id === "string" ? body.domain_id.trim() : "";
    const difficultyLevel = normalizeString(body.difficulty_level, "medium");
    const deliverableType = normalizeString(body.deliverable_type, "general");
    const evaluationType = normalizeString(body.evaluation_type, "general");
    const estimatedMinutes = Number(body.estimated_minutes ?? 60);
    const instructions =
      typeof body.instructions === "string" && body.instructions.trim()
        ? body.instructions.trim()
        : null;
    const tags = body.tags ?? [];
    const evaluationCriteria =
      body.evaluation_criteria &&
      typeof body.evaluation_criteria === "object" &&
      !Array.isArray(body.evaluation_criteria)
        ? body.evaluation_criteria
        : {};
    if (!title || !domainId || !description) {
      return NextResponse.json(
        {
          error: "Title, domain and description are required",
        },
        {
          status: 400,
        },
      );
    }
    if (!Array.isArray(tags)) {
      return NextResponse.json(
        {
          error: "Tags must be an array",
        },
        {
          status: 400,
        },
      );
    }
    if (
      !ALLOWED_DIFFICULTY_LEVELS.includes(
        difficultyLevel as (typeof ALLOWED_DIFFICULTY_LEVELS)[number],
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid difficulty level: "${difficultyLevel}". Allowed values: easy, medium, hard`,
        },
        {
          status: 400,
        },
      );
    }
    if (
      !ALLOWED_DELIVERABLE_TYPES.includes(
        deliverableType as (typeof ALLOWED_DELIVERABLE_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid deliverable type: "${deliverableType}". Allowed values: github, figma, document, text, image, general`,
        },
        {
          status: 400,
        },
      );
    }
    if (
      !ALLOWED_EVALUATION_TYPES.includes(
        evaluationType as (typeof ALLOWED_EVALUATION_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid evaluation type: "${evaluationType}". Allowed values: code, writing, design, general`,
        },
        {
          status: 400,
        },
      );
    }
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
      return NextResponse.json(
        {
          error: "Estimated minutes must be greater than 0",
        },
        {
          status: 400,
        },
      );
    }
    const cleanTags = tags
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        title,
        description,
        domain_id: domainId,
        difficulty_level: difficultyLevel,
        estimated_minutes: estimatedMinutes,
        tags: cleanTags,
        deliverable_type: deliverableType,
        instructions,
        evaluation_type: evaluationType,
        evaluation_criteria: evaluationCriteria,
        is_active: true,
        created_by: auth.user?.id ?? null,
      })
      .select(
        `
*,
domains(
id,
name
)
`,
      )
      .single();
    if (error) {
      console.error("Create task database error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        submittedValues: {
          difficultyLevel,
          deliverableType,
          evaluationType,
        },
      });
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }
    return NextResponse.json({
      success: true,
      task: data,
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      {
        error: "Failed to create task",
      },
      {
        status: 500,
      },
    );
  }
}
