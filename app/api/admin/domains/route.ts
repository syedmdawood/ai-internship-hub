import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// GET ALL DOMAINS
export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  try {
    const { data, error } = await supabaseAdmin
      .from("domains")
      .select("*")
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      success: true,

      domains: data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch domains",
      },
      {
        status: 500,
      },
    );
  }
}

// CREATE DOMAIN
export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  try {
    const body = await req.json();

    const name = String(body.name || "").trim();

    const description = String(body.description || "").trim();

    if (!name) {
      return NextResponse.json(
        {
          error: "Domain name is required",
        },
        {
          status: 400,
        },
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$|/g, "");

    const { data: existing } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "Domain already exists",
        },
        {
          status: 400,
        },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("domains")
      .insert({
        name,

        description: description || null,

        slug,

        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      success: true,

      domain: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to create domain",
      },
      {
        status: 500,
      },
    );
  }
}
