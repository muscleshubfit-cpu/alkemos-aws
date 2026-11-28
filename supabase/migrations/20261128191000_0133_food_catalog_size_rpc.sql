-- ============================================================================
-- 20261128191000_0133_food_catalog_size_rpc.sql
-- 0133 — OPENCALORY-F3B-FOOD-CATALOG-SIZE-RPC (the measured closure of the
--        F3-ب acceptance criterion 3: "حجم الجدول ≤150MB مع الفهارس" —
--        docs/opencalory-integration-review-2026-11-28/04-PHASED-PLAN-AR.md):
--        an admin-channel measurement RPC so the criterion is MEASURED on
--        production through the repo's own state gate (AGENTS §3.5: "it
--        compiles" is not "it works"; the plan's estimates are not
--        measurements), and stays guarded FOREVER — a catalog that ever
--        bloats past the cap turns the migration-state gate RED by itself.
--
-- WHY AN RPC (not a view / not the psql path): the repo has ZERO views
-- (types.ts Views: {} — introducing a view class is §3.4 territory), while
-- admin RPCs are the established precedent (get_admin_clients_stats et
-- al); and the psql path (pg_total_relation_size via SUPABASE_DB_URL)
-- stays the DIRECT import workflow's size gate — available once the
-- owner provisions the secret (docs/DB-MIGRATION-PIPELINE-2026-10-27.md
-- §5). This RPC is the measurement channel that works with the secrets
-- the repo already has (the service-role key — PostgREST GET /rpc).
--
-- WHAT IT RETURNS: one row — the measured heap+indexes bytes of both
-- catalog tables, a pretty form, and total_ok = the ≤150MB gate verdict
-- (157,286,400 bytes = 150 × 1024 × 1024 — the plan's criterion 3 bound).
--
-- ACCESS (service-role only — measurement is ops telemetry, not member
-- data): EXECUTE revoked from anon/authenticated (default EXECUTE is
-- PUBLIC — revoked, the house style), granted to service_role. The
-- state gate (service key) and the food-catalog-import workflow's VERIFY
-- track read it; the migration-state probe asserts total_ok (criterion 3
-- enforced as a standing gate, not a one-time check).
-- ============================================================================

create or replace function public.get_food_catalog_size()
returns table (
  food_catalog_bytes          bigint,
  food_catalog_aliases_bytes  bigint,
  food_catalog_pretty          text,
  total_ok                    boolean
)
language sql
security definer
set search_path = public
as $$
  select pg_total_relation_size('public.food_catalog'),
         pg_total_relation_size('public.food_catalog_aliases'),
         pg_size_pretty(pg_total_relation_size('public.food_catalog')),
         pg_total_relation_size('public.food_catalog') <= 157286400;
$$;

-- Measurement is ops telemetry: service-role only (the state gate + the
-- import workflow's verification track), never a member-facing surface.
revoke all on function public.get_food_catalog_size() from public;
revoke all on function public.get_food_catalog_size() from anon;
revoke all on function public.get_food_catalog_size() from authenticated;
grant execute on function public.get_food_catalog_size() to service_role;
