import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canEditEmployers,
  canDeleteEmployers,
} from "@/lib/auth";
import type { AppRole, Employer } from "@/types/database";

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

  if (!profile || !canEditEmployers(profile.role as AppRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowed = [
    "company_name",
    "address_street",
    "address_city",
    "address_state",
    "address_county",
    "phone",
    "website",
    "industry",
    "contact_name",
    "contact_phone",
    "contact_email",
    "contact_title",
    "status",
  ] as const;
  const updates: Partial<Employer> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      (updates as Record<string, unknown>)[key] = body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  if (updates.status && profile.role === "crs") {
    const validStatuses = ["New Submission", "Active Partner"];
    if (!validStatuses.includes(updates.status as string)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const { data: employer, error } = await admin
    .from("employers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Employer update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ employer });
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

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !canDeleteEmployers(profile.role as AppRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("employers").delete().eq("id", id);

  if (error) {
    console.error("Employer delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
