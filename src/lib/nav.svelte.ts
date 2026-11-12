// Where the user is and what the school-wide lists are filtered by. The hash mirrors `place`.
import { HOME, type LocationView, type Place, type Section } from "./nav-route";

export type { LocationView, Place, Section } from "./nav-route";

export interface RegisterFilter {
  /** "serious" = Yüksek + Tolere edilemez. */
  level: "all" | "serious";
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
  /** Set to open a risk row's sheet; the location's risk view clears it. */
  rowRequest = $state<{ locationId: string; rowId: string } | null>(null);

  get section(): Section {
    return this.place.section;
  }

  go(section: Section) {
    this.place = { ...HOME, section };
  }

  openLocation(
    locationId: string,
    view: LocationView = "inspections",
    listId: string | null = null,
  ) {
    this.place = {
      section: "locations",
      locationId,
      locationView: view,
      listId: view === "inspections" ? listId : null,
    };
  }

  /** Opens a location's risk table and the sheet of one row. */
  openRow(locationId: string, rowId: string) {
    this.openLocation(locationId, "risk");
    this.rowRequest = { locationId, rowId };
  }

  openRegister(filter: Partial<RegisterFilter> = {}) {
    this.registerFilter = { ...ALL_RISKS, ...filter };
    this.go("register");
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
