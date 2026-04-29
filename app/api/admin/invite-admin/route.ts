import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const h = await headers()
  const authHeader = h.get("authorization")

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "").trim()

  const { data: meRes, error: meErr } =
    await supabaseAdmin.auth.getUser(token)

  if (meErr || !meRes.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 🔥 Only existing admin can invite admin
  const isAdmin = meRes.user.app_metadata?.role === "admin"

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const email = String(body?.email || "").trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/create-password`

  // Invite admin
  const { data, error } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        setPassword: false, // user_metadata
      },
      redirectTo,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const userId = data.user?.id

  // Set role = admin
  await supabaseAdmin.auth.admin.updateUserById(userId!, {
    app_metadata: { role: "admin" },
  })

  return NextResponse.json({ success: true })
}