import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { TerritoriesAdmin } from "@/components/TerritoriesAdmin";
import { PROGRAM_NAME } from "@/lib/branding";

export default async function TerritoriesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Coverage territories</h1>
      <p className="mt-1 max-w-2xl text-stone-600">
        Map Georgia counties to territories and assign CRS and Supervisor staff. New partner
        signups on the public {PROGRAM_NAME} form email only the CRS members listed for the
        territory that matches the submitted county. Until at least one territory exists, all
        active CRS users receive those emails (legacy behavior). Unmapped counties still notify all
        CRS so nothing is silently dropped—check server logs for{" "}
        <code className="rounded bg-stone-100 px-1 text-xs">crs_email_county_unmapped</code>.
      </p>
      <TerritoriesAdmin />
    </div>
  );
}
