import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // -----------------------------
    // Authentication
    // -----------------------------
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Missing authorization token",
        },
        {
          status: 401,
        },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          error: "Invalid token",
        },
        {
          status: 401,
        },
      );
    }

    const studentId = userData.user.id;

    // -----------------------------
    // Get User Message
    // -----------------------------
    const body = await req.json();

    const message = body.message;

    if (!message || !message.trim()) {
      return NextResponse.json(
        {
          error: "Message is required",
        },
        {
          status: 400,
        },
      );
    }

    // Save user message
    await supabaseAdmin.from("chat_messages").insert({
      student_id: studentId,
      role: "user",
      message: message.trim(),
    });

    // -----------------------------
    // Fetch Student Profile
    // -----------------------------
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        `
          full_name,
          skills,
          skill_level,
          current_skill_level,
          primary_domain,
          secondary_domains,
          bio
          `,
      )
      .eq("id", studentId)
      .single();

    // -----------------------------
    // Fetch Assessment Result
    // -----------------------------
    const { data: assessment } = await supabaseAdmin
      .from("assessment_results")
      .select(
        `
          total_score,
          percentage_score,
          skill_level,
          recommended_domain,
          secondary_recommendations,
          ai_recommendation,
          selected_domains
          `,
      )
      .eq("user_id", studentId)
      .order("completed_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    // -----------------------------
    // Fetch Task Progress
    // -----------------------------
    const { data: assignments } = await supabaseAdmin
      .from("task_assignments")
      .select(
        `
          status,
          completed_at,
          task:tasks(
            title,
            difficulty_level,
            deliverable_type
          )
          `,
      )
      .eq("student_id", studentId)
      .order("completed_at", {
        ascending: false,
      })
      .limit(5);

    // -----------------------------
    // Fetch AI Evaluations
    // -----------------------------
    const { data: evaluations } = await supabaseAdmin
      .from("task_evaluations")
      .select(
        `
          ai_score,
          ai_feedback,
          strengths,
          improvements,
          code_quality_score,
          design_quality_score,
          correctness_score
          `,
      )
      .eq("student_id", studentId)
      .order("evaluated_at", {
        ascending: false,
      })
      .limit(3);

    // -----------------------------
    // Fetch Mentor Feedback
    // -----------------------------
    const { data: mentorFeedback } = await supabaseAdmin
      .from("mentor_feedback")
      .select(
        `
          subject,
          message,
          mentor_score,
          decision
          `,
      )
      .eq("student_id", studentId)
      .eq("is_visible_to_student", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(3);

    // -----------------------------
    // Build AI Context
    // -----------------------------
    const context = `
You are an AI Career Assistant inside an AI-supported Virtual Internship Hub.

Your responsibility:
- Provide freelancing career guidance.
- Suggest skills to improve.
- Help students prepare for platforms like Upwork and Fiverr.
- Give portfolio improvement advice.
- Explain learning paths.

Student Profile:

Name:
${profile?.full_name || "Unknown"}

Skills:
${JSON.stringify(profile?.skills || [])}

Current Skill Level:
${profile?.current_skill_level || profile?.skill_level || "Unknown"}

Primary Domain:
${profile?.primary_domain || "Not selected"}

Secondary Domains:
${JSON.stringify(profile?.secondary_domains || [])}


Assessment Result:

Score:
${assessment?.percentage_score || 0}%

Recommended Domain:
${JSON.stringify(assessment?.recommended_domain || {})}

AI Recommendation:
${assessment?.ai_recommendation || "No recommendation available"}



Task Progress:

${JSON.stringify(assignments || [], null, 2)}



AI Evaluation History:

${JSON.stringify(evaluations || [], null, 2)}



Mentor Feedback:

${JSON.stringify(mentorFeedback || [], null, 2)}



Student Question:

${message}


Instructions:

- Give personalized advice.
- Use student's progress data.
- Do not give generic answers.
- Keep responses clear and practical.
- Focus on freelancing career growth.
`;

    // -----------------------------
    // OpenAI Call
    // -----------------------------
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",

      temperature: 0.4,

      messages: [
        {
          role: "system",
          content:
            "You are a professional AI career mentor for freelancing students.",
        },
        {
          role: "user",
          content: context,
        },
      ],
    });

    const aiReply = response.choices[0]?.message?.content?.trim();

    if (!aiReply) {
      throw new Error("AI response empty");
    }

    // Save AI response
    await supabaseAdmin.from("chat_messages").insert({
      student_id: studentId,
      role: "assistant",
      message: aiReply,
    });

    return NextResponse.json({
      success: true,
      reply: aiReply,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
