import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type DomainSelectionBody = {
  primaryDomainId?: string;
  secondaryDomainId?: string;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeName(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(req: Request) {
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

    const body = (await req.json()) as DomainSelectionBody;

    const primaryDomainId =
      typeof body.primaryDomainId === "string"
        ? body.primaryDomainId.trim()
        : "";

    const secondaryDomainId =
      typeof body.secondaryDomainId === "string"
        ? body.secondaryDomainId.trim()
        : "";

    if (!primaryDomainId) {
      return NextResponse.json(
        { error: "Primary domain is required" },
        { status: 400 },
      );
    }

    if (!secondaryDomainId) {
      return NextResponse.json(
        { error: "Secondary domain is required" },
        { status: 400 },
      );
    }

    if (primaryDomainId === secondaryDomainId) {
      return NextResponse.json(
        {
          error: "Primary and secondary domains must be different",
        },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        `
    id,
    role,
    recommended_domain,
    secondary_domains,
    last_assessment_at,
    task_domains_confirmed,
    primary_domain_id,
    secondary_domain_id
  `,
      )
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.role !== "student") {
      return NextResponse.json(
        { error: "Only students can select task domains" },
        { status: 403 },
      );
    }
    /*
     * Domain selection is allowed only once.
     * Once confirmed, the student cannot change domains again.
     */
    if (profile.task_domains_confirmed) {
      return NextResponse.json(
        {
          error:
            "Your primary and secondary domains have already been confirmed and cannot be changed.",
          domainsAlreadyConfirmed: true,
        },
        { status: 409 },
      );
    }

    if (!profile.last_assessment_at || !profile.recommended_domain) {
      return NextResponse.json(
        {
          error:
            "Please complete the skill assessment before selecting domains",
          needsAssessment: true,
        },
        { status: 400 },
      );
    }

    const { data: selectedDomains, error: selectedDomainsError } =
      await supabaseAdmin
        .from("domains")
        .select("id, name")
        .in("id", [primaryDomainId, secondaryDomainId])
        .eq("is_active", true);

    if (selectedDomainsError) {
      console.error(
        "domain-selection domain lookup error:",
        selectedDomainsError,
      );

      return NextResponse.json(
        { error: "Failed to validate selected domains" },
        { status: 500 },
      );
    }

    if (!selectedDomains || selectedDomains.length !== 2) {
      return NextResponse.json(
        {
          error: "One or more selected domains are invalid or inactive",
        },
        { status: 400 },
      );
    }

    const primaryDomain = selectedDomains.find(
      (domain) => domain.id === primaryDomainId,
    );

    const secondaryDomain = selectedDomains.find(
      (domain) => domain.id === secondaryDomainId,
    );

    if (!primaryDomain || !secondaryDomain) {
      return NextResponse.json(
        { error: "Selected domains could not be found" },
        { status: 400 },
      );
    }

    /*
     * Determine the source on the server.
     * Do not trust the frontend to tell us whether the choice was AI or custom.
     */
    const aiPrimaryDomainName = normalizeName(profile.recommended_domain);

    const aiSecondaryDomainNames = normalizeStringArray(
      profile.secondary_domains,
    ).map(normalizeName);

    const primaryMatchesAI =
      normalizeName(primaryDomain.name) === aiPrimaryDomainName;

    const secondaryMatchesAI = aiSecondaryDomainNames.includes(
      normalizeName(secondaryDomain.name),
    );

    const selectionSource =
      primaryMatchesAI && secondaryMatchesAI ? "ai" : "custom";

    const now = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        primary_domain_id: primaryDomain.id,
        secondary_domain_id: secondaryDomain.id,

        /*
         * Save confirmed primary domain name.
         * AI recommendation remains in recommended_domain.
         */
        primary_domain: primaryDomain.name,

        task_domains_confirmed: true,
        domain_selection_source: selectionSource,
        domain_selection_updated_at: now,
        updated_at: now,
      })
      .eq("id", user.id)
      .select(
        `
          id,
          primary_domain,
          primary_domain_id,
          secondary_domain_id,
          task_domains_confirmed,
          domain_selection_source,
          domain_selection_updated_at
        `,
      )
      .single();

    if (updateError || !updatedProfile) {
      console.error("domain-selection profile update error:", updateError);

      return NextResponse.json(
        { error: "Failed to save selected domains" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        selectionSource === "ai"
          ? "AI-recommended domains confirmed successfully"
          : "Custom domains saved successfully",

      selection: {
        primary_domain_id: primaryDomain.id,
        primary_domain_name: primaryDomain.name,
        secondary_domain_id: secondaryDomain.id,
        secondary_domain_name: secondaryDomain.name,
        selection_source: selectionSource,
        confirmed_at: now,
      },
    });
  } catch (error) {
    console.error("domain-selection unexpected error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
