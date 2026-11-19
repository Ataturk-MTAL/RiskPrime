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
      place({ section: "deficiencies" }),
      place({ section: "register" }),
      place({ section: "register", locationId: "a-11" }),
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
    expect(formatHash(place({ section: "register", locationId: "a-11" }))).toBe("#riskler/a-11");
    expect(formatHash(place({ section: "register" }))).toBe("#riskler");
  });

  test("unknown or empty hashes open the overview", () => {
    expect(parseHash("")).toEqual(HOME);
    expect(parseHash("#yok")).toEqual(HOME);
  });

  test("a saved location risk link opens Riskler for that location", () => {
    const expected = place({ section: "register", locationId: "a-1" });
    expect(parseHash("#mekanlar/a-1/risk")).toEqual(expected);
    expect(parseHash("#mekanlar/a-1/risk/k-9")).toEqual(expected);
  });
});
