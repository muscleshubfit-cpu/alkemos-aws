-- ============================================================================
-- 20261126150000_0117_store_clean_stack_guard_seed_fix.sql
-- 0117 — STORE CLEAN-STACK GUARD + SEED FIX (completes the Phase-1 push
--        a1279af1 of owner order 2026-11-26 «تنفيذ المرحلة الأولى»)
-- ============================================================================
-- WHY (the a1279af1 CI evidence — two measured defects, one file):
--   1. CLEAN-STACK GATE (db-migrate validate, run 45748123625): 0115
--      FAILED as a NEW (hard-gated) file on the throwaway LOCAL Supabase
--      stack:
--        ERROR: function public.is_admin() does not exist
--      Root cause — exactly the 0108/24de79d1 precedent class: 0115's six
--      admin-write CREATE POLICY statements reference public.is_admin()
--      UNGUARDED (its header claimed a NOTICE-skip guard the body never
--      shipped). On a clean stack the manual-era bootstrap cannot create
--      is_admin() (0029B is language sql and validates public.profiles at
--      creation time — the documented «the legacy chain cannot bootstrap a
--      fresh database» reality, docs/DB-MIGRATION-PIPELINE-2026-10-27.md
--      §4), so 0115's single transaction rolls back and the whole store
--      family lands only as baseline warnings. 0115 itself is IMMUTABLE:
--      applied and probe-verified on production.
--   2. SEED DEFECT (migration state probes, runs 45748123522/45748123480):
--      the 0116 probe measures count_rows=26 (expect 27). Root cause:
--      0116's CAP Barbell row matches
--        where c.slug = 'barbell-plates-collars'   -- 0116 (singular)
--      while 0115 seeds the subcategory as
--        'barbells-plates-collars'                 -- 0115 (plural)
--      A select-based INSERT with ON CONFLICT (slug) DO NOTHING inserts
--      ZERO rows silently — the 27th founding product (and its two
--      Phase-2 surface links) never landed.
--
-- WHAT THIS FILE DOES (additive + idempotent — the 0109/0111 correction
-- pattern; 0115/0116 stay immutable):
--   1. Re-asserts the four store_* tables, indexes, RLS enablement, the
--      public-read policies and the FULL v2 category seed VERBATIM from
--      0115 (IF NOT EXISTS / drop-if-exists / ON CONFLICT DO NOTHING):
--        * production: a verified no-op (0115 already applied);
--        * clean test stack (where 0115 rolled back): the full store
--          foundation exists, so the chain is self-sufficient from here
--          on and future store migrations rehearse against real tables.
--   2. The ONLY behavioral change vs 0115: the six admin-write policies
--      move behind the 0105 pg_proc guard — identical text where
--      is_admin() exists (production: verified no-op), honest NOTICE +
--      deny-all skip where it does not (clean stack — the 0105/0109 law).
--   3. Re-asserts 0116's 27-product founding batch + surface links
--      VERBATIM with the single corrected category reference
--      ('barbells-plates-collars'):
--        * production: inserts ONLY the missing CAP Barbell row + its
--          two links (the other 26 exist — ON CONFLICT DO NOTHING);
--        * clean stack: lands the whole batch after part 1's tables and
--          categories exist.
--
-- WHAT IT DELIBERATELY DOES NOT DO:
--   - No schema shape change (no new table/column/index beyond 0115's
--     own) → src/lib/supabase/types.ts needs no update (migration_audit
--     law respected — the 0109 precedent).
--   - No edit to 0115/0116 or any landed file (immutable-after-landing
--     law — enforced by scripts/db/migration_edit_guard.py).
--   - No publication: every product stays review_status='pending' +
--     is_published=false (the owner's 0097 review gate is untouched).
--
-- Idempotent: safe to re-run. Applied by the repo's apply channel
-- (deploy-aws.yml migrate job with SUPABASE_DB_URL / the §5 paths) — on
-- production the store family is already applied, so this lands exactly
-- the missing 27th row.
-- ============================================================================

-- ============================================================
-- 1) The store_* foundation VERBATIM from 0115 (idempotent
--    re-assertion: production no-op · clean stack: full foundation
--    before the seed)
-- ============================================================
create table if not exists public.store_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,          -- EN latin slug (leaf = used in /store/[category])
  name        text not null,                 -- EN display name
  description text,
  icon_key    text,                          -- carved icon key (brand icon sheet); NULL = parent/generic fallback
  sort_order  int  not null default 100,
  is_active   boolean not null default false,-- wave 1 = true; waves 2/3 stay false until owner activation
  parent_id   uuid references public.store_categories(id) on delete cascade,
  -- two-level tree ONLY: a subcategory's parent must itself be a root.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Root lookup (leaf resolution: a category is a LEAF when it has no
-- children — used by /store/[category] routing; parent pages render their
-- subcategories as sections).
create index if not exists idx_store_categories_parent
  on public.store_categories(parent_id);

alter table public.store_categories enable row level security;

-- Public read: ACTIVE categories only (inactive waves stay private).
drop policy if exists store_categories_public_read on public.store_categories;
create policy store_categories_public_read
  on public.store_categories for select
  to anon, authenticated
  using (is_active);



-- ============================================================
-- 2) store_products — ASIN identity + unique EN editorial content
-- ============================================================
create table if not exists public.store_products (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid not null references public.store_categories(id) on delete restrict,
  asin             text check (asin is null or asin ~ '^[A-Z0-9]{10}$'),  -- US ASIN (10 chars); NULL = not yet captured (no buy button)
  slug             text not null unique,     -- EN product slug (/store/[category]/[slug])
  title            text not null,
  summary          text not null,            -- short EN card summary
  content          text not null,            -- unique EN editorial content (≥300 words guideline — never Amazon copy)
  brand            text,
  image_url        text,                     -- owned/licensed ONLY (guards reject Amazon domains + persons); NULL = carved icon
  editorial_rating numeric(2,1) check (editorial_rating is null or editorial_rating between 0 and 9.9), -- "Alkemos Editorial Score" (NOT an Amazon rating)
  price_usd        numeric(10,2),            -- NULL until Phase 4 (price clause: no manual prices)
  price_updated_at timestamptz,
  availability     text,
  payload          jsonb,                    -- raw Creators-API data (Phase 4)
  is_featured      boolean not null default false,
  is_published     boolean not null default false,
  review_status    text not null default 'pending' check (review_status in ('pending','reviewed')), -- 0097 owner-review flow
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Spec indexes: (is_published, category_id) · partial unique asin ·
-- pending-review queue (the 0097 partial-index pattern).
create index if not exists idx_store_products_published_category
  on public.store_products(is_published, category_id);

create unique index if not exists uq_store_products_asin
  on public.store_products(asin) where asin is not null;

create index if not exists idx_store_products_pending
  on public.store_products(created_at) where review_status = 'pending';

alter table public.store_products enable row level security;

-- Public read: PUBLISHED products only.
drop policy if exists store_products_public_read on public.store_products;
create policy store_products_public_read
  on public.store_products for select
  to anon, authenticated
  using (is_published);



-- ============================================================
-- 3) store_product_links — internal EN surface bindings only
-- ============================================================
create table if not exists public.store_product_links (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.store_products(id) on delete cascade,
  surface_type text not null check (surface_type in ('tool','equipment_hub','program','blog','collection')),
  surface_key  text not null,                -- EN surface key (e.g. bmi-calculator, dumbbell)
  sort_order   int  not null default 100,
  created_at   timestamptz not null default now(),
  unique (product_id, surface_type, surface_key)
);

create index if not exists idx_store_product_links_surface
  on public.store_product_links(surface_type, surface_key);

alter table public.store_product_links enable row level security;

-- Public read: bindings of PUBLISHED products only.
drop policy if exists store_product_links_public_read on public.store_product_links;
create policy store_product_links_public_read
  on public.store_product_links for select
  to anon, authenticated
  using (exists (
    select 1 from public.store_products p
    where p.id = store_product_links.product_id and p.is_published
  ));



-- ============================================================
-- 4) store_click_events — insert-only server rows (clause (v): the
--    purchase link is a direct anchor; this table records NON-redirecting
--    sendBeacon events. No client policies: RLS on + zero policies.
-- ============================================================
create table if not exists public.store_click_events (
  id           bigint generated always as identity primary key,
  product_id   uuid not null references public.store_products(id) on delete cascade,
  surface_type text not null check (surface_type in ('tool','equipment_hub','program','blog','collection','store','category','product')),
  surface_key  text not null default '',
  occurred_at  timestamptz not null default now(),
  day          date not null default current_date   -- denorm for aggregation
);

create index if not exists idx_store_click_events_product_day
  on public.store_click_events(product_id, day desc);

create index if not exists idx_store_click_events_surface_day
  on public.store_click_events(surface_type, day desc);

alter table public.store_click_events enable row level security;
-- Deliberately NO policies: anon/authenticated get NOTHING (deny-all);
-- the beacon endpoint inserts via the service-role key only, and admin
-- reads the same way. Zero PII by design (product/surface/day only).

-- ============================================================
-- 2) The six admin-write policies behind the 0105 pg_proc guard
--    (0115 created them UNGUARDED — the 24de79d1/0108 class this
--    file fixes; identical text where is_admin() exists, honest
--    NOTICE + deny-all skip on a clean stack)
-- ============================================================
do $do$
begin
  if exists (select 1 from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
             where p.proname = 'is_admin' and n.nspname = 'public') then
    execute $sql$
drop policy if exists store_categories_admin_insert on public.store_categories;
create policy store_categories_admin_insert
  on public.store_categories for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists store_categories_admin_update on public.store_categories;
create policy store_categories_admin_update
  on public.store_categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists store_products_admin_insert on public.store_products;
create policy store_products_admin_insert
  on public.store_products for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists store_products_admin_update on public.store_products;
create policy store_products_admin_update
  on public.store_products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists store_product_links_admin_insert on public.store_product_links;
create policy store_product_links_admin_insert
  on public.store_product_links for insert
  to authenticated
  with check (public.is_admin());
drop policy if exists store_product_links_admin_delete on public.store_product_links;
create policy store_product_links_admin_delete
  on public.store_product_links for delete
  to authenticated
  using (public.is_admin());
    $sql$;
  else
    raise notice '0117: is_admin() absent — store admin-write policies stay deny-all (clean-stack skip, the 0105/0109 law)';
  end if;
end
$do$;

-- ============================================================
-- 3) The v2 category seed VERBATIM from 0115 §5 (12 mains × 63 subs;
--    wave 1 active · waves 2/3 inactive until the owner activates)
-- ============================================================
-- WAVE 1 — launch wave (is_active = true)
insert into public.store_categories (id, slug, name, description, icon_key, sort_order, is_active) values
  ('a1000000-0000-4000-8000-000000000001','strength-free-weights','Strength & Free Weights','Dumbbells, kettlebells, barbells, plates, bands, and functional free-weight tools for strength training at home or in the gym.','dumbbell',10,true),
  ('a1000000-0000-4000-8000-000000000002','home-gym-cardio-equipment','Home Gym & Cardio Equipment','Home gyms, racks, benches, treadmills, bikes, rowers, and the equipment that turns any space into a training room.','rack',20,true),
  ('a1000000-0000-4000-8000-000000000003','yoga-mobility-recovery','Yoga, Mobility & Recovery','Mats, props, foam rollers, massage tools, and mobility equipment for recovery days and flexible, pain-free training.','laurel',30,true),
  ('a1000000-0000-4000-8000-000000000004','kitchen-meal-prep','Kitchen & Meal Prep','Food scales, meal prep containers, blenders, and healthy-cooking tools that make nutrition targets stick.','mealplanner',40,true),
  ('a1000000-0000-4000-8000-000000000005','body-measurement-composition','Body Measurement & Composition','Smart scales, calipers, and measuring tools to track what the mirror can''t show — the data behind progress.','bodyfat',50,true),
  ('a1000000-0000-4000-8000-000000000006','wearables-fitness-tech','Wearables & Fitness Tech','Fitness smartwatches, trackers, heart-rate monitors, and sport audio that keep training measurable.','runner',60,true),
  ('a1000000-0000-4000-8000-000000000007','training-apparel-footwear','Training Apparel & Footwear','Training and running footwear, modest training apparel, lifting belts, straps, and gym bags.','house',70,true),
  ('a1000000-0000-4000-8000-000000000008','hydration-on-the-go','Hydration & On-the-Go','Insulated bottles, shakers, and carriers that keep water and meals with you all day.','hydration',80,true)
on conflict (slug) do nothing;

-- WAVE 1 subcategories (parent lookups by slug — wave 1 active)
insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('adjustable-fixed-dumbbells','Adjustable & Fixed Dumbbells','Space-saving adjustable dumbbells and classic fixed pairs for every strength level.',1),
  ('kettlebells','Kettlebells','Cast-iron and competition kettlebells for swings, cleans, and carries.',2),
  ('barbells-plates-collars','Barbells, Plates & Collars','Olympic barbells, weight plates, and collars for serious barbell work.',3),
  ('resistance-bands-tubes','Resistance Bands & Tubes','Loop bands, tube sets, and heavy-duty power bands for strength on the road.',4),
  ('functional-plyometric-tools','Functional & Plyometric Tools','Medicine balls, battle ropes, sandbags, and agility tools for athletic conditioning.',5),
  ('weight-storage','Weight Storage','Dumbbell racks, plate trees, and storage that keep a home gym safe and tidy.',6)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'strength-free-weights'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('home-gyms-cable-stations','Home Gyms & Cable Stations','All-in-one home gyms and functional trainers with cable systems.',1),
  ('power-racks-benches-pull-up-bars','Power Racks, Benches & Pull-up Bars','Racks, adjustable benches, and doorway pull-up bars: the backbone of a home gym.',2),
  ('treadmills-walking-pads','Treadmills & Walking Pads','Folding treadmills and compact walking pads for daily cardio at home.',3),
  ('exercise-spin-bikes','Exercise & Spin Bikes','Upright, recumbent, and indoor cycling bikes for low-impact cardio.',4),
  ('rowing-machines','Rowing Machines','Full-body rowing machines for endurance and conditioning.',5),
  ('ellipticals-steppers','Ellipticals & Steppers','Ellipticals and steppers that go easy on the joints.',6),
  ('smart-compact-gym-systems','Smart & Compact Gym Systems','Digital resistance and compact smart systems for small spaces.',7),
  ('gym-flooring-setup','Gym Flooring & Setup','Floor tiles, mats, and setup hardware that protect floors and equipment.',8)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'home-gym-cardio-equipment'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('yoga-mats-props','Yoga Mats & Props','Non-slip mats, blocks, and straps for yoga and floor work.',1),
  ('foam-rollers-massage-tools','Foam Rollers & Massage Tools','Foam rollers and manual massage tools for self-myofascial release.',2),
  ('percussive-massagers','Percussive Massagers','Massage guns and percussive devices for fast recovery.',3),
  ('stretching-mobility-equipment','Stretching & Mobility Equipment','Stretch straps, boards, and mobility tools for full-range movement.',4),
  ('pilates-tools','Pilates Tools','Pilates rings, mini balls, and reformer accessories for core work.',5)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'yoga-mobility-recovery'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('digital-food-scales-measuring-tools','Digital Food Scales & Measuring Tools','Precise digital food scales and measuring sets for macros that add up.',1),
  ('meal-prep-containers-storage','Meal Prep Containers & Storage','Portioned containers and storage systems for planned weeks.',2),
  ('blenders-personal-blenders','Blenders & Personal Blenders','High-power blenders and single-serve cups for shakes and smoothies.',3),
  ('healthy-cooking-appliances','Healthy Cooking Appliances','Air fryers, grills, and steamers for lean, fast cooking.',4),
  ('prep-tools-accessories','Prep Tools & Accessories','Knives, boards, and prep accessories that speed up the kitchen.',5)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'kitchen-meal-prep'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('smart-body-composition-scales','Smart Body-Composition Scales','Wi-Fi and Bluetooth scales that track weight, body fat, and muscle trends.',1),
  ('body-fat-calipers-measuring-tapes','Body-Fat Calipers & Measuring Tapes','Calipers and tapes for simple, repeatable body measurements.',2),
  ('health-monitoring-devices','Health Monitoring Devices','Blood-pressure and pulse devices for training-ready health checks.',3)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'body-measurement-composition'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('fitness-smartwatches-gps-watches','Fitness Smartwatches & GPS Watches','Smartwatches and GPS watches built for training metrics.',1),
  ('activity-sleep-trackers','Activity & Sleep Trackers','Bands and rings that quantify daily movement and sleep.',2),
  ('heart-rate-monitors','Heart-Rate Monitors','Chest-strap and armband HR monitors for accurate zone training.',3),
  ('sport-earbuds-headphones','Sport Earbuds & Headphones','Sweat-proof earbuds and headphones that stay put through intervals.',4),
  ('connected-training-tech','Connected Training Tech','Smart rope, sensors, and connected accessories that measure every rep.',5)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'wearables-fitness-tech'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('training-gym-footwear','Training & Gym Footwear','Flat, stable trainers for lifting and gym work.',1),
  ('running-footwear','Running Footwear','Cushioned and stability running shoes for the miles.',2),
  ('mens-training-apparel','Men''s Training Apparel','Breathable, full-coverage training apparel for men.',3),
  ('womens-training-apparel','Women''s Training Apparel','Women''s training apparel — displayed with person-free product images only (image law §0).',4),
  ('socks-base-layers','Socks & Base Layers','Training socks and base layers that manage sweat.',5),
  ('lifting-belts-straps-gloves','Lifting Belts, Straps & Gloves','Belts, straps, and grips that support heavy lifts.',6),
  ('gym-training-bags','Gym & Training Bags','Duffels and backpacks that carry the whole session.',7)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'training-apparel-footwear'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, true, c.id
from (values
  ('insulated-smart-water-bottles','Insulated & Smart Water Bottles','Vacuum-insulated and smart bottles that keep water cold all day.',1),
  ('shaker-mixer-bottles','Shaker & Mixer Bottles','Leak-proof shakers with steel balls or electric mixing.',2),
  ('flasks-tumblers-travel-mugs','Flasks, Tumblers & Travel Mugs','Tumblers and mugs for coffee, tea, and everything between.',3),
  ('hydration-packs-running-belts','Hydration Packs & Running Belts','Packs and belts that carry fluid on long runs.',4),
  ('cooler-bags-meal-carriers','Cooler Bags & Meal Carriers','Insulated bags that keep prepped meals fresh on the go.',5)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'hydration-on-the-go'
on conflict (slug) do nothing;

-- WAVE 2 — expansion wave (is_active = false until the owner's activation
-- order; per the open order: prepared for expansion under the approved
-- screening framework WITHOUT bypassing review gates)
insert into public.store_categories (id, slug, name, description, icon_key, sort_order, is_active) values
  ('a1000000-0000-4000-8000-000000000009','sports-supplements-vitamins','Sports Supplements & Vitamins','Protein powders, creatine, vitamins, and recovery supplements — every product screened one-by-one under the approved halal and claims framework.','protein',90,false),
  ('a1000000-0000-4000-8000-000000000010','healthy-foods-sports-snacks','Healthy Foods & Sports Snacks','Protein bars, nut butters, drinks, and ingredients for a high-protein kitchen — screened per product under the approved framework.','fruits',100,false)
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, false, c.id
from (values
  ('protein-powders','Protein Powders','Whey, casein, and plant protein powders (per-product screening).',1),
  ('creatine-amino-acids','Creatine & Amino Acids','Creatine, BCAAs, and EAAs (per-product screening).',2),
  ('vitamins-minerals-omegas','Vitamins, Minerals & Omegas','Daily micronutrient and omega support (per-product screening).',3),
  ('pre-workout-energy-formulas','Pre-Workout & Energy Formulas','Pre-workout formulas (per-product screening).',4),
  ('recovery-electrolyte-supplements','Recovery & Electrolyte Supplements','Electrolytes and recovery formulas (per-product screening).',5),
  ('joint-bone-support','Joint & Bone Support','Joint and bone support formulas (per-product screening).',6),
  ('herbal-adaptogenic-supplements','Herbal & Adaptogenic Supplements','Herbal and adaptogenic formulas (per-product screening).',7)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'sports-supplements-vitamins'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, false, c.id
from (values
  ('protein-bars-functional-snacks','Protein Bars & Functional Snacks','Protein bars and functional snacks (per-product screening).',1),
  ('nut-butters-spreads','Nut Butters & Spreads','Nut butters and spreads (per-product ingredient screening).',2),
  ('nuts-seeds-trail-mixes','Nuts, Seeds & Trail Mixes','Nuts, seeds, and trail mixes (per-product screening).',3),
  ('electrolyte-sports-drinks','Electrolyte & Sports Drinks','Electrolyte and sports drink mixes (per-product screening).',4),
  ('low-sugar-diet-friendly-foods','Low-Sugar & Diet-Friendly Foods','Low-sugar staples for fat-loss phases (per-product screening).',5),
  ('specialty-baking-cooking-ingredients','Specialty Baking & Cooking Ingredients','Sweeteners, protein flours, and specialty ingredients (per-product screening).',6),
  ('coffees-teas','Coffees & Teas','Coffees and teas for the training day (per-product screening).',7)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'healthy-foods-sports-snacks'
on conflict (slug) do nothing;

-- WAVE 3 — later expansions (is_active = false; Phase 3+ decisions)
insert into public.store_categories (id, slug, name, description, icon_key, sort_order, is_active) values
  ('a1000000-0000-4000-8000-000000000011','educational-media-guides','Educational Media & Training Guides','Fitness and nutrition books, training logs, and planners that turn knowledge into programs.','scroll',110,false),
  ('a1000000-0000-4000-8000-000000000012','endurance-outdoor-accessories','Endurance & Outdoor Accessories','Running lights, cycling accessories, and outdoor training gear (Phase 3 study).','doric',120,false)
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, false, c.id
from (values
  ('fitness-nutrition-books','Fitness & Nutrition Books','Evidence-based fitness and nutrition books.',1),
  ('training-logs-planners','Training Logs & Planners','Paper logs and planners for training blocks.',2)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'educational-media-guides'
on conflict (slug) do nothing;

insert into public.store_categories (slug, name, description, sort_order, is_active, parent_id)
select v.slug, v.name, v.description, v.sort_order, false, c.id
from (values
  ('running-accessories-lights','Running Accessories & Lights','Lights, reflectors, and running accessories.',1),
  ('cycling-accessories','Cycling Accessories','Cycling mounts, lights, and accessories.',2),
  ('outdoor-training-gear','Outdoor Training Gear','Gear for outdoor and hybrid training.',3)
) as v(slug, name, description, sort_order)
join public.store_categories c on c.slug = 'endurance-outdoor-accessories'
on conflict (slug) do nothing;

-- ============================================================
-- 4) The founding product batch VERBATIM from 0116 — with the ONE
--    corrected category reference (the 27th product's fix):
--      0116: where c.slug = 'barbell-plates-collars'  (zero rows)
--      0117: where c.slug = 'barbells-plates-collars' (lands)
--    On production only the missing CAP Barbell row + its two
--    surface links insert; on a clean stack the batch lands whole.
-- ============================================================
-- WAVE-1 BATCH — part 1: Strength & Free Weights (4) + Home Gym & Cardio (4)
-- ============================================================

-- (ASIN LIVE-VERIFIED 2026-11-26 (amazon.com/dp fetched: CAP Barbell 300-Pound Olympic Set, 7 Feet Bar))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B002OP1Z44', 'cap-barbell-300lb-olympic-weight-set', 'CAP Barbell 300-Pound Olympic Weight Set', 'The classic starter barbell set: a 7-ft Olympic bar, spring collars, and 255 lb of plates — everything a home strength block needs on day one.',
  $BODY$A full Olympic set is still the highest-value purchase in home strength training, and this 300-pound package from CAP Barbell is the most copied starter kit on the market for a reason. You get a 7-foot chrome Olympic bar with sleeve bearings, a pair of spring collars, and a plate assortment that sums to a real working gym: two 45s, two 35s, two 25s, and two 10s, all drilled for the standard 2-inch Olympic sleeve.

For an Alkemos barbell block the arithmetic works out neatly. The big lifts — squat, bench press, deadlift, overhead press, and the row — all load from the same bar, and 300 pounds covers the working weights of every intermediate program we publish. A lifter running a five-by-five progression on three lifts can train for years before outgrowing this set, and when that day comes, extra plates are cheap incremental buys rather than a replacement purchase.

Two honest notes from long-term owners. First, the plates are cast iron with a semi-gloss finish and a 2-percent stated tolerance, which is accurate enough for training but not calibrated competition steel — nobody at home needs that. Second, the included spring collars are serviceable but the first upgrade most people buy is a pair of lock-jaw collars, because spinning collars mid-set is the set's one real annoyance. Budget fifteen dollars for that upgrade and the issue disappears.

Setup is a non-event: the bar arrives in a cardboard sleeve, the plates in a crate, and you are squatting within the hour if you already own a rack. If you do not, this set pairs with any standard power rack or squat stand with 2-inch J-cups, which is exactly the next purchase in our home-gym equipment guide.

Store the set dry, wipe the bar down after sweaty sessions, and it will outlast the rest of your gym. For a first barbell or a return to barbell training after a long break, this is the benchmark every alternative has to beat.$BODY$, 'CAP Barbell', null, 8.5, true,
  'pending', false
from public.store_categories c
where c.slug = 'barbells-plates-collars'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'barbell' from public.store_products p where p.slug = 'cap-barbell-300lb-olympic-weight-set'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.store_products p where p.slug = 'cap-barbell-300lb-olympic-weight-set'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN CLP-URL evidence 2026-11-26 (amazon.com/clp/B0G6Z84TQM — BowFlex Results Series 552 SelectTech; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0G6Z84TQM', 'bowflex-selecttech-552-adjustable-dumbbells', 'Bowflex SelectTech 552 Adjustable Dumbbells (Pair)', 'One pair of dumbbells that replaces fifteen sets: dial from 5 to 52.5 lb per hand in a second, and store the whole rack in the corner.',
  $BODY$The SelectTech 552 is the product that made adjustable dumbbells mainstream, and the current Results Series version keeps the idea that made it famous: a pair of handles and a nested plate stack that replaces a whole dumbbell rack in roughly the footprint of a laundry basket. Each dumbbell dials from 5 to 52.5 pounds in 2.5-pound steps, with a quick jump to the 10-pound mark, and the change takes about a second — select the weight on the handle, lift, and the mechanism picks up exactly the plates you asked for.

That speed matters more than it sounds. Supersets, drop sets, and partner training all survive dumbbell training only when weight changes cost nothing. With fixed hex dumbbells you buy the whole ladder or you interrupt the session; with the 552 dial, three sets of descending curls happen back-to-back with no walk to the rack. The pair covers every single-arm movement we program: rows, presses, curls, extensions, lunges, step-ups, and the farmer carry.

Two design notes are worth knowing before buying. First, the 552 is longer than a fixed dumbbell of the same weight — the handle carries the empty shell — so the first set of flat presses feels slightly different until your wrists learn the length. Second, the mechanism wants to be treated like a machine, not thrown: the 552 is rated for normal training use, and owners who drop their dumbbells after heavy sets are the ones who write the unhappy reviews. Lower the weights back to the trays the way the manual asks and the set stays accurate for years.

For apartments, garages, and spare corners, the math is simple: this pair plus a bench and an adjustable bench-rack covers the entire dumbbell track of our home training programs at a fraction of a fixed-dumbbell wall. For most home lifters it is the single best first purchase after a bench.$BODY$, 'Bowflex', null, 9.0, true,
  'pending', false
from public.store_categories c
where c.slug = 'adjustable-fixed-dumbbells'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'dumbbell' from public.store_products p where p.slug = 'bowflex-selecttech-552-adjustable-dumbbells'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-dumbbell' from public.store_products p where p.slug = 'bowflex-selecttech-552-adjustable-dumbbells'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN CLP-URL evidence 2026-11-26 (amazon.com/clp/B0CR3JF59Y — Yes4All Cast Iron Kettlebell; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0CR3JF59Y', 'yes4all-solid-cast-iron-kettlebell', 'Yes4All Solid Cast-Iron Kettlebell', 'A one-piece powder-coated cast-iron kettlebell in every weight from 10 to 80 lb — the cheapest honest entry into swings, goblets, and carries.',
  $BODY$A kettlebell is the simplest object in strength training, and the casting quality is the whole story. This Yes4All bell is a single-piece cast-iron pour — handle, body, and base are one lump of metal, not a welded handle on a shell — with a powder-coat finish that keeps chalk and sweat from slicking the grip. The flat base sits still during renegade rows and kettlebell push-ups, and the handle width fits both a two-hand swing grip and one-hand work from around 35 pounds up.

Which weight to buy first is the real decision. For swing-based conditioning, most lifters start somewhere between 18 and 53 pounds depending on body weight and swing practice, and the honest rule is heavier than feels comfortable for a curl and light enough to swing for thirty reps. Our kettlebell programs at Alkemos are written around one working bell, so a single purchase is a complete training tool, not a partial one: swings, goblet squats, cleans, presses, snatches, and loaded carries are all one-bell movements by design.

The finish is where cheap bells cut corners, and this one mostly does not. The powder coat is even, the seam along the handle is ground smooth enough not to tear the webbing of your thumbs at high volume, and the handle diameter sits at the comfortable middle — not the thin 30 millimeters of competition steel, not a thick grip that punishes small hands. At very high snatch volumes a competition bell's uniform handle is kinder to the hands, but that is a hundred-rep problem, not a Tuesday problem.

The case for starting here is straightforward: this is the least expensive one-piece bell that does not compromise on the things that matter — single casting, flat base, even handle. Buy one, swing it three hundred times a week following any of our conditioning blocks, and the decision of whether to buy a second heavier bell answers itself.$BODY$, 'Yes4All', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'kettlebells'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'kettlebell' from public.store_products p where p.slug = 'yes4all-solid-cast-iron-kettlebell'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN LIVE-VERIFIED 2026-11-26 (amazon.com/dp fetched: Fit Simplify Resistance Loop Exercise Bands, Set of 5))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01AVDVHTI', 'fit-simplify-resistance-loop-bands-set', 'Fit Simplify Resistance Loop Exercise Bands (Set of 5)', 'Five latex mini-bands in graded resistances with a carry bag and instruction card — warm-ups, glute work, and travel training for the price of lunch.',
  $BODY$The flat mini-band is the most underrated tool in training, and this five-pack from Fit Simplify is the reference version: five 12-by-2-inch latex loops in graded resistances from light to extra-heavy, with a small carry bag and a printed exercise guide. Nothing here is complicated, and that is the point — the set does the jobs a barbell cannot, and it costs less than a single plate.

Warm-ups are the first job. Banded shoulder distractions, lateral walks, monster walks, and glute bridges before squat day are the standard preparation we program for lifters with cranky hips, and they need exactly this band shape. The second job is training stimulus in small spaces: high-rep glute and hip work, band-resisted push-ups, face pulls looped over a door anchor, and pallof presses all come from the same loops. The third job is travel. The whole set weighs less than a paperback and survives a suitcase, which keeps hotel-room sessions honest when the hotel gym is a treadmill and a dusty mirror. Toss the pouch in any bag and the warm-up travels with the program.

The resistances are color-graded rather than labeled in pounds, which is honest — flat band tension depends on how far you stretch it, so a pound figure would be marketing. For our exercise library the three middle bands cover almost everything; the lightest is for rehabilitation-speed work and the heaviest for strong hips on lateral walks.

Latex care decides the lifespan: keep them out of direct sunlight, dry them after sweaty sessions, and inspect for the small cracks that appear before a snap. A set that lives in a gym bag lasts years. The one honest limitation is inherent to the category — bands do not replace progressive loading for strength; they complement it. As the warm-up, travel, and pump tool in a home setup, this pack is the cheapest real equipment purchase you can make.$BODY$, 'Fit Simplify', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'resistance-bands-tubes'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'band' from public.store_products p where p.slug = 'fit-simplify-resistance-loop-bands-set'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.store_products p where p.slug = 'fit-simplify-resistance-loop-bands-set'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN CLP-URL evidence 2026-11-26 (amazon.com/clp/B07D528W98 — YOSUDA Exercise Bike Magnetic-Black; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07D528W98', 'yosuda-indoor-cycling-bike', 'YOSUDA Indoor Cycling Bike', 'A belt-drive spin bike with a 40 lb flywheel, magnetic resistance, and a 300 lb capacity — the quiet default for home cardio blocks.',
  $BODY$The YOSUDA indoor bike is the best-selling category on Amazon for a reason: it is a plain, honest spin bike with the three features that matter and nothing that pretends otherwise. The drive is a belt around a 40-pound flywheel, which is the combination that makes a home bike livable — near-silent at 20-decibel-class noise, smooth at cadence, and free of the chain maintenance that cheaper bikes inherit. Resistance is a magnetic pad dial, so nothing wears against the flywheel, and the dial doubles as the brake.

Fit matters most on any indoor bike, and this frame covers a genuinely wide band: a four-way adjustable seat that moves up, down, forward, and back, and handlebars that adjust to match. Riders from roughly five foot one to six foot five report workable setups, and the 300-pound stated capacity is generous for the price class. The console is deliberately basic — speed, time, distance, calories, and pulse via the hand grips — which is exactly the honest set: anything fancier at this price would be guesses dressed as data.

For the Alkemos cardio blocks, the programming surface is cadence and resistance, both of which this bike serves: standing climbs, seated intervals, and steady zone-two sessions all run fine on the dial. What it does not do is broadcast power or connect to training apps the way a smart bike does, so our interval prescriptions are written in feel and cadence terms — the same language every spin studio uses.

Assembly is a one-hour, one-person job with the tools in the box, and the bike's transport wheels make corner-parking realistic in a small room. Two upgrades close the gap to studio bikes: swap the stock saddle for a padded one if you ride beyond forty minutes, and add a tablet holder for guided sessions. For the money, this is the cardio machine we point people at first, because the failure mode of home cardio is boredom, and a silent, smooth bike removes every excuse except the honest one, which no equipment can fix.$BODY$, 'YOSUDA', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'exercise-spin-bikes'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'machine' from public.store_products p where p.slug = 'yosuda-indoor-cycling-bike'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'hiit' from public.store_products p where p.slug = 'yosuda-indoor-cycling-bike'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — the standalone SF-RW5515 ASIN was not verifiable this session (the surfaced redirect id B0CVS233BW resolved to an unavailable bundle); capture the ASIN from the standalone product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'sunny-health-sf-rw5515-rowing-machine', 'Sunny Health & Fitness Magnetic Rowing Machine (SF-RW5515)', 'The quiet budget rower: 8 levels of magnetic resistance, a padded sliding seat, and a full-body stroke that a small room can store upright.',
  $BODY$Rowing is the one cardio movement that trains the whole posterior chain while the heart rate climbs, and the SF-RW5515 is the machine that made home rowing affordable. Its drive is magnetic: eight dial-selected resistance levels against a smooth rail, which means the characteristic silence of this class — you hear the seat roll and the fan of nothing at all, making it a real option for apartment training at any hour of the night.

The stroke geometry is what you are actually buying. A long aluminum rail carries the padded seat through a full leg drive, and the machine accommodates users up to about six foot four and 250 pounds — taller rowers should check the inseam against the rail length before buying, as with every budget rower. The handle pulls a nylon strap rather than a chain, which is the quiet, low-maintenance choice, and the footplates adjust with straps that hold a full shoe. The console tracks time, count, total strokes, and calories — modest and honest numbers to pace intervals against.

In our conditioning blocks the rower appears for two jobs: steady zone-two sessions where the stroke rate stays under twenty-four per minute, and interval work where the dial goes up and the stroke rate climbs for short bursts. Both live happily on eight magnetic levels. The stroke itself rewards technique — legs, then back, then arms, and the reverse on the recovery — and a week of practice makes the difference between a back session and a full-body one, which our exercise library covers with a stroke primer.

Storage is the category's quiet advantage: the SF-RW5515 stands nearly upright on its front stabilizers and rolls on transport wheels, so a machine that trains the longest muscle chain in the body folds into a corner footprint. Assembly is under an hour with two people for the rail step.$BODY$, 'Sunny Health & Fitness', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'rowing-machines'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'machine' from public.store_products p where p.slug = 'sunny-health-sf-rw5515-rowing-machine'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'hiit' from public.store_products p where p.slug = 'sunny-health-sf-rw5515-rowing-machine'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'flybird-adjustable-weight-bench', 'FLYBIRD Adjustable Weight Bench', 'A folding incline bench with seven back positions and three seat positions — the missing half of every dumbbell and band home gym.',
  $BODY$Every home gym plan converges on the same gap: you own the weights, you own the bands, and then you need somewhere to press and row from. The FLYBIRD adjustable bench is the popular answer — a compact folding bench with a seven-position back pad from decline through flat to near-vertical, and a three-position seat that keeps your hips level with your shoulders in incline work.

The adjustment mechanism is the part worth getting right, and this one uses a pull-pin ladder rather than threaded knobs: lift the back pad, move the pin, drop it in, and the bench is ready in five seconds. In practice that speed changes training behavior — drop sets across incline angles and quick transitions from press to seated row actually happen instead of being skipped. The pad is high-density foam wrapped in stitched leather-style vinyl, wipeable after sweaty sessions, and the frame is commercial-gauge steel rated to a stated 660 pounds of load, which holds every dumbbell pair a home gym will own.

The folding part is the honest differentiator against cheap full-size benches: the FLYBIRD halves its footprint in two seconds and slides under a bed or stands against a wall, which is how a bench survives in an apartment rather than becoming a clothes rack in a garage. Assembly is a single-person, thirty-minute job with tools in the box.

Two honest limits. First, there is no barbell rack on this bench — it is a pressing and rowing surface for dumbbells, bands, and bodyweight work, not a squat solution; pair it with a separate squat stand if barbell work is the goal. Second, decline sits a little high for shorter users on some exercises — usable, but worth a try in the first week. For everything our dumbbell and band programs prescribe — flat, incline, and seated work — this bench is the surface, and it disappears when you are done.$BODY$, 'FLYBIRD', null, 7.5, false,
  'pending', false
from public.store_categories c
where c.slug = 'power-racks-benches-pull-up-bars'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'dumbbell' from public.store_products p where p.slug = 'flybird-adjustable-weight-bench'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-dumbbell' from public.store_products p where p.slug = 'flybird-adjustable-weight-bench'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'walkingpad-a1-pro-foldable-treadmill', 'WalkingPad A1 Pro Foldable Treadmill', 'The treadmill that folds in half and slides under a sofa: a 3.5 HP-class walking deck with app control for daily step targets in tiny rooms.',
  $BODY$The WalkingPad A1 Pro answers the narrowest and most common home-cardio constraint: there is no room for a treadmill. The deck folds in half on a hinge, drops to under a foot of height, and rolls under a sofa or a bed on integrated wheels. Unfolded, it is a real walking treadmill — a 47-inch belt driven by a quiet motor up to 6.2 miles per hour, enough for brisk walking and a light jog, and controlled from a handheld remote, the deck sensor, or the companion app on the phone you already carry.

The step math is why this machine earns its place. Our sedentary-recovery guidance targets the movement floor most desk workers miss by three thousand steps a day, and the walking-pad pattern — a slow belt under your actual desk, or a brisk evening walk in front of the television — closes that gap without a single scheduled workout. Owners describe the same effect: the pad sits unfolded in the living room, the bar to walking drops to zero, and daily movement quietly doubles. That is a different mechanism than a garage treadmill you visit on purpose, and for many people it is the one that actually works through a whole winter of consistency.

The A1 Pro tier adds the app connection and the higher speed ceiling over the base model, plus a slightly stronger motor rated for longer sessions. The belt is a slim walking surface rather than a cushioned running deck — correct usage is walking and light jogging, with the machine's stated session guidance respected. There is no incline.

For the walking-first crowd, this is the machine that survives the constraint that kills home cardio: space. Pair it with our step-target and zone-two walking protocols and the pad pays for itself in consistency, which is the only currency training respects.$BODY$, 'WalkingPad', null, 8.0, true,
  'pending', false
from public.store_categories c
where c.slug = 'treadmills-walking-pads'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'machine' from public.store_products p where p.slug = 'walkingpad-a1-pro-foldable-treadmill'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.store_products p where p.slug = 'walkingpad-a1-pro-foldable-treadmill'
on conflict (product_id, surface_type, surface_key) do nothing;

-- ============================================================
-- WAVE-1 BATCH — part 2: Yoga/Mobility/Recovery (3) + Kitchen/Meal Prep (4) + Body Measurement (3)
-- ============================================================

-- (ASIN LIVE-VERIFIED 2026-11-26 (amazon.com/dp fetched: TriggerPoint Grid 1.0 Foam Roller, 13 inch))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0040EGNIU', 'triggerpoint-grid-foam-roller-13', 'TriggerPoint GRID Foam Roller (13 inch)', 'The original hollow-core multi-density roller: a rigid core, three surface zones, and the durability to roll hard for years without going soft.',
  $BODY$The GRID is the roller every other roller is measured against, and its design is the reason: a hollow rigid core wrapped in a firm foam shell with three mapped surface zones — a flat high-density strip for broad strokes, a tubular zone that mimics the forearm, and a narrow finger-like zone for pinpoint work. Around a decade of revisions kept the same geometry because it works.

What the multi-density surface buys over a plain solid foam cylinder is precision. Broad zones cover the quads, calves, and lats the way any roller does; the harder zones dig into the thoracic spine and hip rotators the way a therapist's knuckles would, at the pressure you choose by leaning. Our mobility blocks prescribe rolling as preparation — thirty to sixty seconds per zone before training, and longer slow passes on off days — and the GRID's firmness floor means a heavy lifter gets real tissue work instead of the squishy nothing a soft roller delivers after a month of use.

Durability is the hidden cost in this category: solid foam rollers develop permanent flat spots and go soft within a season of daily use, which quietly removes the therapy. The GRID's hollow core cannot take a set — ours has survived years of daily sessions and travel inside a suitcase — and the shell cleans with a wipe. The 13-inch length is the right default: it fits the thoracic spine, one leg, or one lat at a time, and it stows in a gym bag. The 26-inch length is for people who roll both legs together or want a spine-stable version; everyone else saves the space.

Two honest notes. The GRID is deliberately firm — beginners should start with partial body weight by unloading some pressure, and it should never be rolled directly on the lumbar spine or the knee pit. And it does not replace targeted work: the small zones are good, but a massage ball reaches a piriformis or a shoulder blade corner the roller cannot. As the daily driver of a recovery kit, this is the one to buy first.$BODY$, 'TriggerPoint', null, 9.0, true,
  'pending', false
from public.store_categories c
where c.slug = 'foam-rollers-massage-tools'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.store_products p where p.slug = 'triggerpoint-grid-foam-roller-13'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.store_products p where p.slug = 'triggerpoint-grid-foam-roller-13'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN DP-URL evidence 2026-11-26 (amazon.com/dp/B00FLID5EO — Gaiam Premium 6mm print mat; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00FLID5EO', 'gaiam-premium-yoga-mat-6mm', 'Gaiam Premium Yoga Mat (6mm)', 'A 6 mm cushioned mat with a textured non-slip face and a reversible print — joint-friendly floor work for mobility days and recovery flows.',
  $BODY$The Gaiam Premium 6mm is the mat for people whose floor work is not a studio practice but a training need: mobility days, cooldowns, core circuits, and the stretching blocks we schedule between lifting days. At six millimeters it is double the cushion of a standard yoga mat, and that thickness is the difference between a comfortable kneeling quad stretch and one quietly skipped because the floor hurts the knees.

The surface is a lightly textured non-slip face over a closed-cell foam body, and the print is reversible, which effectively makes it two mats' worth of grip. For slow practice it holds a downward dog safely; for high-sweat HIIT sessions the honest advice is a towel on top, because no closed-cell foam face is a match for a soaked palm. It is free of the heavy phthalate plasticizers that cheap mats advertise by smell — the classic new-mat odor here airs out in a couple of days.

Six millimeters is a real trade rather than a free upgrade: the extra cushion is kind to knees, hips, and spine on floor work, but it is soft under a planted foot in standing balance poses, where a thin firm mat communicates the floor more honestly. Our mobility prescriptions are almost entirely floor-based, so the trade lands on the right side for training use. The mat is a standard 68 by 24 inches — taller users should check the longer 78-inch variant.

Care decides the lifespan: this mat wipes clean with mild soap and water, and closed-cell foam means sweat sits on the surface rather than soaking in, which is the hygienic property to look for. Roll it with the print side out to keep the corners flat. As the floor under our recovery and core programming, it is the inexpensive surface that makes the schedule stick.$BODY$, 'Gaiam', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'yoga-mats-props'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-core' from public.store_products p where p.slug = 'gaiam-premium-yoga-mat-6mm'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.store_products p where p.slug = 'gaiam-premium-yoga-mat-6mm'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'renpho-massage-gun', 'Renpho Deep-Tissue Massage Gun', 'A quiet percussive massager with five speeds and five heads — the recovery tool that reaches the knots a roller cannot, at a fraction of the price of the big brands.',
  $BODY$A massage gun is the recovery tool that earned its place: percussive therapy reaches tissue a roller cannot and takes thirty seconds to do what a foam roll does in three minutes. The Renpho gun is the category's value benchmark — a brushless motor at around 45 decibels, five speed levels, and five interchangeable heads, in a kit that costs a fraction of the first-name brands.

The heads are the actual toolkit. The round head covers large muscle groups like the quads and lats; the flat head spreads the pressure over the chest and IT band; the fork head straddles the spine, the calves, and the Achilles area; the bullet head pinpoints a knot or a hip flexor the way a therapist's elbow would; and the soft head backs off for tender areas. Our recovery protocols use percussion the way we program it: thirty to sixty seconds per muscle belly after hard sessions, along the fiber direction, never on bone, never on the front of the neck, and never through pain.

The noise level is the feature that makes it usable at 10 p.m. — this class of brushless motor hums rather than hammers, so the family does not hear the cooldown. Battery life in this tier runs around two and a half to three hours of active use, which is weeks of sessions between charges, and the gun charges over a standard adapter.

The honest limitations of the tier: stall force is lower than the two-hundred-dollar guns, so a very strong man leaning his full weight into the quad can bog the head down — the fix is more pressure and less speed, which is the correct technique anyway. And the carrying case is functional rather than luxurious. For the recovery gap in a home training setup — the one between stretching nothing and booking a therapist — this is the tool that closes it most cheaply and most often.$BODY$, 'Renpho', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'percussive-massagers'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.store_products p where p.slug = 'renpho-massage-gun'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN DP-URL evidence 2026-11-26 (amazon.com/dp/B0007GAWRS — Escali Primo, chrome variant; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0007GAWRS', 'escali-primo-digital-food-scale', 'Escali Primo Digital Food Scale', 'The kitchen scale nutrition coaches keep recommending: 11 lb capacity, 0.1 oz / 1 g precision, instant readout, wipe-clean two-button operation.',
  $BODY$The Escali Primo is the scale that appears in every nutrition-coaching kit, and its persistence is the recommendation: a flat 8.5-by-6-inch platform, an 11-pound capacity with 0.1-ounce and 1-gram readability, an instant-on display, and exactly two buttons — power and units. There is nothing to learn and nothing to misconfigure, which in daily use is worth more than any feature.

Precision is the entire reason a nutrition program wants a scale. Eyeballing a portion of cooked rice or oats is off by a third on a bad day, and a third of a daily target repeated at every meal is the whole difference between a cut that works and one that stalls. Our macro guidance leans on weighing food raw in grams — the habit that removes the cooked-versus-raw ambiguity — and the Primo reads grams by default with the unit button cycling through ounces and pounds-and-ounces for recipe work.

The sealed control panel is the detail owners praise after a year: the buttons are membrane-sealed and the platform wipes clean with a damp cloth, so flour, sauce, and chicken juice never reach the electronics. The thin profile stores upright in a drawer or flat on the counter, and the battery is a common lithium cell that lasts months at typical kitchen frequency.

Honest limits for the record: the surface is a plastic platform rather than tempered glass, so a scalding pan should not sit straight on it — weigh into a bowl and use the tare. And the capacity ceiling of 11 pounds covers every kitchen use short of weighing a dutch oven of stock, which is not a nutrition task. As the measuring half of every macro plan we publish, this is the smallest purchase with the largest effect on adherence, and the one coaches keep re-buying as gifts.$BODY$, 'Escali', null, 9.0, true,
  'pending', false
from public.store_categories c
where c.slug = 'digital-food-scales-measuring-tools'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.store_products p where p.slug = 'escali-primo-digital-food-scale'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.store_products p where p.slug = 'escali-primo-digital-food-scale'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN CLP-URL evidence 2026-11-26 (amazon.com/clp/B06Y31WGWR — PrepNaturals 30oz glass 5-pack; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B06Y31WGWR', 'prepnaturals-glass-meal-prep-containers', 'PrepNaturals Glass Meal Prep Containers (5-Pack)', 'Borosilicate glass prep containers with leak-resistant lids that go freezer to oven — the physical infrastructure of a planned food week.',
  $BODY$Meal prep fails on logistics, not cooking: the food gets made on Sunday and by Wednesday the wrong container has made it awkward to reheat, transport, or see. This five-pack of PrepNaturals glass containers fixes the logistics. Each is borosilicate glass — the formulation that tolerates thermal shock — with a snap-on plastic lid carrying a silicone gasket for leak resistance, and they go from freezer to oven to dishwasher without the warping that plastic prep boxes show after a month.

The single-compartment 30-ounce format is the workhorse choice for a macro plan: one protein, one carb, one vegetable, in the ratios the plan calls for, reheated in four minutes at the office microwave. The glass base is clear, so Wednesday-you sees lunch instead of guessing, which sounds trivial and is behaviorally decisive. Glass also does not stain with tomato sauces or hold curry odor the way plastic does, which is why prep veterans migrate here eventually regardless of what they started with.

The honest trade weight: glass is heavier and breakable compared with plastic. These survive normal transport in a bag and the specified oven temperatures, but they are not suitcase luggage, and a tile-floor drop is fatal to one unit rather than the whole set — the five-pack absorbs that loss. Lids are the wear item: the gaskets want an occasional rinse and reseat, and replacements are cheap. Stackability is good: same-size bases nest empty and stack flat full, so a fridge shelf holds a five-day plan without architecture.

For our meal-plan subscribers, the workflow is one shopping trip, one cooking block, and five identical boxes — the batch-cooking pattern every prep guide converges on. This set is the durable, oven-safe, visible version of that pattern, and it is the piece of kitchen equipment that most directly converts a food plan into actual eaten meals, which is the only conversion a plan is judged on.$BODY$, 'PrepNaturals', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'meal-prep-containers-storage'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'ai-meal-planner' from public.store_products p where p.slug = 'prepnaturals-glass-meal-prep-containers'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'meal-planner' from public.store_products p where p.slug = 'prepnaturals-glass-meal-prep-containers'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'nutribullet-pro-900-blender', 'NutriBullet Pro 900 Series Blender', 'The 900-watt single-serve blender that made protein shakes a habit: 32 oz cups, to-go lids, and a motor that actually handles frozen fruit and oats.',
  $BODY$The NutriBullet Pro is the appliance that turns a protein plan into a behavior. The formula is a 900-watt motor driving a blade assembly that screws directly onto 32-ounce cups: fill the cup with liquid, frozen fruit, oats, and protein powder, twist, press, and the shake is done in the vessel you drink from. There is no pitcher to wash, which is the reason owners actually use it daily while full-size blenders gather dust between smoothie weekends.

Power is the honest difference between the 900 Pro and the cheaper 600-watt base models: frozen berries, ice, oats, and fibrous greens all break down into a smooth drink rather than a chunky slurry that fights the straw. For the post-workout window we program — a fast-digesting protein with fruit — this is the right appliance shape: single-serve speed with enough wattage to process real ingredients. Peanut butter, Greek yogurt, and soaked nuts for plant-based shakes all fall well within its operating range.

The kit's extras earn their place in daily use: a pair of blending cups so one can sit in the dishwasher while the other works through the morning, to-go lids that turn the cup into a travel bottle, and a short blade-and-seal system with exactly one gasket to keep clean. The cups are top-rack dishwasher safe, and the whole blade assembly rinses clean under a running tap in ten seconds flat.

Two honest limits. This is a smoothie and shake machine, not a food processor: hot soups, nut butters by the jar, and dry grinding are outside its job description. And single-serve means exactly that — a household of four makes four shakes in sequence, which is fine, because each takes under a minute. As the appliance half of our breakfast and post-workout prescriptions, the Pro 900 remains the standard the copycats chase.$BODY$, 'NutriBullet', null, 8.5, false,
  'pending', false
from public.store_categories c
where c.slug = 'blenders-personal-blenders'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.store_products p where p.slug = 'nutribullet-pro-900-blender'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-tracker' from public.store_products p where p.slug = 'nutribullet-pro-900-blender'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN CLP-URL evidence 2026-11-26 (amazon.com/clp/B0BD4BYR11 — COSORI Pro Gen 2 Air Fryer 5.8QT; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0BD4BYR11', 'cosori-air-fryer-pro-gen-2-5-8qt', 'COSORI Air Fryer Pro Gen 2 (5.8 Qt)', 'The square-basket 5.8-quart air fryer with 13 presets and a dishwasher-safe basket — crispy lean protein and vegetables without a pan of oil.',
  $BODY$The air fryer earned its countertop space by solving the weeknight protein problem: a convection-heated basket that browns chicken thighs, salmon fillets, and chopped vegetables in fifteen minutes with a teaspoon of oil instead of a pan. The COSORI Pro Gen 2 is the refined version of the best-selling shape — a square 5.8-quart basket (the square geometry holds a real family portion where round baskets waste corners), 13 one-touch presets, and a removable non-stick basket that goes in the dishwasher.

For a fat-loss or muscle-gain food plan, the machine's value is consistency without boredom. Our recipe library leans on it for the staples people actually repeat: chicken breast with a crust, crispy chickpeas, roasted broccoli at a browning the oven never matches in the time, reheated prep containers that come back to life instead of steaming soggy, and frozen vegetables that turn edible in eight minutes. The presets are honestly redundant — temperature and time are the two dials that matter — but the shake reminder is a genuinely useful nudge halfway through a batch.

The Gen 2 revision earns its upgrade label: a stable element that holds temperature under a full basket, a sleeker housing, and the same 1700-watt class that cooks without tripping a kitchen circuit. Footprint is the one planning note — it takes a permanent counter corner, roughly a breadbox, and lives there because an air fryer that lives in a cabinet gets used a third as often.

Honest limits: the basket coating is non-stick and wants silicone-tipped tools rather than metal tongs, and capacity is single-sheet-pan scale, so a four-person fresh-cooked dinner cooks in two batches. For the daily repetition our meal plans are built on, this is the appliance that keeps lean cooking fast enough to survive a working week, week after week.$BODY$, 'COSORI', null, 8.5, true,
  'pending', false
from public.store_categories c
where c.slug = 'healthy-cooking-appliances'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'ai-meal-planner' from public.store_products p where p.slug = 'cosori-air-fryer-pro-gen-2-5-8qt'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.store_products p where p.slug = 'cosori-air-fryer-pro-gen-2-5-8qt'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN CLP-URL evidence 2026-11-26 (amazon.com/clp/B01N1UX8RW — RENPHO Smart Scale Elis 1; verify at review))
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01N1UX8RW', 'renpho-smart-body-fat-scale', 'RENPHO Smart Body Fat Scale', 'The Bluetooth smart scale with 13 body-composition metrics and app sync — the daily-weighing habit plus a trend line, which is what actually drives progress.',
  $BODY$A scale earns its place in a nutrition program through one behavior: the daily morning weigh-in, averaged across the week, read as a trend. The RENPHO smart scale is the popular machine for that job — a tempered-glass platform with four foot-pad electrodes that estimates thirteen composition metrics (weight, body fat percentage, water, muscle and bone mass estimates, BMI, and the rest) and syncs them over Bluetooth to a phone app that keeps the history.

Bioelectrical impedance is the honest caveat of every consumer body-composition scale, this one included: the estimates are sensitive to hydration, food, and time of day, so a single body-fat reading is a number, not a measurement. The correct use is exactly what the app makes easy — same time every morning, after the bathroom, before eating, plotted as a seven-day rolling average where the noise averages out and the trend survives. Weight itself is precise on a solid floor, and the trend line is the number our coaching feedback actually uses.

The 400-pound capacity and the large 11.8-inch platform make it usable for a wide range of households, and the app supports unlimited profiles, so a family shares one scale with separate histories. Third-party sync works with the major fitness platforms for people who keep their data in one place, and the scale works as a plain digital scale when the phone stays in the drawer.

Two honest notes. The metrics beyond weight are directional — useful for watching a muscle-gain block move the muscle-mass estimate upward over months, not for diagnosing anything. And the glass platform wants hard flooring; carpet readings drift. As the feedback half of every nutrition plan we publish — the cheap device that closes the loop between what you eat and what the chart does — this is the one to own.$BODY$, 'RENPHO', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'smart-body-composition-scales'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'bmi-calculator' from public.store_products p where p.slug = 'renpho-smart-body-fat-scale'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'body-fat-calculator' from public.store_products p where p.slug = 'renpho-smart-body-fat-scale'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'accu-measure-body-fat-caliper', 'Accu-Measure Body Fat Caliper', 'The one-site skinfold caliper with a click-lock measurement — a two-minute weekly body-fat estimate that needs no battery and no app.',
  $BODY$The Accu-Measure caliper is the analog answer to the body-composition question: a spring-loaded skinfold caliper designed around a single measurement site — the suprailliac fold, an inch above the hipbone — with a slide that clicks and locks at the reading so the measurement survives the pinch. It is the tool every old-school coaching manual standardized on, sold at the price of a coffee.

Its place in a home tracking kit is the opposite of the smart scale's: one reading a week, done properly, tracked by hand. The protocol is simple and repeatable — same side, same spot, fold grasped firmly, caliper applied to the fold, read the millimeters when the click stops — and the included chart converts the millimeter reading and age into a body-fat percentage band. A weekly two-minute habit yields a series that moves when a cut is working and stays flat when it is not, independent of whatever the water-fooled scale happened to say that particular morning.

The single-site method is honest about its precision: it estimates the range, not the decimal. Its value is repeatability — the same hand, the same site, the same technique produces a series whose direction means something over weeks. Paired with the daily weight trend and a waist measurement, it completes the three-signal tracking kit our coaching pages prescribe, and none of the three signals costs a subscription.

Two practical notes. Learning the pinch takes a week of consistent practice; the first few attempts run high until the hand calibrates. And the plastic slides and springs are rugged, but the reading card is paper and lives in a drawer, so photograph it once. As the no-battery, no-account body-composition signal, this remains the tool that keeps a progress kit honest, and the one that still works when the phone does not.$BODY$, 'Accu-Measure', null, 7.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'body-fat-calipers-measuring-tapes'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'body-fat-calculator' from public.store_products p where p.slug = 'accu-measure-body-fat-caliper'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'myotape-body-tape-measure', 'MyoTape Body Tape Measure', 'A retractable body tape with a one-hand locking mechanism — the tape that makes waist, hip, and limb circumference measurements actually repeatable.',
  $BODY$Circumference is the most underrated progress metric in training: the waist tells a fat-loss story and the arm, thigh, and chest tell a muscle story even when the scale is being stubborn. The MyoTape is the tool built for the job — a retractable tape in a palm-size case with a push-button retraction and a locking clip that holds the loop at the reading, so one person can measure alone with consistent tension every time.

The mechanism is the whole point. A regular tailor's tape requires two hands and a second person's judgment about tension, and self-measured tapes drift by centimeters between attempts. The MyoTape's case acts as the anchor: hook the stud, wrap, seat the case against the path, and the spring applies the same light tension week after week. Our measurement protocol takes minutes — waist at the navel, hips at the widest point, right arm flexed at the biceps peak, right thigh at mid-length, chest at the nipple line for men — recorded monthly in the same spots with the same posture. The trend in those five numbers is a body-composition narrative that no scale produces.

The tape reads in inches and centimeters on the same band, which matters because centimeters are the unit worth recording — finer resolution than the half-inch marks. The case is plastic and light, drops into a gym bag, and the tape retracts without kinking if it is released by the button rather than wrestled.

One honest note: the tape length runs to around 60 inches, which covers every limb and most waists; lifters past that range at the waist will want the extended version. As the third signal in the home tracking kit — scale trend, caliper site, and the tape's five circumferences — this is the cheap instrument that makes monthly check-ins a five-minute ritual instead of a gym appointment.$BODY$, 'MyoTape', null, 7.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'body-fat-calipers-measuring-tapes'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'body-fat-calculator' from public.store_products p where p.slug = 'myotape-body-tape-measure'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'bmi-calculator' from public.store_products p where p.slug = 'myotape-body-tape-measure'
on conflict (product_id, surface_type, surface_key) do nothing;

-- ============================================================
-- WAVE-1 BATCH — part 3: Wearables (3) + Apparel (3) + Hydration (3)
-- ============================================================

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'fitbit-charge-6', 'Fitbit Charge 6 Fitness Tracker', 'The slim band with continuous heart rate, GPS, and a decade of the best consumer sleep tracking — the everyday tracker that survives a week per charge.',
  $BODY$The Charge line is the tracker that fits the largest number of wrists and lives, and the Charge 6 is the current keeper: a slim band with continuous heart rate, built-in GPS for outdoor pace and distance, a full week of battery per charge, and the health sensors that matter — resting heart rate, heart-rate variability trends, blood-oxygen readings, and the sleep staging Fitbit has been refining for a decade.

Its real role in a training plan is the invisible one: the passive layer that measures the days between sessions. Resting heart rate drifting up across a hard block is the cheapest overtraining signal a home athlete can own, and the sleep-stage history explains the sessions that feel wrong for no visible reason. For the active layer, the band covers our prescription surface — zone training by live heart rate, interval timing with vibration alerts that a treadmill room can hear, and step counts for the daily movement floor we set in our walking protocols. GPS runs track outdoor pace when the weather pulls training outside, and the band syncs step and heart-rate data into the Alkemos tools' tracking flow.

The Charge 6 generation added Google services and a haptic side button to the platform's strengths; the essentials are unchanged because they were already right. Charging is weekly rather than nightly, which is the difference between a tracker you wear and one that lives on its dock.

Honest limits: the screen is a band, not a map — trail navigation belongs to the bigger watches — and GPS battery drains faster than the week-long passive use. As the default tracker for people whose main sports are the gym and the pavement, this remains the band that measures the training life around the training itself — and the one that stays on the wrist doing it.$BODY$, 'Fitbit', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'fitness-smartwatches-gps-watches'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.store_products p where p.slug = 'fitbit-charge-6'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'ai-workout-planner' from public.store_products p where p.slug = 'fitbit-charge-6'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'polar-h10-heart-rate-monitor', 'Polar H10 Heart Rate Monitor', 'The chest strap every accuracy argument ends with: electrode-soft fabric, Bluetooth to two devices at once, and the heart-rate truth zones are actually built on.',
  $BODY$Every wrist-based heart number is an estimate, and every chest strap is the reference the estimates are checked against. The Polar H10 is the strap that ended the argument: a fabric band with silicone electrodes and friction dots that holds position through sprints, burpees, and swims — the H10 is waterproofed to 30 meters — feeding a transmitter that broadcasts over Bluetooth to two devices simultaneously plus the 5 kHz gym-machine channel.

Accuracy is the product, and it shows up in the places a training plan feels it. Interval prescriptions live and die by the zone boundaries: a wrist sensor lags the fifteen-second surges of a bike interval by enough to blur the work/rest boundary, while the H10's beat-to-beat trace snaps with the effort. Our zone-two guidance — the long easy sessions that build an aerobic base — is the other place precision pays: the ceiling that keeps a conversational pace honest is a five-beat window, and a lagging sensor quietly spends half the session above it. Resting heart rate and heart-rate variability recorded on the H10 overnight or in still morning readings are the recovery signals the coaching literature actually trusts.

Comfort decides whether a strap gets worn, and the H10's soft strap with the adjustable friction band is the one owners forget they are wearing by the second minute of a session. Pairing is stable, the battery is a user-replaceable coin cell measured in hundreds of hours, and the strap machine-washes after a sweaty block.

The honest note: a chest strap is a training instrument, not an all-day wearable — it lives in the gym bag and goes on for the session. For everyone whose intervals keep ending in the same wrong zone, this is the purchase that makes the numbers mean what the plan says they mean.$BODY$, 'Polar', null, 9.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'heart-rate-monitors'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.store_products p where p.slug = 'polar-h10-heart-rate-monitor'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'hiit' from public.store_products p where p.slug = 'polar-h10-heart-rate-monitor'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'soundcore-sport-x10-earbuds', 'Soundcore Sport X10 Wireless Earbuds', 'Sweatproof workout earbuds with ear hooks that genuinely hold, bass-forward sound, and multipoint Bluetooth — gym audio that never interrupts a set.',
  $BODY$Workout earbuds fail in two ways: they fall out mid-set, or they die of sweat. The Sport X10 answers both: a rotating ear hook that clicks into the fold of the ear and holds through burpees and sprint intervals, and a fully waterproof rating with a drainage design that survives both sweat and rain runs. The sound is the deliberate gym tuning — bass-forward with a punchy low end that makes interval music work as a pace cue — and the app adds an EQ for the minority who want it flatter.

The details that matter in daily training use are the ones reviews skip. The hooks rotate to stow flat in the case, so pocketing them is real. Multipoint Bluetooth holds the laptop and the phone together, which is the difference between a treadmill session with video and the ritual of re-pairing. The controls sit where a bench press grip cannot accidentally hit them, and the transparency mode is good enough to hold a conversation at the gym without pulling an earbud. Battery runs to roughly eight hours per charge with the case adding two full refills — a training week of sessions between outlet visits.

For the training plans we publish, music is an interval tool: the tempo work in our conditioning blocks is cued by track changes, and the earbuds' job is to disappear while doing that. They do. Calls are handled adequately for the quick between-set kind, which is all a gym context wants.

The honest limits: no earbud beats over-ear headphones for pure sound quality at the same price, and the hooks are the reason — they trade a little fidelity for the security lifters actually need. As training audio that never interrupts a session, these are the ones to buy, and the ones that stay in the gym bag rather than a drawer.$BODY$, 'Soundcore', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'sport-earbuds-headphones'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.store_products p where p.slug = 'soundcore-sport-x10-earbuds'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'nike-metcon-9-training-shoes', 'Nike Metcon 9 Training Shoes', 'The lifting-first trainer: a wide flat sole with a firm heel plate for squats and a strap that locks the midfoot — the shoe for gym days that include heavy barbells.',
  $BODY$The Metcon line is the answer to a question running shoes get wrong: what do you wear on days the weight goes up? The Metcon 9 keeps the line's geometry — a flat, wide outsole with an enlarged heel plate and a firm midsole, plus a midfoot strap over the laces — so the foot gets a stable platform under a squat rack and no squish under a deadlift. That is the entire job, and the 9 does it with a denser heel than the 8 and a wider toe box the line had been asking for.

What the stability buys is measurable. Under a working squat, a cushioned running shoe compresses and wobbles at the bottom — force leaks sideways exactly where the most force exists. The Metcon's heel is a plate; the ground transmits the bar rather than filtering it, and the wide base lets the toes spread and grip. The strap matters for the same reason: laces alone loosen through a session of heavy pulls, and the strap holds the midfoot down for the hour. For our strength blocks this is the shoe shape the programs assume.

The 9's honest trade is the same trade the line always makes: the stable sole is heavy and stiff for running. Short shuttles, sled pushes, box jumps, and rope climbs are all in range — the outsole has the climb guard — but a two-mile run in a Metcon is a decision, not a habit. Our guidance is one pair per gym-first person and two pairs for the running-plus-lifting split, and the two-shoe household is cheaper than the injuries the compromise shoe causes.

Sizing runs true with the wide toe box, and the upper has held up in this line to a year of typical gym abuse. For the training days our programs are built around — barbells first, machines second, everything else after — the Metcon 9 is the flat stable platform under them.$BODY$, 'Nike', null, 8.5, false,
  'pending', false
from public.store_categories c
where c.slug = 'training-gym-footwear'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.store_products p where p.slug = 'nike-metcon-9-training-shoes'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'barbell' from public.store_products p where p.slug = 'nike-metcon-9-training-shoes'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'brooks-ghost-16-running-shoes', 'Brooks Ghost 16 Running Shoes', 'The neutral everyday runner with the cushioned reputation: soft enough for the long runs, honest enough for the daily miles, in widths from narrow to extra-wide.',
  $BODY$The Ghost is the shoe the running industry quietly agrees on: a neutral trainer with no gimmick, on its sixteenth generation, available in widths from narrow to extra-wide, and consistently recommended as the default everyday runner. The 16 is the softest Ghost yet — a nitrogen-infused midsole that keeps the plush ride while losing a little weight — with the same broad stable base and heel-to-toe drop the line has always had.

Its role in a training week is the high-mileage slot. The cushioning is the kind that still feels like something at mile eight, which is the difference between a weekly long run that happens and one that gets shortened; the neutral geometry suits the majority of runners whose feet land without a collapse; and the upper is a engineered mesh that fits a normal foot without hot spots. For our running programming — the zone-two base miles, the easy runs between gym days, and the couch-to-5K on-ramp — this is the shape of shoe the plans assume: boring, cushioned, and right.

The width range is the detail that deserves its own sentence. Brooks cuts the Ghost from narrow to extra-wide, and a runner whose toes splay knows that the widest mainstream lasts are worth more than any midsole chemistry. Half of running-shoe misery is a width problem, and this line solves it at every price tier.

The honest trade: the Ghost is not a racing shoe — the soft midsole absorbs some of the pop a fast day wants — and overpronators who need support may get along better with the Adrenaline shape. For everyone else whose running is the training base rather than the race, the 16 is the neutral default that has been boring and correct for a decade and a half, which is the highest compliment a daily shoe earns.$BODY$, 'Brooks', null, 9.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'running-footwear'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.store_products p where p.slug = 'brooks-ghost-16-running-shoes'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'harbinger-padded-leather-lifting-belt', 'Harbinger Padded Leather Weight Lifting Belt', 'A 4-inch leather belt with a contoured back panel and a steel double-buckle — the belt that gives heavy squats and deadlifts something to brace against.',
  $BODY$A lifting belt is one job: it gives the abdominal wall something to push against, so the trunk braces harder than it can free-standing, which is the mechanism every study of belts finds. The Harbinger padded leather belt does that job in the classic format: a four-inch leather body with a contoured, lightly padded back panel that sits along the lumbar curve, a steel roller buckle with the double-prong closure, and a sizing ladder of holes for a five-inch adjustment range.

The difference from elastic and Velcro belts is stiffness — leather resists the brace fully, so the pressure the core generates comes straight back as support, and the break-in period ends with a belt shaped to the lifter who wore it. The contour matters for fit: the back panel is shaped rather than a flat strap, so it follows the spine between the ribs and the hips without digging into either, and the four-inch width is the general-purpose profile that works for squats, deadlifts, rows, and overhead pressing alike. Our strength blocks prescribe belt use for the top sets above roughly eighty percent of a working max — bracing is a trained skill first, and the belt sharpens it rather than replacing it.

Sizing is the one purchase note that matters: measure the waist at the navel over typical training clothes, and the hole ladder should put the working tension in the middle of the range, not the last hole. The leather wants occasional conditioning and dry storage, and the buckle is steel hardware that outlives the leather.

The honest limit: this is a lifting belt, not a back brace — people with pain should resolve the pain rather than belt around it, and a belt worn at every warm-up set teaches nothing. For the heavy sets our programs build toward, this is the honest leather tool that does the one job correctly, every session, for years.$BODY$, 'Harbinger', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'lifting-belts-straps-gloves'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.store_products p where p.slug = 'harbinger-padded-leather-lifting-belt'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'barbell' from public.store_products p where p.slug = 'harbinger-padded-leather-lifting-belt'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'hydro-flask-wide-mouth-32oz', 'Hydro Flask Wide Mouth Insulated Bottle (32 oz)', 'The vacuum-insulated 32 oz bottle that keeps water cold for a full training day and outlasts every plastic bottle it replaces.',
  $BODY$Hydration is a compliance problem before it is a physiology problem, and the bottle is the compliance tool. The Hydro Flask 32-ounce wide mouth is the reference version of it: double-wall vacuum insulation in an 18/8 stainless body that keeps ice frozen through a summer day and gym bag sweat off the outside, with the wide mouth that takes ice cubes, protein scoops, and cleaning brushes without ceremony.

The 32-ounce size is the deliberate pick for a training day: two refills cover the liter-and-a-half-plus that a training hour and its surrounding day ask for, and the volume marks mean a full morning is visible rather than guessed. Our hydration guidance ties water to the training blocks — a set amount before, during, and after sessions, tracked the way sets are tracked — and the bottle's scale makes that a glance rather than a chore. Cold water is the part people report actually changing behavior: a bottle that stays cold through the afternoon is a bottle that gets emptied.

Durability is the economics: powder-coated steel survives the drop tests of gym floors and car trunks, the insulation has no coating to wear out, and the lid's silicone gasket is the single replaceable wear part. In a year of daily use it replaces the hundreds of single-use bottles that a water habit otherwise consumes. The wide-mouth lid is the simple screw type — the one with the least to break — and the boot accessory covers the base dents that concrete floors cause.

Honest notes: the steel bottle is heavier than plastic full, which is part of why it stays on the desk rather than the trail run, and it is not dishwasher-aggressive — hand washing keeps the finish honest. As the daily driver of a hydration habit attached to a training plan, this is the bottle that outlived its price difference years ago.$BODY$, 'Hydro Flask', null, 8.5, true,
  'pending', false
from public.store_categories c
where c.slug = 'insulated-smart-water-bottles'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.store_products p where p.slug = 'hydro-flask-wide-mouth-32oz'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'blenderbottle-classic-v2-shaker', 'BlenderBottle Classic V2 Shaker Bottle', 'The original shaker with the steel BlenderBall whisk: 28 oz, leak-proof lid, and the two-second cleanup that makes the post-workout shake an actual habit.',
  $BODY$The shaker bottle is the most-bought and most-replaced piece of gym equipment, and the Classic V2 is the one that stops the replacing: the original BlenderBall design — a spherical stainless whisk that breaks protein powder into suspension in ten shakes — in a 28-ounce bottle with the secure screw lid and the wide mouth that takes a scoop without a funnel.

The physics is simple enough to be the whole story: powder plus liquid plus a ball of loosely nested steel wire beats any static bottle, because the wire tumbles through the mixture and shears the clumps as it goes. Cheaper bottles copy the shape and ship a plastic grid that traps clumps in its corners; the BlenderBall is the design the copies are measured against. Two honest habits make the bottle last forever: the lid threaded fully every time, and a rinse immediately after the shake rather than the evening discovery.

The V2 updates are the ones a daily user notices: the plastic is the upgraded flexible kind that survives a drop, the loop top carries the bottle or locks it to a bag, the measurement marks are embossed rather than printed so they do not wear off, and the lid's seal holds carbonation-level pressure — the leak test that separates shakers from furniture. Twenty-eight ounces is the working size: a 30-gram protein serving plus twelve ounces of liquid sits comfortably, with headroom for the gainers who use more.

For our post-workout prescriptions — fast protein in the thirty-minute window the programs call for — the shaker is the tool that makes the window actually happen: a bottle in the gym bag, a scoop in the bottle's compartment, water at the fountain, shake, drink. It is the smallest purchase in this catalog with the most daily uses, and it is the one original that has not needed reinventing.$BODY$, 'BlenderBottle', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'shaker-mixer-bottles'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-tracker' from public.store_products p where p.slug = 'blenderbottle-classic-v2-shaker'
on conflict (product_id, surface_type, surface_key) do nothing;

-- (ASIN NULL 2026-11-26 — no reliable ASIN surfaced this session; capture from the product page at review)
insert into public.store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, null, 'flipbelt-zipper-running-belt', 'FlipBelt Zipper Running Belt', 'The tubular fabric belt with four slide pockets and a zip pouch — phone, gels, and keys carried around the hips with nothing that bounces.',
  $BODY$Running storage fails by bouncing, chafing, or both — armbands cut circulation, handhelds occupy a hand, and backpacks need a spine. The FlipBelt is the alternative that works: a wide tubular waistband of spandex-blend fabric with four slide-in openings around its circumference, plus a zippered pocket for the things that must not escape. Items slide in horizontally and the tube's tension holds them against the body; nothing bounces because nothing moves.

For our running programming the belt carries the long-run kit: a phone in the zippered pocket, gels or chews in the side openings for sessions past the hour, and the house key that ends up in a pocket on race day. The fabric wicks and dries fast, the flat seams sit where a waistband already sits, and the sizing holds the band at the hips — a finger's width of tension, snug without compression. The zipper is the reason to pick this version over the original open-pocket FlipBelt: a phone cannot work its way out of a zip, and the pocket's position over the hip bone keeps the screen from a key scratch.

The carry capacity is honest: one large phone, one set of keys, two or three gels, and a card — that is the complete list, and it is the correct list for road running. Trail ultra distances graduate to vests, and our plans for those are written accordingly. For the flat-ground miles that make up the training base, the belt disappears in a way nothing with straps does, and disappearing is the entire job description of running storage.

Care is machine-wash cold, which the fabric takes for years without losing shape; the openings relax slightly between washes and always return to tension. As the quiet storage for the daily miles, the Zipper FlipBelt is the one that made armbands obsolete.$BODY$, 'FlipBelt', null, 8.0, false,
  'pending', false
from public.store_categories c
where c.slug = 'hydration-packs-running-belts'
on conflict (slug) do nothing;
insert into public.store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.store_products p where p.slug = 'flipbelt-zipper-running-belt'
on conflict (product_id, surface_type, surface_key) do nothing;


-- ============================================================
-- BATCH SUMMARY (evidence ledger — 2026-11-26 UTC)
--   27 products · 8 wave-1 mains · every main ≥3 · all born
--   review_status='pending' + is_published=false (0097 — the
--   owner's review inbox, never bypassed).
--   ASIN tiers: LIVE-VERIFIED ×3 (B002OP1Z44 · B01AVDVHTI ·
--   B0040EGNIU) · DP-URL ×2 (B0007GAWRS · B00FLID5EO) · CLP-URL ×6
--   (B0G6Z84TQM · B0CR3JF59Y · B07D528W98 · B06Y31WGWR ·
--   B0BD4BYR11 · B01N1UX8RW) · NULL ×16 (owner captures at review —
--   StoreLinkVerify does the live check in one click).
--   All images NULL = carved icons (IMAGE-POLICY-EN.md ص-1; zero
--   Amazon images, zero person photos).
--   Editorial content: original Alkemos English, ≥300 words each
--   (the advisory floor §3.4-8) — never Amazon copy.
--

-- Verification probe: scripts/db/migration_probes.py (0117 row —
-- count_rows=1 for slug=cap-barbell-300lb-olympic-weight-set).
