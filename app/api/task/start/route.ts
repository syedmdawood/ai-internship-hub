import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { recommendTasks } from "@/lib/recommendTasks";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const taskId =
      typeof body?.taskId === "string"
        ? body.taskId.trim()
        : "";

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        role,
        primary_domain_id,
        secondary_domain_id,
        skill_level,
        current_skill_level,
        last_assessment_at,
        task_domains_confirmed,
        domain_selection_source
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    if (profile.role !== "student") {
      return NextResponse.json(
        { error: "Only students can start tasks" },
        { status: 403 },
      );
    }

    if (!profile.last_assessment_at) {
      return NextResponse.json(
        {
          error: "Please complete your assessment first",
          needsAssessment: true,
        },
        { status: 400 },
      );
    }

    if (
      !profile.task_domains_confirmed ||
      !profile.primary_domain_id ||
      !profile.secondary_domain_id
    ) {
      return NextResponse.json(
        {
          error:
            "Please confirm your primary and secondary domains before starting a task",
          needsDomainSelection: true,
        },
        { status: 400 },
      );
    }

    /*
     * Prevent starting the same task twice.
     */
    const {
      data: existingAssignment,
      error: existingAssignmentError,
    } = await supabaseAdmin
      .from("task_assignments")
      .select("id")
      .eq("student_id", user.id)
      .eq("task_id", taskId)
      .maybeSingle();

    if (existingAssignmentError) {
      return NextResponse.json(
        {
          error:
            "Failed to check existing task assignment",
        },
        { status: 500 },
      );
    }

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Task already started" },
        { status: 409 },
      );
    }

    /*
     * Server-side protection against multiple active tasks.
     */
    const {
      data: activeAssignments,
      error: activeAssignmentsError,
    } = await supabaseAdmin
      .from("task_assignments")
      .select("id")
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .limit(1);

    if (activeAssignmentsError) {
      return NextResponse.json(
        {
          error:
            "Failed to check your active tasks",
        },
        { status: 500 },
      );
    }

    if ((activeAssignments ?? []).length > 0) {
      return NextResponse.json(
        {
          error:
            "You already have a task in progress. Submit it before starting another task.",
        },
        { status: 409 },
      );
    }

    const domainIds = [
      profile.primary_domain_id,
      profile.secondary_domain_id,
    ];

    const { data: availableTasks, error: tasksError } =
      await supabaseAdmin
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .in("domain_id", domainIds);

    if (tasksError) {
      return NextResponse.json(
        { error: "Failed to fetch available tasks" },
        { status: 500 },
      );
    }

    const { data: assignments, error: assignmentsError } =
      await supabaseAdmin
        .from("task_assignments")
        .select(`
          task_id,
          status,
          mentor_score,
          recommendation_score,
          assigned_at,
          started_at,
          submitted_at,
          completed_at
        `)
        .eq("student_id", user.id);

    if (assignmentsError) {
      return NextResponse.json(
        {
          error:
            "Failed to fetch student task progress",
        },
        { status: 500 },
      );
    }

    const recommendations = await recommendTasks({
      tasks: availableTasks ?? [],
      profile,
      assignments: assignments ?? [],
      limit: 20,
    });

    const selectedRecommendation = recommendations.find(
      (task) => task.id === taskId,
    );

    if (!selectedRecommendation) {
      return NextResponse.json(
        {
          error:
            "This task is not currently recommended for your selected domains, skill level and progress",
        },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();

    const { data: assignment, error: insertError } =
      await supabaseAdmin
        .from("task_assignments")
        .insert({
          student_id: user.id,
          task_id: taskId,
          status: "in_progress",

          recommendation_score:
            selectedRecommendation.recommendation_score,

          recommendation_reason:
            selectedRecommendation.recommendation_reason,

          recommendation_context: {
            primary_domain_id:
              profile.primary_domain_id,

            secondary_domain_id:
              profile.secondary_domain_id,

            domain_selection_source:
              profile.domain_selection_source,

            skill_level:
              profile.skill_level,

            current_skill_level:
              profile.current_skill_level,
          },

          assigned_at: now,
          started_at: now,
        })
        .select()
        .single();

    if (insertError || !assignment) {
      console.error("start task insert error:", insertError);

      return NextResponse.json(
        { error: "Failed to start task" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      assignment,
      message:
        "AI-recommended task started successfully",
    });
  } catch (error) {
    console.error("start task unexpected error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}