// Where the user is and what the school-wide lists are filtered by. The hash mirrors `place`.
import { HOME, type Place, type Section } from "./nav-route";

export type { Place, Section } from "./nav-route";

export interface RegisterFilter {
  /** "serious" = Yüksek + Tolere edilemez; "unscored" = olasılık ya da şiddet boş. */
  level: "all" | "serious" | "unscored";
  locationId: string | null;
  status: "all" | "open" | "done";
  overdue: boolean;
  query: string;
}

export interface DeficiencyFilter {
  locationId: string | null;
  listId: string | null;
  /** "untransferred" = no linked risk row yet. */
  state: "all" | "untransferred" | "transferred";
  query: string;
}

export const ALL_RISKS: RegisterFilter = {
  level: "all",
  locationId: null,
  status: "all",
  overdue: false,
  query: "",
};
export const ALL_DEFICIENCIES: DeficiencyFilter = {
  locationId: null,
  listId: null,
  state: "all",
  query: "",
};

class Nav {
  place = $state<Place>(HOME);
  registerFilter = $state<RegisterFilter>(ALL_RISKS);
  deficiencyFilter = $state<DeficiencyFilter>(ALL_DEFICIENCIES);
  /** Incremented to ask the report page to show and focus the school details. */
  schoolRequest = $state(0);
  /** Set to open a risk row's sheet; the row's LocationEditor in Riskler clears it. */
  rowRequest = $state<{ locationId: string; rowId: string } | null>(null);

  get section(): Section {
    return this.place.section;
  }

  go(section: Section) {
    if (section === "register") return this.openRegister();
    this.place = { ...HOME, section };
  }

  openLocation(locationId: string, listId: string | null = null) {
    this.place = { section: "locations", locationId, listId };
  }

  /** Opens Riskler on the row's location and asks for that row's sheet. */
  openRow(locationId: string, rowId: string) {
    this.openRegister({ locationId });
    this.rowRequest = { locationId, rowId };
  }

  /** Riskler with a fresh filter; the location filter is part of the URL. */
  openRegister(filter: Partial<RegisterFilter> = {}) {
    this.registerFilter = { ...ALL_RISKS, ...filter };
    this.place = { ...HOME, section: "register", locationId: this.registerFilter.locationId };
  }

  openDeficiencies(filter: Partial<DeficiencyFilter> = {}) {
    this.deficiencyFilter = { ...ALL_DEFICIENCIES, ...filter };
    this.go("deficiencies");
  }

  openReport(focusSchool = false) {
    this.go("report");
    if (focusSchool) this.schoolRequest += 1;
  }

  openLibrary(listId: string | null = null) {
    this.place = { ...HOME, section: "library", listId };
  }
}

export const nav = new Nav();
