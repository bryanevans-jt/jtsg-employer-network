"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [setupAllowed, setSetupAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (searchParams.get("setup") === "1") {
      setMessage({ type: "success", text: "Admin account created. Sign in with your email and password." });
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-jtsg-green font-medium text-sm hover:underline">
          ← JTSG Employer Network
        </Link>
        <div className="mt-6 rounded-xl bg-white shadow border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-stone-900">Staff login</h1>
          <p className="mt-1 text-sm text-stone-600">
            Sign in with your JTSG account.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === "error"
                    ? "bg-red-50 text-red-800"
                    : "bg-green-50 text-green-800"
                }`}
              >
                {message.text}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 shadow-sm focus:border-jtsg-green focus:outline-none focus:ring-1 focus:ring-jtsg-green"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 shadow-sm focus:border-jtsg-green focus:outline-none focus:ring-1 focus:ring-jtsg-green"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-jtsg-green px-4 py-2.5 font-medium text-white hover:bg-jtsg-green/90 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-sm text-jtsg-green hover:underline disabled:opacity-60"
              >
                Forgot password?
              </button>
              {setupAllowed && (
                <p className="text-center text-sm text-stone-500">
                  First time?{" "}
                  <Link href="/setup" className="text-jtsg-green hover:underline">
                    Create admin account
                  </Link>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
