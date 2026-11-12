// URL hash <-> navigation place. Pure, so it is unit tested; nav.svelte.ts keeps the live state.

export type Section = "overview" | "locations" | "deficiencies" | "register" | "report" | "library";
export type LocationView = "inspections" | "risk";

export interface Place {
  section: Section;
  /** Location detail (Mekânlar) or null for the list of locations. */
  locationId: string | null;
  locationView: LocationView;
  /** Checklist template: the inspection shown in a location, or the template opened in Kütüphane. */
  listId: string | null;
}

export const HOME: Place = {
  section: "overview",
  locationId: null,
  locationView: "inspections",
  listId: null,
};

const SEGMENTS: Record<Section, string> = {
  overview: "genel",
  locations: "mekanlar",
  deficiencies: "eksikler",
  register: "riskler",
  report: "rapor",
  library: "kutuphane",
};
const VIEW_SEGMENTS: Record<LocationView, string> = { inspections: "denetim", risk: "risk" };

const sectionOf = (segment: string): Section | null =>
  (Object.keys(SEGMENTS) as Section[]).find((s) => SEGMENTS[s] === segment) ?? null;

/**
 * "#mekanlar/<loc>/denetim/<list>", "#mekanlar/<loc>/risk", "#kutuphane/<list>", "#eksikler", ...
 * Unknown hashes open the overview.
 */
export function parseHash(hash: string): Place {
  const parts = hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const section = sectionOf(parts[0] ?? "");
  if (!section) return HOME;
  if (section === "locations") {
    const view = parts[2] === VIEW_SEGMENTS.risk ? "risk" : "inspections";
    return {
      section,
      locationId: parts[1] || null,
      locationView: view,
      listId: view === "inspections" ? parts[3] || null : null,
    };
  }
  if (section === "library") return { ...HOME, section, listId: parts[1] || null };
  return { ...HOME, section };
}

export function formatHash(p: Place): string {
  const enc = encodeURIComponent;
  const base = `#${SEGMENTS[p.section]}`;
  if (p.section === "locations" && p.locationId) {
    const view = VIEW_SEGMENTS[p.locationView];
    const list = p.locationView === "inspections" && p.listId ? `/${enc(p.listId)}` : "";
    return `${base}/${enc(p.locationId)}/${view}${list}`;
  }
  if (p.section === "library" && p.listId) return `${base}/${enc(p.listId)}`;
  return base;
}
