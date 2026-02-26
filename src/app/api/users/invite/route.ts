import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageUsers } from "@/lib/auth";
import type { AppRole } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !canManageUsers(profile.role as AppRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = (body.email as string)?.trim()?.toLowerCase();
  const full_name = (body.full_name as string)?.trim() || null;
  const role = body.role as AppRole;

  const validRoles: AppRole[] = [
    "director",
    "supervisor",
    "employment_specialist",
    "crs",
  ];
  if (!email || !role || !validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Valid email and role (Director, Supervisor, Employment Specialist, or CRS) are required." },
      { status: 400 }
    );
  }

  // Use APP_URL (server-only, read at runtime) so invite links always point to your live site
  const baseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    request.nextUrl.origin;
  const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth/callback?next=/reset-password`;

  const {
    data: inviteData,
    error: inviteError,
  } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name },
  });

  if (inviteError) {
    if (inviteError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }
    console.error("Invite error:", inviteError);
    return NextResponse.json(
      { error: inviteError.message || "Failed to send invite." },
      { status: 500 }
    );
  }

  const newUserId = inviteData?.user?.id;
  if (!newUserId) {
    return NextResponse.json(
      { error: "Invite sent but could not create profile." },
      { status: 500 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: newUserId,
    email,
    full_name,
    role,
  });

  if (profileError) {
    if (profileError.code === "23505") {
      return NextResponse.json(
        { error: "A profile for this user already exists." },
        { status: 409 }
      );
    }
    console.error("Profile insert error:", profileError);
    return NextResponse.json(
      { error: "User invited but profile could not be created." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Invite sent. The user will receive an email to set their password.",
  });
}
