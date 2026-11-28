import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { Readable } from 'node:stream';
import type { FoodServingOption, MacroNutrients, Micronutrients } from '../src/types';
import type { CatalogFoodInput } from '../src/catalog-schema';
import { cleanFoodDisplayName, generateFoodAliases } from '../src/name-normalizer';
import { enrichServingOptions } from '../src/portion-enrichment';
import { normalizeBarcode } from '../src/dedup';
import { parseHouseholdServingText } from '../src/scaling';
import {
  type AdapterLoadOptions,
  type CatalogAdapter,
  computeSearchRank,
  passesMacroQualityGate,
  round2,
} from './types';

const FIXED_TIMESTAMP = 1700000000000;

/**
 * Explicit non-US regional quotas for Core tier so SEA, East Asia, Europe, Oceania,
 * Canada, India, and LatAm packaged foods are well-represented without US domination.
 */
export const CORE_OFF_REGION_QUOTAS: Record<string, number> = {
  // SEA
  PH: 7000,
  SG: 3500,
  MY: 3500,
  ID: 3500,
  TH: 3500,
  VN: 2500,
  // East Asia
  JP: 7000,
  KR: 5000,
  TW: 3000,
  HK: 2500,
  // Europe
  GB: 9000,
  FR: 9000,
  DE: 9000,
  ES: 6000,
  IT: 6000,
  NL: 4500,
  // Oceania
  AU: 6000,
  NZ: 3000,
  // Canada, India, LatAm
  CA: 6000,
  IN: 5000,
  MX: 4000,
  BR: 4000,
  // US & fallback
  US: 10000,
  GLOBAL: 6000,
};

const COUNTRY_TAG_TO_ISO: Record<string, string> = {
  'en:philippines': 'PH',
  'en:singapore': 'SG',
  'en:malaysia': 'MY',
  'en:indonesia': 'ID',
  'en:thailand': 'TH',
  'en:vietnam': 'VN',
  'en:japan': 'JP',
  'en:south-korea': 'KR',
  'en:taiwan': 'TW',
  'en:hong-kong': 'HK',
  'en:united-kingdom': 'GB',
  'en:france': 'FR',
  'en:germany': 'DE',
  'en:spain': 'ES',
  'en:italy': 'IT',
  'en:netherlands': 'NL',
  'en:australia': 'AU',
  'en:new-zealand': 'NZ',
  'en:canada': 'CA',
  'en:india': 'IN',
  'en:mexico': 'MX',
  'en:brazil': 'BR',
  'en:united-states': 'US',
  'en:switzerland': 'CH',
};

function toNum(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val.trim());
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function detectOffRegion(countriesTags: unknown): string {
  if (Array.isArray(countriesTags)) {
    for (const tag of countriesTags) {
      if (typeof tag !== 'string') continue;
      const mapped = COUNTRY_TAG_TO_ISO[tag.toLowerCase()];
      if (mapped) return mapped;
    }
  }
  return 'GLOBAL';
}

function parseOffServing(servingSizeText: unknown): {
  servingWeightGrams?: number;
  servingOptions?: FoodServingOption[];
} {
  if (typeof servingSizeText !== 'string' || !servingSizeText.trim()) return {};
  const text = servingSizeText.trim();
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
  const grams = weightMatch ? round2(Number(weightMatch[1])) : undefined;
  const parsed = parseHouseholdServingText(text);
  if (parsed && grams && grams > 0 && parsed.unit !== 'g' && parsed.unit !== 'ml') {
    const perUnit = round2(grams / parsed.count);
    return {
      servingWeightGrams: perUnit,
      servingOptions: [
        {
          id: parsed.unit,
          label: `${parsed.unit} (${perUnit}g)`,
          unit: parsed.unit,
          grams: perUnit,
          defaultAmount: 1,
        },
      ],
    };
  }
  return grams && grams > 0 ? { servingWeightGrams: grams } : {};
}

interface OffParseState {
  tier: 'core' | 'expanded';
  quotas: Record<string, number>;
  regionCounts: Map<string, number>;
  nextSeq: () => number;
}

function parseOffJsonlRecord(
  rawLine: string,
  state: OffParseState
): CatalogFoodInput | null {
  const line = rawLine.trim();
  if (!line) return null;

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }

  const rawName = String(obj.product_name || obj.product_name_en || '').trim();
  if (!rawName) return null;

  const region = detectOffRegion(obj.countries_tags);
  if (state.tier === 'core') {
    const cap = state.quotas[region] ?? state.quotas.GLOBAL ?? 500;
    const current = state.regionCounts.get(region) ?? 0;
    if (current >= cap) return null;
  }

  const nut = (obj.nutriments as Record<string, unknown>) || {};
  const calories = round2(toNum(nut['energy-kcal_100g'] ?? nut['energy-kcal']));
  const protein = round2(toNum(nut.proteins_100g));
  const carbs = round2(toNum(nut.carbohydrates_100g));
  const fat = round2(toNum(nut.fat_100g));
  const fiber = round2(toNum(nut.fiber_100g));

  const nutrientsPerBasis: MacroNutrients = { calories, protein, carbs, fat, fiber };
  if (!passesMacroQualityGate(nutrientsPerBasis, 4)) return null;

  const barcode = normalizeBarcode(
    typeof obj.code === 'string' ? obj.code : String(obj.code ?? '')
  );
  const brandRaw = typeof obj.brands === 'string' ? obj.brands.split(',')[0].trim() : '';
  const brand = brandRaw || undefined;
  const cleanName = cleanFoodDisplayName(rawName, brand);
  if (!cleanName) return null;

  const categories = Array.isArray(obj.categories_tags) ? obj.categories_tags : [];
  const firstCat =
    typeof categories[0] === 'string'
      ? categories[0].replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')
      : undefined;

  const aliases = generateFoodAliases(rawName, cleanName);
  const { servingWeightGrams, servingOptions: parsedServing } = parseOffServing(obj.serving_size);
  const servingOptions = enrichServingOptions({
    name: cleanName,
    category: firstCat,
    basis: 'per100g',
    existingOptions: parsedServing,
    servingWeightGrams,
  });

  const micros: Micronutrients = {};
  const sodiumG = toNum(nut.sodium_100g);
  if (sodiumG > 0) micros.sodiumMg = round2(sodiumG * 1000);
  const sugars = toNum(nut.sugars_100g);
  if (sugars > 0) micros.sugarG = round2(sugars);
  const satFat = toNum(nut['saturated-fat_100g']);
  if (satFat > 0) micros.saturatedFatG = round2(satFat);

  const idSuffix = barcode || `${region.toLowerCase()}-${state.nextSeq()}`;
  const record: CatalogFoodInput = {
    id: `off:${idSuffix}`,
    barcode,
    source: 'off',
    sourceProvider: 'openfoodfacts',
    accuracyTier: 4,
    region,
    ...(firstCat ? { category: firstCat } : {}),
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
  state.regionCounts.set(region, (state.regionCounts.get(region) ?? 0) + 1);
  return record;
}

/**
 * Pure parser for Open Food Facts JSONL lines enforcing `passesMacroQualityGate(..., 4)`
 * and explicit non-US regional quotas in `core` mode.
 */
export function parseOffJsonlLines(
  lines: Iterable<string>,
  options?: { tier?: 'core' | 'expanded'; regionQuotas?: Record<string, number> }
): CatalogFoodInput[] {
  let seq = 0;
  const state: OffParseState = {
    tier: options?.tier ?? 'core',
    quotas: options?.regionQuotas ?? CORE_OFF_REGION_QUOTAS,
    regionCounts: new Map<string, number>(),
    nextSeq: () => ++seq,
  };
  const results: CatalogFoodInput[] = [];

  for (const rawLine of lines) {
    const record = parseOffJsonlRecord(rawLine, state);
    if (record) results.push(record);
  }

  return results;
}

/**
 * Pure parser for FoodRepo (CC BY 4.0) JSON payloads.
 */
export function parseFoodRepoJson(jsonText: string): CatalogFoodInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return [];
  }

  const list: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).data)
      ? ((parsed as Record<string, unknown>).data as unknown[])
      : [];

  const results: CatalogFoodInput[] = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;

    const translations = rec.display_name_translations as Record<string, string> | undefined;
    const rawName = (
      translations?.en ||
      translations?.de ||
      translations?.fr ||
      translations?.it ||
      (typeof rec.name === 'string' ? rec.name : '')
    ).trim();
    if (!rawName) continue;

    const nutrients = (rec.nutrients as Record<string, { per_hundred?: number }>) || {};
    const calories = round2(
      toNum(nutrients.energy_calories_kcal?.per_hundred ?? nutrients.energy_kcal?.per_hundred)
    );
    const protein = round2(toNum(nutrients.protein?.per_hundred));
    const carbs = round2(toNum(nutrients.carbohydrates?.per_hundred));
    const fat = round2(toNum(nutrients.fat?.per_hundred));
    const fiber = round2(toNum(nutrients.fiber?.per_hundred));

    const nutrientsPerBasis: MacroNutrients = { calories, protein, carbs, fat, fiber };
    if (!passesMacroQualityGate(nutrientsPerBasis, 3)) continue;

    const barcode = normalizeBarcode(typeof rec.barcode === 'string' ? rec.barcode : undefined);
    const region =
      typeof rec.country === 'string' && rec.country.trim()
        ? rec.country.trim().toUpperCase()
        : 'CH';
    const cleanName = cleanFoodDisplayName(rawName);
    const aliases = generateFoodAliases(rawName, cleanName);

    const portionQty = toNum(rec.portion_quantity);
    const servingWeightGrams = portionQty > 0 ? round2(portionQty) : undefined;
    const servingOptions = enrichServingOptions({
      name: cleanName,
      basis: 'per100g',
      servingWeightGrams,
    });

    const record: CatalogFoodInput = {
      id: `foodrepo:${rec.id ?? barcode ?? i + 1}`,
      barcode,
      source: 'catalog',
      sourceProvider: 'foodrepo',
      accuracyTier: 3,
      region,
      name: cleanName,
      ...(aliases.length > 0 ? { aliases } : {}),
      basis: 'per100g',
      servingSize: 100,
      servingUnit: 'g',
      ...(servingWeightGrams ? { servingWeightGrams } : {}),
      servingOptions,
      nutrientsPerBasis,
      micronutrientsPerBasis: {},
      updatedAt: FIXED_TIMESTAMP,
    };

    record.searchRank = computeSearchRank(record);
    results.push(record);
  }

  return results;
}

export async function streamOffJsonlFile(
  filePath: string,
  tier: 'core' | 'expanded',
  regionQuotas?: Record<string, number>
): Promise<CatalogFoodInput[]> {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const quotas = regionQuotas ?? CORE_OFF_REGION_QUOTAS;
  let seq = 0;
  const state: OffParseState = {
    tier,
    quotas,
    regionCounts: new Map<string, number>(),
    nextSeq: () => ++seq,
  };
  const results: CatalogFoodInput[] = [];
  const maxCoreTotal = Object.values(quotas).reduce((a, b) => a + b, 0);

  for await (const line of rl) {
    if (tier === 'core' && results.length >= maxCoreTotal) {
      rl.close();
      break;
    }
    const record = parseOffJsonlRecord(line, state);
    if (record) {
      results.push(record);
    }
  }

  return results;
}

const OFF_BULK_CSV_GZ_URL =
  'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';

/**
 * Streams Open Food Facts' official gzipped TSV dump (9x smaller than JSONL) directly from
 * static.openfoodfacts.org, filtering on-the-fly for Atwater-valid products across our 24
 * non-US & global regional quotas, and exits cleanly once quotas fill or the time budget expires.
 */
async function fetchRegionalOffToJsonl(
  destPath: string,
  timeoutMs: number
): Promise<boolean> {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const tmpPath = `${destPath}.tmp`;
  const quotas = CORE_OFF_REGION_QUOTAS;
  const maxTotal = Object.values(quotas).reduce((a, b) => a + b, 0);
  const regionCounts = new Map<string, number>();
  const seenCodes = new Set<string>();
  const keptLines: string[] = [];

  const controller = new AbortController();
  // F3-a adaptation (default behavior unchanged): an explicit
  // FOOD_CATALOG_OFF_STREAM_BUDGET_MS env var OVERRIDES the 900s floor —
  // a knob for quick local verification rebuilds. CI runs the default.
  const budgetOverrideMs = Number.parseInt(
    process.env.FOOD_CATALOG_OFF_STREAM_BUDGET_MS ?? '',
    10
  );
  const maxStreamMs =
    Number.isFinite(budgetOverrideMs) && budgetOverrideMs > 0
      ? budgetOverrideMs
      : Math.max(timeoutMs, 900_000);
  let stopRequested = false;
  let activeRl: readline.Interface | null = null;
  let activeGunzip: zlib.Gunzip | null = null;

  const stopStream = () => {
    if (stopRequested) return;
    stopRequested = true;
    try {
      activeRl?.close();
    } catch {
      // ignore
    }
    try {
      activeGunzip?.destroy();
    } catch {
      // ignore
    }
    controller.abort();
  };

  const timer = setTimeout(stopStream, maxStreamMs);

  console.log(
    `[off] Streaming ${OFF_BULK_CSV_GZ_URL} (target up to ${maxTotal} region-balanced products, max ${Math.round(maxStreamMs / 1000)}s)...`
  );

  let scanned = 0;
  try {
    const res = await fetch(OFF_BULK_CSV_GZ_URL, {
      headers: {
        'User-Agent': 'openCalory-catalog-builder/1.0 (+https://github.com/opencalory)',
      },
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      console.warn(`[off] Bulk TSV dump returned HTTP ${res.status}`);
      return false;
    }

    const nodeStream = Readable.fromWeb(res.body as unknown as import('node:stream/web').ReadableStream);
    const gunzip = zlib.createGunzip();
    activeGunzip = gunzip;
    nodeStream.on('error', () => {
      // Expected on clean abort
    });
    gunzip.on('error', () => {
      // Expected on clean abort
    });
    nodeStream.pipe(gunzip);

    const rl = readline.createInterface({
      input: gunzip,
      crlfDelay: Infinity,
    });
    activeRl = rl;
    rl.on('error', () => {
      // Expected on clean abort
    });

    let headers: string[] | null = null;
    let idxCode = -1;
    let idxName = -1;
    let idxBrands = -1;
    let idxCategories = -1;
    let idxCountries = -1;
    let idxServing = -1;
    let idxKcal = -1;
    let idxProtein = -1;
    let idxCarbs = -1;
    let idxFat = -1;
    let idxFiber = -1;
    let idxSodium = -1;
    let idxSugars = -1;
    let idxSatFat = -1;

    for await (const line of rl) {
      if (stopRequested) break;
      if (!headers) {
        headers = line.split('\t').map((h) => h.trim().toLowerCase());
        idxCode = headers.indexOf('code');
        idxName = headers.indexOf('product_name');
        idxBrands = headers.indexOf('brands');
        idxCategories = headers.indexOf('categories');
        idxCountries = headers.indexOf('countries_tags');
        idxServing = headers.indexOf('serving_size');
        idxKcal = headers.indexOf('energy-kcal_100g');
        idxProtein = headers.indexOf('proteins_100g');
        idxCarbs = headers.indexOf('carbohydrates_100g');
        idxFat = headers.indexOf('fat_100g');
        idxFiber = headers.indexOf('fiber_100g');
        idxSodium = headers.indexOf('sodium_100g');
        idxSugars = headers.indexOf('sugars_100g');
        idxSatFat = headers.indexOf('saturated-fat_100g');
        continue;
      }

      scanned++;
      if (keptLines.length >= maxTotal) {
        stopStream();
        break;
      }

      const cols = line.split('\t');
      const rawName = (idxName >= 0 ? cols[idxName] : '')?.trim() || '';
      if (!rawName || rawName.length < 2) continue;

      const rawCountries = (idxCountries >= 0 ? cols[idxCountries] : '')?.trim() || '';
      const countriesTags = rawCountries
        ? rawCountries.split(',').map((c) => c.trim().toLowerCase())
        : [];
      const region = detectOffRegion(countriesTags);
      const cap = quotas[region] ?? quotas.GLOBAL ?? 2000;
      const cur = regionCounts.get(region) ?? 0;
      if (cur >= cap) continue;

      const calories = toNum(idxKcal >= 0 ? cols[idxKcal] : 0);
      const protein = toNum(idxProtein >= 0 ? cols[idxProtein] : 0);
      const carbs = toNum(idxCarbs >= 0 ? cols[idxCarbs] : 0);
      const fat = toNum(idxFat >= 0 ? cols[idxFat] : 0);
      const fiber = toNum(idxFiber >= 0 ? cols[idxFiber] : 0);

      if (!passesMacroQualityGate({ calories, protein, carbs, fat, fiber }, 4)) {
        continue;
      }

      const code = (idxCode >= 0 ? cols[idxCode] : '')?.trim() || '';
      if (code && seenCodes.has(code)) continue;
      if (code) seenCodes.add(code);

      const compact = {
        code,
        product_name: rawName,
        brands: (idxBrands >= 0 ? cols[idxBrands] : '')?.trim() || undefined,
        categories: (idxCategories >= 0 ? cols[idxCategories] : '')?.trim() || undefined,
        countries_tags: countriesTags,
        serving_size: (idxServing >= 0 ? cols[idxServing] : '')?.trim() || undefined,
        nutriments: {
          'energy-kcal_100g': calories,
          proteins_100g: protein,
          carbohydrates_100g: carbs,
          fat_100g: fat,
          fiber_100g: fiber,
          ...(idxSodium >= 0 && cols[idxSodium] ? { sodium_100g: toNum(cols[idxSodium]) } : {}),
          ...(idxSugars >= 0 && cols[idxSugars] ? { sugars_100g: toNum(cols[idxSugars]) } : {}),
          ...(idxSatFat >= 0 && cols[idxSatFat] ? { 'saturated-fat_100g': toNum(cols[idxSatFat]) } : {}),
        },
      };

      keptLines.push(JSON.stringify(compact));
      regionCounts.set(region, cur + 1);

      if (keptLines.length % 10_000 === 0) {
        console.log(`[off]   kept ${keptLines.length} / ${maxTotal} (scanned ${scanned})...`);
      }
    }
  } catch (err) {
    if (!stopRequested) {
      console.warn(
        `[off] Stream stopped early after ${keptLines.length} kept (${scanned} scanned): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  } finally {
    clearTimeout(timer);
  }

  if (keptLines.length === 0) {
    return false;
  }

  fs.writeFileSync(tmpPath, `${keptLines.join('\n')}\n`, 'utf8');
  fs.renameSync(tmpPath, destPath);
  console.log(
    `[off] Cached ${keptLines.length} regional products (scanned ${scanned}) to ${destPath}`
  );
  return true;
}

/**
 * Streams line count of a cached OFF JSONL file and returns true if it does not exist
 * or contains fewer non-empty lines than 50% of `targetTotal`.
 */
export async function isOffCacheUndersized(
  filePath: string,
  targetTotal: number
): Promise<boolean> {
  if (!fs.existsSync(filePath)) return true;
  const threshold = Math.floor(targetTotal * 0.5);
  if (threshold <= 0) return false;

  let lines = 0;
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of rl) {
      if (line.trim().length === 0) continue;
      lines++;
      if (lines >= threshold) {
        return false;
      }
    }
  } finally {
    rl.close();
    stream.destroy();
  }

  return lines < threshold;
}

export const offFoodRepoAdapter: CatalogAdapter = {
  id: 'off-foodrepo',
  name: 'Open Food Facts (ODbL) & FoodRepo (CC BY 4.0)',
  license: 'ODbL-1.0 / CC BY 4.0',
  async load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]> {
    const results: CatalogFoodInput[] = [];
    const offDir = path.join(options.cacheDir, 'off');
    const foodRepoDir = path.join(options.cacheDir, 'foodrepo');
    const regionalPath = path.join(offDir, 'off-regional-products.jsonl');
    const maxTotal = Object.values(CORE_OFF_REGION_QUOTAS).reduce((a, b) => a + b, 0);

    let hasOffJsonl =
      fs.existsSync(offDir) &&
      fs
        .readdirSync(offDir)
        .some((f) => f.toLowerCase().endsWith('.jsonl') || f.toLowerCase().endsWith('.ndjson'));

    if (!options.offlineOnly) {
      if (!hasOffJsonl) {
        hasOffJsonl = await fetchRegionalOffToJsonl(regionalPath, options.timeoutMs ?? 20_000);
      } else if (
        fs.existsSync(regionalPath) &&
        (await isOffCacheUndersized(regionalPath, maxTotal))
      ) {
        console.log(
          `[off] Existing regional cache at ${regionalPath} is undersized (<50% of ${maxTotal}) — refreshing...`
        );
        await fetchRegionalOffToJsonl(regionalPath, options.timeoutMs ?? 20_000);
      }
    }

    if (hasOffJsonl && fs.existsSync(offDir)) {
      for (const file of fs.readdirSync(offDir)) {
        if (file.toLowerCase().endsWith('.jsonl') || file.toLowerCase().endsWith('.ndjson')) {
          const items = await streamOffJsonlFile(path.join(offDir, file), options.tier);
          console.log(`[off] Loaded ${items.length} products from ${file}`);
          for (const item of items) {
            results.push(item);
          }
        }
      }
    } else {
      console.log(`[off] No cached JSONL in ${offDir} — skipping.`);
    }

    if (fs.existsSync(foodRepoDir)) {
      for (const file of fs.readdirSync(foodRepoDir)) {
        if (file.toLowerCase().endsWith('.json')) {
          const items = parseFoodRepoJson(fs.readFileSync(path.join(foodRepoDir, file), 'utf8'));
          console.log(`[foodrepo] Loaded ${items.length} products from ${file}`);
          for (const item of items) {
            results.push(item);
          }
        }
      }
    } else {
      console.log(`[foodrepo] No cached JSON in ${foodRepoDir} — skipping.`);
    }

    return results;
  },
};
