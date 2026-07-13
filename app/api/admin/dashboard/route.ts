import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  try {
    // Total Users
    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      });

    // Students
    const { count: students } = await supabaseAdmin
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role", "student");

    // Mentors
    const { count: mentors } = await supabaseAdmin
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role", "mentor");

    // Admins
    const { count: admins } = await supabaseAdmin
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role", "admin");

    // Domains
    const { count: domains } = await supabaseAdmin
      .from("domains")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("is_active", true);

    // Tasks
    const { count: tasks } = await supabaseAdmin.from("tasks").select("*", {
      count: "exact",
      head: true,
    });

    // Completed assignments
    const { count: completedTasks } = await supabaseAdmin
      .from("task_assignments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "completed");

    // Evaluations
    const { data: evaluations } = await supabaseAdmin
      .from("task_evaluations")
      .select("ai_score");

    let averageScore = 0;

    if (evaluations && evaluations.length > 0) {
      const total = evaluations.reduce(
        (sum, item) => sum + Number(item.ai_score || 0),
        0,
      );

      averageScore = Number((total / evaluations.length).toFixed(2));
    }

    return NextResponse.json({
      success: true,

      stats: {
        totalUsers: totalUsers ?? 0,
        students: students ?? 0,
        mentors: mentors ?? 0,
        admins: admins ?? 0,

        activeDomains: domains ?? 0,

        totalTasks: tasks ?? 0,

        completedTasks: completedTasks ?? 0,

        averageEvaluationScore: averageScore,
      },
    });
  } catch (error: any) {
    console.log(error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard statistics",
      },
      {
        status: 500,
      },
    );
  }
}
