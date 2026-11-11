// Pure data transforms shared by the PDF, Excel and Word exports.
import { grouped } from "./assessment";
import { fileName } from "./file";
import { liveLocationIds, sourceLabel, sourcesOf } from "./links";
import { riskLevel, riskScore, type Level } from "./matrix";
import type { Answer, Assessment, Checklist, Location, RiskRow, RowStatus } from "./types";

export const PDF_KINDS = ["full", "checklists", "blank"] as const;
export type PdfKind = (typeof PDF_KINDS)[number];

const ANSWER_TEXT: Record<Answer, string> = { yes: "Evet", no: "Hayır", na: "U.D.", "": "" };
const STATUS_TEXT: Record<RowStatus, string> = { open: "Açık", done: "Tamamlandı" };

const blankIfNull = <T>(value: T | null | undefined): T | "" =>
  value === null || value === undefined ? "" : value;

export interface ExportRiskRow {
  location: string;
  building: string;
  area: string;
  no: number;
  equipment: string;
  hazard: string;
  affected: string;
  existingControls: string;
  likelihood: number | "";
  severity: number | "";
  score: number | "";
  level: string;
  action: string;
  responsible: string;
  dueDate: string;
  status: string;
  /** Checklist reference such as "KL-26.06"; "" when not linked. */
  source: string;
  likelihoodAfter: number | "";
  severityAfter: number | "";
  scoreAfter: number | "";
  levelAfter: string;
}

export interface ExportChecklistRow {
  code: string;
  name: string;
  no: string;
  text: string;
  answer: string;
  note: string;
}

/** Flat risk rows for Excel/Word (location info repeated on every row). */
export function riskRows(a: Assessment): ExportRiskRow[] {
  return a.locations.flatMap((l) =>
    l.rows.map((r, i) => ({
      location: l.name,
      building: l.building || "",
      area: l.area || "",
      no: i + 1,
      equipment: r.equipment,
      hazard: r.hazard,
      affected: r.affected,
      existingControls: r.existingControls,
      likelihood: blankIfNull(r.likelihood),
      severity: blankIfNull(r.severity),
      score: blankIfNull(riskScore(r.likelihood, r.severity)),
      level: riskLevel(r.likelihood, r.severity)?.label ?? "",
      action: r.action,
      responsible: r.responsible,
      dueDate: r.dueDate,
      status: STATUS_TEXT[r.status] || "",
      source: sourceText(a, r),
      likelihoodAfter: blankIfNull(r.likelihoodAfter),
      severityAfter: blankIfNull(r.severityAfter),
      scoreAfter: blankIfNull(riskScore(r.likelihoodAfter, r.severityAfter)),
      levelAfter: riskLevel(r.likelihoodAfter, r.severityAfter)?.label ?? "",
    })),
  );
}

export function checklistRows(a: Assessment): ExportChecklistRow[] {
  return (a.checklists || []).flatMap((l) =>
    l.items.map((m) => ({
      code: l.code,
      name: l.name,
      no: m.no,
      text: m.text,
      answer: ANSWER_TEXT[m.answer] || "",
      note: m.note || "",
    })),
  );
}

export type PdfRow = Omit<RiskRow, "sources"> & {
  /** Checklist reference such as "KL-26.06"; "" when the row has no (valid) source. */
  source: string;
  score: number | null;
  level: Level | null;
  scoreAfter: number | null;
  levelAfter: Level | null;
};
export type PdfLocation = Omit<Location, "rows"> & { rows: PdfRow[] };
/** Names of the locations the list applies to, joined with ", "; "" for a general list. */
export type PdfChecklist = Checklist & { locationNames: string };

/** "KL-26.06, KL-26.07": one label per linked item (see sourceLabel); "" when none. */
export function sourceText(a: Assessment, r: RiskRow): string {
  return sourcesOf(a, r).map(sourceLabel).join(", ");
}

export interface PdfData {
  kind: PdfKind;
  school: Assessment["school"];
  period: string;
  assessmentDate: string;
  validUntil: string;
  groups: { title: string; locations: PdfLocation[] }[];
  checklists: PdfChecklist[];
}

function pdfRow(a: Assessment, r: RiskRow, blank: boolean): PdfRow {
  const { sources: _sources, ...plain } = r;
  const source = sourceText(a, r);
  if (blank) {
    return {
      ...plain,
      source,
      likelihood: null,
      severity: null,
      score: null,
      level: null,
      likelihoodAfter: null,
      severityAfter: null,
      scoreAfter: null,
      levelAfter: null,
    };
  }
  return {
    ...plain,
    source,
    score: riskScore(r.likelihood, r.severity),
    level: riskLevel(r.likelihood, r.severity),
    scoreAfter: riskScore(r.likelihoodAfter, r.severityAfter),
    levelAfter: riskLevel(r.likelihoodAfter, r.severityAfter),
  };
}

/**
 * Data handed to the Typst template. Does not mutate the input.
 * With locationId: only that location, no checklists, no empty group headings.
 */
export function pdfData(a: Assessment, kind: PdfKind, locationId?: string): PdfData {
  if (!PDF_KINDS.includes(kind)) throw new Error(`Geçersiz çıktı türü: ${String(kind)}`);
  if (locationId !== undefined && !a.locations.some((l) => l.id === locationId)) {
    throw new Error(`Mekân bulunamadı: ${locationId}`);
  }
  const blank = kind === "blank";
  const single = locationId !== undefined;
  return {
    kind,
    school: a.school,
    period: a.period,
    assessmentDate: a.assessmentDate,
    validUntil: a.validUntil,
    groups: grouped(a)
      .map((g) => ({
        title: g.title,
        locations: g.locations
          .filter((l) => !single || l.id === locationId)
          .map((l) => ({ ...l, rows: l.rows.map((r) => pdfRow(a, r, blank)) })),
      }))
      .filter((g) => !single || g.locations.length > 0),
    checklists: (single ? [] : a.checklists || []).map((l) => ({
      ...l,
      locationNames: liveLocationIds(a, l)
        .map((id) => a.locations.find((x) => x.id === id)?.name ?? "")
        .join(", "),
      items: l.items.map((m) => (blank ? { ...m, answer: "" as Answer, note: "" } : m)),
    })),
  };
}

/** risk-<period>[-suffix].<ext> */
export function outputName(a: Assessment, ext: string, suffix?: string): string {
  const base = fileName(a).replace(/\.json$/, "");
  return `${base}${suffix ? `-${suffix}` : ""}.${ext}`;
}

/** File-name suffix for a single-location PDF, e.g. "mekan-Elektrik-Atolyesi". */
export function locationSuffix(name: string): string {
  // Reuses fileName's Turkish transliteration: risk-<slug>.json
  return `mekan-${fileName({ period: name } as Assessment).slice("risk-".length, -".json".length)}`;
}
