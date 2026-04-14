"use client";

import { useState, useEffect } from "react";
import type { Profile, AppRole } from "@/types/database";
import { ROLE_LABELS } from "@/types/database";
import {
  btnPrimarySmClass,
  inputClass,
  labelClass,
  alertErrorClass,
  alertSuccessClass,
} from "@/lib/ui";

const STAFF_ROLES: AppRole[] = [
  "director",
  "supervisor",
  "employment_specialist",
  "crs",
];

export function UsersManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("crs");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  const fetchUsers = async () => {
    const res = await fetch("/api/users/list");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users ?? []);
    setCurrentUserId(data.currentUserId ?? null);
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmed = window.confirm(
      `Permanently remove ${email} from JTSG staff? They will no longer be able to sign in.`
    );
    if (!confirmed) return;
    setBusyId(userId);
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) fetchUsers();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to remove user.");
    }
  };

  const setUserActive = async (userId: string, is_active: boolean) => {
    setBusyId(userId);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
    setBusyId(null);
    if (res.ok) fetchUsers();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Update failed.");
    }
  };

  const handleResendInvite = async (userId: string) => {
    setBusyId(userId);
    const res = await fetch(`/api/users/${userId}/resend-invite`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (res.ok) {
      alert(data.message ?? "Done.");
    } else {
      alert(data.error ?? "Could not send link.");
    }
  };

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
      <section className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">Invite new user</h2>
        <p className="mt-1 text-sm text-stone-600">
          They will receive an email to set their password. Use &quot;Resend link&quot; below for
          existing users, or the &quot;Forgot password?&quot; option on the login page.
        </p>
        <form onSubmit={handleInvite} className="mt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label htmlFor="invite_email" className={labelClass}>
              Email *
            </label>
            <input
              id="invite_email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={`${inputClass} w-56 max-w-full`}
            />
          </div>
          <div>
            <label htmlFor="invite_name" className={labelClass}>
              Full name
            </label>
            <input
              id="invite_name"
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className={`${inputClass} w-48 max-w-full`}
            />
          </div>
          <div>
            <label htmlFor="invite_role" className={labelClass}>
              Role *
            </label>
            <select
              id="invite_role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AppRole)}
              className={inputClass}
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={inviteLoading} className={btnPrimarySmClass}>
            {inviteLoading ? "Sending…" : "Send invite"}
          </button>
        </form>
        {inviteMessage && (
          <p
            className={`mt-3 text-sm ${
              inviteMessage.type === "error" ? alertErrorClass : alertSuccessClass
            }`}
          >
            {inviteMessage.text}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-jtsg-ink">All users</h2>
        <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-md backdrop-blur-sm">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-jtsg-sage/10">
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
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {users.map((u) => {
                const active = u.is_active !== false;
                const isSelf = currentUserId === u.id;
                return (
                  <tr key={u.id} className="transition-colors hover:bg-stone-50/80">
                    <td className="px-4 py-3 text-sm text-jtsg-ink">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-stone-600 hidden sm:table-cell">
                      {u.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-700">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          active
                            ? "text-emerald-700 font-medium"
                            : "text-stone-500 font-medium"
                        }
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleResendInvite(u.id)}
                        disabled={busyId === u.id}
                        className="text-sm text-jtsg-green hover:underline disabled:opacity-60"
                      >
                        Resend link
                      </button>
                      {!isSelf && active && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deactivate ${u.email}? They will be signed out of the dashboard.`)) {
                              setUserActive(u.id, false);
                            }
                          }}
                          disabled={busyId === u.id}
                          className="text-sm text-amber-800 hover:underline disabled:opacity-60"
                        >
                          Deactivate
                        </button>
                      )}
                      {!isSelf && !active && (
                        <button
                          type="button"
                          onClick={() => setUserActive(u.id, true)}
                          disabled={busyId === u.id}
                          className="text-sm text-jtsg-green hover:underline disabled:opacity-60"
                        >
                          Activate
                        </button>
                      )}
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          disabled={busyId === u.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-60"
                        >
                          {busyId === u.id ? "…" : "Remove"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
