import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

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

// Re-export permission helpers for server-side use (API routes, server components)
export {
  canViewAllEmployers,
  canViewActiveOnly,
  canEditEmployers,
  canDeleteEmployers,
  canManageUsers,
} from "@/lib/permissions";
