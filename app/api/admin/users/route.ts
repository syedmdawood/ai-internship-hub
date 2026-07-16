import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();

  // ===============================
  // Verify Authorization
  // ===============================

  const h = await headers();

  const authHeader = h.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const { data: meRes, error: meErr } = await supabaseAdmin.auth.getUser(token);

  if (meErr || !meRes.user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  // ===============================
  // Admin Check
  // ===============================

  const isAdmin = meRes.user.app_metadata?.role === "admin";

  if (!isAdmin) {
    return NextResponse.json(
      {
        error: "Forbidden",
      },
      {
        status: 403,
      },
    );
  }

  try {
    // ===============================
    // Get Auth Users
    // ===============================

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        {
          status: 400,
        },
      );
    }

    const authUsers = authData.users || [];

    // ===============================
    // Get Profiles
    // ===============================

    const userIds = authUsers.map((user) => user.id);

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 400,
        },
      );
    }

    // ===============================
    // Merge Auth + Profiles
    // ===============================

    const users = authUsers.map((user) => {
      const profile = profiles?.find((p) => p.id === user.id);

      return {
        id: user.id,

        email: user.email,

        role: user.app_metadata?.role || "student",

        created_at: user.created_at,

        last_sign_in_at: user.last_sign_in_at,

        profile: profile || null,
      };
    });

    // ===============================
    // Separate Roles
    // ===============================

    const students = users.filter((user) => user.role === "student");

    const mentors = users.filter((user) => user.role === "mentor");

    const admins = users.filter((user) => user.role === "admin");

    return NextResponse.json({
      total: users.length,

      students,

      mentors,

      admins,
    });
  } catch (error: any) {
    console.error("Admin users error:", error);

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
