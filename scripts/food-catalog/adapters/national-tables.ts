import fs from 'node:fs';
import path from 'node:path';
import type { MacroNutrients, Micronutrients } from '../src/types';
import type { CatalogFoodInput } from '../src/catalog-schema';
import { cleanFoodDisplayName, generateFoodAliases } from '../src/name-normalizer';
import { enrichServingOptions } from '../src/portion-enrichment';
import {
  type AdapterLoadOptions,
  type CatalogAdapter,
  computeSearchRank,
  downloadStreamToCache,
  extractZipFile,
  passesMacroQualityGate,
  round2,
} from './types';

export type NationalTableId =
  | 'cnf'
  | 'cofid'
  | 'ausnut'
  | 'mext'
  | 'bls'
  | 'ciqual'
  | 'nevo'
  | 'frida'
  | 'livsmedelsverket'
  | 'taco'
  | 'indb';

export interface NationalTableDefinition {
  id: NationalTableId;
  name: string;
  region: string;
  license: string;
  fileCandidates: string[];
  downloadUrl?: string;
}

export const NATIONAL_TABLE_SOURCES: NationalTableDefinition[] = [
  {
    id: 'cnf',
    name: 'Canadian Nutrient File (Health Canada)',
    region: 'CA',
    license: 'Open Government Licence – Canada',
    fileCandidates: ['cnf.json', 'cnf.csv'],
    downloadUrl:
      'https://www.canada.ca/content/dam/hc-sc/migration/hc-sc/fn-an/alt_formats/zip/nutrition/fiche-nutri-data/cnf-fcen-csv.zip',
  },
  {
    id: 'cofid',
    name: 'UK McCance & Widdowson CoFID',
    region: 'GB',
    license: 'Open Government Licence v3.0',
    fileCandidates: ['cofid.json', 'cofid.csv'],
  },
  {
    id: 'ausnut',
    name: 'FSANZ AUSNUT / Australian Food Composition Database',
    region: 'AU',
    license: 'CC BY 4.0',
    fileCandidates: ['ausnut.json', 'ausnut.csv'],
  },
  {
    id: 'mext',
    name: 'Japan MEXT Standard Tables of Food Composition',
    region: 'JP',
    license: 'CC BY 4.0 / Japanese Government Open Data',
    fileCandidates: ['mext.json', 'mext.csv'],
  },
  {
    id: 'bls',
    name: 'Germany Bundeslebensmittelschlüssel (BLS 4.0)',
    region: 'DE',
    license: 'CC BY 4.0',
    fileCandidates: ['bls.json', 'bls.csv'],
  },
  {
    id: 'ciqual',
    name: 'France ANSES-Ciqual Food Composition Table',
    region: 'FR',
    license: 'Licence Ouverte / Open Licence v2.0',
    fileCandidates: ['ciqual.json', 'ciqual.csv'],
    downloadUrl:
      'https://www.data.gouv.fr/fr/datasets/r/05a47412-0617-41b6-a958-1678f60a5f07',
  },
  {
    id: 'nevo',
    name: 'Netherlands RIVM NEVO Table',
    region: 'NL',
    license: 'CC0 / Public Domain',
    fileCandidates: ['nevo.json', 'nevo.csv'],
  },
  {
    id: 'frida',
    name: 'Denmark DTU Food Frida Database',
    region: 'DK',
    license: 'CC BY 4.0',
    fileCandidates: ['frida.json', 'frida.csv'],
  },
  {
    id: 'livsmedelsverket',
    name: 'Sweden Livsmedelsverket Food Database',
    region: 'SE',
    license: 'CC BY 4.0 / Public Data',
    fileCandidates: ['livsmedelsverket.json', 'livsmedelsverket.csv'],
  },
  {
    id: 'taco',
    name: 'Brazil TBCA / TACO (NEPA-UNICAMP)',
    region: 'BR',
    license: 'Open Academic / CC BY',
    fileCandidates: ['taco.json', 'tbca.json', 'taco.csv'],
  },
  {
    id: 'indb',
    name: 'India Anuvaad INDB / NIN IFCT',
    region: 'IN',
    license: 'CC BY 4.0',
    fileCandidates: ['indb.json', 'ifct.json', 'indb.csv'],
  },
];

const TABLE_MAP = new Map<NationalTableId, NationalTableDefinition>(
  NATIONAL_TABLE_SOURCES.map((def) => [def.id, def])
);

const FIXED_TIMESTAMP = 1700000000000;

function toNum(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.trim().replace(',', '.');
    if (!cleaned || cleaned === 'Tr' || cleaned === '-' || cleaned === 'N') return 0;
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickField(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

/**
 * Pure row parser for any of the 11 national food composition tables.
 */
export function parseNationalTableRows(
  tableId: NationalTableId,
  rows: Record<string, unknown>[]
): CatalogFoodInput[] {
  const def = TABLE_MAP.get(tableId);
  if (!def) return [];

  const results: CatalogFoodInput[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;

    const rawNameVal = pickField(row, [
      'name',
      'food_name',
      'FoodName',
      'alim_nom_eng',
      'alim_nom_fr',
      'description',
      'Description',
    ]);
    const rawName = typeof rawNameVal === 'string' ? rawNameVal.trim() : '';
    if (!rawName) continue;

    const rawIdVal = pickField(row, ['id', 'food_code', 'FoodCode', 'alim_code', 'code']);
    const rawId = rawIdVal != null ? String(rawIdVal).trim() : `${i + 1}`;

    const calories = toNum(
      pickField(row, ['calories', 'energy_kcal', 'kcal', 'Energy (kcal)', 'enerc_kcal'])
    );
    const protein = toNum(pickField(row, ['protein', 'Protein', 'protein_g', 'protcnt']));
    const carbs = toNum(
      pickField(row, ['carbs', 'carbohydrates', 'Carbohydrate', 'carb_g', 'chocdf'])
    );
    const fat = toNum(pickField(row, ['fat', 'total_fat', 'Fat', 'fat_g', 'fatce']));
    const fiber = toNum(pickField(row, ['fiber', 'fibre', 'dietary_fiber', 'fibtg']));

    const nutrientsPerBasis: MacroNutrients = {
      calories: round2(calories),
      protein: round2(protein),
      carbs: round2(carbs),
      fat: round2(fat),
      fiber: round2(fiber),
    };

    if (!passesMacroQualityGate(nutrientsPerBasis, 1)) continue;

    const micros: Micronutrients = {};
    const microMap: Array<[keyof Micronutrients, string[]]> = [
      ['sodiumMg', ['sodiumMg', 'sodium_mg', 'sodium']],
      ['potassiumMg', ['potassiumMg', 'potassium_mg', 'potassium']],
      ['calciumMg', ['calciumMg', 'calcium_mg', 'calcium']],
      ['ironMg', ['ironMg', 'iron_mg', 'iron']],
      ['sugarG', ['sugarG', 'sugar_g', 'sugars', 'sugar']],
      ['saturatedFatG', ['saturatedFatG', 'saturated_fat_g', 'saturated_fat', 'saturatedFat']],
      ['cholesterolMg', ['cholesterolMg', 'cholesterol_mg', 'cholesterol']],
    ];
    for (const [microKey, candidates] of microMap) {
      const val = toNum(pickField(row, candidates));
      if (val > 0) {
        micros[microKey] = round2(val);
      }
    }

    const categoryVal = pickField(row, ['category', 'food_group', 'group', 'alim_grp_nom_eng']);
    const category = typeof categoryVal === 'string' && categoryVal.trim() ? categoryVal.trim() : undefined;

    const cleanName = cleanFoodDisplayName(rawName);
    if (!cleanName) continue;

    const existingAliases = Array.isArray(row.aliases)
      ? row.aliases.filter((a): a is string => typeof a === 'string')
      : undefined;
    const aliases = generateFoodAliases(rawName, cleanName, existingAliases);

    const servingOptions = enrichServingOptions({
      name: cleanName,
      category,
      basis: 'per100g',
    });

    const record: CatalogFoodInput = {
      id: `${tableId}:${rawId}`,
      barcode: null,
      source: 'catalog',
      sourceProvider: tableId,
      accuracyTier: 1,
      region: def.region,
      ...(category ? { category } : {}),
      name: cleanName,
      ...(aliases.length > 0 ? { aliases } : {}),
      basis: 'per100g',
      servingSize: 100,
      servingUnit: 'g',
      servingOptions,
      nutrientsPerBasis,
      micronutrientsPerBasis: micros,
      updatedAt: FIXED_TIMESTAMP,
    };

    record.searchRank = computeSearchRank(record);
    results.push(record);
  }

  return results;
}

function detectDelimiter(headerLine: string): ',' | ';' | '\t' {
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  let tabs = 0;

  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (ch === ',') commas++;
      else if (ch === ';') semicolons++;
      else if (ch === '\t') tabs++;
    }
  }

  if (tabs > commas && tabs >= semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

/**
 * RFC-4180 delimited parser supporting configurable delimiter (comma, semicolon, tab),
 * quoted fields with embedded delimiters/newlines, escaped double-quotes (""), and UTF-8 BOM.
 */
export function parseRfc4180Delimited(
  text: string,
  delimiter?: ',' | ';' | '\t'
): string[][] {
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
  if (!clean.trim()) return [];

  const firstNewline = clean.search(/\r?\n/);
  const headerSample = firstNewline === -1 ? clean : clean.slice(0, firstNewline);
  const sep = delimiter ?? detectDelimiter(headerSample);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field.length === 0) {
      inQuotes = true;
      continue;
    }

    if (ch === sep) {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((c) => c.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parses a national-table CSV/TSV/semicolon-delimited text into row objects using RFC-4180 parsing.
 */
export function parseNationalTableCsv(
  csvText: string,
  delimiter?: ',' | ';' | '\t'
): Record<string, unknown>[] {
  const parsedRows = parseRfc4180Delimited(csvText, delimiter);
  if (parsedRows.length < 2) return [];

  const headers = parsedRows[0].map((h) => h.trim());
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < parsedRows.length; i++) {
    const vals = parsedRows[i];
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (vals[idx] ?? '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

type NormalizedNutrientField =
  | 'calories'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'fiber'
  | 'sodium'
  | 'sugar'
  | 'saturatedFat'
  | 'calcium'
  | 'iron'
  | 'potassium';

const CNF_NUTRIENT_CODE_MAP: Record<string, NormalizedNutrientField> = {
  '208': 'calories',
  '203': 'protein',
  '205': 'carbs',
  '204': 'fat',
  '291': 'fiber',
  '307': 'sodium',
  '269': 'sugar',
  '606': 'saturatedFat',
  '301': 'calcium',
  '303': 'iron',
  '306': 'potassium',
};

const CNF_NUTRIENT_SYMBOL_MAP: Record<string, NormalizedNutrientField> = {
  KCAL: 'calories',
  PROT: 'protein',
  CARB: 'carbs',
  FAT: 'fat',
  TDF: 'fiber',
  NA: 'sodium',
  TSUG: 'sugar',
  FASAT: 'saturatedFat',
  CA: 'calcium',
  FE: 'iron',
  K: 'potassium',
};

function findFileCaseInsensitive(dir: string, targetFilename: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const targetLower = targetFilename.toLowerCase();

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase() === targetLower) {
      return path.join(dir, entry.name);
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const subDir = path.join(dir, entry.name);
    let subEntries: fs.Dirent[];
    try {
      subEntries = fs.readdirSync(subDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const subEntry of subEntries) {
      if (subEntry.isFile() && subEntry.name.toLowerCase() === targetLower) {
        return path.join(subDir, subEntry.name);
      }
    }
  }

  return null;
}

function getFieldCaseInsensitive(row: Record<string, unknown>, candidates: string[]): string {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined && row[candidate] !== null) {
      return String(row[candidate]).trim();
    }
  }
  const lowerCandidates = new Set(candidates.map((c) => c.toLowerCase()));
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined && v !== null && lowerCandidates.has(k.toLowerCase())) {
      return String(v).trim();
    }
  }
  return '';
}

/**
 * Joins Health Canada Canadian Nutrient File (CNF) CSV tables (`FOOD NAME.csv`,
 * `NUTRIENT NAME.csv`, `NUTRIENT AMOUNT.csv`, and optional `FOOD GROUP.csv`)
 * into normalized row objects compatible with `parseNationalTableRows('cnf', rows)`.
 */
export function parseCnfCsvDir(dir: string): Record<string, unknown>[] {
  const foodNamePath = findFileCaseInsensitive(dir, 'FOOD NAME.csv');
  const nutrientNamePath = findFileCaseInsensitive(dir, 'NUTRIENT NAME.csv');
  const nutrientAmountPath = findFileCaseInsensitive(dir, 'NUTRIENT AMOUNT.csv');

  if (!foodNamePath || !nutrientNamePath || !nutrientAmountPath) {
    return [];
  }

  const groupMap = new Map<string, string>();
  const foodGroupPath = findFileCaseInsensitive(dir, 'FOOD GROUP.csv');
  if (foodGroupPath) {
    const groupRows = parseNationalTableCsv(fs.readFileSync(foodGroupPath, 'utf8'));
    for (const row of groupRows) {
      const groupId = getFieldCaseInsensitive(row, ['FoodGroupID', 'FoodGroupCode']);
      const groupName = getFieldCaseInsensitive(row, ['FoodGroupName', 'FoodGroupNameF']);
      if (groupId && groupName) {
        groupMap.set(groupId, groupName);
      }
    }
  }

  const nutrientIdToField = new Map<string, NormalizedNutrientField>();
  const nutrientNameRows = parseNationalTableCsv(fs.readFileSync(nutrientNamePath, 'utf8'));
  for (const row of nutrientNameRows) {
    const nutrientId = getFieldCaseInsensitive(row, ['NutrientID']);
    if (!nutrientId) continue;
    const nutrientCode = getFieldCaseInsensitive(row, ['NutrientCode']);
    const nutrientSymbol = getFieldCaseInsensitive(row, ['NutrientSymbol']).toUpperCase();
    const mapped =
      CNF_NUTRIENT_CODE_MAP[nutrientCode] ??
      CNF_NUTRIENT_SYMBOL_MAP[nutrientSymbol] ??
      (!nutrientCode && !nutrientSymbol ? CNF_NUTRIENT_CODE_MAP[nutrientId] : undefined);
    if (mapped) {
      nutrientIdToField.set(nutrientId, mapped);
    }
  }

  const nutrientsByFood = new Map<string, Partial<Record<NormalizedNutrientField, number>>>();
  const nutrientAmountRows = parseNationalTableCsv(fs.readFileSync(nutrientAmountPath, 'utf8'));
  for (const row of nutrientAmountRows) {
    const foodId = getFieldCaseInsensitive(row, ['FoodID']);
    const nutrientId = getFieldCaseInsensitive(row, ['NutrientID']);
    if (!foodId || !nutrientId) continue;
    const field =
      nutrientIdToField.get(nutrientId) ??
      (nutrientNameRows.length === 0 ? CNF_NUTRIENT_CODE_MAP[nutrientId] : undefined);
    if (!field) continue;

    const val = toNum(getFieldCaseInsensitive(row, ['NutrientValue']));
    let entry = nutrientsByFood.get(foodId);
    if (!entry) {
      entry = {};
      nutrientsByFood.set(foodId, entry);
    }
    entry[field] = val;
  }

  const foodNameRows = parseNationalTableCsv(fs.readFileSync(foodNamePath, 'utf8'));
  const normalizedRows: Record<string, unknown>[] = [];
  for (const row of foodNameRows) {
    const foodId = getFieldCaseInsensitive(row, ['FoodID', 'FoodCode']);
    const description = getFieldCaseInsensitive(row, ['FoodDescription', 'FoodDescriptionF']);
    if (!foodId || !description) continue;

    const groupId = getFieldCaseInsensitive(row, ['FoodGroupID']);
    const category =
      (groupId ? groupMap.get(groupId) : undefined) ??
      (getFieldCaseInsensitive(row, ['FoodGroupName', 'Category']) || undefined);

    const n = nutrientsByFood.get(foodId) ?? {};
    normalizedRows.push({
      id: foodId,
      name: description,
      ...(category ? { category } : {}),
      calories: n.calories ?? 0,
      protein: n.protein ?? 0,
      carbs: n.carbs ?? 0,
      fat: n.fat ?? 0,
      fiber: n.fiber ?? 0,
      sodium: n.sodium ?? 0,
      sugar: n.sugar ?? 0,
      saturatedFat: n.saturatedFat ?? 0,
      calcium: n.calcium ?? 0,
      iron: n.iron ?? 0,
      potassium: n.potassium ?? 0,
    });
  }

  return normalizedRows;
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseCiqualNumber(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val !== 'string') return 0;
  const trimmed = val.trim();
  if (!trimmed) return 0;
  const lower = trimmed.toLowerCase();
  if (lower === '-' || lower === 'traces' || lower === 'tr' || lower === 'n' || lower === 'na') {
    return 0;
  }
  if (trimmed.startsWith('<')) return 0;
  const cleaned = trimmed.replace(/\s+/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function findCiqualHeader(
  headers: Array<{ raw: string; norm: string }>,
  predicates: Array<(norm: string) => boolean>
): string | null {
  for (const pred of predicates) {
    const match = headers.find((h) => pred(h.norm));
    if (match) return match.raw;
  }
  return null;
}

/**
 * Parses semicolon- or tab-delimited ANSES-Ciqual CSV text (French or English headers)
 * into normalized row objects compatible with `parseNationalTableRows('ciqual', rows)`.
 * Rejects HTML error pages by returning `[]`.
 */
export function parseCiqualCsvText(text: string): Record<string, unknown>[] {
  if (!text) return [];
  const trimmedStart = text.trimStart();
  if (
    !trimmedStart ||
    trimmedStart.startsWith('<') ||
    trimmedStart.slice(0, 200).toLowerCase().includes('<html')
  ) {
    return [];
  }

  const rawRows = parseNationalTableCsv(text);
  if (rawRows.length === 0) return [];

  const headerMeta = Object.keys(rawRows[0]).map((raw) => ({
    raw,
    norm: normalizeHeader(raw),
  }));

  const idCol = findCiqualHeader(headerMeta, [
    (h) => h === 'alim_code',
    (h) => h === 'id' || h === 'code',
  ]);
  const nameCol = findCiqualHeader(headerMeta, [
    (h) => h === 'alim_nom_eng',
    (h) => h === 'alim_nom_fr',
    (h) => h === 'name' || h === 'food_name',
  ]);
  if (!nameCol) return [];

  const categoryCol = findCiqualHeader(headerMeta, [
    (h) => h === 'alim_grp_nom_eng',
    (h) => h === 'alim_grp_nom_fr',
    (h) => h === 'alim_ssgrp_nom_eng',
    (h) => h === 'alim_ssgrp_nom_fr',
    (h) => h === 'category' || h === 'food_group',
  ]);
  const caloriesCol = findCiqualHeader(headerMeta, [
    (h) => h.includes('kcal') && (h.includes('1169') || h.includes('reglement') || h.includes('regulation')),
    (h) => h.includes('kcal'),
    (h) => h === 'calories',
  ]);
  const proteinCol = findCiqualHeader(headerMeta, [
    (h) => (h.startsWith('protein') || h.startsWith('proteine')) && h.includes('6.25'),
    (h) => h.startsWith('protein') || h.startsWith('proteine'),
  ]);
  const carbsCol = findCiqualHeader(headerMeta, [
    (h) => h.startsWith('carbohydrate') || h.startsWith('glucide') || h === 'carbs',
  ]);
  const fatCol = findCiqualHeader(headerMeta, [
    (h) => (h.startsWith('fat') && !h.startsWith('fatty')) || h.startsWith('lipide') || h === 'total fat',
  ]);
  const fiberCol = findCiqualHeader(headerMeta, [
    (h) => h.startsWith('fibre') || h.startsWith('fiber') || h.startsWith('dietary fib'),
  ]);
  const sodiumCol = findCiqualHeader(headerMeta, [(h) => h.startsWith('sodium')]);
  const sugarCol = findCiqualHeader(headerMeta, [
    (h) => h.startsWith('sugar') || h.startsWith('sucre'),
  ]);
  const satFatCol = findCiqualHeader(headerMeta, [
    (h) =>
      h.includes('saturated') ||
      h.includes('satures') ||
      h.startsWith('ag sat') ||
      h.startsWith('fa sat'),
  ]);
  const calciumCol = findCiqualHeader(headerMeta, [(h) => h.startsWith('calcium')]);
  const ironCol = findCiqualHeader(headerMeta, [
    (h) => h.startsWith('iron') || h === 'fer' || h.startsWith('fer ') || h.startsWith('fer('),
  ]);
  const potassiumCol = findCiqualHeader(headerMeta, [(h) => h.startsWith('potassium')]);

  const normalizedRows: Record<string, unknown>[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const name = String(row[nameCol] ?? '').trim();
    if (!name) continue;

    const id = idCol ? String(row[idCol] ?? '').trim() || `${i + 1}` : `${i + 1}`;
    const category = categoryCol ? String(row[categoryCol] ?? '').trim() || undefined : undefined;

    normalizedRows.push({
      id,
      name,
      ...(category ? { category } : {}),
      calories: caloriesCol ? parseCiqualNumber(row[caloriesCol]) : 0,
      protein: proteinCol ? parseCiqualNumber(row[proteinCol]) : 0,
      carbs: carbsCol ? parseCiqualNumber(row[carbsCol]) : 0,
      fat: fatCol ? parseCiqualNumber(row[fatCol]) : 0,
      fiber: fiberCol ? parseCiqualNumber(row[fiberCol]) : 0,
      sodium: sodiumCol ? parseCiqualNumber(row[sodiumCol]) : 0,
      sugar: sugarCol ? parseCiqualNumber(row[sugarCol]) : 0,
      saturatedFat: satFatCol ? parseCiqualNumber(row[satFatCol]) : 0,
      calcium: calciumCol ? parseCiqualNumber(row[calciumCol]) : 0,
      iron: ironCol ? parseCiqualNumber(row[ironCol]) : 0,
      potassium: potassiumCol ? parseCiqualNumber(row[potassiumCol]) : 0,
    });
  }

  return normalizedRows;
}

function writeJsonAtomic(destPath: string, data: unknown): void {
  const tmpPath = `${destPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data), 'utf8');
  fs.renameSync(tmpPath, destPath);
}

async function tryAutoDownloadNationalTable(
  def: NationalTableDefinition,
  nationalDir: string,
  options: AdapterLoadOptions
): Promise<string | null> {
  if (!def.downloadUrl || options.offlineOnly) return null;

  const destJson = path.join(nationalDir, `${def.id}.json`);
  const timeoutMs = options.timeoutMs ?? 60_000;

  try {
    if (def.id === 'cnf') {
      const zipPath = path.join(nationalDir, 'cnf-fcen-csv.zip');
      const downloaded = await downloadStreamToCache(def.downloadUrl, zipPath, {
        offlineOnly: options.offlineOnly,
        timeoutMs,
      });
      if (!downloaded) return null;

      // Validate ZIP magic bytes ('PK') before extraction so HTML error pages fail fast
      const header = Buffer.alloc(2);
      const fd = fs.openSync(downloaded, 'r');
      let bytesRead = 0;
      try {
        bytesRead = fs.readSync(fd, header, 0, 2, 0);
      } finally {
        fs.closeSync(fd);
      }
      if (bytesRead < 2 || header[0] !== 0x50 || header[1] !== 0x4b) {
        try {
          fs.unlinkSync(downloaded);
        } catch {
          // Ignore cleanup errors
        }
        console.warn(
          `[national-tables] Auto-downloaded ${def.id} payload is not a valid ZIP archive (possibly HTML error page) — skipping cache write.`
        );
        return null;
      }

      const extractDir = path.join(nationalDir, 'cnf-extracted');
      const extracted = extractZipFile(downloaded, extractDir);
      if (!extracted) {
        try {
          fs.unlinkSync(downloaded);
        } catch {
          // Ignore cleanup errors
        }
        return null;
      }

      const rows = parseCnfCsvDir(extractDir);
      if (rows.length === 0) {
        console.warn(`[national-tables] Auto-downloaded ${def.id} archive yielded 0 structured rows — skipping cache write.`);
        return null;
      }

      writeJsonAtomic(destJson, rows);
      return destJson;
    }

    if (def.id === 'ciqual') {
      const rawCsvPath = path.join(nationalDir, 'ciqual-raw.csv');
      const downloaded = await downloadStreamToCache(def.downloadUrl, rawCsvPath, {
        offlineOnly: options.offlineOnly,
        timeoutMs,
      });
      if (!downloaded) return null;

      const rawText = fs.readFileSync(downloaded, 'utf8');
      const rows = parseCiqualCsvText(rawText);
      if (rows.length === 0) {
        try {
          fs.unlinkSync(downloaded);
        } catch {
          // Ignore cleanup errors
        }
        console.warn(`[national-tables] Auto-downloaded ${def.id} payload yielded 0 structured rows (possibly HTML error page) — skipping cache write.`);
        return null;
      }

      writeJsonAtomic(destJson, rows);
      return destJson;
    }
  } catch (err) {
    console.warn(
      `[national-tables] Auto-download failed for ${def.id}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return null;
}

export const nationalTablesAdapter: CatalogAdapter = {
  id: 'national-tables',
  name: 'National Food Composition Tables (CNF, CoFID, AUSNUT, MEXT, BLS, Ciqual, NEVO, Frida, Livsmedelsverket, TACO, INDB)',
  license: 'Public Domain / CC BY 4.0 / Open Government',
  async load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]> {
    const nationalDir = path.join(options.cacheDir, 'national');
    const results: CatalogFoodInput[] = [];

    if (!fs.existsSync(nationalDir)) {
      if (options.offlineOnly) {
        console.log(
          `[national-tables] No cached national table files in ${nationalDir} — skipping (place cached JSON/CSV files there to compile them).`
        );
        return results;
      }
      fs.mkdirSync(nationalDir, { recursive: true });
    }

    for (const def of NATIONAL_TABLE_SOURCES) {
      let foundFile: string | null = null;
      for (const candidate of def.fileCandidates) {
        const full = path.join(nationalDir, candidate);
        if (fs.existsSync(full) && fs.statSync(full).size > 0) {
          foundFile = full;
          break;
        }
      }

      if (!foundFile && def.downloadUrl && !options.offlineOnly) {
        foundFile = await tryAutoDownloadNationalTable(def, nationalDir, options);
      }

      if (!foundFile) {
        console.log(`[national-tables] ${def.id} (${def.region}) not cached — skipping.`);
        continue;
      }

      try {
        const rawText = fs.readFileSync(foundFile, 'utf8');
        let rows: Record<string, unknown>[] = [];
        if (foundFile.endsWith('.json')) {
          const parsed = JSON.parse(rawText);
          rows = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.foods)
              ? parsed.foods
              : [];
        } else if (def.id === 'ciqual') {
          rows = parseCiqualCsvText(rawText);
          if (rows.length === 0) {
            rows = parseNationalTableCsv(rawText);
          }
        } else {
          rows = parseNationalTableCsv(rawText);
        }
        const items = parseNationalTableRows(def.id, rows);
        console.log(`[national-tables] Loaded ${items.length} foods from ${def.id} (${def.region})`);
        results.push(...items);
      } catch (err) {
        console.warn(
          `[national-tables] Failed parsing ${foundFile}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return results;
  },
};
