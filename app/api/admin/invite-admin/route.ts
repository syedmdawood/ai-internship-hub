import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Only an existing admin can invite another admin
    if (currentUser.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    if (!siteUrl) {
      console.error("NEXT_PUBLIC_SITE_URL is not configured");
      return NextResponse.json(
        {
          error: "Application site URL is not configured",
        },
        { status: 500 },
      );
    }
    const redirectTo = `${siteUrl}/create-password`;
    const { data, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          setPassword: false,
        },
        redirectTo,
      });
    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }
    const invitedUserId = data.user?.id;
    if (!invitedUserId) {
      return NextResponse.json(
        { error: "Invited user was not created" },
        { status: 500 },
      );
    }
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(
      invitedUserId,
      {
        app_metadata: {
          role: "admin",
        },
      },
    );
    if (roleError) {
      console.error("Failed to assign admin role:", roleError);
      return NextResponse.json(
        {
          error: `Invitation was created, but admin role assignment failed: ${roleError.message}`,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Invite admin error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to invite admin",
      },
      { status: 500 },
    );
  }
}
