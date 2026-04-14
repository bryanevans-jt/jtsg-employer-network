"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SetupGuard } from "./SetupGuard";
import { StaffAuthShell } from "@/components/StaffAuthShell";
import { inputClass, labelClass, btnPrimaryClass, alertErrorClass, alertSuccessClass } from "@/lib/ui";

export default function SetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Admin account created. Redirecting to sign in…" });
      setTimeout(() => router.push("/login?setup=1"), 1500);
    } else {
      setMessage({ type: "error", text: data.error ?? "Setup failed." });
    }
  };

  return (
    <SetupGuard>
      <StaffAuthShell backHref="/" backLabel="← Home">
        <h1 className="text-2xl font-bold tracking-tight text-jtsg-ink">Create Admin Account</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          No accounts exist yet. Create the first admin account to manage the app.
        </p>

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
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
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
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-stone-500">At least 8 characters</p>
          </div>
          <button type="submit" disabled={loading} className={btnPrimaryClass}>
            {loading ? "Creating…" : "Create Admin Account"}
          </button>
          <p className="text-center text-sm text-stone-600">
            Already set up?{" "}
            <Link href="/login" className="font-medium text-jtsg-green hover:underline">
              Staff Sign In
            </Link>
          </p>
        </form>
      </StaffAuthShell>
    </SetupGuard>
  );
}
