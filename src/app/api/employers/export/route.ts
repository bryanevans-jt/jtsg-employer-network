import { NextRequest, NextResponse } from "next/server";
import type { AppRole, Employer } from "@/types/database";
import { loadStaffContext } from "@/lib/api-guards";
import {
  applyEmployerListFilters,
  parseStatusParams,
} from "@/lib/employers-list-query";
import { logAppEvent } from "@/lib/observability";
import { parseEmployerListSort } from "@/lib/employers-sort-fields";

const MAX_ROWS = 5000;

const CSV_COLS: (keyof Employer)[] = [
  "company_name",
  "status",
  "industry",
  "address_city",
  "address_county",
  "address_state",
  "contact_name",
  "contact_email",
  "contact_phone",
  "created_at",
  "next_follow_up_date",
];

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const { admin, profile } = ctx;
  const role = profile.role as AppRole;
  const sp = request.nextUrl.searchParams;

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

  const sort = parseEmployerListSort(sp.get("sort"));
  const order = sp.get("order") === "asc" ? "asc" : "desc";

  const { data, error } = await applied.query
    .order(sort, { ascending: order === "asc" })
    .range(0, MAX_ROWS - 1);

  if (error) {
    logAppEvent("employers_export_failed", {}, error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const rows = (data as Employer[]) ?? [];
  const header = CSV_COLS.join(",");
  const lines = rows.map((r) =>
    CSV_COLS.map((col) => csvEscape(r[col as keyof Employer] as string | null)).join(",")
  );
  const note =
    rows.length >= MAX_ROWS
      ? `\n# Note: export capped at ${MAX_ROWS} rows; narrow filters for a full extract.\n`
      : "";
  const csv = `${header}\n${lines.join("\n")}${note}`;

  const filename = `employers-export-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
