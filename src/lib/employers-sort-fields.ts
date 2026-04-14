export const EMPLOYER_LIST_SORT_FIELDS = [
  "company_name",
  "address_city",
  "address_county",
  "industry",
  "created_at",
  "updated_at",
  "status",
  "next_follow_up_date",
] as const;

export type EmployerListSortField = (typeof EMPLOYER_LIST_SORT_FIELDS)[number];

export function parseEmployerListSort(value: string | null): EmployerListSortField {
  return EMPLOYER_LIST_SORT_FIELDS.includes(value as EmployerListSortField)
    ? (value as EmployerListSortField)
    : "created_at";
}
