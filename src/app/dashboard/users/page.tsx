import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { UsersManagement } from "@/components/UsersManagement";

export default async function DashboardUsersPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900">User accounts</h1>
      <p className="mt-1 text-stone-600">
        Create JTSG staff accounts and assign roles. Invited users will receive an email to set their password.
      </p>
      <UsersManagement />
    </div>
  );
}
