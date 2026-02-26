import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageUsers } from "@/lib/auth";
import type { AppRole } from "@/types/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const updates: { full_name?: string; role?: AppRole } = {};
  if (body.full_name !== undefined) updates.full_name = body.full_name?.trim() || null;
  if (body.role !== undefined) {
    const validRoles: AppRole[] = ["admin", "director", "supervisor", "employment_specialist", "crs"];
    if (validRoles.includes(body.role)) updates.role = body.role;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
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

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);

  if (deleteError) {
    console.error("User delete error:", deleteError);
    return NextResponse.json(
      { error: deleteError.message ?? "Failed to remove user." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
