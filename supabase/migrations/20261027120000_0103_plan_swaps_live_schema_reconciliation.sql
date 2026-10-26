-- ============================================================================
-- 0103 — PLAN-SWAPS LIVE-SCHEMA RECONCILIATION (المرحلة 372 — HONEST-LEDGER
-- + PLAN-TYPE، جولة QA الحية للمهمة QA-TEST-ACCOUNTS-2026-10-26)
-- ============================================================================
-- THE MEASURED FACT (read-only, 2026-10-27, via the PostgREST OpenAPI spec):
--   production public.plan_swaps = id / user_id / plan_id? / plan_type NOT
--   NULL (text) / swap_type / day_index? / item_index? / old_item? (jsonb) /
--   new_item? (jsonb) / reason? / created_at — while the repo migrations
--   (0063 created the table) and types.ts knew only id/user_id/plan_id?/
--   swap_type/created_at. The six extra columns were created owner-side on
--   production and never mirrored here.
--
-- WHY THIS FILE (the 42703 incident class — caught by the parity gate's
-- migration_audit on the first push of the fix):
--   the types.ts mirror of the live shape (same commit) is flagged PHANTOM
--   without a migration defining the columns. This file reconciles the repo
--   with the MEASURED production truth — exactly migration 0063's law:
--   «types generated FROM the live database — faithfully mirrored».
--
-- PRODUCTION IMPACT: GUARANTEED NO-OP — every column already exists there
--   (IF NOT EXISTS); the file exists for fresh environments, the parity
--   gate, and the historical record. NOTE: the Supabase auto-apply pipeline
--   stopped after 0100 (see RUN_ON_SUPABASE_0102 wrapper) — 0101/0102/0103
--   await the owner's hand on production; on production this file changes
--   NOTHING (all six columns pre-exist).
--
-- NOT NULL WITHOUT DEFAULT — deliberate, faithful to the live column
--   (measured default = none): plan_swaps is an append-only ledger that
--   held ZERO rows ever until the HONEST-LEDGER fix (every historical
--   insert died on this very column), so there is nothing to backfill and
--   no default to invent; the only writer (tier-limits.recordSwap) always
--   provides the value.
-- ============================================================================

alter table public.plan_swaps
  add column if not exists plan_type text not null;

alter table public.plan_swaps
  add column if not exists day_index integer;

alter table public.plan_swaps
  add column if not exists item_index integer;

alter table public.plan_swaps
  add column if not exists old_item jsonb;

alter table public.plan_swaps
  add column if not exists new_item jsonb;

alter table public.plan_swaps
  add column if not exists reason text;
