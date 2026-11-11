import * as XLSX from "xlsx";
import { describe, expect, test } from "vite-plus/test";
import { readWorkbook } from "./excel";

function fileOf(sheet: XLSX.WorkSheet): File {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "S");
  const bytes = XLSX.write(book, { type: "array", bookType: "xlsx" });
  return new File([bytes], "t.xlsx");
}

describe("readWorkbook", () => {
  test("reads dates as dd.mm.yyyy and numbers as the text the user saw", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([["a"]]);
    sheet.A2 = { t: "n", v: 46337, z: "m/d/yy" }; // 11 Nov 2026
    sheet.A3 = { t: "n", v: 26.1, z: "0.00" }; // shown as 26.10
    sheet.A4 = { t: "s", v: "01.01" };
    sheet["!ref"] = "A1:A4";
    const { S } = await readWorkbook(fileOf(sheet));
    expect(S.map((r) => r[0])).toEqual(["a", "11.11.2026", "26.10", "01.01"]);
  });
});
