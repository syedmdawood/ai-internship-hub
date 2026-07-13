import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// UPDATE DOMAIN
export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  const { id } = await context.params;

  try {
    const body = await req.json();

    const updateData: any = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();

      if (!name) {
        return NextResponse.json(
          {
            error: "Domain name cannot be empty",
          },
          {
            status: 400,
          },
        );
      }

      updateData.name = name;

      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$|/g, "");
    }

    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }

    if (body.display_order !== undefined) {
      updateData.display_order = Number(body.display_order);
    }

    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    const { data, error } = await supabaseAdmin
      .from("domains")
      .update(updateData)
      .eq("id", id)
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
        error: "Failed to update domain",
      },
      {
        status: 500,
      },
    );
  }
}

// SAFE DELETE DOMAIN
export async function DELETE(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const auth = await requireAdmin(req);

  if (auth.error) {
    return auth.error;
  }

  const { supabaseAdmin } = auth;

  const { id } = await context.params;

  try {
    // Check questions usage

    const { count: questionsCount } = await supabaseAdmin
      .from("questions")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("domain_id", id);

    // Check tasks usage

    const { count: tasksCount } = await supabaseAdmin
      .from("tasks")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("domain_id", id);

    if ((questionsCount ?? 0) > 0 || (tasksCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error: "Domain is already used. Deactivate instead of deleting.",
        },
        {
          status: 400,
        },
      );
    }

    const { error } = await supabaseAdmin.from("domains").delete().eq("id", id);

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

      message: "Domain deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to delete domain",
      },
      {
        status: 500,
      },
    );
  }
}
