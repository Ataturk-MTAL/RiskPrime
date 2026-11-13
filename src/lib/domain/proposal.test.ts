import { describe, expect, test } from "vite-plus/test";
import { parseIssueBody, renderIssueBody, validateProposal, type Proposal } from "./proposal";

const good: Proposal = {
  text: "Lehim tezgâhlarında yanmaz altlık kullanılıyor mu?",
  listCode: "KL-35",
  tags: ["workshop"],
  basis: "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği",
  reason: "Atölyelerde havya devrilmesiyle masa yanıkları oldu.",
};

describe("validateProposal", () => {
  test("accepts a complete proposal", () => {
    expect(validateProposal(good)).toEqual({ ok: true, value: good });
  });

  test("trims fields and drops unknown tags", () => {
    const r = validateProposal({ ...good, text: `  ${good.text}  `, tags: ["workshop", "x"] });
    expect(r.ok && r.value.text).toBe(good.text);
    expect(r.ok && r.value.tags).toEqual(["workshop"]);
  });

  test("lists every problem in Turkish", () => {
    const r = validateProposal({ text: "kısa", listCode: "35", tags: [], basis: "", reason: "" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors).toHaveLength(3);
  });

  test("rejects non-object input", () => {
    expect(validateProposal(null).ok).toBe(false);
  });
});

describe("issue body", () => {
  test("round-trips through render and parse", () => {
    expect(parseIssueBody(renderIssueBody(good))).toEqual(good);
  });

  test("parses a GitHub issue form body with empty optional fields", () => {
    const body = [
      "### Madde metni",
      "",
      good.text,
      "",
      "### İlgili MEB listesi",
      "",
      "_No response_",
      "",
      "### Mekân türleri",
      "",
      "_No response_",
      "",
      "### Dayanak (mevzuat/standart)",
      "",
      "_No response_",
      "",
      "### Gerekçe",
      "",
      good.reason,
    ].join("\n");
    expect(parseIssueBody(body)).toEqual({ ...good, listCode: "", tags: [], basis: "" });
  });
});
