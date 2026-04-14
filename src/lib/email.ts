import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROGRAM_EMAIL_FROM_LABEL, PROGRAM_NAME } from "@/lib/branding";
import { resolveCrsEmailsForCounty } from "@/lib/coverage-territories";
import { logAppEvent } from "@/lib/observability";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/** Public site base URL for links in transactional email (same precedence as staff invite flow). */
function publicAppBaseUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://www.thejoshuatree.org";
  return raw.replace(/\/$/, "");
}

const defaultFromEmail = () =>
  process.env.FROM_EMAIL || `${PROGRAM_EMAIL_FROM_LABEL} <onboarding@resend.dev>`;

type DigestMode = "instant" | "hourly" | "daily";

type EmailOpsSettings = {
  digestMode: DigestMode;
  dailyQuota: number | null;
};

async function getEmailOpsSettings(): Promise<EmailOpsSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_settings")
    .select("crs_digest_mode, resend_daily_quota")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    return { digestMode: "instant", dailyQuota: null };
  }
  const digestMode = (data?.crs_digest_mode as DigestMode | null) ?? "instant";
  const dailyQuota = (data?.resend_daily_quota as number | null) ?? null;
  return { digestMode, dailyQuota };
}

async function countEmailEventsToday(): Promise<number> {
  const admin = createAdminClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const { count } = await admin
    .from("email_delivery_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStart.toISOString())
    .lt("created_at", dayEnd.toISOString());
  return count ?? 0;
}

async function logDelivery(
  category: "crs_new_signup" | "employer_confirmation" | "staff_recovery",
  status: "sent" | "skipped" | "queued" | "failed",
  toEmail: string | null,
  details: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("email_delivery_log").insert({
    category,
    to_email: toEmail,
    status,
    details,
  });
  if (error) {
    logAppEvent("email_delivery_log_failed", { category, status }, error);
  }
}

export type CrsEmailResult =
  | { sent: true }
  | {
      sent: false;
      reason:
        | "no_api_key"
        | "no_crs_recipients"
        | "territory_no_crs"
        | "queued_for_digest"
        | "daily_quota_reached"
        | "send_failed";
    };

/**
 * Notify CRS staff for a county when a new employer signs up (territory routing when configured).
 * If RESEND_API_KEY is missing, returns { sent: false } and logs — submissions still save.
 */
export async function sendNewEmployerNotificationToCRS(employer: {
  id: string;
  company_name: string;
  created_at: string;
  address_county: string;
}): Promise<CrsEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await logDelivery("crs_new_signup", "skipped", null, { reason: "no_resend_key", employerId: employer.id });
    logAppEvent("crs_email_skipped", { reason: "no_resend_key", employerId: employer.id });
    return { sent: false, reason: "no_api_key" };
  }

  const [settings, eventsToday] = await Promise.all([getEmailOpsSettings(), countEmailEventsToday()]);
  if (settings.dailyQuota && eventsToday >= settings.dailyQuota) {
    await logDelivery("crs_new_signup", "skipped", null, {
      reason: "daily_quota_reached",
      employerId: employer.id,
      eventsToday,
      quota: settings.dailyQuota,
    });
    return { sent: false, reason: "daily_quota_reached" };
  }

  const supabase = createAdminClient();
  const { emails: to, mode } = await resolveCrsEmailsForCounty(supabase, employer.address_county);

  if (mode === "territory_no_crs") {
    await logDelivery("crs_new_signup", "skipped", null, {
      reason: "territory_no_crs_assignees",
      employerId: employer.id,
    });
    logAppEvent("crs_email_skipped", {
      reason: "territory_no_crs_assignees",
      employerId: employer.id,
    });
    return { sent: false, reason: "territory_no_crs" };
  }

  if (!to.length) {
    await logDelivery("crs_new_signup", "skipped", null, { reason: "no_crs_profiles", employerId: employer.id });
    logAppEvent("crs_email_skipped", { reason: "no_crs_profiles", employerId: employer.id });
    return { sent: false, reason: "no_crs_recipients" };
  }

  if (mode === "fallback_all_crs") {
    logAppEvent("crs_email_routing", { mode: "fallback_all_crs", employerId: employer.id });
  } else {
    logAppEvent("crs_email_routing", { mode: "territory_crs", employerId: employer.id });
  }

  const date = new Date(employer.created_at).toLocaleDateString("en-US", {
    dateStyle: "medium",
  });
  const from = defaultFromEmail();
  const resend = new Resend(apiKey);
  const companySafe = escapeHtml(employer.company_name);

  if (settings.digestMode !== "instant") {
    const rows = to.map((recipient) => ({
      category: "crs_new_signup",
      recipient_email: recipient,
      payload: {
        employerId: employer.id,
        company: employer.company_name,
        county: employer.address_county,
      },
    }));
    const { error: queueErr } = await supabase.from("notification_digest_queue").insert(rows);
    if (queueErr) {
      await logDelivery("crs_new_signup", "failed", null, {
        reason: "queue_failed",
        digestMode: settings.digestMode,
        employerId: employer.id,
      });
      return { sent: false, reason: "send_failed" };
    }
    await logDelivery("crs_new_signup", "queued", null, {
      digestMode: settings.digestMode,
      recipients: to.length,
      employerId: employer.id,
    });
    return { sent: false, reason: "queued_for_digest" };
  }

  try {
    await resend.emails.send({
      from,
      to,
      subject: `New partner signup: ${employer.company_name}`,
      html: `
      <p>A new organization has joined the <strong>${escapeHtml(PROGRAM_NAME)}</strong>.</p>
      <p><strong>Company:</strong> ${companySafe}</p>
      <p><strong>County:</strong> ${escapeHtml(employer.address_county)}</p>
      <p><strong>Submitted:</strong> ${date}</p>
      <p>Log in to the staff dashboard to review and update their status when appropriate.</p>
    `,
    });
    await logDelivery("crs_new_signup", "sent", null, {
      recipients: to.length,
      employerId: employer.id,
      routingMode: mode,
    });
    return { sent: true };
  } catch (e) {
    await logDelivery("crs_new_signup", "failed", null, {
      reason: "send_failed",
      employerId: employer.id,
    });
    logAppEvent("crs_email_failed", { employerId: employer.id }, e);
    return { sent: false, reason: "send_failed" };
  }
}

export async function sendStaffRecoveryEmail(params: {
  to: string;
  actionLink: string;
}): Promise<CrsEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await logDelivery("staff_recovery", "skipped", params.to, { reason: "no_resend_key" });
    logAppEvent("staff_recovery_email_skipped", { reason: "no_resend_key" });
    return { sent: false, reason: "no_api_key" };
  }
  const from = defaultFromEmail();
  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from,
      to: [params.to],
      subject: `${PROGRAM_NAME} — sign-in link`,
      html: `<p>Use this secure link to access your account:</p><p><a href="${params.actionLink}">Open sign-in link</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    await logDelivery("staff_recovery", "sent", params.to, {});
    return { sent: true };
  } catch (e) {
    await logDelivery("staff_recovery", "failed", params.to, { reason: "send_failed" });
    logAppEvent("staff_recovery_email_failed", { to: params.to }, e);
    return { sent: false, reason: "send_failed" };
  }
}

export type EmployerConfirmationResult =
  | { sent: true }
  | { sent: false; reason: "no_api_key" | "send_failed" };

/**
 * Optional confirmation to the employer contact after a successful public signup.
 */
export async function sendEmployerSignupConfirmation(params: {
  to: string;
  companyName: string;
  contactName: string;
}): Promise<EmployerConfirmationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await logDelivery("employer_confirmation", "skipped", params.to, { reason: "no_resend_key" });
    logAppEvent("employer_confirmation_skipped", { reason: "no_resend_key" });
    return { sent: false, reason: "no_api_key" };
  }

  const settings = await getEmailOpsSettings();
  if (settings.dailyQuota) {
    const eventsToday = await countEmailEventsToday();
    if (eventsToday >= settings.dailyQuota) {
      await logDelivery("employer_confirmation", "skipped", params.to, {
        reason: "daily_quota_reached",
        eventsToday,
        quota: settings.dailyQuota,
      });
      return { sent: false, reason: "send_failed" };
    }
  }

  const from = defaultFromEmail();
  const resend = new Resend(apiKey);
  const site = escapeHtml(publicAppBaseUrl());
  const company = escapeHtml(params.companyName);
  const name = escapeHtml(params.contactName);

  try {
    await resend.emails.send({
      from,
      to: [params.to.trim()],
      subject: `We received your signup — ${params.companyName}`,
      html: `
      <p>Hi ${name},</p>
      <p>Thank you for joining the <strong>Joshua Tree Service Group ${escapeHtml(PROGRAM_NAME)}</strong> on behalf of <strong>${company}</strong>.</p>
      <p>We received your information. A member of our team may reach out when we have qualified candidates who could be a good fit for your openings.</p>
      <p>You do not need to reply unless you have a question.</p>
      <p>For questions, contact <a href="mailto:bryan.evans@thejoshuatree.org">bryan.evans@thejoshuatree.org</a>.</p>
      <p style="margin-top:1.5rem;font-size:0.9em;color:#57534e"><a href="${site}">${site}</a></p>
    `,
    });
    await logDelivery("employer_confirmation", "sent", params.to, {});
    return { sent: true };
  } catch (e) {
    await logDelivery("employer_confirmation", "failed", params.to, { reason: "send_failed" });
    logAppEvent("employer_confirmation_failed", {}, e);
    return { sent: false, reason: "send_failed" };
  }
}
