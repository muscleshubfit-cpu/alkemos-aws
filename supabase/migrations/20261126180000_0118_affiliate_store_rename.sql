-- ============================================================================
-- 20261126180000_0118_affiliate_store_rename.sql
-- 0118 — ALKEMOS-STORE-RENAME (owner order 2026-11-26 «توحيد الاسم البرمجي
--         إلى affiliate_store»): the transitional, data-preserving rename of
--         the product-store family from store_* to affiliate_store_*.
-- ============================================================================
-- WHY (owner order, verbatim scope):
--   «اعتمد "affiliate_store" الاسم البرمجي الرسمي والموحد لمتجر منتجات
--    الأفلييت… أسماء جداول قاعدة البيانات والأعمدة والفهارس والسياسات»
--   The Phase-1 family (0115/0116/0117) was born store_* under the old
--   naming law («the word "affiliate" is allowed solely in non-entity
--   names»). The owner's rename order SUPERSEDES that naming law for the
--   product store ONLY; the three-system separation itself is UNTOUCHED
--   and becomes STRICTER: the affiliate_store_* family is now impossible
--   to confuse with either System 1 (affiliate_transactions,
--   affiliate_commissions, referrals, referral_*, /referral routes) or
--   System 3 (the future Arabic store — still zero tables/APIs/pages,
--   outside this task's scope entirely).
--
-- WHAT THIS FILE DOES (rename-only, zero data change):
--   1. RENAMES the four tables:
--        store_categories      → affiliate_store_categories
--        store_products        → affiliate_store_products
--        store_product_links   → affiliate_store_product_links
--        store_click_events    → affiliate_store_click_events
--      ALTER TABLE … RENAME TO keeps every row, column, constraint,
--      index, policy, grant and RLS flag attached (OID-stable); policy
--      bodies referencing the old names keep working (parse trees hold
--      relation OIDs, not names).
--   2. RENAMES the 7 explicitly-named indexes (idx_/uq_ store_*) to
--      their affiliate_store_* equivalents.
--   3. RENAMES the 9 RLS policies to their affiliate_store_* equivalents.
--   4. RENAMES the auto-named PK/UNIQUE/FK/CHECK constraints and the one
--      identity sequence (store_click_events_id_seq) so a fresh
--      `supabase gen types` shows a fully unified family.
--   5. Reloads the PostgREST schema cache (NOTIFY pgrst) so the REST
--      surface serves /rest/v1/affiliate_store_* immediately.
--
-- WHAT IT DELIBERATELY DOES NOT DO:
--   - NO column renames (columns were never store_-prefixed).
--   - NO data change, NO drop, NO recreate — the 27 pending products,
--     the 75-category tree, the click rows and every RLS policy survive
--     verbatim (verified by the 0118 probe: the 27-slug founding batch
--     must still count 27 THROUGH the new table name).
--   - NO touch to System 1 (affiliate_*/referral_* partner tables) or
--     System 3 (no tables exist; none are created).
--   - 0115/0116/0117 are already-applied history: NOT edited, NOT
--     re-run — this file is the only sanctioned correction channel
--     (the 0107/0117 pattern).
--
-- IDEMPOTENT: every rename is guarded by an existence check on the OLD
-- name (to_regclass / pg_class / pg_constraint / pg_policy), so a re-run
-- on an already-renamed database is a documented no-op. The pipeline's
-- ledger records this version exactly once either way.
--
-- ORDER GUARANTEE (both worlds converge on the same end state):
--   - PRODUCTION: 0115/0116/0117 applied via the external channel
--     (state-audit evidence 2026-11-26) → this file renames the family.
--   - CLEAN TEST STACK (db-migrate validate): 0115 fails closed (the
--     documented is_admin baseline), 0117 re-creates the family guarded
--     → this file renames it the same way.
--
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job) /
-- the re-linked external channel; verified by scripts/db/migration_state.py.
-- ============================================================================

-- ============================================================
-- 1) THE FOUR TABLE RENAMES (data-preserving, OID-stable)
-- ============================================================
alter table if exists public.store_categories    rename to affiliate_store_categories;
alter table if exists public.store_products      rename to affiliate_store_products;
alter table if exists public.store_product_links rename to affiliate_store_product_links;
alter table if exists public.store_click_events  rename to affiliate_store_click_events;

-- ============================================================
-- 2) THE EXPLICIT INDEXES (7 — the 0115/0117 names)
-- ============================================================
alter index if exists public.idx_store_categories_parent
  rename to idx_affiliate_store_categories_parent;
alter index if exists public.idx_store_products_published_category
  rename to idx_affiliate_store_products_published_category;
alter index if exists public.uq_store_products_asin
  rename to uq_affiliate_store_products_asin;
alter index if exists public.idx_store_products_pending
  rename to idx_affiliate_store_products_pending;
alter index if exists public.idx_store_product_links_surface
  rename to idx_affiliate_store_product_links_surface;
alter index if exists public.idx_store_click_events_product_day
  rename to idx_affiliate_store_click_events_product_day;
alter index if exists public.idx_store_click_events_surface_day
  rename to idx_affiliate_store_click_events_surface_day;

-- ============================================================
-- 3) THE IDENTITY SEQUENCE (store_click_events.id)
-- ============================================================
alter sequence if exists public.store_click_events_id_seq
  rename to affiliate_store_click_events_id_seq;

-- ============================================================
-- 4) THE 9 RLS POLICIES (public read + admin writes)
--    ALTER POLICY has no IF EXISTS — guarded by pg_policy lookups on
--    the RENAMED table (a re-run finds nothing to rename: no-op).
-- ============================================================
do $$
declare
  renames text[][] := array[
    ['affiliate_store_categories',  'store_categories_public_read',    'affiliate_store_categories_public_read'],
    ['affiliate_store_categories',  'store_categories_admin_insert',   'affiliate_store_categories_admin_insert'],
    ['affiliate_store_categories',  'store_categories_admin_update',   'affiliate_store_categories_admin_update'],
    ['affiliate_store_products',    'store_products_public_read',      'affiliate_store_products_public_read'],
    ['affiliate_store_products',    'store_products_admin_insert',     'affiliate_store_products_admin_insert'],
    ['affiliate_store_products',    'store_products_admin_update',     'affiliate_store_products_admin_update'],
    ['affiliate_store_product_links','store_product_links_public_read','affiliate_store_product_links_public_read'],
    ['affiliate_store_product_links','store_product_links_admin_insert','affiliate_store_product_links_admin_insert'],
    ['affiliate_store_product_links','store_product_links_admin_delete','affiliate_store_product_links_admin_delete']
  ];
  r text[];
begin
  foreach r in array renames loop
    if exists (
      select 1 from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = r[1] and p.polname = r[2]
    ) then
      execute format('alter policy %I on public.%I rename to %I', r[2], r[1], r[3]);
    end if;
  end loop;
end $$;

-- ============================================================
-- 5) THE AUTO-NAMED CONSTRAINTS (PK/UNIQUE/FK/CHECK)
--    RENAME CONSTRAINT has no IF EXISTS — guarded by pg_constraint
--    lookups on the RENAMED tables (re-run = no-op).
-- ============================================================
do $$
declare
  renames text[][] := array[
    -- primary keys
    ['affiliate_store_categories',    'store_categories_pkey',    'affiliate_store_categories_pkey'],
    ['affiliate_store_products',      'store_products_pkey',      'affiliate_store_products_pkey'],
    ['affiliate_store_product_links', 'store_product_links_pkey', 'affiliate_store_product_links_pkey'],
    ['affiliate_store_click_events',  'store_click_events_pkey',  'affiliate_store_click_events_pkey'],
    -- unique constraints (column-level UNIQUE)
    ['affiliate_store_categories',    'store_categories_slug_key', 'affiliate_store_categories_slug_key'],
    ['affiliate_store_products',      'store_products_slug_key',   'affiliate_store_products_slug_key'],
    ['affiliate_store_product_links', 'store_product_links_product_id_surface_type_surface_key_key',
                                     'affiliate_store_product_links_product_id_surface_type_surface_key_key'],
    -- foreign keys
    ['affiliate_store_categories',    'store_categories_parent_id_fkey',    'affiliate_store_categories_parent_id_fkey'],
    ['affiliate_store_products',      'store_products_category_id_fkey',     'affiliate_store_products_category_id_fkey'],
    ['affiliate_store_product_links', 'store_product_links_product_id_fkey','affiliate_store_product_links_product_id_fkey'],
    ['affiliate_store_click_events',  'store_click_events_product_id_fkey',  'affiliate_store_click_events_product_id_fkey'],
    -- checks
    ['affiliate_store_products',      'store_products_asin_check',             'affiliate_store_products_asin_check'],
    ['affiliate_store_products',      'store_products_editorial_rating_check', 'affiliate_store_products_editorial_rating_check'],
    ['affiliate_store_products',      'store_products_review_status_check',    'affiliate_store_products_review_status_check'],
    ['affiliate_store_product_links', 'store_product_links_surface_type_check','affiliate_store_product_links_surface_type_check'],
    ['affiliate_store_click_events',  'store_click_events_surface_type_check', 'affiliate_store_click_events_surface_type_check']
  ];
  r text[];
begin
  foreach r in array renames loop
    if exists (
      select 1 from pg_constraint k
      join pg_class c on c.oid = k.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = r[1] and k.conname = r[2]
    ) then
      execute format('alter table public.%I rename constraint %I to %I', r[1], r[2], r[3]);
    end if;
  end loop;
end $$;

-- ============================================================
-- 6) POSTGREST SCHEMA RELOAD (the apply pipeline's closing law —
--    restated here so a manual/external-channel apply also converges)
-- ============================================================
notify pgrst, 'reload schema';

-- ============================================================
-- VERIFY (informational, never fatal): the renamed family + the
-- founding batch still intact through the NEW names.
-- ============================================================
do $$
declare
  products int;
  categories int;
begin
  select count(*) into products from public.affiliate_store_products;
  select count(*) into categories from public.affiliate_store_categories;
  raise notice '0118 rename verified: affiliate_store_products=% rows, affiliate_store_categories=% rows', products, categories;
end $$;
