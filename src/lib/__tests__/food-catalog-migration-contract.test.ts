/**
 * food-catalog-migration-contract.test.ts — F3-b canary (540).
 *
 * Owner order 2026-11-28 («نفّذ البند التالي غير المنفذ حسب ترتيب الخطة
 * المعتمدة في المستودع: docs/opencalory-integration-review-2026-11-28/»
 * = F3-ب): the open food catalog lands in its own ODbL-separated Supabase
 * tables (gate D-2 option أ). This canary pins the frame's invariants so
 * neither side of the data contract can silently drift:
 *
 *   A. THE COLUMN CONTRACT — the migration's food_catalog columns ARE
 *      the F3-a exporter contract (scripts/food-catalog/export-sql.ts —
 *      FOOD_CATALOG_COLUMNS order and the mirrored FOOD_CATALOG_DDL):
 *      the imported artifact SQL lists every column by name, so ANY
 *      mismatch (a rename, a reorder, a dropped column) would break the
 *      live import mid-transaction. The exporter module itself cannot be
 *      imported here (it depends on @libsql/client, which lives in the
 *      pipeline's own package — the notifications-retention/539 pattern
 *      of reading the source as text applies).
 *
 *   B. THE MIGRATION LAW OBJECTS — trigram GIN name index + partial
 *      UNIQUE barcode index, RLS public read (and ZERO write policies —
 *      the pipeline is the only write channel), the aliases table shape,
 *      the ODbL attribution comment (acceptance criterion 2), the probe
 *      registry row, and the INDEX.md row — every piece the migration
 *      law (AGENTS §6) requires in the SAME commit.
 *
 *   C. THE IMPORT CHANNEL — the repo-owned workflow (never an agent
 *      session) exists and carries the non-negotiable gates: the
 *      integrity sha256 check, migrations-before-data ordering, the
 *      single-transaction ON_ERROR_STOP import, and the 150 MB size
 *      cap (acceptance criterion 3).
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const MIGRATIONS_DIR = "supabase/migrations";
const EXPORTER_TS = "scripts/food-catalog/export-sql.ts";
const PROBES_PY = "scripts/db/migration_probes.py";
const INDEX_MD = "supabase/migrations/INDEX.md";
const IMPORT_WORKFLOW = ".github/workflows/food-catalog-import.yml";

// The one migration file this frame owns (found by its slug, not its
// timestamp — the 2026-11-05 42804 law forbids renaming, so the slug is
// the stable identity).
const findMigration = (): string => {
  const hit = readdirSync(join(process.cwd(), MIGRATIONS_DIR)).find((n) =>
    /_0123_food_catalog_foundation\.sql$/.test(n)
  );
  if (!hit) throw new Error("0123 food_catalog_foundation migration not found");
  return read(join(MIGRATIONS_DIR, hit));
};

/** The exporter's FOOD_CATALOG_COLUMNS array, parsed out of its source as
 *  text (the module imports @libsql/client — unavailable at repo root). */
const exporterColumns = (): string[] => {
  const source = read(EXPORTER_TS);
  const m = source.match(/FOOD_CATALOG_COLUMNS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!m) throw new Error("FOOD_CATALOG_COLUMNS array not found in exporter");
  return Array.from(m[1].matchAll(/'([^']+)'/g), (x) => x[1]);
};

/** The migration's create-table column names, in declaration order. */
const migrationColumns = (sql: string, table: string): string[] => {
  const re = new RegExp(
    `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`,
    "i"
  );
  const m = sql.match(re);
  if (!m) throw new Error(`create table ${table} block not found`);
  const cols: string[] = [];
  for (const rawLine of m[1].split("\n")) {
    const line = rawLine.replace(/--.*$/, "").trim().replace(/,$/, "");
    if (!line) continue;
    // constraint lines (primary key / check / unique / foreign) are not columns
    if (/^(primary|unique|check|foreign|constraint|exclude)\b/i.test(line)) continue;
    const cm = line.match(/^([\w"]+)\s+/);
    if (cm) cols.push(cm[1]);
  }
  return cols;
};

describe("F3-b (540) — the migration ↔ exporter column contract", () => {
  const sql = findMigration();

  it("food_catalog carries the 21 contract columns in the exporter's exact order", () => {
    expect(migrationColumns(sql, "food_catalog")).toEqual(exporterColumns());
  });

  it("every NOT NULL column of the contract is NOT NULL in the migration", () => {
    // The exporter's mirrored DDL is the source of the nullability contract.
    const ddl = read(EXPORTER_TS).match(/FOOD_CATALOG_DDL\s*=\s*`([\s\S]*?)`/)?.[1] ?? "";
    const notNullDdl = Array.from(
      ddl.matchAll(/^\s*([\w]+)[^\n]*not null,?\s*$/gim),
      (m) => m[1]
    ).filter((c) => c !== "id"); // id's NOT NULL is implied by PRIMARY KEY
    for (const col of notNullDdl) {
      expect(sql).toMatch(new RegExp(`\\n\\s*${col}[^\\n]*not null`, "i"));
    }
  });

  it("food_catalog_aliases matches the mirrored aliases contract (columns + PK + kind CHECK)", () => {
    expect(migrationColumns(sql, "food_catalog_aliases").sort()).toEqual([
      "canonical_id",
      "kind",
      "legacy_id",
    ]);
    expect(sql).toMatch(
      /primary key \(legacy_id,\s*kind\)/i
    );
    expect(sql).toMatch(/kind text not null check \(kind in \('id',\s*'barcode'\)\)/i);
  });
});

describe("F3-b (540) — indexes, RLS posture and attribution", () => {
  const sql = findMigration();

  it("creates the trigram GIN index on the food name (the F1-أ search substrate — 0081 precedent)", () => {
    expect(sql).toMatch(
      /create index if not exists food_catalog_name_trgm_idx\s*\n\s*on public\.food_catalog using gin \(name gin_trgm_ops\)/i
    );
  });

  it("creates the PARTIAL UNIQUE barcode index (gate D-2 — measured collision-free on the import artifact)", () => {
    expect(sql).toMatch(
      /create unique index if not exists food_catalog_barcode_uidx\s*\n\s*on public\.food_catalog \(barcode\)\s*\n\s*where barcode is not null/i
    );
  });

  it("enables RLS on both tables with PUBLIC READ and ZERO write policies (the pipeline is the only writer)", () => {
    for (const table of ["food_catalog", "food_catalog_aliases"]) {
      expect(sql).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i")
      );
      expect(sql).toMatch(
        new RegExp(
          `create policy ${table}_public_read\\s*\\n\\s*on public\\.${table} for select\\s*\\n\\s*to anon, authenticated\\s*\\n\\s*using \\(true\\)`,
          "i"
        )
      );
      // no write policy exists on the catalog tables — RLS denies every
      // client write by construction (service-role bypass is the channel)
      expect(sql).not.toMatch(
        new RegExp(`on public\\.${table} for (insert|update|delete)`, "i")
      );
    }
  });

  it("documents the ODbL attribution in the migration comment (criterion 2) and stays ZERO-TOUCH on existing objects", () => {
    expect(sql).toContain("ODbL-1.0");
    expect(sql).toContain("USDA FoodData Central (CC0 1.0)");
    expect(sql).toContain("OGL-Canada 2.0");
    expect(sql).toContain("Open Food Facts (ODbL-1.0)");
    expect(sql).toContain("LICENSES-DATA.md");
    // criterion 4 — no ALTER/DROP on any pre-existing table: the file's
    // only ALTER statements are the two RLS enables on the NEW tables
    const alters = sql.match(/alter table [^\n]+/gi) ?? [];
    expect(alters.every((a) => /public\.food_catalog(_aliases)?\s/.test(a))).toBe(true);
    expect((sql.match(/\bdrop\b/gi) ?? []).length).toBeGreaterThan(0); // drop policy if exists — idempotency
    expect(sql).not.toMatch(/drop\s+(table|column|index)/i);
  });

  it("is idempotent (IF NOT EXISTS on every CREATE it supports + the DROP-IF-EXISTS policy pattern)", () => {
    // tables/indexes/extensions support IF NOT EXISTS — all of them carry it
    for (const kind of ["table", "index", "unique index", "extension"]) {
      const re = new RegExp(`create ${kind}(?! if not exists)`, "i");
      expect(sql).not.toMatch(re);
    }
    // policies have no IF NOT EXISTS in PostgreSQL — the repo's idempotent
    // pattern is DROP POLICY IF EXISTS immediately before each CREATE
    // POLICY (the 0108/0081 precedent this migration follows)
    const policies = sql.match(/create policy\s+(\w+)/gi) ?? [];
    expect(policies.length).toBeGreaterThanOrEqual(2);
    for (const p of policies) {
      const name = p.replace(/create policy\s+/i, "");
      expect(sql).toMatch(
        new RegExp(`drop policy if exists ${name}\\s+on public\\.food_catalog`, "i")
      );
    }
  });
});

describe("F3-b (540) — the migration-law objects ship in the same commit", () => {
  it("the probe registry carries the strong 0123 row (count threshold + sample rows)", () => {
    const probes = read(PROBES_PY);
    expect(probes).toContain('"20261128180000_0123_food_catalog_foundation.sql"');
    // the count probe: offset past 100,000 rows proves the DATA import ran
    expect(probes).toContain("offset=100000");
    // the two measured sample rows from the imported artifact
    expect(probes).toContain("id=eq.cnf:10");
    expect(probes).toContain("barcode=eq.00027000612323");
    expect(probes).toContain('"label": "0123 OPENCALORY-F3B-FOOD-CATALOG-IMPORT"');
  });

  it("INDEX.md carries the 0123 + data rows and the heading is bumped to the newest file", () => {
    const index = read(INDEX_MD);
    expect(index).toContain("| 0123 |");
    expect(index).toMatch(/الترقيم 0001 → 0132/);
  });

  it("types.ts carries both new tables (the migration-law regeneration)", () => {
    const types = read("src/lib/supabase/types.ts");
    expect(types).toContain("food_catalog: {");
    expect(types).toContain("food_catalog_aliases: {");
    expect(types).toContain('Database["public"]["Tables"]["food_catalog"]["Row"]');
  });
});

describe("F3-b (540) — the import channel (repo-owned workflow, never an agent session)", () => {
  it("the workflow exists with the non-negotiable gates", () => {
    const wf = read(IMPORT_WORKFLOW);
    // the integrity gate: a failed artifact must never land
    expect(wf).toContain("did NOT pass the F3-a acceptance gate");
    expect(wf).toContain("sha256 mismatch");
    // migrations BEFORE data (the ledger-driven applier — direct track)
    expect(wf.indexOf("apply_migrations.py")).toBeLessThan(
      wf.indexOf("-f catalog-artifact/food-catalog.sql")
    );
    // atomic import: single transaction + ON_ERROR_STOP
    expect(wf).toContain("ON_ERROR_STOP=1");
    // the F3-ب size cap (criterion 3)
    expect(wf).toContain("150 * 1024 * 1024");
    // the public-read proof through the app's own anonymous path
    expect(wf).toContain("rest/v1/food_catalog");
    // dispatch-only (an import cadence is an owner decision)
    expect(wf).toContain("workflow_dispatch:");
    expect(wf).not.toContain("schedule:");
    // the two-track honesty: the verify track is read-only through
    // PostgREST when SUPABASE_DB_URL is absent (the measured posture —
    // the first deploy's gate proved the secret is not provisioned)
    expect(wf).toContain("HAS_DB_URL: ${{ secrets.SUPABASE_DB_URL != '' }}");
    expect(wf).toContain("Track: VERIFY");
  });
});

describe("F3-b (540) — the data files (the channel pivot: the validated artifact lands as data-only migrations)", () => {
  const DATA_DIR = "supabase/migrations";
  const DATA_FILES = [
    "20261128190000_0124_food_catalog_data_1.sql",
    "20261128190100_0125_food_catalog_data_2.sql",
    "20261128190200_0126_food_catalog_data_3.sql",
    "20261128190300_0127_food_catalog_data_4.sql",
    "20261128190400_0128_food_catalog_data_5.sql",
    "20261128190500_0129_food_catalog_data_6.sql",
    "20261128190600_0130_food_catalog_data_7.sql",
    "20261128190700_0131_food_catalog_data_8.sql",
    "20261128190800_0132_food_catalog_data_9.sql",
  ];
  const readHead = (rel: string, bytes = 2600): string =>
    readFileSync(join(process.cwd(), rel)).subarray(0, bytes).toString("utf8");

  it("all 9 data files exist with strictly increasing versions (hygiene: unique timestamps)", () => {
    for (const f of DATA_FILES) {
      expect(readFileSync(join(process.cwd(), DATA_DIR, f)).length).toBeGreaterThan(0);
    }
    const stamps = DATA_FILES.map((f) => f.split("_")[0]);
    expect(new Set(stamps).size).toBe(9); // no duplicate versions
    expect(stamps).toEqual([...stamps].sort());
  });

  it("every file carries the provenance header (artifact run + sha256 + ODbL attribution)", () => {
    for (const f of DATA_FILES) {
      const head = readHead(join(DATA_DIR, f));
      expect(head).toContain("OPENCALORY-F3B-FOOD-CATALOG-DATA");
      expect(head).toContain("run 46159717498"); // the validated F3-a build
      expect(head).toContain("989f02b0aabeecaef19e978f2ef60963ae505c8b2bb6bdb5d677ce16bc895727");
      expect(head).toContain("ODbL-1.0");
      expect(head).toContain("LICENSES-DATA.md");
    }
  });

  it("every file is an atomic idempotent unit (own BEGIN/COMMIT + upserts only)", () => {
    for (const f of DATA_FILES) {
      const sql = readFileSync(join(process.cwd(), DATA_DIR, f), "utf8");
      expect(sql).toMatch(/^BEGIN;/m);
      expect(sql).toMatch(/^COMMIT;/m);
      // every INSERT statement carries its ON CONFLICT upsert clause —
      // a re-run never duplicates a row (the artifact's own design)
      const inserts = (sql.match(/^INSERT INTO /gm) ?? []).length;
      const upserts = (sql.match(/ON CONFLICT \((id|legacy_id, kind)\) DO UPDATE/g) ?? []).length;
      expect(inserts).toBe(upserts);
    }
  });

  it("the probe registry carries a row per data file (the red probe names the unapplied chunk)", () => {
    const probes = read(PROBES_PY);
    for (const f of DATA_FILES) {
      expect(probes).toContain(f);
    }
    // the final file carries the full import-completion checks
    expect(probes).toContain("0132 FOOD-CATALOG-DATA 9/9");
    expect(probes).toContain("offset=60000");
  });
});
