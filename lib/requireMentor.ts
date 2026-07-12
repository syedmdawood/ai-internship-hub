import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function requireMentor(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing authorization token" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  const role = user.app_metadata?.role;

  if (role !== "mentor") {
    return {
      errorResponse: NextResponse.json(
        { error: "Mentor access is required" },
        { status: 403 }
      ),
    };
  }

  return {
    supabaseAdmin,
    user,
  };
}