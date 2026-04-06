import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
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
    const body = await req.json();
    const domainId = body?.domainId;

    if (!domainId) {
      return NextResponse.json({ error: "domainId is required" }, { status: 400 });
    }

    const profileResult = await supabaseAdmin
      .from("profiles")
      .select("primary_domain_id, secondary_domain_id")
      .eq("id", user.id)
      .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const allowedDomainIds = [
      profileResult.data.primary_domain_id,
      profileResult.data.secondary_domain_id,
    ].filter(Boolean);

    if (!allowedDomainIds.includes(domainId)) {
      return NextResponse.json({ error: "Selected domain is not allowed" }, { status: 403 });
    }

    const updateResult = await supabaseAdmin
      .from("profiles")
      .update({
        selected_task_domain_id: domainId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateResult.error) {
      return NextResponse.json({ error: "Failed to save selected domain" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Task domain selected successfully",
    });
  } catch (error) {
    console.error("select-domain error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}