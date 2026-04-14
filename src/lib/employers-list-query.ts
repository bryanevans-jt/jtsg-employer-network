import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/database";
import { canViewActiveOnly, canViewFullEmployerPipeline } from "@/lib/permissions";
import { EMPLOYER_STATUSES } from "@/lib/employer-status";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Postgrest chain after `.select()` — widened so `.order()` / `.range()` type-check. */
type AnyEmployerQuery = any;

export type EmployerListFilters = {
  q?: string;
  city?: string;
  county?: string;
  industry?: string;
  dateFrom?: string;
  dateTo?: string;
  statuses?: string[] | null;
};

export function applyEmployerListFilters(
  admin: AdminClient,
  role: AppRole,
  filters: EmployerListFilters
): { forbidden: true } | { forbidden: false; query: AnyEmployerQuery } {
  let query = admin.from("employers").select("*", { count: "exact" });

  if (canViewActiveOnly(role)) {
    query = query.eq("status", "Active Partner");
  } else if (!canViewFullEmployerPipeline(role)) {
    return { forbidden: true };
  }

  const search = filters.q?.trim();
  if (search) {
    const safe = search.replace(/,/g, " ").slice(0, 120);
    const p = `%${safe}%`;
    query = query.or(
      `company_name.ilike.${p},contact_email.ilike.${p},contact_name.ilike.${p}`
    );
  }
  if (filters.city?.trim()) {
    query = query.ilike("address_city", `%${filters.city.trim()}%`);
  }
  if (filters.county?.trim()) {
    query = query.ilike("address_county", `%${filters.county.trim()}%`);
  }
  if (filters.industry?.trim()) {
    query = query.ilike("industry", `%${filters.industry.trim()}%`);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }
  if (filters.statuses && filters.statuses.length > 0) {
    const valid = filters.statuses.filter((s) =>
      (EMPLOYER_STATUSES as readonly string[]).includes(s)
    );
    if (valid.length > 0) {
      query = query.in("status", valid);
    }
  }

  return { forbidden: false, query };
}

export function parseStatusParams(searchParams: URLSearchParams): string[] | null {
  const raw = searchParams.getAll("status");
  if (raw.length === 0) return null;
  const set = new Set<string>();
  for (const s of raw) {
    for (const part of s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)) {
      if ((EMPLOYER_STATUSES as readonly string[]).includes(part)) set.add(part);
    }
  }
  return Array.from(set);
}
