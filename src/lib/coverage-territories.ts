import type { SupabaseClient } from "@supabase/supabase-js";
import { logAppEvent } from "@/lib/observability";

/** Normalize employer `address_county` for lookup (lowercase, trim, drop trailing “County”). */
export function normalizeCountyKey(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/\s+county\s*$/i, "").trim();
  s = s.replace(/\s+/g, " ");
  return s;
}

async function allActiveCrsEmails(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "crs")
    .eq("is_active", true);
  return (data ?? []).map((r) => r.email as string).filter(Boolean);
}

export type CrsRoutingMode =
  | "territory_crs"
  | "fallback_all_crs"
  | "territory_no_crs"
  | "no_crs_in_system";

/**
 * Resolve which CRS inboxes should receive “new employer” mail for a county.
 * - If no territories exist yet → all active CRS (legacy behavior).
 * - If county is mapped to a territory → only CRS assignees on that territory (active + profile.role=crs).
 * - If county is unmapped → all active CRS, with a log line so admins can add the county.
 * - If mapped but no CRS assignees → empty list (do not blast all CRS).
 */
export async function resolveCrsEmailsForCounty(
  admin: SupabaseClient,
  addressCounty: string
): Promise<{ emails: string[]; mode: CrsRoutingMode }> {
  const countyKey = normalizeCountyKey(addressCounty);
  if (!countyKey) {
    const emails = await allActiveCrsEmails(admin);
    return {
      emails,
      mode: emails.length ? "fallback_all_crs" : "no_crs_in_system",
    };
  }

  const { count: territoryCount, error: countErr } = await admin
    .from("coverage_territories")
    .select("id", { count: "exact", head: true });

  if (countErr || !territoryCount) {
    const emails = await allActiveCrsEmails(admin);
    return {
      emails,
      mode: emails.length ? "fallback_all_crs" : "no_crs_in_system",
    };
  }

  const { data: countyRow } = await admin
    .from("coverage_territory_counties")
    .select("territory_id")
    .eq("county_key", countyKey)
    .maybeSingle();

  if (!countyRow?.territory_id) {
    logAppEvent("crs_email_county_unmapped", { countyKey });
    const emails = await allActiveCrsEmails(admin);
    return {
      emails,
      mode: emails.length ? "fallback_all_crs" : "no_crs_in_system",
    };
  }

  const { data: assigneeRows } = await admin
    .from("coverage_territory_assignees")
    .select("profile_id")
    .eq("territory_id", countyRow.territory_id)
    .eq("assignee_role", "crs");

  const ids = (assigneeRows ?? []).map((r) => r.profile_id as string);
  if (ids.length === 0) {
    return { emails: [], mode: "territory_no_crs" };
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("email, role, is_active")
    .in("id", ids)
    .eq("role", "crs")
    .eq("is_active", true);

  const emails = (profiles ?? []).map((p) => p.email as string).filter(Boolean);
  if (!emails.length) {
    return { emails: [], mode: "territory_no_crs" };
  }
  return { emails, mode: "territory_crs" };
}
