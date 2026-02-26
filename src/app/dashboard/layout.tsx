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

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <DashboardNav profile={profile} />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
