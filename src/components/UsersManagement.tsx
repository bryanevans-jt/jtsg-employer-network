"use client";

import { useState, useEffect } from "react";
import type { Profile, AppRole } from "@/types/database";
import { ROLE_LABELS } from "@/types/database";

const STAFF_ROLES: AppRole[] = [
  "director",
  "supervisor",
  "employment_specialist",
  "crs",
];

export function UsersManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("crs");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fetchUsers = async () => {
    const res = await fetch("/api/users/list");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMessage(null);
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || null,
        role: inviteRole,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setInviteLoading(false);
    if (res.ok) {
      setInviteMessage({ type: "success", text: data.message ?? "Invite sent." });
      setInviteEmail("");
      setInviteName("");
      setInviteRole("crs");
      fetchUsers();
    } else {
      setInviteMessage({ type: "error", text: data.error ?? "Failed to send invite." });
    }
  };

  if (loading) {
    return (
      <div className="mt-6 py-8 text-center text-stone-500">Loading users…</div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-800">Invite new user</h2>
        <p className="mt-1 text-sm text-stone-600">
          They will receive an email to set their password. Use the &quot;Forgot password?&quot; link on the login page to reset later.
        </p>
        <form onSubmit={handleInvite} className="mt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label htmlFor="invite_email" className="block text-sm font-medium text-stone-700">
              Email *
            </label>
            <input
              id="invite_email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 rounded-lg border border-stone-300 px-3 py-2 w-56"
            />
          </div>
          <div>
            <label htmlFor="invite_name" className="block text-sm font-medium text-stone-700">
              Full name
            </label>
            <input
              id="invite_name"
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="mt-1 rounded-lg border border-stone-300 px-3 py-2 w-48"
            />
          </div>
          <div>
            <label htmlFor="invite_role" className="block text-sm font-medium text-stone-700">
              Role *
            </label>
            <select
              id="invite_role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AppRole)}
              className="mt-1 rounded-lg border border-stone-300 px-3 py-2"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            className="rounded-lg bg-jtsg-green px-4 py-2 text-white font-medium hover:bg-jtsg-green/90 disabled:opacity-60"
          >
            {inviteLoading ? "Sending…" : "Send invite"}
          </button>
        </form>
        {inviteMessage && (
          <p
            className={`mt-3 text-sm ${
              inviteMessage.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {inviteMessage.text}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-3">All users</h2>
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase hidden sm:table-cell">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-stone-900">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-stone-600 hidden sm:table-cell">
                    {u.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-700">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
