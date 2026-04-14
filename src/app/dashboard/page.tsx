import { EmployersView } from "@/components/EmployersView";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { getProfile, canViewEmployerAnalytics } from "@/lib/auth";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {canViewEmployerAnalytics(profile.role) && <DashboardAnalytics />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Employers</h1>
        <p className="mt-1 text-stone-600 max-w-2xl">
          {profile.role === "employment_specialist"
            ? "Browse the full partner directory (read-only). Use filters and export for your caseload."
            : profile.role === "supervisor"
              ? "Active partners only. Filter, sort, and export as needed."
              : profile.role === "crs"
                ? "Review submissions, update statuses, and keep internal notes current."
                : "Search, filter, sort, and export employer records."}
        </p>
        <EmployersView role={profile.role} />
      </div>
    </div>
  );
}
