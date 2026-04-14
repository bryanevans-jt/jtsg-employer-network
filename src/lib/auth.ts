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

  const p = profile as Profile | null;
  if (p && p.is_active === false) {
    return null;
  }
  return p;
}

// Re-export permission helpers for server-side use (API routes, server components)
export {
  canViewAllEmployers,
  canViewFullEmployerPipeline,
  canViewActiveOnly,
  canEditEmployers,
  canDeleteEmployers,
  canManageUsers,
  canViewEmployerAnalytics,
} from "@/lib/permissions";
