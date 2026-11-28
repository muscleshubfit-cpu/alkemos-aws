import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { FOOD_CATALOG_DDL, exportCatalogToSql } from './export-sql';

/**
 * F3-a — acceptance-criteria gate for the catalog build pipeline.
 *
 * Enforces the frame's five acceptance criteria (docs/opencalory-
 * integration-review-2026-11-28/04-PHASED-PLAN-AR.md, F3-أ) and writes
 * validation-report.json — the frame's documented-deviation record:
 *
 *  1. CI-only build — structural (this gate runs in GitHub Actions; the
 *     pipeline is never wired into deploy-aws.yml or the origin server).
 *  2. Count check: expected reference 130,362 foods (source v2026.11.25
 *     core build) ± a DOCUMENTED deviation — the measured deviation and
 *     its per-adapter causes are written to the report. Upstream sources
 *     drift daily (OFF dump) and adapter availability varies
 *     (opennutrition contributed 0 to the reference build; its zip is
 *     reachable again and can add rows) — hence a generous default band
 *     (±20%) with the actual deviation always documented.
 *  3. ZERO rows with critical missing data (calories/protein absent or
 *     non-finite) — checked on the compiled SQLite AND on the replayed
 *     SQL artifact.
 *  4. Idempotent / re-runnable — the SQL file replays twice onto a
 *     scratch catalog without duplicating a single row, and a second
 *     export from the same database is byte-identical (determinism).
 *  5. The SQL artifact stays ≤ 200 MB.
 *
 * Exit code 0 = all criteria met; 1 = any failure (with a loud message).
 */

const FORK_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const DEFAULT_EXPECTED_COUNT = 130_362; // source v2026.11.25 core build
const DEFAULT_MAX_DEVIATION_PCT = 20; // documented-deviation hard band
const DEFAULT_SQL_MAX_BYTES = 200 * 1024 * 1024; // 200 MB

interface ValidationReport {
  passed: boolean;
  checkedAt: string;
  expectedReferenceCount: number;
  actualFoodCount: number;
  aliasCount: number;
  deviation: number;
  deviationPct: number;
  maxDeviationPct: number;
  deviationWithinBand: boolean;
  deviationCauses: string[];
  criticalMissingRows: number;
  criticalMissingCheck: 'sqlite+replay' | 'sqlite-only';
  sqlBytes: number;
  sqlMaxBytes: number;
  sqlWithinSize: boolean;
  replayRowCounts: { pass1: number; pass2: number; duplicated: number };
  exportDeterminism: { checked: boolean; identical: boolean | null; sha256: string };
  rustAudit: {
    present: boolean;
    inputFoodCount?: number;
    quarantinedTotal?: number;
    idAliasesCount?: number;
    barcodeAliasesCount?: number;
    countMatchesManifest?: boolean;
  };
  peakRssBytes: number;
  failures: string[];
}

function parseArg(argv: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : undefined;
}

function toInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function peakRssBytes(): number {
  try {
    const ru = process.resourceUsage();
    if (typeof ru.maxRSS === 'number' && ru.maxRSS > 0) {
      return ru.maxRSS * 1024; // Node documents maxRSS in KB
    }
  } catch {
    // ignore
  }
  return process.memoryUsage().rss;
}

async function countTable(dbPath: string, table: string): Promise<number> {
  const client = createClient({ url: `file:${dbPath}` });
  try {
    const result = await client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    return Number(result.rows[0]?.n ?? 0);
  } finally {
    client.close();
  }
}

async function countCriticalMissing(dbPath: string, table: string): Promise<number> {
  const client = createClient({ url: `file:${dbPath}` });
  try {
    const result = await client.execute(
      `SELECT COUNT(*) AS n FROM ${table} WHERE calories IS NULL OR protein IS NULL OR calories != calories OR protein != protein`
    );
    return Number(result.rows[0]?.n ?? 0);
  } finally {
    client.close();
  }
}

/** Replay the exported SQL onto a scratch SQLite catalog (the export format
 *  is valid SQLite AND PostgreSQL by design — see export-sql.ts). Returns
 *  the row count after the replay. */
async function replaySql(sqlPath: string, scratchDbPath: string): Promise<number> {
  fs.rmSync(scratchDbPath, { force: true });
  const client = createClient({ url: `file:${scratchDbPath}` });
  try {
    await client.executeMultiple(FOOD_CATALOG_DDL);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    // The exporter's own format guarantees ';\n' only terminates statements
    // (data strings are single-line by construction) — see export-sql.ts.
    // BEGIN/COMMIT are transaction-control for the SQL importer (psql/
    // Supabase); libsql's per-statement execute() manages its own
    // transactions, so the replay executes the data statements only.
    const statements = sql
      .split(';\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .filter((s) => {
        const stripped = s
          .split('\n')
          .filter((line) => !line.trimStart().startsWith('--'))
          .map((line) => line.trim())
          .join(' ');
        return stripped !== 'BEGIN' && stripped !== 'COMMIT';
      });
    for (const statement of statements) {
      await client.execute(statement);
    }
  } finally {
    client.close();
  }
  return countTable(scratchDbPath, 'food_catalog');
}

async function main(): Promise<number> {
  const outDir = parseArg(process.argv.slice(2), 'out-dir') ?? path.join(FORK_DIR, 'out');
  const dbPath = parseArg(process.argv.slice(2), 'db') ?? path.join(outDir, 'food-catalog.db');
  const sqlPath = parseArg(process.argv.slice(2), 'sql') ?? path.join(outDir, 'food-catalog.sql');
  const manifestPath = parseArg(process.argv.slice(2), 'manifest') ?? path.join(outDir, 'catalog-manifest.json');
  const buildReportPath = parseArg(process.argv.slice(2), 'build-report') ?? path.join(outDir, 'build-report.json');
  const auditReportPath = parseArg(process.argv.slice(2), 'audit-report'); // optional (CI-only Rust step)
  const expectedCount = toInt(parseArg(process.argv.slice(2), 'expected-count'), DEFAULT_EXPECTED_COUNT);
  const maxDeviationPct = toInt(parseArg(process.argv.slice(2), 'max-deviation-pct'), DEFAULT_MAX_DEVIATION_PCT);
  const sqlMaxBytes = toInt(parseArg(process.argv.slice(2), 'sql-max-bytes'), DEFAULT_SQL_MAX_BYTES);
  const skipDeterminism = process.argv.includes('--no-determinism');

  const failures: string[] = [];
  const manifest = readJson<{ version: string; foodCount: number; sha256: string; builtAt: string }>(manifestPath);
  const buildReport = readJson<{
    totalRawRecords: number;
    adapterContributions: Array<{ id: string; rawRecords: number; failed: boolean }>;
  }>(buildReportPath);

  // --- Criterion 2: count ± documented deviation -----------------------
  const actualCount = manifest.foodCount;
  const deviation = actualCount - expectedCount;
  const deviationPct = Number(((deviation / expectedCount) * 100).toFixed(4));
  const deviationWithinBand = Math.abs(deviationPct) <= maxDeviationPct;
  if (!deviationWithinBand) {
    failures.push(
      `COUNT OUT OF BAND: ${actualCount} foods vs reference ${expectedCount} (${deviationPct}% > ±${maxDeviationPct}% band) — check build-report.json adapter contributions`
    );
  }
  const deviationCauses: string[] = [];
  for (const adapter of buildReport.adapterContributions) {
    if (adapter.failed) {
      deviationCauses.push(`adapter "${adapter.id}" FAILED (contributed 0 raw records)`);
    }
  }
  deviationCauses.push(
    'upstream sources drift between runs (OFF daily dump; adapter availability — the reference build itself had opennutrition contribute 0)'
  );

  // --- Criterion 3: zero critical-missing rows --------------------------
  const sqliteCriticalMissing = await countCriticalMissing(dbPath, 'foods');
  if (sqliteCriticalMissing !== 0) {
    failures.push(`CRITICAL MISSING DATA: ${sqliteCriticalMissing} foods rows with absent/non-finite calories or protein`);
  }

  // --- Criterion 5: SQL size --------------------------------------------
  const sqlBytes = fs.statSync(sqlPath).size;
  const sqlWithinSize = sqlBytes <= sqlMaxBytes;
  if (!sqlWithinSize) {
    failures.push(`SQL TOO LARGE: ${(sqlBytes / 1024 / 1024).toFixed(2)} MB > ${(sqlMaxBytes / 1024 / 1024).toFixed(0)} MB`);
  }

  // --- Criterion 4: replay idempotency + critical check on the artifact -
  const aliasCount = await countTable(dbPath, 'food_id_aliases');
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'food-catalog-validate-'));
  const scratchDb = path.join(scratchDir, 'scratch.db');
  let pass1 = 0;
  let pass2 = 0;
  let criticalMissingReplay = 0;
  try {
    pass1 = await replaySql(sqlPath, scratchDb);
    if (pass1 !== actualCount) {
      failures.push(`REPLAY MISMATCH: pass 1 replayed ${pass1} food_catalog rows vs manifest ${actualCount}`);
    }
    criticalMissingReplay = await countCriticalMissing(scratchDb, 'food_catalog');
    if (criticalMissingReplay !== 0) {
      failures.push(`CRITICAL MISSING DATA (replayed SQL): ${criticalMissingReplay} rows with absent/non-finite calories or protein`);
    }
    pass2 = await replaySql(sqlPath, scratchDb); // second run on the SAME scratch catalog
    if (pass2 !== pass1) {
      failures.push(`REPLAY NOT IDEMPOTENT: pass 2 replayed ${pass2} rows vs pass 1 ${pass1} (duplication!)`);
    }
  } finally {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }

  // --- Export determinism (same db + version -> identical bytes) ------
  let determinismIdentical: boolean | null = null;
  let sqlSha256 = '';
  if (!skipDeterminism) {
    const { createHash } = await import('node:crypto');
    sqlSha256 = createHash('sha256').update(fs.readFileSync(sqlPath)).digest('hex');
    // Self-contained determinism proof: export twice with the manifest
    // version and compare the two fresh exports byte-for-byte (the export
    // step may pass any --version banner, so the artifact's own bytes are
    // not compared here — its correctness is proven by the replay above).
    const firstPath = path.join(os.tmpdir(), `food-catalog-det1-${process.pid}.sql`);
    const secondPath = path.join(os.tmpdir(), `food-catalog-det2-${process.pid}.sql`);
    const first = await exportCatalogToSql({ dbPath, outPath: firstPath, version: manifest.version });
    const second = await exportCatalogToSql({ dbPath, outPath: secondPath, version: manifest.version });
    determinismIdentical =
      first.sha256Hex === second.sha256Hex && first.foodRows === second.foodRows;
    fs.rmSync(firstPath, { force: true });
    fs.rmSync(secondPath, { force: true });
    if (!determinismIdentical) {
      failures.push('EXPORT NOT DETERMINISTIC: two exports from the same database differ');
    }
  }

  // --- Rust audit cross-check (CI step) ---------------------------------
  const rustAudit: ValidationReport['rustAudit'] = { present: false };
  if (auditReportPath && fs.existsSync(auditReportPath)) {
    const audit = readJson<{
      inputFoodCount: number;
      quarantinedTotal: number;
      idAliasesCount: number;
      barcodeAliasesCount: number;
    }>(auditReportPath);
    rustAudit.present = true;
    rustAudit.inputFoodCount = audit.inputFoodCount;
    rustAudit.quarantinedTotal = audit.quarantinedTotal;
    rustAudit.idAliasesCount = audit.idAliasesCount;
    rustAudit.barcodeAliasesCount = audit.barcodeAliasesCount;
    rustAudit.countMatchesManifest = audit.inputFoodCount === actualCount;
    if (!rustAudit.countMatchesManifest) {
      failures.push(`RUST AUDIT COUNT MISMATCH: audit ${audit.inputFoodCount} vs manifest ${actualCount}`);
    }
  }

  const report: ValidationReport = {
    passed: failures.length === 0,
    checkedAt: new Date().toISOString(),
    expectedReferenceCount: expectedCount,
    actualFoodCount: actualCount,
    aliasCount,
    deviation,
    deviationPct,
    maxDeviationPct,
    deviationWithinBand,
    deviationCauses,
    criticalMissingRows: sqliteCriticalMissing + criticalMissingReplay,
    criticalMissingCheck: 'sqlite+replay',
    sqlBytes,
    sqlMaxBytes,
    sqlWithinSize,
    replayRowCounts: { pass1, pass2, duplicated: pass2 - pass1 },
    exportDeterminism: { checked: !skipDeterminism, identical: determinismIdentical, sha256: sqlSha256 },
    rustAudit,
    peakRssBytes: peakRssBytes(),
    failures,
  };

  const reportPath = path.join(outDir, 'validation-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
  console.log('=== F3-a acceptance gate =================================');
  console.log(`Foods:            ${actualCount} (reference ${expectedCount}; deviation ${deviation >= 0 ? '+' : ''}${deviation} = ${deviationPct}% within ±${maxDeviationPct}% band: ${deviationWithinBand ? 'YES' : 'NO'})`);
  console.log(`Aliases:          ${aliasCount} legacy-id rows`);
  console.log(`Critical missing: ${report.criticalMissingRows} (must be 0)`);
  console.log(`SQL artifact:     ${mb(sqlBytes)} MB (cap ${mb(sqlMaxBytes)} MB: ${sqlWithinSize ? 'OK' : 'FAIL'})`);
  console.log(`Replay pass1/pass2: ${pass1}/${pass2} (duplicated ${pass2 - pass1})`);
  console.log(`Determinism:       ${determinismIdentical === null ? 'skipped' : determinismIdentical ? 'identical' : 'DIFFERS'}`);
  console.log(`Rust audit:        ${rustAudit.present ? `inputFoodCount=${rustAudit.inputFoodCount} quarantined=${rustAudit.quarantinedTotal}` : 'not run (CI step)'}`);
  console.log(`Peak RSS:          ${mb(report.peakRssBytes)} MB`);
  console.log(`Report:            ${reportPath}`);
  console.log('==========================================================');
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`FAIL: ${failure}`);
    }
    return 1;
  }
  console.log('ALL F3-a ACCEPTANCE CRITERIA MET');
  return 0;
}

const isDirectCliRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectCliRun) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('[food-db:validate] Validation failed:', err);
      process.exit(1);
    });
}
