import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole, Profile } from "@/types/database";

export type StaffProfile = Pick<Profile, "id" | "email" | "role" | "is_active">;

export async function loadStaffContext(): Promise<
  | { ok: true; userId: string; admin: ReturnType<typeof createAdminClient>; profile: StaffProfile }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, role, is_active")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const p = profile as StaffProfile;
  if (p.is_active === false) {
    return { ok: false, response: NextResponse.json({ error: "Account inactive" }, { status: 403 }) };
  }

  return { ok: true, userId: user.id, admin, profile: p };
}

export function isRole(ctx: StaffProfile, roles: AppRole[]): boolean {
  return roles.includes(ctx.role as AppRole);
}
