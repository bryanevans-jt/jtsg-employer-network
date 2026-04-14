import { NextRequest, NextResponse } from "next/server";
import { loadStaffContext } from "@/lib/api-guards";
import {
  canEditEmployers,
  canDeleteEmployers,
  canViewActiveOnly,
  canViewFullEmployerPipeline,
} from "@/lib/permissions";
import { normalizeStreet, normalizeCity, normalizeState, normalizeCounty } from "@/lib/address";
import type { AppRole, Employer } from "@/types/database";
import { isEmployerStatus } from "@/lib/employer-status";
import { logAppEvent } from "@/lib/observability";

function employerVisible(role: AppRole, row: Employer): boolean {
  if (canViewActiveOnly(role)) return row.status === "Active Partner";
  return canViewFullEmployerPipeline(role);
}

async function insertActivity(
  admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  employerId: string,
  actorId: string,
  action: string,
  details: Record<string, unknown>
) {
  const { error } = await admin.from("employer_activity").insert({
    employer_id: employerId,
    actor_id: actorId,
    action,
    details,
  });
  if (error) {
    logAppEvent("employer_activity_insert_failed", { employerId, action }, error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const { admin, profile } = ctx;
  const role = profile.role as AppRole;

  const { data: row, error } = await admin.from("employers").select("*").eq("id", id).single();
  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const employer = row as Employer;
  if (!employerVisible(role, employer)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const includeActivity = request.nextUrl.searchParams.get("include_activity") === "1";
  let activity: unknown[] = [];
  if (includeActivity) {
    const { data: acts } = await admin
      .from("employer_activity")
      .select("*")
      .eq("employer_id", id)
      .order("created_at", { ascending: false })
      .limit(80);
    activity = acts ?? [];
  }

  return NextResponse.json({ employer, activity });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const { admin, profile, userId } = ctx;
  const role = profile.role as AppRole;

  if (!canEditEmployers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: before, error: fetchErr } = await admin
    .from("employers")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const prev = before as Employer;

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
    "internal_notes",
    "next_follow_up_date",
    "assigned_staff_id",
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

  if (updates.status !== undefined) {
    const s = updates.status as string;
    if (!isEmployerStatus(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  if (updates.assigned_staff_id !== undefined && updates.assigned_staff_id !== null) {
    const sid = updates.assigned_staff_id as string;
    const { data: assignee } = await admin.from("profiles").select("id").eq("id", sid).single();
    if (!assignee) {
      return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
    }
  }

  if (updates.address_street !== undefined)
    updates.address_street = normalizeStreet(updates.address_street ?? "");
  if (updates.address_city !== undefined)
    updates.address_city = normalizeCity(updates.address_city ?? "");
  if (updates.address_state !== undefined)
    updates.address_state = normalizeState(updates.address_state ?? "");
  if (updates.address_county !== undefined)
    updates.address_county = normalizeCounty(updates.address_county ?? "");

  const { data: employer, error } = await admin
    .from("employers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logAppEvent("employer_patch_failed", { id }, error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const next = employer as Employer;

  if (updates.status !== undefined && updates.status !== prev.status) {
    await insertActivity(admin, id, userId, "status_change", {
      from: prev.status,
      to: next.status,
    });
  }

  const tracked = [
    "internal_notes",
    "next_follow_up_date",
    "assigned_staff_id",
    "company_name",
    "contact_name",
    "contact_email",
  ] as const;
  for (const field of tracked) {
    if (updates[field] !== undefined) {
      const oldVal = prev[field as keyof Employer];
      const newVal = next[field as keyof Employer];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        await insertActivity(admin, id, userId, "field_update", {
          field,
          from: oldVal,
          to: newVal,
        });
      }
    }
  }

  return NextResponse.json({ employer: next });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const { admin, profile } = ctx;
  const role = profile.role as AppRole;

  if (!canDeleteEmployers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("employers").delete().eq("id", id);

  if (error) {
    logAppEvent("employer_delete_failed", { id }, error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
