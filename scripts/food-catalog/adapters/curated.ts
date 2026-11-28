import fs from 'node:fs';
import path from 'node:path';
import type { FoodItem } from '../src/types';
import type { CatalogFoodInput } from '../src/catalog-schema';
import { generateFoodAliases } from '../src/name-normalizer';
import { enrichServingOptions } from '../src/portion-enrichment';
import { parseFoodCsv } from '../src/csv-food-parser';
import { normalizeBarcode } from '../src/dedup';
import {
  type AdapterLoadOptions,
  type CatalogAdapter,
  computeSearchRank,
  passesItemMacroQualityGate,
} from './types';

const FIXED_TIMESTAMP = 1700000000000;

function foodItemToCuratedCatalogInput(
  item: FoodItem,
  sourceProvider: string,
  extraLegacyIds?: string[]
): CatalogFoodInput | null {
  const accuracyTier: 1 | 2 | 3 | 4 =
    item.accuracyTier === 1 ||
    item.accuracyTier === 2 ||
    item.accuracyTier === 3 ||
    item.accuracyTier === 4
      ? item.accuracyTier
      : 3;

  if (
    !passesItemMacroQualityGate({
      basis: item.basis,
      servingWeightGrams: item.servingWeightGrams,
      nutrientsPerBasis: item.nutrientsPerBasis,
      accuracyTier,
    })
  ) {
    return null;
  }

  const aliases = generateFoodAliases(item.name, item.name, item.aliases);
  const servingOptions = enrichServingOptions({
    name: item.name,
    category: item.category,
    basis: item.basis,
    existingOptions: item.servingOptions,
    servingWeightGrams: item.servingWeightGrams,
  });

  const legacyIds = extraLegacyIds && extraLegacyIds.length > 0 ? extraLegacyIds : undefined;

  const record: CatalogFoodInput = {
    ...item,
    barcode: normalizeBarcode(item.barcode),
    sourceProvider,
    accuracyTier,
    region: item.region || 'GLOBAL',
    ...(aliases.length > 0 ? { aliases } : {}),
    servingOptions,
    updatedAt: item.updatedAt || FIXED_TIMESTAMP,
    ...(legacyIds ? { legacyIds } : {}),
  };

  record.searchRank = computeSearchRank(record);
  return record;
}

/**
 * Pure loader for curated JSON pack contents and optional CSV text.
 */
export function loadCuratedFromFiles(
  jsonFiles: Array<{ filename: string; content: string }>,
  csvContent?: string
): CatalogFoodInput[] {
  const results: CatalogFoodInput[] = [];

  for (const file of jsonFiles) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.content);
    } catch (err) {
      console.warn(
        `[curated] Failed to parse ${file.filename}: ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    const list: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).foods)
        ? ((parsed as Record<string, unknown>).foods as unknown[])
        : [];

    const packSlug = path.basename(file.filename, path.extname(file.filename));
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as FoodItem & { legacyIds?: string[] };
      const converted = foodItemToCuratedCatalogInput(
        item,
        `curated_${packSlug}`,
        Array.isArray(item.legacyIds) ? item.legacyIds : undefined
      );
      if (converted) results.push(converted);
    }
  }

  if (csvContent && csvContent.trim()) {
    const { items, errors } = parseFoodCsv(csvContent, { defaultSource: 'catalog' });
    if (errors.length > 0) {
      console.warn(`[curated] CSV import warnings (${errors.length}): ${errors.slice(0, 3).join('; ')}`);
    }
    for (const item of items) {
      const converted = foodItemToCuratedCatalogInput(item, 'curated_csv');
      if (converted) results.push(converted);
    }
  }

  return results;
}

export const curatedAdapter: CatalogAdapter = {
  id: 'curated',
  name: 'MacroAI Curated Regional & Restaurant Packs + Optional CSV',
  license: 'ODbL-1.0 / CC0-1.0',
  async load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]> {
    const projectRoot = options.projectRoot ?? process.cwd();
    const curatedDir = path.join(projectRoot, 'data', 'curated');
    const jsonFiles: Array<{ filename: string; content: string }> = [];

    if (fs.existsSync(curatedDir)) {
      const entries = fs.readdirSync(curatedDir).sort();
      for (const entry of entries) {
        if (!entry.toLowerCase().endsWith('.json')) continue;
        const fullPath = path.join(curatedDir, entry);
        jsonFiles.push({
          filename: entry,
          content: fs.readFileSync(fullPath, 'utf8'),
        });
      }
    } else {
      console.warn(`[curated] Directory not found: ${curatedDir}`);
    }

    let csvContent: string | undefined;
    if (options.csvPath) {
      const resolvedCsv = path.resolve(options.csvPath);
      if (fs.existsSync(resolvedCsv)) {
        csvContent = fs.readFileSync(resolvedCsv, 'utf8');
      } else {
        console.warn(`[curated] Specified --csv path not found: ${resolvedCsv}`);
      }
    }

    const items = loadCuratedFromFiles(jsonFiles, csvContent);
    console.log(`[curated] Loaded ${items.length} curated foods from ${jsonFiles.length} pack(s).`);
    return items;
  },
};
