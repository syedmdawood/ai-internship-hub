import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);

    const assignmentId =
      url.searchParams.get("assignmentId");

    let query = supabaseAdmin
      .from("mentor_feedback")
      .select(`
        id,
        mentor_id,
        student_id,
        assignment_id,
        submission_id,
        subject,
        message,
        mentor_score,
        decision,
        created_at,
        updated_at
      `)
      .eq("student_id", user.id)
      .eq("is_visible_to_student", true)
      .order("created_at", {
        ascending: false,
      });

    if (assignmentId) {
      query = query.eq(
        "assignment_id",
        assignmentId
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const mentorIds = [
      ...new Set(
        (data ?? []).map(
          (feedback) => feedback.mentor_id
        )
      ),
    ];

    const { data: mentors } =
      mentorIds.length > 0
        ? await supabaseAdmin
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", mentorIds)
        : { data: [] };

    const mentorMap = new Map(
      (mentors ?? []).map((mentor) => [
        mentor.id,
        mentor,
      ])
    );

    return NextResponse.json({
      feedback: (data ?? []).map((item) => ({
        ...item,
        mentor:
          mentorMap.get(item.mentor_id) ?? null,
      })),
    });
  } catch (error) {
    console.error(
      "Student mentor feedback error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to load mentor feedback" },
      { status: 500 }
    );
  }
}