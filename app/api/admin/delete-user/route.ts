import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create user client using JWT token
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    // Get logged in admin user
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    // Check admin role from Supabase metadata
    const role = user.app_metadata?.role || user.user_metadata?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete users" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Prevent admin deleting himself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 },
      );
    }

    // Get target user profile
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Only allow deleting students
    if (targetProfile.role !== "student") {
      return NextResponse.json(
        {
          error: "Only student accounts can be deleted from this section",
        },
        { status: 403 },
      );
    }

    // Delete from Supabase Auth
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(deleteError);

      return NextResponse.json(
        {
          error: "Failed to delete user",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Student deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete user error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
