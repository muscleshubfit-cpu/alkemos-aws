import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

/**
 * F3-a — food-catalog SQL exporter.
 *
 * Reads the compiled SQLite catalog (build.ts output) and emits a
 * DATA-ONLY, idempotent SQL file (INSERT ... ON CONFLICT ... DO UPDATE)
 * targeting the Supabase tables that the F3-b migration will create:
 *
 *   food_catalog            — one row per deduplicated food
 *   food_catalog_aliases    — legacy-id aliases (kind = 'id')
 *
 * The DDL belongs to the F3-b frame (AGENTS §6 migration law — table +
 * trigram GIN + barcode partial index + read-only public RLS). This
 * exporter owns only the data contract: the column order below IS the
 * contract and both sides must keep it in sync.
 *
 * The file is valid PostgreSQL AND valid SQLite (multi-row VALUES +
 * upsert syntax are shared), which lets validate.ts prove importability
 * and re-import idempotency by replaying it on a scratch SQLite catalog.
 */

const FORK_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

export const FOOD_CATALOG_COLUMNS = [
  'id',
  'barcode',
  'source',
  'accuracy_tier',
  'region',
  'category',
  'name',
  'brand',
  'aliases',
  'basis',
  'serving_size',
  'serving_unit',
  'serving_weight_grams',
  'calories',
  'protein',
  'carbs',
  'fat',
  'fiber',
  'micronutrients_json',
  'serving_options_json',
  'search_rank',
] as const;

export interface ExportSqlOptions {
  dbPath: string;
  outPath: string;
  version: string;
  batchRows?: number;
}

function sqlString(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL';
    return String(value);
  }
  const text = String(value);
  return `'${text.replace(/'/g, "''")}'`;
}

function sqlNumberOrNull(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  const num = Number(value);
  if (!Number.isFinite(num)) return 'NULL';
  return String(num);
}

function sqlIntOrNull(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  const num = Number(value);
  if (!Number.isFinite(num)) return 'NULL';
  return String(Math.trunc(num));
}

/** The documented target DDL (owned by the F3-b migration) — kept here so
 *  validate.ts can replay the export against a scratch catalog. */
export const FOOD_CATALOG_DDL = `
CREATE TABLE IF NOT EXISTS food_catalog (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  source TEXT NOT NULL,
  accuracy_tier INTEGER NOT NULL,
  region TEXT NOT NULL DEFAULT 'GLOBAL',
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  aliases TEXT NOT NULL DEFAULT '',
  basis TEXT NOT NULL,
  serving_size DOUBLE PRECISION NOT NULL,
  serving_unit TEXT NOT NULL,
  serving_weight_grams DOUBLE PRECISION,
  calories DOUBLE PRECISION NOT NULL,
  protein DOUBLE PRECISION NOT NULL,
  carbs DOUBLE PRECISION NOT NULL,
  fat DOUBLE PRECISION NOT NULL,
  fiber DOUBLE PRECISION NOT NULL,
  micronutrients_json TEXT NOT NULL,
  serving_options_json TEXT NOT NULL,
  search_rank DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS food_catalog_aliases (
  legacy_id TEXT NOT NULL,
  canonical_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('id', 'barcode')),
  PRIMARY KEY (legacy_id, kind)
);
`;

export interface ExportSqlResult {
  outPath: string;
  foodRows: number;
  aliasRows: number;
  sqlBytes: number;
  sha256Hex: string;
}

export async function exportCatalogToSql(
  options: ExportSqlOptions
): Promise<ExportSqlResult> {
  const { dbPath, outPath, version, batchRows = 400 } = options;

  const client = createClient({ url: `file:${path.resolve(dbPath)}` });
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });

  let foodRows = 0;
  let aliasRows = 0;
  const writeStream = fs.createWriteStream(outPath, { encoding: 'utf8' });

  const write = (chunk: string) =>
    new Promise<void>((resolve, reject) => {
      writeStream.write(chunk, (err) => (err ? reject(err) : resolve()));
    });

  try {
    // Header — provenance + contract note (deterministic given inputs).
    await write(
      [
        '-- Alkemos food catalog — generated data import (F3-a pipeline).',
        `-- Catalog version: ${version}`,
        '-- Aggregate data license: ODbL-1.0 (attribution: USDA FoodData Central (CC0),',
        '--   Health Canada CNF (OGL-Canada), Open Food Facts (ODbL), OpenNutrition (ODbL),',
        '--   curated regional packs (ODbL/CC0)). See scripts/food-catalog/README.md.',
        '-- TARGET: the food_catalog + food_catalog_aliases tables created by the',
        '--   F3-b migration (supabase/migrations). DATA-ONLY file: no DDL here.',
        '-- IDEMPOTENT: every row is an upsert (ON CONFLICT ... DO UPDATE) — re-running',
        '--   the file never duplicates rows.',
        'BEGIN;',
        '',
      ].join('\n')
    );

    // food_catalog rows
    let batchValues: string[] = [];
    let pending = 0;
    const flushFoods = async () => {
      if (batchValues.length === 0) return;
      await write(
        `INSERT INTO food_catalog (${FOOD_CATALOG_COLUMNS.join(', ')}) VALUES\n  ${batchValues.join(',\n  ')}\nON CONFLICT (id) DO UPDATE SET\n${FOOD_CATALOG_COLUMNS.filter((c) => c !== 'id').map((c) => `  ${c} = EXCLUDED.${c}`).join(',\n')};\n`
      );
      batchValues = [];
    };

    const foodResult = await client.execute(
      `SELECT ${FOOD_CATALOG_COLUMNS.join(', ')} FROM foods ORDER BY id`
    );
    for (const row of foodResult.rows) {
      const values = [
        sqlString(row.id),
        sqlString(row.barcode),
        sqlString(row.source),
        sqlIntOrNull(row.accuracy_tier),
        sqlString(row.region),
        sqlString(row.category),
        sqlString(row.name),
        sqlString(row.brand),
        sqlString(row.aliases),
        sqlString(row.basis),
        sqlNumberOrNull(row.serving_size),
        sqlString(row.serving_unit),
        sqlNumberOrNull(row.serving_weight_grams),
        sqlNumberOrNull(row.calories),
        sqlNumberOrNull(row.protein),
        sqlNumberOrNull(row.carbs),
        sqlNumberOrNull(row.fat),
        sqlNumberOrNull(row.fiber),
        sqlString(row.micronutrients_json),
        sqlString(row.serving_options_json),
        sqlNumberOrNull(row.search_rank),
      ];
      batchValues.push(`(${values.join(', ')})`);
      foodRows++;
      pending++;
      if (pending >= batchRows) {
        await flushFoods();
        pending = 0;
      }
    }
    await flushFoods();

    // food_catalog_aliases rows (legacy id -> canonical id)
    const aliasResult = await client.execute(
      `SELECT legacy_id, canonical_id FROM food_id_aliases ORDER BY legacy_id`
    );
    let aliasBatch: string[] = [];
    const flushAliases = async () => {
      if (aliasBatch.length === 0) return;
      await write(
        `INSERT INTO food_catalog_aliases (legacy_id, canonical_id, kind) VALUES\n  ${aliasBatch.join(',\n  ')}\nON CONFLICT (legacy_id, kind) DO UPDATE SET\n  canonical_id = EXCLUDED.canonical_id;\n`
      );
      aliasBatch = [];
    };
    for (const row of aliasResult.rows) {
      aliasBatch.push(`(${sqlString(row.legacy_id)}, ${sqlString(row.canonical_id)}, 'id')`);
      aliasRows++;
      if (aliasBatch.length >= batchRows) {
        await flushAliases();
      }
    }
    await flushAliases();

    await write('COMMIT;\n');
  } finally {
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
    client.close();
  }

  // Deferred import to keep the exporter single-pass friendly under bun.
  const { createHash } = await import('node:crypto');
  const buf = fs.readFileSync(outPath);
  const sha256Hex = createHash('sha256').update(buf).digest('hex');

  return {
    outPath,
    foodRows,
    aliasRows,
    sqlBytes: buf.byteLength,
    sha256Hex,
  };
}

function parseArg(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : undefined;
}

const isDirectCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectCliRun) {
  const dbPath = parseArg(process.argv.slice(2), 'db') ?? path.join(FORK_DIR, 'out', 'food-catalog.db');
  const outPath = parseArg(process.argv.slice(2), 'out') ?? path.join(FORK_DIR, 'out', 'food-catalog.sql');
  const version = parseArg(process.argv.slice(2), 'version') ?? 'dev';
  exportCatalogToSql({ dbPath, outPath, version })
    .then((result) => {
      console.log(
        `[food-db:export] ${result.foodRows} foods + ${result.aliasRows} aliases -> ${result.outPath} (${(result.sqlBytes / 1024 / 1024).toFixed(2)} MB, sha256=${result.sha256Hex.slice(0, 12)}...)`
      );
    })
    .catch((err) => {
      console.error('[food-db:export] Export failed:', err);
      process.exit(1);
    });
}
