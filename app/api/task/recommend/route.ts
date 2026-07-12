import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { recommendTasks } from "@/lib/recommendTasks";

export const runtime = "nodejs";

export async function GET(req: Request) {
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
        {
          error:
            "Only students can access task recommendations",
        },
        { status: 403 },
      );
    }

    /*
     * First verify that an assessment exists.
     */
    if (!profile.last_assessment_at) {
      return NextResponse.json(
        {
          error:
            "Assessment required before accessing tasks",
          needsAssessment: true,
        },
        { status: 400 },
      );
    }

    /*
     * Then verify that the student confirmed domains.
     */
    if (
      !profile.task_domains_confirmed ||
      !profile.primary_domain_id ||
      !profile.secondary_domain_id
    ) {
      return NextResponse.json(
        {
          error:
            "Please confirm your primary and secondary domains",
          needsDomainSelection: true,
        },
        { status: 400 },
      );
    }

    const domainIds = [
      profile.primary_domain_id,
      profile.secondary_domain_id,
    ];

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .in("domain_id", domainIds)
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("recommend tasks fetch error:", tasksError);

      return NextResponse.json(
        { error: "Failed to fetch tasks" },
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
      console.error(
        "recommend assignments fetch error:",
        assignmentsError,
      );

      return NextResponse.json(
        { error: "Failed to fetch assignments" },
        { status: 500 },
      );
    }

    const assignmentList = assignments ?? [];

    const recommendations = await recommendTasks({
      tasks: tasks ?? [],
      profile,
      assignments: assignmentList,
      limit: 6,
    });

    const completed = assignmentList.filter((item) =>
      ["completed", "approved"].includes(item.status),
    ).length;

    const inProgress = assignmentList.filter((item) =>
      [
        "in_progress",
        "submitted",
        "under_review",
        "reviewed",
      ].includes(item.status),
    ).length;

    return NextResponse.json({
      success: true,

      recommendations: recommendations.slice(0, 6),

      selectedDomains: {
        primary_domain_id: profile.primary_domain_id,
        secondary_domain_id: profile.secondary_domain_id,
        selection_source: profile.domain_selection_source,
      },

      progress: {
        totalAssigned: assignmentList.length,
        inProgress,
        completed,
      },
    });
  } catch (error) {
    console.error("recommend route unexpected error:", error);

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