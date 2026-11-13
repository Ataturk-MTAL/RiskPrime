import { describe, expect, test } from "vite-plus/test";
import { cargoVersion, versionProblems } from "./check-version.mjs";

describe("check-version", () => {
  test("reads the [package] version, not a dependency's", () => {
    const toml =
      '[package]\nname = "riskprime"\nversion = "0.2.0"\n\n[dependencies]\nx = { version = "9" }\n';
    expect(cargoVersion(toml)).toBe("0.2.0");
  });

  test("accepts matching versions and tag", () => {
    expect(versionProblems({ pkg: "0.3.0", cargo: "0.3.0", tag: "v0.3.0" })).toEqual([]);
  });

  test("reports a version mismatch and a wrong tag", () => {
    expect(versionProblems({ pkg: "0.3.0", cargo: "0.2.0", tag: "v0.3.1" })).toHaveLength(2);
  });
});
