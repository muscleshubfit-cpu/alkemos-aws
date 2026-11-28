import type {
  FoodItem,
  FoodServingOption,
  Micronutrients,
  NutritionBasis,
} from './types';

export const CATALOG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS catalog_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS foods (
  rowid INTEGER PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  barcode TEXT,
  source TEXT NOT NULL,
  accuracy_tier INTEGER NOT NULL,
  region TEXT NOT NULL DEFAULT 'GLOBAL',
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  aliases TEXT NOT NULL DEFAULT '',
  basis TEXT NOT NULL,
  serving_size REAL NOT NULL,
  serving_unit TEXT NOT NULL,
  serving_weight_grams REAL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fat REAL NOT NULL,
  fiber REAL NOT NULL,
  micronutrients_json TEXT NOT NULL,
  serving_options_json TEXT NOT NULL,
  search_rank REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_foods_barcode
  ON foods(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_foods_tier_rank
  ON foods(accuracy_tier, search_rank DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
  name,
  brand,
  aliases,
  category,
  content='foods',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2',
  prefix='2 3'
);

CREATE TABLE IF NOT EXISTS food_id_aliases (
  legacy_id TEXT PRIMARY KEY,
  canonical_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_barcode_aliases (
  barcode TEXT PRIMARY KEY,
  canonical_id TEXT NOT NULL
);
`;

export interface CatalogFoodRow {
  rowid: number;
  id: string;
  barcode: string | null;
  source: string;
  accuracy_tier: number;
  region: string;
  category: string;
  name: string;
  brand: string;
  aliases: string;
  basis: string;
  serving_size: number;
  serving_unit: string;
  serving_weight_grams: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micronutrients_json: string;
  serving_options_json: string;
  search_rank: number;
}

export interface CatalogFoodInput extends FoodItem {
  sourceProvider: string;
  accuracyTier: 1 | 2 | 3 | 4;
  searchRank?: number;
  legacyIds?: string[];
}

export interface CatalogManifest {
  version: string;
  tier: 'core' | 'expanded';
  sha256: string;
  builtAt: string;
  foodCount: number;
  gzipBytes: number;
  rawBytes: number;
  license: 'ODbL-1.0';
}

const VALID_FOOD_ITEM_SOURCES = new Set<FoodItem['source']>([
  'staple',
  'usda',
  'off',
  'catalog',
  'fatsecret',
  'edamam',
  'nutritionix',
  'custom_barcode',
  'custom_food',
]);

const VALID_BASES = new Set<NutritionBasis>(['per100g', 'per100ml', 'perServing']);

const ALIAS_DELIMITER = ' | ';

function normalizeFoodItemSource(raw: string): FoodItem['source'] {
  if (VALID_FOOD_ITEM_SOURCES.has(raw as FoodItem['source'])) {
    return raw as FoodItem['source'];
  }
  return 'catalog';
}

function normalizeAccuracyTier(raw: number): 1 | 2 | 3 | 4 {
  if (raw === 1 || raw === 2 || raw === 3 || raw === 4) {
    return raw;
  }
  return 4;
}

function normalizeBasis(raw: string): NutritionBasis {
  if (VALID_BASES.has(raw as NutritionBasis)) {
    return raw as NutritionBasis;
  }
  return 'per100g';
}

function parseJsonSafe<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function serializeAliases(aliases?: string[]): string {
  if (!aliases || aliases.length === 0) return '';
  return aliases
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0)
    .join(ALIAS_DELIMITER);
}

function deserializeAliases(raw: string): string[] | undefined {
  if (!raw || raw.trim().length === 0) return undefined;
  const parsed = raw
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parsed.length > 0 ? parsed : undefined;
}

export function catalogRowToFoodItem(row: CatalogFoodRow): FoodItem {
  const micros = parseJsonSafe<Micronutrients>(row.micronutrients_json, {});
  const servingOptionsRaw = parseJsonSafe<FoodServingOption[]>(row.serving_options_json, []);
  const servingOptions =
    Array.isArray(servingOptionsRaw) && servingOptionsRaw.length > 0
      ? servingOptionsRaw
      : undefined;
  const aliases = deserializeAliases(row.aliases);

  return {
    id: row.id,
    barcode: row.barcode ?? null,
    source: normalizeFoodItemSource(row.source),
    accuracyTier: normalizeAccuracyTier(row.accuracy_tier),
    ...(row.category ? { category: row.category } : {}),
    ...(aliases ? { aliases } : {}),
    name: row.name,
    ...(row.brand ? { brand: row.brand } : {}),
    region: row.region || 'GLOBAL',
    basis: normalizeBasis(row.basis),
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    ...(row.serving_weight_grams != null ? { servingWeightGrams: row.serving_weight_grams } : {}),
    ...(servingOptions ? { servingOptions } : {}),
    nutrientsPerBasis: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
    },
    micronutrientsPerBasis: micros && typeof micros === 'object' ? micros : {},
    updatedAt: 0,
  };
}

export function foodItemToCatalogRow(item: CatalogFoodInput): Omit<CatalogFoodRow, 'rowid'> {
  return {
    id: item.id,
    barcode: item.barcode ?? null,
    source: item.sourceProvider || item.source,
    accuracy_tier: item.accuracyTier,
    region: item.region ?? 'GLOBAL',
    category: item.category ?? '',
    name: item.name,
    brand: item.brand ?? '',
    aliases: serializeAliases(item.aliases),
    basis: item.basis,
    serving_size: item.servingSize,
    serving_unit: item.servingUnit,
    serving_weight_grams: item.servingWeightGrams ?? null,
    calories: item.nutrientsPerBasis.calories,
    protein: item.nutrientsPerBasis.protein,
    carbs: item.nutrientsPerBasis.carbs,
    fat: item.nutrientsPerBasis.fat,
    fiber: item.nutrientsPerBasis.fiber,
    micronutrients_json: JSON.stringify(item.micronutrientsPerBasis ?? {}),
    serving_options_json: JSON.stringify(item.servingOptions ?? []),
    search_rank: item.searchRank ?? 0,
  };
}
