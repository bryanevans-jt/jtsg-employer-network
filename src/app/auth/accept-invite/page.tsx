"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
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
        supabaseRef.current = supabase;
        setStatus("ready");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setErrorMessage(msg);
        setStatus("error");
      }
    }

    handleAuth();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setSubmitMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setSubmitMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    const supabase = supabaseRef.current;
    if (!supabase) {
      setSubmitMessage({ type: "error", text: "Session lost. Please use the link from your email again." });
      return;
    }
    setSubmitLoading(true);
    setSubmitMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitLoading(false);
    if (error) {
      setSubmitMessage({ type: "error", text: error.message });
      return;
    }
    setStatus("success");
    setSubmitMessage({ type: "success", text: "Password set. Redirecting to sign in…" });
    setPassword("");
    setConfirm("");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  };

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
        <div className="w-full max-w-sm rounded-xl bg-white shadow border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-stone-900">Invalid link</h1>
          <p className="mt-2 text-sm text-stone-600">{errorMessage}</p>
          <Link href="/login" className="mt-4 inline-block text-jtsg-green font-medium text-sm hover:underline">
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
        <div className="w-full max-w-sm text-center">
          <p className="text-stone-600">Setting up your account…</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
        <div className="w-full max-w-sm rounded-xl bg-white shadow border border-stone-200 p-6 text-center">
          <p className="text-green-700 font-medium">{submitMessage?.text}</p>
        </div>
      </div>
    );
  }

  // status === "ready" – show set-password form on same page so session is not lost
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
      <div className="w-full max-w-sm">
        <Link href="/login" className="text-jtsg-green font-medium text-sm hover:underline">
          ← Back to login
        </Link>
        <div className="mt-6 rounded-xl bg-white shadow border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-stone-900">Set your password</h1>
          <p className="mt-1 text-sm text-stone-600">
            Create a password for your account.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {submitMessage && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  submitMessage.type === "error"
                    ? "bg-red-50 text-red-800"
                    : "bg-green-50 text-green-800"
                }`}
              >
                {submitMessage.text}
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 shadow-sm focus:border-jtsg-green focus:outline-none focus:ring-1 focus:ring-jtsg-green"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-stone-700">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 shadow-sm focus:border-jtsg-green focus:outline-none focus:ring-1 focus:ring-jtsg-green"
              />
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full rounded-lg bg-jtsg-green px-4 py-2.5 font-medium text-white hover:bg-jtsg-green/90 disabled:opacity-60"
            >
              {submitLoading ? "Updating…" : "Set password"}
            </button>
          </form>
        </div>
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
