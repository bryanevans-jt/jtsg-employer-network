"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Employer, AppRole } from "@/types/database";
import { canEditEmployers } from "@/lib/permissions";
import { EmployerTable } from "./EmployerTable";
import { EmployerMap } from "./EmployerMap";
import { EMPLOYER_STATUSES, EMPLOYER_STATUS_LABELS } from "@/lib/employer-status";
import type { EmployerListSortField } from "@/lib/employers-sort-fields";
import {
  inputClass,
  labelClass,
  btnPrimarySmClass,
  btnSecondarySmClass,
} from "@/lib/ui";

const SORT_STORAGE_KEY = "jtsg-employers-sort-v1";
const PAGE_SIZE = 25;

interface EmployersViewProps {
  role: AppRole;
}

type Filters = {
  q: string;
  city: string;
  county: string;
  industry: string;
  dateFrom: string;
  dateTo: string;
  statuses: string[];
};

const EMPTY_FILTERS: Filters = {
  q: "",
  city: "",
  county: "",
  industry: "",
  dateFrom: "",
  dateTo: "",
  statuses: [],
};

function readStoredSort(): { sort: EmployerListSortField; order: "asc" | "desc" } {
  if (typeof window === "undefined") return { sort: "created_at", order: "desc" };
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return { sort: "created_at", order: "desc" };
    const j = JSON.parse(raw) as { sort?: EmployerListSortField; order?: string };
    return {
      sort: j.sort ?? "created_at",
      order: j.order === "asc" ? "asc" : "desc",
    };
  } catch {
    return { sort: "created_at", order: "desc" };
  }
}

function buildListQuery(
  page: number,
  sort: EmployerListSortField,
  order: "asc" | "desc",
  filters: Filters
) {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("pageSize", String(PAGE_SIZE));
  p.set("sort", sort);
  p.set("order", order);
  if (filters.q.trim()) p.set("q", filters.q.trim());
  if (filters.city.trim()) p.set("city", filters.city.trim());
  if (filters.county.trim()) p.set("county", filters.county.trim());
  if (filters.industry.trim()) p.set("industry", filters.industry.trim());
  if (filters.dateFrom) p.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) p.set("dateTo", filters.dateTo);
  for (const s of filters.statuses) p.append("status", s);
  return p.toString();
}

function buildExportQuery(sort: EmployerListSortField, order: "asc" | "desc", filters: Filters) {
  const p = new URLSearchParams();
  p.set("sort", sort);
  p.set("order", order);
  if (filters.q.trim()) p.set("q", filters.q.trim());
  if (filters.city.trim()) p.set("city", filters.city.trim());
  if (filters.county.trim()) p.set("county", filters.county.trim());
  if (filters.industry.trim()) p.set("industry", filters.industry.trim());
  if (filters.dateFrom) p.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) p.set("dateTo", filters.dateTo);
  for (const s of filters.statuses) p.append("status", s);
  return p.toString();
}

export function EmployersView({ role }: EmployersViewProps) {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<EmployerListSortField>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [showMap, setShowMap] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [debouncedFilters, setDebouncedFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const s = readStoredSort();
    setSort(s.sort);
    setOrder(s.order);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ sort, order }));
    } catch {
      /* ignore */
    }
  }, [sort, order]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(appliedFilters), 250);
    return () => clearTimeout(t);
  }, [appliedFilters]);

  const fetchEmployers = useCallback(async () => {
    setLoading(true);
    const qs = buildListQuery(page, sort, order, debouncedFilters);
    const res = await fetch(`/api/employers/list?${qs}`);
    if (!res.ok) {
      setEmployers([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEmployers(data.employers ?? []);
    setTotal(typeof data.total === "number" ? data.total : 0);
    setCanViewAll(data.canViewAll ?? false);
    setLoading(false);
  }, [page, sort, order, debouncedFilters]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleStatusFilter = (status: string) => {
    setAppliedFilters((f) => {
      const statuses = f.statuses.includes(status)
        ? f.statuses.filter((s) => s !== status)
        : [...f.statuses, status];
      return { ...f, statuses };
    });
    setDraftFilters((d) => {
      const statuses = d.statuses.includes(status)
        ? d.statuses.filter((s) => s !== status)
        : [...d.statuses, status];
      return { ...d, statuses };
    });
    setPage(1);
  };

  const applyDraftFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const qs = buildExportQuery(sort, order, appliedFilters);
      const res = await fetch(`/api/employers/export?${qs}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const onSortChange = (field: EmployerListSortField) => {
    if (field === sort) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder(field === "company_name" || field === "address_city" ? "asc" : "desc");
    }
    setPage(1);
  };

  const mapEmployers = useMemo(() => employers, [employers]);

  if (loading && employers.length === 0) {
    return (
      <div className="mt-6 flex items-center justify-center py-12 text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={btnSecondarySmClass}
        >
          {filtersOpen ? "Hide filters" : "Show filters"}
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting || total === 0}
          className={btnSecondarySmClass}
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className={btnSecondarySmClass}
        >
          {showMap ? "Hide map" : "Show map"}
        </button>
        <span className="text-sm text-stone-500 ml-auto">
          {total} employer{total !== 1 ? "s" : ""}
          {canViewAll ? "" : " (active partners)"}
        </span>
      </div>

      {filtersOpen && (
        <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-md sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Search
              <input
                value={draftFilters.q}
                onChange={(e) => setDraftFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="Company, contact name, or email"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              City
              <input
                value={draftFilters.city}
                onChange={(e) => setDraftFilters((f) => ({ ...f, city: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              County
              <input
                value={draftFilters.county}
                onChange={(e) => setDraftFilters((f) => ({ ...f, county: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Industry
              <input
                value={draftFilters.industry}
                onChange={(e) => setDraftFilters((f) => ({ ...f, industry: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Submitted from
              <input
                type="date"
                value={draftFilters.dateFrom}
                onChange={(e) => setDraftFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Submitted to
              <input
                type="date"
                value={draftFilters.dateTo}
                onChange={(e) => setDraftFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>
          {canViewAll && (
            <div>
              <p className={`${labelClass} mb-2`}>Status</p>
              <div className="flex flex-wrap gap-2">
                {EMPLOYER_STATUSES.map((s) => (
                  <label
                    key={s}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={draftFilters.statuses.includes(s)}
                      onChange={() => toggleStatusFilter(s)}
                      className="h-4 w-4 rounded border-stone-300 text-jtsg-green focus:ring-jtsg-green"
                    />
                    {EMPLOYER_STATUS_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyDraftFilters}
              className={btnPrimarySmClass}
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className={btnSecondarySmClass}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {showMap && (
        <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-stone-200/90 shadow-md">
          <EmployerMap
            employers={mapEmployers}
            canGeocode={canEditEmployers(role)}
            onGeocoded={fetchEmployers}
          />
        </div>
      )}

      <EmployerTable
        employers={employers}
        role={role}
        sortField={sort}
        sortOrder={order}
        onSortChange={onSortChange}
        onUpdate={fetchEmployers}
      />

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`${btnSecondarySmClass} px-3 py-1.5 text-sm disabled:opacity-40`}
          >
            Previous
          </button>
          <span className="text-sm text-stone-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`${btnSecondarySmClass} px-3 py-1.5 text-sm disabled:opacity-40`}
          >
            Next
          </button>
        </div>
      )}

      {employers.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 py-8 text-center">
          <p className="text-stone-500">No employers match your filters.</p>
          <button type="button" onClick={clearFilters} className={`${btnSecondarySmClass} mt-3`}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
