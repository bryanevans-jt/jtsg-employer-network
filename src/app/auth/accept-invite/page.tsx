"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StaffAuthShell } from "@/components/StaffAuthShell";
import { inputClass, labelClass, btnPrimaryClass, alertErrorClass, alertSuccessClass } from "@/lib/ui";

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
  const [submitMessage, setSubmitMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
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
          setErrorMessage(
            "Invalid or expired link. Please use the link from your invite email or request a new one."
          );
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
      setSubmitMessage({
        type: "error",
        text: "Session lost. Please use the link from your email again.",
      });
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
      <StaffAuthShell backHref="/login" backLabel="← Back to login">
        <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Invalid link</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{errorMessage}</p>
      </StaffAuthShell>
    );
  }

  if (status === "loading") {
    return (
      <StaffAuthShell backHref="/login" backLabel="← Back to login">
        <p className="text-center text-sm text-stone-600">Setting up your account…</p>
      </StaffAuthShell>
    );
  }

  if (status === "success") {
    return (
      <StaffAuthShell backHref="/login" backLabel="← Back to login">
        <div className={alertSuccessClass}>
          <p className="text-center text-sm font-medium">{submitMessage?.text}</p>
        </div>
      </StaffAuthShell>
    );
  }

  return (
    <StaffAuthShell backHref="/login" backLabel="← Back to login">
      <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Set your password</h1>
      <p className="mt-2 text-sm text-stone-600">Create a password for your JTSG account.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {submitMessage ? (
          <div
            className={submitMessage.type === "error" ? alertErrorClass : alertSuccessClass}
            role="status"
          >
            {submitMessage.text}
          </div>
        ) : null}
        <div>
          <label htmlFor="password" className={labelClass}>
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
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirm" className={labelClass}>
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
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={submitLoading} className={btnPrimaryClass}>
          {submitLoading ? "Updating…" : "Set password"}
        </button>
      </form>
    </StaffAuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <StaffAuthShell backHref="/login" backLabel="← Back to login">
          <p className="text-center text-sm text-stone-600">Loading…</p>
        </StaffAuthShell>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
