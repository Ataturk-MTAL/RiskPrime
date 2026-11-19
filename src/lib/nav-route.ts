// URL hash <-> navigation place. Pure, so it is unit tested; nav.svelte.ts keeps the live state.

export type Section =
  | "overview"
  | "school"
  | "locations"
  | "deficiencies"
  | "register"
  | "report"
  | "library";

export interface Place {
  section: Section;
  /** Mekânlar: the open location (null = the list). Riskler: the location filter (null = all). */
  locationId: string | null;
  /** Checklist: the one open in a location, or the template opened in Kütüphane. */
  listId: string | null;
}

export const HOME: Place = { section: "overview", locationId: null, listId: null };

const SEGMENTS: Record<Section, string> = {
  overview: "genel",
  school: "okul",
  locations: "mekanlar",
  deficiencies: "eksikler",
  register: "riskler",
  report: "rapor",
  library: "kutuphane",
};
const INSPECTION_SEGMENT = "denetim";
/** "#mekanlar/<loc>/risk" was a location's risk tab; saved links now open Riskler for it. */
const LEGACY_RISK_SEGMENT = "risk";

const sectionOf = (segment: string): Section | null =>
  (Object.keys(SEGMENTS) as Section[]).find((s) => SEGMENTS[s] === segment) ?? null;

/**
 * "#mekanlar/<loc>/denetim/<list>", "#riskler/<loc>", "#kutuphane/<list>", "#eksikler", ...
 * Unknown hashes open the overview.
 */
export function parseHash(hash: string): Place {
  const parts = hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const section = sectionOf(parts[0] ?? "");
  if (!section) return HOME;
  const locationId = parts[1] || null;
  if (section === "locations" && parts[2] === LEGACY_RISK_SEGMENT)
    return { ...HOME, section: "register", locationId };
  if (section === "locations") return { section, locationId, listId: parts[3] || null };
  if (section === "register") return { ...HOME, section, locationId };
  if (section === "library") return { ...HOME, section, listId: parts[1] || null };
  return { ...HOME, section };
}

export function formatHash(p: Place): string {
  const enc = encodeURIComponent;
  const base = `#${SEGMENTS[p.section]}`;
  if (p.section === "locations" && p.locationId) {
    const list = p.listId ? `/${enc(p.listId)}` : "";
    return `${base}/${enc(p.locationId)}/${INSPECTION_SEGMENT}${list}`;
  }
  if (p.section === "register" && p.locationId) return `${base}/${enc(p.locationId)}`;
  if (p.section === "library" && p.listId) return `${base}/${enc(p.listId)}`;
  return base;
}
