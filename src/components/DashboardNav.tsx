"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { ROLE_LABELS } from "@/types/database";
import { PROGRAM_NAME } from "@/lib/branding";
import { btnSecondarySmClass } from "@/lib/ui";

interface DashboardNavProps {
  profile: Profile;
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isAdmin = profile.role === "admin";

  const navLinkClass = (active: boolean) =>
    `block rounded-lg px-3 py-2.5 text-sm font-medium sm:inline-block sm:py-2 ${
      active
        ? "bg-jtsg-sage/25 text-jtsg-green"
        : "text-stone-700 hover:bg-stone-100 sm:text-stone-600"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/90 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex min-h-14 items-center justify-between gap-3 py-2 sm:py-0">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/dashboard"
              className="min-w-0 font-semibold leading-snug text-jtsg-green transition hover:text-jtsg-green-dark text-sm sm:max-w-[min(100%,20rem)] sm:text-[15px] md:max-w-[min(100%,26rem)] lg:max-w-none lg:text-base"
            >
              {PROGRAM_NAME}
            </Link>
            <nav className="hidden items-center gap-1 sm:flex sm:shrink-0">
              <Link
                href="/dashboard"
                className={navLinkClass(pathname === "/dashboard")}
              >
                Employers
              </Link>
              {isAdmin ? (
                <>
                  <Link
                    href="/dashboard/users"
                    className={navLinkClass(pathname === "/dashboard/users")}
                  >
                    Users
                  </Link>
                  <Link
                    href="/dashboard/territories"
                    className={navLinkClass(pathname === "/dashboard/territories")}
                  >
                    Territories
                  </Link>
                </>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[14rem] truncate text-sm text-stone-500 lg:inline">
              {profile.full_name || profile.email} · {ROLE_LABELS[profile.role]}
            </span>
            <button
              type="button"
              className={`${btnSecondarySmClass} px-3 py-1.5 sm:hidden`}
              aria-expanded={mobileOpen}
              aria-controls="dashboard-mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
            >
              Menu
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 sm:inline"
            >
              Sign out
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            id="dashboard-mobile-nav"
            className="border-t border-stone-100 py-3 sm:hidden"
          >
            <Link href="/dashboard" className={navLinkClass(pathname === "/dashboard")}>
              Employers
            </Link>
            {isAdmin ? (
              <>
                <Link
                  href="/dashboard/users"
                  className={navLinkClass(pathname === "/dashboard/users")}
                >
                  Users
                </Link>
                <Link
                  href="/dashboard/territories"
                  className={navLinkClass(pathname === "/dashboard/territories")}
                >
                  Territories
                </Link>
              </>
            ) : null}
            <p className="mt-2 border-t border-stone-100 px-3 pt-3 text-xs text-stone-500">
              {profile.full_name || profile.email}
              <br />
              {ROLE_LABELS[profile.role]}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Sign out
            </button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
