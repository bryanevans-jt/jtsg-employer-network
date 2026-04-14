import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { normalizeCountyKey } from "@/lib/coverage-territories";

type AssigneeRole = "crs" | "supervisor";

function migrationError(error: { code?: string; message?: string } | null): string | null {
  if (!error) return null;
  if (error.code === "42P01" || /coverage_territories/i.test(error.message ?? "")) {
    return "Coverage territories tables are missing. Run Supabase migration 003_coverage_territories.sql first.";
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;
  const { id: territoryId } = await params;

  const { data: existing } = await admin
    .from("coverage_territories")
    .select("id")
    .eq("id", territoryId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Territory not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    const { error } = await admin.from("coverage_territories").update({ name }).eq("id", territoryId);
    if (error) {
      const mig = migrationError(error);
      if (mig) return NextResponse.json({ error: mig }, { status: 500 });
      return NextResponse.json({ error: "Could not update territory." }, { status: 500 });
    }
  }

  if (body.sort_order !== undefined) {
    const n = Number(body.sort_order);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "Invalid sort_order." }, { status: 400 });
    }
    const { error } = await admin
      .from("coverage_territories")
      .update({ sort_order: Math.round(n) })
      .eq("id", territoryId);
    if (error) {
      const mig = migrationError(error);
      if (mig) return NextResponse.json({ error: mig }, { status: 500 });
      return NextResponse.json({ error: "Could not update territory." }, { status: 500 });
    }
  }

  if (Array.isArray(body.counties)) {
    const keys = Array.from(
      new Set(
        (body.counties as unknown[])
          .map((c) => (typeof c === "string" ? normalizeCountyKey(c) : ""))
          .filter(Boolean)
      )
    );

    const { error: delErr } = await admin
      .from("coverage_territory_counties")
      .delete()
      .eq("territory_id", territoryId);
    if (delErr) {
      const mig = migrationError(delErr);
      if (mig) return NextResponse.json({ error: mig }, { status: 500 });
      return NextResponse.json({ error: "Could not update counties." }, { status: 500 });
    }

    if (keys.length) {
      const rows = keys.map((county_key) => ({ territory_id: territoryId, county_key }));
      const { error: insErr } = await admin.from("coverage_territory_counties").insert(rows);
      if (insErr) {
        const msg =
          insErr.code === "23505"
            ? "A county is already assigned to another territory. Remove it there first."
            : "Could not save counties.";
        return NextResponse.json({ error: msg }, { status: insErr.code === "23505" ? 409 : 500 });
      }
    }
  }

  if (Array.isArray(body.assignees)) {
    const raw = body.assignees as { profile_id?: string; assignee_role?: string }[];
    const pairs: { profile_id: string; assignee_role: AssigneeRole }[] = [];
    for (const row of raw) {
      if (typeof row.profile_id !== "string" || !row.profile_id) continue;
      const ar = row.assignee_role;
      if (ar !== "crs" && ar !== "supervisor") {
        return NextResponse.json({ error: "Invalid assignee_role." }, { status: 400 });
      }
      pairs.push({ profile_id: row.profile_id, assignee_role: ar });
    }

    const profileIds = Array.from(new Set(pairs.map((p) => p.profile_id)));
    if (profileIds.length) {
      const { data: profiles, error: pErr } = await admin
        .from("profiles")
        .select("id, role, is_active")
        .in("id", profileIds);
      if (pErr || !profiles?.length) {
        return NextResponse.json({ error: "Could not validate staff." }, { status: 400 });
      }
      const byId = new Map(profiles.map((p) => [p.id as string, p]));
      for (const p of pairs) {
        const prof = byId.get(p.profile_id);
        if (!prof || prof.is_active === false) {
          return NextResponse.json(
            { error: "Each assignee must be an active staff profile." },
            { status: 400 }
          );
        }
        if ((prof.role as string) !== p.assignee_role) {
          return NextResponse.json(
            {
              error: `Profile role must match assignment (${p.assignee_role}): check ${p.profile_id}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const { error: delA } = await admin
      .from("coverage_territory_assignees")
      .delete()
      .eq("territory_id", territoryId);
    if (delA) {
      const mig = migrationError(delA);
      if (mig) return NextResponse.json({ error: mig }, { status: 500 });
      return NextResponse.json({ error: "Could not update assignees." }, { status: 500 });
    }

    if (pairs.length) {
      const rows = pairs.map((p) => ({
        territory_id: territoryId,
        profile_id: p.profile_id,
        assignee_role: p.assignee_role,
      }));
      const { error: insA } = await admin.from("coverage_territory_assignees").insert(rows);
      if (insA) {
        return NextResponse.json({ error: "Could not save assignees." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;
  const { id: territoryId } = await params;

  const { error } = await admin.from("coverage_territories").delete().eq("id", territoryId);
  if (error) {
    const mig = migrationError(error);
    if (mig) return NextResponse.json({ error: mig }, { status: 500 });
    return NextResponse.json({ error: "Could not delete territory." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
