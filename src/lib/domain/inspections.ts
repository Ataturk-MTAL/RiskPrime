// Inspections (denetim): a checklist template filled in for one location, or once school-wide when
// the list has no locations. Pure helpers; every change returns a new Assessment.
import { newId } from "./ids";
import { riskLevel, type Level } from "./matrix";
import type { Assessment, Checklist, Inspection, InspectionAnswer, RiskRow } from "./types";

export const SCHOOL_WIDE_LABEL = "Okul geneli";

/** Location ids of a list that still exist, without duplicates. */
export function liveLocationIds(a: Assessment, list: Checklist): string[] {
  const live = (list.locationIds ?? []).filter((id) => a.locations.some((l) => l.id === id));
  return [...new Set(live)];
}

/** The inspection scopes of a list: its live locations, or [null] (school-wide) when it has none. */
export function scopesOf(a: Assessment, list: Checklist): (string | null)[] {
  const live = liveLocationIds(a, list);
  return live.length ? live : [null];
}

export function findInspection(
  a: Assessment,
  listId: string,
  locationId: string | null,
): Inspection | undefined {
  return a.inspections.find((i) => i.checklistId === listId && i.locationId === locationId);
}

const UNANSWERED: Pick<InspectionAnswer, "answer" | "note"> = { answer: "", note: "" };

/** Answer and note of one item in one inspection; unanswered when nothing is stored. */
export function answerOf(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
): Pick<InspectionAnswer, "answer" | "note"> {
  return (
    findInspection(a, listId, locationId)?.answers.find((x) => x.itemId === itemId) ?? UNANSWERED
  );
}

/** Display name of an inspection scope. */
export function scopeName(a: Assessment, locationId: string | null): string {
  if (locationId === null) return SCHOOL_WIDE_LABEL;
  return a.locations.find((l) => l.id === locationId)?.name || "Adsız mekân";
}

/** Answers in the order of the list's items, so equal answers always serialize the same. */
export function inItemOrder(list: Checklist, answers: InspectionAnswer[]): InspectionAnswer[] {
  const index = (x: InspectionAnswer) => list.items.findIndex((i) => i.id === x.itemId);
  return [...answers].sort((x, y) => index(x) - index(y));
}

/**
 * Makes a.inspections match the lists exactly: one inspection per live location of each list (or one
 * school-wide when it has none). Missing ones are created empty, orphans and duplicates are dropped,
 * answers of deleted items are pruned, and order follows list then location order. Idempotent.
 */
export function ensureInspections(a: Assessment): Assessment {
  const inspections = a.checklists.flatMap((list) => {
    const itemIds = new Set(list.items.map((i) => i.id));
    return scopesOf(a, list).map((locationId): Inspection => {
      const found = findInspection(a, list.id, locationId);
      if (!found) return { id: newId("d"), checklistId: list.id, locationId, answers: [] };
      return {
        ...found,
        answers: inItemOrder(
          list,
          found.answers.filter((x) => itemIds.has(x.itemId)),
        ),
      };
    });
  });
  return { ...a, inspections };
}

export const inspectionsForList = (a: Assessment, listId: string): Inspection[] =>
  a.inspections.filter((i) => i.checklistId === listId);

export const inspectionsForLocation = (a: Assessment, locationId: string): Inspection[] =>
  a.inspections.filter((i) => i.locationId === locationId);

/** Item counts of one inspection: total items of its list, answered ones, and "no" answers (deficiencies). */
export function inspectionSummary(
  a: Assessment,
  inspection: Inspection,
): { total: number; answered: number; no: number } {
  const total = a.checklists.find((c) => c.id === inspection.checklistId)?.items.length ?? 0;
  return {
    total,
    answered: inspection.answers.filter((x) => x.answer !== "").length,
    no: inspection.answers.filter((x) => x.answer === "no").length,
  };
}

export interface Deficiency {
  listId: string;
  listName: string;
  listCode: string;
  itemId: string;
  itemNo: string;
  text: string;
  ref?: string;
  /** Inspection scope; null = school-wide. */
  locationId: string | null;
  locationName: string;
  note: string;
  /** Ids of the risk rows linked to this item in this inspection. */
  rowIds: string[];
  /** Other lists' "Hayır" items at this location that ask the same common question. */
  siblings?: { listId: string; itemId: string; ref: string }[];
}

/** Every "Hayır" answer of every inspection, in list, location and item order. */
export function deficiencies(a: Assessment): Deficiency[] {
  return a.inspections.flatMap((insp) => {
    const list = a.checklists.find((c) => c.id === insp.checklistId);
    if (!list) return [];
    return list.items.flatMap((item) => {
      const found = insp.answers.find((x) => x.itemId === item.id);
      if (found?.answer !== "no") return [];
      const rowIds = a.locations.flatMap((l) =>
        l.rows
          .filter((r) =>
            r.sources?.some(
              (s) =>
                s.listId === list.id && s.itemId === item.id && s.locationId === insp.locationId,
            ),
          )
          .map((r) => r.id),
      );
      return [
        {
          listId: list.id,
          listName: list.name,
          listCode: list.code,
          itemId: item.id,
          itemNo: item.no,
          text: item.text,
          ...(item.ref ? { ref: item.ref } : {}),
          locationId: insp.locationId,
          locationName: scopeName(a, insp.locationId),
          note: found.note,
          rowIds,
        },
      ];
    });
  });
}

export interface RegisterEntry {
  locationId: string;
  locationName: string;
  row: RiskRow;
  /** 1-based row number inside its location. */
  number: number;
  level: Level | null;
}

/** Every risk row of every location, flat, in location then row order. */
export function riskRegister(a: Assessment): RegisterEntry[] {
  return a.locations.flatMap((l) =>
    l.rows.map((row, i) => ({
      locationId: l.id,
      locationName: l.name,
      row,
      number: i + 1,
      level: riskLevel(row.likelihood, row.severity),
    })),
  );
}
