import { NextRequest, NextResponse } from "next/server";
import { loadStaffContext } from "@/lib/api-guards";
import { canManageUsers } from "@/lib/auth";
import { sendStaffRecoveryEmail } from "@/lib/email";
import type { AppRole } from "@/types/database";
import { logAppEvent } from "@/lib/observability";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const role = ctx.profile.role as AppRole;
  if (!canManageUsers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { admin } = ctx;
  const { data: target, error: fetchErr } = await admin
    .from("profiles")
    .select("email")
    .eq("id", id)
    .single();

  if (fetchErr || !target?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const baseUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    request.nextUrl.origin;
  const redirectTo = `${String(baseUrl).replace(/\/$/, "")}/reset-password`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: target.email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    logAppEvent("resend_invite_link_failed", { userId: id }, linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "Could not generate sign-in link." },
      { status: 500 }
    );
  }

  const actionLink = linkData.properties.action_link;
  const emailed = await sendStaffRecoveryEmail({
    to: target.email,
    actionLink,
  });

  return NextResponse.json({
    ok: true,
    emailed: emailed.sent,
    message: emailed.sent
      ? "Sign-in link emailed."
      : "Link generated but email was not sent (configure RESEND_API_KEY or use Supabase Auth tools).",
  });
}
