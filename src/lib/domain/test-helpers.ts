// Shared fixtures for the domain tests.
import { setAnswer, setNote } from "./checklist";
import { ensureInspections } from "./inspections";
import type { Answer, Assessment } from "./types";

/** Items of `listId` answered in one inspection: { itemId: answer }, optional notes { itemId: note }. */
export function withAnswers(
  a: Assessment,
  listId: string,
  locationId: string | null,
  answers: Record<string, Answer>,
  notes: Record<string, string> = {},
): Assessment {
  const ready = ensureInspections(a);
  const answered = Object.entries(answers).reduce(
    (acc, [itemId, answer]) => setAnswer(acc, listId, locationId, itemId, answer),
    ready,
  );
  return Object.entries(notes).reduce(
    (acc, [itemId, note]) => setNote(acc, listId, locationId, itemId, note),
    answered,
  );
}
