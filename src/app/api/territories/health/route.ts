import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  const today = new Date();
  const dayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [territoryCountRes, countyCountRes, assigneeCountRes, territoriesRes, assigneesRes, unmappedLogRes, sentTodayRes] =
    await Promise.all([
      admin.from("coverage_territories").select("id", { count: "exact", head: true }),
      admin.from("coverage_territory_counties").select("county_key", { count: "exact", head: true }),
      admin
        .from("coverage_territory_assignees")
        .select("id", { count: "exact", head: true })
        .eq("assignee_role", "crs"),
      admin.from("coverage_territories").select("id"),
      admin.from("coverage_territory_assignees").select("territory_id, assignee_role").eq("assignee_role", "crs"),
      admin
        .from("email_delivery_log")
        .select("id", { count: "exact", head: true })
        .eq("category", "crs_new_signup")
        .eq("status", "skipped")
        .contains("details", { reason: "county_unmapped" }),
      admin
        .from("email_delivery_log")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lt("created_at", dayEnd.toISOString()),
    ]);

  if (territoryCountRes.error || countyCountRes.error || assigneeCountRes.error) {
    return NextResponse.json(
      { error: "Health metrics unavailable. Ensure migrations 003 and 004 are applied." },
      { status: 500 }
    );
  }

  const withCrs = new Set((assigneesRes.data ?? []).map((r) => r.territory_id as string));
  const noCrsCount = (territoriesRes.data ?? []).filter((row) => !withCrs.has(row.id as string)).length;

  return NextResponse.json({
    health: {
      territories: territoryCountRes.count ?? 0,
      mappedCounties: countyCountRes.count ?? 0,
      crsAssignments: assigneeCountRes.count ?? 0,
      territoriesWithoutCrs: noCrsCount,
      unmappedCountyEvents: unmappedLogRes.count ?? 0,
      emailEventsToday: sentTodayRes.count ?? 0,
    },
  });
}
