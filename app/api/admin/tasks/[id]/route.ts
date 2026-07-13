import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

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

    const updateData: any = {};

    if (body.title !== undefined) {
      updateData.title = String(body.title).trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.domain_id !== undefined) {
      updateData.domain_id = body.domain_id;
    }

    if (body.difficulty_level !== undefined) {
      updateData.difficulty_level = body.difficulty_level;
    }

    if (body.estimated_minutes !== undefined) {
      updateData.estimated_minutes = Number(body.estimated_minutes);
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

      updateData.tags = body.tags;
    }

    if (body.deliverable_type !== undefined) {
      updateData.deliverable_type = body.deliverable_type;
    }

    if (body.instructions !== undefined) {
      updateData.instructions = body.instructions;
    }

    if (body.evaluation_type !== undefined) {
      updateData.evaluation_type = body.evaluation_type;
    }

    if (body.evaluation_criteria !== undefined) {
      updateData.evaluation_criteria = body.evaluation_criteria;
    }

    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

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

      task: data,
    });
  } catch (error: any) {
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
    const { count: assignmentCount } = await supabaseAdmin
      .from("task_assignments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("task_id", id);

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
  } catch (error: any) {
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
