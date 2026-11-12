// Snapshot meta in the Excel backup: rows of the "RiskPrime" marker sheet ("Etiket | Değer").
// A workbook cannot prove its content (ids are regenerated on restore), so the signature is written
// for readers but NOT restored: a restored period is always an unsigned draft that keeps the
// revision, dates, versions and previousHash. The .json file is the authoritative signed snapshot.
import { cell } from "./excel-import";
import type { Assessment, AssessmentMeta } from "./types";

type Table = (string | number)[][];

const ROWS: readonly (readonly [keyof AssessmentMeta, string])[] = [
  ["status", "Dönem durumu"],
  ["revision", "Revizyon"],
  ["createdAt", "Oluşturulma"],
  ["updatedAt", "Son değişiklik"],
  ["appVersion", "Uygulama sürümü"],
  ["bankVersion", "Soru bankası sürümü"],
  ["signedAt", "İmza zamanı"],
  ["contentHash", "İçerik özeti"],
  ["previousHash", "Önceki özet"],
];

export const metaRows = (a: Assessment): Table =>
  ROWS.map(([key, label]) => [label, a.meta[key] ?? ""]);

/** Reads the meta rows of the marker sheet over `base`; missing rows keep `base`'s values. */
export function readMeta(aoa: unknown[][], base: AssessmentMeta): AssessmentMeta {
  const byLabel = new Map(aoa.map((r) => [cell(r[0]), r[1]]));
  const text = (label: string) => cell(byLabel.get(label));
  const revision = text("Revizyon");
  const previousHash = text("Önceki özet");
  return {
    createdAt: text("Oluşturulma") || base.createdAt,
    updatedAt: text("Son değişiklik") || base.updatedAt,
    appVersion: text("Uygulama sürümü") || base.appVersion,
    bankVersion: byLabel.has("Soru bankası sürümü")
      ? text("Soru bankası sürümü")
      : base.bankVersion,
    status: "draft",
    revision: revision ? Number(revision) : base.revision,
    ...(previousHash ? { previousHash } : {}),
  };
}
