import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  canViewAllEmployers,
  canViewActiveOnly,
} from "@/lib/auth";
import type { Employer, AppRole } from "@/types/database";

export async function GET(request: NextRequest) {
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

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = profile.role as AppRole;
  const sort = request.nextUrl.searchParams.get("sort") || "created_at";
  const order = request.nextUrl.searchParams.get("order") || "desc";
  const validSort =
    ["company_name", "address_city", "address_county", "industry", "created_at"].includes(sort)
      ? sort
      : "created_at";
  const validOrder = order === "asc" ? "asc" : "desc";

  let query = admin.from("employers").select("*");

  if (canViewActiveOnly(role)) {
    query = query.eq("status", "Active Partner");
  }

  // CRS: New Submissions first (newest at top), then Active Partners by chosen sort
  if (role === "crs") {
    const { data: all, error: err } = await query;
    if (err) {
      console.error("Employers list error:", err);
      return NextResponse.json({ error: "Failed to load employers" }, { status: 500 });
    }
    const list = (all as Employer[]) ?? [];
    const newSub = list
      .filter((e) => e.status === "New Submission")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const active = list
      .filter((e) => e.status === "Active Partner")
      .sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[validSort];
        const bv = (b as unknown as Record<string, unknown>)[validSort];
        if (av == null && bv == null) return 0;
        if (av == null) return validOrder === "asc" ? 1 : -1;
        if (bv == null) return validOrder === "asc" ? -1 : 1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return validOrder === "asc" ? cmp : -cmp;
      });
    const employers = [...newSub, ...active];
    return NextResponse.json({
      employers,
      canViewAll: true,
      role,
      sort: validSort,
      order: validOrder,
    });
  }

  const { data, error } = await query.order(validSort, {
    ascending: validOrder === "asc",
  });

  if (error) {
    console.error("Employers list error:", error);
    return NextResponse.json({ error: "Failed to load employers" }, { status: 500 });
  }

  const employers = (data as Employer[]) ?? [];
  const canViewAll = canViewAllEmployers(role);

  return NextResponse.json({
    employers,
    canViewAll,
    role,
    sort: validSort,
    order: validOrder,
  });
}
