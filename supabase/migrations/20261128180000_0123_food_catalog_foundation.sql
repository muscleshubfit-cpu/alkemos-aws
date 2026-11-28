-- ============================================================================
-- 20261128180000_0123_food_catalog_foundation.sql
-- 0123 — OPENCALORY-F3B-FOOD-CATALOG-IMPORT (Wave 1 item 2 of the approved
--        plan docs/opencalory-integration-review-2026-11-28/ — owner order
--        2026-11-28 «نفّذ البند التالي غير المنفذ حسب ترتيب الخطة
--        المعتمدة في المستودع» = F3-ب: the open food catalog lands in its
--        own ODbL-separated Supabase tables — gate D-2 option (أ), owner
--        order 2026-11-28 / 03 §2-2 item 2).
-- ============================================================================
-- WHAT THIS FILE DOES (schema-only, idempotent — ZERO touch of any
-- existing table/policy/index, acceptance criterion 4; the DATA itself
-- is imported by the repo-owned channel, never by an agent session:
-- .github/workflows/food-catalog-import.yml downloads the F3-a CI
-- artifact, applies pending migrations first via the ledger-driven
-- applier, then replays the data-only idempotent SQL + verifies live):
--
--   1. food_catalog — one row per deduplicated food. The 21 columns ARE
--      the F3-a export contract (scripts/food-catalog/export-sql.ts —
--      FOOD_CATALOG_COLUMNS/FOOD_CATALOG_DDL, the mirrored contract this
--      migration must match; pinned by the canary
--      src/lib/__tests__/food-catalog-migration-contract.test.ts).
--   2. food_catalog_aliases — legacy-id aliases (kind='id'; barcode
--      aliases arrive with the F3-d merge, so the CHECK admits both).
--   3. Indexes (plan F3-ب + D-2 «فهارس trigram/باركود»):
--      a) trigram GIN on the food name (pg_trgm — the 0081 precedent,
--         evo_chat_cache_trgm_idx) — the F1-أ unified-search substrate.
--      b) partial UNIQUE barcode index. MEASURED SAFE against the real
--         import artifact (run 46159717498, catalog v2026.11.28): 134,209
--         non-null barcodes, ZERO of them mapping to more than one food
--         id (verified by parsing the actual SQL file — no assumption);
--         13,530 rows carry a NULL barcode and stay outside the index.
--   4. RLS: public READ on both tables (the 0108 nutrient_reference
--      pattern — the whole nutrition reference is public knowledge) for
--      anon + authenticated; ZERO write policies BY DESIGN — the
--      catalog is machine-written through the pipeline channel only
--      (the 0081 posture for writes; service-role bypasses RLS).
--
-- DATA ATTRIBUTION (ODbL-1.0 aggregate — acceptance criterion 2; the
-- full per-source ledger + license links live in LICENSES-DATA.md at
-- the repo root; the public /data-credits page is gate D-4, executed in
-- a later wave by its own owner order):
--   The food_catalog aggregate carries the manifest's license ODbL-1.0:
--   USDA FoodData Central (CC0 1.0) · Health Canada CNF (OGL-Canada 2.0)
--   · Open Food Facts (ODbL-1.0) · curated regional packs (ODbL/CC0).
--   [OpenNutrition (ODbL-1.0) is opt-in in the build and contributed 0
--   rows to this import — documented in scripts/food-catalog/README.md.]
--
-- SEPARATION LAW (D-2, 05 §1.2): this table stores source rows VERBATIM
-- — never merged with the private Alkemos library (src/lib/foods.ts /
-- nutrient_reference) inside storage; the logical merge happens at the
-- QUERY layer only (F1-أ). This keeps the private library pure
-- commercial property while the ODbL obligations stay scoped to this
-- table.
--
-- Migration law compliance (AGENTS §6 — all in this same commit):
-- INDEX.md row + types.ts regeneration + probe row in
-- scripts/db/migration_probes.py (strong: swagger tables/columns + a
-- count threshold + two sample-row probes) + canary test.
-- ============================================================================

-- pg_trgm (0081 precedent — installed there for evo_chat_cache; the
-- if-not-exists keeps this file self-sufficient on a fresh stack).
create extension if not exists pg_trgm;

-- ============================================================
-- 1) food_catalog — the ODbL open catalog (F3-a artifact import)
-- ============================================================
create table if not exists public.food_catalog (
  id text primary key,
  -- normalized EAN-13 (UPC-A zero-padded by the pipeline); NULL for
  -- unbranded/undated rows (13,530 of 147,739 in the measured artifact).
  barcode text,
  -- usda_branded | usda_foundation | usda_sr_legacy | usda_fndds |
  -- cnf | openfoodfacts | curated_* (the build-report adapter ids).
  source text not null,
  -- 1 curated-quality database · 2 foundation/survey · 3 sr-legacy/cnf
  -- · 4 openfoodfacts crowd data (search-layer ranking input).
  accuracy_tier integer not null,
  region text not null default 'GLOBAL',
  category text not null default '',
  name text not null,
  brand text not null default '',
  -- comma-separated normalized aliases (the name-normalizer output).
  aliases text not null default '',
  -- 'per100g' | 'serving' (the scaling basis of the macro columns).
  basis text not null,
  serving_size double precision not null,
  serving_unit text not null,
  serving_weight_grams double precision,
  -- per-100g or per-serving macros per `basis` (the F1-ب contract).
  calories double precision not null,
  protein double precision not null,
  carbs double precision not null,
  fat double precision not null,
  fiber double precision not null,
  -- 18 micronutrients as a JSON string (kept TEXT = the F3-a contract).
  micronutrients_json text not null,
  -- serving options (cup/spoon/portion) as a JSON string.
  serving_options_json text not null,
  search_rank double precision not null default 0
);

-- ============================================================
-- 2) food_catalog_aliases — legacy-id aliases (kind 'id' from F3-a;
--    'barcode' rows arrive with the F3-d library merge)
-- ============================================================
create table if not exists public.food_catalog_aliases (
  legacy_id text not null,
  canonical_id text not null,
  kind text not null check (kind in ('id', 'barcode')),
  primary key (legacy_id, kind)
);

-- ============================================================
-- 3) Indexes — trigram GIN (search substrate) + partial unique
--    barcode (lookup key + integrity, measured collision-free)
-- ============================================================
create index if not exists food_catalog_name_trgm_idx
  on public.food_catalog using gin (name gin_trgm_ops);

create unique index if not exists food_catalog_barcode_uidx
  on public.food_catalog (barcode)
  where barcode is not null;

-- ============================================================
-- 4) RLS — public read on both tables, zero write policies
--    (writes flow exclusively through the pipeline channel)
-- ============================================================
alter table public.food_catalog enable row level security;
alter table public.food_catalog_aliases enable row level security;

drop policy if exists food_catalog_public_read on public.food_catalog;
create policy food_catalog_public_read
  on public.food_catalog for select
  to anon, authenticated
  using (true);

drop policy if exists food_catalog_aliases_public_read
  on public.food_catalog_aliases;
create policy food_catalog_aliases_public_read
  on public.food_catalog_aliases for select
  to anon, authenticated
  using (true);
