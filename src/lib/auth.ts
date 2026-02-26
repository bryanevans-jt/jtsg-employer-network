import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types/database";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

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
