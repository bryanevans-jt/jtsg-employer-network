import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code: Supabase may have sent the session in the URL hash (e.g. invite links).
  // The hash is only visible in the browser, so return HTML that redirects to our
  // client-side accept-invite page while preserving the hash. That way existing
  // invite emails that point to /auth/callback still work.
  const acceptInviteUrl = `${origin}/auth/accept-invite?next=${encodeURIComponent(next)}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting…</title></head><body><p>Setting up…</p><script>window.location.replace(${JSON.stringify(acceptInviteUrl)} + (window.location.hash || ""));</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
