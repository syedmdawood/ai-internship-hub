import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

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
  } catch (error: any) {
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

    const {
      title,

      description,

      domain_id,

      difficulty_level,

      estimated_minutes,

      tags,

      deliverable_type,

      instructions,

      evaluation_type,

      evaluation_criteria,
    } = body;

    if (!title || !domain_id || !description) {
      return NextResponse.json(
        {
          error: "Title, domain and description are required",
        },
        {
          status: 400,
        },
      );
    }

    if (tags && !Array.isArray(tags)) {
      return NextResponse.json(
        {
          error: "Tags must be an array",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        title,

        description,

        domain_id,

        difficulty_level: difficulty_level || "medium",

        estimated_minutes: estimated_minutes || 60,

        tags: tags || [],

        deliverable_type: deliverable_type || "general",

        instructions: instructions || null,

        evaluation_type: evaluation_type || "general",

        evaluation_criteria: evaluation_criteria || {},

        is_active: true,
      })
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
        error: "Failed to create task",
      },
      {
        status: 500,
      },
    );
  }
}
