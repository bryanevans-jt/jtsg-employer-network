"use client";

import type { Employer } from "@/types/database";
import { statusBadgeClass } from "@/lib/employer-status";

interface EmployerRowProps {
  employer: Employer;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onUpdate: () => void;
}

export function EmployerRow({
  employer,
  canEdit: _canEdit,
  canDelete: _canDelete,
  onView,
  onUpdate: _onUpdate,
}: EmployerRowProps) {
  return (
    <tr className="transition-colors hover:bg-stone-50/80">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onView}
          className="text-left font-medium text-jtsg-green underline decoration-jtsg-green/30 underline-offset-2 hover:decoration-jtsg-green"
        >
          {employer.company_name}
        </button>
      </td>
      <td className="px-4 py-3 text-sm text-stone-600 hidden sm:table-cell">
        {employer.address_city}
      </td>
      <td className="px-4 py-3 text-sm text-stone-600 hidden md:table-cell">
        {employer.address_county}
      </td>
      <td className="px-4 py-3 text-sm text-stone-600 hidden lg:table-cell">
        {employer.industry}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(employer.status)}`}
        >
          {employer.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-stone-600 hidden xl:table-cell whitespace-nowrap">
        {new Date(employer.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onView}
          className="text-sm font-medium text-jtsg-green underline decoration-jtsg-green/30 underline-offset-2 hover:decoration-jtsg-green"
        >
          View
        </button>
      </td>
    </tr>
  );
}
