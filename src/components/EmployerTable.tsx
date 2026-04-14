"use client";

import { useState } from "react";
import type { Employer, AppRole } from "@/types/database";
import {
  canEditEmployers,
  canDeleteEmployers,
} from "@/lib/permissions";
import type { EmployerListSortField } from "@/lib/employers-sort-fields";
import { EmployerRow } from "./EmployerRow";
import { EmployerDetailModal } from "./EmployerDetailModal";

interface EmployerTableProps {
  employers: Employer[];
  role: AppRole;
  sortField: EmployerListSortField;
  sortOrder: "asc" | "desc";
  onSortChange: (field: EmployerListSortField) => void;
  onUpdate: () => void;
}

const COLS: { field: EmployerListSortField; label: string; className?: string }[] = [
  { field: "company_name", label: "Company" },
  { field: "address_city", label: "City", className: "hidden sm:table-cell" },
  { field: "address_county", label: "County", className: "hidden md:table-cell" },
  { field: "industry", label: "Industry", className: "hidden lg:table-cell" },
  { field: "status", label: "Status" },
  { field: "created_at", label: "Submitted", className: "hidden xl:table-cell" },
];

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: "asc" | "desc";
}) {
  if (!active) return <span className="text-stone-300 ml-0.5">↕</span>;
  return <span className="ml-0.5">{order === "asc" ? "↑" : "↓"}</span>;
}

export function EmployerTable({
  employers,
  role,
  sortField,
  sortOrder,
  onSortChange,
  onUpdate,
}: EmployerTableProps) {
  const [selected, setSelected] = useState<Employer | null>(null);
  const canEdit = canEditEmployers(role);
  const canDelete = canDeleteEmployers(role);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-md">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-jtsg-sage/10">
            <tr>
              {COLS.map((col) => (
                <th
                  key={col.field}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider ${col.className ?? ""}`}
                >
                  <button
                    type="button"
                    onClick={() => onSortChange(col.field)}
                    className="inline-flex items-center font-medium text-stone-600 hover:text-jtsg-green focus:outline-none focus-visible:ring-2 focus-visible:ring-jtsg-green/40 rounded"
                  >
                    {col.label}
                    <SortIcon active={sortField === col.field} order={sortOrder} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-stone-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {employers.map((employer) => (
              <EmployerRow
                key={employer.id}
                employer={employer}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={() => setSelected(employer)}
                onUpdate={onUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <EmployerDetailModal
          employer={selected}
          role={role}
          onClose={() => setSelected(null)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
