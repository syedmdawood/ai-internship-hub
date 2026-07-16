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

    const role = user.app_metadata?.role || user.user_metadata?.role;

    if (role !== "admin") {
      return NextResponse.json(
        {
          error: "Only admins can access reports",
        },
        {
          status: 403,
        },
      );
    }

    // ----------------------------
    // USERS
    // ----------------------------

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,role,primary_domain");

    const students = profiles?.filter((p) => p.role === "student") || [];

    const mentors = profiles?.filter((p) => p.role === "mentor") || [];

    // ----------------------------
    // TASKS
    // ----------------------------

    const { data: tasks } = await supabaseAdmin.from("tasks").select("id");

    // ----------------------------
    // ASSIGNMENTS
    // ----------------------------

    const { data: assignments } = await supabaseAdmin
      .from("task_assignments")
      .select("status,student_id,task_id");

    const completedTasks =
      assignments?.filter(
        (a) => a.status === "completed" || a.status === "approved",
      ).length || 0;

    const statusMap: any = {};

    assignments?.forEach((item) => {
      statusMap[item.status] = (statusMap[item.status] || 0) + 1;
    });

    const taskStatus = Object.entries(statusMap).map(([name, value]) => ({
      name,
      value,
    }));

    // ----------------------------
    // EVALUATIONS
    // ----------------------------

    const { data: evaluations } = await supabaseAdmin
      .from("task_evaluations")
      .select(
        `
        student_id,
        task_id,
        ai_score,
        evaluated_at
        `,
      );

    const averageScore = evaluations?.length
      ? (
          evaluations.reduce((sum, e) => sum + Number(e.ai_score || 0), 0) /
          evaluations.length
        ).toFixed(2)
      : 0;

    // ----------------------------
    // MENTOR SCORE
    // ----------------------------

    const { data: mentorScores } = await supabaseAdmin
      .from("task_assignments")
      .select("mentor_score")
      .not("mentor_score", "is", null);

    const averageMentorScore = mentorScores?.length
      ? (
          mentorScores.reduce((sum, x) => sum + Number(x.mentor_score), 0) /
          mentorScores.length
        ).toFixed(2)
      : 0;

    // ----------------------------
    // DOMAIN PERFORMANCE
    // ----------------------------

    const { data: domainData } = await supabaseAdmin
      .from("domains")
      .select("id,name");

    const domainPerformance: any[] = [];

    for (const domain of domainData || []) {
      const { data: domainTasks } = await supabaseAdmin
        .from("tasks")
        .select("id")
        .eq("domain_id", domain.id);

      const taskIds = domainTasks?.map((t) => t.id) || [];

      const scores =
        evaluations?.filter((e) => taskIds.includes(e.task_id)) || [];

      const avg = scores.length
        ? (
            scores.reduce((s, e) => s + Number(e.ai_score), 0) / scores.length
          ).toFixed(2)
        : 0;

      domainPerformance.push({
        domain: domain.name,

        averageScore: Number(avg),
      });
    }

    // ----------------------------
    // STUDENT RANKING
    // ----------------------------

    const studentRanking: any[] = [];

    for (const student of students) {
      const studentEvaluations =
        evaluations?.filter((e) => e.student_id === student.id) || [];

      const completed =
        assignments?.filter(
          (a) =>
            a.student_id === student.id &&
            (a.status === "completed" || a.status === "approved"),
        ).length || 0;

      const avg = studentEvaluations.length
        ? (
            studentEvaluations.reduce((s, e) => s + Number(e.ai_score), 0) /
            studentEvaluations.length
          ).toFixed(2)
        : 0;

      studentRanking.push({
        name: student.full_name || "Unknown",

        completedTasks: completed,

        averageScore: Number(avg),

        domain: student.primary_domain || "Not Selected",
      });
    }

    studentRanking.sort((a, b) => b.averageScore - a.averageScore);

    // ----------------------------
    // IMPROVEMENT TREND
    // ----------------------------

    const trend: any = {};

    evaluations?.forEach((e) => {
      const month = new Date(e.evaluated_at).toLocaleString("default", {
        month: "short",
      });

      if (!trend[month]) {
        trend[month] = {
          total: 0,
          count: 0,
        };
      }

      trend[month].total += Number(e.ai_score);

      trend[month].count++;
    });

    const improvementTrend = Object.entries(trend).map(
      ([month, value]: any) => ({
        month,

        score: Number((value.total / value.count).toFixed(2)),
      }),
    );

    return NextResponse.json({
      overview: {
        students: students.length,

        mentors: mentors.length,

        totalTasks: tasks?.length || 0,

        completedTasks,

        averageScore: Number(averageScore),

        averageMentorScore: Number(averageMentorScore),
      },

      taskStatus,

      domainPerformance,

      studentRanking: studentRanking.slice(0, 10),

      improvementTrend,
    });
  } catch (error) {
    console.error("Reports API Error", error);

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
