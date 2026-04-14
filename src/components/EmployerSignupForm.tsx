"use client";

import { useState } from "react";
import { inputClass, labelClass, btnPrimaryClass, alertErrorClass } from "@/lib/ui";

export interface EmployerFormData {
  company_name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_county: string;
  phone: string;
  website: string;
  industry: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_title: string;
}

interface EmployerSignupFormProps {
  industries: string[];
  onSuccess?: (meta?: { crsEmailNote?: string }) => void;
}

const INITIAL: EmployerFormData = {
  company_name: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_county: "",
  phone: "",
  website: "",
  industry: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  contact_title: "",
};

export function EmployerSignupForm({
  industries,
  onSuccess,
}: EmployerSignupFormProps) {
  const [form, setForm] = useState<EmployerFormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof EmployerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          address_street: form.address_street.trim(),
          address_city: form.address_city.trim(),
          address_state: form.address_state.trim(),
          address_county: form.address_county.trim(),
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          industry: form.industry,
          contact_name: form.contact_name.trim(),
          contact_phone: form.contact_phone.trim() || null,
          contact_email: form.contact_email.trim(),
          contact_title: form.contact_title.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      onSuccess?.({
        crsEmailNote: typeof data.crsEmailNote === "string" ? data.crsEmailNote : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-stone-200/90 bg-white/90 p-6 shadow-sm sm:p-8">
      {error ? <div className={alertErrorClass}>{error}</div> : null}

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-jtsg-ink">Company information</h3>
        <div>
          <label htmlFor="company_name" className={labelClass}>
            Company name *
          </label>
          <input
            id="company_name"
            type="text"
            required
            value={form.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="address_street" className={labelClass}>
            Street address *
          </label>
          <input
            id="address_street"
            type="text"
            required
            value={form.address_street}
            onChange={(e) => update("address_street", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="address_city" className={labelClass}>
              City *
            </label>
            <input
              id="address_city"
              type="text"
              required
              value={form.address_city}
              onChange={(e) => update("address_city", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="address_state" className={labelClass}>
              State *
            </label>
            <input
              id="address_state"
              type="text"
              required
              placeholder="GA"
              value={form.address_state}
              onChange={(e) => update("address_state", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="address_county" className={labelClass}>
              County *
            </label>
            <input
              id="address_county"
              type="text"
              required
              value={form.address_county}
              onChange={(e) => update("address_county", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className={labelClass}>
              Company phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="website" className={labelClass}>
              Website
            </label>
            <input
              id="website"
              type="url"
              placeholder="https://"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="industry" className={labelClass}>
            Type of industry *
          </label>
          <select
            id="industry"
            required
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            className={inputClass}
          >
            <option value="">Select industry</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-jtsg-ink">Contact person</h3>
        <p className="text-sm text-stone-600">
          Hiring manager, owner, or other primary contact
        </p>
        <div>
          <label htmlFor="contact_name" className={labelClass}>
            Name *
          </label>
          <input
            id="contact_name"
            type="text"
            required
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact_title" className={labelClass}>
            Title
          </label>
          <input
            id="contact_title"
            type="text"
            value={form.contact_title}
            onChange={(e) => update("contact_title", e.target.value)}
            placeholder="e.g. Hiring Manager, Owner"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_phone" className={labelClass}>
              Phone
            </label>
            <input
              id="contact_phone"
              type="tel"
              value={form.contact_phone}
              onChange={(e) => update("contact_phone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contact_email" className={labelClass}>
              Email *
            </label>
            <input
              id="contact_email"
              type="email"
              required
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="pt-2">
        <button type="submit" disabled={loading} className={btnPrimaryClass}>
          {loading ? "Submitting…" : "Submit and join the network"}
        </button>
      </div>
    </form>
  );
}
