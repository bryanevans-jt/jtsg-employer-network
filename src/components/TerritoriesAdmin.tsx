"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile } from "@/types/database";
import { normalizeCountyKey } from "@/lib/coverage-territories";
import { GEORGIA_COUNTIES } from "@/lib/georgia-counties";
import {
  btnDangerSmClass,
  btnPrimarySmClass,
  btnSecondarySmClass,
  inputClass,
  labelClass,
  alertErrorClass,
  alertSuccessClass,
} from "@/lib/ui";

type TerritoryRow = {
  id: string;
  name: string;
  sort_order: number;
  counties: string[];
  assignees: {
    id: string;
    profile_id: string;
    assignee_role: "crs" | "supervisor";
    email: string;
    full_name: string | null;
  }[];
};

type HealthPayload = {
  territories: number;
  mappedCounties: number;
  crsAssignments: number;
  territoriesWithoutCrs: number;
  unmappedCountyEvents: number;
  emailEventsToday: number;
};

type EmailControlSettings = {
  crs_digest_mode: "instant" | "hourly" | "daily";
  resend_daily_quota: number | null;
};

export function TerritoriesAdmin() {
  const [territories, setTerritories] = useState<TerritoryRow[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [controls, setControls] = useState<EmailControlSettings>({
    crs_digest_mode: "instant",
    resend_daily_quota: null,
  });
  const [controlsBusy, setControlsBusy] = useState(false);
  const [countyPreview, setCountyPreview] = useState("");
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [tRes, uRes, hRes, cRes] = await Promise.all([
      fetch("/api/territories"),
      fetch("/api/users/list"),
      fetch("/api/territories/health"),
      fetch("/api/settings/email-controls"),
    ]);
    if (!tRes.ok) {
      setError("Could not load territories.");
      setLoading(false);
      return;
    }
    if (!uRes.ok) {
      setError("Could not load staff list.");
      setLoading(false);
      return;
    }
    const tData = await tRes.json();
    const uData = await uRes.json();
    const hData = hRes.ok ? await hRes.json().catch(() => ({})) : {};
    const cData = cRes.ok ? await cRes.json().catch(() => ({})) : {};
    setTerritories(tData.territories ?? []);
    setUsers(uData.users ?? []);
    if (hData.health) setHealth(hData.health);
    if (cData.settings) setControls(cData.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const crsStaff = users.filter((u) => u.role === "crs" && u.is_active !== false);
  const supStaff = users.filter((u) => u.role === "supervisor" && u.is_active !== false);
  const territoryForPreview = useMemo(() => {
    const key = normalizeCountyKey(countyPreview);
    if (!key) return null;
    return territories.find((t) => t.counties.includes(key)) ?? null;
  }, [countyPreview, territories]);

  const createTerritory = async () => {
    const name = newName.trim();
    if (!name) return;
    setSavingId("__new__");
    setError(null);
    const res = await fetch("/api/territories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSavingId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Create failed.");
      return;
    }
    setNewName("");
    setInfoMsg("Territory created.");
    await load();
  };

  const saveTerritory = async (t: TerritoryRow, draft: TerritoryDraft) => {
    setSavingId(t.id);
    setError(null);
    const countyList = draft.countiesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const assignees: { profile_id: string; assignee_role: "crs" | "supervisor" }[] = [
      ...draft.crsIds.map((profile_id: string) => ({ profile_id, assignee_role: "crs" as const })),
      ...draft.supervisorIds.map((profile_id: string) => ({
        profile_id,
        assignee_role: "supervisor" as const,
      })),
    ];
    const res = await fetch(`/api/territories/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        sort_order: draft.sort_order,
        counties: countyList,
        assignees,
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Save failed.");
      return;
    }
    setInfoMsg("Territory saved.");
    await load();
  };

  const deleteTerritory = async (id: string) => {
    if (!confirm("Delete this territory and its county / staff links?")) return;
    setSavingId(id);
    setError(null);
    const res = await fetch(`/api/territories/${id}`, { method: "DELETE" });
    setSavingId(null);
    if (!res.ok) {
      setError("Delete failed.");
      return;
    }
    setInfoMsg("Territory deleted.");
    await load();
  };

  const saveControls = async () => {
    setControlsBusy(true);
    setError(null);
    setInfoMsg(null);
    const res = await fetch("/api/settings/email-controls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(controls),
    });
    setControlsBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save email controls.");
      return;
    }
    setInfoMsg("Email controls saved.");
    await load();
  };

  if (loading) {
    return <p className="mt-4 text-stone-500">Loading territories…</p>;
  }

  return (
    <div className="mt-6 space-y-8">
      {error ? <div className={alertErrorClass}>{error}</div> : null}
      {infoMsg ? <div className={alertSuccessClass}>{infoMsg}</div> : null}

      {health ? (
        <section className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur-sm sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">Routing health</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Territories" value={health.territories} />
            <Metric label="Mapped counties" value={health.mappedCounties} />
            <Metric label="CRS assignments" value={health.crsAssignments} />
            <Metric label="Territories w/o CRS" value={health.territoriesWithoutCrs} danger />
            <Metric label="Unmapped county events" value={health.unmappedCountyEvents} warning />
            <Metric label="Email events today" value={health.emailEventsToday} />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">Delivery controls</h2>
        <p className="mt-1 text-sm text-stone-600">
          Choose whether CRS notifications send immediately or queue for digest. Set an optional
          app-side daily quota to avoid exhausting your Resend plan on busy days.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            CRS notification mode
            <select
              value={controls.crs_digest_mode}
              onChange={(e) =>
                setControls((prev) => ({
                  ...prev,
                  crs_digest_mode: e.target.value as EmailControlSettings["crs_digest_mode"],
                }))
              }
              className={inputClass}
            >
              <option value="instant">Instant</option>
              <option value="hourly">Hourly digest (queue)</option>
              <option value="daily">Daily digest (queue)</option>
            </select>
          </label>
          <label className={labelClass}>
            Resend daily quota (optional)
            <input
              type="number"
              min={1}
              value={controls.resend_daily_quota ?? ""}
              onChange={(e) =>
                setControls((prev) => ({
                  ...prev,
                  resend_daily_quota: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={inputClass}
              placeholder="Blank = no app-side cap"
            />
          </label>
        </div>
        <div className="mt-4">
          <button type="button" onClick={saveControls} disabled={controlsBusy} className={btnPrimarySmClass}>
            {controlsBusy ? "Saving…" : "Save delivery controls"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">Add territory</h2>
        <p className="mt-1 text-sm text-stone-600">
          A territory is a named coverage area. Add Georgia counties (one per line or
          comma-separated), then assign CRS and Supervisor staff. Each county can belong to only one
          territory.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="new_territory_name" className={labelClass}>
              Name
            </label>
            <input
              id="new_territory_name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. North Metro"
              className={`${inputClass} w-64 max-w-full`}
            />
          </div>
          <button
            type="button"
            onClick={createTerritory}
            disabled={savingId !== null || !newName.trim()}
            className={btnPrimarySmClass}
          >
            {savingId === "__new__" ? "Creating…" : "Create territory"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur-sm sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">Routing preview</h2>
        <p className="mt-1 text-sm text-stone-600">
          Test where a county routes before saving other changes.
        </p>
        <label className={`${labelClass} mt-4`}>
          County
          <input
            list="ga-counties"
            value={countyPreview}
            onChange={(e) => setCountyPreview(e.target.value)}
            className={inputClass}
            placeholder="Start typing county name"
          />
          <datalist id="ga-counties">
            {GEORGIA_COUNTIES.map((county) => (
              <option key={county} value={county} />
            ))}
          </datalist>
        </label>
        <p className="mt-3 text-sm text-stone-700">
          {countyPreview.trim()
            ? territoryForPreview
              ? `Routes to "${territoryForPreview.name}" with ${
                  territoryForPreview.assignees.filter((a) => a.assignee_role === "crs").length
                } CRS assignee(s).`
              : "No territory currently claims this county. It will fall back to all active CRS."
            : "Enter a county to preview routing."}
        </p>
      </section>

      {territories.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-stone-300 bg-white/80 p-6 text-sm text-stone-600">
          No territories yet. Create one above, then map counties and CRS assignees so new partner
          signups route to the right inboxes.
        </section>
      ) : (
        territories.map((t) => (
          <TerritoryEditor
            key={t.id}
            territory={t}
            crsStaff={crsStaff}
            supStaff={supStaff}
            disabled={savingId !== null}
            busy={savingId === t.id}
            onSave={(draft) => saveTerritory(t, draft)}
            onDelete={() => deleteTerritory(t.id)}
          />
        ))
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  warning = false,
  danger = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
  danger?: boolean;
}) {
  const tone = danger ? "text-red-700" : warning ? "text-amber-700" : "text-jtsg-ink";
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

type TerritoryDraft = {
  name: string;
  sort_order: number;
  countiesText: string;
  crsIds: string[];
  supervisorIds: string[];
};

function TerritoryEditor({
  territory,
  crsStaff,
  supStaff,
  disabled,
  busy,
  onSave,
  onDelete,
}: {
  territory: TerritoryRow;
  crsStaff: Profile[];
  supStaff: Profile[];
  disabled: boolean;
  busy: boolean;
  onSave: (d: TerritoryDraft) => void;
  onDelete: () => void;
}) {
  const initialCrs = useMemo(
    () =>
      new Set(
        territory.assignees.filter((a) => a.assignee_role === "crs").map((a) => a.profile_id)
      ),
    [territory]
  );
  const initialSup = useMemo(
    () =>
      new Set(
        territory.assignees
          .filter((a) => a.assignee_role === "supervisor")
          .map((a) => a.profile_id)
      ),
    [territory]
  );

  const [name, setName] = useState(territory.name);
  const [sort_order, setSortOrder] = useState(territory.sort_order);
  const [countiesText, setCountiesText] = useState(territory.counties.join("\n"));
  const [crsIds, setCrsIds] = useState(initialCrs);
  const [supervisorIds, setSupervisorIds] = useState(initialSup);
  const [countyInput, setCountyInput] = useState("");

  useEffect(() => {
    setName(territory.name);
    setSortOrder(territory.sort_order);
    setCountiesText(territory.counties.join("\n"));
    setCrsIds(initialCrs);
    setSupervisorIds(initialSup);
  }, [territory, initialCrs, initialSup]);

  const toggle = (set: Set<string>, id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  };

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur-sm sm:p-8 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">
          {name.trim() || "Territory"}
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
            {territory.counties.length} counties
          </span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
            {Array.from(crsIds).length} CRS
          </span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
            {Array.from(supervisorIds).length} supervisors
          </span>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className={btnDangerSmClass}
        >
          Delete
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Sort order
          <input
            type="number"
            value={sort_order}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        Counties (Georgia) — one per line or comma-separated; stored normalized for matching signup
        “County” field
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            list="ga-counties"
            value={countyInput}
            onChange={(e) => setCountyInput(e.target.value)}
            className={`${inputClass} w-72 max-w-full`}
            placeholder="Add county quickly"
          />
          <button
            type="button"
            className={btnSecondarySmClass}
            onClick={() => {
              const v = countyInput.trim();
              if (!v) return;
              const current = countiesText.trim();
              setCountiesText(current ? `${current}\n${v}` : v);
              setCountyInput("");
            }}
          >
            Add county
          </button>
        </div>
        <textarea
          value={countiesText}
          onChange={(e) => setCountiesText(e.target.value)}
          rows={5}
          className={`${inputClass} mt-1 min-h-[120px] font-mono text-sm`}
          placeholder={"fulton\nclayton\nde kalb"}
        />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className={`${labelClass} mb-2`}>CRS assignees (receive new signup email)</p>
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-3 text-sm">
            {crsStaff.length === 0 ? (
              <li className="text-stone-500">No active CRS users in the system.</li>
            ) : (
              crsStaff.map((u) => (
                <li key={u.id}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={crsIds.has(u.id)}
                      onChange={(e) => setCrsIds(toggle(crsIds, u.id, e.target.checked))}
                      className="h-4 w-4 rounded border-stone-300 text-jtsg-green focus:ring-jtsg-green"
                    />
                    <span>{u.full_name?.trim() || u.email}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <p className={`${labelClass} mb-2`}>Supervisor assignees (coverage; not emailed on signup)</p>
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-stone-200 p-3 text-sm">
            {supStaff.length === 0 ? (
              <li className="text-stone-500">No active supervisors in the system.</li>
            ) : (
              supStaff.map((u) => (
                <li key={u.id}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={supervisorIds.has(u.id)}
                      onChange={(e) =>
                        setSupervisorIds(toggle(supervisorIds, u.id, e.target.checked))
                      }
                      className="h-4 w-4 rounded border-stone-300 text-jtsg-green focus:ring-jtsg-green"
                    />
                    <span>{u.full_name?.trim() || u.email}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          disabled={disabled || !name.trim()}
          onClick={() =>
            onSave({
              name,
              sort_order,
              countiesText,
              crsIds: Array.from(crsIds),
              supervisorIds: Array.from(supervisorIds),
            })
          }
          className={btnPrimarySmClass}
        >
          {busy ? "Saving…" : "Save territory"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setName(territory.name);
            setSortOrder(territory.sort_order);
            setCountiesText(territory.counties.join("\n"));
            setCrsIds(
              new Set(
                territory.assignees
                  .filter((a) => a.assignee_role === "crs")
                  .map((a) => a.profile_id)
              )
            );
            setSupervisorIds(
              new Set(
                territory.assignees
                  .filter((a) => a.assignee_role === "supervisor")
                  .map((a) => a.profile_id)
              )
            );
          }}
          className={btnSecondarySmClass}
        >
          Discard changes
        </button>
      </div>
    </section>
  );
}
