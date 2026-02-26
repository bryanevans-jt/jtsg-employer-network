"use client";

import type { Employer } from "@/types/database";

interface EmployerRowProps {
  employer: Employer;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onUpdate: () => void;
}

export function EmployerRow({
  employer,
  canEdit,
  canDelete,
  onView,
  onUpdate,
}: EmployerRowProps) {
  return (
    <tr className="hover:bg-stone-50/50">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onView}
          className="text-left font-medium text-jtsg-green hover:underline"
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
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            employer.status === "New Submission"
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {employer.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={onView}
          className="text-sm text-jtsg-green hover:underline"
        >
          View
        </button>
      </td>
    </tr>
  );
}
