// Ready location templates per area: content/locations/*.toml -> src/lib/data/locations.json.
// Run through scripts/build-bank.mjs (pnpm bank:build / bank:check).
import { parse } from "smol-toml";

// Keep in sync with LocationType in src/lib/domain/types.ts.
export const LOCATION_TYPES = ["workshop", "storage", "office", "wet", "common"];
const REQUIRED_ROW_FIELDS = ["equipment", "hazard", "affected", "action", "responsible"];
const ROW_FIELDS = new Set([...REQUIRED_ROW_FIELDS, "existingControls"]);
const DEFAULT_EXISTING_CONTROLS = "Yok";

const isText = (v) => typeof v === "string" && v.trim() !== "" && v === v.trim();

/** files: [{ name, content }] -> { areas: [{ file, area, locations }], problems } */
export function parseLocationFiles(files) {
  const problems = [];
  const areas = [];
  for (const { name, content } of files) {
    try {
      const doc = parse(content);
      areas.push({ file: name, area: doc.area, locations: doc.location ?? [] });
    } catch (e) {
      problems.push(`${name}: TOML okunamadı: ${e.message}`);
    }
  }
  return { areas, problems };
}

function rowProblems(row, where) {
  const missing = REQUIRED_ROW_FIELDS.filter((k) => !isText(row[k])).map(
    (k) => `${where}: ${k} boş`,
  );
  const unknown = Object.keys(row)
    .filter((k) => !ROW_FIELDS.has(k))
    .map((k) => `${where}: bilinmeyen alan ${k}`);
  return [...missing, ...unknown];
}

function locationProblems(loc, where, mebCodes) {
  const out = [];
  if (!LOCATION_TYPES.includes(loc.type)) {
    out.push(`${where}: tür şunlardan olmalı: ${LOCATION_TYPES.join(", ")}`);
  }
  const codes = loc.checklists ?? [];
  if (!Array.isArray(codes)) out.push(`${where}: checklists bir liste olmalı`);
  else {
    codes
      .filter((c) => !mebCodes.has(c))
      .forEach((c) => out.push(`${where}: ${c} kütüphanede yok`));
    if (new Set(codes).size !== codes.length) out.push(`${where}: checklists içinde yinelenen kod`);
  }
  const rows = loc.row ?? [];
  if (!rows.length) out.push(`${where}: en az bir risk satırı gerekli`);
  rows.forEach((r, i) => out.push(...rowProblems(r, `${where} satır ${i + 1}`)));
  return out;
}

/** context: { mebCodes: Set of MEB list codes in the library, takenNames: Set of existing location names }. */
export function validateLocations({ areas, problems }, { mebCodes, takenNames }) {
  const out = [...problems];
  const seen = new Set(takenNames);
  for (const { file, area, locations } of areas) {
    if (!isText(area)) out.push(`${file}: area boş`);
    for (const loc of locations) {
      const where = `${file} ${loc.name ?? "(adsız)"}`;
      if (!isText(loc.name)) out.push(`${where}: name boş`);
      else if (seen.has(loc.name)) out.push(`${where}: yinelenen mekân adı`);
      seen.add(loc.name);
      out.push(...locationProblems(loc, where, mebCodes));
    }
  }
  return out;
}

/** Library LocationTemplate[] in file order (files sorted by the caller). */
export function buildLocations({ areas }) {
  return areas.flatMap(({ area, locations }) =>
    locations.map((loc) => ({
      name: loc.name,
      type: loc.type,
      building: "",
      area,
      checklists: loc.checklists ?? [],
      rows: loc.row.map((r) => ({
        equipment: r.equipment,
        hazard: r.hazard,
        affected: r.affected,
        existingControls: r.existingControls ?? DEFAULT_EXISTING_CONTROLS,
        action: r.action,
        responsible: r.responsible,
      })),
    })),
  );
}
