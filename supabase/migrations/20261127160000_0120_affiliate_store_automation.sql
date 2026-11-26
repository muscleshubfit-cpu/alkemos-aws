-- ============================================================================
-- 20261127160000_0120_affiliate_store_automation.sql
-- 0120 — AFFILIATE-STORE-AUTOMATION (owner order 2026-11-27 «نفّذ مرحلة
--        بناء منظومة الأتمتة والتسويق الداخلي لمتجر Affiliate Store»):
--        the data foundation of the automation + internal-marketing system
--        for the Alkemos Affiliate Store (System 2 — EN-only).
-- ============================================================================
-- WHAT THIS FILE DOES (additive + idempotent — the 0108 pattern):
--   1. affiliate_store_automation_settings — the SINGLETON control row
--      (is_enabled, frequency daily/weekly/monthly, per-run caps, linking
--      thresholds). Seeded disabled: the owner flips it on from the admin
--      panel (nothing auto-runs before that explicit decision).
--   2. affiliate_store_fetch_categories — per-LEAF fetch configuration
--      (keywords[], browse_node_id, target_count, is_active). Seeded for
--      the 30 highest-value commercial leaves with curated EN keywords.
--   3. affiliate_store_fetch_runs — the run ledger (trigger, status,
--      counters, events jsonb, error summary). THE OVERLAP LOCK: a partial
--      UNIQUE index on status='running' makes a second concurrent run a
--      constraint violation at the DB level (no scheduler overlap, ever).
--   4. affiliate_store_link_suggestions — the smart-linking proposal queue
--      ((page_type, page_slug, product_id) unique + score + matched-tokens
--      reason + pending/approved/rejected).
--   5. affiliate_store_inline_links — the APPLIED in-content links (EN
--      pages only by law; public read of ACTIVE rows so the EN render path
--      can stitch them; admin writes).
--   6. affiliate_store_impression_events — daily-aggregated impressions
--      (product × surface × day, counter row) + the SECURITY DEFINER
--      increment RPC (service-role only — anon/authenticated revoked).
--
-- WHAT IT DELIBERATELY DOES NOT DO:
--   - No touch to System 1 (affiliate_/referral_ partner family) or any
--     non-store table — §0 separation.
--   - No price columns on products (price_usd exists since 0115; the
--     automation writes API-served values there — the price clause's
--     allowed class — while public display stays "See price on Amazon"
--     until the Phase-4 owner order, documented in docs/store/AUTOMATION-EN.md).
--   - No stored tagged links anywhere (guard law §3.4-1 untouched).
--   - No AR/store mixing: every new table is affiliate_store_* and every
--     render-path consumer is (en)-tree only (canary-pinned).
--
-- Idempotent: safe to re-run (IF NOT EXISTS + ON CONFLICT DO NOTHING).
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) affiliate_store_automation_settings — the singleton control row
-- ============================================================
create table if not exists public.affiliate_store_automation_settings (
  id                   int  primary key check (id = 1),   -- the singleton law
  is_enabled           boolean not null default false,    -- OFF until the owner flips it
  frequency            text    not null default 'weekly'
                       check (frequency in ('daily','weekly','monthly')),
  max_new_per_run      int     not null default 12  check (max_new_per_run between 1 and 40),
  max_links_per_page   int     not null default 3   check (max_links_per_page between 1 and 6),
  auto_link_enabled    boolean not null default true,     -- auto-apply high-score suggestions
  link_score_threshold numeric(5,2) not null default 30.00 check (link_score_threshold between 0 and 100),
  last_run_at          timestamptz,
  updated_at           timestamptz not null default now()
);

alter table public.affiliate_store_automation_settings enable row level security;

-- Admin-only everything (the public learns nothing from this table).
drop policy if exists affiliate_store_automation_settings_admin_all on public.affiliate_store_automation_settings;
create policy affiliate_store_automation_settings_admin_all
  on public.affiliate_store_automation_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The singleton seed (conflict on id = 1 → no-op on re-run).
insert into public.affiliate_store_automation_settings (id, is_enabled, frequency)
values (1, false, 'weekly')
on conflict (id) do nothing;

-- ============================================================
-- 2) affiliate_store_fetch_categories — per-leaf fetch config
-- ============================================================
create table if not exists public.affiliate_store_fetch_categories (
  category_id    uuid primary key references public.affiliate_store_categories(id) on delete cascade,
  keywords       text[] not null check (array_length(keywords, 1) between 1 and 8),
  browse_node_id text,                       -- Amazon browse node (optional refinement)
  target_count   int   not null default 6 check (target_count between 1 and 60),
  is_active      boolean not null default true,
  updated_at     timestamptz not null default now()
);

alter table public.affiliate_store_fetch_categories enable row level security;

drop policy if exists affiliate_store_fetch_categories_admin_all on public.affiliate_store_fetch_categories;
create policy affiliate_store_fetch_categories_admin_all
  on public.affiliate_store_fetch_categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- SEED — curated EN search keywords for the 30 highest-value commercial
-- leaves (slug-keyed, idempotent). The admin panel edits/adds the rest.
-- PERSON-PHOTO RISK LAW (image law §0.1): apparel leaves that typically
-- carry model photos are seeded is_active=FALSE (womens-training-apparel
-- is not seeded at all) — the automation only fetches product-only-photo
-- classes until the owner widens them deliberately.
insert into public.affiliate_store_fetch_categories (category_id, keywords, target_count, is_active)
select c.id, v.kw, v.target, v.active
from (values
  ('protein-powders',                          array['whey protein powder','casein protein powder','plant protein powder'], 8,  true),
  ('creatine-amino-acids',                     array['creatine monohydrate','bcaa eaa powder'], 6, true),
  ('vitamins-minerals-omegas',                 array['multivitamin for athletes','omega 3 fish oil','vitamin d3 supplement'], 8, true),
  ('pre-workout-energy-formulas',              array['pre workout powder'], 5, true),
  ('electrolytes-hydration-mixes',             array['electrolyte powder hydration mix'], 5, true),
  ('energy-gels-chews',                        array['energy gels running','energy chews sports'], 4, true),
  ('protein-bars-functional-snacks',           array['protein bars','high protein snacks'], 6, true),
  ('nuts-seeds-trail-mixes',                   array['unsalted mixed nuts','trail mix'], 5, true),
  ('nut-butters-spreads',                      array['natural peanut butter','almond butter'], 5, true),
  ('low-sugar-diet-friendly-foods',            array['sugar free snacks','low carb foods'], 5, true),
  ('specialty-baking-cooking-ingredients',     array['protein flour baking','sugar substitute sweetener'], 4, true),
  ('coffees-teas',                             array['green tea','black coffee ground'], 4, true),
  ('adjustable-fixed-dumbbells',               array['adjustable dumbbells','rubber hex dumbbells'], 6, true),
  ('kettlebells',                              array['kettlebell cast iron'], 4, true),
  ('barbells-plates-collars',                  array['olympic barbell','bumper plates','weight plates set'], 6, true),
  ('resistance-bands-tubes',                   array['resistance bands set','fabric resistance bands'], 6, true),
  ('power-racks-benches-pull-up-bars',         array['power rack squat stand','adjustable weight bench','pull up bar doorway'], 6, true),
  ('home-gyms-cable-stations',                 array['home gym machine','cable machine home gym'], 4, true),
  ('treadmills-walking-pads',                  array['folding treadmill','walking pad under desk'], 4, true),
  ('exercise-spin-bikes',                      array['stationary exercise bike','spin bike indoor'], 4, true),
  ('rowing-machines',                          array['rowing machine'], 3, true),
  ('yoga-mats-props',                          array['yoga mat non slip','yoga blocks set'], 5, true),
  ('foam-rollers-massage-tools',               array['foam roller','muscle massage stick'], 5, true),
  ('percussive-massagers',                     array['massage gun percussive'], 4, true),
  ('digital-food-scales-measuring-tools',      array['digital food scale kitchen','measuring cups spoons set'], 5, true),
  ('meal-prep-containers-storage',             array['meal prep containers','glass food storage containers'], 6, true),
  ('blenders-personal-blenders',               array['personal blender smoothie','countertop blender'], 4, true),
  ('insulated-smart-water-bottles',            array['insulated water bottle stainless'], 5, true),
  ('shaker-mixer-bottles',                     array['protein shaker bottle'], 4, true),
  ('fitness-smartwatches-gps-watches',         array['fitness smartwatch','gps running watch'], 5, true),
  ('smart-body-composition-scales',            array['smart body weight scale bluetooth'], 5, true),
  ('sport-earbuds-headphones',                 array['sport earbuds waterproof','running headphones'], 4, true),
  ('lifting-belts-straps-gloves',              array['weightlifting belt','lifting straps','gym gloves'], 5, true),
  ('jump-ropes',                               array['speed jump rope','weighted jump rope'], 4, true),
  ('gym-flooring-setup',                       array['gym floor mats interlocking'], 4, true),
  ('fitness-nutrition-books',                  array['strength training book','nutrition science book'], 4, true),
  ('mens-training-apparel',                    array['mens training shorts','mens gym tshirt'], 4, false),  -- person-photo risk: OFF by default
  ('training-gym-footwear',                    array['gym training shoes','flat lifting shoes'], 4, false)  -- person-photo risk: OFF by default
) as v(slug, kw, target, active)
join public.affiliate_store_categories c on c.slug = v.slug
on conflict (category_id) do nothing;

-- ============================================================
-- 3) affiliate_store_fetch_runs — the run ledger + OVERLAP LOCK
-- ============================================================
create table if not exists public.affiliate_store_fetch_runs (
  id             uuid primary key default gen_random_uuid(),
  trigger        text not null default 'cron' check (trigger in ('cron','manual')),
  status         text not null default 'running'
                 check (status in ('running','succeeded','partial','failed','skipped')),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  candidates     int not null default 0,
  inserted       int not null default 0,
  updated        int not null default 0,
  unchanged      int not null default 0,
  rejected       int not null default 0,
  hidden         int not null default 0,
  error_summary  text,
  events         jsonb not null default '[]'::jsonb,   -- the chronological run log
  settings_snapshot jsonb                              -- what was configured at start
);

create index if not exists idx_affiliate_store_fetch_runs_started
  on public.affiliate_store_fetch_runs(started_at desc);

-- THE OVERLAP LOCK: at most ONE 'running' row can exist, database-enforced.
-- (The pipeline additionally recovers a stale lock: a running row older
-- than 2 hours is reaped to status='failed' with error_summary
-- 'stale-lock-recovered' before a new run claims the slot — a crashed
-- worker can never freeze the schedule permanently.)
create unique index if not exists uq_affiliate_store_fetch_runs_running
  on public.affiliate_store_fetch_runs(status) where status = 'running';

alter table public.affiliate_store_fetch_runs enable row level security;

drop policy if exists affiliate_store_fetch_runs_admin_all on public.affiliate_store_fetch_runs;
create policy affiliate_store_fetch_runs_admin_all
  on public.affiliate_store_fetch_runs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 4) affiliate_store_link_suggestions — the smart-linking proposals
-- ============================================================
create table if not exists public.affiliate_store_link_suggestions (
  id             uuid primary key default gen_random_uuid(),
  page_type      text not null check (page_type in ('blog','recipe','exercise','program','nutrition','tool','resource')),
  page_slug      text not null,
  product_id     uuid not null references public.affiliate_store_products(id) on delete cascade,
  relevance_score numeric(5,2) not null check (relevance_score between 0 and 100),
  reason         text not null default '',           -- the matched tokens (auditability)
  anchor_phrase  text,                               -- the natural EN phrase found in the page text
  status         text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  created_at     timestamptz not null default now(),
  decided_at     timestamptz,
  unique (page_type, page_slug, product_id)
);

create index if not exists idx_affiliate_store_link_suggestions_pending
  on public.affiliate_store_link_suggestions(created_at desc) where status = 'pending';

alter table public.affiliate_store_link_suggestions enable row level security;

-- Admin-only (suggestions are an internal editorial workflow).
drop policy if exists affiliate_store_link_suggestions_admin_all on public.affiliate_store_link_suggestions;
create policy affiliate_store_link_suggestions_admin_all
  on public.affiliate_store_link_suggestions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 5) affiliate_store_inline_links — the APPLIED in-content links
-- ============================================================
create table if not exists public.affiliate_store_inline_links (
  id           uuid primary key default gen_random_uuid(),
  page_type    text not null check (page_type in ('blog','recipe','exercise','program','nutrition','tool','resource')),
  page_slug    text not null,
  product_id   uuid not null references public.affiliate_store_products(id) on delete cascade,
  anchor_phrase text not null,                        -- re-matched against the page text at render
  is_active    boolean not null default true,         -- OFF when the product hides/unpublishes
  source       text not null default 'auto' check (source in ('auto','manual')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (page_type, page_slug, product_id)
);

create index if not exists idx_affiliate_store_inline_links_page
  on public.affiliate_store_inline_links(page_type, page_slug) where is_active;

alter table public.affiliate_store_inline_links enable row level security;

-- PUBLIC read: ACTIVE links of PUBLISHED, shelf-qualified products only
-- (the EN render path consumes this; RLS hides drafts + deactivated rows).
drop policy if exists affiliate_store_inline_links_public_read on public.affiliate_store_inline_links;
create policy affiliate_store_inline_links_public_read
  on public.affiliate_store_inline_links for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.affiliate_store_products p
      where p.id = affiliate_store_inline_links.product_id
        and p.is_published
        and p.image_url is not null
        and p.asin is not null
    )
  );

drop policy if exists affiliate_store_inline_links_admin_all on public.affiliate_store_inline_links;
create policy affiliate_store_inline_links_admin_all
  on public.affiliate_store_inline_links
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 6) affiliate_store_impression_events — daily-aggregated impressions
--    (the clicks twin: zero PII, product × surface × day counter rows)
-- ============================================================
create table if not exists public.affiliate_store_impression_events (
  id           bigint generated always as identity primary key,
  product_id   uuid not null references public.affiliate_store_products(id) on delete cascade,
  surface_type text not null check (surface_type in ('tool','equipment_hub','program','blog','collection','store','category','product')),
  surface_key  text not null default '',
  day          date not null default current_date,
  impressions  int  not null default 0,
  unique (product_id, surface_type, surface_key, day)
);

create index if not exists idx_affiliate_store_impression_events_day
  on public.affiliate_store_impression_events(day desc);

create index if not exists idx_affiliate_store_impression_events_product_day
  on public.affiliate_store_impression_events(product_id, day desc);

alter table public.affiliate_store_impression_events enable row level security;
-- Deliberately NO policies (deny-all): the beacon endpoint inserts via the
-- service-role key (the affiliate_store_click_events precedent), admin reads
-- the same way. Zero PII by design.

-- The atomic increment RPC (upsert +1..n on the daily aggregate row).
-- SECURITY DEFINER with a pinned search_path; executable by service_role
-- ONLY (revoked from anon/authenticated/public below).
create or replace function public.affiliate_store_track_impressions(
  p_product_id   uuid,
  p_surface_type text,
  p_surface_key  text,
  p_day          date,
  p_count        int default 1
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_count is null or p_count < 1 or p_count > 50 then
    return; -- a bad batch is dropped, never an error for a beacon
  end if;
  insert into public.affiliate_store_impression_events as e
    (product_id, surface_type, surface_key, day, impressions)
  values
    (p_product_id, p_surface_type, coalesce(p_surface_key, ''), coalesce(p_day, current_date), p_count)
  on conflict (product_id, surface_type, surface_key, day)
  do update set impressions = e.impressions + excluded.impressions;
end;
$$;

revoke execute on function public.affiliate_store_track_impressions(uuid, text, text, date, int) from anon, authenticated;
grant execute on function public.affiliate_store_track_impressions(uuid, text, text, date, int) to service_role;

-- ============================================================
-- 7) PostgREST schema reload (new tables/RPC visible to the API layer —
--    the NOTIFY form used by every migration in this chain)
-- ============================================================
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  -- local stacks without the pgrst listener: harmless no-op
  when others then null;
end $$;

-- Verification probe: scripts/db/migration_probes.py (0120 rows).
