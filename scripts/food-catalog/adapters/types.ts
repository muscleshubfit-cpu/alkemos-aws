import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import type { MacroNutrients } from '../src/types';
import type { CatalogFoodInput } from '../src/catalog-schema';

export interface AdapterLoadOptions {
  tier: 'core' | 'expanded';
  cacheDir: string;
  offlineOnly?: boolean;
  csvPath?: string;
  timeoutMs?: number;
  projectRoot?: string;
}

export interface CatalogAdapter {
  id: string;
  name: string;
  license: string;
  load(options: AdapterLoadOptions): Promise<CatalogFoodInput[]>;
}

export const DEFAULT_FETCH_TIMEOUT_MS = 25_000;

export const round2 = (val: number): number =>
  Math.round((val + Number.EPSILON) * 100) / 100;

/**
 * Validates per-100g macro quality for compiler ingestion:
 * - Rejects NaN/non-finite or negative values.
 * - Rejects all-zero macro stubs.
 * - Rejects kJ-stuffed values (calories > 950 per 100g).
 * - For Tier 4 crowdsourced items, rejects Atwater-inconsistent rows where
 *   calories > 20 and |calories - (4P + 4C + 9F)| > max(50, 0.25 * calories).
 */
export function passesMacroQualityGate(
  macros: MacroNutrients,
  tier: 1 | 2 | 3 | 4
): boolean {
  const { calories, protein, carbs, fat, fiber } = macros;
  if (
    !Number.isFinite(calories) ||
    !Number.isFinite(protein) ||
    !Number.isFinite(carbs) ||
    !Number.isFinite(fat) ||
    !Number.isFinite(fiber)
  ) {
    return false;
  }

  if (calories < 0 || protein < 0 || carbs < 0 || fat < 0 || fiber < 0) {
    return false;
  }

  if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
    return false;
  }

  // Reject kJ-stuffed values (pure fat is ~900 kcal/100g)
  if (calories > 950) {
    return false;
  }

  if (tier === 4 && calories > 20) {
    const atwater = 4 * protein + 4 * carbs + 9 * fat;
    const diff = Math.abs(calories - atwater);
    const maxAllowedDiff = Math.max(50, 0.25 * calories);
    if (diff > maxAllowedDiff) {
      return false;
    }
  }

  return true;
}

/**
 * Helper to validate macros for items that may be `perServing`.
 * Normalizes to per-100g when `servingWeightGrams` is available.
 */
export function passesItemMacroQualityGate(
  item: Pick<CatalogFoodInput, 'basis' | 'servingWeightGrams' | 'nutrientsPerBasis' | 'accuracyTier'>
): boolean {
  const m = item.nutrientsPerBasis;
  if (item.basis === 'per100g' || item.basis === 'per100ml') {
    return passesMacroQualityGate(m, item.accuracyTier);
  }
  if (
    typeof item.servingWeightGrams === 'number' &&
    Number.isFinite(item.servingWeightGrams) &&
    item.servingWeightGrams > 0
  ) {
    const scale = 100 / item.servingWeightGrams;
    return passesMacroQualityGate(
      {
        calories: m.calories * scale,
        protein: m.protein * scale,
        carbs: m.carbs * scale,
        fat: m.fat * scale,
        fiber: m.fiber * scale,
      },
      item.accuracyTier
    );
  }
  // Per-serving without gram weight: reject NaN/negative/all-zero and extreme values (> 5000 kcal/serving)
  const { calories, protein, carbs, fat, fiber } = m;
  if (
    !Number.isFinite(calories) ||
    !Number.isFinite(protein) ||
    !Number.isFinite(carbs) ||
    !Number.isFinite(fat) ||
    !Number.isFinite(fiber) ||
    calories < 0 ||
    protein < 0 ||
    carbs < 0 ||
    fat < 0 ||
    fiber < 0 ||
    (calories === 0 && protein === 0 && carbs === 0 && fat === 0) ||
    calories > 5000
  ) {
    return false;
  }
  return true;
}

/**
 * Deterministic relevance score stored in `foods.search_rank` (higher is better).
 * Strongly favors higher accuracy tiers, concise names, household portions, and micronutrient density.
 */
export function computeSearchRank(
  item: Pick<
    CatalogFoodInput,
    'accuracyTier' | 'name' | 'brand' | 'servingOptions' | 'micronutrientsPerBasis' | 'region'
  >
): number {
  const tierBase: Record<1 | 2 | 3 | 4, number> = {
    1: 100,
    2: 75,
    3: 50,
    4: 25,
  };

  let score = tierBase[item.accuracyTier] ?? 25;

  // Unbranded generic whole foods rank slightly above branded products for general searches
  if (!item.brand || !item.brand.trim()) {
    score += 8;
  }

  // Concise names rank slightly higher than verbose descriptions
  const nameLen = (item.name || '').trim().length;
  score -= Math.min(18, Math.floor(nameLen / 6));

  // Reward household serving options beyond g/ml/oz
  const householdCount = (item.servingOptions ?? []).filter((opt) => {
    const u = (opt.unit || '').toLowerCase();
    return u !== 'g' && u !== 'ml' && u !== 'oz' && u !== 'fl oz';
  }).length;
  score += Math.min(10, householdCount * 3);

  // Reward micronutrient completeness
  const microCount = item.micronutrientsPerBasis
    ? Object.values(item.micronutrientsPerBasis).filter(
        (v) => typeof v === 'number' && Number.isFinite(v)
      ).length
    : 0;
  score += Math.min(8, Math.floor(microCount / 2));

  return round2(score);
}

/**
 * Fetches a remote URL with timeout and caches it on disk.
 * Returns `destPath` on success or `null` if unavailable / offlineOnly.
 */
export async function downloadToCache(
  url: string,
  destPath: string,
  options?: { offlineOnly?: boolean; timeoutMs?: number }
): Promise<string | null> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return destPath;
  }
  if (options?.offlineOnly) {
    return null;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'MacroAI-CatalogCompiler/1.0 (+https://github.com/opencalory)',
      },
    });
    if (!response.ok) {
      console.warn(`[catalog] Download failed (${response.status}) for ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const tmpPath = `${destPath}.tmp`;
    fs.writeFileSync(tmpPath, Buffer.from(arrayBuffer));
    fs.renameSync(tmpPath, destPath);
    return destPath;
  } catch (err) {
    console.warn(
      `[catalog] Could not download ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * Streams a remote URL directly to disk with timeout and atomic rename so large archives
 * never buffer in RAM. Returns `destPath` on success or `null` if unavailable / offlineOnly.
 */
export async function downloadStreamToCache(
  url: string,
  destPath: string,
  options?: { offlineOnly?: boolean; timeoutMs?: number }
): Promise<string | null> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return destPath;
  }
  if (options?.offlineOnly) {
    return null;
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const timeoutMs = options?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const tmpPath = `${destPath}.tmp`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'MacroAI-CatalogCompiler/1.0 (+https://github.com/opencalory)',
      },
    });
    if (!response.ok || !response.body) {
      console.warn(`[catalog] Stream download failed (${response.status}) for ${url}`);
      return null;
    }

    const nodeStream = Readable.fromWeb(response.body as unknown as NodeWebReadableStream);
    const writeStream = fs.createWriteStream(tmpPath);
    await pipeline(nodeStream, writeStream);
    fs.renameSync(tmpPath, destPath);
    return destPath;
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch {
      // Ignore temp cleanup errors
    }
    console.warn(
      `[catalog] Could not stream-download ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * Extracts a ZIP archive into `outputDir` using `tar -xf` (built into Windows 10/11 & macOS/Linux)
 * with `unzip` fallback.
 */
export function extractZipFile(zipPath: string, outputDir: string): boolean {
  fs.mkdirSync(outputDir, { recursive: true });
  try {
    execFileSync('tar', ['-xf', zipPath, '-C', outputDir], { stdio: 'pipe' });
    return true;
  } catch {
    try {
      execFileSync('unzip', ['-q', '-o', zipPath, '-d', outputDir], { stdio: 'pipe' });
      return true;
    } catch (err) {
      console.warn(
        `[catalog] Failed to extract ${zipPath}: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  }
}
