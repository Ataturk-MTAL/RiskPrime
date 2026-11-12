import { describe, expect, test } from "vite-plus/test";
import { addLocation, emptyAssessment, updateMeta } from "./assessment";
import { parse, serialize } from "./file";
import { BANK_VERSION } from "./question-bank";
import { startNextPeriod } from "./rollover";
import {
  canonicalContent,
  contentHash,
  isLocked,
  reviseDraft,
  signSnapshot,
  touch,
  verifySnapshot,
} from "./snapshot";

const T0 = "2026-09-01T08:00:00.000Z";
const T1 = "2026-10-01T08:00:00.000Z";
const T2 = "2026-11-01T08:00:00.000Z";
/** Same data with object keys in reverse order at every level. */
const reversed = (v: unknown): never =>
  (Array.isArray(v)
    ? v.map(reversed)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .reverse()
            .map(([k, x]) => [k, reversed(x)]),
        )
      : v) as never;
const sample = () => addLocation(emptyAssessment("2026-2027", T0), { id: "a-1", name: "ELE1" });

describe("contentHash", () => {
  test("is a 64-char hex SHA-256 and stable across key order", async () => {
    const a = sample();
    const reordered = reversed(a);
    expect(await contentHash(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(await contentHash(reordered)).toBe(await contentHash(a));
    expect(canonicalContent(reordered)).toBe(canonicalContent(a));
  });

  test("changes when the content changes", async () => {
    const a = sample();
    expect(await contentHash(updateMeta(a, { assessmentDate: "01.09.2026" }))).not.toBe(
      await contentHash(a),
    );
  });

  test("is unaffected by updatedAt, status, signedAt and contentHash", async () => {
    const a = sample();
    const mutated = {
      ...a,
      meta: { ...a.meta, updatedAt: T2, status: "signed" as const, signedAt: T1, contentHash: "x" },
    };
    expect(await contentHash(mutated)).toBe(await contentHash(a));
  });
});

describe("sign and verify", () => {
  test("a draft is unsigned and unlocked", async () => {
    expect(isLocked(sample())).toBe(false);
    expect(await verifySnapshot(sample())).toBe("unsigned");
  });

  test("signing locks, records time and hash, and verifies ok", async () => {
    const a = sample();
    const signed = await signSnapshot(a, T1);
    expect(isLocked(signed)).toBe(true);
    expect(signed.meta).toMatchObject({ status: "signed", signedAt: T1 });
    expect(signed.meta.contentHash).toBe(await contentHash(a));
    expect(await verifySnapshot(signed)).toBe("ok");
    expect(a.meta.status).toBe("draft");
  });

  test("a signed snapshot survives save and open and still verifies", async () => {
    const signed = await signSnapshot(sample(), T1);
    const r = parse(serialize(signed));
    expect("assessment" in r && (await verifySnapshot(r.assessment))).toBe("ok");
  });

  test("editing signed content is detected as modified", async () => {
    const signed = await signSnapshot(sample(), T1);
    expect(await verifySnapshot(updateMeta(signed, { validUntil: "01.09.2027" }))).toBe("modified");
  });

  test("signing twice is refused in Turkish", async () => {
    const signed = await signSnapshot(sample(), T1);
    await expect(signSnapshot(signed, T2)).rejects.toThrow("Bu dönem zaten imzalanmış.");
  });
});

describe("reviseDraft and touch", () => {
  test("opens revision + 1 pointing at the signed hash and drops the seal", async () => {
    const signed = await signSnapshot(sample(), T1);
    const draft = reviseDraft(signed, T2);
    expect(draft.meta).toEqual({
      createdAt: T0,
      updatedAt: T2,
      appVersion: signed.meta.appVersion,
      bankVersion: BANK_VERSION,
      status: "draft",
      revision: 2,
      previousHash: signed.meta.contentHash,
    });
    expect(isLocked(draft)).toBe(false);
    expect(signed.meta.status).toBe("signed");
  });

  test("refuses to revise a draft", () => {
    expect(() => reviseDraft(sample(), T1)).toThrow(/yalnızca imzalanmış/);
  });

  test("touch refreshes updatedAt and appVersion only", () => {
    const a = sample();
    const t = touch(a, T2, "9.9.9");
    expect(t.meta).toEqual({ ...a.meta, updatedAt: T2, appVersion: "9.9.9" });
    expect(a.meta.updatedAt).toBe(T0);
  });
});

describe("startNextPeriod meta", () => {
  test("from a draft: fresh revision 1 draft on the current bank, no previousHash", () => {
    const next = startNextPeriod(
      { ...sample(), meta: { ...sample().meta, bankVersion: "old" } },
      T2,
    );
    expect(next.meta).toMatchObject({
      createdAt: T2,
      updatedAt: T2,
      status: "draft",
      revision: 1,
      bankVersion: BANK_VERSION,
    });
    expect(next.meta.previousHash).toBeUndefined();
    expect(next.meta.signedAt).toBeUndefined();
  });

  test("from a signed period: chains to its contentHash", async () => {
    const signed = await signSnapshot(sample(), T1);
    const next = startNextPeriod(signed, T2);
    expect(next.meta.previousHash).toBe(signed.meta.contentHash);
    expect(next.meta.status).toBe("draft");
    expect(next.meta.contentHash).toBeUndefined();
    expect(next.period).toBe("2027-2028");
  });
});
