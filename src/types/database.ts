export type EmployerStatus = "New Submission" | "Active Partner";

export type AppRole =
  | "admin"
  | "director"
  | "supervisor"
  | "employment_specialist"
  | "crs";

export interface Employer {
  id: string;
  created_at: string;
  updated_at: string;
  status: EmployerStatus;
  company_name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_county: string;
  phone: string | null;
  website: string | null;
  industry: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string;
  contact_title: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface EmployerInsert {
  company_name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_county: string;
  phone?: string | null;
  website?: string | null;
  industry: string;
  contact_name: string;
  contact_phone?: string | null;
  contact_email: string;
  contact_title?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  director: "Director",
  supervisor: "Supervisor",
  employment_specialist: "Employment Specialist",
  crs: "Community Relations Specialist",
};
