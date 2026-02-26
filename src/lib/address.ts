/**
 * Normalize address fields to a consistent, USPS-style format.
 * Expands common street abbreviations so geocoding and display are uniform.
 */

const STREET_SUFFIX: Record<string, string> = {
  alley: "Alley",
  aly: "Alley",
  avenue: "Avenue",
  ave: "Avenue",
  av: "Avenue",
  boulevard: "Boulevard",
  blvd: "Boulevard",
  boul: "Boulevard",
  circle: "Circle",
  cir: "Circle",
  court: "Court",
  ct: "Court",
  drive: "Drive",
  dr: "Drive",
  expressway: "Expressway",
  expy: "Expressway",
  freeway: "Freeway",
  fwy: "Freeway",
  highway: "Highway",
  hwy: "Highway",
  lane: "Lane",
  ln: "Lane",
  parkway: "Parkway",
  pkwy: "Parkway",
  pky: "Parkway",
  place: "Place",
  pl: "Place",
  road: "Road",
  rd: "Road",
  street: "Street",
  st: "Street",
  suite: "Suite",
  ste: "Suite",
  terrace: "Terrace",
  ter: "Terrace",
  trail: "Trail",
  trl: "Trail",
  turnpike: "Turnpike",
  tpke: "Turnpike",
  way: "Way",
};

function normalizeStreetSuffix(street: string): string {
  if (!street || typeof street !== "string") return street;
  const trimmed = street.trim();
  const words = trimmed.split(/\s+/);
  const result = words.map((w) => {
    const key = w.replace(/[.,]/g, "").toLowerCase();
    const expanded = STREET_SUFFIX[key];
    if (expanded) return expanded + (w.endsWith(".") ? "." : "");
    return w;
  });
  return result.join(" ");
}

/** Normalize street line (expand Ave, St, Blvd, Pkwy, etc.) */
export function normalizeStreet(street: string): string {
  if (!street || typeof street !== "string") return street;
  return normalizeStreetSuffix(street.trim());
}

/** Normalize city to title case */
export function normalizeCity(city: string): string {
  if (!city || typeof city !== "string") return city;
  return city
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Normalize state: uppercase for 2-letter, else title case */
export function normalizeState(state: string): string {
  if (!state || typeof state !== "string") return state;
  const s = state.trim();
  if (s.length === 2) return s.toUpperCase();
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Normalize county to title case */
export function normalizeCounty(county: string): string {
  if (!county || typeof county !== "string") return county;
  return county
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export interface NormalizedAddress {
  address_street: string;
  address_city: string;
  address_state: string;
  address_county: string;
}

/** Normalize all address fields at once */
export function normalizeAddress(fields: {
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_county?: string | null;
}): NormalizedAddress {
  return {
    address_street: normalizeStreet(fields.address_street ?? "") ?? "",
    address_city: normalizeCity(fields.address_city ?? "") ?? "",
    address_state: normalizeState(fields.address_state ?? "") ?? "",
    address_county: normalizeCounty(fields.address_county ?? "") ?? "",
  };
}
