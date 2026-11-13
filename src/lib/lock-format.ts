/** Up to two uppercase initials of a display name ("ayşe yılmaz" -> "AY"); "?" when empty. */
export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("") || "?";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

const date = (d: Date) => d.toLocaleDateString("tr-TR", DATE_OPTIONS);
const time = (d: Date) => d.toLocaleTimeString("tr-TR", TIME_OPTIONS);

/** "13.11.2026 14:02" */
export const formatStamp = (iso: string): string => {
  const d = new Date(iso);
  return `${date(d)} ${time(d)}`;
};

/** Coalesced edit rows span startedAt..at: "13.11.2026 14:02–14:20"; a single moment collapses to one stamp. */
export const formatTimeRange = (startedAt: string, at: string): string => {
  const from = new Date(startedAt);
  const to = new Date(at);
  if (time(from) === time(to) && date(from) === date(to)) return formatStamp(at);
  if (date(from) === date(to)) return `${date(from)} ${time(from)}–${time(to)}`;
  return `${formatStamp(startedAt)}–${formatStamp(at)}`;
};
