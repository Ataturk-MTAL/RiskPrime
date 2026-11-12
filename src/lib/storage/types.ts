// Storage contract for period snapshots. The web build keeps them in the browser (IndexedDB);
// a desktop (Tauri) build can implement the same interface with files on disk.
import type { Assessment, PeriodStatus } from "$lib/domain/types";

/** One archived period snapshot, as listed to the user. */
export interface PeriodSummary {
  /** Stable key: periodKey(period, revision). */
  id: string;
  period: string;
  revision: number;
  status: PeriodStatus;
  schoolName: string;
  updatedAt: string;
  signedAt?: string;
}

export interface PeriodStore {
  /** Newest first (period descending, then revision descending). */
  list(): Promise<PeriodSummary[]>;
  load(id: string): Promise<Assessment | null>;
  /** Saves (inserts or replaces) the snapshot under periodKey(period, revision). */
  save(a: Assessment): Promise<PeriodSummary>;
  remove(id: string): Promise<void>;
}

/** "2026-2027#r2"; an empty period is stored as "adsız". */
export const periodKey = (period: string, revision: number): string =>
  `${period.trim() || "adsız"}#r${revision}`;

export const summaryOf = (a: Assessment): PeriodSummary => ({
  id: periodKey(a.period, a.meta.revision),
  period: a.period,
  revision: a.meta.revision,
  status: a.meta.status,
  schoolName: a.school.name,
  updatedAt: a.meta.updatedAt,
  ...(a.meta.signedAt ? { signedAt: a.meta.signedAt } : {}),
});

/** Newest first: period descending, then revision descending. */
export const compareSummaries = (a: PeriodSummary, b: PeriodSummary): number =>
  b.period.localeCompare(a.period) || b.revision - a.revision;
