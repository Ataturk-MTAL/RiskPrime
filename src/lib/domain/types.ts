// Assessment data model. This is also the saved .json file format (version 1).

export const SCHEMA_VERSION = 1;

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
  answer: Answer;
  note: string;
  /** Item added by the school to an external (MEB) list; its text stays editable. */
  added?: boolean;
}

export interface Checklist {
  id: string;
  code: string;
  name: string;
  source: ChecklistSource;
  items: ChecklistItem[];
}

export interface Assessment {
  version: number;
  period: string;
  assessmentDate: string;
  validUntil: string;
  school: School;
  locations: Location[];
  checklists: Checklist[];
}

/** Library entries: templates without ids or answers. */
export interface ChecklistTemplate {
  code: string;
  name: string;
  source: ChecklistSource;
  group?: string;
  items: { no: string; text: string }[];
}

export type RowTemplate = Partial<Omit<RiskRow, "id">>;

export interface LocationTemplate {
  name: string;
  type: LocationType;
  building: string;
  area: string;
  rows: RowTemplate[];
}

export interface Library {
  checklists: ChecklistTemplate[];
  locations: LocationTemplate[];
}
