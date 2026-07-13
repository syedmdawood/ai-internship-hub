import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireAdmin(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();


  const { data, error } =
    await supabaseAdmin.auth.getUser(token);


  if (error || !data.user) {
    return {
      error: NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      ),
    };
  }


  const role =
    data.user.app_metadata?.role;


  if (role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }


  return {
    user: data.user,
    supabaseAdmin,
  };
}