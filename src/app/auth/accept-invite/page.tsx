"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!hash || !hash.startsWith("#")) return params;
  const parts = hash.slice(1).split("&");
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) params[key] = decodeURIComponent(value);
  }
  return params;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get("next") ?? "/reset-password";

    async function handleAuth() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const hashParams = typeof window !== "undefined" ? parseHashParams(window.location.hash) : {};

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (hashParams.access_token && hashParams.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: hashParams.access_token,
            refresh_token: hashParams.refresh_token,
          });
          if (error) throw error;
        } else {
          setErrorMessage("Invalid or expired link. Please use the link from your invite email or request a new one.");
          setStatus("error");
          return;
        }
        setStatus("done");
        window.location.replace(next);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setErrorMessage(msg);
        setStatus("error");
      }
    }

    handleAuth();
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
        <div className="w-full max-w-sm rounded-xl bg-white shadow border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-stone-900">Invalid link</h1>
          <p className="mt-2 text-sm text-stone-600">{errorMessage}</p>
          <a
            href="/login"
            className="mt-4 inline-block text-jtsg-green font-medium text-sm hover:underline"
          >
            ← Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
      <div className="w-full max-w-sm text-center">
        <p className="text-stone-600">Setting up your account…</p>
        <p className="mt-2 text-sm text-stone-500">You’ll be redirected to set your password.</p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
          <p className="text-stone-600">Loading…</p>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
