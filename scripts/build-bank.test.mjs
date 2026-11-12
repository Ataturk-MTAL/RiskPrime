import { describe, it, expect } from "vite-plus/test";
import { parseSources, validate, buildBank } from "./build-bank.mjs";

const BANK = '[bank]\nversion = "9.1"\n';
const LOG = "# Log\n\n## 9.1\n\nilk\n";
const meb = (key, text = "Soru?", extra = "") =>
  `[[question]]\nkey = "${key}"\nlist = "${key.split(".")[0]}"\ntags = []\ntext = "${text}"\n${extra}`;
const files = (...extra) => [{ name: "bank.toml", content: BANK }, ...extra];
const problemsOf = (fs, log = LOG) => validate(parseSources(fs), log);

describe("build-bank", () => {
  it("orders MEB numerically first, then riskprime in file order", () => {
    const parsed = parseSources(
      files(
        {
          name: "riskprime-ee.toml",
          content:
            '[[question]]\nkey="EE-02"\ntags=["wet"]\ntext="b"\n\n[[question]]\nkey="EE-01"\ntags=[]\ntext="a"\n',
        },
        {
          name: "meb.toml",
          content: [meb("KL-02.01"), meb("KL-01.10"), meb("KL-01.02")].join("\n"),
        },
      ),
    );
    expect(validate(parsed, LOG)).toEqual([]);
    const { version, items } = buildBank(parsed);
    expect(version).toBe("9.1");
    expect(items.map((i) => i.key)).toEqual(["KL-01.02", "KL-01.10", "KL-02.01", "EE-02", "EE-01"]);
  });

  it("rejects a duplicate key", () => {
    const p = problemsOf(
      files({ name: "meb.toml", content: [meb("KL-01.01"), meb("KL-01.01")].join("\n") }),
    );
    expect(p.some((m) => m.includes("yinelenen"))).toBe(true);
  });

  it("rejects an unknown tag", () => {
    const content = meb("KL-01.01").replace("tags = []", 'tags = ["garage"]');
    expect(problemsOf(files({ name: "meb.toml", content })).length).toBe(1);
  });

  it("rejects a missing changelog heading", () => {
    const p = problemsOf(
      files({ name: "meb.toml", content: meb("KL-01.01") }),
      "# Log\n\n## 8.0\n",
    );
    expect(p).toEqual(['CHANGELOG.md: "## 9.1" başlığı yok']);
  });

  describe("common groups", () => {
    const group = (id, ...keys) =>
      `[[common]]\nid = "${id}"\ntitle = "Konu"\nkeys = [${keys.map((k) => `"${k}"`).join(", ")}]\n`;
    const withCommon = (...groups) =>
      files(
        {
          name: "meb.toml",
          content: [meb("KL-01.01"), meb("KL-01.02"), meb("KL-02.01"), meb("KL-03.01")].join("\n"),
        },
        { name: "common.toml", content: groups.join("\n") },
      );

    it("sets common on grouped items and emits the groups", () => {
      const parsed = parseSources(withCommon(group("OM-01", "KL-01.01", "KL-02.01")));
      expect(validate(parsed, LOG)).toEqual([]);
      const { items, common } = buildBank(parsed);
      expect(items.filter((i) => i.common).map((i) => i.key)).toEqual(["KL-01.01", "KL-02.01"]);
      expect(common).toEqual([{ id: "OM-01", title: "Konu", keys: ["KL-01.01", "KL-02.01"] }]);
    });

    it("rejects a key in two groups", () => {
      const p = problemsOf(
        withCommon(group("OM-01", "KL-01.01", "KL-02.01"), group("OM-02", "KL-01.01", "KL-03.01")),
      );
      expect(p.some((m) => m.includes("zaten OM-01"))).toBe(true);
    });

    it("rejects an unknown key", () => {
      const p = problemsOf(withCommon(group("OM-01", "KL-01.01", "KL-09.09")));
      expect(p.some((m) => m.includes("KL-09.09 bankada yok"))).toBe(true);
    });

    it("rejects two keys from the same list", () => {
      const p = problemsOf(withCommon(group("OM-01", "KL-01.01", "KL-01.02")));
      expect(p.some((m) => m.includes("aynı listeden"))).toBe(true);
    });
  });
});
