"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StaffAuthShell } from "@/components/StaffAuthShell";
import { inputClass, labelClass, btnPrimaryClass, alertErrorClass, alertSuccessClass } from "@/lib/ui";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Password updated. You can now sign in." });
    setPassword("");
    setConfirm("");
  };

  return (
    <StaffAuthShell backHref="/login" backLabel="← Back to login">
      <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Set New Password</h1>
      <p className="mt-2 text-sm text-stone-600">Enter your new password below.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {message ? (
          <div
            className={message.type === "error" ? alertErrorClass : alertSuccessClass}
            role="status"
          >
            {message.text}
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
        <button type="submit" disabled={loading} className={btnPrimaryClass}>
          {loading ? "Updating…" : "Update Password"}
        </button>
        <p className="text-center text-sm text-stone-600">
          <Link href="/login" className="font-medium text-jtsg-green hover:underline">
            Return to Staff Sign In
          </Link>
        </p>
      </form>
    </StaffAuthShell>
  );
}
