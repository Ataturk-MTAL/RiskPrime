import { describe, expect, test } from 'vitest';
import { addLocation, addRow, emptyAssessment, updateRow, updateSchool } from './assessment';
import { checklistRows, outputName, pdfData, riskRows } from './export-data';
import type { Assessment } from './types';

function sample(): Assessment {
  let a = updateSchool(emptyAssessment('2026-2027'), { name: 'Örnek MTAL', scope: 'Elektrik Alanı', grouping: 'building' });
  a = addLocation(a, { id: 'a-1', name: 'ELE1', building: 'C Blok', area: 'Elektrik' });
  a = addRow(a, 'a-1', { id: 'r-1', equipment: 'Matkap', hazard: 'Kesik', likelihood: 3, severity: 5 });
  return {
    ...a,
    checklists: [{
      id: 'k1', code: 'KL-11', name: 'Elektrik', source: 'external',
      items: [{ id: 'm1', no: '1', text: 'Pano kapalı mı?', answer: 'yes', note: '' }],
    }],
  };
}

describe('export-data', () => {
  test('risk rows carry score and level label', () => {
    const rows = riskRows(sample());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ location: 'ELE1', building: 'C Blok', score: 15, level: 'Yüksek', no: 1, status: 'Açık' });
  });

  test('unscored row has empty score and level', () => {
    const a = updateRow(sample(), 'a-1', 'r-1', { likelihood: null });
    const [r] = riskRows(a);
    expect(r.score).toBe('');
    expect(r.level).toBe('');
  });

  test('checklist rows turn the answer into readable text', () => {
    const [r] = checklistRows(sample());
    expect(r.code).toBe('KL-11');
    expect(r.answer).toBe('Evet');
  });

  test('blank pdf data clears scores and answers without touching the source', () => {
    const a = sample();
    const v = pdfData(a, 'blank');
    const row = v.groups[0].locations[0].rows[0];
    expect(v.kind).toBe('blank');
    expect(v.groups[0].title).toBe('C Blok');
    expect(row.likelihood).toBeNull();
    expect(row.level).toBeNull();
    expect(v.checklists[0].items[0].answer).toBe('');
    expect(a.locations[0].rows[0].likelihood).toBe(3);
    expect(a.checklists[0].items[0].answer).toBe('yes');
  });

  test('full pdf data carries level key and color', () => {
    const row = pdfData(sample(), 'full').groups[0].locations[0].rows[0];
    expect(row.score).toBe(15);
    expect(row.level?.key).toBe('high');
    expect(row.level?.background).toBe('#ff0000');
  });

  test('invalid pdf kind throws', () => {
    expect(() => pdfData(sample(), 'xyz' as never)).toThrow(/Geçersiz çıktı türü/);
  });

  test('output name includes period and suffix', () => {
    expect(outputName(sample(), 'xlsx')).toBe('risk-2026-2027.xlsx');
    expect(outputName(sample(), 'pdf', 'bos-form')).toBe('risk-2026-2027-bos-form.pdf');
    expect(outputName(emptyAssessment(''), 'docx')).toBe('risk-degerlendirme.docx');
  });
});
