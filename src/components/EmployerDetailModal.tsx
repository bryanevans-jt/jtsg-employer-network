"use client";

import { useState, useEffect } from "react";
import type { Employer, AppRole } from "@/types/database";
import {
  canEditEmployers,
  canDeleteEmployers,
} from "@/lib/permissions";

interface EmployerDetailModalProps {
  employer: Employer;
  role: AppRole;
  onClose: () => void;
  onUpdate: () => void;
}

export function EmployerDetailModal({
  employer: initial,
  role,
  onClose,
  onUpdate,
}: EmployerDetailModalProps) {
  const [employer, setEmployer] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  const canEdit = canEditEmployers(role);
  const canDelete = canDeleteEmployers(role);

  useEffect(() => {
    setEmployer(initial);
    setForm(initial);
  }, [initial]);

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
    setSaving(false);
  };

  const handleStatusChange = async (status: "New Submission" | "Active Partner") => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-stone-900">
              {editing ? "Edit employer" : employer.company_name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          {editing ? (
            <div className="mt-4 space-y-3">
              <input
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                placeholder="Company name"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                value={form.address_street}
                onChange={(e) => update("address_street", e.target.value)}
                placeholder="Street"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={form.address_city}
                  onChange={(e) => update("address_city", e.target.value)}
                  placeholder="City"
                  className="rounded-lg border border-stone-300 px-3 py-2"
                />
                <input
                  value={form.address_state}
                  onChange={(e) => update("address_state", e.target.value)}
                  placeholder="State"
                  className="rounded-lg border border-stone-300 px-3 py-2"
                />
                <input
                  value={form.address_county}
                  onChange={(e) => update("address_county", e.target.value)}
                  placeholder="County"
                  className="rounded-lg border border-stone-300 px-3 py-2"
                />
              </div>
              <input
                value={form.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Phone"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                value={form.website ?? ""}
                onChange={(e) => update("website", e.target.value)}
                placeholder="Website"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="Industry"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <hr />
              <input
                value={form.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
                placeholder="Contact name"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                value={form.contact_title ?? ""}
                onChange={(e) => update("contact_title", e.target.value)}
                placeholder="Contact title"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                value={form.contact_phone ?? ""}
                onChange={(e) => update("contact_phone", e.target.value)}
                placeholder="Contact phone"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                placeholder="Contact email"
                type="email"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
              {canEdit && role !== "crs" && (
                <select
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as "New Submission" | "Active Partner")
                  }
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                >
                  <option value="New Submission">New Submission</option>
                  <option value="Active Partner">Active Partner</option>
                </select>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-stone-500">Address:</span>{" "}
                {employer.address_street}, {employer.address_city},{" "}
                {employer.address_state} {employer.address_county} County
              </p>
              {employer.phone && (
                <p>
                  <span className="text-stone-500">Phone:</span> {employer.phone}
                </p>
              )}
              {employer.website && (
                <p>
                  <span className="text-stone-500">Website:</span>{" "}
                  <a
                    href={employer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-jtsg-green hover:underline"
                  >
                    {employer.website}
                  </a>
                </p>
              )}
              <p>
                <span className="text-stone-500">Industry:</span> {employer.industry}
              </p>
              <p>
                <span className="text-stone-500">Contact:</span> {employer.contact_name}
                {employer.contact_title && `, ${employer.contact_title}`}
              </p>
              <p>
                <span className="text-stone-500">Email:</span>{" "}
                <a
                  href={`mailto:${employer.contact_email}`}
                  className="text-jtsg-green hover:underline"
                >
                  {employer.contact_email}
                </a>
              </p>
              {employer.contact_phone && (
                <p>
                  <span className="text-stone-500">Contact phone:</span>{" "}
                  {employer.contact_phone}
                </p>
              )}
              <p>
                <span className="text-stone-500">Status:</span>{" "}
                {canEdit && !editing ? (
                  <select
                    value={employer.status}
                    onChange={(e) => handleStatusChange(e.target.value as "New Submission" | "Active Partner")}
                    disabled={saving}
                    className="rounded border border-stone-300 px-2 py-1 text-sm font-medium text-stone-800 disabled:opacity-60"
                  >
                    <option value="New Submission">New Submission</option>
                    <option value="Active Partner">Active Partner</option>
                  </select>
                ) : (
                  <span
                    className={
                      employer.status === "New Submission"
                        ? "text-amber-700"
                        : "text-green-700"
                    }
                  >
                    {employer.status}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {canEdit && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-300"
              >
                Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-jtsg-green px-4 py-2 text-sm font-medium text-white hover:bg-jtsg-green/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm(employer); }}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </>
            )}
            {canDelete && !editing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg border border-red-300 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-60 ml-auto"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
