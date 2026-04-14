import type { EmployerStatus } from "@/lib/employer-status";

export type { EmployerStatus };

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
  internal_notes: string | null;
  next_follow_up_date: string | null;
  assigned_staff_id: string | null;
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

export interface EmployerActivity {
  id: string;
  employer_id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}


export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
  /** When false, dashboard access is blocked (see migration + getProfile). */
  is_active?: boolean;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  director: "Director",
  supervisor: "Supervisor",
  employment_specialist: "Employment Specialist",
  crs: "Community Relations Specialist",
};
