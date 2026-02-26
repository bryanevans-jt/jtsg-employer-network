import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role key.
 * Use for admin operations, reading profiles, and bypassing RLS.
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase service role env");
  return createClient(url, key);
}
