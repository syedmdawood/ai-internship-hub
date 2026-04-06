import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const userResult = await supabaseAdmin.auth.getUser(token);

    if (userResult.error || !userResult.data.user) {
      console.error("start route auth error:", userResult.error);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const user = userResult.data.user;

    const body = await req.json();
    const taskId = body?.taskId;
    const recommendationScore = Number(body?.recommendationScore || 0);
    const recommendationReason = body?.recommendationReason || "";

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const { data: existingAssignment } = await supabaseAdmin
      .from("task_assignments")
      .select("id")
      .eq("student_id", user.id)
      .eq("task_id", taskId)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json({ error: "Task already started" }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("task_assignments")
      .insert({
        student_id: user.id,
        task_id: taskId,
        status: "in_progress",
        recommendation_score: recommendationScore,
        recommendation_reason: recommendationReason,
        assigned_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("start task insert error", error);
      return NextResponse.json({ error: "Failed to start task" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assignment: data,
      message: "Task started successfully",
    });
  } catch (error) {
    console.error("start task unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}