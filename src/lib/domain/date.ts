// Dates are stored as free text "DD.MM.YYYY" (file format); the UI works with ISO "YYYY-MM-DD".
export interface YMD {
  y: number;
  m: number;
  d: number;
}

const TR_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** "15.09.2026" -> {y,m,d}; null when empty, malformed or not a real calendar day. */
export function parseTrDate(text: string): YMD | null {
  const m = TR_DATE.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const real = new Date(Date.UTC(y, mo - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== mo - 1 || real.getUTCDate() !== d) {
    return null;
  }
  return { y, m: mo, d };
}

/** {y,m,d} -> "2026-09-15". */
export const toIso = ({ y, m, d }: YMD): string => `${pad(y, 4)}-${pad(m)}-${pad(d)}`;

/** "2026-09-15" -> "15.09.2026"; "" when not a valid ISO date. */
export function fromIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const text = `${m[3]}.${m[2]}.${m[1]}`;
  return parseTrDate(text) ? text : "";
}

/** Stored "DD.MM.YYYY" -> ISO for <input type=date>; null when it does not parse. */
export function trToIso(text: string): string | null {
  const p = parseTrDate(text);
  return p ? toIso(p) : null;
}

/** True when both parse and `until` is earlier than `from`. */
export function isBefore(until: string, from: string): boolean {
  const [u, f] = [trToIso(until), trToIso(from)];
  return u !== null && f !== null && u < f;
}

/** How a stored date is shown: native date input, or text when it is legacy free text. */
export function dateField(text: string): { type: "date" | "text"; value: string; legacy: boolean } {
  if (text.trim() === "") return { type: "date", value: "", legacy: false };
  const iso = trToIso(text);
  return iso
    ? { type: "date", value: iso, legacy: false }
    : { type: "text", value: text, legacy: true };
}

/** Input value (ISO from a date input, or typed text) -> stored text. */
export function storedDate(inputType: string, raw: string): string {
  return inputType === "date" ? fromIso(raw) : raw.trim();
}
