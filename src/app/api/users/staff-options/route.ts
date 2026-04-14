import { NextResponse } from "next/server";
import { loadStaffContext } from "@/lib/api-guards";
import { canEditEmployers } from "@/lib/permissions";
import type { AppRole } from "@/types/database";

/** Active staff for employer assignment dropdown (editors only). */
export async function GET() {
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const role = ctx.profile.role as AppRole;
  if (!canEditEmployers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await ctx.admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load staff" }, { status: 500 });
  }

  return NextResponse.json({ staff: data ?? [] });
}
