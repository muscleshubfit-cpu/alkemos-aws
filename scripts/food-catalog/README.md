# Food Catalog CI Build Pipeline (F3-a)

> **Origin:** owner order 2026-11-28 («نفّذ البند التالي غير المنفّذ... ابدأ بـ F3-أ») — the opening
> item of Wave 1 in
> [`docs/opencalory-integration-review-2026-11-28/04-PHASED-PLAN-AR.md`](../../docs/opencalory-integration-review-2026-11-28/04-PHASED-PLAN-AR.md) (F3-أ: خط بناء الكتالوج).
> Gates D-1/D-2/D-3/D-4 are all decided (03 §2-1/§2-2 of the same folder).

**What this is:** an adapted fork of the audited openCalory catalog build pipeline
(MIT code, ODbL-1.0 aggregate data — the review folder documents the source audit).
It compiles upstream open datasets into a deduplicated food catalog, quality-checks
it with the forked Rust `catalog-dedup` tool, and exports a **data-only, idempotent
SQL file** targeted at the Supabase tables the **F3-b migration** will create.

**LAW — CI only:** the build runs on GitHub Actions ONLY
(`.github/workflows/food-catalog-build.yml`). It is **never** run on the
production origin (the 1GB Lightsail instance) and is never wired into the deploy
pipeline. The full build is memory-heavy (the compile phase's VACUUM pushes the
peak well past 4GB at full dataset scale) — the measured peak RSS of every run is
recorded in `out/validation-report.json` (job artifact).

## Layout

| Path | Role |
|---|---|
| `build.ts` | Adapted fork of the source's `scripts/build-food-catalog.ts` — six adapters → dedup → SQLite + manifest + build-report |
| `adapters/` | The six converters (fork): `usda`, `opennutrition`, `national-tables` (CNF core), `menustat-opennosh` (cache-only), `off-foodrepo` (OFF stream + FoodRepo), `curated` |
| `src/` | Forked engine modules: `dedup.ts`, `name-normalizer.ts`, `catalog-schema.ts`, `portion-enrichment.ts`, `scaling.ts`, `csv-food-parser.ts`, `usda-adapter.ts` (types/mappers), `types.ts`, `backup-schemas.ts` (Zod schemas extracted), `gate-core-sources.ts` (NEW 539: the pure approved-core-source liveness law the gate enforces) |
| `data/curated/` | The forked curated packs (ODbL/CC0) |
| `tools/catalog-dedup/` | The forked Rust audit/compact tool (verbatim) |
| `export-sql.ts` | NEW: SQLite → importable data-only SQL (upserts) |
| `validate.ts` | NEW: the acceptance-criteria gate (writes `validation-report.json`) |
| `out/`, `.cache/` | Build outputs / download cache — gitignored, never committed |

## Upstream sources (all open, no API keys, no secrets)

**Default (the audited composition):** USDA FoodData Central (CC0) · Health
Canada CNF (OGL-Canada) · Open Food Facts (ODbL-1.0 — streamed live from the
official dump) · curated regional packs (ODbL/CC0) — plus MenuStat/OpenNosh
(cache-only; contributes 0 on a fresh runner). These are the exact four
documented contributors of the reference build (source DATA_LICENSES "Current
Build": raw 170,051 → 130,362 foods).

**Opt-in (`--with-opennutrition`):** OpenNutrition (ODbL-1.0, core-capped at
60,000). It contributed **0** to the reference build (its zip was unreachable
then — measured by the first CI run: joining, it grew the count to 194,666 =
+49.3% over the reference). Because a silent composition change of that size
is an owner decision (the plan's per-source decision pattern — see F3-هـ), it is
NOT part of the default. The aggregate catalog is **ODbL-1.0**; the attribution
ledger lives in the frame report and will be materialized by F3-b (migration
comment + data-licenses doc + the approved `/data-credits` page).

## Adaptations vs the source (everything else is a verbatim carry-over)

1. Import specifiers rewritten to relative paths (no `@/` aliases exist here).
2. `src/usda-adapter.ts`: the Dexie offline-cache function was **removed** — the
   source's offline stack is excluded from adoption by review constraint 2 (no
   IndexedDB/OPFS architecture). Only types/mappers used by the pipeline remain.
3. `src/backup-schemas.ts` is a verbatim extraction of the Zod schemas (the
   surrounding backup module belongs to the excluded offline stack).
4. `adapters/curated.ts` reads `data/curated/` from this fork's root.
5. `adapters/off-foodrepo.ts`: a `FOOD_CATALOG_OFF_STREAM_BUDGET_MS` env override
   for the 900s stream budget (default behavior unchanged; a quick-rebuild knob).
6. `build.ts`: default out/cache dirs live under this fork; emits
   `build-report.json` (per-adapter contributions + count deviation + peak RSS).
7. NEW steps `export-sql.ts` / `validate.ts` (no source counterpart).

## The data contract (owned jointly with F3-b)

`export-sql.ts` emits data-only `INSERT ... ON CONFLICT ... DO UPDATE` statements
(valid PostgreSQL AND SQLite) for:

- `food_catalog` — columns: `id, barcode, source, accuracy_tier, region, category,
  name, brand, aliases, basis, serving_size, serving_unit, serving_weight_grams,
  calories, protein, carbs, fat, fiber, micronutrients_json,
  serving_options_json, search_rank`
- `food_catalog_aliases` — `legacy_id, canonical_id, kind` (kind `= 'id'`; barcode
  aliases arrive with the F3-d merge)

The DDL (tables + trigram GIN + partial unique barcode index + public-read RLS)
is owned by the **F3-b migration**; `FOOD_CATALOG_DDL` in `export-sql.ts` is the
mirrored contract the migration must match. `validate.ts` proves importability
and re-import idempotency by replaying the SQL twice onto a scratch SQLite
catalog built from that DDL.

## Acceptance criteria (the frame's five, from the plan)

1. **CI-only build** — enforced structurally (this workflow; no wiring into
   deploy-aws.yml or the origin server).
2. **Count check** — reference 130,362 foods (the source's v2026.11.25 core
   build — the audited four-source composition). Default hard band ±20%
   (`--max-deviation-pct`); the **actual deviation is always documented** in
   `build-report.json` + `validation-report.json` + the job summary.
   **Core-source liveness (539 hardening — owner order 2026-11-28):** the
   band documents DRIFT; it must never MASK a dead source. Any of the four
   approved core sources (`usda` · `national-tables` · `off-foodrepo` ·
   `curated`) failing — its adapter throwing, silently contributing **0 raw
   records** (the real failure mode of the OFF stream and the USDA
   downloader: they log and return `[]`), or missing from the build report —
   **fails the gate even when the total count stays inside the band** (a
   smaller core source dying moves the total by only a few percent, well
   inside ±20% — the measured masking hole this closes). The law lives in
   `src/gate-core-sources.ts` and is pinned by the repo suite at
   `src/lib/__tests__/food-catalog-gate-core-sources.test.ts` (runs in
   quality-gate). **Documented exceptions (non-blocking, recorded in every
   report):** the cache-only source (`menustat-opennosh` — contributes 0 on
   a fresh runner by design) and the optional opt-in source
   (`opennutrition` — contributed 0 to the reference build). The composition
   itself is untouched by the check — it mirrors `build.ts`'s
   DEFAULT_ADAPTERS law, never changes it.
3. **Zero rows with critical missing data** — absent/non-finite calories or
   protein = 0 rows, checked on the compiled SQLite AND on the replayed SQL
   artifact.
4. **Idempotent / re-runnable** — the SQL replays twice without duplicating a
   row; two exports from the same database are byte-identical; the build itself
   is deterministic given the same inputs (same raw records → same food count;
   the manifest's `builtAt` timestamp is the only varying field).
5. **SQL artifact ≤ 200 MB** — enforced with the measured size in the report.

## Running

```bash
# CI (authoritative): the workflow — dispatch from GitHub Actions, or it fires
# on any push touching scripts/food-catalog/** or the workflow itself.

# Locally (dev machine only — NEVER the production origin):
cd scripts/food-catalog
bun install            # frozen via the committed bun.lock
bunx tsc --noEmit      # typecheck
bun build.ts --tier=core                       # full build (network downloads)
bun build.ts --tier=core --with-opennutrition  # …plus the opt-in OpenNutrition source
bun export-sql.ts --version=<manifest version> # SQL export
bun validate.ts                                # acceptance gate
cargo run --release --manifest-path tools/catalog-dedup/Cargo.toml -- \
  audit --input out/food-catalog.db.gz --report out/catalog-audit-report.json
```

Cost note: a full CI run is heavyweight (tens of billable minutes on the 2-core
private-repo runner: downloads + Rust release build + full OFF stream up to its
900s budget + compile + validation). It never runs on a schedule; a cadence
would be an explicit owner decision.
