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
function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}
// UPDATE TASK
export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const auth = await requireAdmin(req);
  if (auth.error) {
    return auth.error;
  }
  const { supabaseAdmin } = auth;
  const { id } = await context.params;
  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    console.log("UPDATE TASK BODY:", body);
    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        return NextResponse.json(
          {
            error: "Title cannot be empty",
          },
          {
            status: 400,
          },
        );
      }
      updateData.title = title;
    }
    if (body.description !== undefined) {
      const description =
        typeof body.description === "string" ? body.description.trim() : "";
      if (!description) {
        return NextResponse.json(
          {
            error: "Description cannot be empty",
          },
          {
            status: 400,
          },
        );
      }
      updateData.description = description;
    }
    if (body.domain_id !== undefined) {
      if (typeof body.domain_id !== "string" || !body.domain_id.trim()) {
        return NextResponse.json(
          {
            error: "A valid domain is required",
          },
          {
            status: 400,
          },
        );
      }
      updateData.domain_id = body.domain_id.trim();
    }
    if (body.difficulty_level !== undefined) {
      const difficultyLevel = normalizeString(body.difficulty_level);
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
      updateData.difficulty_level = difficultyLevel;
    }
    if (body.estimated_minutes !== undefined) {
      const estimatedMinutes = Number(body.estimated_minutes);
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
      updateData.estimated_minutes = estimatedMinutes;
    }
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json(
          {
            error: "Tags must be an array",
          },
          {
            status: 400,
          },
        );
      }
      updateData.tags = body.tags
        .filter((tag: unknown): tag is string => typeof tag === "string")
        .map((tag: string) => tag.trim())
        .filter(Boolean);
    }
    if (body.deliverable_type !== undefined) {
      const deliverableType = normalizeString(body.deliverable_type);
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
      updateData.deliverable_type = deliverableType;
    }
    if (body.instructions !== undefined) {
      updateData.instructions =
        typeof body.instructions === "string" && body.instructions.trim()
          ? body.instructions.trim()
          : null;
    }
    if (body.evaluation_type !== undefined) {
      const evaluationType = normalizeString(body.evaluation_type);
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
      updateData.evaluation_type = evaluationType;
    }
    if (body.evaluation_criteria !== undefined) {
      if (
        !body.evaluation_criteria ||
        typeof body.evaluation_criteria !== "object" ||
        Array.isArray(body.evaluation_criteria)
      ) {
        return NextResponse.json(
          {
            error: "Evaluation criteria must be an object",
          },
          {
            status: 400,
          },
        );
      }
      updateData.evaluation_criteria = body.evaluation_criteria;
    }
    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          {
            error: "Active status must be true or false",
          },
          {
            status: 400,
          },
        );
      }
      updateData.is_active = body.is_active;
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: "No valid fields were provided",
        },
        {
          status: 400,
        },
      );
    }
    updateData.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updateData)
      .eq("id", id)
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
      console.error("Update task database error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        submittedValues: updateData,
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
    console.error("Failed to update task:", error);
    return NextResponse.json(
      {
        error: "Failed to update task",
      },
      {
        status: 500,
      },
    );
  }
}
// SAFE DELETE TASK
export async function DELETE(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const auth = await requireAdmin(req);
  if (auth.error) {
    return auth.error;
  }
  const { supabaseAdmin } = auth;
  const { id } = await context.params;
  try {
    const { count: assignmentCount, error: countError } = await supabaseAdmin
      .from("task_assignments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("task_id", id);
    if (countError) {
      return NextResponse.json(
        {
          error: countError.message,
        },
        {
          status: 400,
        },
      );
    }
    if ((assignmentCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Task already assigned to students. Deactivate instead of deleting.",
        },
        {
          status: 400,
        },
      );
    }
    const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
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
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      {
        error: "Failed to delete task",
      },
      {
        status: 500,
      },
    );
  }
}
