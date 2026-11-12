// Pure data transforms shared by the PDF, Excel and Word exports.
import { grouped } from "./assessment";
import { fileName } from "./file";
import { answerOf, scopeName } from "./inspections";
import { sourceLabel, sourcesOf } from "./links";
import { riskLevel, riskScore, type Level } from "./matrix";
import type { Answer, Assessment, ChecklistItem, Location, RiskRow, RowStatus } from "./types";

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
  /** Inspection scope: location name, or "Okul geneli". */
  location: string;
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

/** One row per item per inspection. */
export function checklistRows(a: Assessment): ExportChecklistRow[] {
  return a.inspections.flatMap((insp) => {
    const list = a.checklists.find((c) => c.id === insp.checklistId);
    return (list?.items ?? []).map((m) => {
      const { answer, note } = answerOf(a, insp.checklistId, insp.locationId, m.id);
      return {
        code: list?.code ?? "",
        name: list?.name ?? "",
        location: scopeName(a, insp.locationId),
        no: m.no,
        text: m.text,
        answer: ANSWER_TEXT[answer] || "",
        note,
      };
    });
  });
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
/** One checklist block of the PDF = one inspection; `name` is "<list> — <location or Okul geneli>". */
export interface PdfChecklist {
  id: string;
  code: string;
  name: string;
  /** Kept for the template; empty because `name` already carries the location. */
  locationNames: string;
  items: (ChecklistItem & { answer: Answer; note: string })[];
}

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
  /** Snapshot facts for the report (footer shows bankVersion and revision). */
  snapshot: { revision: number; status: string; signedAt: string; bankVersion: string };
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
    snapshot: {
      revision: a.meta.revision,
      status: a.meta.status,
      signedAt: a.meta.signedAt ?? "",
      bankVersion: a.meta.bankVersion,
    },
    groups: grouped(a)
      .map((g) => ({
        title: g.title,
        locations: g.locations
          .filter((l) => !single || l.id === locationId)
          .map((l) => ({ ...l, rows: l.rows.map((r) => pdfRow(a, r, blank)) })),
      }))
      .filter((g) => !single || g.locations.length > 0),
    checklists: single ? [] : pdfChecklists(a, blank),
  };
}

function pdfChecklists(a: Assessment, blank: boolean): PdfChecklist[] {
  return a.inspections.flatMap((insp) => {
    const list = a.checklists.find((c) => c.id === insp.checklistId);
    if (!list) return [];
    return [
      {
        id: insp.id,
        code: list.code,
        name: `${list.name} — ${scopeName(a, insp.locationId)}`,
        locationNames: "",
        items: list.items.map((m) => ({
          ...m,
          ...(blank
            ? { answer: "" as Answer, note: "" }
            : answerOf(a, list.id, insp.locationId, m.id)),
        })),
      },
    ];
  });
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
