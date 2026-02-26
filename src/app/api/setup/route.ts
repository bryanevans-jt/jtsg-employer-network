import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Check if setup is still allowed (no profiles yet).
 * POST: One-time setup: create the first user and give them the admin role.
 */
export async function GET() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  return NextResponse.json({ setupAllowed: count === 0 });
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (count && count > 0) {
    return NextResponse.json(
      { error: "Setup already completed. Use the login page." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = (body.email as string)?.trim()?.toLowerCase();
  const password = body.password as string;

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Valid email and password (8+ characters) are required." },
      { status: 400 }
    );
  }

  const {
    data: { user },
    error: createError,
  } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "A user with this email already exists. Use the login page or reset password." },
        { status: 409 }
      );
    }
    console.error("Setup createUser error:", createError);
    return NextResponse.json(
      { error: createError.message ?? "Failed to create account." },
      { status: 500 }
    );
  }

  if (!user?.id) {
    return NextResponse.json(
      { error: "Account could not be created." },
      { status: 500 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    email,
    full_name: null,
    role: "admin",
  });

  if (profileError) {
    console.error("Setup profile insert error:", profileError);
    return NextResponse.json(
      { error: "Account created but profile could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Admin account created. You can sign in on the login page.",
  });
}
