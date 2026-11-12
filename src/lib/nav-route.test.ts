import { describe, expect, test } from "vite-plus/test";
import { HOME, formatHash, parseHash, type Place } from "./nav-route";

const place = (p: Partial<Place>): Place => ({ ...HOME, ...p });

describe("nav routes", () => {
  test("round-trips every kind of place", () => {
    const places: Place[] = [
      HOME,
      place({ section: "locations" }),
      place({ section: "locations", locationId: "a-11" }),
      place({ section: "locations", locationId: "a-11", listId: "k-3" }),
      place({ section: "locations", locationId: "a-11", locationView: "risk" }),
      place({ section: "deficiencies" }),
      place({ section: "register" }),
      place({ section: "report" }),
      place({ section: "library" }),
      place({ section: "library", listId: "k 3/ö" }),
    ];
    for (const p of places) expect(parseHash(formatHash(p))).toEqual(p);
  });

  test("formats readable Turkish segments", () => {
    expect(formatHash(place({ section: "locations", locationId: "a-11", listId: "k-3" }))).toBe(
      "#mekanlar/a-11/denetim/k-3",
    );
    expect(
      formatHash(place({ section: "locations", locationId: "a-11", locationView: "risk" })),
    ).toBe("#mekanlar/a-11/risk");
    expect(formatHash(place({ section: "register" }))).toBe("#riskler");
  });

  test("unknown or empty hashes open the overview; a risk view ignores a list id", () => {
    expect(parseHash("")).toEqual(HOME);
    expect(parseHash("#okul")).toEqual(HOME);
    expect(parseHash("#mekanlar/a-1/risk/k-9")).toEqual(
      place({ section: "locations", locationId: "a-1", locationView: "risk" }),
    );
  });
});
