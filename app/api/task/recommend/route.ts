import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { recommendTasks } from "@/lib/recommendTasks";

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const userResult = await supabaseAdmin.auth.getUser(token);

    if (userResult.error || !userResult.data.user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const user = userResult.data.user;

    const profileResult = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        role,
        primary_domain_id,
        secondary_domain_id,
        selected_task_domain_id,
        skill_level,
        current_skill_level
      `)
      .eq("id", user.id)
      .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileResult.data;

    if (!profile.primary_domain_id && !profile.secondary_domain_id) {
      return NextResponse.json(
        { error: "Assessment required before accessing tasks", needsAssessment: true },
        { status: 400 }
      );
    }

    if (!profile.selected_task_domain_id) {
      return NextResponse.json({
        success: true,
        needsDomainSelection: true,
        recommendations: [],
      });
    }

    const tasksResult = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .eq("domain_id", profile.selected_task_domain_id)
      .order("created_at", { ascending: false });

    if (tasksResult.error) {
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    const assignmentsResult = await supabaseAdmin
      .from("task_assignments")
      .select("task_id")
      .eq("student_id", user.id);

    if (assignmentsResult.error) {
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
    }

    const assignedTaskIds = (assignmentsResult.data || []).map((item) => item.task_id);

    const recommendations = recommendTasks({
      tasks: tasksResult.data || [],
      profile,
      assignedTaskIds,
    });

    return NextResponse.json({
      success: true,
      needsDomainSelection: false,
      recommendations: recommendations.slice(0, 6),
    });
  } catch (error) {
    console.error("recommend route unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}