// Checklists and library insertion. Every function returns a new copy and never mutates its input.
// On an external (MEB) list the name/code and the ready-made item texts are locked; items may still be
// added and removed, as the MEB form itself allows.
import { newId, pick } from './assessment';
import type { Answer, Assessment, Checklist, ChecklistItem, ChecklistTemplate } from './types';

export const ANSWERS: Answer[] = ['yes', 'no', 'na', ''];
export const ANSWER_LABELS: Record<Answer, string> = { yes: 'Evet', no: 'Hayır', na: 'U/D', '': '' };

const LOCK_MESSAGE = 'Dış kaynaklı (MEB) listenin hazır metni değiştirilemez; yalnız cevap ve açıklama girilir.';

function findChecklist(a: Assessment, id: string): Checklist {
  const found = a.checklists.find((l) => l.id === id);
  if (!found) throw new Error(`Kontrol listesi bulunamadı: ${id}`);
  return found;
}

function mapChecklist(a: Assessment, id: string, fn: (l: Checklist) => Checklist): Assessment {
  findChecklist(a, id);
  return { ...a, checklists: a.checklists.map((l) => (l.id === id ? fn(l) : l)) };
}

function newItem(no: number | string, text: string, added: boolean): ChecklistItem {
  return { id: newId('m'), no: String(no), text: text || '', answer: '', note: '', ...(added ? { added: true } : {}) };
}

/** Adds a library or blank checklist. */
export function addChecklist(a: Assessment, tpl: Partial<ChecklistTemplate> = {}): Assessment {
  const checklist: Checklist = {
    id: newId('k'),
    code: tpl.code || '',
    name: tpl.name || 'Yeni kontrol listesi',
    source: tpl.source === 'external' ? 'external' : 'internal',
    items: (tpl.items || []).map((m) => newItem(m.no, m.text, false)),
  };
  return { ...a, checklists: [...a.checklists, checklist] };
}

export function updateChecklist(a: Assessment, id: string, patch: { code?: string; name?: string }): Assessment {
  if (findChecklist(a, id).source === 'external') throw new Error(LOCK_MESSAGE);
  const next = Object.fromEntries(
    Object.entries(pick<Checklist>(patch, ['code', 'name'])).map(([k, v]) => [k, String(v)]),
  );
  return mapChecklist(a, id, (l) => ({ ...l, ...next }));
}

export function removeChecklist(a: Assessment, id: string): Assessment {
  findChecklist(a, id);
  return { ...a, checklists: a.checklists.filter((l) => l.id !== id) };
}

export function addItem(a: Assessment, listId: string): Assessment {
  return mapChecklist(a, listId, (l) => ({
    ...l,
    items: [...l.items, newItem(l.items.length + 1, '', l.source === 'external')],
  }));
}

function findItem(l: Checklist, itemId: string): ChecklistItem {
  const found = l.items.find((x) => x.id === itemId);
  if (!found) throw new Error(`Madde bulunamadı: ${itemId}`);
  return found;
}

/** patch: answer/note on any list; no/text only on an editable item. */
export function updateItem(
  a: Assessment,
  listId: string,
  itemId: string,
  patch: Partial<Pick<ChecklistItem, 'no' | 'text' | 'answer' | 'note'>>,
): Assessment {
  const list = findChecklist(a, listId);
  const item = findItem(list, itemId);
  if ('answer' in patch && !ANSWERS.includes(patch.answer as Answer)) {
    throw new Error(`Geçersiz cevap: ${String(patch.answer)}`);
  }
  const textChanges = 'text' in patch || 'no' in patch;
  if (textChanges && list.source === 'external' && !item.added) throw new Error(LOCK_MESSAGE);
  const next = Object.fromEntries(
    Object.entries(pick<ChecklistItem>(patch, ['no', 'text', 'answer', 'note'])).map(([k, v]) => [k, String(v)]),
  );
  return mapChecklist(a, listId, (l) => ({
    ...l,
    items: l.items.map((x) => (x.id === itemId ? { ...x, ...next } : x)),
  }));
}

export function removeItem(a: Assessment, listId: string, itemId: string): Assessment {
  findItem(findChecklist(a, listId), itemId);
  return mapChecklist(a, listId, (l) => ({ ...l, items: l.items.filter((x) => x.id !== itemId) }));
}

/** Answer progress of one list. */
export function summary(list: Checklist): { total: number; answered: number; no: number } {
  return {
    total: list.items.length,
    answered: list.items.filter((x) => x.answer).length,
    no: list.items.filter((x) => x.answer === 'no').length,
  };
}
