import { EmployersView } from "@/components/EmployersView";
import { getProfile } from "@/lib/auth";

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900">Employers</h1>
      <p className="mt-1 text-stone-600">
        {profile.role === "crs"
          ? "New submissions appear first; active partners are listed below."
          : "View and sort employer partners."}
      </p>
      <EmployersView role={profile.role} />
    </div>
  );
}
