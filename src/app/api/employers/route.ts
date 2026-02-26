import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewEmployerNotificationToCRS } from "@/lib/email";
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
      .select("id, company_name, created_at")
      .single();

    if (error) {
      console.error("Employer insert error:", error);
      return NextResponse.json(
        { error: "Could not save your information. Please try again." },
        { status: 500 }
      );
    }

    await sendNewEmployerNotificationToCRS(employer).catch((e) =>
      console.error("CRS notification email failed:", e)
    );

    return NextResponse.json({ ok: true, id: employer.id });
  } catch (e) {
    console.error("POST /api/employers", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
