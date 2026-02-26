"use client";

import { useState } from "react";
import type { Employer, AppRole } from "@/types/database";
import {
  canEditEmployers,
  canDeleteEmployers,
} from "@/lib/permissions";
import { EmployerRow } from "./EmployerRow";
import { EmployerDetailModal } from "./EmployerDetailModal";

interface EmployerTableProps {
  employers: Employer[];
  role: AppRole;
  onUpdate: () => void;
}

export function EmployerTable({
  employers,
  role,
  onUpdate,
}: EmployerTableProps) {
  const [selected, setSelected] = useState<Employer | null>(null);
  const canEdit = canEditEmployers(role);
  const canDelete = canDeleteEmployers(role);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider hidden sm:table-cell">
                City
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider hidden md:table-cell">
                County
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider hidden lg:table-cell">
                Industry
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase tracking-wider">
                Status
              </th>
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
