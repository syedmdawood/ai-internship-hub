import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { recommendTasks } from "@/lib/recommendTasks";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
    const taskId = body?.taskId;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 },
      );
    }

    const profileResult = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        role,
        primary_domain_id,
        secondary_domain_id,
        skill_level,
        current_skill_level
      `,
      )
      .eq("id", user.id)
      .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileResult.data;

    if (profile.role !== "student") {
      return NextResponse.json(
        { error: "Only students can start tasks" },
        { status: 403 },
      );
    }

    if (!profile.primary_domain_id && !profile.secondary_domain_id) {
      return NextResponse.json(
        { error: "Please complete your assessment first" },
        { status: 400 },
      );
    }

    const existingAssignmentResult = await supabaseAdmin
      .from("task_assignments")
      .select("id")
      .eq("student_id", user.id)
      .eq("task_id", taskId)
      .maybeSingle();

    if (existingAssignmentResult.error) {
      return NextResponse.json(
        { error: "Failed to check existing task assignment" },
        { status: 500 },
      );
    }

    if (existingAssignmentResult.data) {
      return NextResponse.json(
        { error: "Task already started" },
        { status: 409 },
      );
    }

    const domainIds = [
      profile.primary_domain_id,
      profile.secondary_domain_id,
    ].filter((id): id is string => Boolean(id));

    const tasksResult = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .in("domain_id", domainIds);

    if (tasksResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch available tasks" },
        { status: 500 },
      );
    }

    const assignmentsResult = await supabaseAdmin
      .from("task_assignments")
      .select(
        `
        task_id,
        status,
        mentor_score,
        recommendation_score,
        assigned_at,
        started_at,
        submitted_at,
        completed_at
      `,
      )
      .eq("student_id", user.id);

    if (assignmentsResult.error) {
      return NextResponse.json(
        { error: "Failed to fetch student task progress" },
        { status: 500 },
      );
    }

    const recommendations = await recommendTasks({
      tasks: tasksResult.data || [],
      profile,
      assignments: assignmentsResult.data || [],
      limit: 20 ,
    });

    const selectedRecommendation = recommendations.find(
      (task) => task.id === taskId,
    );

    if (!selectedRecommendation) {
      return NextResponse.json(
        {
          error:
            "This task is not currently recommended for your profile and progress",
        },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();

    const insertResult = await supabaseAdmin
      .from("task_assignments")
      .insert({
        student_id: user.id,
        task_id: taskId,
        status: "in_progress",
        recommendation_score: selectedRecommendation.recommendation_score,
        recommendation_reason: selectedRecommendation.recommendation_reason,
        recommendation_context: {
          primary_domain_id: profile.primary_domain_id,
          secondary_domain_id: profile.secondary_domain_id,
          skill_level: profile.skill_level,
          current_skill_level: profile.current_skill_level,
        },
        assigned_at: now,
        started_at: now,
      })
      .select()
      .single();

    if (insertResult.error) {
      console.error("start task insert error:", insertResult.error);

      return NextResponse.json(
        { error: "Failed to start task" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      assignment: insertResult.data,
      message: "AI recommended task started successfully",
    });
  } catch (error) {
    console.error("start task unexpected error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
