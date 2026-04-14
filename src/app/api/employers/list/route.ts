import { NextRequest, NextResponse } from "next/server";
import type { Employer, AppRole } from "@/types/database";
import { loadStaffContext } from "@/lib/api-guards";
import { canViewActiveOnly, canViewFullEmployerPipeline } from "@/lib/permissions";
import {
  applyEmployerListFilters,
  parseStatusParams,
} from "@/lib/employers-list-query";
import { logAppEvent } from "@/lib/observability";
import { parseEmployerListSort } from "@/lib/employers-sort-fields";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const { admin, profile } = ctx;
  const role = profile.role as AppRole;
  const sp = request.nextUrl.searchParams;

  const sort = parseEmployerListSort(sp.get("sort"));
  const order = sp.get("order") === "asc" ? "asc" : "desc";

  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      parseInt(sp.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
    )
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const applied = applyEmployerListFilters(admin, role, {
    q: sp.get("q") || undefined,
    city: sp.get("city") || undefined,
    county: sp.get("county") || undefined,
    industry: sp.get("industry") || undefined,
    dateFrom: sp.get("dateFrom") || undefined,
    dateTo: sp.get("dateTo") || undefined,
    statuses: parseStatusParams(sp),
  });

  if (applied.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = applied.query.order(sort, { ascending: order === "asc" });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    logAppEvent("employers_list_failed", { page, pageSize }, error);
    return NextResponse.json({ error: "Failed to load employers" }, { status: 500 });
  }

  const employers = (data as Employer[]) ?? [];
  const canViewAll = canViewFullEmployerPipeline(role) && !canViewActiveOnly(role);

  return NextResponse.json({
    employers,
    total: count ?? employers.length,
    page,
    pageSize,
    canViewAll,
    role,
    sort,
    order,
  });
}
