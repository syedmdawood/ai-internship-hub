import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

import { generatePortfolioAI } from "@/lib/generatePortfolio";

export async function POST(req: Request) {
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

    // Get student portfolio

    let { data: portfolio } = await supabase
      .from("student_portfolios")
      .select("id")
      .eq("student_id", studentId)
      .single();

    if (!portfolio) {
      const { data: newPortfolio } = await supabase
        .from("student_portfolios")
        .insert({
          student_id: studentId,

          headline: "Freelancer",

          bio: "AI generated portfolio",
        })
        .select("id")
        .single();

      portfolio = newPortfolio;
    }

    // Profile

    const { data: profile } = await supabase

      .from("profiles")

      .select(
        `
full_name,
bio,
skills,
primary_domain
`,
      )

      .eq("id", studentId)

      .single();

    // Projects

    const { data: assignments } = await supabase

      .from("task_assignments")

      .select(
        `

id,

tasks(
title,
description,
tags
),

task_evaluations(
ai_score
),

mentor_feedback(
mentor_score
)

`,
      )

      .eq("student_id", studentId)

      .in("status", ["completed", "approved"]);

    const projects = (assignments ?? []).map((item: any) => ({
      assignment_id: item.id,

      title: item.tasks?.title,

      description: item.tasks?.description,

      skills: item.tasks?.tags ?? [],

      ai_score: item.task_evaluations?.[0]?.ai_score ?? 0,

      mentor_score: item.mentor_feedback?.mentor_score ?? null,
    }));

    const aiResult = await generatePortfolioAI({
      name: profile?.full_name,

      domain: profile?.primary_domain,

      skills: profile?.skills,

      projects,
    });

    console.log("Ai Result ", aiResult);

    // ==============================
    // Save AI Portfolio Profile
    // ==============================

    await supabase
      .from("student_portfolios")
      .update({
        headline: aiResult.headline,

        bio: aiResult.bio,

        ai_summary: aiResult.bio,

        skills: aiResult.skills,
      })
      .eq("student_id", studentId);

    // ==============================
    // Save AI Generated Projects
    // ==============================

    for (const project of aiResult.projects ?? []) {
      await supabase.from("portfolio_projects").upsert(
        {
          portfolio_id: portfolio.id,

          assignment_id: project.assignment_id,

          title: project.title,

          ai_description: project.description,

          is_visible: true,
        },
        {
          onConflict: "assignment_id",
        },
      );
    }

    return NextResponse.json({
      success: true,

      data: aiResult,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        error: "Generation failed",
      },
      {
        status: 500,
      },
    );
  }
}
