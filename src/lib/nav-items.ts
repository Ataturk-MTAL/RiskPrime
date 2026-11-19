// The four primary sections, shared by the sidebar and the phone bottom bar, plus their badges.
import FileText from "@lucide/svelte/icons/file-text";
import House from "@lucide/svelte/icons/house";
import MapPin from "@lucide/svelte/icons/map-pin";
import Table2 from "@lucide/svelte/icons/table-2";
import type { Component } from "svelte";
import type { Assessment } from "./domain/types";
import { riskRegister } from "./domain/inspections";
import { LEVELS } from "./domain/matrix";
import { readiness } from "./domain/readiness";
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
  { section: "register", label: "Riskler", icon: Table2 },
  { section: "report", label: "Rapor", icon: FileText },
];

export const SECTION_LABELS: Readonly<Record<Section, string>> = {
  overview: "Genel bakış",
  locations: "Mekânlar",
  deficiencies: "Riske eklenmemiş eksikler",
  register: "Riskler",
  report: "Rapor",
  library: "Kütüphane",
};

export interface SectionBadges {
  /** Open High + Intolerable risk rows. */
  register: number;
  /** The report still has gaps. */
  reportGaps: boolean;
}

export function sectionBadges(a: Assessment): SectionBadges {
  return {
    register: riskRegister(a).filter(
      (e) =>
        e.row.status === "open" &&
        (e.level?.key === LEVELS.high.key || e.level?.key === LEVELS.intolerable.key),
    ).length,
    reportGaps: readiness(a).hasGaps,
  };
}

/** Riskler stays highlighted on its deficiency view (section "deficiencies"). */
export const isSectionActive = (item: Section, current: Section): boolean =>
  item === current || (item === "register" && current === "deficiencies");
