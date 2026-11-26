-- ============================================================================
-- 20261127120000_0119_affiliate_store_expansion.sql
-- 0119 — AFFILIATE-STORE-EXPANSION (owner order 2026-11-27 «تحويل Affiliate
--        Store إلى متجر متكامل لمنتجات اللياقة والتغذية ونمط الحياة الصحي»):
--        the store stops being an equipment shop and becomes a full
--        fitness/nutrition/well-being store.
-- ============================================================================
-- WHAT THIS FILE DOES (additive + idempotent — the 0108/0115 patterns):
--   1. SCHEMA: affiliate_store_categories.image_url — the category tile
--      image (the owner's order «استبدل أيقونات Shop by Category بصور
--      منتجات حقيقية»). Values are the SAME trusted source as product
--      images (527-G1): https://m.media-amazon.com original product photos,
--      every one machine-verified person-free before this file shipped.
--   2. CATEGORY TREE: the commercial taxonomy the owner ordered —
--      Supplements, Healthy Food and Sports Nutrition move to the FRONT of
--      the store (equipment no longer dominates); new mains Sports
--      Nutrition + Workout Accessories; Recovery & Wellness / Fitness
--      Technology / Digital Fitness Products renames; measurement subs
--      re-parented under Fitness Technology; accessories subs re-parented
--      under Workout Accessories. Leaf slugs are preserved wherever
--      products exist (product URLs never change); the one renamed sub
--      (recovery-electrolyte-supplements -> electrolytes-hydration-mixes)
--      holds zero products at rename time.
--   3. PRODUCTS: the 49-product verified batch across 12 categories —
--      every row carries a LIVE-VERIFIED US ASIN + the original Amazon
--      product photo (m.media-amazon.com) + unique EN editorial content
--      (>=300 words, guard-checked: no halal blocklist, no disease claims,
--      no stored links, no commission text, no manual price).
--      Born is_published=true + review_status='reviewed' — the 527-L2
--      auto-publish law (the guards are the publish gate; the 0097 flow
--      was retired by owner order).
--   4. SURFACE BINDINGS: tool / equipment_hub / program links for the
--      EN surfaces that render the recommendation rails.
--
-- VERIFICATION LEDGER (2026-11-27 UTC, this session — scripts outside the
-- repo, results in the governing report):
--   * ASINs: each /dp/ page fetched in a real browser; title + ASIN +
--     data-old-hires image read from the live page (the 527 channel).
--   * Images: HTTP-checked (200 image/jpeg) then MACHINE-VISION-CHECKED
--     one by one — PEOPLE=none, IMMODEST=no, SUBJECT=product-only; every
--     candidate that failed any check was replaced or dropped (documented
--     in the report: BLS book/kindle, Starting Strength, OPTP strap, UA
--     model-shot tee, NewMe journal, Year One cover — all excluded).
--   * Guards: the full publish gate re-implemented in the seed builder
--     and run over all 49 rows before emission (49/49 pass, zero blocks).
--
-- WHAT IT DELIBERATELY DOES NOT DO:
--   - No touch to System 1 (affiliate_*/referral_*) or System 3 (no
--     Arabic store tables) — the separation law §0.
--   - No prices (price_usd stays NULL — Phase 4 / Creators API only).
--   - No stored tagged links (§3.4-1) — links build from ASIN + env tag.
--
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) schema — the category tile image column
-- ============================================================
alter table public.affiliate_store_categories
  add column if not exists image_url text;

comment on column public.affiliate_store_categories.image_url is
  'Category tile image — the SAME trusted source as product images (527-G1): https://m.media-amazon.com original product photos (or alkemos.com self-hosted); rendered with the carved-icon fallback when NULL.';

-- ============================================================
-- 2) the twelve commercial mains (owner order 2026-11-27)
-- ============================================================
update public.affiliate_store_categories
set name = $DESC$Supplements$DESC$, description = $DESC$Whey, casein and plant proteins, creatine, amino acids, vitamins, minerals and joint-support supplements — the nutrition layer of hard training, screened product by product.$DESC$, icon_key = 'protein',
    image_url = 'https://m.media-amazon.com/images/I/71dKNBdIdCL._AC_SL1500_.jpg', sort_order = 10, is_active = true, updated_at = now()
where slug = 'sports-supplements-vitamins';
update public.affiliate_store_categories
set name = $DESC$Healthy Food$DESC$, description = $DESC$Protein bars, nut butters, nuts, seeds and smarter pantry staples — everyday food that serves training goals, picked for honest labels.$DESC$, icon_key = 'fruits',
    image_url = 'https://m.media-amazon.com/images/I/81bOQhkUXFL._AC_SL1500_.jpg', sort_order = 20, is_active = true, updated_at = now()
where slug = 'healthy-foods-sports-snacks';
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active)
select 'sports-nutrition', $DESC$Sports Nutrition$DESC$, $DESC$Pre-workout formulas, electrolyte hydration mixes, energy gels and chews — fuel and fluids engineered around the training session itself.$DESC$, 'macros', 30, true
where not exists (select 1 from public.affiliate_store_categories where slug = 'sports-nutrition');

update public.affiliate_store_categories
set name = $DESC$Sports Nutrition$DESC$, description = $DESC$Pre-workout formulas, electrolyte hydration mixes, energy gels and chews — fuel and fluids engineered around the training session itself.$DESC$, icon_key = 'macros',
    image_url = 'https://m.media-amazon.com/images/I/71Y+Z1pc0jL._AC_SL1500_.jpg', sort_order = 30, is_active = true, updated_at = now()
where slug = 'sports-nutrition';
update public.affiliate_store_categories
set name = $DESC$Strength & Free Weights$DESC$, description = $DESC$Barbells, plates, dumbbells, kettlebells, bands and functional tools — the iron that strength programs are built on.$DESC$, icon_key = 'dumbbell',
    image_url = 'https://m.media-amazon.com/images/I/71BmLCpUSvL._AC_SL1450_.jpg', sort_order = 40, is_active = true, updated_at = now()
where slug = 'strength-free-weights';
update public.affiliate_store_categories
set name = $DESC$Home Gym & Cardio Equipment$DESC$, description = $DESC$Racks, benches, treadmills, bikes, rowers and flooring — the machines and structures of a serious training space.$DESC$, icon_key = 'rack',
    image_url = 'https://m.media-amazon.com/images/I/41ASrzCESlL._AC_SL1500_.jpg', sort_order = 50, is_active = true, updated_at = now()
where slug = 'home-gym-cardio-equipment';
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active)
select 'workout-accessories', $DESC$Workout Accessories$DESC$, $DESC$Lifting belts, straps, chalk, jump ropes and gym bags — the small tools that make heavy training smoother, safer and better organized.$DESC$, 'checkseal', 60, true
where not exists (select 1 from public.affiliate_store_categories where slug = 'workout-accessories');

update public.affiliate_store_categories
set name = $DESC$Workout Accessories$DESC$, description = $DESC$Lifting belts, straps, chalk, jump ropes and gym bags — the small tools that make heavy training smoother, safer and better organized.$DESC$, icon_key = 'checkseal',
    image_url = 'https://m.media-amazon.com/images/I/61+UlXddzxL._AC_SL1000_.jpg', sort_order = 60, is_active = true, updated_at = now()
where slug = 'workout-accessories';
update public.affiliate_store_categories
set name = $DESC$Recovery & Wellness$DESC$, description = $DESC$Foam rollers, massage guns, stretching tools, acupressure and sleep gear — the quiet half of training where adaptation actually happens.$DESC$, icon_key = 'laurel',
    image_url = 'https://m.media-amazon.com/images/I/71-MhWa5jWL._AC_SL1500_.jpg', sort_order = 70, is_active = true, updated_at = now()
where slug = 'yoga-mobility-recovery';
update public.affiliate_store_categories
set name = $DESC$Fitness Technology$DESC$, description = $DESC$Smartwatches, activity trackers, heart-rate monitors, sport earbuds and smart scales — the data layer of modern training.$DESC$, icon_key = 'runner',
    image_url = 'https://m.media-amazon.com/images/I/61wn2jfhBkL._AC_SL1500_.jpg', sort_order = 80, is_active = true, updated_at = now()
where slug = 'wearables-fitness-tech';
update public.affiliate_store_categories
set name = $DESC$Kitchen & Meal Prep$DESC$, description = $DESC$Scales, blenders, containers, appliances and prep tools — the kitchen equipment that makes a nutrition plan executable.$DESC$, icon_key = 'mealplanner',
    image_url = 'https://m.media-amazon.com/images/I/6187yrI+TyL._AC_SL1500_.jpg', sort_order = 90, is_active = true, updated_at = now()
where slug = 'kitchen-meal-prep';
update public.affiliate_store_categories
set name = $DESC$Training Apparel & Footwear$DESC$, description = $DESC$Training and running shoes, performance tees and socks — gear built to be trained in, not posed in.$DESC$, icon_key = 'house',
    image_url = 'https://m.media-amazon.com/images/I/81zsdeP2hyL._AC_SL1500_.jpg', sort_order = 100, is_active = true, updated_at = now()
where slug = 'training-apparel-footwear';
update public.affiliate_store_categories
set name = $DESC$Hydration & On-the-Go$DESC$, description = $DESC$Insulated bottles, shakers, tumblers and running belts — hydration hardware for training days and everything around them.$DESC$, icon_key = 'hydration',
    image_url = 'https://m.media-amazon.com/images/I/61BcE-AKSyL._AC_SL1500_.jpg', sort_order = 110, is_active = true, updated_at = now()
where slug = 'hydration-on-the-go';
update public.affiliate_store_categories
set name = $DESC$Digital Fitness Products$DESC$, description = $DESC$Training books, Kindle program guides and workout journals — the digital and print media that teach the craft behind the training.$DESC$, icon_key = 'scroll',
    image_url = 'https://m.media-amazon.com/images/I/41HtHcSY4DL._AC_SL1500_.jpg', sort_order = 120, is_active = true, updated_at = now()
where slug = 'educational-media-guides';

-- deactivate the absorbed main (its three subs moved to Fitness Technology;
-- zero URL impact — leaf slugs and product URLs are untouched)
update public.affiliate_store_categories
set is_active = false, updated_at = now()
where slug = 'body-measurement-composition';

-- ============================================================
-- 3) new subcategories + moves + renames
-- ============================================================
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active, parent_id)
select 'energy-gels-chews', $DESC$Energy Gels & Chews$DESC$, $DESC$Race-day carbohydrate: energy gels and chewable fuel for sessions and events past the ninety-minute mark.$DESC$, 'macros', 30, true,
       (select id from public.affiliate_store_categories where slug = 'sports-nutrition')
where not exists (select 1 from public.affiliate_store_categories where slug = 'energy-gels-chews')
  and exists (select 1 from public.affiliate_store_categories where slug = 'sports-nutrition');

update public.affiliate_store_categories
set is_active = true, sort_order = 30, updated_at = now()
where slug = 'energy-gels-chews';
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active, parent_id)
select 'jump-ropes', $DESC$Jump Ropes$DESC$, $DESC$Speed ropes and adjustable cables — the most honest cardio instrument ever built, sized for a corner of any room.$DESC$, 'checkseal', 30, true,
       (select id from public.affiliate_store_categories where slug = 'workout-accessories')
where not exists (select 1 from public.affiliate_store_categories where slug = 'jump-ropes')
  and exists (select 1 from public.affiliate_store_categories where slug = 'workout-accessories');

update public.affiliate_store_categories
set is_active = true, sort_order = 30, updated_at = now()
where slug = 'jump-ropes';
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active, parent_id)
select 'gym-chalk-grip', $DESC$Gym Chalk & Grip$DESC$, $DESC$Magnesium carbonate blocks and grip aids — dry hands, held bars, safer heavy sets.$DESC$, 'checkseal', 40, true,
       (select id from public.affiliate_store_categories where slug = 'workout-accessories')
where not exists (select 1 from public.affiliate_store_categories where slug = 'gym-chalk-grip')
  and exists (select 1 from public.affiliate_store_categories where slug = 'workout-accessories');

update public.affiliate_store_categories
set is_active = true, sort_order = 40, updated_at = now()
where slug = 'gym-chalk-grip';
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active, parent_id)
select 'sleep-recovery-tools', $DESC$Sleep & Recovery Tools$DESC$, $DESC$Blackout masks, acupressure and wind-down tools — the evening rituals that fund the next training day.$DESC$, 'laurel', 60, true,
       (select id from public.affiliate_store_categories where slug = 'yoga-mobility-recovery')
where not exists (select 1 from public.affiliate_store_categories where slug = 'sleep-recovery-tools')
  and exists (select 1 from public.affiliate_store_categories where slug = 'yoga-mobility-recovery');

update public.affiliate_store_categories
set is_active = true, sort_order = 60, updated_at = now()
where slug = 'sleep-recovery-tools';
insert into public.affiliate_store_categories (slug, name, description, icon_key, sort_order, is_active, parent_id)
select 'digital-guides-ebooks', $DESC$Digital Guides & eBooks$DESC$, $DESC$Kindle program guides and digital training material — the library that fits in a pocket.$DESC$, 'scroll', 20, true,
       (select id from public.affiliate_store_categories where slug = 'educational-media-guides')
where not exists (select 1 from public.affiliate_store_categories where slug = 'digital-guides-ebooks')
  and exists (select 1 from public.affiliate_store_categories where slug = 'educational-media-guides');

update public.affiliate_store_categories
set is_active = true, sort_order = 20, updated_at = now()
where slug = 'digital-guides-ebooks';
-- rename (zero products at rename time — no URL impact)
update public.affiliate_store_categories
set slug = 'electrolytes-hydration-mixes', name = $DESC$Electrolytes & Hydration Mixes$DESC$, description = $DESC$Electrolyte drink mixes and tablets — training-day hydration that replaces what sweat takes.$DESC$, updated_at = now()
where slug = 'recovery-electrolyte-supplements';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'sports-nutrition'),
    sort_order = 10, updated_at = now()
where slug = 'pre-workout-energy-formulas';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'sports-nutrition'),
    sort_order = 20, updated_at = now()
where slug = 'recovery-electrolyte-supplements';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'sports-nutrition'),
    sort_order = 20, updated_at = now()
where slug = 'electrolytes-hydration-mixes';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'workout-accessories'),
    sort_order = 10, updated_at = now()
where slug = 'lifting-belts-straps-gloves';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'workout-accessories'),
    sort_order = 50, updated_at = now()
where slug = 'gym-training-bags';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'wearables-fitness-tech'),
    sort_order = 60, updated_at = now()
where slug = 'smart-body-composition-scales';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'wearables-fitness-tech'),
    sort_order = 70, updated_at = now()
where slug = 'body-fat-calipers-measuring-tapes';
update public.affiliate_store_categories
set parent_id = (select id from public.affiliate_store_categories where slug = 'wearables-fitness-tech'),
    sort_order = 80, updated_at = now()
where slug = 'health-monitoring-devices';
-- activate the wave-2/3 leaf categories that now carry products
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'protein-powders';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'creatine-amino-acids';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'vitamins-minerals-omegas';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'joint-bone-support';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'herbal-adaptogenic-supplements';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'pre-workout-energy-formulas';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'electrolytes-hydration-mixes';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'protein-bars-functional-snacks';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'nut-butters-spreads';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'nuts-seeds-trail-mixes';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'low-sugar-diet-friendly-foods';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'specialty-baking-cooking-ingredients';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'coffees-teas';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'fitness-nutrition-books';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'training-logs-planners';

-- ============================================================
-- 4) the 49-product verified batch (born published — 527-L2)
-- ============================================================

-- B07PWPVDDN — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07PWPVDDN', 'optimum-nutrition-gold-standard-whey', $TITLE$Optimum Nutrition Gold Standard 100% Whey Protein Powder (Double Rich Chocolate, 5 lb)$TITLE$,
  $SUM$The benchmark whey blend: 24 g of protein per scoop from isolate and concentrate, a clean mix, and the flavor catalog everyone else is measured against.$SUM$,
  $BODY$Gold Standard 100% Whey has been the default answer to "which protein should I buy?" for over a decade, and the reasons survive every reformulation of the market around it. Each scoop delivers 24 grams of protein built mainly from whey protein isolate — the faster-filtered fraction — supported by concentrate and a small amount of whey peptides. For our purposes at Alkemos, that blend matters: isolate keeps the lactose load low enough that most milk-sensitive lifters tolerate it, while the concentrate keeps the price per serving honest compared to pure isolates.

Mixing behavior is where cheap powders fail and this one quietly excels. A scoop in cold water or milk disperses in about ten seconds of shaking, with no clumps riding the top and no cement layer at the bottom of the shaker if you drink it within the hour. Double Rich Chocolate is the flavor that made the tub famous: cocoa-forward, moderately sweet, and stable when baked into protein oats or pancakes. The 5-pound tub holds roughly 73 servings, which frames the real decision — protein powder is a per-serving purchase, not a per-tub one, and the cost per 24 grams of protein here undercuts most boutique blends while matching their mixability.

Usage is simple arithmetic. Take your bodyweight target protein — our macro calculator defaults most trainees to 1.6-2.2 grams per kilogram — subtract what food supplies, and let whey close the gap. The two slots where it fits most naturally are the post-training window, when a liquid protein reaches muscle tissue faster than a full meal, and breakfast rescue, when eggs take longer than the commute allows. Two scoops blend into a fruit smoothie without making it taste like a supplement.

Honest notes from long-term users: the artificial sweetener profile (sucralose) is noticeable if you drink it plain and unsweet, and the brand's endless flavor lineup varies more than the marketing admits — stick to the established chocolate and vanilla lines before experimenting. Airtight storage keeps the powder scoopable in humid kitchens. None of that changes the summary verdict: if you are buying your first tub, or your tenth, this is the product that sets the bar.$BODY$,
  $BRAND$Optimum Nutrition$BRAND$, 'https://m.media-amazon.com/images/I/71dKNBdIdCL._AC_SL1500_.jpg', 9.2, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-powders'
on conflict (slug) do nothing;
-- B079P7BFYL — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B079P7BFYL', 'vega-premium-plant-protein', $TITLE$Vega Premium Protein + Supergreens Plant-Based Protein Powder (Creamy Vanilla, 20 g)$TITLE$,
  $SUM$A plant-based protein that behaves like one: 20 g from pea and seed blends with greens added, mixing smooth for a dairy-free daily shake.$SUM$,
  $BODY$Plant proteins earned their bad reputation honestly — chalky texture, incomplete amino profiles, flavors that tasted like the field they came from. Vega's premium line is one of the products that closed that gap. Each serving supplies 20 grams of protein from a multi-source plant blend — pea protein carrying the load, rounded out with seed proteins so the amino acid spectrum doesn't lean on a single crop — plus a scoop of powdered greens that quietly adds vegetable nutrition to a shake that would otherwise contain none.

The texture is the headline. Pea protein isolates have improved dramatically, and the result here is a shake that drinks like a thick vanilla milk rather than slurry. In a blender with a banana and oat milk it passes for a smoothie-shop order; in a shaker with water alone it is drinkable, which is more than most plant blends managed five years ago. Creamy Vanilla is the safe flavor choice — it plays well with berries, coffee, and peanut butter without fighting them.

Who is this for? Three groups, honestly. Lifters who avoid dairy and want a protein that doesn't punish them for it; trainees whose stomachs object to lactose-heavy shakes even in small doses; and anyone using our meal-planning tools who wants a plant-based option to slot into the protein column without re-learning the math. Twenty grams per scoop is a real serving — one gram short of the whey benchmark, and the amino leucine count runs slightly lower than whey's, so plant-based lifters often take a slightly larger scoop or pair the shake with a leucine-containing meal.

Notes worth knowing before you commit. Plant proteins cost more per gram of protein than mainstream whey — that is the honest tax on the category, not this tub specifically. The greens add an earthy undertone some palates notice in plain water. And Vega's scoop sizes vary between lines, so read the label rather than reusing the drawer scoop. Within the plant category, this is the blend we point people toward first: it mixes, it tastes like food, and the nutrition label survives scrutiny.$BODY$,
  $BRAND$Vega$BRAND$, 'https://m.media-amazon.com/images/I/71dR0SZRsWL._AC_SL1500_.jpg', 8.4, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-powders'
on conflict (slug) do nothing;
-- B002DYJ0M0 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B002DYJ0M0', 'optimum-nutrition-gold-standard-casein', $TITLE$Optimum Nutrition Gold Standard 100% Casein Protein Powder (Chocolate Supreme, 4 lb)$TITLE$,
  $SUM$The slow-release night protein: micellar casein gels in the stomach and feeds amino acids for hours, made by the same house as the flagship whey.$SUM$,
  $BODY$Casein is the other half of milk, and it behaves nothing like whey. Where whey floods the bloodstream with amino acids inside the first hour, micellar casein forms a gel in stomach acid and releases its protein slowly across five to seven hours. That single property defines its use: it is the protein you take when a long gap without food is coming — sleep being the obvious one — and you want the muscle-repair supply line to keep dripping rather than spike and fade.

Gold Standard Casein is the category's reference product, and Chocolate Supreme is its classic execution: a dense, pudding-adjacent cocoa shake. That thickness is not a flaw to engineer around; it is the protein doing what casein does. Mixed thick with four to six ounces of milk, it reads as a legitimate dessert substitute at 9 p.m. — the hour when most fat-loss diets actually fail. Mixed thinner with water it still drinks heavier than any whey, which most users come to prefer at night.

The practical programming at Alkemos: one scoop before bed on training days, or during long daytime gaps when a whole-food meal is impossible. During aggressive cuts — when our calorie calculator puts someone 500-plus calories under maintenance — a casein shake at night consistently outperforms willpower against the kitchen. The satiety is structural, not psychological: the gel physically occupies the stomach while the amino acids trickle out.

Honest notes. Casein is a milk protein, so it carries more lactose than isolated whey blends — dairy-sensitive users should test with a small serving first. It does not mix with a lazy wrist: shake hard or blend, because half-mixed casein sticks to the shaker walls. And the 4-pound tub is a bedtime product, not an all-purpose one — daytime post-workout slots still belong to faster proteins. Used for what it is, it is the most useful single scoop in the evening arsenal.$BODY$,
  $BRAND$Optimum Nutrition$BRAND$, 'https://m.media-amazon.com/images/I/71TCG6ki52L._AC_SL1500_.jpg', 8.6, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-powders'
on conflict (slug) do nothing;
-- B0DPDZZVSX — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0DPDZZVSX', 'optimum-nutrition-micronized-creatine', $TITLE$Optimum Nutrition Micronized Creatine Monohydrate Powder (Unflavored, 135 Servings)$TITLE$,
  $SUM$Plain micronized creatine monohydrate — the most-studied performance supplement there is — with nothing else in the tub and 135 five-gram servings per container.$SUM$,
  $BODY$If every supplement on the market were deleted except one, creatine monohydrate is the one to keep. Decades of research — more than any other sports supplement — consistently associate daily creatine with improved performance in repeated bouts of high-intensity effort and with increases in strength and lean mass when paired with resistance training. It works by a simple mechanism: it tops up the phosphocreatine reserves your muscles use to regenerate energy during short, explosive work. More reserve, more quality reps per set, more training stimulus over months.

This tub is the honest version of that story: micronized creatine monohydrate, unflavored, no proprietary blend, no fairy dust of other ingredients. Micronized simply means the powder is milled finer, so it suspends in liquid instead of gritting at the bottom of the glass. One rounded teaspoon is a standard five-gram serving, and the 135-serving tub is close to four months of daily use — which is exactly how creatine should be taken. The loading-phase question gets asked every week: research supports both approaches, and steady-state five grams daily reaches the same muscle saturation in three to four weeks without the water-weight spike.

The myths deserve one paragraph of honest cleanup. Creatine is not a steroid, not a kidney hazard in healthy people at standard doses, and not banned in any sport worth competing in. The scale moves up one to two kilograms in the first weeks for most users — that is water inside the muscle cell, which is part of how it works, not fat. Drink normally, train normally, and let the compound do its quiet work.

Usage notes: take it any time of day, with any liquid, on training and rest days alike — consistency beats timing. The unflavored powder disappears into a protein shake, juice, or water with a stir. Pair it with our strength programs, log the rep totals honestly, and judge it at the eight-week mark, not the eight-day mark. This is the cheapest meaningful edge in training, sold in its plainest form.$BODY$,
  $BRAND$Optimum Nutrition$BRAND$, 'https://m.media-amazon.com/images/I/71SWsBrJPjL._AC_SL1500_.jpg', 9.0, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'creatine-amino-acids'
on conflict (slug) do nothing;
-- B00TH3LJCO — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00TH3LJCO', 'optimum-nutrition-amino-energy', $TITLE$Optimum Nutrition Essential Amino Energy Powder (Fruit Fusion, 9.5 oz)$TITLE$,
  $SUM$A light caffeinated amino drink for between-meal hours: essential aminos for muscle support and a gentle energy lift without a full pre-workout.$SUM$,
  $BODY$Not every hour of the day needs a full pre-workout, and not everyone wants another coffee. Amino Energy sits deliberately between the two: a scoop of essential amino acids — the ones the body cannot build itself — with a modest caffeine content, mixed into water that then tastes like fruit rather than gym. The result is the category's most useful compromise, a drink for the mid-afternoon slump, the fasted morning, or the training session that needs a nudge rather than a shove.

The amino side supplies the muscle-relevant half. Essential amino acids, including the branched-chain three, are the raw material of muscle repair — a flavored EAAs drink keeps a trickle of them moving between whole-food meals. Let the honest framing lead, though: this is not a replacement for a protein shake. The total amino dose per serving is a fraction of what 24 grams of whey delivers, and it carries none of whey's satiety. Think of it as a between-meals top-up and a better-than-soda vehicle for hydration.

The energy side is dosed for sanity. Two scoops land around 100 milligrams of caffeine — one strong cup of coffee — with green tea and green coffee extract in the blend. One scoop halves that, which is the right call for evening training or caffeine-sensitive users; read the label and count your scoops like an adult. Fruit Fusion is the survivor flavor of the line: tart, light, and drinkable cold from a shaker on a desk.

Where it earns its shelf space in an Alkemos day: the 4 p.m. drag before an evening session; the morning cardio block where a pre-workout would be overkill; the office hydration that currently defaults to a third coffee. What it is not: a mass gainer, a creatine source, or a fat-loss product. It is a light, caffeinated amino water that does exactly what the label structure implies — and the small tub makes an easy trial before committing to the larger sizes.$BODY$,
  $BRAND$Optimum Nutrition$BRAND$, 'https://m.media-amazon.com/images/I/81rbv-hB66L._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'creatine-amino-acids'
on conflict (slug) do nothing;
-- B0BSNZLT17 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0BSNZLT17', 'animal-pak-multivitamin', $TITLE$Animal Pak Multivitamin Training Packs (44 Packs)$TITLE$,
  $SUM$The classic hard-training multivitamin: a full daily micronutrient pack dosed for lifters, one packet at a time since the 1980s.$SUM$,
  $BODY$Animal Pak has been on gym shelves since most of its current buyers were born, and its format explains the longevity: instead of one oversized tablet, each daily dose is a small packet of pills — multivitamin tablets, mineral complexes, amino chelates, and a digestive enzyme — engineered around the assumption that the user trains hard, eats big, and burns through micronutrients faster than a standard once-a-day tablet supplies them.

The logic is straightforward even if the pill count isn't pretty. Hard training increases turnover of B vitamins, vitamin C, and several minerals; large food intakes deliver calories but not automatically a proportional micronutrient load; and restrictive phases — a cut run from our calorie calculator — shrink food variety exactly when coverage matters most. A dedicated training pack widens the safety margin across the whole micronutrient board, including doses of vitamin D, zinc, and the B complex that one-a-day formulas compress to token amounts.

The honest part, before you buy: one pack means swallowing around eleven pills, and that number is the product's most common complaint. Most users split it across two meals. The format is also not cheap compared to plain multis — you are paying for breadth and for the convenience of not assembling the stack yourself. Anyone who finds the full pack excessive can start with a half packet, but the formulation assumes the full one.

Who it fits best: trainees in heavy strength blocks, athletes managing large training volumes, and anyone whose diet runs repetitive — the meal-prep lifestyle of chicken, rice, and the same five vegetables is precisely the pattern a broad multi is built to backstop. Who can skip it: someone with a varied, dietitian-reviewed diet already covering every micronutrient, or anyone who objects philosophically to pills. For everyone between, the 44-pack canister is a month and a half of insurance, packaged the way lifters have taken it for four decades.$BODY$,
  $BRAND$Animal$BRAND$, 'https://m.media-amazon.com/images/I/717B5TyuEsL._AC_SL1500_.jpg', 8.5, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'vitamins-minerals-omegas'
on conflict (slug) do nothing;
-- B01F27DUES — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01F27DUES', 'naturewise-vitamin-d3-5000', $TITLE$NatureWise Vitamin D3 5000 IU Softgels (90 Count)$TITLE$,
  $SUM$A simple 5000 IU vitamin D3 softgel for the deficiency most indoor trainers carry — small, olive-oil suspended, and third-party tested.$SUM$,
  $BODY$Vitamin D is the quiet gap in modern training diets. The body manufactures it from sunlight, which means indoor jobs, winter latitudes, gym-only training, and modest clothing coverage all push the same direction: status drops, and along with it the roles vitamin D plays in bone health, muscle function, and immune support. Blood testing is the honest way to know your own number; a daily maintenance dose is the practical way most adults address the near-universal shortfall. NatureWise's 5000 IU D3 softgels are one of the category's most-bought answers — small capsules suspended in olive oil, since D3 is fat-soluble and absorbs alongside fat by design.

Five thousand international units sounds like a lot next to the 600 IU daily value printed on food labels, but it is the standard maintenance-strength dose in the supplement space, sized for adults with low sun exposure and intended for daily use with a meal containing fat — breakfast with eggs, not a naked glass of water. The softgel format is easy to swallow, and the brand runs third-party testing on its vitamin line, which matters in a category with famously loose quality control.

For Alkemos users the tie-ins are direct. Strength trainees depend on bone mineral density — the skeleton is the machine the muscles pull on — and vitamin D alongside calcium is the structural maintenance pair. The 90-softgel bottle is a three-month supply at one per day, which keeps the per-day cost trivial.

Honest notes to keep the decision clean: D3 is fat-soluble, so it accumulates — if you have a diagnosed medical condition or take prescribed medications, coordinate with your physician on dose, and periodic blood work is the only real feedback loop. Take it with food, take it daily rather than sporadically, and store the bottle away from heat. As a straightforward, well-made maintenance D3 at a sensible strength, this is the version we point people to.$BODY$,
  $BRAND$NatureWise$BRAND$, 'https://m.media-amazon.com/images/I/714EF1AoeCL._AC_SL1500_.jpg', 8.3, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'vitamins-minerals-omegas'
on conflict (slug) do nothing;
-- B01BTBZWBU — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01BTBZWBU', 'sports-research-omega-3-fish-oil', $TITLE$Sports Research Triple Strength Omega-3 Fish Oil (1250 mg, 180 Softgels)$TITLE$,
  $SUM$A high-potency triglyceride-form fish oil: 1250 mg per softgel with concentrated EPA and DHA from wild Alaskan pollock, one capsule per meal.$SUM$,
  $BODY$Fish oil earns its place in a training stack on two legs: it is one of the few supplements with a genuinely deep research base around EPA and DHA — the two long-chain omega-3 fats — and it fills a dietary gap that is structural in modern eating. The typical Western diet is heavy in omega-6 fats and light in omega-3; fatty fish twice weekly fixes the ratio, and for everyone who does not reliably eat that fish, a concentrated softgel is the practical substitute. Sports Research's Triple Strength is the strong-value version of that substitute: 1250 milligrams per softgel in the triglyceride form — the shape the body handles best — sourced from wild Alaskan pollock, with each capsule delivering a concentrated dose of EPA and DHA that lets one softgel do the work of two or three standard ones.

What that means in practice: one capsule with breakfast and one with dinner puts a trainee squarely in the commonly used daily range for EPA and DHA, without the five-capsule routines older fish oils demanded. The brand's IFOS certification marks give the purity claims independent verification — the mercury and oxidation questions that should gate any fish oil purchase here have third-party answers, not just marketing copy.

For hard training, the interest is recovery-adjacent. Research around omega-3s and exercise recovery is genuinely promising, and the joint-comfort reports from long-term users are consistent, though the honest framing is supportive nutrition rather than a fix for anything. Muscles, nerves, and cell membranes all use these fats structurally.

The complaints file, honestly: large softgels swallow easier with food; a fraction of users notice a fishy aftertaste — keeping bottles refrigerated and taking capsules frozen helps; and blood-thinning medication makes physician coordination non-negotiable. Within the category this bottle hits the sweet spot of form, dose, verification, and price per gram of EPA and DHA. It is the fish oil we recommend without hedging.$BODY$,
  $BRAND$Sports Research$BRAND$, 'https://m.media-amazon.com/images/I/61j3BBi8AFL._AC_SL1500_.jpg', 8.7, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'vitamins-minerals-omegas'
on conflict (slug) do nothing;
-- B000BD0RT0 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B000BD0RT0', 'doctors-best-magnesium-glycinate', $TITLE$Doctor's Best High Absorption Magnesium Glycinate (200 mg, 240 Tablets)$TITLE$,
  $SUM$Chelated magnesium glycinate for evening use: gentle on the stomach, 240 tablets, and a formulation that fits the sleep-and-recovery half of training.$SUM$,
  $BODY$Magnesium is the mineral hard trainers quietly burn through. It is a cofactor in hundreds of reactions, several of which sit directly on the training-recovery path — energy metabolism in the muscle cell, nervous-system regulation, and muscle contraction itself. Sweating, stress, and high food throughput all increase losses, while the modern processed-food diet supplies less than the older one did. Doctor's Best High Absorption Magnesium puts 200 milligrams of elemental magnesium per tablet in the glycinate form — magnesium bound to the amino acid glycine — and that choice of form is the whole story of this product.

Glycinate is the form for people whose bodies complained about other forms. Magnesium oxide, the cheap version in many multis, is poorly absorbed and drags water into the gut — useful if you wanted a laxative, an expensive mistake if you wanted magnesium status. The chelated glycinate absorbs far more efficiently, so a full daily dose lands gently. The glycine attached to it is itself a calming amino acid, which is why the evening has become this mineral's traditional time slot: with dinner or an hour before bed is where most users place it, and the subjective reports — deeper sleep, fewer night cramps, steadier morning readiness — line up with how trainees describe good magnesium supplementation generally.

The 240-tablet bottle is four months at two per day, split across meals; take with food for absorption comfort. Training blocks with heavy sweat losses — summer conditioning, long endurance work — are when the mineral matters most visibly, and our recovery-oriented readers pairing it with a wind-down routine report the clearest pattern.

Honest boundaries: magnesium supplements interact with several common medications, so pharmacist sign-off matters for anyone on prescriptions; kidney conditions make self-dosing inappropriate; and the sleep effects, while commonly reported, are support rather than treatment for a real sleep disorder. As a clean, well-absorbed, correctly-formulated daily magnesium, this bottle is the standard answer.$BODY$,
  $BRAND$Doctor's Best$BRAND$, 'https://m.media-amazon.com/images/I/61A-zRQCJiL._AC_SL1500_.jpg', 8.6, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'vitamins-minerals-omegas'
on conflict (slug) do nothing;
-- B0DSQ8725Y — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0DSQ8725Y', 'vital-proteins-collagen-peptides', $TITLE$Vital Proteins Grass-Fed Collagen Peptides Powder (20 g Scoop)$TITLE$,
  $SUM$Unflavored grass-fed collagen peptides: 20 g per scoop of the structural protein tendons, ligaments, and skin are built from, disappearing into any drink.$SUM$,
  $BODY$Collagen is the protein your connective tissue is made of, and your body makes it from amino acids — but the mix it needs, rich in glycine and proline, is exactly what muscle-focused diets undersupply. Whey and meat deliver the leucine that drives muscle repair; they deliver comparatively little of the amino pattern that tendon, ligament, and cartilage maintenance runs on. Vital Proteins Collagen Peptides is the straightforward patch for that gap: hydrolyzed bovine collagen from grass-fed, pasture-raised sources, unflavored, with one 20-gram scoop dissolving into hot or cold liquids without texture or taste.

Hydrolyzed means the collagen is pre-broken into small peptides, which is why it stirs into coffee, tea, oatmeal, or a protein shake and vanishes — no gel, no clumps, no flavor. That practical invisibility is the product's quiet genius: it adds a serving of connective-tissue-relevant protein to meals that were never going to include it. The morning coffee habit becomes the delivery system.

Now the honest science framing, because this category drowns in overclaiming. Collagen is not a muscle-builder — its leucine content is low, and it does not replace a whey shake around training. The research interest sits in connective tissue: studies on collagen peptides plus vitamin C around loading exercise (the work coming from Keith Baar's group) suggests a timing strategy — taking it 30-60 minutes before connective-loading work like jumping, sprinting, or heavy lifting, with a source of vitamin C — and user reports from runners and lifters with grumbly tendons are consistently positive even where the research is still catching up. Structure and support, not cure.

Our placement: one scoop in the pre-training window for athletes with tendon history, or simply daily for anyone whose protein comes exclusively from muscle meats. It mixes, it vanishes, it costs less per month than the tub looks. That is the whole, useful story.$BODY$,
  $BRAND$Vital Proteins$BRAND$, 'https://m.media-amazon.com/images/I/71xs4jzKxoL._AC_SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'joint-bone-support'
on conflict (slug) do nothing;
-- B0D2S3ZQD6 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0D2S3ZQD6', 'nutririse-organic-ashwagandha', $TITLE$NutriRise Organic Ashwagandha Root Capsules with Black Pepper (1300 mg)$TITLE$,
  $SUM$Certified-organic ashwagandha root with black pepper extract for absorption — the adaptogen with the best stress-and-sleep research record, in a clean capsule.$SUM$,
  $BODY$Ashwagandha is the rare adaptogen whose traditional reputation and modern research file actually overlap. Used for centuries in Ayurvedic practice as a general tonic for stress and vitality, it has spent the last decade accumulating controlled trials — particularly on root extracts — around stress markers, sleep quality, and even measures relevant to strength training. NutriRise's version stays on the right side of the formulation details: certified-organic ashwagandha root (not leaf, the common cheaper cut), 1300 milligrams per serving, with black pepper extract added because piperine measurably improves how much of the active withanolides the body actually absorbs.

The mechanism worth understanding: ashwagandha appears to act on the stress-response system itself, with the most-studied association being a moderating effect on cortisol — the hormone that chronic stress keeps elevated. For trainees, that matters in a specific way. Training is itself a stressor, and recovery capacity is the budget that stress of every kind draws down. The users who report the clearest effects are those stacking life stress on top of training stress: better evening wind-down, steadier sleep, a general settling of the wired-but-tired state. In strength populations, several trials have noted improvements in recovery markers alongside the stress measures.

Dosing practically: the standard pattern is one serving daily, evening for most users, with the bottle's own labeling as the reference since extract strengths vary. Effects build over weeks rather than days — adaptogens work gradually, and a fair trial is four to six weeks, not four days.

Honest boundaries, because this category needs them: ashwagandha is not a sedative, a testosterone booster in the marketing sense, or a substitute for fixing a chronically bad schedule. Anyone with thyroid conditions, pregnancy, or prescription medications — particularly thyroid or immunosuppressant drugs — should clear it with a physician first; herb-drug interactions are real even when the herb is gentle. As a clean, organic, correctly-dosed root extract for the stress-management column of a recovery plan, this is the pick.$BODY$,
  $BRAND$NutriRise$BRAND$, 'https://m.media-amazon.com/images/I/71ZyYJJX-hL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'herbal-adaptogenic-supplements'
on conflict (slug) do nothing;
-- B0H8QQTHPJ — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0H8QQTHPJ', 'quest-chocolate-chip-cookie-dough-bars', $TITLE$Quest Nutrition Chocolate Chip Cookie Dough Protein Bars (12 Count)$TITLE$,
  $SUM$The protein bar that made the category mainstream: 20 g of milk protein isolate, heavy fiber, and a flavor that genuinely passes as cookie dough.$SUM$,
  $BODY$Quest bars are the product that proved a protein bar could be something people eat on purpose. The formula that did it is still the one to beat: 20 grams of protein per bar, anchored by milk protein isolate and whey protein isolate rather than the cheaper collagen and soy counts that pad lesser labels, plus enough soluble corn fiber to push the fiber number into double digits. Chocolate Chip Cookie Dough is the flagship flavor — dense, sweet, studded with chocolate chips, and close enough to the dessert it imitates that the microwave trick (fifteen seconds, plate, fork) became canonical bar-club advice.

The use case is the gap meal. Protein targets from our macro calculator — 1.6 to 2.2 grams per kilogram for most trainees — are easy at breakfast and dinner and quietly hard at 4 p.m., in the car, between meetings, or after a training session when a full meal is two hours away. A bar that delivers a real protein dose with 180-200 calories and behaves in a gym bag solves that slot without a cooler, a shaker, or cutlery. This is the entire practical promise of the category, and Quest keeps it better than almost anyone.

Honest notes, because no bar is free. The fiber blend that makes the texture possible is a sweetener system too — allulose and sucralose carry the sweetness, and a minority of stomachs announce their presence loudly after a full bar; new users should start with one, not two. The texture straight from the wrapper is firm — chew it cold or warm it — and the flavor catalog varies more than fans admit. Price per bar runs above the store-brand alternatives, which is the honest cost of an isolate-based label.

The comparison that matters: versus a candy bar at the same register, this is 20 grams of protein and a fraction of the sugar; versus a shaker of whey, it is shelf-stable and spoon-free. For the specific slot of portable gap-filling protein, Chocolate Chip Cookie Dough remains the benchmark most of us keep reordering.$BODY$,
  $BRAND$Quest Nutrition$BRAND$, 'https://m.media-amazon.com/images/I/81bOQhkUXFL._AC_SL1500_.jpg', 8.8, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-bars-functional-snacks'
on conflict (slug) do nothing;
-- B01I5A77GG — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01I5A77GG', 'rxbar-chocolate-sea-salt', $TITLE$RXBAR Chocolate Sea Salt Protein Bars (Pack of 12)$TITLE$,
  $SUM$The whole-food label bar: dates, egg whites, nuts, and nothing to decode — 12 g of protein in a chewy, grocery-aisle-honest format.$SUM$,
  $BODY$RXBAR entered the protein-bar world through the front of the label: instead of a chemistry panel, the wrapper lists what is inside in plain sight — dates, egg whites, almonds, cashews, chocolate, and a pinch of sea salt. That transparency was a marketing move, but it is also a nutritional statement. The bar's protein comes from egg whites, its sweetness from whole dates, its texture and fat from real nuts. Nothing requires a food-science degree to parse, which is precisely why the brand earned the shelf space it now holds in every grocery chain's health aisle.

The Chocolate Sea Salt version is the line's best balance: dark-chocolate cocoa with a salt finish that keeps the date sweetness from running flat. Each bar carries 12 grams of protein — honestly below the 20-gram bar standard — alongside a genuine whole-food calorie load of about 210. That profile fits a different slot than a Quest bar: this is a real snack, a between-meals bite with substance, a lunchbox item, a hike item. It is the bar you hand someone who "doesn't eat protein bars" and watch them finish.

The egg-white protein deserves one note: it is a complete protein with a strong amino profile, and for lactose-avoidant users it makes this the dairy-free default in the category. The date base means the sugars are real sugars — about 19 grams per bar, framed by fiber and fat from the nuts, so it eats like food rather than candy. Chewing is part of the deal; the texture is dense and unapologetically chewy.

Where we place it at Alkemos: the clean-label snack column of a meal plan, the kid-approvable protein source, and the travel fallback that doesn't read as a supplement. For post-workout mega-dosing it is the wrong tool; for eating well in the messy middle of a day, it is one of the best. Buy the 12-pack — single bars at corner-store prices are a tax on the unprepared.$BODY$,
  $BRAND$RXBAR$BRAND$, 'https://m.media-amazon.com/images/I/81Puu-myLzL._SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-bars-functional-snacks'
on conflict (slug) do nothing;
-- B0H16RX1Y1 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0H16RX1Y1', 'one-reeses-peanut-butter-lovers-bars', $TITLE$ONE Protein Bars, Reese's Peanut Butter Lovers (18 g Protein)$TITLE$,
  $SUM$The dessert-first protein bar: genuine candy-brand flavor, 18 g of protein, and a soft texture that never fights back.$SUM$,
  $BODY$ONE bars made their name on a single proposition: make the protein bar taste like the candy it is shaped like. The Reese's Peanut Butter Lovers edition is the strongest execution of that idea — a soft peanut-flavored center under a chocolate-flavored coating, built in partnership with the candy brand whose flavor profile it borrows, delivering 18 grams of protein and single-digit sugar per bar. Of the dessert-style bars on the market, this is the one that most reliably disappears when left in a shared kitchen.

The texture is the differentiator worth naming. The bar is soft — closer to a fresh candy bar than the dense taffy of fiber-heavy competitors — which makes it the pick for anyone whose jaw has filed complaints about the chewier category leaders. That softness comes with the honest trade: the fiber count is lower than Quest's, and the ingredient list leans harder on protein blends and sweeteners to hit its numbers. This is a protein bar engineered for compliance — for eating the thing, every day, gladly — rather than a fiber supplement that happens to contain protein.

The slot it fills best is the craving-management one. Every cutting phase our calorie calculator builds eventually collides with a Reese's-shaped hole in the diet plan; an 18-gram-protein, 200-calorie answer to that specific craving is a practical tool, not a gimmick. Users running flexible dieting approaches keep reporting the same pattern: the dessert-flavored bar eaten deliberately at 3 p.m. prevents the actual candy bought impulsively at 9 p.m.

Honest limits: sugar substitutes in some formulations (maltitol among them) sit poorly with a sensitive minority — trial one before committing to a box; the chocolate coating melts in a hot car or gym bag, so store like chocolate, not like a tool; and the 18-gram protein count means a scoop of whey still beats it per dollar for pure protein economics. As a compliance tool that happens to carry protein, though, it has no real rival in the cabinet.$BODY$,
  $BRAND$ONE$BRAND$, 'https://m.media-amazon.com/images/I/71h9XBrDXPL._SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-bars-functional-snacks'
on conflict (slug) do nothing;
-- B0D14XTMG1 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0D14XTMG1', 'justins-classic-peanut-butter', $TITLE$Justin's Classic Peanut Butter, Creamy No-Stir Spread (28 oz Jar)$TITLE$,
  $SUM$Honey-free classic peanut butter done the no-stir way: dry-roasted peanuts and a small palm-oil fraction, in the 28-ounce kitchen jar.$SUM$,
  $BODY$Peanut butter is the quiet staple of the muscle-gain kitchen — calorie-dense, plant-protein-carrying, endlessly useful — and the entire product category hinges on one question: what did the manufacturer add to the peanuts? Justin's Classic answers it cleanly: dry-roasted peanuts, a fraction of palm oil for stability, a pinch of salt. No sugar syrup, no hydrogenated filler. The palm-oil fraction is the "no-stir" part: it keeps the butter spreadable straight from the pantry instead of pooling oil on top like the two-ingredient natural jars that demand a fork workout before first use.

The 28-ounce jar is the kitchen-format size, and peanut butter rewards buying big — an unopened jar lasts months on the shelf, and an opened one disappears faster than any spreadsheet predicts. For our readers running a bulk, the math is friendly: two tablespoons deliver around 7-8 grams of plant protein alongside 16 grams of mostly unsaturated fat at roughly 190 calories — the cheapest smooth way to climb a calorie surplus. On a cut, the same numbers are the hazard: it is one of the most calorie-dense foods in a healthy pantry, and the tablespoon boundary is where discipline lives. Our macro calculator users know the ritual — weigh the jar before and after if honesty matters, because "a spoonful" is a unit of fiction.

In the Alkemos recipe rotation, creamy peanut butter is the workhorse: blended into the morning shake for fat and body, thinned into sauces for chicken satay style bowls, spread on the rice cakes that anchor pre-training snacks, folded into protein oatmeal that needs to survive until lunch.

Flavor-wise, the classic roast is medium and honest — less sweet than supermarket brands, more rounded than the austere freshly-ground shops. The squeeze-packs format from the same brand suits travel; this jar suits the counter. If your kitchen currently holds a sweetened "peanut spread," this is the upgrade that costs nothing at the stove and pays at the label.$BODY$,
  $BRAND$Justin's$BRAND$, 'https://m.media-amazon.com/images/I/71s4SOSQU1L._SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'nut-butters-spreads'
on conflict (slug) do nothing;
-- B0H16NHW9W — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0H16NHW9W', 'pbfit-organic-peanut-butter-powder', $TITLE$PBfit Organic All-Natural Peanut Butter Powder (30 oz)$TITLE$,
  $SUM$Pressed peanut butter with most of the fat removed: about 87% less fat than the jar, 6 g of protein per serving, and the shake-and-smoothie utility that comes with it.$SUM$,
  $BODY$PBfit solves a specific arithmetic problem. Traditional peanut butter delivers its flavor at the price of 16 grams of fat and 190 calories per two tablespoons — wonderful on a bulk, expensive on a cut. PBfit presses most of the oil out of roasted peanuts and grinds the rest into a powder: the result keeps the roasted peanut flavor and about 6 grams of protein per two-tablespoon serving while cutting the fat by roughly 87%. Reconstituted with water it behaves like a lighter peanut spread; unreconstituted it is an ingredient, and that is where it quietly wins.

As an ingredient, powdered peanut butter does things the jar cannot. It blends into protein shakes and smoothies without the gumminess of full-fat butter and without dragging 190 calories along; it mixes into oatmeal, yogurt, and pancake batter in even distribution; it dissolves into sauces and satay-style dressings for bowls where the sauce should carry flavor, not a fat macro. The 30-ounce bag holds the economy of a pantry staple — several months of daily use — and the powder format stores without separation or stirring forever.

The honest ledger: this is a fat-reduced food, and fat is not an enemy — full-fat peanut butter remains the right tool for a gaining phase and for satiety. What PBfit offers is optionality inside a fixed calorie budget. A trainee cutting at a 500-calorie deficit from our calorie calculator can keep peanut flavor across breakfast, shakes, and sauces while spending the saved fat grams on whole-food sources — eggs, olive oil, fish — that bring micronutrients along. That is not restriction; it is allocation.

Practical notes: the reconstituted spread is thinner than jarred butter — add the water slowly, and expect a lighter mouthfeel rather than a replica; the organic line is roasted darker than the original, which most users prefer in shakes; and the scoop-to-liquid ratio takes two tries to calibrate to taste. As a budget-preserving pantry tool, there is nothing else like it in the cabinet.$BODY$,
  $BRAND$PBfit$BRAND$, 'https://m.media-amazon.com/images/I/811+nneaOwL._SL1500_.jpg', 8.1, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'nut-butters-spreads'
on conflict (slug) do nothing;
-- B07QB4HNC7 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07QB4HNC7', 'wonderful-pistachios-no-shells', $TITLE$Wonderful Pistachios, No Shells, Lightly Salted$TITLE$,
  $SUM$Shelled, lightly salted pistachios — the highest-protein snack nut, pre-cracked for portion-honest snacking straight from the bag.$SUM$,
  $BODY$Pistachios are the nutritionist's snack nut, and the numbers explain the affection: per 160-calorie serving (about 49 kernels — a count the brand markets for a reason), they deliver 6 grams of plant protein and 3 grams of fiber, the strongest protein showing in the common-nut family. The fat they carry is overwhelmingly unsaturated, and the research file around pistachios as part of a balanced eating pattern is among the better-studied in the snack aisle. Wonderful Pistachios is the category's scale producer — the same grower cooperative behind most of the American crop — and their No Shells, Lightly Salted format is the one that fits a training pantry.

The no-shell decision is bigger than convenience, though convenience is real: the bag opens directly into meal-prep containers, yogurt, trail mix, and the desk drawer where shelled nuts would have remained an unfinished project. The subtle behavioral edge is portioning. Whole-shell pistachios slow the eater with work; the pre-shelled version trades that speed bump for countability — 49 kernels is a countable, honest serving, and a small kitchen scale makes it exact. Readers using our macro calculator for a cut will recognize the pattern: the foods that survive a deficit are the ones with crisp serving definitions.

The light salt matters too. Sodium is not the enemy lifting mythology made it — trainees sweating through summer blocks lose real sodium — but "lightly salted" keeps the snack compatible with the general eater while restoring a little of what training takes. The kernels are dry-roasted, which concentrates the flavor without added oil.

Uses beyond the fistful: crushed over salads and grain bowls for a protein-and-texture topper; blended into pesto-style sauces; mixed with dark chocolate chips and air-popped popcorn for the recoverable version of trail mix; scattered over oatmeal where they soften pleasantly. Storage is the one discipline — nuts carry unsaturated fats that oxidize, so the resealable bag matters, and warm kitchens should move portions to the fridge. As a shelf-stable, protein-forward snack that requires no preparation and no refrigeration, this is the desk-and-gym-bag standard.$BODY$,
  $BRAND$Wonderful Pistachios$BRAND$, 'https://m.media-amazon.com/images/I/81cpkXbZhtL._SL1500_.jpg', 8.3, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'nuts-seeds-trail-mixes'
on conflict (slug) do nothing;
-- B071KZ7GZL — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B071KZ7GZL', 'terrasoul-organic-chia-seeds', $TITLE$Terrasoul Superfoods Organic Black Chia Seeds (2.5 lb)$TITLE$,
  $SUM$Certified-organic chia in the value bag: fiber, plant omega-3 ALA, and the gel-forming seeds behind overnight puddings and hydration gels.$SUM$,
  $BODY$Chia seeds earned their kitchen permanence through one unusual physical property: they absorb many times their weight in water and form a gel. That gel is the backbone of overnight chia pudding — the meal-prep breakfast that assembles itself in the fridge — and it is also the basis of the homemade energy gels endurance runners have mixed from chia, juice, and a pinch of salt for years. Terrasoul's 2.5-pound bag is the pantry-scale version of certified-organic black chia: cleaned, dense, and consistent enough that the puddings set the same way every batch.

The nutrition column that matters most: chia is a concentrated fiber source — roughly 10 grams per two-tablespoon serving, a third of a day's target in a seed that vanishes into other foods — plus plant protein and the omega-3 fat ALA. ALA is the plant form of omega-3; the body converts a modest fraction of it to the long-chain EPA and DHA that fish oil supplies directly, so the honest framing is that chia complements a fatty-fish or fish-oil habit rather than replacing it. What the seed uniquely delivers, no conversion required, is fiber volume and the gel.

Around a training kitchen, the gel is a tool. Stirred into milk or a milk alternative with a scoop of protein powder and refrigerated overnight, chia builds a pudding that eats like dessert and carries like a meal — the single most popular breakfast our meal-prep readers photograph. Mixed thicker with lemon and a little honey, it becomes the seed gel that settles a hungry stomach before long training sessions without sitting heavy. Stirred into water with citrus, it is the original hydration-seed drink. Ground into flour, it binds pancakes and adds crunch to coatings.

Practical notes from long use: let gelled mixtures rest a full ten minutes before the first stir, then stir again — clumping is just unhydrated seeds; the 2.5-pound bag holds over ninety servings and wants a sealed jar; and start with smaller servings until your digestion tells you its opinion of that much fiber. Straightforward, cheap per serving, and endlessly useful — a pantry seed that has earned its spot.$BODY$,
  $BRAND$Terrasoul Superfoods$BRAND$, 'https://m.media-amazon.com/images/I/61DY-6RjyfL._AC_SL1110_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'nuts-seeds-trail-mixes'
on conflict (slug) do nothing;
-- B08M55QV6K — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B08M55QV6K', 'epic-beef-sea-salt-pepper-bites', $TITLE$EPIC Beef Bites, Sea Salt & Pepper (8 Count)$TITLE$,
  $SUM$Whole-muscle grass-fed beef in bite form: the zero-sugar savory protein snack for when the sweet protein bar is the wrong answer.$SUM$,
  $BODY$Every protein-snack shelf is a dessert shelf — bars in candy flavors, cookies, brownies — and there is a real hour in the training day when none of that is wanted: mid-morning between breakfast and lunch, on the trail, after a session when the palate wants salt and fat, not chocolate coating. EPIC's answer is meat treated simply: bites of grass-fed beef, seasoned with sea salt and black pepper, dried to a dense chew. The ingredient list reads like a home kitchen's, the protein is complete animal protein, and the sugar count is effectively zero — which makes it the rare savory slot-filler in a snacking landscape built on sweeteners.

The format deserves the explanation. EPIC works in the whole-muscle tradition rather than the restructured tradition — the difference between a strip of dried meat and the paste-extruded sticks most "meat snacks" are. Whole muscle chews with actual fiber texture, reads honestly on the label, and carries its fat with it: each bag of bites delivers a solid protein hit (around 8-9 grams per serving) with the satiety that fat and chew provide together. For readers assembling a low-sugar day from our macro calculator — the cutting template where every gram of sugar is budgeted — this is the snack that costs nothing from that budget.

Honest limits, stated plainly. Per gram of protein, quality meat snacks cost more than bars or whey — you are paying for animal sourcing and a shelf-stable format; the 8-count box is a trial size, and the per-unit economics improve sharply in larger packs. Sodium is meaningful (it is a salted preserved meat — a feature after sweaty sessions, a consideration for sodium-restricted diets). And the chew is genuinely dense; it is a food you eat slowly, which most users come to count as a feature.

The company's sourcing story — grass-fed, pasture-raised cattle — is part of what you are buying, and the brand's provenance in the whole-food movement explains its shelf placement next to the natural brands rather than the jerky sticks. For the savory-snack slot of a performance pantry, these bites are the cleanest answer we keep in rotation.$BODY$,
  $BRAND$EPIC$BRAND$, 'https://m.media-amazon.com/images/I/81zevw5kYeL._SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'low-sugar-diet-friendly-foods'
on conflict (slug) do nothing;
-- B0GGDY8FWD — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0GGDY8FWD', 'anthonys-blanched-almond-flour', $TITLE$Anthony's Premium Blanched Almond Flour (4 lb)$TITLE$,
  $SUM$Finely ground blanched almond flour in the bulk bag: the low-carb baking staple for protein pancakes, muffins, and crusts that stay in the plan.$SUM$,
  $BODY$Almond flour is the load-bearing wall of alternative baking, and the difference between a good one and a bad one is grind and blanching. Anthony's is blanched — skins removed before milling — and finely ground, which is why it behaves in recipes where cheap almond meal (skins on, coarse) delivers grit and green-flecked heaviness. The 4-pound bag is the baker's size: almond flour recipes burn through cups the way wheat recipes burn through pounds, and the per-ounce economics of the bulk bag are roughly half the retail-shelf alternative.

What it is: pure blanched almonds, milled. Per quarter-cup, that is around 6 grams of protein, 4 of fiber, and a fat profile dominated by monounsaturates — the nutritional opposite of the refined starch it replaces. What it is not: wheat flour with a wellness label. It has no gluten, so it binds differently; recipes need eggs or a binder to hold structure, and the results are denser, moister, and — honestly — better as vehicles for flavor than as sandwich bread.

The training-kitchen applications are where it earns its shelf. Protein pancakes that hold together without tasting like punishment; muffins where almond flour plus a scoop of whey builds a genuinely protein-dense breakfast; the base crust for protein cheesecake and bar cookies; breading for chicken strips where the crust adds protein instead of empty starch; thickener for shakes and oatmeal. Readers running lower-carb templates from our macro calculator will recognize the entire genre — this is the flour that lets those templates keep baking.

Practical notes: almond flour burns faster than wheat — drop oven temperature 25 degrees and watch the last five minutes; measure by weight for consistency (cups of almond flour vary wildly by scoop); and because it is a raw nut product, the opened bag belongs in the freezer for long storage, where it keeps for months without picking up rancid notes. For the price per pound and the consistency of the grind, this bag is the one the pantry reorders.$BODY$,
  $BRAND$Anthony's$BRAND$, 'https://m.media-amazon.com/images/I/71QmAOz2kyL._SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'specialty-baking-cooking-ingredients'
on conflict (slug) do nothing;
-- B000GG0BNE — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B000GG0BNE', 'bigelow-classic-green-tea', $TITLE$Bigelow Classic Green Tea Bags (40 ct, 6 Pack, 240 Bags)$TITLE$,
  $SUM$Plain, reliable green tea in volume: a moderate-caffeine hot drink with zero calories for the evening cut-off where coffee no longer applies.$SUM$,
  $BODY$Green tea occupies a precise slot in a training kitchen: it is the hot, mildly caffeinated, zero-calorie drink that extends the day's beverages past the coffee cut-off without wrecking the evening. Bigelow's Classic Green is the plain-spoken mass-market version of it — unflavored Chinese green tea in standard bags, sold here in the six-box pack that pushes the per-cup cost into rounding-error territory. Two hundred forty bags is roughly a quarter-year of two-a-day habit, and the boxes store flat in a drawer until opened.

The cup itself: grassy, light, faintly astringent when over-steeped, clean when timed. Green tea's character depends heavily on steeping discipline — boiling water poured hard and left for ten minutes turns any green tea bitter; water just off the boil and a two-to-three-minute steep reward with something drinkable enough to repeat daily. The moderate caffeine load (a fraction of coffee's per cup) is the practical feature: it fits the mid-afternoon slot, and pre-workout-sensitive users tolerate it where a pre-workout would be a mistake.

The honest nutrition framing: green tea is a good drink, not a fat-burner. The catechin and metabolism claims that sold the extract industry have collapsed into far more modest reality under scrutiny — enjoy the leaf, and let any thermogenic contribution be a rounding error. What it genuinely does for a physique-focused eater is behavioral: a warm, ritualistic, zero-sugar beverage that fills the hand and mouth slots where snacking impulses live, and a credible alternative to the fourth coffee. Our readers running evening-training schedules keep reporting the same pattern — the 4 p.m. green tea holds the line until dinner.

Uses beyond the mug: cold-brewed overnight in the fridge for summer training bottles; the base for homemade iced tea with lemon and a pinch of salt after heavy-sweat sessions; a poaching and rice-cooking liquid that quietly infuses jasmine-like aroma. The bags are individually foil-wrapped, which keeps the last box as fresh as the first — a detail that matters at 240-bag scale.$BODY$,
  $BRAND$Bigelow Tea$BRAND$, 'https://m.media-amazon.com/images/I/81ZMdzycRtL._SL1500_.jpg', 7.8, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'coffees-teas'
on conflict (slug) do nothing;
-- B0D7MWLD1F — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0D7MWLD1F', 'c4-sport-pre-workout', $TITLE$C4 Sport Pre-Workout Powder (Icy Blue Razz, 20 Servings)$TITLE$,
  $SUM$The mainstream pre-workout done responsibly: 200 mg of caffeine plus beta-alanine and creatine in a tub sized for daily training.$SUM$,
  $BODY$C4 is the best-selling pre-workout family on the market, and C4 Sport is its disciplined sibling — the formulation built for daily use rather than one stimulant-stacked spectacle per week. The label reads like a short course in the category's honest core: 200 milligrams of caffeine per two-scoop serving (a strong coffee's worth, not a novelty), beta-alanine for the muscle-buffering associated with higher-rep endurance, creatine monohydrate already included at a maintenance dose, and a modest nitrate-and-B-vitamin supporting cast. Icy Blue Razz is the classic execution — tart, cold-tasting, and engineered to make the pre-training ritual something you look forward to.

Timing is the entire skill of using it. Twenty to thirty minutes before training, on a stomach that is neither empty-cranking nor full, with the day's other caffeine counted honestly — the 200 milligrams here plus two coffees plus an afternoon energy drink is a sleep-destroying stack that no formulation can rescue. Evening trainers should either halve the scoop count or cut off at mid-afternoon; the label's flexibility (one or two scoops) exists precisely for this. Our workout-tracker users logging session quality see the pattern the research predicts: the first weeks deliver the clearest subjective lift, which then settles into a dependable floor rather than an escalating high — that is how an honest pre-workout behaves.

The beta-alanine note belongs in every honest review: the tingling (paresthesia) it causes is harmless, universal, and startling the first time — it is not an allergic reaction, and it fades within half an hour. Users who hate it can split doses across the day; users who don't mind it wear it as the category's handshake.

Who this is for: trainees who want the standard, well-tolerated pre-workout experience — energy, focus, a credible endurance buffer — without the grey-market stimulant arms race. Who should skip it: anyone already at their caffeine ceiling, and anyone whose doctor has opinions about stimulants. As the category's responsible default, the 20-serving tub is the right first purchase.$BODY$,
  $BRAND$Cellucor$BRAND$, 'https://m.media-amazon.com/images/I/71Y+Z1pc0jL._AC_SL1500_.jpg', 8.3, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'pre-workout-energy-formulas'
on conflict (slug) do nothing;
-- B0GHD4MSD8 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0GHD4MSD8', 'optimum-gold-standard-pre-workout', $TITLE$Optimum Nutrition Gold Standard Pre-Workout (Fruit Punch)$TITLE$,
  $SUM$The other giant's pre-workout: a mid-stimulant, fully-disclosed blend of caffeine, citrulline, beta-alanine, and creatine for daily training.$SUM$,
  $BODY$Gold Standard Pre-Workout is what happens when the company that dominates protein powder turns its label discipline to the pre-workout aisle. The result is a formulation built on the ingredients with actual research leg to stand on: caffeine at a moderate 175 milligrams per scoop for energy and focus, citrulline for the nitric-oxide pathway associated with blood flow and the "pump," beta-alanine for buffering fatigue in longer sets, and a small creatine contribution — everything disclosed in grams, nothing hidden behind a proprietary blend. That transparency is rarer than it should be in a category famous for mystery scoops.

The experience is deliberately middle-of-the-road, and that is the point. This is not a skin-tingling, heart-thumping novelty; it is a clean lift into the session — a cup and a half of coffee's worth of wakefulness, a flush of muscular fullness from the citrulline as the working sets mount, and the beta-alanine tingle that regulars stop noticing. Fruit Punch is the line's anchor flavor: sweet, tart, and stable in cold water, which matters because the drink happens on a schedule.

The daily-use framing fits the Alkemos training week better than the event framing. Program followers training four to six sessions weekly need a pre-workout that tolerates that frequency — moderate caffeine, honest doses, no exotic stimulant pile-up that forces weekend detoxes. One scoop does that job; the scoop flexibility upward exists for the tolerant, downward for the sensitive, and the tub's serving count is honest about how long it lasts at each.

Practical notes: take it 20-30 minutes out with the day's caffeine ledger in mind; the beta-alanine tingle is normal and transient; and anyone stacking this with daily creatine should count both sources rather than double-dosing out of habit. Pair it with a program that gives the energy somewhere to go — the strongest honest effect of any pre-workout is showing up for the session ready to work, and this one delivers exactly that, repeatably.$BODY$,
  $BRAND$Optimum Nutrition$BRAND$, 'https://m.media-amazon.com/images/I/718dwSBudxL._AC_SL1500_.jpg', 8.1, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'pre-workout-energy-formulas'
on conflict (slug) do nothing;
-- B01IT9NLHW — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01IT9NLHW', 'liquid-iv-hydration-multiplier', $TITLE$Liquid I.V. Hydration Multiplier Electrolyte Powder (Lemon Lime, 16 Stick Packs)$TITLE$,
  $SUM$The stick-pack electrolyte standard: a sodium-forward hydration mix designed around cellular uptake, for training days, travel, and heat.$SUM$,
  $BODY$Liquid I.V. built the modern stick-pack hydration category on a simple observation: most people drinking water all day are still mildly dehydrated, and the fix is not more water but the electrolytes that move it where it belongs. Each stick mixes into 16 ounces of water and delivers a sodium-heavy electrolyte profile — an order of magnitude more sodium than plain water, a meaningful fraction of what a sports drink carries, alongside potassium, glucose, and complementary vitamins — formulated on the principle that specific nutrient ratios drive water absorption across the gut. The brand calls it Cellular Transport Technology; the plain version is that the mix is engineered to hydrate faster than water alone, a principle with long clinical roots in rehydration science.

For training populations, the use cases stack up quickly. Heavy-sweat sessions — summer conditioning blocks, long endurance work, the hot gym with broken climate control — lose far more sodium than plain water replaces, and the performance literature ties those losses directly to perceived effort and endurance. One stick before or during the session, one after, with a third on genuinely brutal days, restores what the towel wrings out. Travel days and flights deserve their own note: the dry-cabin, coffee-and-airport cycle that lands people feeling wilted is a hydration-mix problem wearing a vacation costume. And the flavor matter: Lemon Lime is the line's best-behaved entry — citrusy, not syrupy — which matters because a hydration product only works if people finish the glass.

Honest bookkeeping: the packets carry sugar (around 11 grams) and meaningful sodium, by design — this is a functional drink, not a zero-everything water enhancer; users on sodium-restricted diets should treat it as the supplement it is. Per-stick cost is real, and buying the 16-pack is the trial format before committing to the larger boxes.

The Alkemos placement is straightforward: it lives in the training bag next to the shaker, the water tracker habit handles the baseline, and this handles the deficit days. Few products in this catalog earn their reorder rate as reliably.$BODY$,
  $BRAND$Liquid I.V.$BRAND$, 'https://m.media-amazon.com/images/I/81+tEkPxqSL._AC_SL1500_.jpg', 8.5, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'electrolytes-hydration-mixes'
on conflict (slug) do nothing;
-- B018NZJC70 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B018NZJC70', 'nuun-sport-electrolyte-tablets', $TITLE$Nuun Sport Electrolyte Drink Tablets (Lemon Lime, Tube of 10)$TITLE$,
  $SUM$Effervescent electrolyte tablets that turn a water bottle into a sports drink: low sugar, no powder mess, one tube per training week.$SUM$,
  $BODY$Nuun Sport answers the hydration question with a format instead of a formula: a tablet you drop into your own water bottle, which fizzes into a lightly flavored electrolyte drink within two minutes. The tube of ten travels flat in a gym bag pocket, survives heat, needs no scoop and no shaker hygiene, and turns any water fountain into a hydration station. For a category where powder tubs migrate to the bottom of bags and stick packs tear in pockets, the tablet tube is the cleanest delivery mechanism anyone has shipped.

The formulation is the low-sugar side of hydration. Each tablet carries a full electrolyte set — sodium around 300 milligrams, potassium, magnesium, calcium — against roughly one gram of sugar, sweetened instead with stevia and sorbitol. That positions it opposite the glucose-forward products: Nuun is for the training-day baseline, the all-day sip where a sugar load would be wrong, the hot-weather gym bottle that gets refilled twice. Hard endurance efforts needing carbohydrate fuel pair it with actual food or gels — hydration and fueling are separate problems, and this product solves only the first, honestly.

The fizz is the one technique to learn: drop the tablet, wait two minutes, and the drink is ready; sealing the bottle immediately after the drop builds a pressurized science project. Lemon Lime is the flavor that survives daily repetition best — dry citrus, minimal sweetness, no syrup film on the bottle.

The daily pattern our readers converge on: one tablet in the first bottle of a training day, plain water after, a second tablet for double sessions or heat waves. The tube empties in a training week and a half, which makes the multi-tube packs the economical reorder. Anyone whose water tracker habit is solid but whose summer sessions still end flat should trial one tube — the fix for mild chronic dehydration is usually electrolytes, not more willpower, and this is the tidiest way to carry them.$BODY$,
  $BRAND$Nuun$BRAND$, 'https://m.media-amazon.com/images/I/81Gdus5Zj4L._AC_SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'electrolytes-hydration-mixes'
on conflict (slug) do nothing;
-- B00O2BIC26 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00O2BIC26', 'clif-bloks-energy-chews', $TITLE$CLIF BLOKS Energy Chews (Strawberry, 18 Count)$TITLE$,
  $SUM$The chewable race-fuel option: 24 g of fast carbohydrate per three blocks, with caffeine-free and caffeinated flavors for endurance sessions.$SUM$,
  $BODY$Energy chews exist because gels are an acquired taste and bars are a digestion project at race pace. CLIF BLOKS split the difference: semi-solid blocks about the size of a gummy candy, each carrying 8 grams of carbohydrate from a maltodextrin-and-organic-cane-sugar blend, engineered to chew and swallow at effort without water chasers or jaw endurance. Three blocks — the sleeve's half-tube, snap-packs of three — deliver the 24-odd grams of carbohydrate per feeding that endurance fueling practice centers on. Strawberry, caffeine-free, is the platform flavor; the wider line adds caffeinated and sodium-enhanced variants for later-race hours.

The fueling logic they plug into: sessions beyond roughly 75-90 minutes deplete stored carbohydrate enough that performance measurably sags, and the fix is exogenous carbohydrate at intervals — the classic guidance lands at 30-60 grams per hour for long endurance work, more for the well-trained gut. Blocks make that arithmetic chewable, literally: a three-block feed every half hour, timed against the watch, stored in a jersey pocket or belt. Our long-session readers pair them with water (carbohydrate and fluid together, per the sports-nutrition playbook) and with the electrolyte side handled by tabs or mix — chews fuel, electrolytes hydrate, and the two columns stay separate.

Texture and tolerance are the honest differentiators. Versus gels: the chew requires saliva and a moment, which some stomachs at effort vastly prefer to a gel's swallow-and-hope; the block's pectin base sits lighter than the syrup phase for a meaningful minority. Versus candy: the carbohydrate is maltodextrin-led rather than sucrose-led, which empties from the stomach more predictably — a distinction that matters at hour three of a ride and not at the movies.

Notes: practice race fueling in training, never first on event day — the gut is trainable and deserves rehearsals; start caffeine-free flavors for afternoon sessions and keep the caffeinated variants for their labeled purpose; and the 18-count box is a season's trial before the bulk tubs make sense. The format works; the flavor is a preference; the fueling discipline is the user's half of the partnership.$BODY$,
  $BRAND$CLIF$BRAND$, 'https://m.media-amazon.com/images/I/71yIlo1-BoL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'energy-gels-chews'
on conflict (slug) do nothing;
-- B0D1PTZ1P2 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0D1PTZ1P2', 'gu-energy-original-gel', $TITLE$GU Energy Original Sports Nutrition Energy Gel (8 Count)$TITLE$,
  $SUM$The original energy gel: 100 calories of dual-source carbohydrate and aminos per packet, the endurance-race fueling standard since 1991.$SUM$,
  $BODY$GU invented the energy gel — literally; the category's first product shipped from a Berkeley kitchen in 1991 — and the Original gel remains the format's reference point: a 32-gram packet delivering about 100 calories from a maltodextrin-fructose carbohydrate pair, with branched-chain aminos, a dash of electrolytes, and a caffeine option on the flavor label. The dual-carb design is the science core: maltodextrin and fructose use different intestinal transporters, which together absorb more carbohydrate per minute than either alone — the reason modern race fueling can push beyond the glucose-only ceilings of older guidance.

The gel's contract with its user is blunt: fast carbohydrate, no chewing, no digestion queue, available in the middle of a race with one hand and teeth. Squeeze, swallow, chase with water, repeat on the watch's schedule — the classic cadence lands one packet every 20-45 minutes depending on effort, body size, and gut training. The 8-count box is exactly the trial-and-race format: enough to rehearse a long session's fueling plan across two or three training runs before event day, which is the only correct way to arrive at a start line with gels — rehearsed, never novel.

The honest file on gels as a class: texture is the barrier to entry, and GU Original sits at the syrup end — thick, sweet, and unapologetic. Most users adapt within a few sessions; a persistent minority never does and should live on chews or drink mix instead. Flavor choice matters more than newcomers expect at race intensity, when palatability narrows — buy variety before committing to a flavor by the case. And the caffeine variants are labeled for a reason; count them against the day's total like the coffee they functionally are.

For our endurance readers: pair with the water bottle (gels need fluid), respect the gut-rehearsal rule, and log fueling alongside the session in the tracker — the pattern of what sat well at which hour is personal data worth two seasons of collection. As the category's founding standard, the Original remains the default against which the newcomers measure, and it still passes.$BODY$,
  $BRAND$GU Energy Labs$BRAND$, 'https://m.media-amazon.com/images/I/81-vLambBpL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'energy-gels-chews'
on conflict (slug) do nothing;
-- B01N52CQ2O — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01N52CQ2O', 'lock-jaw-oly-barbell-collars', $TITLE$Lock-Jaw OLY 2 Barbell Collars (2" / 50 mm Olympic Bars, Pair)$TITLE$,
  $SUM$The one-hand barbell collars that made spring collars obsolete: snap-lock nylon clamps for 2-inch Olympic bars that hold through heavy drops.$SUM$,
  $BODY$Spring collars were the barbell's worst accessory for a century — fiddly, loosening mid-set, and requiring two hands and patience nobody has between squat sets. Lock-Jaw collars are the product that ended that era: engineered nylon clamps that slide onto the sleeve and lock with a single one-handed snap, releasing with a quick lever pinch. The OLY 2 model is the Olympic-bar version, sized for the standard 2-inch (50 millimeter) sleeves every serious barbell carries, sold as the pair.

The mechanical story is why they hold ratings that spring collars never approached. The clamp's jaw applies even pressure around the sleeve rather than pinching at a contact point, and the glass-filled nylon body survives being dropped with a loaded bar — a scenario spring collars treat as an early retirement. In practice: plates stay put through heavy squats and cleans, the bar can be loaded and unloaded in seconds by one person mid-circuit, and the collars survive years of the abuse that turned their predecessors into drawer junk. Every gym that has converted a single bar to Lock-Jaws has converted the rest within the month; the behavior is that consistent.

The honest use notes: the cam-lever action needs a clean sleeve — chalk and grit eventually want a rinse-off; the locking lever is the part to respect (kicking collars on with a heel is how the lever's geometry gets tested in ways it was not built for); and the 2-inch OLY size is deliberately wrong for 1-inch standard bars, so check the bar before the order. They add a few hundred grams of weight to the bar's collar rating, which matters only to the precise — and those lifters already account for collars in their math.

For the Alkemos home-gym builder, these belong in the same purchase breath as the bar itself and the first plates. Our strength programs assume plates that do not migrate mid-set; a sub-twenty-dollar pair that guarantees it is the cheapest reliability upgrade in the room. Pair them with the CAP 300-pound set in this shop and the barbell block of any of our strength programs is fully equipped.$BODY$,
  $BRAND$Lock-Jaw$BRAND$, 'https://m.media-amazon.com/images/I/81Rzk7tGRaL._AC_SL1500_.jpg', 8.7, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'barbells-plates-collars'
on conflict (slug) do nothing;
-- B00CRYJZ7Q — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00CRYJZ7Q', 'jfit-slam-ball', $TITLE$JFIT Slam Ball (No-Bounce Medicine Ball)$TITLE$,
  $SUM$A dead-weight slam ball built for exactly one job: explosive slams that train power without any bounce-back risk, in weights from 10 to 100 lb.$SUM$,
  $BODY$The slam ball is the honest version of the medicine ball: filled with dead weight and wrapped in grippy rubber, engineered NOT to bounce. That no-bounce clause is the entire product. A traditional medicine ball rebounds off the floor with unpredictable energy — fine for partner chest passes, dangerous for slam work. The slam ball absorbs the impact and dies where it lands, which lets the athlete put maximal violence into the movement without standing in the return lane.

Slams themselves are the most underprogrammed power exercise in home training. The movement is a full-body triple extension — hips, knees, ankles — driving a heavy object overhead, followed by a violent trunk flexion putting it into the floor. It trains power output with no skill barrier (unlike the Olympic lifts, which demand months of technique before they express power cleanly), no equipment beyond the ball and a floor that can take it, and a failure mode of zero risk: miss the lift, drop the ball, breathe, repeat. In our conditioning templates, slam intervals anchor the power conditioning blocks: twenty seconds of work, forty of rest, repeated until the slam velocity visibly drops — which is the session's honest stop sign.

The JFIT build is the category standard: a thick rubber shell over sand-and-shot fill, textured for a sweaty grip, in a weight ladder running from 10 up through 100 pounds. Weight selection is simpler than lifters expect: the ball should be heavy enough to feel like an effort and light enough that every rep is still fast — for most trained adults that lands between 20 and 40 pounds, with bigger frames going heavier. Overhead work wants the lower end; rotational throws and weighted carries tolerate more.

Honest notes: slam balls want a floor you both respect — concrete or rubber gym flooring, not tile or hardwood; the texture collects chalk and dust, and a wipe-down keeps the grip honest; and the shell, like all slam balls, is a consumable under daily abuse (years, not decades). As a one-purchase entry into explosive training, nothing else in this shop closes the gap between zero and power work this cheaply.$BODY$,
  $BRAND$JFIT$BRAND$, 'https://m.media-amazon.com/images/I/91+Jwu2qnPL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'functional-plyometric-tools'
on conflict (slug) do nothing;
-- B001EJMS6K — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B001EJMS6K', 'iron-gym-doorway-pull-up-bar', $TITLE$Iron Gym Total Upper Body Doorway Pull-Up Bar$TITLE$,
  $SUM$The lever-action doorway bar that needs no screws: three grip widths for pull-ups, chin-ups, and hangs, mounting in any standard door frame.$SUM$,
  $BODY$The Iron Gym bar is the most-purchased pull-up solution in history for one structural reason: it requires nothing but a door frame. The bar spans the trim with a cantilever geometry — your body weight levering it tighter into the frame as you hang — so there are no screws, no drilling, no landlord negotiations, and no holes; installation is placing the bar and doing a pull-up on it. Removal is picking it up. For renters, students, hotel-room travelers, and anyone whose training space is also a living room, that zero-install property has carried the product through two decades of copycats.

As training equipment it covers the vertical-pulling family: wide-grip pull-ups, neutral and chin-grip work from its parallel handles, and hanging — the underrated shoulder-health and grip practice our programming prescribes between strength blocks. The bar's three grip positions change the pulling mechanics honestly, and the rated capacity (300 pounds on the standard model) covers the population. On the floor, the same bar flips into a push-up base (raising the hands adds range) and a sit-up foot anchor — modest bonuses that round out a hotel-room or garage-corner setup.

The honest requirements: it needs a standard residential door frame (24 to 36 inches, with solid trim molding that protrudes a quarter inch or more to catch the cantilever lip) — apartments with flush modern trim or open doorways need the screw-mounted alternatives instead; and doorway pull-ups reward controlled reps, not kipping — the frame is not a CrossFit rig, and smooth technique is both the safe and the stronger option here.

Placement in the Alkemos equipment path: this is the first rung of the vertical-pulling ladder — the tool that builds the strength that eventually wants a rack. Our home workout programs slot it directly: grease-the-groove pull-up ladders through the day, dead hangs between desk blocks, and the chin-up progression that turns "zero pull-ups" into a set of eight over a training cycle. For the price of a pizza, the door frame becomes a training station.$BODY$,
  $BRAND$Iron Gym$BRAND$, 'https://m.media-amazon.com/images/I/51S48AlbfOS._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'power-racks-benches-pull-up-bars'
on conflict (slug) do nothing;
-- B084JQSQBJ — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B084JQSQBJ', 'incstores-foam-flooring-tiles', $TITLE$IncStores 5/8" Thick Interlocking Foam Flooring Tiles$TITLE$,
  $SUM$Interlocking EVA foam floor tiles for the home gym build-out: 5/8" of cushion and noise damping under bodyweight work, machines, and free-weight zones.$SUM$,
  $BODY$Flooring is the most-postponed purchase in home gym building, and the consequences arrive on schedule: noise complaints from the family downstairs, cracked basement concrete under dropped plates, and knees that file grievances against every floor-based exercise in the program. IncStores' interlocking tiles are the mass-market fix — 5/8-inch closed-cell EVA foam squares that puzzle together without adhesive, trim to fit with a utility knife, and convert any hard floor into a training surface over an afternoon.

The material choice is honest about what it is. EVA foam at this thickness is the comfort-and-noise layer: it cushions floor work (core blocks, stretching, kettlebell get-ups), dampens footfall and equipment shuffle for downstairs neighbors, protects the floor under machines and benches, and makes the space feel like a gym instead of a garage. What it is not is the iron-drop surface: heavy dumbbells and dropped barbells will gouge foam permanently. The honest architecture for a serious free-weight zone is rubber — thicker, denser, and priced accordingly — with these foam tiles as the surrounding field for movement work. Many home builds phase it exactly that way: foam now, rubber under the rack later, and the two surfaces coexist fine.

Installation is the genuine pleasure: the tiles lock edge-to-edge with a puzzle seam, cut cleanly with a knife against a straightedge, and reconfigure when the room's layout changes — a spare corner becomes a stretching bay by adding six tiles. Borders and corners ship with the packs to finish edges, and the wood-grain top texture reads as flooring rather than as gym matting, which matters in shared living rooms.

The maintenance file is short: seams can open slightly with big temperature swings (press back by hand), direct sunlight fades dark colors eventually, and a damp mop with mild soap keeps them clean. For the reader planning a first home gym on any budget, this is the day-one purchase that every later upgrade builds on — the floor comes first, literally.$BODY$,
  $BRAND$IncStores$BRAND$, 'https://m.media-amazon.com/images/I/81HHYO-YxYL._AC_SL1500_.jpg', 7.9, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'gym-flooring-setup'
on conflict (slug) do nothing;
-- B07BB3VQ42 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07BB3VQ42', 'gymreapers-lifting-straps', $TITLE$Gymreapers Lifting Wrist Straps for Weightlifting (Padded Cotton, Pair)$TITLE$,
  $SUM$Padded cotton lifting straps with reinforced stitching: the grip insurance for heavy rows, pulldowns, and shrugs when the back outworks the hands.$SUM$,
  $BODY$Every lifter meets the same wall on pulling days: the back and the lats can move far more weight than the fingers can hold. Grip fails first — somewhere around the third heavy row or the second set of shrugs — and the set ends early with the target muscle barely warmed up. Lifting straps exist to remove that bottleneck, and Gymreapers' padded cotton version is the category's best-selling answer: a pair of stitched cotton straps that wrap the wrist, loop the bar, and transfer the load from the fingers' pinch grip to the whole forearm's structure.

Using them takes one session to learn. Wrap the strap under and over the bar, twist it snug against the hand, and grip the bundle — the harder you squeeze, the tighter the wrap locks. From that point the bar hangs from the wrists, and the set continues until the pulling muscles quit instead of the hands. The padding at the wrist is the comfort feature that separates this model from the bare nylon versions: heavy sets press the strap against the wrist bones for minutes at a time, and the padding is what keeps that from becoming the reason the straps stay in the bag.

The honest programming rule — because strap misuse is real: use them to extend working sets for the back, not to skip grip training entirely. Deadlifts from the floor in the main strength sets should generally stay strapless (or use a mixed/hook grip) until grip strength itself is the limiting factor, because a strong grip carries into every lift and into life. Rows, pulldowns, face pulls, shrugs, rack pulls, and high-rep deadlift variations are where straps belong, and where our pulling programs expect them. Forearm and grip work earns its own slot at session's end — ninety seconds of farmer holds or wrist work, done raw.

Care notes: cotton straps stretch slightly and want a wash-cycle occasionally (air dry); the stitching at the loop is the failure point on any strap, and the reinforced bartacking here is why these outlast the no-name pairs. For the price of a single session's worth of pre-workout, the pulling day stops ending at the fingers' limit.$BODY$,
  $BRAND$Gymreapers$BRAND$, 'https://m.media-amazon.com/images/I/61+UlXddzxL._AC_SL1000_.jpg', 8.5, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'lifting-belts-straps-gloves'
on conflict (slug) do nothing;
-- B0HGBNDN25 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0HGBNDN25', 'cramer-gym-chalk-block', $TITLE$Cramer Gym Chalk Block (Magnesium Carbonate, 2 oz)$TITLE$,
  $SUM$The original performance grip aid: a 2 oz magnesium carbonate block for dry hands on the bar — the same tool weightlifting has used for a century.$SUM$,
  $BODY$Chalk is the oldest and most honest performance aid in the iron sports, and its mechanics are worth thirty seconds: magnesium carbonate absorbs the moisture that makes skin slick, and dry skin raises the coefficient of friction between hand and bar. Same hand, same bar, same lifter — with chalk, the grip holds through reps that slick skin surrenders. Weightlifting, gymnastics, climbing, and powerlifting all converged on the same white block independently, and a century later the product is unchanged because nothing needs changing: it is a mineral, pressed into a block, doing mineral work.

Cramer's 2-ounce blocks are the classic format — the same gym-class and weight-room chalk that schools and training rooms have stocked for generations. One block lasts a solo lifter months: what the hand needs is a light pass, chalk dust worked across the palms and fingers, not a theatrical cloud. A block broken into halves lives better in a chalk sock or a Tupperware container than loose in the bag, and the sock (or a small chalk ball) is the tidy option for commercial gyms that ban loose chalk — the dust is the one honest complaint the product carries, and containment solves it.

Where chalk belongs in the Alkemos training day: every heavy barbell and dumbbell session (deadlifts, rows, presses, carries), pull-up work once reps climb past singles, kettlebell high-volume blocks, and any hot-weather training where the grip question is actually a moisture question. What chalk is not: a substitute for lifting straps at the far edge of pulling volume, or an excuse to skip grip work — it removes moisture, not the strength requirement.

The comparison to alternatives is short: liquid chalk (the solvent-based kind) suits gyms with outright chalk bans at the cost of a drying sting on torn skin; gloves add a layer that thickens the bar and blunts proprioception; chalk does neither. At two ounces and pocket change per block, this is the cheapest measurable edge in the training week — and the one with the longest pedigree.$BODY$,
  $BRAND$Cramer$BRAND$, 'https://m.media-amazon.com/images/I/712DvD+KkNL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'gym-chalk-grip'
on conflict (slug) do nothing;
-- B00K1VOXYW — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00K1VOXYW', 'wod-nation-speed-jump-rope', $TITLE$WOD Nation Adjustable Speed Jump Rope (Blaze)$TITLE$,
  $SUM$A competition-style speed rope with ball-bearing handles and an adjustable cable — the tool that makes double-unders a skill instead of a lottery.$SUM$,
  $BODY$Every jump rope is a conditioning device; a speed rope is a skills instrument. The difference is in the rotation: ball-bearing swivel handles and a thin steel cable that whip through the turn with near-zero friction, letting the wrists — not the arms — spin the rope at the two-plus revolutions per second that double-unders demand. WOD Nation's speed rope is the CrossFit community's long-standing budget benchmark, built exactly on that competition geometry: adjustable cable, bearing-driven handles, and a spin fast enough that the limiting factor becomes the jumper's timing rather than the equipment's drag.

Sizing is the first-five-minutes ritual that decides everything else. Stand on the cable's midpoint and pull the handles up: for speed and double-under work, the handles should reach roughly to the nipple line — armpit length is the forgiving beginner's cut, but it caps turnover speed. The cable adjusts by loosening a collar, trimming with wire cutters, and re-locking; the adjustment is permanent, so measure twice. Beginners should resist trimming too short: the common error is a rope sized for a skilled jumper's tempo, which punishes the learning phase with constant cable catches.

The skill progression our conditioning readers run: single-unders at a relaxed cadence until five minutes unbroken is comfortable; then the double-under drill in small sets (one single, one double, repeat), letting the wrists learn the fast-flick while the feet learn the higher, slower bounce; then volume. The rope's bearings make the learning honest — every timing error catches the cable immediately, and every improvement shows up as consecutive reps the same session.

Honest notes: speed cables are thin steel — they sting on misses (part of the tuition), they wear on concrete (a mat or gym floor multiplies cable life, and replacement cables are cheap), and indoor-outdoor surface choice matters more than rope choice. As a cardio tool, the rope is unmatched per square meter and per dollar: ten minutes of intervals in a bedroom corners most treadmill half-hours. This is the rope that survives the learning curve and stays fast afterward.$BODY$,
  $BRAND$WOD Nation$BRAND$, 'https://m.media-amazon.com/images/I/819FXnNXmEL._AC_SL1500_.jpg', 8.3, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'jump-ropes'
on conflict (slug) do nothing;
-- B093LTBKFT — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B093LTBKFT', 'under-armour-undeniable-duffle', $TITLE$Under Armour Undeniable 5.0 Duffle Bag$TITLE$,
  $SUM$The training duffle that owns the locker room floor: water-resistant UA Storm fabric, a ventilated shoe tunnel, and the shoulder build that survives daily load.$SUM$,
  $BODY$The gym bag is the most abused piece of equipment anyone owns: thrown into car trunks, stuffed into lockers, filled with damp towels and shakers, and expected to survive years of it. Under Armour's Undeniable line became the locker-room default by treating that abuse as the design spec. The 5.0 generation keeps the formula: UA Storm fabric that shrugs off rain and bottle leaks, a hard-wearing base, the oversized #00 zipper, and the structured shape that stands up on the floor instead of slumping into a duffel puddle — a small thing that makes every packing moment easier.

The internal architecture is gym-native rather than luggage-generic. A large main compartment swallows training gear and a towel roll; the vented shoe tunnel at the end isolates the post-session shoes from everything else (the feature that matters most, every single day); a lined valuables pocket keeps keys, phone, and earbuds findable; and end pockets take the shaker and the chalk sock. The shoulder strap is padded and removable, the grab handles Velcro together, and the webbing is sized for the bag to be genuinely full — not decorative handles on a sack that prefers being half-empty.

Sizing honestly: the Undeniable comes in a ladder from the compact 2.0 up through the 5.0's midsize and larger sizes — the midsize is the daily-training sweet spot for one person's gear plus shower kit; the larger sizes suit team-sport weekends, two-person packing, or anyone carrying a full home-gym-in-a-bag (belt, straps, bands, rope, shoes). Our readers running morning-to-office training days pack it once: training block, shower, work section — the compartment separation is what makes the single-bag day practical.

Care is the whole durability story: the Storm coating wants a wipe-down rather than a washing machine, zippers want an occasional rinse of grit, and the bag dried open after wet-gear days will outlast its price several times over. It is not exciting equipment — it is the piece that makes every other piece portable, and the one whose absence is noticed in the first five minutes of every training day.$BODY$,
  $BRAND$Under Armour$BRAND$, 'https://m.media-amazon.com/images/I/5189Rfw0b1L._AC_SL1000_.jpg', 8.4, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'gym-training-bags'
on conflict (slug) do nothing;
-- B07PRG2CQY — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07PRG2CQY', 'manta-original-sleep-mask', $TITLE$Manta Original Sleep Mask (100% Blackout, Adjustable)$TITLE$,
  $SUM$The engineered blackout mask: adjustable memory-foam eye cups that block 100% of light without pressing on the eyes — built for side sleepers and recovery.$SUM$,
  $BODY$Sleep is the half of training that happens in the dark, and the cheapest performance upgrade in the recovery column is controlling the light in that dark. The Manta Original approaches the sleep mask as an engineering problem rather than a fabric scrap: individually adjustable eye cups of contoured memory foam on a micro-hook headband, positioned to cover each eye socket completely without resting on the eyelids — the difference between a mask you forget is on and a mask you rip off at 3 a.m.

The blackout claim is total when fitted: the cups' coverage plus the wrap means zero photons reach the eyes, which is the physiologically relevant standard — the sleep-wake system responds to light levels far below what a person consciously notices, and a leaky mask is a slow alarm clock. Total darkness supports the body's own melatonin rhythm, the hormone timeline that tells the brain when the night is deep. For our readers, the training translation is direct: deep sleep is when growth hormone pulses and when the day's muscle repair is funded; the recovery literature keeps landing on the same conclusion that our workout-tracker users' sleep logs confirm anecdotally — light discipline is among the highest-leverage sleep habits available.

Design details that earn the rating: the cups adjust along the strap to fit any eye spacing; side sleepers get the profile that stays put against a pillow; the eyelash clearance is real (no contact, no smudge for lash-owners); and the whole thing is machine washable, which every mask must eventually be. Travel is the second life — the mask turns a bright hotel room or a daytime flight into a genuine sleep window.

Honest notes: the headband adjustment is a set-and-forget ritual (size it before the first night, not during); the foam eventually compresses after a year-plus of nightly use and the replacement-cup route is the fix; and a mask cannot rescue a schedule — it removes the light variable, while caffeine timing and screen discipline handle the rest. As the single object most responsible for blackout quality in a normal bedroom, nothing else comes close.$BODY$,
  $BRAND$Manta Sleep$BRAND$, 'https://m.media-amazon.com/images/I/91j-EDBgLGL._AC_SL1500_.jpg', 8.8, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'sleep-recovery-tools'
on conflict (slug) do nothing;
-- B0BG6N7W91 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0BG6N7W91', 'prosourcefit-acupressure-mat-set', $TITLE$ProsourceFit Acupressure Mat and Pillow Set$TITLE$,
  $SUM$A spiked mat and pillow in the shakti tradition: thousands of plastic points for a daily back-and-neck release session, at the price of one massage minute.$SUM$,
  $BODY$The acupressure mat looks like a medieval instrument and works like a heavy blanket: a foam mat studded with thousands of rounded plastic spikes, sold with a matching spiked pillow, on which you lie — back first, then neck — for ten to twenty minutes at a time. The tradition it draws from is centuries old; the modern product is the practical, at-home version of a bodywork principle: broad, distributed pressure across the back's soft tissue prompts a cascade of local circulation and a settling of the nervous system that most users describe as a warm, heavy relaxation following the first minutes of very sharp adjustment.

That first period deserves the honest description, because it is the make-or-break moment. The first ninety seconds on the spikes are intense — a prickling overwhelm that the body argues with. Then something shifts: sensation blurs into warmth, the shoulders that braced against the mat release, and the session becomes something people seek out. The standard protocol from long-term users: a thin t-shirt for the first week while the skin negotiates, bare skin thereafter for full effect; start with ten minutes on the mat with the pillow under the neck; lie flat, arms open, and breathe slowly — the session is as much a wind-down ritual as it is a tool.

Placement in a training week: post-session evenings (the back and shoulders after heavy pulling days), desk-bound days spent forward over a keyboard, and the pre-sleep window where the mat's settling effect feeds directly into the night — many users fall asleep on it and move to bed drowsy. Our recovery-focused readers stack it with the sleep-mask end of the evening routine: mat for the settle, mask for the dark.

Boundaries stated cleanly: this is a comfort-and-recovery tool, not a medical device — the marketing around "pain relief" runs far ahead of the trial literature, and persistent back symptoms belong with a clinician rather than a spike mat. Skin conditions and pregnancy call for professional guidance before use. Within its honest lane — a cheap, durable, self-administered decompression ritual that costs less than a single massage session — the set has earned a decade of shelf space.$BODY$,
  $BRAND$ProsourceFit$BRAND$, 'https://m.media-amazon.com/images/I/81oejma-1uL._AC_SL1500_.jpg', 7.8, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'sleep-recovery-tools'
on conflict (slug) do nothing;
-- B0B5F9SZW7 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0B5F9SZW7', 'fitbit-inspire-3', $TITLE$Fitbit Inspire 3 Health Tracker (Midnight Zen, S/M + L Bands)$TITLE$,
  $SUM$The slim entry tracker: steps, sleep stages, heart rate and 10-day battery in a band that disappears — the habit-forming gateway to training data.$SUM$,
  $BODY$The Inspire 3 is the tracker we hand to people who "don't want another gadget" — because within a week they forget it is there, and within a month the data it quietly collected has reorganized their week. The band is feather-light and slim enough to sleep in (which is the point), the battery runs about ten days between charges, and the screen is a bright sliver that shows the time, the notifications that matter, and the daily numbers at a wrist-turn.

Those numbers are the product. Resting heart rate trends week over week — the single best cheap proxy for accumulated training stress; sleep stages with a sleep score each morning, which turns the abstract advice "sleep more" into a visible, gamified column; all-day heart rate; steps and active-zone minutes, Fitbit's honest effort to measure effort rather than mere motion. For readers pairing hardware with our tools, the pattern writes itself: the macro calculator handles the intake side, the tracker handles the expenditure and recovery side, and the two meet in the middle where decisions actually happen — the walk added after lunch, the earlier night before a heavy session, the deload week the resting-heart-rate trend quietly requested.

The honest positioning: this is the entry tier. GPS comes from the paired phone on runs (fine for most; serious runners will want watch-native GPS), the screen is small by smartwatch standards, and advanced metrics — training load, recovery scores, ECG — live on the bigger, pricier tiers of the market. What the Inspire does that those often don't is last the whole week on a charge, vanish on the wrist, and cost little enough to buy for a teenager whose habits are still forming.

Practical notes from long-term use: the stock band is decent but third-party bands are a wardrobe decision the ecosystem invites; wear it a finger's width up the wrist for the best heart-rate tracking during workouts; and the sleep data is directionally honest rather than clinically exact — treat it as a trend line, not a polysomnograph. As the first rung of the data ladder, it remains the category's most sensible door-in.$BODY$,
  $BRAND$Fitbit$BRAND$, 'https://m.media-amazon.com/images/I/51bmPvRJ18L._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'activity-sleep-trackers'
on conflict (slug) do nothing;
-- B0CT3SGHXL — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0CT3SGHXL', 'garmin-forerunner-165', $TITLE$Garmin Forerunner 165 GPS Running Smartwatch (43 mm)$TITLE$,
  $SUM$The GPS watch where Garmin's training science meets a friendly price: accurate pace, heart-rate zones, sleep, and recovery insight for runners and lifters.$SUM$,
  $BODY$Garmin's Forerunner line is what happens when a GPS company spends three decades learning how training actually works, and the 165 is the current sweet spot of that lineage: full multi-band GPS, Garmin's wrist heart-rate array, a bright AMOLED display, and — the real product — the training-logic suite that cheaper watches imitate and running coaches quietly respect. Pace, distance, and heart rate are the entry fee; the Forerunner's value is what it does with them.

The training features name-check like a coaching curriculum: heart-rate zones computed from your measured fitness rather than a wrist-chart guess; training-readiness and recovery time, which weigh the previous night's sleep against the last week's load and tell you whether today is the hard day you planned; the race predictor, whose 5K-to-marathon projections update as your fitness moves; and structured workouts — the interval session built in Garmin Connect and pushed to the wrist, the watch lapping the repeats so the runner's only job is running. For our readers, the bridge is direct: programs prescribe the intervals, the watch executes them, and the workout tracker habit inherits perfect data.

Daily-wear credentials are fully covered: sleep staging and a morning report that greets you with the recovery readout, all-day stress and heart-rate variability trends, smartphone notifications, and a battery measured in days (about eleven in smartwatch mode, half that with heavy GPS use — the honest AMOLED trade).

The honest comparison: below this price you lose the training science and the screen; above it you buy maps, music, and titanium — trimmings that do not change a single training decision. The 43 mm case fits most wrists; the 5 ATM rating survives pools and rain; and the standard band ecosystem is vast. If the training year includes a real running goal — a first 10K, a marathon, or simply the interval program on the calendar — this is the watch that makes the data side of it effortless, and the one we keep recommending without asterisks.$BODY$,
  $BRAND$Garmin$BRAND$, 'https://m.media-amazon.com/images/I/61m+fKy7wzL._AC_SL1500_.jpg', 8.9, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'fitness-smartwatches-gps-watches'
on conflict (slug) do nothing;
-- B0000CFFWN — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0000CFFWN', 'pyrex-2-cup-measuring-cup', $TITLE$Pyrex Prepware 2-Cup Glass Measuring Cup with Lid$TITLE$,
  $SUM$The 2-cup glass measuring cup every meal-prep kitchen runs on: oven-safe borosilicate, honest red lines, and a lid that turns it into a storage vessel.$SUM$,
  $BODY$If the food scale is the meal-prep kitchen's scale of justice, the 2-cup glass measuring cup is its daily workhorse — the vessel that measures, mixes, microwaves, pours, and then stores what it made. Pyrex's Prepware version is the century-old archetype: thick tempered glass with bold red graduations (cups and milliliters), a spout that pours clean, a comfortable handle, and now a fitted lid that converts the measuring session into refrigerator storage without decanting.

The material story is why the brand owns the drawer. The glass is thermal-shock resistant: it moves from pantry to microwave to oven-adjacent counter without the plastic warping, staining, or aromas that make measuring cups smell like last month's protein pudding. It does not scratch into opacity the way plastic marks up, so the red lines stay readable for years of use, and the whole thing runs through the dishwasher forever. The 2-cup size is the everyday maximum — shakes, pancake batter, sauces, overnight-oats milk, the broth for a soup that feeds two — while staying small enough to weigh nothing in the hand.

Where it sits in the Alkemos kitchen stack: next to the food scale in every meal-plan photo our readers share, and for the same reason — portion mathematics is the entire discipline. Our macro calculator outputs grams; the scale handles the solids; the measuring cup handles the liquids (one fluid ounce of milk is a gram-level question when the day repeats three hundred times a year); and the lid makes the second half of the batch tomorrow's ready portion. The bundle of glass-plus-scale is the cheapest precision upgrade in nutrition, and this cup is the half that also cooks.

Honest notes: the glass is breakable against tile — respect gravity, and the replacement lid is the part that goes missing in moves; the red markings on very old units fade after years of dishwasher abrasion (a decade-scale complaint); and boiling-liquid-to-frozen-sink shocks exceed what any glass deserves. Used like a tool instead of a toy, this is a buy-once object that outlasts the kitchen it was bought for.$BODY$,
  $BRAND$Pyrex$BRAND$, 'https://m.media-amazon.com/images/I/61yanb+40iL._AC_SL1200_.jpg', 8.6, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'prep-tools-accessories'
on conflict (slug) do nothing;
-- B0785MTQDS — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0785MTQDS', 'nike-everyday-cushioned-crew-socks', $TITLE$Nike Everyday Cushioned Crew Training Socks (6 Pair)$TITLE$,
  $SUM$The six-pack training sock: Dri-FIT moisture handling, cushioned footbed, and a crew height that anchors in place through squats, runs, and errands.$SUM$,
  $BODY$Socks are the most replaced item in a training drawer, which makes the six-pack the only sensible format: buy the set, retire the drawer's retired veterans, and stop thinking about socks for a year. Nike's Everyday Cushioned Crew is the mass-market answer that keeps winning the slot — a synthetic-blend construction with Dri-FIT moisture management, a cushioned footbed through the heel and forefoot, and a crew height that sits clear of the shoe collar and stays there.

The training-specific engineering is in the details that non-training socks skip. The cushioning under the foot is compression-mapped where the foot loads — heel strike, ball of the foot — rather than uniformly stuffed, which keeps the sock's bulk constant inside the shoe while the impact zones get the padding. The arch band gives a light wrap that stops the sock from migrating during lunges and rope work (the mid-set bunch under the arch is a universal small misery this design eliminates). The ribbed crew shaft anchors above the ankle so the heel does not creep down into the shoe during squats — the failure mode that ends cheap socks' careers in a month.

Fiber honesty, because it matters: these are predominantly polyester-spandex, not cotton — which is the correct choice for training. Cotton absorbs sweat, stays wet, and rewards the wearer with blisters and a laundry-day smell that never fully leaves; synthetics wick, dry fast, and survive the hot wash that hygiene prefers. The everyday name is about the use pattern, not the fabric compromise.

Care and lifecycle: machine wash warm, no bleach, no fabric softener (softener coats the fibers and kills the wicking — the single most common way good socks are ruined), tumble dry low. The six-pair rotation gives each pair rest days, which extends elastic life noticeably versus daily wear of two pairs. When the heel cushioning flattens — eighteen months to two years of regular use — the pack price makes replacement a rounding error rather than a decision. Underfoot is where every session starts; this is the quiet infrastructure done right.$BODY$,
  $BRAND$Nike$BRAND$, 'https://m.media-amazon.com/images/I/51BePVaaJAL._AC_SL1025_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'socks-base-layers'
on conflict (slug) do nothing;
-- B0BHBP1X1B — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0BHBP1X1B', 'simple-modern-40oz-tumbler', $TITLE$Simple Modern 40 oz Tumbler with Handle and Straw Lid$TITLE$,
  $SUM$The 40-ounce insulated tumbler with handle and straw: double-wall steel that keeps ice overnight and makes the daily water target self-measuring.$SUM$,
  $BODY$The 40-ounce tumbler became a cultural object for a functional reason: it converts hydration from a habit requiring attention into an object requiring refills. Simple Modern's version carries the full spec set — double-wall vacuum-insulated stainless steel, a carry handle sized for real hands, a straw lid with a pleasant sip resistance, and a tapered body that fits cup holders despite the volume — at a price that undercuts the brand-name tier while matching the performance claim for claim.

The insulation is the honest headline: cold stays cold for a day and ice survives overnight in a warm room, which means the last third of the bottle is still a drink rather than a disappointment. The 40-ounce capacity turns arithmetic into the product itself — our water-tracker users know the math: three refills clears 120 ounces for the day, two clears 80 with meals adding the rest; the bottle becomes its own progress bar, and the handle-plus-straw combination removes every micro-friction (carry, open, tip) that the busy day uses as excuses.

In a training day, the placement writes itself: the full tumbler on the desk through the work block, the refill at lunch, the one during the training session itself — where the straw lid earns its keep against the splashy open-mouth chug that half-empty bottles demand mid-circuit. The powder-coated exterior keeps grip when hands are damp and hides the scuffs of daily travel; the lid disassembles for actual cleaning (the straw collar and gasket are the parts that want attention weekly, and a neglected straw lid is the category's one recurring hygiene complaint).

Care notes that matter: the steel body is hand-wash-preferred to protect the coating, the lid and straw are top-rack dishwasher safe, and carbonated drinks belong in the flip lid, not the straw (a lesson everyone learns once, memorably). It does not purify, filter, or mineralize — it is a thermos with excellent manners. As the single object most responsible for whether the daily water number gets met, this format has already won the argument; this is the value-tier execution of it.$BODY$,
  $BRAND$Simple Modern$BRAND$, 'https://m.media-amazon.com/images/I/41XQiDSIDWL._AC_SL1500_.jpg', 8.7, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'flasks-tumblers-travel-mugs'
on conflict (slug) do nothing;
-- 1492544809 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, '1492544809', 'periodization-theory-and-methodology', $TITLE$Periodization: Theory and Methodology of Training$TITLE$,
  $SUM$The textbook that named the field: Bompa and Haff's periodization bible — the reference coaches and serious lifters keep returning to.$SUM$,
  $BODY$Every training plan that divides the year into phases — hypertrophy blocks, strength blocks, peaking, deloads — is speaking a language this book codified. Tudor Bompa's Periodization, now in its later editions with Michael Haff, is the academic root of modern program design: the text that took training organization from folklore to a writable theory, and the reference behind essentially every structured program on the internet, including the block structures our own programs use. Reading it is finding the source of the river.

What the book actually delivers, honestly framed: this is a textbook, not a beach read. It walks the theory of adaptation, the logic of dividing training into mesocycles and microcycles, the manipulation of volume and intensity across phases, and the application of the whole system to strength and power sports. The writing is dense and the chapters reward note-taking; the payoff is that afterward, every training question changes shape. Why is this block five weeks? Why does intensity climb while volume falls? Why does a deload exist? A lifter who has internalized this book can answer those for themselves — and can read a coach's program with an informed eye instead of blind faith.

The practical reading paths our readers take: the serious one, cover to cover across a training cycle with the current program open beside it (the book's concepts land differently when checked against a block you are actually running); and the targeted one — the strength-and-power chapters plus the annual-planning chapters — for the self-coached intermediate who wants to design their own next cycle responsibly. In both cases the reader comes out the other side with the vocabulary of training stress, recovery, and adaptation, which is the vocabulary our workout tracker logs are quietly written in.

Caveats worth their paragraph: the physical book is priced like the academic text it is, and the math-light reader can feel the density; several chapters serve students of coaching science more than gym-goers. But as the single volume that explains why periodized training outperforms randomness — with the research base to back it — it has no peer on the shelf. For the lifter ready to graduate from following programs to understanding them, this is the graduation gift.$BODY$,
  $BRAND$Tudor Bompa$BRAND$, 'https://m.media-amazon.com/images/I/71Z7kKszukL._AC_SL1500_.jpg', 8.8, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'fitness-nutrition-books'
on conflict (slug) do nothing;
-- 0692858237 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, '0692858237', '531-forever-book', $TITLE$5/3/1 Forever: Simple and Effective Programming for Size, Speed and Strength$TITLE$,
  $SUM$Jim Wendler's complete 5/3/1 programming manual: the training philosophy, the templates, and the leadership notes — from the source of the system.$SUM$,
  $BODY$5/3/1 Forever is the definitive collection of Jim Wendler's training system — the program built around four lifts, ascending percentage waves, and the patient logic of training for strength across years rather than Instagram cycles. Where the original 5/3/1 e-books introduced the math, Forever assembles the whole mature system: the foundational waves, the dozens of templates Wendler has used with athletes and lifters, the conditioning philosophy, and the adjustments — anchors, leaders, deloads — that let one simple skeleton carry a decade of training.

The system's core idea deserves the summary, because it explains the book's cult following. The main lifts — press, squat, bench, deadlift — train on a rolling percentage scheme that recycles every few weeks with a built-in rep-out test, so progress is measured in repetitions at weight rather than constant max-chasing. Training maxes are deliberately conservative and drift upward slowly, which is the design's quiet genius: it keeps every session trainable, builds recovery into the arithmetic, and lets consistency — the only variable that actually matters over years — survive contact with real life. Lifters who came up on random intensity find the discipline strange for three weeks and then never leave.

The templates are the practical bulk of the book: variations for size, for strength peaking, for athletes who run and jump alongside lifting, for lifters with four days and for lifters with two, and the programming of assistance work in Wendler's no-nonsense register. Our readers running strength blocks will recognize the structure immediately — Forever is the book to hand the intermediate who asks "how do I write my own next block?" and means it.

Honest notes: Wendler writes like a coach, not a textbook author — direct, funny, allergic to jargon — which readers either love or need a chapter to adjust to; the book is self-published with the layout that implies; and it assumes familiarity with the basic lifts and their training. Pair it with our gym-strength programming and a log, and the annual plan effectively writes itself. Of every book in this shop, this is the one most likely to still be in use, heavily annotated, ten years from now.$BODY$,
  $BRAND$Jim Wendler$BRAND$, 'https://m.media-amazon.com/images/I/41HtHcSY4DL._AC_SL1500_.jpg', 8.9, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'fitness-nutrition-books'
on conflict (slug) do nothing;
-- B00DT5FIYQ — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00DT5FIYQ', 'beyond-531-kindle', $TITLE$Beyond 5/3/1: Simple Training for Extraordinary Results (Kindle Edition)$TITLE$,
  $SUM$The digital-only 5/3/1 expansion in Kindle form: the beyond-programming concepts, readable on any device, delivered the minute you buy it.$SUM$,
  $BODY$Beyond 5/3/1 is Wendler's digital-era expansion of his system — the Kindle-only volume where the programming moves past the original waves into the territory serious 5/3/1 users eventually need: multiple leaders-and-anchors structures, the joker-and-first-set-last logic, training approaches for different athlete types, and the conditioning work that keeps the engine underneath the strength honest. As a Kindle edition it lands on whatever device is in your bag the moment after purchase — which suits the book's role as a working reference rather than a shelf object.

The digital format earns its place honestly for training literature. Program books are read twice: once through, then weekly, mid-plan, with gym-bag hands — "what's the anchor structure again?", "which week does the TM reset?" A Kindle copy makes that second life frictionless: searchable text, sync between phone and reader, and highlights that survive being thrown into the gym bag. Buyers already running the 5/3/1 arithmetic from Forever will find Beyond deepens the toolkit rather than replacing it — the original system's logic carries through, with more rooms added to the house.

Content-wise, the honest summary: this is a book of programming concepts in Wendler's usual blunt voice, aimed at the lifter who has run vanilla 5/3/1 and wants the next layer of options — templates for different schedules and goals, plus the author's running commentary on training culture, effort, and the long game. It is not a beginner's introduction (that's the earlier material), and it assumes the reader already speaks the system's language.

The commission-relevant category note, stated plainly because we keep our store honest: Kindle purchases through Amazon link and track like any other product; the reading happens in the free Kindle app on any phone, tablet, or browser — no Kindle device needed. For our readers who want their training library in their pocket, this is the format that makes sense, and this volume is one of the few genuine training-program books sold that way.$BODY$,
  $BRAND$Jim Wendler$BRAND$, 'https://m.media-amazon.com/images/I/A1kJhYdKpOL._SL1500_.jpg', 8.4, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'digital-guides-ebooks'
on conflict (slug) do nothing;
-- B0BG7WY5BW — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0BG7WY5BW', 'hardcover-fitness-journal', $TITLE$Hardcover Fitness Journal and Workout Planner (A5, Sturdy Log Book)$TITLE$,
  $SUM$A structured hardcover training journal: pre-printed pages for exercises, sets, reps, weight and notes — the analog device that makes progress visible.$SUM$,
  $BODY$The training log is the cheapest performance tool ever invented, and the research on self-monitoring has been agreeing with gym folklore for decades: trainees who record their work outperform trainees who estimate it. The mechanism is unglamorous — a written log makes progression visible, makes deloads obvious, and quietly shames the ego-lifting that untracked training drifts into. This hardcover journal is the analog implementation of that principle: an A5 (5.7 by 8.3 inch) bound book with pre-printed training pages — exercise rows, set and rep and weight columns, space for notes and goals — built stiff enough to survive the gym bag and the bench-side floor.

The format decision is the product. A hardcover lies flat on the bench between sets, takes pencil and pen equally, needs no battery, no syncing, and no subscription — and unlike an app, a journal never buzzes with anything except your own last session. The pre-printed structure does one more job worth naming: it standardizes what gets recorded, which is where most self-tracking fails. Blank notebooks decay into vague entries ("push day, felt strong"); structured pages enforce the columns that later sessions will be measured against. Our workout-tracker users run digital logs and report the same insight paper people do: the record is what turns training into a conversation with last month's self.

The system to run with it is older than any app: write the plan before the session (from our programs or your own), record each working set as completed, note the honest subjective line at the bottom, and review last cycle's pages before writing next cycle's. That loop — plan, record, review — is the entire discipline, and the journal is the physical loop-closer.

Honest notes: the A5 size splits the difference between portable and writable, favoring gym-bag realism; the page count carries roughly four to six months of four-sessions-a-week training; and the hardcover wants a dry corner of the bag rather than the shaker-bottle pocket — gravity and water remain the enemies of all paper. As the entry ticket into measured training, it is the least expensive meaningful upgrade in this catalog.$BODY$,
  $BRAND$Nextnoid$BRAND$, 'https://m.media-amazon.com/images/I/61U4D7oF96L._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'training-logs-planners'
on conflict (slug) do nothing;
-- B011NQYTII — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B011NQYTII', 'gaiam-premium-yoga-strap', $TITLE$Gaiam Premium Yoga Strap with Adjustable Metal D-Ring (8 ft)$TITLE$,
  $SUM$The classic 8-foot cotton strap with a metal D-ring: partner-free stretching leverage for hamstrings, shoulders, and everything the desk shortened.$SUM$,
  $BODY$A stretching strap is leverage you buy once and use for decades: eight feet of heavy cotton webbing with a metal D-ring at one end, and nothing else. The D-ring is the entire mechanism — thread the strap through, cinch to length, and the far foot or hand gains a handle the arm can pull. Hamstring stretches become gradual, self-graded tension instead of bouncing; shoulder work becomes possible without a partner's hands; the calf stretch against the wall gets precise. It is possibly the simplest object in this catalog, and the one with the highest ratio of mobility gained per dollar spent.

Gaiam is the brand that put this item in every yoga studio in the West, and the Premium strap is their heavy version: thick woven cotton with a texture that grips sweaty hands, and a substantial cast-metal D-ring that sets the cinch and holds it — the two failure points of cheaper straps (webbing that slicks, rings that bend or slip) are the two points this build spends its money on. The 8-foot length is the standard for good reason: at 6 feet, long-limbed users run out of strap in the classic lying hamstring stretch; at 8, everyone reaches full position with wrapping to spare, and the excess doubles as grip comfort in the hands.

For the Alkemos training day, the strap slots into the mobility blocks our programs prescribe: the post-session lower-body sequence (hamstrings, calves, adductors, hip flexors — each held a relaxed 30 to 90 seconds), the desk-worker's shoulder and thoracic openers, and the pre-squat routine that turns "hips feel like rust" into workable depth. The technique is always the same and always worth restating: the strap supplies gentle tension, the muscle supplies the release, and breathing supplies the clock — the strap never yanks.

Care notes from long service: cotton webbing is machine-washable (cold, air dry, and the D-ring survives fine); the strap rolls to the size of a fist for the gym bag's side pocket; and a periodic check of the ring's stitching — the one wear point on any strap — takes five seconds and a decade of margin. Teamed with a mat and ten minutes, it is the mobility habit's whole equipment list.$BODY$,
  $BRAND$Gaiam$BRAND$, 'https://m.media-amazon.com/images/I/514PSaRlOvL._AC_SL1500_.jpg', 8.4, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'stretching-mobility-equipment'
on conflict (slug) do nothing;
-- B0DWFXFS8C — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched; title + image read from the live page; image machine-vision-checked person-free)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0DWFXFS8C', 'hanes-cool-dri-performance-t-shirt', $TITLE$Hanes Men's Cool DRI Performance T-Shirt (Moisture-Wicking)$TITLE$,
  $SUM$The honest workhorse training tee: moisture-wicking Cool DRI polyester in a classic cut, at the multipack price that lets the laundry cycle decide nothing.$SUM$,
  $BODY$The training t-shirt is a consumable, and pretending otherwise is how drawers end up full of $35 shirts that are too precious to sweat in. Hanes' Cool DRI tee is the opposite philosophy: a moisture-wicking polyester shirt in a plain crew cut, built for the function list — wick, dry, survive the wash, repeat — and priced so that owning five is a stocking decision rather than a budget line. The fabric is the Cool DRI knit: a synthetic that pulls sweat off the skin and spreads it to evaporate, where a cotton shirt absorbs, weighs down, and chills.

In a training week the difference is not subtle. Cotton at effort becomes a wet, heavy, chafe-prone layer that stays damp through the session and smells of every session it ever served; performance polyester stays light, dries in minutes, and — the part cold-morning runners notice — stops the post-sweat chill that a soaked shirt guarantees. For our readers training in shared or warm gyms, running outdoor blocks, or stacking a training session before errands, the quick-dry tee is the difference between one shirt per day and one per session.

The cut is the classic Hanes men's fit through the chest and shoulders with a straight body — unshaped, unhyped, and layerable under a hoodie on the walk to the gym. The multipack economics do the quiet strategic work: a rotation of five means each shirt rests between wears (elastic and weave both last longer), laundry-day pressure stops dictating training days, and the shirt sacrificed to chalk and grass-stains outdoors is a shrug instead of a loss.

Care is the whole longevity story for synthetic performance wear: machine wash warm, and skip the fabric softener — softener residues coat the fibers and defeat the wicking, which is the single most common way good performance tees are quietly ruined. No bleach, tumble low, and the shirts serve for years of hard rotation. It is not the tee for the mirror selfie; it is the tee for the several thousand sets that precede it. The drawer deserves both kinds, and this is the one that multiplies.$BODY$,
  $BRAND$Hanes$BRAND$, 'https://m.media-amazon.com/images/I/61KmGDNynmL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'mens-training-apparel'
on conflict (slug) do nothing;

-- ============================================================
-- 5) surface bindings (tool / equipment_hub / program — EN only)
-- ============================================================

insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-gold-standard-whey'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-gold-standard-whey'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'vega-premium-plant-protein'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'meal-planner' from public.affiliate_store_products p where p.slug = 'vega-premium-plant-protein'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-gold-standard-casein'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-micronized-creatine'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-micronized-creatine'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-amino-energy'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-amino-energy'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'animal-pak-multivitamin'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'animal-pak-multivitamin'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'naturewise-vitamin-d3-5000'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'sports-research-omega-3-fish-oil'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'doctors-best-magnesium-glycinate'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'vital-proteins-collagen-peptides'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'nutririse-organic-ashwagandha'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'quest-chocolate-chip-cookie-dough-bars'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'quest-chocolate-chip-cookie-dough-bars'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'rxbar-chocolate-sea-salt'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'one-reeses-peanut-butter-lovers-bars'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'one-reeses-peanut-butter-lovers-bars'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'justins-classic-peanut-butter'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'justins-classic-peanut-butter'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'pbfit-organic-peanut-butter-powder'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'pbfit-organic-peanut-butter-powder'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'wonderful-pistachios-no-shells'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'terrasoul-organic-chia-seeds'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'terrasoul-organic-chia-seeds'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'epic-beef-sea-salt-pepper-bites'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'anthonys-blanched-almond-flour'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'anthonys-blanched-almond-flour'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'bigelow-classic-green-tea'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'c4-sport-pre-workout'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'c4-sport-pre-workout'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'optimum-gold-standard-pre-workout'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'optimum-gold-standard-pre-workout'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'liquid-iv-hydration-multiplier'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'liquid-iv-hydration-multiplier'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'nuun-sport-electrolyte-tablets'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'clif-bloks-energy-chews'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'clif-bloks-energy-chews'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'gu-energy-original-gel'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'gu-energy-original-gel'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'barbell' from public.affiliate_store_products p where p.slug = 'lock-jaw-oly-barbell-collars'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'lock-jaw-oly-barbell-collars'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'bodyweight' from public.affiliate_store_products p where p.slug = 'jfit-slam-ball'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'jfit-slam-ball'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'iron-gym-doorway-pull-up-bar'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'bodyweight' from public.affiliate_store_products p where p.slug = 'iron-gym-doorway-pull-up-bar'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'machine' from public.affiliate_store_products p where p.slug = 'incstores-foam-flooring-tiles'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'incstores-foam-flooring-tiles'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'barbell' from public.affiliate_store_products p where p.slug = 'gymreapers-lifting-straps'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'dumbbell' from public.affiliate_store_products p where p.slug = 'gymreapers-lifting-straps'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'gymreapers-lifting-straps'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'barbell' from public.affiliate_store_products p where p.slug = 'cramer-gym-chalk-block'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'cramer-gym-chalk-block'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'wod-nation-speed-jump-rope'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'wod-nation-speed-jump-rope'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'under-armour-undeniable-duffle'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'manta-original-sleep-mask'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'prosourcefit-acupressure-mat-set'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'fitbit-inspire-3'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'bmi-calculator' from public.affiliate_store_products p where p.slug = 'fitbit-inspire-3'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'garmin-forerunner-165'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'garmin-forerunner-165'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'macro-calculator' from public.affiliate_store_products p where p.slug = 'pyrex-2-cup-measuring-cup'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'calorie-calculator' from public.affiliate_store_products p where p.slug = 'pyrex-2-cup-measuring-cup'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'nike-everyday-cushioned-crew-socks'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'nike-everyday-cushioned-crew-socks'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'water-tracker' from public.affiliate_store_products p where p.slug = 'simple-modern-40oz-tumbler'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'periodization-theory-and-methodology'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'periodization-theory-and-methodology'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = '531-forever-book'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = '531-forever-book'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'beyond-531-kindle'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'beyond-531-kindle'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'tool', 'workout-tracker' from public.affiliate_store_products p where p.slug = 'hardcover-fitness-journal'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'hardcover-fitness-journal'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'gaiam-premium-yoga-strap'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'equipment_hub', 'bodyweight' from public.affiliate_store_products p where p.slug = 'gaiam-premium-yoga-strap'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-strength' from public.affiliate_store_products p where p.slug = 'hanes-cool-dri-performance-t-shirt'
on conflict (product_id, surface_type, surface_key) do nothing;
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'home-workout' from public.affiliate_store_products p where p.slug = 'hanes-cool-dri-performance-t-shirt'
on conflict (product_id, surface_type, surface_key) do nothing;

-- ============================================================
-- 6) reload the PostgREST schema cache (the new column serves
--    immediately — the 0118 closing pattern)
-- ============================================================
notify pgrst, 'reload schema';

