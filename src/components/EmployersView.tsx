"use client";

import { useState, useEffect } from "react";
import type { Employer, AppRole } from "@/types/database";
import { EmployerTable } from "./EmployerTable";
import { EmployerMap } from "./EmployerMap";

interface EmployersViewProps {
  role: AppRole;
}

type SortField = "company_name" | "address_city" | "address_county" | "industry" | "created_at";

export function EmployersView({ role }: EmployersViewProps) {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortField>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [showMap, setShowMap] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);

  const fetchEmployers = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/employers/list?sort=${sort}&order=${order}`
    );
    if (!res.ok) {
      setEmployers([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setEmployers(data.employers ?? []);
    setCanViewAll(data.canViewAll ?? false);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployers();
  }, [sort, order]);

  const isCRS = role === "crs";
  const newSubmissions = isCRS
    ? employers.filter((e) => e.status === "New Submission")
    : [];
  const activePartners = employers.filter((e) => e.status === "Active Partner");
  const theRest = isCRS
    ? employers.filter((e) => e.status !== "New Submission" && e.status !== "Active Partner")
    : [];

  const onEmployerUpdated = () => {
    fetchEmployers();
  };

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center py-12 text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={`${sort}-${order}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split("-") as [SortField, "asc" | "desc"];
            setSort(s);
            setOrder(o);
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-jtsg-green focus:outline-none focus:ring-1 focus:ring-jtsg-green"
        >
          <option value="company_name-asc">Name (A–Z)</option>
          <option value="company_name-desc">Name (Z–A)</option>
          <option value="address_city-asc">City (A–Z)</option>
          <option value="address_city-desc">City (Z–A)</option>
          <option value="address_county-asc">County (A–Z)</option>
          <option value="address_county-desc">County (Z–A)</option>
          <option value="industry-asc">Industry (A–Z)</option>
          <option value="industry-desc">Industry (Z–A)</option>
          <option value="created_at-desc">Newest first</option>
          <option value="created_at-asc">Oldest first</option>
        </select>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          {showMap ? "Hide map" : "Show map"}
        </button>
      </div>

      {showMap && (
        <div className="h-[400px] w-full rounded-xl border border-stone-200 overflow-hidden">
          <EmployerMap employers={employers} onGeocoded={onEmployerUpdated} />
        </div>
      )}

      {isCRS && newSubmissions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            New submissions (newest first)
          </h2>
          <EmployerTable
            employers={newSubmissions}
            role={role}
            onUpdate={onEmployerUpdated}
          />
        </section>
      )}

      {activePartners.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Active partners
          </h2>
          <EmployerTable
            employers={activePartners}
            role={role}
            onUpdate={onEmployerUpdated}
          />
        </section>
      )}

      {isCRS && theRest.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Other
          </h2>
          <EmployerTable
            employers={theRest}
            role={role}
            onUpdate={onEmployerUpdated}
          />
        </section>
      )}

      {employers.length === 0 && (
        <p className="text-stone-500 py-8">No employers to display.</p>
      )}
    </div>
  );
}
