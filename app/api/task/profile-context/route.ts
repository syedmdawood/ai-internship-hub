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
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const user = userResult.data.user;

    const profileResult = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        primary_domain_id,
        secondary_domain_id,
        skill_level,
        current_skill_level
      `)
      .eq("id", user.id)
      .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileResult.data;

    const domainIds = [
      profile.primary_domain_id,
      profile.secondary_domain_id,
    ].filter(Boolean);

    const domainsResult = await supabaseAdmin
      .from("domains")
      .select("id, name")
      .in("id", domainIds.length ? domainIds : ["00000000-0000-0000-0000-000000000000"]);

    if (domainsResult.error) {
      return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
    }

    const domainsMap = new Map((domainsResult.data || []).map((d) => [d.id, d.name]));

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        primary_domain_name: profile.primary_domain_id ? domainsMap.get(profile.primary_domain_id) || null : null,
        secondary_domain_name: profile.secondary_domain_id ? domainsMap.get(profile.secondary_domain_id) || null : null,
      },
    });
  } catch (error) {
    console.error("profile-context error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}