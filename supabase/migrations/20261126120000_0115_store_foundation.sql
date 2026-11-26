-- ============================================================================
-- 20261126120000_0115_store_foundation.sql
-- 0115 — ALKEMOS-STORE-PHASE1 (owner order 2026-11-26 «تنفيذ المرحلة الأولى»
--        per docs/store/PHASE-1-SCOPE.md + governing law §3.1):
--        the Alkemos Product Store data foundation (System 2 — English-only
--        Amazon Associates affiliate store; tracker ahmedzake-20).
-- ============================================================================
-- WHY (governing law docs/archive/ALKEMOS-STORE-AFFILIATE-READINESS-AUDIT
--      -2026-11-26.md §1.2/§3.1 + approved amendment (a) of the open order):
--   The store starts from ZERO product tables (129 migrations, last 0114,
--   contain no catalog tables). The audit's §3.1 spec — PLUS the ratified
--   amendment (a): parent_id for the approved two-level category tree
--   (CATEGORIES-EN.md v2 — 12 main categories × 63 subcategories, 3 launch
--   waves) — becomes the store's data foundation:
--     * store_categories  — EN-only slugs/names, icon_key, two-level tree.
--     * store_products    — ASIN identity (the ONLY stored purchase key —
--                          clause (h): ASINs may be stored indefinitely),
--                          unique EN editorial content, NO affiliate_url
--                          (links are built centrally at render time),
--                          API-ready nullable price/payload columns.
--     * store_product_links — product ↔ internal EN surface bindings only.
--     * store_click_events  — server-side insert-only beacon rows (no
--                          redirect endpoint — clause (v)).
--
-- WHAT THIS FILE DOES (additive + idempotent — the 0108 pattern):
--   1. Four store_* tables (create table if not exists) with the spec's
--      columns, CHECK constraints (text+CHECK, never enums — 0109 law),
--      and indexes (incl. the 0097 pending-review partial index).
--   2. RLS on every table: public read of PUBLISHED/ACTIVE rows only,
--      admin writes via the canonical public.is_admin() (0029B),
--      click_events with NO client policies (service-role inserts only).
--   3. SEED: the approved classification v2 (CATEGORIES-EN.md) — wave 1
--      (8 main categories + 44 subcategories) seeded is_active=true;
--      waves 2–3 (4 main + 19 sub) seeded is_active=false until the
--      owner's activation orders. Women's Training Apparel stays in the
--      tree (image law v2 §0.1: person-free product images only).
--
-- WHAT IT DELIBERATELY DOES NOT DO:
--   - No touch to System 1 (affiliate_*/referral_* — the site partner
--     engine) or System 3 (future Arabic store) — naming law §0.
--   - No products seed (separate migration 0116 — batch review SOP §5).
--   - No price data (price_usd stays NULL until Phase 4 / Creators API).
--   - No stored tagged links (guard rejects any tag= text column value —
--     the link is built from ASIN + env tag at render, store-link.ts).
--
-- Idempotent: safe to re-run (IF NOT EXISTS + ON CONFLICT (slug) DO
-- NOTHING). Clean-stack safe: no dependency on any pre-existing table
-- except public.is_admin() (0029B — guarded with a NOTICE skip like the
-- 0113 precedent for local stacks where 0029B ran via the original chain).
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) store_categories — EN-only, two-level tree (amendment (a))
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

-- Admin-only writes.
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

-- Admin-only writes.
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

-- Admin-only writes.
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
-- 5) SEED — the approved classification v2 (CATEGORIES-EN.md — owner
--    order 2026-11-26 «اعتمد التصنيف الموسع v2»). Wave 1 (8 mains +
--    44 subs) active; waves 2–3 (4 mains + 19 subs) inactive until the
--    owner's activation orders. Idempotent: slug conflicts do nothing.
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

-- Verification probe: scripts/db/migration_probes.py (0115 row).
