import fs from 'node:fs';
import path from 'node:path';
import type { FoodServingOption, MacroNutrients, Micronutrients } from '../src/types';
import type { CatalogFoodInput } from '../src/catalog-schema';
import { cleanFoodDisplayName, generateFoodAliases } from '../src/name-normalizer';
import { enrichServingOptions } from '../src/portion-enrichment';
import { normalizeBarcode } from '../src/dedup';
import {
  type AdapterLoadOptions,
  type CatalogAdapter,
  computeSearchRank,
  downloadToCache,
  extractZipFile,
  passesMacroQualityGate,
  round2,
} from './types';

const OPENNUTRITION_ZIP_URL =
  'https://downloads.opennutrition.app/opennutrition-dataset-2025.1.zip';

const FIXED_TIMESTAMP = 1700000000000;

function parseJsonColumn<T>(raw: string | undefined): T | null {
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toNumber(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val.trim());
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function parseServingField(rawServing: string | undefined): {
  servingWeightGrams?: number;
  servingOptions?: FoodServingOption[];
} {
  const parsed = parseJsonColumn<{
    common?: { quantity?: number; unit?: string };
    metric?: { quantity?: number; unit?: string };
  }>(rawServing);

  if (!parsed) return {};

  const metricQty = toNumber(parsed.metric?.quantity);
  const metricUnit = (parsed.metric?.unit || 'g').toLowerCase();
  const baseUnit: 'g' | 'ml' = metricUnit === 'ml' ? 'ml' : 'g';

  if (metricQty <= 0) return {};

  const commonUnit = (parsed.common?.unit || '').trim().toLowerCase();
  const commonQty = toNumber(parsed.common?.quantity) || 1;
  const perUnitGrams = round2(metricQty / commonQty);

  if (
    commonUnit &&
    commonUnit !== 'g' &&
    commonUnit !== 'ml' &&
    commonUnit !== 'oz' &&
    perUnitGrams > 0
  ) {
    return {
      servingWeightGrams: perUnitGrams,
      servingOptions: [
        {
          id: commonUnit,
          label: `${commonUnit} (${perUnitGrams}${baseUnit})`,
          unit: commonUnit,
          grams: perUnitGrams,
          defaultAmount: 1,
        },
      ],
    };
  }

  return {
    servingWeightGrams: round2(metricQty),
  };
}

/**
 * Pure parser for OpenNutrition ODbL TSV text.
 * Supports both official JSON-in-TSV columns (`nutrition_100g`, `serving`, `alternate_names`)
 * and flat numeric TSV columns (`calories`, `protein`, `carbs`, `fat`, `fiber`).
 */
export function parseOpenNutritionTsv(
  tsvText: string,
  options?: { maxItems?: number }
): CatalogFoodInput[] {
  const lines = tsvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map((h) => h.trim().toLowerCase());
  const idxOf = (name: string) => headers.indexOf(name);

  const colId = idxOf('id');
  const colName = idxOf('name');
  const colAlt = idxOf('alternate_names');
  const colType = idxOf('type');
  const colBrand = idxOf('brand');
  const colEan = idxOf('ean_13') !== -1 ? idxOf('ean_13') : idxOf('barcode');
  const colServing = idxOf('serving');
  const colNut100 = idxOf('nutrition_100g');
  const colCal = idxOf('calories');
  const colProt = idxOf('protein');
  const colCarbs = idxOf('carbs') !== -1 ? idxOf('carbs') : idxOf('carbohydrates');
  const colFat = idxOf('fat') !== -1 ? idxOf('fat') : idxOf('total_fat');
  const colFiber = idxOf('fiber') !== -1 ? idxOf('fiber') : idxOf('dietary_fiber');
  const colCategory = idxOf('category');

  if (colName === -1) return [];

  const maxItems = options?.maxItems ?? Number.POSITIVE_INFINITY;
  const results: CatalogFoodInput[] = [];

  for (let i = 1; i < lines.length && results.length < maxItems; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const cols = line.split('\t');

    const rawName = (cols[colName] || '').trim();
    if (!rawName) continue;

    const rawId = (colId !== -1 ? cols[colId] : '')?.trim() || `row-${i}`;
    const foodType = (colType !== -1 ? cols[colType] : '')?.trim().toLowerCase() || 'everyday';
    const brand = (colBrand !== -1 ? cols[colBrand] : '')?.trim() || undefined;
    const category = (colCategory !== -1 ? cols[colCategory] : '')?.trim() || undefined;
    const barcode = normalizeBarcode(colEan !== -1 ? cols[colEan] : undefined);

    const accuracyTier: 2 | 3 = foodType === 'everyday' ? 2 : 3;

    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let fiber = 0;
    const micros: Micronutrients = {};

    const nutObj =
      colNut100 !== -1 ? parseJsonColumn<Record<string, unknown>>(cols[colNut100]) : null;
    if (nutObj) {
      calories = toNumber(nutObj.calories ?? nutObj.energy_kcal);
      protein = toNumber(nutObj.protein);
      carbs = toNumber(nutObj.carbohydrates ?? nutObj.carbs);
      fat = toNumber(nutObj.total_fat ?? nutObj.fat);
      fiber = toNumber(nutObj.dietary_fiber ?? nutObj.fiber);

      const sodium = toNumber(nutObj.sodium);
      if (sodium > 0) micros.sodiumMg = round2(sodium);
      const sugars = toNumber(nutObj.total_sugars ?? nutObj.sugars);
      if (sugars > 0) micros.sugarG = round2(sugars);
      const satFat = toNumber(nutObj.saturated_fat);
      if (satFat > 0) micros.saturatedFatG = round2(satFat);
      const chol = toNumber(nutObj.cholesterol);
      if (chol > 0) micros.cholesterolMg = round2(chol);
      const potassium = toNumber(nutObj.potassium);
      if (potassium > 0) micros.potassiumMg = round2(potassium);
      const calcium = toNumber(nutObj.calcium);
      if (calcium > 0) micros.calciumMg = round2(calcium);
      const iron = toNumber(nutObj.iron);
      if (iron > 0) micros.ironMg = round2(iron);
    } else {
      calories = colCal !== -1 ? toNumber(cols[colCal]) : 0;
      protein = colProt !== -1 ? toNumber(cols[colProt]) : 0;
      carbs = colCarbs !== -1 ? toNumber(cols[colCarbs]) : 0;
      fat = colFat !== -1 ? toNumber(cols[colFat]) : 0;
      fiber = colFiber !== -1 ? toNumber(cols[colFiber]) : 0;
    }

    const nutrientsPerBasis: MacroNutrients = {
      calories: round2(calories),
      protein: round2(protein),
      carbs: round2(carbs),
      fat: round2(fat),
      fiber: round2(fiber),
    };

    if (!passesMacroQualityGate(nutrientsPerBasis, accuracyTier)) continue;

    const cleanName = cleanFoodDisplayName(rawName, brand);
    if (!cleanName) continue;

    const existingAliases =
      colAlt !== -1 ? parseJsonColumn<string[]>(cols[colAlt]) ?? undefined : undefined;
    const aliases = generateFoodAliases(rawName, cleanName, existingAliases);

    const { servingWeightGrams, servingOptions: parsedServing } = parseServingField(
      colServing !== -1 ? cols[colServing] : undefined
    );

    const servingOptions = enrichServingOptions({
      name: cleanName,
      category,
      basis: 'per100g',
      existingOptions: parsedServing,
      servingWeightGrams,
    });

    const record: CatalogFoodInput = {
      id: `opennutrition:${rawId}`,
      barcode,
      source: 'catalog',
      sourceProvider: 'opennutrition',
      accuracyTier,
      region: 'GLOBAL',
      ...(category ? { category } : {}),
      name: cleanName,
      ...(brand ? { brand } : {}),
      ...(aliases.length > 0 ? { aliases } : {}),
      basis: 'per100g',
      servingSize: 100,
      servingUnit: 'g',
      ...(servingWeightGrams ? { servingWeightGrams } : {}),
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

function findTsvRecursive(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findTsvRecursive(full);
      if (found) return found;
    } else if (entry.name.toLowerCase().endsWith('.tsv')) {
      return full;
    }
  }
  return null;
}

export const openNutritionAdapter: CatalogAdapter = {
  id: 'opennutrition',
  name: 'OpenNutrition Dataset (ODbL-1.0)',
  license: 'ODbL-1.0',
  async load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]> {
    const dir = path.join(options.cacheDir, 'opennutrition');
    let tsvPath = findTsvRecursive(dir);

    if (!tsvPath) {
      const zipPath = path.join(dir, 'opennutrition-dataset-2025.1.zip');
      const downloaded = await downloadToCache(OPENNUTRITION_ZIP_URL, zipPath, {
        offlineOnly: options.offlineOnly,
        timeoutMs: options.timeoutMs ?? 25_000,
      });
      if (!downloaded) {
        console.warn('[opennutrition] Dataset unavailable/offline — skipping gracefully.');
        return [];
      }
      if (!extractZipFile(downloaded, dir)) {
        return [];
      }
      tsvPath = findTsvRecursive(dir);
    }

    if (!tsvPath || !fs.existsSync(tsvPath)) {
      console.warn('[opennutrition] No TSV found in cache — skipping.');
      return [];
    }

    const text = fs.readFileSync(tsvPath, 'utf8');
    // Prioritize everyday/prepared/restaurant rows first, then up to 60k total OpenNutrition foods
    const maxItems = options.tier === 'core' ? 60_000 : Number.POSITIVE_INFINITY;
    const items = parseOpenNutritionTsv(text, { maxItems });
    console.log(`[opennutrition] Loaded ${items.length} foods from ${path.basename(tsvPath)}`);
    return items;
  },
};
