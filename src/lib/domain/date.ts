// Dates are stored as text "DD.MM.YYYY" (file format); ISO "YYYY-MM-DD" is only used for comparison.
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

/** Stored "DD.MM.YYYY" -> ISO; null when it does not parse. */
export function trToIso(text: string): string | null {
  const p = parseTrDate(text);
  return p ? toIso(p) : null;
}

/** True when both parse and `until` is earlier than `from`. */
export function isBefore(until: string, from: string): boolean {
  const [u, f] = [trToIso(until), trToIso(from)];
  return u !== null && f !== null && u < f;
}

const LOOSE_DATE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
const PACKED_DATE = /^(\d{2})(\d{2})(\d{4})$/;

/** Typed date -> "DD.MM.YYYY" when it is a real day ("15092026", "15/9/2026", "5-9-2026"); otherwise the trimmed text. */
export function normalizeTrDate(raw: string): string {
  const text = raw.trim();
  const m = LOOSE_DATE.exec(text) ?? PACKED_DATE.exec(text);
  if (!m) return text;
  const candidate = `${m[1].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[3]}`;
  return parseTrDate(candidate) ? candidate : text;
}
