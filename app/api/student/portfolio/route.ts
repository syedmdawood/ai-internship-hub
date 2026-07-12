import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Missing token",
        },
        {
          status: 401,
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          error: "Invalid user",
        },
        {
          status: 401,
        },
      );
    }

    const studentId = userData.user.id;
    const { data: portfolio } = await supabase
      .from("student_portfolios")
      .select("id, headline, bio, skills")
      .eq("student_id", studentId)
      .single();

    // ==============================
    // Student Profile
    // ==============================

    const { data: studentProfile, error: profileError } = await supabase

      .from("profiles")

      .select(
        `
        full_name,
        bio,
        avatar_url,
        skills,
        primary_domain,
        created_at
    `,
      )

      .eq("id", studentId)

      .single();

    if (profileError) {
      console.log("Profile error:", profileError);
    }

    // ==============================
    // Completed Projects
    // ==============================

    const { data: assignments, error: assignmentError } = await supabase

      .from("task_assignments")

      .select(
        `
id,
status,
completed_at,
mentor_score,


tasks(
    id,
    title,
    description,
    tags,
    difficulty_level,
    evaluation_type
),


task_submissions(
    id,
    github_url,
    figma_url,
    submission_url,
    screenshot_url,
    files
),


task_evaluations(
    ai_score,
    ai_feedback,
    strengths,
    improvements
),


mentor_feedback(
    mentor_score,
    decision,
    message
)

`,
      )

      .eq("student_id", studentId)

      .in("status", ["completed", "approved"])

      .order("completed_at", {
        ascending: false,
      });

    if (assignmentError) {
      throw assignmentError;
    }

    const projects = (assignments ?? []).map((item: any) => {
      const evaluation = item.task_evaluations?.[0];

      return {
        id: item.id,

        title: item.tasks?.title ?? "Untitled Project",

        description: item.tasks?.description ?? "",

        skills: item.tasks?.tags ?? [],

        github_url: item.task_submissions?.github_url ?? null,

        submission_url: item.task_submissions?.submission_url ?? null,

        files: item.task_submissions?.files ?? [],

        ai_score: evaluation?.ai_score ?? 0,

        ai_feedback: evaluation?.ai_feedback ?? "",

        mentor_score:
          item.mentor_feedback?.mentor_score ?? item.mentor_score ?? null,

        mentor_approved: item.mentor_feedback?.decision === "approved",

        mentor_feedback: item.mentor_feedback?.message ?? "",

        completed_at: item.completed_at,
      };
    });

    const { data: aiProjects } = await supabase
      .from("portfolio_projects")
      .select(
        `
      assignment_id,
      title,
      ai_description
  `,
      )
      .eq("portfolio_id", portfolio.id)
      .eq("is_visible", true);

    return NextResponse.json({
      profile: {
        name: studentProfile?.full_name ?? "Student",

        bio:
          portfolio?.bio ??
          studentProfile?.bio ??
          "Build your professional portfolio",

        headline: portfolio?.headline,

        skills: portfolio?.skills ?? [],

        avatar_url: studentProfile?.avatar_url ?? null,

        primary_domain: studentProfile?.primary_domain ?? "Freelancing",

        joined: studentProfile?.created_at,
      },

      projects: projects.map((project: any) => {
        const aiProject = aiProjects?.find(
          (x: any) => x.assignment_id === project.id,
        );

        return {
          ...project,

          title: aiProject?.title ?? project.title,

          description: aiProject?.ai_description ?? project.description,
        };
      }),

      stats: {
        projects: projects.length,

        averageScore: projects.length
          ? Math.round(
              projects.reduce(
                (sum: number, p: any) => sum + Number(p.ai_score || 0),

                0,
              ) / projects.length,
            )
          : 0,

        averageMentorScore: projects.length
          ? Math.round(
              projects.reduce(
                (sum: number, p: any) => sum + Number(p.mentor_score || 0),

                0,
              ) / projects.length,
            )
          : 0,
      },
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      },
    );
  }
}
