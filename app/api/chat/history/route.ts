import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
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
    // Fetch Chat History
    // -----------------------------

    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages")
      .select(
        `
          id,
          role,
          message,
          created_at
          `,
      )
      .eq("student_id", studentId)
      .order("created_at", {
        ascending: true,
      })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error: any) {
    console.error("Chat history error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to load chat history",
      },
      {
        status: 500,
      },
    );
  }
}
