// Adds library templates (locations and checklists) to an assessment. Pure; returns a new Assessment.
import { addLocationFromTemplate } from "./assessment";
import { autoAssign } from "./auto-assign";
import { addChecklist } from "./checklist";
import { liveLocationIds } from "./inspections";
import { setChecklistLocations } from "./links";
import type { Assessment, Checklist, ChecklistTemplate, LocationTemplate } from "./types";

/**
 * Puts the MEB list `code` on location `locationId`: a list bound to other locations gets this one too,
 * a school-wide list is left as is (it already covers every location), a missing list is added from
 * `library` for this location only.
 */
function bindList(
  a: Assessment,
  code: string,
  locationId: string,
  library: ChecklistTemplate[],
): Assessment {
  const existing = a.checklists.find((c) => c.source === "external" && c.code === code);
  if (existing) {
    const ids = liveLocationIds(a, existing);
    return ids.length ? setChecklistLocations(a, existing.id, [...ids, locationId]) : a;
  }
  const tpl = library.find((c) => c.source === "external" && c.code === code);
  if (!tpl) throw new Error(`Kütüphanede kontrol listesi yok: ${code}`);
  const added = addChecklist(a, tpl);
  return setChecklistLocations(added, added.checklists[added.checklists.length - 1].id, [
    locationId,
  ]);
}

function addLocationWithLists(
  a: Assessment,
  tpl: LocationTemplate,
  library: ChecklistTemplate[],
): Assessment {
  const withLocation = addLocationFromTemplate(a, tpl);
  const id = withLocation.locations[withLocation.locations.length - 1].id;
  return (tpl.checklists ?? []).reduce(
    (acc, code) => bindList(acc, code, id, library),
    withLocation,
  );
}

/**
 * Chosen lists first, then locations (each binding the MEB lists it names), then auto-assignment of
 * the new lists that are still school-wide. `library` is where named lists are taken from.
 */
export function addFromLibrary(
  a: Assessment,
  locations: LocationTemplate[],
  checklists: ChecklistTemplate[],
  library: ChecklistTemplate[],
): Assessment {
  const beforeLists = a.checklists.length;
  const withLists = checklists.reduce((acc, tpl) => addChecklist(acc, tpl), a);
  const added = locations.reduce((acc, tpl) => addLocationWithLists(acc, tpl, library), withLists);
  return autoAssign(
    added,
    added.checklists.slice(beforeLists).map((c) => c.id),
  );
}

export interface LibraryPreview {
  /** Code (or name) of each checklist the add would create, in order. */
  added: string[];
  /** Code (or name) of each existing checklist that would gain a location. */
  bound: string[];
}

/**
 * Dry run of `addFromLibrary`: which lists it would create and which existing ones it would bind
 * to a new location. Derived by diffing the real result, so it cannot drift from the add. Throws like it.
 */
export function previewLibraryAdd(
  a: Assessment,
  locations: LocationTemplate[],
  checklists: ChecklistTemplate[],
  library: ChecklistTemplate[],
): LibraryPreview {
  const after = addFromLibrary(a, locations, checklists, library);
  const label = (c: { code?: string; name: string }) => c.code || c.name;
  const grew = (c: Checklist) => {
    const next = after.checklists.find((n) => n.id === c.id);
    return !!next && liveLocationIds(after, next).length > liveLocationIds(a, c).length;
  };
  return {
    added: after.checklists.slice(a.checklists.length).map(label),
    bound: a.checklists.filter(grew).map(label),
  };
}
