import { describe, it, expect } from "vite-plus/test";
import { parse } from "smol-toml";
import {
  nextKey,
  bumpVersion,
  questionBlock,
  appendQuestion,
  setBankVersion,
  insertChangelog,
  triageDecision,
  LABEL_INVALID,
  LABEL_DUPLICATE,
} from "./proposal.mjs";

const body = (text, reason = "Güvenlik için gerekli bir kontrol.") =>
  `### Madde metni\n\n${text}\n\n### İlgili MEB listesi\n\n_No response_\n\n### Mekân türleri\n\nworkshop\n\n### Dayanak (mevzuat/standart)\n\n_No response_\n\n### Gerekçe\n\n${reason}`;

const TEXT = "Lehim tezgâhında duman emiş sistemi çalışıyor ve filtresi temiz mi?";

describe("proposal helpers", () => {
  it("computes the next EE key with at least two digits", () => {
    expect(nextKey('key = "EE-01"\nkey = "EE-47"\n')).toBe("EE-48");
    expect(nextKey("")).toBe("EE-01");
    expect(nextKey('key = "EE-99"\n')).toBe("EE-100");
  });

  it("bumps the version within a year and rolls over at a new year", () => {
    expect(bumpVersion("2026.2", new Date(2026, 5, 1))).toBe("2026.3");
    expect(bumpVersion("2026.9", new Date(2027, 0, 2))).toBe("2027.1");
    expect(setBankVersion('[bank]\nversion = "2026.2"\n', "2026.3")).toBe(
      '[bank]\nversion = "2026.3"\n',
    );
  });

  it("escapes quotes, backslashes and newlines so the block round-trips", () => {
    const p = { text: 'Ürün "A" \\ B\nsatır', basis: 'Yönetmelik "x"', tags: ["wet", "common"] };
    const doc = parse(
      appendQuestion(
        '[[question]]\nkey = "EE-01"\ntags = []\ntext = "a"',
        questionBlock("EE-02", p),
      ),
    );
    expect(doc.question).toHaveLength(2);
    expect(doc.question[1]).toEqual({
      key: "EE-02",
      tags: ["wet", "common"],
      basis: p.basis,
      text: p.text,
    });
  });

  it("omits basis when empty", () => {
    expect(questionBlock("EE-02", { text: "t", basis: "", tags: [] })).not.toContain("basis");
  });

  it("inserts the changelog section above the newest one", () => {
    const log = "# Log\n\nGiriş.\n\n## 2026.2\n\nx\n";
    const out = insertChangelog(log, "2026.3", "- EE-48: m (öneri #7)");
    expect(out).toBe("# Log\n\nGiriş.\n\n## 2026.3\n\n- EE-48: m (öneri #7)\n\n## 2026.2\n\nx\n");
  });
});

describe("triageDecision", () => {
  const bank = [{ key: "EE-01", text: TEXT }];

  it("flags invalid proposals with the validation errors", () => {
    const d = triageDecision(body("kısa"), bank, []);
    expect(d.labels).toEqual([LABEL_INVALID]);
    expect(d.comment).toContain("Madde metni");
  });

  it("flags duplicates of bank items", () => {
    const d = triageDecision(body(TEXT), bank, []);
    expect(d.labels).toEqual([LABEL_DUPLICATE]);
    expect(d.comment).toContain("EE-01");
  });

  it("flags duplicates of other open proposals", () => {
    const d = triageDecision(body(TEXT), [], [{ number: 12, title: "x", body: body(TEXT) }]);
    expect(d.labels).toEqual([LABEL_DUPLICATE]);
    expect(d.comment).toContain("#12");
  });

  it("passes a clean proposal", () => {
    const d = triageDecision(
      body("Yangın söndürücülerin muayene tarihi geçerli ve etiketli mi?"),
      bank,
      [],
    );
    expect(d.labels).toEqual([]);
  });
});
