// Checklists (templates) and library insertion. Every function returns a new copy and never mutates
// its input. Answers live in inspections (see inspections.ts), not on the items.
// On an external (MEB) list the name/code and the ready-made item texts are locked; items may still be
// added and removed, as the MEB form itself allows.
import { newId, pick } from "./assessment";
import { ensureInspections, findInspection, inItemOrder, inspectionsForList } from "./inspections";
import { clearSources } from "./links";
import type {
  Answer,
  Assessment,
  Checklist,
  ChecklistItem,
  ChecklistTemplate,
  Inspection,
} from "./types";

/** "KL-26 · Elektrik"; the code is dropped when empty, a missing name reads "Adsız liste". */
export const listLabel = (code: string, name: string): string =>
  `${code ? `${code} · ` : ""}${name || "Adsız liste"}`;

export const ANSWERS: Answer[] = ["yes", "no", "na", ""];
export const ANSWER_LABELS: Record<Answer, string> = {
  yes: "Evet",
  no: "Hayır",
  na: "U.D.",
  "": "",
};

const LOCK_MESSAGE =
  "Dış kaynaklı (MEB) listenin hazır metni değiştirilemez; yalnız cevap ve açıklama girilir.";

function findChecklist(a: Assessment, id: string): Checklist {
  const found = a.checklists.find((l) => l.id === id);
  if (!found) throw new Error(`Kontrol listesi bulunamadı: ${id}`);
  return found;
}

function mapChecklist(a: Assessment, id: string, fn: (l: Checklist) => Checklist): Assessment {
  findChecklist(a, id);
  return { ...a, checklists: a.checklists.map((l) => (l.id === id ? fn(l) : l)) };
}

export function newItem(
  no: number | string,
  text: string,
  added: boolean,
  ref?: string,
): ChecklistItem {
  return {
    id: newId("m"),
    no: String(no),
    text: text || "",
    ...(added ? { added: true } : {}),
    ...(ref ? { ref } : {}),
  };
}

/** Adds a library or blank checklist (with its empty inspections). */
export function addChecklist(a: Assessment, tpl: Partial<ChecklistTemplate> = {}): Assessment {
  const checklist: Checklist = {
    id: newId("k"),
    code: tpl.code || "",
    name: tpl.name || "Yeni kontrol listesi",
    source: tpl.source === "external" ? "external" : "internal",
    items: (tpl.items || []).map((m) => newItem(m.no, m.text, false, m.ref)),
  };
  return ensureInspections({ ...a, checklists: [...a.checklists, checklist] });
}

export function updateChecklist(
  a: Assessment,
  id: string,
  patch: { code?: string; name?: string },
): Assessment {
  if (findChecklist(a, id).source === "external") throw new Error(LOCK_MESSAGE);
  const next = Object.fromEntries(
    Object.entries(pick<Checklist>(patch, ["code", "name"])).map(([k, v]) => [k, String(v)]),
  );
  return mapChecklist(a, id, (l) => ({ ...l, ...next }));
}

export function removeChecklist(a: Assessment, id: string): Assessment {
  findChecklist(a, id);
  const next = clearSources(a, (s) => s.listId === id);
  return ensureInspections({ ...next, checklists: next.checklists.filter((l) => l.id !== id) });
}

export function addItem(a: Assessment, listId: string): Assessment {
  return mapChecklist(a, listId, (l) => ({
    ...l,
    items: [...l.items, newItem(l.items.length + 1, "", l.source === "external")],
  }));
}

function findItem(l: Checklist, itemId: string): ChecklistItem {
  const found = l.items.find((x) => x.id === itemId);
  if (!found) throw new Error(`Madde bulunamadı: ${itemId}`);
  return found;
}

/** patch: the item's no/text; allowed only on an editable item (answers go through setAnswer/setNote). */
export function updateItem(
  a: Assessment,
  listId: string,
  itemId: string,
  patch: Partial<Pick<ChecklistItem, "no" | "text">>,
): Assessment {
  const list = findChecklist(a, listId);
  const item = findItem(list, itemId);
  if (list.source === "external" && !item.added) throw new Error(LOCK_MESSAGE);
  const next = Object.fromEntries(
    Object.entries(pick<ChecklistItem>(patch, ["no", "text"])).map(([k, v]) => [k, String(v)]),
  );
  const rewords = "text" in next; // the school's wording now wins over the bank text
  return mapChecklist(a, listId, (l) => ({
    ...l,
    items: l.items.map((x) => {
      if (x.id !== itemId) return x;
      const { fromBank: _dropped, ...rest } = x;
      return { ...(rewords ? rest : x), ...next };
    }),
  }));
}

export function removeItem(a: Assessment, listId: string, itemId: string): Assessment {
  findItem(findChecklist(a, listId), itemId);
  const next = clearSources(a, (s) => s.listId === listId && s.itemId === itemId);
  return ensureInspections(
    mapChecklist(next, listId, (l) => ({ ...l, items: l.items.filter((x) => x.id !== itemId) })),
  );
}

/** Stored answers with `itemId` set to the patch; an unanswered, note-less item is not stored. */
function withAnswer(
  list: Checklist,
  insp: Inspection,
  itemId: string,
  patch: { answer?: Answer; note?: string },
): Inspection {
  const old = insp.answers.find((x) => x.itemId === itemId);
  const merged = { itemId, answer: old?.answer ?? "", note: old?.note ?? "", ...patch };
  const others = insp.answers.filter((x) => x.itemId !== itemId);
  const keep = merged.answer !== "" || merged.note !== "";
  return { ...insp, answers: inItemOrder(list, keep ? [...others, merged] : others) };
}

function setInspectionValue(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
  patch: { answer?: Answer; note?: string },
): Assessment {
  const list = findChecklist(a, listId);
  findItem(list, itemId);
  const insp = findInspection(a, listId, locationId);
  if (!insp) throw new Error(`Denetim bulunamadı: ${listId}/${locationId ?? "okul geneli"}`);
  return {
    ...a,
    inspections: a.inspections.map((i) => (i === insp ? withAnswer(list, i, itemId, patch) : i)),
  };
}

/** Sets the answer of one item in one inspection (locationId null = school-wide). "" clears it. */
export function setAnswer(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
  answer: Answer,
): Assessment {
  if (!ANSWERS.includes(answer)) throw new Error(`Geçersiz cevap: ${String(answer)}`);
  return setInspectionValue(a, listId, locationId, itemId, { answer });
}

/** Sets the note of one item in one inspection. */
export function setNote(
  a: Assessment,
  listId: string,
  locationId: string | null,
  itemId: string,
  note: string,
): Assessment {
  return setInspectionValue(a, listId, locationId, itemId, { note: String(note) });
}

/** Answer progress of one list over all its inspections (total = items x inspections). */
export function summary(
  a: Assessment,
  listId: string,
): { total: number; answered: number; no: number } {
  const itemCount = findChecklist(a, listId).items.length;
  const inspections = inspectionsForList(a, listId);
  const all = inspections.flatMap((i) => i.answers);
  return {
    total: itemCount * inspections.length,
    answered: all.filter((x) => x.answer !== "").length,
    no: all.filter((x) => x.answer === "no").length,
  };
}
