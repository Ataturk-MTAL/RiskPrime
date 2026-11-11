// Word export (docx). The level cell of each risk row is shaded with its matrix color.
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { checklistRows, outputName, riskRows } from "../domain/export-data";
import { LEVELS } from "../domain/matrix";
import type { Assessment } from "../domain/types";
import { CHECKLIST_COLUMNS, RISK_COLUMNS, toTable, type Column } from "./columns";
import { downloadBlob } from "./download";

const CELL_SIZE = 16;
const EXCLUDED_RISK_KEYS = ["building", "area"];
const LEVEL_BY_LABEL = new Map(Object.values(LEVELS).map((l) => [l.label, l]));

function wordCell(value: string | number, isHeader: boolean): TableCell {
  const text = String(value ?? "");
  const level = isHeader ? undefined : LEVEL_BY_LABEL.get(text);
  return new TableCell({
    shading: level
      ? { fill: level.background.slice(1), type: ShadingType.CLEAR, color: "auto" }
      : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isHeader || Boolean(level),
            size: CELL_SIZE,
            color: level?.text.slice(1),
          }),
        ],
      }),
    ],
  });
}

function wordTable<T>(rows: T[], columns: readonly Column<T>[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: toTable(rows, columns).map(
      (cells, i) =>
        new TableRow({ tableHeader: i === 0, children: cells.map((c) => wordCell(c, i === 0)) }),
    ),
  });
}

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
  new Paragraph({ text, heading: level });

export async function downloadWord(a: Assessment): Promise<void> {
  const signatories = a.school.signatories.map(
    (s) => new Paragraph(`${s.title}: ${s.name || "................"}    İmza: ........`),
  );
  const doc = new Document({
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `T.C. MİLLÎ EĞİTİM BAKANLIĞI — ${a.school.name}`, bold: true }),
            ],
          }),
          heading(
            `${a.school.scope} Risk Değerlendirmesi ve Kontrol Listesi ${a.period}`.trim(),
            HeadingLevel.TITLE,
          ),
          new Paragraph(
            `Değerlendirme tarihi: ${a.assessmentDate || "..../..../20...."}    Geçerlilik tarihi: ${a.validUntil || "..../..../20...."}`,
          ),
          heading("Risk analiz tablosu", HeadingLevel.HEADING_1),
          wordTable(
            riskRows(a),
            RISK_COLUMNS.filter(([k]) => !EXCLUDED_RISK_KEYS.includes(k as string)),
          ),
          heading("Kontrol listeleri", HeadingLevel.HEADING_1),
          wordTable(checklistRows(a), CHECKLIST_COLUMNS),
          heading("Risk değerlendirme ekibi", HeadingLevel.HEADING_1),
          ...signatories,
        ],
      },
    ],
  });
  downloadBlob(await Packer.toBlob(doc), outputName(a, "docx"));
}
