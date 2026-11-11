import { describe, expect, it } from "vite-plus/test";
import { dragHasFiles, isOpenableFile } from "./drop";

describe("drop helpers", () => {
  it("accepts json and xlsx regardless of case", () => {
    expect(isOpenableFile("kayit.JSON")).toBe(true);
    expect(isOpenableFile("risk.xlsx")).toBe(true);
  });

  it("rejects other extensions", () => {
    expect(isOpenableFile("foto.png")).toBe(false);
    expect(isOpenableFile("json")).toBe(false);
    expect(isOpenableFile("eski.xls")).toBe(false);
  });

  it("detects file drags only", () => {
    expect(dragHasFiles(["Files"])).toBe(true);
    expect(dragHasFiles(["text/plain"])).toBe(false);
    expect(dragHasFiles(undefined)).toBe(false);
  });
});
