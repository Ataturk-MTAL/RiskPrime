import { setChecklistLocations } from "./links";
import type { Assessment, Checklist } from "./types";

// Keep in sync with suggestIds() in scripts/generate-starter.mjs (a test guards drift).
const CODE = /\bELE\d+\b/gi;
const lower = (s: string) => s.toLocaleLowerCase("tr");
const codeOf = (name: string) => name.match(/^\s*(ELE\d+)\b/i)?.[1].toUpperCase();

/** Location ids a checklist most likely belongs to; [] (general) when unsure. */
export function suggestLocations(a: Assessment, list: Pick<Checklist, "name">): string[] {
  const name = lower(list.name);
  if (name.startsWith("ortak")) return [];
  const codes = new Set((list.name.match(CODE) ?? []).map((c) => c.toUpperCase()));
  const byCode = a.locations.filter((l) => codes.has(codeOf(l.name) ?? ""));
  if (byCode.length) return byCode.map((l) => l.id);
  const byName = a.locations.filter((l) => lower(l.name) === name);
  if (byName.length) return byName.map((l) => l.id);
  if (name.includes("depo"))
    return a.locations.filter((l) => l.type === "storage").map((l) => l.id);
  if (/odalar|odası/.test(name))
    return a.locations.filter((l) => l.type === "office").map((l) => l.id);
  return [];
}

/** Applies suggestions to lists that have no locations yet (optionally only the given lists). */
export function autoAssign(a: Assessment, onlyListIds?: string[]): Assessment {
  return a.checklists.reduce((acc, c) => {
    if (c.locationIds?.length || (onlyListIds && !onlyListIds.includes(c.id))) return acc;
    const ids = suggestLocations(acc, c);
    return ids.length ? setChecklistLocations(acc, c.id, ids) : acc;
  }, a);
}
