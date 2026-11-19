import { describe, expect, test } from "vite-plus/test";
import { isDarkFor, parseThemeChoice } from "./theme-choice";

describe("theme choice", () => {
  test("reads a stored choice and falls back to system", () => {
    // Arrange
    const stored = ["light", "dark", "system", null, "mavi"];
    // Act
    const parsed = stored.map(parseThemeChoice);
    // Assert
    expect(parsed).toEqual(["light", "dark", "system", "system", "system"]);
  });

  test("system follows the operating system, explicit choices win", () => {
    expect(isDarkFor("system", true)).toBe(true);
    expect(isDarkFor("system", false)).toBe(false);
    expect(isDarkFor("light", true)).toBe(false);
    expect(isDarkFor("dark", false)).toBe(true);
  });
});
