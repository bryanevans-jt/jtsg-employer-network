import type { AppRole } from "@/types/database";

/**
 * Pure permission helpers. Safe to import in client components.
 * Server-only auth (getProfile) lives in @/lib/auth.
 */
export function canViewAllEmployers(role: AppRole): boolean {
  return ["admin", "director", "crs"].includes(role);
}

export function canViewActiveOnly(role: AppRole): boolean {
  return ["supervisor", "employment_specialist"].includes(role);
}

export function canEditEmployers(role: AppRole): boolean {
  return ["admin", "director", "crs"].includes(role);
}

export function canDeleteEmployers(role: AppRole): boolean {
  return ["admin", "director"].includes(role);
}

export function canManageUsers(role: AppRole): boolean {
  return role === "admin";
}
