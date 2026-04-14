import { NextResponse } from "next/server";
import { loadStaffContext } from "@/lib/api-guards";
import { canViewEmployerAnalytics } from "@/lib/permissions";
import type { AppRole, Employer } from "@/types/database";
import { logAppEvent } from "@/lib/observability";

const CAP = 8000;
const CACHE_TTL_MS = 120_000;
let cache:
  | {
      at: number;
      payload: {
        totalInSample: number;
        cappedAt: number;
        byStatus: Record<string, number>;
        byCounty: Record<string, number>;
        byIndustry: Record<string, number>;
        signupsByMonth: Record<string, number>;
      };
    }
  | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload, {
      headers: { "Cache-Control": "private, max-age=120" },
    });
  }

  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const role = ctx.profile.role as AppRole;
  if (!canViewEmployerAnalytics(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { admin } = ctx;
  const { data, error } = await admin
    .from("employers")
    .select("status, address_county, industry, created_at")
    .order("created_at", { ascending: false })
    .limit(CAP);

  if (error) {
    logAppEvent("employers_analytics_failed", {}, error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }

  const rows = (data as Pick<Employer, "status" | "address_county" | "industry" | "created_at">[]) ?? [];

  const byStatus: Record<string, number> = {};
  const byCounty: Record<string, number> = {};
  const byIndustry: Record<string, number> = {};
  const signupsByMonth: Record<string, number> = {};

  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const c = (r.address_county || "Unknown").trim() || "Unknown";
    byCounty[c] = (byCounty[c] ?? 0) + 1;
    const ind = (r.industry || "Unknown").trim() || "Unknown";
    byIndustry[ind] = (byIndustry[ind] ?? 0) + 1;
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    signupsByMonth[key] = (signupsByMonth[key] ?? 0) + 1;
  }

  const payload = {
    totalInSample: rows.length,
    cappedAt: CAP,
    byStatus,
    byCounty,
    byIndustry,
    signupsByMonth,
  };
  cache = { at: Date.now(), payload };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}
