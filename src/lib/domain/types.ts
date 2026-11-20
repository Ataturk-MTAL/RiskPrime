// Assessment data model. This is also the saved .json file format (version 3).

export const SCHEMA_VERSION = 3;

export type Score = 1 | 2 | 3 | 4 | 5;
export type LocationType = "workshop" | "storage" | "office" | "wet" | "common";
export type Grouping = "area" | "building" | "none";
export type RowStatus = "open" | "done";
export type ChecklistSource = "internal" | "external";
export type Answer = "yes" | "no" | "na" | "";

export interface Signatory {
  title: string;
  name: string;
}

export interface School {
  name: string;
  /** Cover title scope, e.g. "Elektrik-Elektronik Teknolojisi Alanı". */
  scope: string;
  grouping: Grouping;
  signatories: Signatory[];
}

/**
 * The checklist item a risk row came from, in one inspection (locationId = the inspection's scope,
 * null = school-wide). Ids may dangle after edits; helpers treat that as unlinked.
 */
export interface RiskSource {
  listId: string;
  itemId: string;
  locationId: string | null;
}

export interface RiskRow {
  id: string;
  equipment: string;
  hazard: string;
  affected: string;
  existingControls: string;
  likelihood: Score | null;
  severity: Score | null;
  action: string;
  responsible: string;
  dueDate: string;
  status: RowStatus;
  likelihoodAfter: Score | null;
  severityAfter: Score | null;
  /** Checklist items this row came from; deduped, order kept. */
  sources?: RiskSource[];
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  building: string;
  area: string;
  rows: RiskRow[];
}

export interface ChecklistItem {
  id: string;
  no: string;
  text: string;
  /** Item added by the school to an external (MEB) list; its text stays editable. */
  added?: boolean;
  /** Question bank key this item came from, e.g. "KL-26.06" or "EE-03". */
  ref?: string;
  /** Text taken verbatim from the bank; only such items in school lists are offered bank text updates. */
  fromBank?: true;
}

/** One checklist template item answered in one inspection. */
export interface InspectionAnswer {
  itemId: string;
  answer: Answer;
  note: string;
}

/**
 * A checklist (template) filled in for one location (an inspection). locationId null = school-wide, used
 * when the list has no locations. Only answered or noted items are stored in `answers`; every other
 * item counts as unanswered. A "no" answer is a deficiency.
 */
export interface Inspection {
  id: string;
  checklistId: string;
  locationId: string | null;
  answers: InspectionAnswer[];
}

export interface Checklist {
  id: string;
  code: string;
  name: string;
  source: ChecklistSource;
  items: ChecklistItem[];
  /** Locations this list applies to; missing or empty = general (all locations). */
  locationIds?: string[];
}

export type PeriodStatus = "draft" | "signed";

/**
 * Snapshot bookkeeping of one assessment period. A signed period is locked; correcting it
 * opens a new draft revision whose previousHash points back at the signed one.
 */
export interface AssessmentMeta {
  /** ISO time the period was created. */
  createdAt: string;
  /** ISO time of the last edit. */
  updatedAt: string;
  /** RiskPrime version that last wrote the file. */
  appVersion: string;
  /** Question bank version the period started from; "" when unknown (migrated files). */
  bankVersion: string;
  status: PeriodStatus;
  /** 1-based; grows with every correction of a signed period. */
  revision: number;
  /** ISO time of signing; signed periods only. */
  signedAt?: string;
  /** Hex SHA-256 of the canonical content, set when signing. */
  contentHash?: string;
  /** Hash of the signed revision this draft corrects, or of the last period's signed snapshot. */
  previousHash?: string;
}

export interface Assessment {
  version: number;
  meta: AssessmentMeta;
  period: string;
  assessmentDate: string;
  validUntil: string;
  school: School;
  locations: Location[];
  checklists: Checklist[];
  /** Exactly one per live location of each list (or one school-wide); see ensureInspections. */
  inspections: Inspection[];
}

/** Library entries: templates without ids or answers. */
export interface ChecklistTemplate {
  code: string;
  name: string;
  source: ChecklistSource;
  group?: string;
  items: { no: string; text: string; ref?: string }[];
}

export type BankSource = "meb" | "riskprime";

/** A reusable checklist question. MEB texts are verbatim; "riskprime" ones are the app's extension. */
export interface BankQuestion {
  key: string;
  text: string;
  source: BankSource;
  /** MEB list code, e.g. "KL-26"; MEB questions only. */
  listCode?: string;
  /** Location types the question fits; empty = not tagged. */
  tags: LocationType[];
  /** Regulation or standard the question rests on; RiskPrime questions only. */
  basis?: string;
  /** Common item id (e.g. "OM-04") shared with the same question in other lists. */
  common?: string;
}

/** A group of questions in different lists that ask the same thing; answered once per location. */
export interface CommonItem {
  id: string;
  title: string;
  keys: string[];
}

export type RowTemplate = Partial<Omit<RiskRow, "id">>;

export interface LocationTemplate {
  name: string;
  type: LocationType;
  building: string;
  area: string;
  rows: RowTemplate[];
  /** MEB list codes (e.g. "KL-37") bound to the location when it is added. */
  checklists?: string[];
}

export interface Library {
  checklists: ChecklistTemplate[];
  locations: LocationTemplate[];
}
