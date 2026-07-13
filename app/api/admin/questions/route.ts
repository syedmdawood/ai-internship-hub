import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// GET ALL QUESTIONS

export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  try {
    const { data, error } = await supabaseAdmin
      .from("questions")
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

      questions: data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch questions",
      },
      {
        status: 500,
      },
    );
  }
}

// CREATE QUESTION

export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  try {
    const body = await req.json();

    const {
      domain_id,

      question_text,

      options,

      correct_answer,

      difficulty_level,

      question_type,

      weight,

      explanation,
    } = body;

    if (!domain_id || !question_text || !options || !correct_answer) {
      return NextResponse.json(
        {
          error: "Required fields missing",
        },
        {
          status: 400,
        },
      );
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        {
          error: "Options must be an array with at least two values",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("questions")
      .insert({
        domain_id,

        question_text,

        options,

        correct_answer,

        difficulty_level: difficulty_level || "medium",

        question_type: question_type || "mcq",

        weight: weight || 1,

        explanation: explanation || null,

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

      question: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to create question",
      },
      {
        status: 500,
      },
    );
  }
}
