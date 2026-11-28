import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import type { FoodServingOption, Micronutrients, MacroNutrients } from '../src/types';
import type { UsdaFoodPayload, UsdaNutrientEntry } from '../src/usda-adapter';
import type { CatalogFoodInput } from '../src/catalog-schema';
import { cleanFoodDisplayName, generateFoodAliases } from '../src/name-normalizer';
import { extractUsdaPortions, enrichServingOptions } from '../src/portion-enrichment';
import { normalizeBarcode } from '../src/dedup';
import { parseHouseholdServingText } from '../src/scaling';
import {
  type AdapterLoadOptions,
  type CatalogAdapter,
  computeSearchRank,
  downloadStreamToCache,
  downloadToCache,
  extractZipFile,
  passesMacroQualityGate,
  round2,
} from './types';

export type UsdaDatasetKind = 'foundation' | 'sr_legacy' | 'fndds' | 'branded';

export const USDA_BRANDED_MAX_ITEMS = 25_000;

const FOUNDATION_ZIP_URL =
  'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2024-10-31.zip';
const SR_LEGACY_ZIP_URL =
  'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip';
const FNDDS_ZIP_URL =
  'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_json_2024-10-31.zip';
const BRANDED_CSV_ZIP_URL =
  'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2024-10-31.zip';

const FIXED_TIMESTAMP = 1700000000000;

function extractNutrient(entry: UsdaNutrientEntry): {
  id?: number;
  number?: string;
  unit: string;
  value: number;
} {
  const number =
    typeof entry.nutrient?.number === 'string' && entry.nutrient.number.trim()
      ? entry.nutrient.number.trim()
      : typeof entry.nutrientNumber === 'string' && entry.nutrientNumber.trim()
        ? entry.nutrientNumber.trim()
        : undefined;

  const id =
    typeof entry.nutrient?.id === 'number'
      ? entry.nutrient.id
      : typeof entry.nutrientId === 'number'
        ? entry.nutrientId
        : undefined;

  const unit = entry.nutrient?.unitName || entry.unitName || '';
  const rawValue =
    typeof entry.amount === 'number'
      ? entry.amount
      : typeof entry.value === 'number'
        ? entry.value
        : 0;

  const value = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
  return { id, number, unit, value };
}

function datasetToAccuracyTier(dataset: UsdaDatasetKind): 1 | 2 | 3 {
  switch (dataset) {
    case 'foundation':
    case 'sr_legacy':
      return 1;
    case 'fndds':
      return 2;
    case 'branded':
      return 3;
  }
}

function datasetToSourceProvider(dataset: UsdaDatasetKind): string {
  switch (dataset) {
    case 'foundation':
      return 'usda_foundation';
    case 'sr_legacy':
      return 'usda_sr_legacy';
    case 'fndds':
      return 'usda_fndds';
    case 'branded':
      return 'usda_branded';
  }
}

function extractCategory(raw: UsdaFoodPayload): string | undefined {
  const fc = raw.foodCategory as { description?: string } | string | undefined;
  if (typeof fc === 'string' && fc.trim()) return fc.trim();
  if (fc && typeof fc === 'object' && typeof fc.description === 'string' && fc.description.trim()) {
    return fc.description.trim();
  }
  const wweia = raw.wweiaFoodCategory as { wweiaFoodCategoryDescription?: string } | undefined;
  if (wweia?.wweiaFoodCategoryDescription?.trim()) {
    return wweia.wweiaFoodCategoryDescription.trim();
  }
  if (typeof raw.brandedFoodCategory === 'string' && raw.brandedFoodCategory.trim()) {
    return raw.brandedFoodCategory.trim();
  }
  return undefined;
}

/**
 * Pure parser for a single USDA FoodData Central JSON food object (Foundation, SR Legacy, FNDDS, Branded).
 */
export function parseUsdaFoodRecord(
  raw: UsdaFoodPayload,
  dataset: UsdaDatasetKind
): CatalogFoodInput | null {
  const fdcId = raw.fdcId ?? raw.id;
  if (typeof fdcId !== 'number' || !Number.isFinite(fdcId) || fdcId <= 0) {
    return null;
  }

  const rawName = (raw.description || raw.name || '').trim();
  if (!rawName) return null;

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  const micros: Micronutrients = {};

  const nutrientsList = Array.isArray(raw.foodNutrients) ? raw.foodNutrients : [];
  for (const entry of nutrientsList) {
    const { id: nutId, number: nutNum, unit, value } = extractNutrient(entry);
    if (!nutId && !nutNum) continue;

    // Never read kJ energy as kcal
    if (nutId === 1062 || nutNum === '268' || unit.toLowerCase() === 'kj') {
      continue;
    }

    if (nutId === 1008 || nutNum === '208' || nutId === 2047 || nutId === 2048) {
      if (calories === 0 || nutId === 1008 || nutNum === '208') {
        calories = value;
      }
    } else if (nutId === 1003 || nutNum === '203') {
      protein = value;
    } else if (nutId === 1004 || nutNum === '204') {
      fat = value;
    } else if (nutId === 1005 || nutNum === '205') {
      carbs = value;
    } else if (nutId === 1079 || nutNum === '291') {
      fiber = value;
    } else if (nutId === 1093 || nutNum === '307') {
      micros.sodiumMg = round2(value);
    } else if (nutId === 1092 || nutNum === '306') {
      micros.potassiumMg = round2(value);
    } else if (nutId === 1087 || nutNum === '301') {
      micros.calciumMg = round2(value);
    } else if (nutId === 1089 || nutNum === '303') {
      micros.ironMg = round2(value);
    } else if (nutId === 1090 || nutNum === '304') {
      micros.magnesiumMg = round2(value);
    } else if (nutId === 1095 || nutNum === '309') {
      micros.zincMg = round2(value);
    } else if (nutId === 1106 || nutNum === '320') {
      micros.vitaminAMcg = round2(value);
    } else if (nutId === 1162 || nutNum === '401') {
      micros.vitaminCMg = round2(value);
    } else if (nutId === 1114 || nutNum === '328') {
      micros.vitaminDMcg = round2(value);
    } else if (nutId === 1175 || nutNum === '415') {
      micros.vitaminB6Mg = round2(value);
    } else if (nutId === 1178 || nutNum === '418') {
      micros.vitaminB12Mcg = round2(value);
    } else if (nutId === 1177 || nutNum === '417') {
      micros.folateMcg = round2(value);
    } else if (nutId === 2000 || nutId === 1063 || nutNum === '269' || nutNum === '269.3') {
      if (micros.sugarG === undefined || value > 0) {
        micros.sugarG = round2(value);
      }
    } else if (nutId === 1235 || nutNum === '539') {
      micros.addedSugarG = round2(value);
    } else if (nutId === 1258 || nutNum === '606') {
      micros.saturatedFatG = round2(value);
    } else if (nutId === 1253 || nutNum === '601') {
      micros.cholesterolMg = round2(value);
    } else if (nutId === 1057 || nutNum === '262') {
      micros.caffeineMg = round2(value);
    } else if (nutId === 1018 || nutNum === '221') {
      micros.alcoholG = round2(value);
    }
  }

  const nutrientsPerBasis: MacroNutrients = {
    calories: round2(calories),
    protein: round2(protein),
    carbs: round2(carbs),
    fat: round2(fat),
    fiber: round2(fiber),
  };

  const accuracyTier = datasetToAccuracyTier(dataset);
  if (!passesMacroQualityGate(nutrientsPerBasis, accuracyTier)) {
    return null;
  }

  const brandRaw = (raw.brandName || raw.brandOwner || '').trim();
  const brand = brandRaw || undefined;
  const cleanName = cleanFoodDisplayName(rawName, brand);
  if (!cleanName) return null;

  const category = extractCategory(raw);
  const aliases = generateFoodAliases(rawName, cleanName);

  const unitLower = (raw.servingSizeUnit || '').trim().toLowerCase();
  const basis = unitLower === 'ml' ? 'per100ml' : 'per100g';
  const extractedPortions = extractUsdaPortions(raw);
  const servingWeightGrams =
    extractedPortions.length > 0
      ? extractedPortions[0].grams
      : typeof raw.servingSize === 'number' && Number.isFinite(raw.servingSize) && raw.servingSize > 0
        ? round2(raw.servingSize)
        : undefined;

  const servingOptions = enrichServingOptions({
    name: cleanName,
    category,
    basis,
    existingOptions: extractedPortions,
    servingWeightGrams,
  });

  const barcode = normalizeBarcode(typeof raw.gtinUpc === 'string' ? raw.gtinUpc : undefined);
  const canonicalId = `usda:${fdcId}`;
  const legacyIds = [`staple:${fdcId}`, `usda:${fdcId}`];

  const record: CatalogFoodInput = {
    id: canonicalId,
    barcode,
    source: 'usda',
    sourceProvider: datasetToSourceProvider(dataset),
    accuracyTier,
    region: 'US',
    ...(category ? { category } : {}),
    name: cleanName,
    ...(brand ? { brand } : {}),
    ...(aliases.length > 0 ? { aliases } : {}),
    basis,
    servingSize: 100,
    servingUnit: basis === 'per100ml' ? 'ml' : 'g',
    ...(servingWeightGrams ? { servingWeightGrams } : {}),
    servingOptions,
    nutrientsPerBasis,
    micronutrientsPerBasis: micros,
    updatedAt: FIXED_TIMESTAMP,
    legacyIds,
  };

  record.searchRank = computeSearchRank(record);
  return record;
}

function findJsonFileInDir(dir: string, pattern: RegExp): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir)) {
    if (entry.endsWith('.json') && pattern.test(entry)) {
      return path.join(dir, entry);
    }
  }
  return null;
}

async function loadUsdaZipDataset(
  url: string,
  zipName: string,
  jsonPattern: RegExp,
  rootKey: string,
  dataset: UsdaDatasetKind,
  usdaCacheDir: string,
  legacyCacheDir: string,
  options: AdapterLoadOptions
): Promise<CatalogFoodInput[]> {
  // Check existing extracted JSON in either cache dir
  let jsonPath =
    findJsonFileInDir(usdaCacheDir, jsonPattern) ||
    findJsonFileInDir(legacyCacheDir, jsonPattern);

  if (!jsonPath) {
    const zipPath = path.join(usdaCacheDir, zipName);
    const downloaded = await downloadToCache(url, zipPath, {
      offlineOnly: options.offlineOnly,
      timeoutMs: options.timeoutMs ?? 30_000,
    });
    if (!downloaded) return [];
    if (!extractZipFile(downloaded, usdaCacheDir)) return [];
    jsonPath = findJsonFileInDir(usdaCacheDir, jsonPattern);
  }

  if (!jsonPath || !fs.existsSync(jsonPath)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
    const list = Array.isArray(parsed[rootKey]) ? (parsed[rootKey] as UsdaFoodPayload[]) : [];
    const results: CatalogFoodInput[] = [];
    for (const raw of list) {
      const rec = parseUsdaFoodRecord(raw, dataset);
      if (rec) results.push(rec);
    }
    console.log(`[usda] Parsed ${results.length} records from ${dataset} (${path.basename(jsonPath)})`);
    return results;
  } catch (err) {
    console.warn(
      `[usda] Failed parsing ${jsonPath}: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else if (ch !== '\r') {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function buildCsvHeaderMap(headerLine: string): Map<string, number> {
  const cleaned = headerLine.startsWith('\uFEFF') ? headerLine.slice(1) : headerLine;
  const cols = parseCsvLine(cleaned);
  const map = new Map<string, number>();
  for (let i = 0; i < cols.length; i++) {
    map.set(cols[i].trim().toLowerCase(), i);
  }
  return map;
}

function findBrandedCsvFiles(
  dir: string
): { brandedFood: string; food: string; foodNutrient: string } | null {
  if (!fs.existsSync(dir)) return null;

  const candidateDirs: string[] = [dir];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      candidateDirs.push(path.join(dir, entry.name));
    }
  }

  for (const d of candidateDirs) {
    const brandedFood = path.join(d, 'branded_food.csv');
    const food = path.join(d, 'food.csv');
    const foodNutrient = path.join(d, 'food_nutrient.csv');
    if (fs.existsSync(brandedFood) && fs.existsSync(food) && fs.existsSync(foodNutrient)) {
      return { brandedFood, food, foodNutrient };
    }
  }
  return null;
}

function normalizeBrandNameKey(brand: string | undefined, description: string): string {
  const b = (brand || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const d = description.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${b}::${d}`;
}

interface BrandedMeta {
  brand?: string;
  barcode: string;
  category?: string;
  servingSize: number;
  servingUnit: string;
  householdText?: string;
  description?: string;
}

interface BrandedNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodiumMg?: number;
  sugarG?: number;
  saturatedFatG?: number;
}

/**
 * Streams USDA FoodData Central Branded CSV files (`branded_food.csv`, `food.csv`,
 * `food_nutrient.csv`) in 3 bounded passes without loading large CSVs into RAM.
 */
export async function parseUsdaBrandedCsvDir(
  dir: string,
  maxItems = USDA_BRANDED_MAX_ITEMS
): Promise<CatalogFoodInput[]> {
  if (maxItems <= 0) return [];
  const files = findBrandedCsvFiles(dir);
  if (!files) return [];

  const candidateCap = maxItems * 2;
  const candidates = new Map<number, BrandedMeta>();

  // Pass 1: stream branded_food.csv
  {
    const stream = fs.createReadStream(files.brandedFood, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let headerMap: Map<string, number> | null = null;
    try {
      for await (const line of rl) {
        if (!headerMap) {
          headerMap = buildCsvHeaderMap(line);
          continue;
        }
        if (!line.trim()) continue;
        const cols = parseCsvLine(line);
        const fdcIdIdx = headerMap.get('fdc_id');
        const upcIdx = headerMap.get('gtin_upc');
        const servingSizeIdx = headerMap.get('serving_size');
        if (fdcIdIdx === undefined || upcIdx === undefined || servingSizeIdx === undefined) {
          break;
        }

        const fdcId = Number(cols[fdcIdIdx]);
        if (!Number.isInteger(fdcId) || fdcId <= 0 || candidates.has(fdcId)) continue;

        const barcode = normalizeBarcode(cols[upcIdx]);
        if (!barcode) continue;

        const servingSize = Number(cols[servingSizeIdx]);
        if (!Number.isFinite(servingSize) || servingSize <= 0) continue;

        const servingUnitIdx = headerMap.get('serving_size_unit');
        const servingUnitRaw = servingUnitIdx !== undefined ? (cols[servingUnitIdx] || '').trim() : '';
        const servingUnitLower = servingUnitRaw.toLowerCase();
        if (
          servingUnitLower !== '' &&
          servingUnitLower !== 'g' &&
          servingUnitLower !== 'grm' &&
          servingUnitLower !== 'ml'
        ) {
          continue;
        }

        const brandNameIdx = headerMap.get('brand_name');
        const brandOwnerIdx = headerMap.get('brand_owner');
        const brandRaw = (
          (brandNameIdx !== undefined ? cols[brandNameIdx] : '') ||
          (brandOwnerIdx !== undefined ? cols[brandOwnerIdx] : '') ||
          ''
        ).trim();

        const categoryIdx = headerMap.get('branded_food_category');
        const categoryRaw = categoryIdx !== undefined ? (cols[categoryIdx] || '').trim() : '';

        const householdIdx = headerMap.get('household_serving_fulltext');
        const householdRaw = householdIdx !== undefined ? (cols[householdIdx] || '').trim() : '';

        candidates.set(fdcId, {
          ...(brandRaw ? { brand: brandRaw } : {}),
          barcode,
          ...(categoryRaw ? { category: categoryRaw } : {}),
          servingSize,
          servingUnit: servingUnitLower === 'ml' ? 'ml' : 'g',
          ...(householdRaw ? { householdText: householdRaw } : {}),
        });

        if (candidates.size >= candidateCap) {
          break;
        }
      }
    } finally {
      rl.close();
      stream.destroy();
    }
  }

  if (candidates.size === 0) return [];

  // Pass 2: stream food.csv, attach description and deduplicate normalized brand+name
  const seenBrandNames = new Set<string>();
  {
    const stream = fs.createReadStream(files.food, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let headerMap: Map<string, number> | null = null;
    try {
      for await (const line of rl) {
        if (!headerMap) {
          headerMap = buildCsvHeaderMap(line);
          continue;
        }
        if (!line.trim()) continue;
        const cols = parseCsvLine(line);
        const fdcIdIdx = headerMap.get('fdc_id');
        const descIdx = headerMap.get('description');
        if (fdcIdIdx === undefined || descIdx === undefined) break;

        const fdcId = Number(cols[fdcIdIdx]);
        const meta = candidates.get(fdcId);
        if (!meta) continue;

        const description = (cols[descIdx] || '').trim();
        if (!description) {
          candidates.delete(fdcId);
          continue;
        }

        const key = normalizeBrandNameKey(meta.brand, description);
        if (seenBrandNames.has(key)) {
          candidates.delete(fdcId);
          continue;
        }

        seenBrandNames.add(key);
        meta.description = description;
      }
    } finally {
      rl.close();
      stream.destroy();
    }
  }

  for (const [fdcId, meta] of candidates) {
    if (!meta.description) {
      candidates.delete(fdcId);
    }
  }

  if (candidates.size === 0) return [];

  // Pass 3: stream food_nutrient.csv for surviving fdc_ids
  const nutrientsMap = new Map<number, BrandedNutrients>();
  {
    const stream = fs.createReadStream(files.foodNutrient, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let headerMap: Map<string, number> | null = null;
    try {
      for await (const line of rl) {
        if (!headerMap) {
          headerMap = buildCsvHeaderMap(line);
          continue;
        }
        if (!line.trim()) continue;
        const cols = parseCsvLine(line);
        const fdcIdIdx = headerMap.get('fdc_id');
        const nutrientIdIdx = headerMap.get('nutrient_id');
        const amountIdx = headerMap.get('amount');
        if (fdcIdIdx === undefined || nutrientIdIdx === undefined || amountIdx === undefined) {
          break;
        }

        const fdcId = Number(cols[fdcIdIdx]);
        if (!candidates.has(fdcId)) continue;

        const nutrientId = Number(cols[nutrientIdIdx]);
        const amount = Number(cols[amountIdx]);
        if (!Number.isFinite(amount) || amount < 0) continue;

        let entry = nutrientsMap.get(fdcId);
        if (!entry) {
          entry = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
          nutrientsMap.set(fdcId, entry);
        }

        switch (nutrientId) {
          case 1008:
            entry.calories = amount;
            break;
          case 1003:
            entry.protein = amount;
            break;
          case 1005:
            entry.carbs = amount;
            break;
          case 1004:
            entry.fat = amount;
            break;
          case 1079:
            entry.fiber = amount;
            break;
          case 1093:
            entry.sodiumMg = round2(amount);
            break;
          case 2000:
            entry.sugarG = round2(amount);
            break;
          case 1258:
            entry.saturatedFatG = round2(amount);
            break;
        }
      }
    } finally {
      rl.close();
      stream.destroy();
    }
  }

  // Emit up to maxItems CatalogFoodInput records
  const results: CatalogFoodInput[] = [];
  for (const [fdcId, meta] of candidates) {
    if (results.length >= maxItems) break;
    if (!meta.description) continue;

    const rawNutrients = nutrientsMap.get(fdcId);
    if (!rawNutrients) continue;

    const nutrientsPerBasis: MacroNutrients = {
      calories: round2(rawNutrients.calories),
      protein: round2(rawNutrients.protein),
      carbs: round2(rawNutrients.carbs),
      fat: round2(rawNutrients.fat),
      fiber: round2(rawNutrients.fiber),
    };

    if (!passesMacroQualityGate(nutrientsPerBasis, 3)) {
      continue;
    }

    const cleanName = cleanFoodDisplayName(meta.description, meta.brand);
    if (!cleanName) continue;

    const aliases = generateFoodAliases(meta.description, cleanName);
    const basis = meta.servingUnit === 'ml' ? 'per100ml' : 'per100g';
    const baseUnit: 'g' | 'ml' = basis === 'per100ml' ? 'ml' : 'g';
    const servingWeightGrams = round2(meta.servingSize);

    const existingOptions: FoodServingOption[] = [];
    const parsedHousehold = meta.householdText
      ? parseHouseholdServingText(meta.householdText)
      : null;

    if (
      parsedHousehold &&
      parsedHousehold.count > 0 &&
      parsedHousehold.unit &&
      parsedHousehold.unit !== 'g' &&
      parsedHousehold.unit !== 'ml'
    ) {
      const perUnitGrams = round2(meta.servingSize / parsedHousehold.count);
      if (perUnitGrams > 0) {
        existingOptions.push({
          id: parsedHousehold.unit,
          label: `${parsedHousehold.unit} (${perUnitGrams}${baseUnit})`,
          unit: parsedHousehold.unit,
          grams: perUnitGrams,
          defaultAmount: 1,
        });
      }
    } else if (servingWeightGrams !== 100) {
      existingOptions.push({
        id: 'serving',
        label: `serving (${servingWeightGrams}${baseUnit})`,
        unit: 'serving',
        grams: servingWeightGrams,
        defaultAmount: 1,
      });
    }

    const servingOptions = enrichServingOptions({
      name: cleanName,
      category: meta.category,
      basis,
      existingOptions,
      servingWeightGrams,
    });

    const micros: Micronutrients = {};
    if (rawNutrients.sodiumMg !== undefined) micros.sodiumMg = rawNutrients.sodiumMg;
    if (rawNutrients.sugarG !== undefined) micros.sugarG = rawNutrients.sugarG;
    if (rawNutrients.saturatedFatG !== undefined) {
      micros.saturatedFatG = rawNutrients.saturatedFatG;
    }

    const canonicalId = `usda:${fdcId}`;
    const record: CatalogFoodInput = {
      id: canonicalId,
      barcode: meta.barcode,
      source: 'usda',
      sourceProvider: 'usda_branded',
      accuracyTier: 3,
      region: 'US',
      ...(meta.category ? { category: meta.category } : {}),
      name: cleanName,
      ...(meta.brand ? { brand: meta.brand } : {}),
      ...(aliases.length > 0 ? { aliases } : {}),
      basis,
      servingSize: 100,
      servingUnit: baseUnit,
      servingWeightGrams,
      servingOptions,
      nutrientsPerBasis,
      micronutrientsPerBasis: micros,
      updatedAt: FIXED_TIMESTAMP,
      legacyIds: [`staple:${fdcId}`, canonicalId],
    };

    record.searchRank = computeSearchRank(record);
    results.push(record);
  }

  return results;
}

async function loadUsdaBrandedDataset(
  usdaCacheDir: string,
  options: AdapterLoadOptions
): Promise<CatalogFoodInput[]> {
  const brandedDir = path.join(usdaCacheDir, 'branded');
  try {
    if (!findBrandedCsvFiles(brandedDir)) {
      const zipPath = path.join(usdaCacheDir, 'branded_csv.zip');
      const downloaded = await downloadStreamToCache(BRANDED_CSV_ZIP_URL, zipPath, {
        offlineOnly: options.offlineOnly,
        timeoutMs: options.timeoutMs ?? 300_000,
      });
      if (!downloaded) return [];
      if (!extractZipFile(downloaded, brandedDir)) return [];
    }

    const records = await parseUsdaBrandedCsvDir(brandedDir, USDA_BRANDED_MAX_ITEMS);
    if (records.length > 0) {
      console.log(`[usda] Parsed ${records.length} records from branded CSV slice`);
    }
    return records;
  } catch (err) {
    console.warn(
      `[usda] Failed loading branded CSV slice: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

export const usdaAdapter: CatalogAdapter = {
  id: 'usda',
  name: 'USDA FoodData Central (Foundation, SR Legacy, FNDDS, Branded)',
  license: 'CC0-1.0 / Public Domain',
  async load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]> {
    const usdaCacheDir = path.join(options.cacheDir, 'usda');
    const legacyCacheDir = path.join(os.tmpdir(), 'opencalory-usda');

    const foundation = await loadUsdaZipDataset(
      FOUNDATION_ZIP_URL,
      'foundation.zip',
      /foundation.*\.json$/i,
      'FoundationFoods',
      'foundation',
      usdaCacheDir,
      legacyCacheDir,
      options
    );

    const srLegacy = await loadUsdaZipDataset(
      SR_LEGACY_ZIP_URL,
      'sr_legacy.zip',
      /sr_legacy.*\.json$/i,
      'SRLegacyFoods',
      'sr_legacy',
      usdaCacheDir,
      legacyCacheDir,
      options
    );

    const fndds = await loadUsdaZipDataset(
      FNDDS_ZIP_URL,
      'fndds.zip',
      /survey.*\.json$/i,
      'SurveyFoods',
      'fndds',
      usdaCacheDir,
      legacyCacheDir,
      options
    );

    const branded = await loadUsdaBrandedDataset(usdaCacheDir, options);

    return [...foundation, ...srLegacy, ...fndds, ...branded];
  },
};
