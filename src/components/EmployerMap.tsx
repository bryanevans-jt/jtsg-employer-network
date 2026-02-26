"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Employer } from "@/types/database";

const MapInner = dynamic(() => import("./EmployerMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-stone-100 text-stone-500">
      Loading map…
    </div>
  ),
});

interface EmployerMapProps {
  employers: Employer[];
  onGeocoded?: () => void;
}

export function EmployerMap({ employers, onGeocoded }: EmployerMapProps) {
  const [employersWithCoords, setEmployersWithCoords] = useState<Employer[]>(
    () => employers.filter((e) => e.latitude != null && e.longitude != null)
  );
  const [geocoding, setGeocoding] = useState(false);
  const onGeocodedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setEmployersWithCoords(
      employers.filter((e) => e.latitude != null && e.longitude != null)
    );
  }, [employers]);

  const needGeocoding = employers.filter(
    (e) => e.latitude == null || e.longitude == null
  );

  const runGeocoding = async () => {
    if (needGeocoding.length === 0) return;
    setGeocoding(true);
    for (const emp of needGeocoding) {
      try {
        const res = await fetch("/api/employers/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: emp.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setEmployersWithCoords((prev) =>
            prev.some((e) => e.id === emp.id)
              ? prev
              : [
                  ...prev,
                  {
                    ...emp,
                    latitude: data.latitude,
                    longitude: data.longitude,
                  },
                ]
          );
        }
      } catch {
        // skip
      }
      await new Promise((r) => setTimeout(r, 1100));
    }
    setGeocoding(false);
    onGeocodedRef.current?.();
    onGeocoded?.();
  };

  return (
    <div className="h-full w-full flex flex-col">
      {needGeocoding.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2 bg-stone-50 border-b border-stone-200">
          <span className="text-sm text-stone-600">
            {employersWithCoords.length} of {employers.length} employers on map.
            {needGeocoding.length > 0 &&
              ` ${needGeocoding.length} need location.`}
          </span>
          <button
            type="button"
            onClick={runGeocoding}
            disabled={geocoding}
            className="rounded bg-jtsg-green px-3 py-1.5 text-sm text-white hover:bg-jtsg-green/90 disabled:opacity-60"
          >
            {geocoding ? "Locating…" : "Locate addresses"}
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <MapInner
          employers={employersWithCoords}
          onGeocodedRef={(fn) => {
            onGeocodedRef.current = fn;
          }}
        />
      </div>
    </div>
  );
}
