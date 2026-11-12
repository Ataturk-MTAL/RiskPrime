// The five primary sections, shared by the sidebar and the phone bottom bar, plus their badges.
import ClipboardX from "@lucide/svelte/icons/clipboard-x";
import FileText from "@lucide/svelte/icons/file-text";
import House from "@lucide/svelte/icons/house";
import MapPin from "@lucide/svelte/icons/map-pin";
import Table2 from "@lucide/svelte/icons/table-2";
import type { Component } from "svelte";
import type { Assessment } from "./domain/types";
import { riskRegister } from "./domain/inspections";
import { LEVELS } from "./domain/matrix";
import { readiness } from "./domain/readiness";
import { countUntransferred } from "./domain/transfer";
import type { Section } from "./nav-route";

export interface SectionItem {
  section: Section;
  label: string;
  // oxlint-disable-next-line no-explicit-any -- lucide icons take their own prop type
  icon: Component<any>;
}

export const SECTION_ITEMS: readonly SectionItem[] = [
  { section: "overview", label: "Genel bakış", icon: House },
  { section: "locations", label: "Mekânlar", icon: MapPin },
  { section: "deficiencies", label: "Eksikler", icon: ClipboardX },
  { section: "register", label: "Risk kaydı", icon: Table2 },
  { section: "report", label: "Rapor", icon: FileText },
];

export const SECTION_LABELS: Readonly<Record<Section, string>> = {
  overview: "Genel bakış",
  locations: "Mekânlar",
  deficiencies: "Eksikler",
  register: "Risk kaydı",
  report: "Rapor",
  library: "Kütüphane",
};

export interface SectionBadges {
  /** Deficiencies with no risk row yet. */
  deficiencies: number;
  /** Open High + Intolerable risk rows. */
  register: number;
  /** The report still has gaps. */
  reportGaps: boolean;
}

export function sectionBadges(a: Assessment): SectionBadges {
  return {
    deficiencies: countUntransferred(a),
    register: riskRegister(a).filter(
      (e) =>
        e.row.status === "open" &&
        (e.level?.key === LEVELS.high.key || e.level?.key === LEVELS.intolerable.key),
    ).length,
    reportGaps: readiness(a).hasGaps,
  };
}
