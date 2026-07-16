import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = user.id;

    // PROFILE

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        full_name,
        primary_domain,
        skill_level
        `,
      )
      .eq("id", studentId)
      .single();

    // ASSIGNMENTS

    const { data: assignmentData } = await supabaseAdmin
      .from("task_assignments")
      .select(
        `
        id,
        task_id,
        status,
        assigned_at,
        completed_at,
        tasks(
          id,
          title,
          description,
          difficulty_level,
          deliverable_type,
          estimated_minutes
        )
        `,
      )
      .eq("student_id", studentId)
      .order("assigned_at", {
        ascending: false,
      });

    const assignments = assignmentData || [];

    const totalTasks = assignments.length;

    const completedTasks = assignments.filter(
      (item: any) => item.status === "completed" || item.status === "approved",
    ).length;

    // AI SCORES

    const { data: evaluationData } = await supabaseAdmin
      .from("task_evaluations")
      .select("ai_score")
      .eq("student_id", studentId);

    const evaluations = evaluationData || [];

    let averageScore = 0;

    if (evaluations.length > 0) {
      const total = evaluations.reduce(
        (sum: number, item: any) => sum + Number(item.ai_score || 0),
        0,
      );

      averageScore = Math.round(total / evaluations.length);
    }

    // HOURS

    const hoursLogged =
      assignments.reduce((sum: number, item: any) => {
        return sum + Number(item.tasks?.estimated_minutes || 0);
      }, 0) / 60;

    // RECENT ACTIVITY

    const recentActivity = assignments.slice(0, 5).map((item: any) => ({
      id: item.id,

      action:
        item.status === "completed" || item.status === "approved"
          ? "Completed task"
          : "Working on task",

      task: item.tasks?.title || "Unknown Task",

      status: item.status,

      time: new Date(item.assigned_at).toLocaleDateString(),
    }));

    // RECOMMENDED TASKS

    let recommendedTasks: any[] = [];

    const { data: taskData } = await supabaseAdmin
      .from("tasks")
      .select(
        `
        id,
        title,
        description,
        difficulty_level,
        deliverable_type,
        estimated_minutes
        `,
      )
      .eq("is_active", true)
      .limit(10);

    recommendedTasks = (taskData || [])
      .filter(
        (task: any) => !assignments.some((a: any) => a.task_id === task.id),
      )
      .slice(0, 3)
      .map((task: any) => ({
        id: task.id,

        title: task.title,

        description: task.description,

        difficulty: task.difficulty_level,

        status: "available",

        domain: profile?.primary_domain || "General",

        tags: [],

        estimatedTime: `${task.estimated_minutes || 60} min`,

        deliverableType: task.deliverable_type || "text",
      }));

    return NextResponse.json({
      profile: {
        name: profile?.full_name || user.email?.split("@")[0],

        email: user.email,

        domain: profile?.primary_domain || "Not Selected",

        skill: profile?.skill_level || "Beginner",
      },

      stats: {
        completedTasks,

        totalTasks,

        averageScore,

        hoursLogged: Number(hoursLogged.toFixed(1)),

        currentStreak: completedTasks,

        portfolioProjects: completedTasks,
      },

      recentActivity,

      recommendedTasks,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
