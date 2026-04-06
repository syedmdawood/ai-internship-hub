import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
      console.error("my-tasks auth error:", userResult.error);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const user = userResult.data.user;

    const assignmentsResult = await supabaseAdmin
      .from("task_assignments")
      .select("*")
      .eq("student_id", user.id)
      .order("assigned_at", { ascending: false });

    if (assignmentsResult.error) {
      console.error("my-tasks assignments error:", assignmentsResult.error);
      return NextResponse.json({ error: "Failed to fetch task assignments" }, { status: 500 });
    }

    const assignments = assignmentsResult.data || [];
    const taskIds = assignments.map((item) => item.task_id);

    if (taskIds.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
      });
    }

    const tasksResult = await supabaseAdmin
      .from("tasks")
      .select("id, title, description, difficulty_level, estimated_minutes, deliverable_type, instructions, tags")
      .in("id", taskIds);

    if (tasksResult.error) {
      console.error("my-tasks tasks fetch error:", tasksResult.error);
      return NextResponse.json({ error: "Failed to fetch task details" }, { status: 500 });
    }

    const tasksMap = new Map((tasksResult.data || []).map((task) => [task.id, task]));

    const merged = assignments.map((assignment) => ({
      ...assignment,
      task: tasksMap.get(assignment.task_id) || null,
    }));

    return NextResponse.json({
      success: true,
      tasks: merged,
    });
  } catch (error) {
    console.error("my-tasks unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}