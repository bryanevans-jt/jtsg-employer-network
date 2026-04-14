import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";

function migrationError(error: { code?: string; message?: string } | null): string | null {
  if (!error) return null;
  if (error.code === "42P01" || /coverage_territories/i.test(error.message ?? "")) {
    return "Coverage territories tables are missing. Run Supabase migration 003_coverage_territories.sql first.";
  }
  return null;
}

/** GET — list territories with counties and assignees (admin). */
export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  const { data: territories, error: tErr } = await admin
    .from("coverage_territories")
    .select("id, name, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (tErr) {
    const mig = migrationError(tErr);
    if (mig) {
      return NextResponse.json({ error: mig }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to load territories" }, { status: 500 });
  }

  const tList = territories ?? [];
  if (tList.length === 0) {
    return NextResponse.json({ territories: [] });
  }

  const ids = tList.map((t) => t.id as string);

  const { data: counties } = await admin
    .from("coverage_territory_counties")
    .select("territory_id, county_key")
    .in("territory_id", ids);

  const { data: assignees } = await admin
    .from("coverage_territory_assignees")
    .select("id, territory_id, profile_id, assignee_role")
    .in("territory_id", ids);

  const profileIds = Array.from(
    new Set((assignees ?? []).map((a) => a.profile_id as string))
  );
  let profileMap = new Map<string, { email: string; full_name: string | null; role: string }>();
  if (profileIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name, role")
      .in("id", profileIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id as string, {
        email: p.email as string,
        full_name: p.full_name as string | null,
        role: p.role as string,
      });
    }
  }

  const merged = tList.map((t) => {
    const tid = t.id as string;
    return {
      id: tid,
      name: t.name,
      sort_order: t.sort_order,
      created_at: t.created_at,
      counties: (counties ?? [])
        .filter((c) => c.territory_id === tid)
        .map((c) => c.county_key as string),
      assignees: (assignees ?? [])
        .filter((a) => a.territory_id === tid)
        .map((a) => {
          const prof = profileMap.get(a.profile_id as string);
          return {
            id: a.id as string,
            profile_id: a.profile_id as string,
            assignee_role: a.assignee_role as "crs" | "supervisor",
            email: prof?.email ?? "",
            full_name: prof?.full_name ?? null,
            profile_role: prof?.role ?? "",
          };
        }),
    };
  });

  return NextResponse.json({ territories: merged });
}

/** POST — create territory (admin). */
export async function POST(request: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const { data: row, error } = await admin
    .from("coverage_territories")
    .insert({ name, sort_order: Number(body.sort_order) || 0 })
    .select("id, name, sort_order, created_at")
    .single();

  if (error) {
    const mig = migrationError(error);
    if (mig) {
      return NextResponse.json({ error: mig }, { status: 500 });
    }
    return NextResponse.json({ error: "Could not create territory." }, { status: 500 });
  }

  return NextResponse.json({
    territory: {
      ...row,
      counties: [] as string[],
      assignees: [] as unknown[],
    },
  });
}
