import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// UPDATE QUESTION

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

    if (body.question_text !== undefined) {
      updateData.question_text = String(body.question_text).trim();
    }

    if (body.options !== undefined) {
      if (!Array.isArray(body.options) || body.options.length < 2) {
        return NextResponse.json(
          {
            error: "Options must contain at least two values",
          },
          {
            status: 400,
          },
        );
      }

      updateData.options = body.options;
    }

    if (body.correct_answer !== undefined) {
      updateData.correct_answer = body.correct_answer;
    }

    if (body.difficulty_level !== undefined) {
      updateData.difficulty_level = body.difficulty_level;
    }

    if (body.question_type !== undefined) {
      updateData.question_type = body.question_type;
    }

    if (body.weight !== undefined) {
      updateData.weight = Number(body.weight);
    }

    if (body.explanation !== undefined) {
      updateData.explanation = body.explanation || null;
    }

    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    const { data, error } = await supabaseAdmin
      .from("questions")
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

      question: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to update question",
      },
      {
        status: 500,
      },
    );
  }
}

// SAFE DELETE QUESTION

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
    const { count } = await supabaseAdmin
      .from("assessment_answer_details")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("question_id", id);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Question already used in assessments. Deactivate instead of deleting.",
        },
        {
          status: 400,
        },
      );
    }

    const { error } = await supabaseAdmin
      .from("questions")
      .delete()
      .eq("id", id);

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

      message: "Question deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to delete question",
      },
      {
        status: 500,
      },
    );
  }
}
