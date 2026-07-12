import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        role,
        recommended_domain,
        secondary_domains,
        primary_domain,
        primary_domain_id,
        secondary_domain_id,
        task_domains_confirmed,
        domain_selection_source,
        domain_selection_updated_at,
        skill_level,
        current_skill_level,
        last_assessment_at
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("profile-context profile error:", profileError);

      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    if (profile.role !== "student") {
      return NextResponse.json(
        { error: "Only students can access task domain selection" },
        { status: 403 },
      );
    }

    const { data: domains, error: domainsError } = await supabaseAdmin
      .from("domains")
      .select(`
        id,
        name,
        slug,
        display_order
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (domainsError) {
      console.error("profile-context domains error:", domainsError);

      return NextResponse.json(
        { error: "Failed to fetch available domains" },
        { status: 500 },
      );
    }

    const domainList = domains ?? [];

    const domainMap = new Map(
      domainList.map((domain) => [domain.id, domain.name]),
    );

    const aiSecondaryDomainNames = normalizeStringArray(
      profile.secondary_domains,
    );

    const hasAssessment = Boolean(
      profile.last_assessment_at && profile.recommended_domain,
    );

    return NextResponse.json({
      success: true,

      profile: {
        /*
         * AI recommendation from the latest assessment.
         */
        ai_primary_domain_name: profile.recommended_domain ?? null,
        ai_secondary_domain_names: aiSecondaryDomainNames,

        /*
         * Current draft or confirmed selection.
         */
        primary_domain_id: profile.primary_domain_id ?? null,
        secondary_domain_id: profile.secondary_domain_id ?? null,

        primary_domain_name: profile.primary_domain_id
          ? domainMap.get(profile.primary_domain_id) ?? null
          : null,

        secondary_domain_name: profile.secondary_domain_id
          ? domainMap.get(profile.secondary_domain_id) ?? null
          : null,

        /*
         * Confirmation information.
         */
        task_domains_confirmed:
          profile.task_domains_confirmed === true,

        domain_selection_source:
          profile.domain_selection_source ?? null,

        domain_selection_updated_at:
          profile.domain_selection_updated_at ?? null,

        /*
         * Assessment information.
         */
        skill_level:
          profile.current_skill_level ??
          profile.skill_level ??
          null,

        last_assessment_at: profile.last_assessment_at ?? null,
        has_assessment: hasAssessment,
      },

      domains: domainList,
    });
  } catch (error) {
    console.error("profile-context unexpected error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}