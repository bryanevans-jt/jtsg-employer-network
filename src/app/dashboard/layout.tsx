import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }

  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const showEmailBanner =
    !resendConfigured && ["admin", "director", "crs"].includes(profile.role);

  return (
    <div className="min-h-screen flex flex-col bg-jtsg-cream/40">
      <DashboardNav profile={profile} />
      {showEmailBanner && (
        <div
          className="mx-4 mt-3 md:mx-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <strong className="font-semibold">Email is off.</strong>{" "}
          <code className="text-xs bg-amber-100/80 px-1 rounded">RESEND_API_KEY</code> is not set,
          so staff are not emailed on new partner signups (and optional applicant copy is skipped).
          Submissions still save to the database. Configure Resend in production or check server
          logs for{" "}
          <code className="text-xs bg-amber-100/80 px-1 rounded">crs_email_skipped</code> /{" "}
          <code className="text-xs bg-amber-100/80 px-1 rounded">employer_confirmation_skipped</code>{" "}
          events.
        </div>
      )}
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
