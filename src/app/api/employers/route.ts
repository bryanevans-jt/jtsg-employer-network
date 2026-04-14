import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmployerSignupConfirmation,
  sendNewEmployerNotificationToCRS,
} from "@/lib/email";
import { logAppEvent } from "@/lib/observability";
import { normalizeAddress } from "@/lib/address";
import type { EmployerInsert } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      company_name,
      address_street,
      address_city,
      address_state,
      address_county,
      phone,
      website,
      industry,
      contact_name,
      contact_phone,
      contact_email,
      contact_title,
    } = body as EmployerInsert;

    if (
      !company_name?.trim() ||
      !address_street?.trim() ||
      !address_city?.trim() ||
      !address_state?.trim() ||
      !address_county?.trim() ||
      !industry?.trim() ||
      !contact_name?.trim() ||
      !contact_email?.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const addr = normalizeAddress({
      address_street,
      address_city,
      address_state,
      address_county,
    });

    const supabase = createAdminClient();
    const { data: employer, error } = await supabase
      .from("employers")
      .insert({
        company_name: company_name.trim(),
        address_street: addr.address_street,
        address_city: addr.address_city,
        address_state: addr.address_state,
        address_county: addr.address_county,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        industry: industry.trim(),
        contact_name: contact_name.trim(),
        contact_phone: contact_phone?.trim() || null,
        contact_email: contact_email.trim(),
        contact_title: contact_title?.trim() || null,
      })
      .select("id, company_name, created_at, address_county")
      .single();

    if (error) {
      console.error("Employer insert error:", error);
      return NextResponse.json(
        { error: "Could not save your information. Please try again." },
        { status: 500 }
      );
    }

    const [emailResult] = await Promise.all([
      sendNewEmployerNotificationToCRS(employer).catch((e) => {
        logAppEvent("crs_email_unhandled", { employerId: employer.id }, e);
        return { sent: false as const, reason: "send_failed" as const };
      }),
      sendEmployerSignupConfirmation({
        to: contact_email.trim(),
        companyName: company_name.trim(),
        contactName: contact_name.trim(),
      }).catch((e) => {
        logAppEvent("employer_confirmation_unhandled", { employerId: employer.id }, e);
        return null;
      }),
    ]);

    return NextResponse.json({
      ok: true,
      id: employer.id,
      crsEmailSent: emailResult.sent,
      crsEmailNote: emailResult.sent
        ? undefined
        : emailResult.reason === "no_api_key"
          ? "Staff email alerts are not fully configured; your submission was saved."
          : emailResult.reason === "no_crs_recipients"
            ? "No active CRS contacts are available to notify; your submission was saved."
            : emailResult.reason === "queued_for_digest"
              ? undefined
              : emailResult.reason === "daily_quota_reached"
                ? undefined
            : emailResult.reason === "territory_no_crs"
              ? undefined
              : "We could not notify staff by email; your submission was saved.",
    });
  } catch (e) {
    console.error("POST /api/employers", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
