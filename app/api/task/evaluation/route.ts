// app/api/task/evaluation/route.ts

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const userResult = await supabaseAdmin.auth.getUser(token);

    if (userResult.error || !userResult.data.user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = userResult.data.user;

    const url = new URL(req.url);
    const assignmentId = url.searchParams.get("assignmentId");

    let query = supabaseAdmin
      .from("task_evaluations")
      .select(`
        *,
        task:tasks (
          id,
          title,
          description,
          difficulty_level,
          deliverable_type,
          evaluation_type
        ),
        submission:task_submissions (
          id,
          submitted_at,
          submission_text,
          submission_url,
          github_url,
          figma_url,
          screenshot_url,
          code_snippets,
          notes,
          files,
          status
        )
      `)
      .eq("student_id", user.id)
      .order("evaluated_at", { ascending: false });

    if (assignmentId) {
      query = query.eq("assignment_id", assignmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("evaluation fetch error:", error);

      return NextResponse.json(
        { error: "Failed to fetch evaluation result" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      evaluations: data || [],
    });
  } catch (error) {
    console.error("evaluation route error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}