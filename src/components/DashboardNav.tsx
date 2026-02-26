"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { ROLE_LABELS } from "@/types/database";

interface DashboardNavProps {
  profile: Profile;
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isAdmin = profile.role === "admin";

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-semibold text-jtsg-green hover:text-jtsg-green/90"
            >
              JTSG Employer Network
            </Link>
            <nav className="hidden sm:flex gap-1">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/dashboard"
                    ? "bg-jtsg-sage/20 text-jtsg-green"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                Employers
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/dashboard/users"
                      ? "bg-jtsg-sage/20 text-jtsg-green"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  Users
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500 hidden sm:inline">
              {profile.full_name || profile.email} · {ROLE_LABELS[profile.role]}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
