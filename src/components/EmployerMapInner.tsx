"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Employer } from "@/types/database";

// Fix default marker icon in Next/React
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface EmployerMapInnerProps {
  employers: Employer[];
  onGeocodedRef: (fn: () => void) => void;
}

export default function EmployerMapInner({
  employers,
  onGeocodedRef,
}: EmployerMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    onGeocodedRef(() => {});
  }, [onGeocodedRef]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView([32.16, -84.32], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const withCoords = employers.filter(
      (e) => e.latitude != null && e.longitude != null
    );

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (withCoords.length === 0) {
      map.setView([32.16, -84.32], 6);
      return;
    }

    const bounds: L.LatLngExpression[] = [];
    withCoords.forEach((emp) => {
      const lat = emp.latitude!;
      const lng = emp.longitude!;
      const marker = L.marker([lat, lng]);
      const popup = `
        <div class="p-2 min-w-[180px]">
          <p class="font-semibold text-stone-900">${escapeHtml(emp.company_name)}</p>
          <p class="text-sm text-stone-600 mt-1">${escapeHtml(
            [emp.address_street, emp.address_city, emp.address_state].filter(Boolean).join(", ")
          )}</p>
          ${emp.phone ? `<p class="text-sm mt-1">${escapeHtml(emp.phone)}</p>` : ""}
          <p class="text-sm text-stone-500 mt-1">${escapeHtml(emp.industry)}</p>
        </div>
      `;
      marker.bindPopup(popup);
      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [24, 24] });
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [employers]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
