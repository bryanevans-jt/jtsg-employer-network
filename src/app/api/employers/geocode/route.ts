import { NextRequest, NextResponse } from "next/server";
import { loadStaffContext } from "@/lib/api-guards";
import { canEditEmployers } from "@/lib/permissions";
import type { AppRole } from "@/types/database";

/**
 * Geocode a single employer address using Nominatim (OSM).
 * Rate limit: 1 request per second. Call from client with delay between requests.
 */
export async function POST(request: NextRequest) {
  const ctx = await loadStaffContext();
  if (!ctx.ok) return ctx.response;

  const { admin, profile } = ctx;
  const role = profile.role as AppRole;
  if (!canEditEmployers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = body.id as string;
  if (!id) {
    return NextResponse.json({ error: "Missing employer id" }, { status: 400 });
  }

  const { data: employer, error: fetchError } = await admin
    .from("employers")
    .select("id, address_street, address_city, address_state")
    .eq("id", id)
    .single();

  if (fetchError || !employer) {
    return NextResponse.json({ error: "Employer not found" }, { status: 404 });
  }

  const address = [
    employer.address_street,
    employer.address_city,
    employer.address_state,
  ]
    .filter(Boolean)
    .join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "JTSG-Employer-Network/1.0" },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
  const results = await res.json();
  const first = results?.[0];
  if (!first?.lat || !first?.lon) {
    return NextResponse.json(
      { error: "Address could not be located" },
      { status: 404 }
    );
  }

  const latitude = parseFloat(first.lat);
  const longitude = parseFloat(first.lon);

  const { error: updateError } = await admin
    .from("employers")
    .update({ latitude, longitude })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to save coordinates" }, { status: 500 });
  }

  return NextResponse.json({ latitude, longitude });
}
