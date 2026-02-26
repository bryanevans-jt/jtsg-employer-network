"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        if (!data.setupAllowed) {
          router.replace("/login");
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-500">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
