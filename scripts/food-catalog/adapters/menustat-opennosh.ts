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
  passesItemMacroQualityGate,
  round2,
} from './types';

const FIXED_TIMESTAMP = 1700000000000;

function parseRfc4180Csv(text: string): string[][] {
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
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
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((c) => c.trim().length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim().length > 0)) rows.push(row);
  }
  return rows;
}

function toNum(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val.trim());
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * Pure parser for NYC DOHMH MenuStat CSV exports.
 */
export function parseMenuStatCsv(csvText: string): CatalogFoodInput[] {
  const rows = parseRfc4180Csv(csvText);
  if (rows.length < 2) return [];

  const headerMap = new Map<string, number>();
  rows[0].forEach((h, idx) => {
    const key = h.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (key && !headerMap.has(key)) headerMap.set(key, idx);
  });

  const cell = (r: string[], ...keys: string[]): string => {
    for (const k of keys) {
      const idx = headerMap.get(k);
      if (idx !== undefined && idx < r.length) {
        const v = r[idx].trim();
        if (v) return v;
      }
    }
    return '';
  };

  const results: CatalogFoodInput[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const rawName = cell(r, 'item_name', 'menu_item_name', 'name');
    if (!rawName) continue;

    const restaurant = cell(r, 'restaurant', 'brand') || undefined;
    const category = cell(r, 'food_category', 'category') || undefined;
    const rawId = cell(r, 'menu_item_id', 'id') || `row-${i}`;

    const calories = round2(toNum(cell(r, 'calories')));
    const protein = round2(toNum(cell(r, 'protein')));
    const carbs = round2(toNum(cell(r, 'carbohydrates', 'carbs')));
    const fat = round2(toNum(cell(r, 'total_fat', 'fat')));
    const fiber = round2(toNum(cell(r, 'dietary_fiber', 'fiber')));

    const servingSizeVal = toNum(cell(r, 'serving_size'));
    const servingUnitRaw = cell(r, 'serving_size_unit', 'serving_unit').toLowerCase();
    const servingWeightGrams =
      servingSizeVal > 0 && (servingUnitRaw === 'g' || servingUnitRaw === 'ml' || !servingUnitRaw)
        ? round2(servingSizeVal)
        : undefined;

    const nutrientsPerBasis: MacroNutrients = { calories, protein, carbs, fat, fiber };
    const candidateCheck = {
      basis: 'perServing' as const,
      servingWeightGrams,
      nutrientsPerBasis,
      accuracyTier: 3 as const,
    };
    if (!passesItemMacroQualityGate(candidateCheck)) continue;

    const micros: Micronutrients = {};
    const sodium = toNum(cell(r, 'sodium'));
    if (sodium > 0) micros.sodiumMg = round2(sodium);
    const sugar = toNum(cell(r, 'sugar', 'sugars'));
    if (sugar > 0) micros.sugarG = round2(sugar);
    const satFat = toNum(cell(r, 'saturated_fat'));
    if (satFat > 0) micros.saturatedFatG = round2(satFat);
    const chol = toNum(cell(r, 'cholesterol'));
    if (chol > 0) micros.cholesterolMg = round2(chol);
    const pot = toNum(cell(r, 'potassium'));
    if (pot > 0) micros.potassiumMg = round2(pot);

    const cleanName = cleanFoodDisplayName(rawName, restaurant);
    const aliases = generateFoodAliases(rawName, cleanName);

    const initialOptions: FoodServingOption[] | undefined = servingWeightGrams
      ? [
          {
            id: 'serving',
            label: `serving (${servingWeightGrams}g)`,
            unit: 'serving',
            grams: servingWeightGrams,
            defaultAmount: 1,
          },
        ]
      : undefined;

    const servingOptions = enrichServingOptions({
      name: cleanName,
      category,
      basis: 'perServing',
      existingOptions: initialOptions,
      servingWeightGrams,
    });

    const record: CatalogFoodInput = {
      id: `menustat:${rawId}`,
      barcode: null,
      source: 'catalog',
      sourceProvider: 'menustat',
      accuracyTier: 3,
      region: 'US',
      ...(category ? { category } : {}),
      name: cleanName,
      ...(restaurant ? { brand: restaurant } : {}),
      ...(aliases.length > 0 ? { aliases } : {}),
      basis: 'perServing',
      servingSize: 1,
      servingUnit: 'serving',
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

/**
 * Pure parser for OpenNosh CC0 community food JSON / pack payloads.
 */
export function parseOpenNoshJson(jsonText: string): CatalogFoodInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }

  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? Array.isArray((parsed as Record<string, unknown>).foods)
        ? ((parsed as Record<string, unknown>).foods as unknown[])
        : Array.isArray((parsed as Record<string, unknown>).items)
          ? ((parsed as Record<string, unknown>).items as unknown[])
          : []
      : [];

  const results: CatalogFoodInput[] = [];

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;

    const rawName = typeof rec.name === 'string' ? rec.name.trim() : '';
    if (!rawName) continue;

    const nutObj =
      rec.nutrientsPerBasis && typeof rec.nutrientsPerBasis === 'object'
        ? (rec.nutrientsPerBasis as Record<string, unknown>)
        : rec;

    const nutrientsPerBasis: MacroNutrients = {
      calories: round2(toNum(nutObj.calories)),
      protein: round2(toNum(nutObj.protein)),
      carbs: round2(toNum(nutObj.carbs ?? nutObj.carbohydrates)),
      fat: round2(toNum(nutObj.fat ?? nutObj.totalFat)),
      fiber: round2(toNum(nutObj.fiber ?? nutObj.dietaryFiber)),
    };

    const basis =
      rec.basis === 'perServing' || rec.basis === 'per100ml' || rec.basis === 'per100g'
        ? rec.basis
        : 'per100g';
    const servingWeightGrams =
      typeof rec.servingWeightGrams === 'number' && rec.servingWeightGrams > 0
        ? round2(rec.servingWeightGrams)
        : undefined;

    if (
      !passesItemMacroQualityGate({
        basis,
        servingWeightGrams,
        nutrientsPerBasis,
        accuracyTier: 3,
      })
    ) {
      continue;
    }

    const brand = typeof rec.brand === 'string' && rec.brand.trim() ? rec.brand.trim() : undefined;
    const region =
      typeof rec.region === 'string' && rec.region.trim() ? rec.region.trim().toUpperCase() : 'GLOBAL';
    const category =
      typeof rec.category === 'string' && rec.category.trim() ? rec.category.trim() : undefined;
    const barcode = normalizeBarcode(typeof rec.barcode === 'string' ? rec.barcode : undefined);
    const rawId = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : `row-${i + 1}`;

    const cleanName = cleanFoodDisplayName(rawName, brand);
    const existingAliases = Array.isArray(rec.aliases)
      ? rec.aliases.filter((a): a is string => typeof a === 'string')
      : undefined;
    const aliases = generateFoodAliases(rawName, cleanName, existingAliases);

    const existingOptions = Array.isArray(rec.servingOptions)
      ? (rec.servingOptions as FoodServingOption[])
      : undefined;
    const servingOptions = enrichServingOptions({
      name: cleanName,
      category,
      basis,
      existingOptions,
      servingWeightGrams,
    });

    const record: CatalogFoodInput = {
      id: rawId.startsWith('opennosh:') ? rawId : `opennosh:${rawId}`,
      barcode,
      source: 'catalog',
      sourceProvider: 'opennosh',
      accuracyTier: 3,
      region,
      ...(category ? { category } : {}),
      name: cleanName,
      ...(brand ? { brand } : {}),
      ...(aliases.length > 0 ? { aliases } : {}),
      basis,
      servingSize: basis === 'perServing' ? 1 : 100,
      servingUnit: basis === 'perServing' ? 'serving' : basis === 'per100ml' ? 'ml' : 'g',
      ...(servingWeightGrams ? { servingWeightGrams } : {}),
      servingOptions,
      nutrientsPerBasis,
      micronutrientsPerBasis:
        rec.micronutrientsPerBasis && typeof rec.micronutrientsPerBasis === 'object'
          ? (rec.micronutrientsPerBasis as Micronutrients)
          : {},
      updatedAt: FIXED_TIMESTAMP,
    };

    record.searchRank = computeSearchRank(record);
    results.push(record);
  }

  return results;
}

export const menuStatOpenNoshAdapter: CatalogAdapter = {
  id: 'menustat-opennosh',
  name: 'NYC DOHMH MenuStat & OpenNosh Community Packs',
  license: 'Public Domain / CC0-1.0',
  async load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]> {
    const results: CatalogFoodInput[] = [];
    const menuStatDir = path.join(options.cacheDir, 'menustat');
    const openNoshDir = path.join(options.cacheDir, 'opennosh');

    if (fs.existsSync(menuStatDir)) {
      for (const file of fs.readdirSync(menuStatDir)) {
        if (file.toLowerCase().endsWith('.csv')) {
          const items = parseMenuStatCsv(fs.readFileSync(path.join(menuStatDir, file), 'utf8'));
          console.log(`[menustat] Loaded ${items.length} items from ${file}`);
          results.push(...items);
        }
      }
    } else {
      console.log(`[menustat] No cached CSV in ${menuStatDir} — skipping.`);
    }

    if (fs.existsSync(openNoshDir)) {
      for (const file of fs.readdirSync(openNoshDir)) {
        if (file.toLowerCase().endsWith('.json')) {
          const items = parseOpenNoshJson(fs.readFileSync(path.join(openNoshDir, file), 'utf8'));
          console.log(`[opennosh] Loaded ${items.length} items from ${file}`);
          results.push(...items);
        }
      }
    } else {
      console.log(`[opennosh] No cached JSON in ${openNoshDir} — skipping.`);
    }

    return results;
  },
};
