import type { AppRole } from "@/types/database";

/**
 * Pure permission helpers. Safe to import in client components.
 * Server-only auth (getProfile) lives in @/lib/auth.
 */
/** Full pipeline (all statuses): admin, director, CRS, and Employment Specialist (read-only directory). */
export function canViewFullEmployerPipeline(role: AppRole): boolean {
  return ["admin", "director", "crs", "employment_specialist"].includes(role);
}

/** @deprecated Use canViewFullEmployerPipeline */
export function canViewAllEmployers(role: AppRole): boolean {
  return ["admin", "director", "crs"].includes(role);
}

/** Active partners only (supervisor). */
export function canViewActiveOnly(role: AppRole): boolean {
  return role === "supervisor";
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

export function canViewEmployerAnalytics(role: AppRole): boolean {
  return role === "admin" || role === "director";
}
