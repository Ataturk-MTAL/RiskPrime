import { describe, expect, test } from "vite-plus/test";
import { findSimilar, findSimilarGrouped, normalizeText, similarity } from "./similarity";

describe("similarity", () => {
  test("normalizes Turkish case and punctuation", () => {
    expect(normalizeText("  İLKYARDIM   dolabı, var mı? ")).toBe("ilkyardım dolabı var mı");
  });

  test("identical texts score 1, unrelated texts score 0", () => {
    expect(similarity("Aydınlatma yeterli mi?", "AYDINLATMA YETERLİ Mİ")).toBe(1);
    expect(similarity("Aydınlatma yeterli mi?", "Forklift muayene ediliyor")).toBe(0);
  });

  test("near duplicates score high", () => {
    const a = "Zemin kaymaya, düşmeye karşı uygun malzemeden yapılmış mı?";
    const b = "Zemin kaymaya, düşmeye karşı uygun malzemelerden yapılmış mı?";
    expect(similarity(a, b)).toBeGreaterThanOrEqual(0.6);
  });

  test("words are compared whole by default and by their first letters when stemming", () => {
    // Arrange
    const a = "Merdivenlerde korkuluk eksik";
    const b = "Merdiven korkuluğu yok";

    // Act / Assert
    expect(similarity(a, b)).toBe(0);
    expect(similarity(a, b, true)).toBeGreaterThan(0.6);
    expect(findSimilar(a, [{ key: "B", text: b }], 0.35)).toEqual([]);
    expect(findSimilar(a, [{ key: "B", text: b }], 0.35, 5, true)).toHaveLength(1);
  });

  test("findSimilar returns best matches first above the threshold", () => {
    const candidates = [
      { key: "A", text: "Forklift muayene ediliyor mu?" },
      { key: "B", text: "İlkyardım dolabı var mı?" },
      { key: "C", text: "İlkyardım dolabı malzemesi tam mı?" },
    ];
    const hits = findSimilar("Atölyede ilkyardım dolabı var mı?", candidates);
    expect(hits.map((h) => h.key)).toEqual(["B", "C"]);
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
  });

  test("findSimilarGrouped merges candidates with the same text before limiting", () => {
    const same = ["KL-04.03", "KL-12.10", "KL-35.05"].map((key) => ({
      key,
      text: "İlkyardım dolabı var mı?",
    }));
    const other = { key: "EE-09", text: "İlkyardım dolabı malzemesi tam mı?" };
    const hits = findSimilarGrouped("Atölyede ilkyardım dolabı var mı?", [...same, other], 0.35, 2);
    expect(hits.map((h) => h.keys)).toEqual([["KL-04.03", "KL-12.10", "KL-35.05"], ["EE-09"]]);
  });
});
