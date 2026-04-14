export const EMPLOYER_STATUSES = [
  "New Submission",
  "Active Partner",
  "Not a fit",
  "On hold",
  "Inactive",
] as const;

export type EmployerStatus = (typeof EMPLOYER_STATUSES)[number];

export function isEmployerStatus(value: string): value is EmployerStatus {
  return (EMPLOYER_STATUSES as readonly string[]).includes(value);
}

export const EMPLOYER_STATUS_LABELS: Record<EmployerStatus, string> = {
  "New Submission": "New submission",
  "Active Partner": "Active partner",
  "Not a fit": "Not a fit",
  "On hold": "On hold",
  Inactive: "Inactive",
};

export function statusBadgeClass(status: EmployerStatus): string {
  switch (status) {
    case "New Submission":
      return "bg-amber-100 text-amber-900";
    case "Active Partner":
      return "bg-emerald-100 text-emerald-900";
    case "Not a fit":
      return "bg-stone-200 text-stone-800";
    case "On hold":
      return "bg-sky-100 text-sky-900";
    case "Inactive":
      return "bg-stone-100 text-stone-600";
    default:
      return "bg-stone-100 text-stone-700";
  }
}
