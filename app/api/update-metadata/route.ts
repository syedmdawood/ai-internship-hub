import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const TARGET_EMAIL = "mdawood786611@gmail.com";

    const { data: usersData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const user = usersData.users.find((currentUser) => currentUser.email === TARGET_EMAIL);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
          role: "mentor",
        },
      });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "User metadata updated successfully",
      user: data.user,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}