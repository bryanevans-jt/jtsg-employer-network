import Link from "next/link";
import type { ReactNode } from "react";
import { cardElevatedClass } from "@/lib/ui";

type StaffAuthShellProps = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

/**
 * Centered staff auth surface (login, setup, reset, invite) — layout only.
 */
export function StaffAuthShell({
  children,
  backHref = "/",
  backLabel = "← Home",
}: StaffAuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-jtsg-cream via-white to-jtsg-sage/10">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <Link
            href={backHref}
            className="mb-4 inline-block text-sm font-medium text-jtsg-green transition hover:text-jtsg-green-dark hover:underline"
          >
            {backLabel}
          </Link>
          <div className={cardElevatedClass}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
