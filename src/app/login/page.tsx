"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StaffAuthShell } from "@/components/StaffAuthShell";
import { inputClass, labelClass, btnPrimaryClass, alertErrorClass, alertSuccessClass } from "@/lib/ui";
import { PROGRAM_NAME_NAV } from "@/lib/branding";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [setupAllowed, setSetupAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (searchParams.get("setup") === "1") {
      setMessage({
        type: "success",
        text: "Admin account created. Sign in with your email and password.",
      });
    }
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => setSetupAllowed(d.setupAllowed === true))
      .catch(() => setSetupAllowed(false));
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    window.location.href = "/dashboard";
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Enter your email address first." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({
      type: "success",
      text: "Check your email for a link to reset your password.",
    });
  };

  return (
    <StaffAuthShell backHref="/" backLabel={`← ${PROGRAM_NAME_NAV}`}>
      <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Staff Sign In</h1>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        {message ? (
          <div
            className={message.type === "error" ? alertErrorClass : alertSuccessClass}
            role="status"
          >
            {message.text}
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            className="text-center text-sm font-medium text-jtsg-green hover:underline disabled:opacity-60"
          >
            Forgot password?
          </button>
          {setupAllowed ? (
            <p className="text-center text-sm text-stone-600">
              First time?{" "}
              <Link href="/setup" className="font-medium text-jtsg-green hover:underline">
                Create admin account
              </Link>
            </p>
          ) : null}
        </div>
      </form>
    </StaffAuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <StaffAuthShell backHref="/" backLabel="← Home">
          <p className="text-center text-sm text-stone-600">Loading…</p>
        </StaffAuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
