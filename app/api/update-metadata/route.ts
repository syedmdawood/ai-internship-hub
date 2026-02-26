import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const TARGET_EMAIL = "mdawood786611@gmail.com";

    // 1️⃣ Get user by email
    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const user = usersData.users.find(
      (u) => u.email === TARGET_EMAIL
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Update app metadata
    const { data, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          role: "mentor",
        },
      });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User metadata updated successfully",
      user: data.user,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}