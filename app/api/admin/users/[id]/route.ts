import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get current logged in admin token
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify current user
    const {
      data: { user },
      error: userError,
    } = await getSupabaseAdmin().auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Prevent deleting yourself

    if (user.id === id) {
      return NextResponse.json(
        {
          error: "You cannot delete your own account",
        },
        {
          status: 403,
        },
      );
    }

    // Check target user's role

    const { data: targetProfile, error: profileError } =
      await getSupabaseAdmin()
        .from("profiles")
        .select("role")
        .eq("id", id)
        .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    // Only student deletion allowed

    if (targetProfile.role !== "student") {
      return NextResponse.json(
        {
          error: "Only student accounts can be deleted",
        },
        {
          status: 403,
        },
      );
    }

    // Delete user from auth.users
    // profiles will delete automatically because cascade

    const { error: deleteError } =
      await getSupabaseAdmin().auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: deleteError.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
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
