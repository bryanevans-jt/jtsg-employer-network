import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";

type DigestMode = "instant" | "hourly" | "daily";

function isDigestMode(value: string): value is DigestMode {
  return value === "instant" || value === "hourly" || value === "daily";
}

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  const { data, error } = await admin
    .from("app_settings")
    .select("crs_digest_mode, resend_daily_quota")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: "Email controls are unavailable. Run migration 004_perf_ops_controls.sql." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    settings: {
      crs_digest_mode: (data?.crs_digest_mode as DigestMode | null) ?? "instant",
      resend_daily_quota: (data?.resend_daily_quota as number | null) ?? null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  const body = await request.json().catch(() => ({}));
  const digest = typeof body.crs_digest_mode === "string" ? body.crs_digest_mode : undefined;
  const quotaRaw = body.resend_daily_quota;

  const updates: { crs_digest_mode?: DigestMode; resend_daily_quota?: number | null } = {};
  if (digest !== undefined) {
    if (!isDigestMode(digest)) {
      return NextResponse.json({ error: "Invalid digest mode." }, { status: 400 });
    }
    updates.crs_digest_mode = digest;
  }
  if (quotaRaw !== undefined) {
    if (quotaRaw === null || quotaRaw === "") {
      updates.resend_daily_quota = null;
    } else {
      const n = Number(quotaRaw);
      if (!Number.isFinite(n) || n < 1) {
        return NextResponse.json({ error: "Daily quota must be a positive number or blank." }, { status: 400 });
      }
      updates.resend_daily_quota = Math.round(n);
    }
  }

  const { error } = await admin
    .from("app_settings")
    .upsert({ id: 1, ...updates }, { onConflict: "id" });
  if (error) {
    return NextResponse.json(
      { error: "Could not save email controls. Ensure migration 004 is applied." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
