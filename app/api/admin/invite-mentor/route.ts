import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const h = await headers();
  const authHeader = h.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const { data: meRes, error: meErr } = await supabaseAdmin.auth.getUser(token);
  if (meErr || !meRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = meRes.user.app_metadata?.role === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!siteUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL is not configured" },
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
  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Invited user was not created" },
      { status: 500 },
    );
  }
  const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        role: "mentor",
      },
    },
  );
  if (roleError) {
    return NextResponse.json(
      {
        error: `User invited, but mentor role update failed: ${roleError.message}`,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({
    success: true,
  });
}
