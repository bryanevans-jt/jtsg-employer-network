"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Employer, AppRole, EmployerActivity } from "@/types/database";
import {
  canEditEmployers,
  canDeleteEmployers,
} from "@/lib/permissions";
import {
  EMPLOYER_STATUSES,
  EMPLOYER_STATUS_LABELS,
  statusBadgeClass,
} from "@/lib/employer-status";
import {
  inputClassCompact,
  labelClass,
  alertErrorClass,
  btnPrimarySmClass,
  btnSecondarySmClass,
  btnMutedSmClass,
  btnDangerSmClass,
} from "@/lib/ui";

interface EmployerDetailModalProps {
  employer: Employer;
  role: AppRole;
  onClose: () => void;
  onUpdate: () => void;
}

type StaffOption = { id: string; full_name: string | null; email: string };

function activitySummary(a: EmployerActivity): string {
  if (a.action === "status_change") {
    const d = a.details as { from?: string; to?: string };
    return `Status: ${d.from ?? "?"} → ${d.to ?? "?"}`;
  }
  if (a.action === "field_update") {
    const d = a.details as { field?: string };
    return `Updated ${d.field ?? "field"}`;
  }
  return a.action;
}

export function EmployerDetailModal({
  employer: initial,
  role,
  onClose,
  onUpdate,
}: EmployerDetailModalProps) {
  const [employer, setEmployer] = useState(initial);
  const [activity, setActivity] = useState<EmployerActivity[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  const canEdit = canEditEmployers(role);
  const canDelete = canDeleteEmployers(role);
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/employers/${id}?include_activity=1`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.employer) {
      setEmployer(data.employer);
      if (!editingRef.current) setForm(data.employer);
    }
    setActivity(data.activity ?? []);
  }, []);

  useEffect(() => {
    setEmployer(initial);
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    loadDetail(initial.id).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [initial.id, loadDetail]);

  useEffect(() => {
    if (!canEdit) return;
    fetch("/api/users/staff-options")
      .then((r) => r.json())
      .then((d) => setStaffOptions(d.staff ?? []))
      .catch(() => setStaffOptions([]));
  }, [canEdit]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/employers/${employer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: form.company_name,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_county: form.address_county,
        phone: form.phone || null,
        website: form.website || null,
        industry: form.industry,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email,
        contact_title: form.contact_title || null,
        status: form.status,
        internal_notes: form.internal_notes ?? "",
        next_follow_up_date: form.next_follow_up_date || null,
        assigned_staff_id: form.assigned_staff_id || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }
    const data = await res.json();
    setEmployer(data.employer);
    setForm(data.employer);
    setEditing(false);
    onUpdate();
    await loadDetail(employer.id);
    setSaving(false);
  };

  const handleStatusChange = async (status: (typeof EMPLOYER_STATUSES)[number]) => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/employers/${employer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update status");
      setSaving(false);
      return;
    }
    const data = await res.json();
    setEmployer(data.employer);
    setForm(data.employer);
    onUpdate();
    await loadDetail(employer.id);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!canDelete || !confirm("Permanently delete this employer?")) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/employers/${employer.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete");
      setSaving(false);
      return;
    }
    onUpdate();
    onClose();
  };

  const update = (field: keyof Employer, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const assignedStaffLabel = useMemo(() => {
    if (!employer.assigned_staff_id) return null;
    const s = staffOptions.find((o) => o.id === employer.assigned_staff_id);
    if (s) return s.full_name?.trim() || s.email;
    return "Staff member";
  }, [employer.assigned_staff_id, staffOptions]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-0 sm:p-8 sm:pb-0">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-jtsg-ink sm:text-2xl">
              {editing ? "Edit employer" : employer.company_name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-m-1 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {error ? <div className={`mt-4 ${alertErrorClass}`}>{error}</div> : null}

          {editing ? (
            <div className="mt-6 space-y-4">
              <input
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                placeholder="Company name"
                className={inputClassCompact}
              />
              <input
                value={form.address_street}
                onChange={(e) => update("address_street", e.target.value)}
                placeholder="Street"
                className={inputClassCompact}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={form.address_city}
                  onChange={(e) => update("address_city", e.target.value)}
                  placeholder="City"
                  className={inputClassCompact}
                />
                <input
                  value={form.address_state}
                  onChange={(e) => update("address_state", e.target.value)}
                  placeholder="State"
                  className={inputClassCompact}
                />
                <input
                  value={form.address_county}
                  onChange={(e) => update("address_county", e.target.value)}
                  placeholder="County"
                  className={inputClassCompact}
                />
              </div>
              <input
                value={form.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Phone"
                className={inputClassCompact}
              />
              <input
                value={form.website ?? ""}
                onChange={(e) => update("website", e.target.value)}
                placeholder="Website"
                className={inputClassCompact}
              />
              <input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="Industry"
                className={inputClassCompact}
              />
              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Contact
                </p>
              </div>
              <input
                value={form.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
                placeholder="Contact name"
                className={inputClassCompact}
              />
              <input
                value={form.contact_title ?? ""}
                onChange={(e) => update("contact_title", e.target.value)}
                placeholder="Contact title"
                className={inputClassCompact}
              />
              <input
                value={form.contact_phone ?? ""}
                onChange={(e) => update("contact_phone", e.target.value)}
                placeholder="Contact phone"
                className={inputClassCompact}
              />
              <input
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                placeholder="Contact email"
                type="email"
                className={inputClassCompact}
              />
              {canEdit ? (
                <select
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as (typeof EMPLOYER_STATUSES)[number])
                  }
                  className={inputClassCompact}
                >
                  {EMPLOYER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {EMPLOYER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : null}
              <label className={labelClass}>
                Internal notes (staff only)
                <textarea
                  value={form.internal_notes ?? ""}
                  onChange={(e) => update("internal_notes", e.target.value)}
                  rows={4}
                  className={`${inputClassCompact} mt-1 min-h-[100px] resize-y`}
                  placeholder="Context for the team — not shown to employers."
                />
              </label>
              <label className={labelClass}>
                Next follow-up
                <input
                  type="date"
                  value={(form.next_follow_up_date ?? "").slice(0, 10)}
                  onChange={(e) => update("next_follow_up_date", e.target.value || null)}
                  className={`${inputClassCompact} mt-1`}
                />
              </label>
              <label className={labelClass}>
                Assigned staff
                <select
                  value={form.assigned_staff_id ?? ""}
                  onChange={(e) => update("assigned_staff_id", e.target.value || null)}
                  className={`${inputClassCompact} mt-1`}
                >
                  <option value="">— Unassigned —</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name?.trim() || s.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="mt-6 space-y-2.5 text-sm leading-relaxed text-stone-700">
              <p>
                <span className="font-medium text-stone-500">Address:</span>{" "}
                {employer.address_street}, {employer.address_city}, {employer.address_state} ·{" "}
                {employer.address_county} County
              </p>
              {employer.phone ? (
                <p>
                  <span className="font-medium text-stone-500">Phone:</span> {employer.phone}
                </p>
              ) : null}
              {employer.website ? (
                <p>
                  <span className="font-medium text-stone-500">Website:</span>{" "}
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-jtsg-green underline decoration-jtsg-green/30 underline-offset-2 hover:decoration-jtsg-green"
                  >
                    {employer.website}
                  </a>
                </p>
              ) : null}
              <p>
                <span className="font-medium text-stone-500">Industry:</span> {employer.industry}
              </p>
              <p>
                <span className="font-medium text-stone-500">Contact:</span> {employer.contact_name}
                {employer.contact_title ? `, ${employer.contact_title}` : ""}
              </p>
              <p>
                <span className="font-medium text-stone-500">Email:</span>{" "}
                <a
                  href={`mailto:${employer.contact_email}`}
                  className="font-medium text-jtsg-green underline decoration-jtsg-green/30 underline-offset-2 hover:decoration-jtsg-green"
                >
                  {employer.contact_email}
                </a>
              </p>
              {employer.contact_phone ? (
                <p>
                  <span className="font-medium text-stone-500">Contact phone:</span>{" "}
                  {employer.contact_phone}
                </p>
              ) : null}
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-stone-500">Status:</span>
                {canEdit && !editing ? (
                  <select
                    value={employer.status}
                    onChange={(e) =>
                      handleStatusChange(e.target.value as (typeof EMPLOYER_STATUSES)[number])
                    }
                    disabled={saving}
                    className={`${inputClassCompact} w-auto max-w-full py-1.5 text-sm disabled:opacity-60`}
                  >
                    {EMPLOYER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {EMPLOYER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(employer.status)}`}
                  >
                    {employer.status}
                  </span>
                )}
              </p>
              {employer.internal_notes || canEdit ? (
                <div className="border-t border-stone-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Internal notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-800">
                    {employer.internal_notes?.trim() || "—"}
                  </p>
                </div>
              ) : null}
              {employer.next_follow_up_date || employer.assigned_staff_id ? (
                <div className="flex flex-wrap gap-4 border-t border-stone-100 pt-3 text-sm">
                  {employer.next_follow_up_date ? (
                    <p>
                      <span className="font-medium text-stone-500">Follow-up:</span>{" "}
                      {new Date(employer.next_follow_up_date).toLocaleDateString()}
                    </p>
                  ) : null}
                  {employer.assigned_staff_id && assignedStaffLabel ? (
                    <p>
                      <span className="font-medium text-stone-500">Assigned:</span>{" "}
                      {assignedStaffLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {activity.length > 0 ? (
                <div className="border-t border-stone-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Recent activity
                  </p>
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm text-stone-700">
                    {activity.map((a) => (
                      <li
                        key={a.id}
                        className="border-l-2 border-jtsg-sage/60 pl-3"
                      >
                        <span>{activitySummary(a)}</span>
                        <span className="mt-0.5 block text-xs text-stone-500">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-2 border-t border-stone-100 bg-white/95 py-4 backdrop-blur">
            {canEdit && !editing ? (
              <button type="button" onClick={() => setEditing(true)} className={btnMutedSmClass}>
                Edit
              </button>
            ) : null}
            {editing ? (
              <>
                <button type="button" onClick={handleSave} disabled={saving} className={btnPrimarySmClass}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm(employer);
                  }}
                  className={btnSecondarySmClass}
                >
                  Cancel
                </button>
              </>
            ) : null}
            {canDelete && !editing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className={`${btnDangerSmClass} ml-auto`}
              >
                Delete
              </button>
            ) : null}
            <button type="button" onClick={onClose} className={btnSecondarySmClass}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
