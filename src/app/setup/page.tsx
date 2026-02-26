"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SetupGuard } from "./SetupGuard";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-100">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-jtsg-green font-medium text-sm hover:underline">
          ← JTSG Employer Network
        </Link>
        <div className="mt-6 rounded-xl bg-white shadow border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-stone-900">Create admin account</h1>
          <p className="mt-1 text-sm text-stone-600">
            No accounts exist yet. Create the first admin account to manage the app.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 shadow-sm focus:border-jtsg-green focus:outline-none focus:ring-1 focus:ring-jtsg-green"
              />
              <p className="mt-1 text-xs text-stone-500">At least 8 characters</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-jtsg-green px-4 py-2.5 font-medium text-white hover:bg-jtsg-green/90 disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create admin account"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </SetupGuard>
  );
}
