"use client";

import { useEffect, useState } from "react";

type AnalyticsPayload = {
  totalInSample: number;
  cappedAt: number;
  byStatus: Record<string, number>;
  byCounty: Record<string, number>;
  byIndustry: Record<string, number>;
  signupsByMonth: Record<string, number>;
};

export function DashboardAnalytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/employers/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Could not load analytics."));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 text-sm text-stone-600 shadow-md backdrop-blur">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-stone-200/90 bg-white/95 p-6 text-sm text-stone-500 shadow-md backdrop-blur">
        Loading summary…
      </div>
    );
  }

  const topCounties = Object.entries(data.byCounty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topIndustries = Object.entries(data.byIndustry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const months = Object.entries(data.signupsByMonth).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <section className="space-y-6 rounded-2xl border border-stone-200/90 bg-white/95 p-6 shadow-md backdrop-blur sm:p-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-jtsg-ink">Partners summary</h2>
        <p className="text-sm text-stone-600 mt-1">
          Based on the {data.totalInSample} most recent records
          {data.totalInSample >= data.cappedAt ? ` (capped at ${data.cappedAt})` : ""}.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-2">By status</h3>
          <ul className="text-sm space-y-1 text-stone-600">
            {Object.entries(data.byStatus)
              .filter(([, n]) => n > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span className="font-medium text-stone-800">{n}</span>
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-2">Top counties</h3>
          <ul className="text-sm space-y-1 text-stone-600">
            {topCounties.map(([k, n]) => (
              <li key={k} className="flex justify-between gap-2">
                <span>{k}</span>
                <span className="font-medium text-stone-800">{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-2">Top industries</h3>
          <ul className="text-sm space-y-1 text-stone-600">
            {topIndustries.map(([k, n]) => (
              <li key={k} className="flex justify-between gap-2">
                <span className="truncate" title={k}>
                  {k}
                </span>
                <span className="font-medium text-stone-800 shrink-0">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {months.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-2">Signups by month</h3>
          <ul className="flex flex-wrap gap-3 text-sm text-stone-600">
            {months.map(([m, n]) => (
              <li
                key={m}
                className="rounded-lg bg-amber-50/80 border border-amber-100 px-3 py-1.5"
              >
                <span className="font-medium text-stone-800">{m}</span>: {n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
