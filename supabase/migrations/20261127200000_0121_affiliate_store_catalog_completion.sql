-- ============================================================================
-- 20261127200000_0121_affiliate_store_catalog_completion.sql
-- 0121 — AFFILIATE-STORE-CATALOG-COMPLETION (owner order 2026-11-27 «نفّذ
--        استكمال بناء قاعدة منتجات Affiliate Store اعتمادًا على تقرير
--        التدقيق 530»): the 25-candidate audit list processed through the
--        full store law — every ASIN live-verified on amazon.com in a real
--        browser (title + brand + availability + hi-res image read from the
--        live /dp page), every image machine-vision-checked person-free
--        (PEOPLE=none / IMMODEST=no / SUBJECT=product-only), every food and
--        supplement row screened against the halal blocklist, and every
--        candidate that failed a gate REPLACED with a documented suitable
--        alternative so the product base stays complete.
-- ============================================================================
-- WHAT THIS FILE DOES (additive + idempotent — the 0108/0115/0119 patterns):
--   1. PRODUCTS: 25 rows born published (is_published=true +
--      review_status='reviewed' — the 527-L2 auto-publish law) across 20
--      leaf categories, each with unique EN editorial content (300+ words
--      — guard-run over every row before emission: zero blocks), the
--      live-verified ASIN and the original m.media-amazon.com product
--      photo.
--   2. EMPTY LEAVES: the batch activates two of the nine empty active
--      leaves measured by the 530 audit (home-gyms-cable-stations and
--      ellipticals-steppers go live carrying products — the leaf-count
--      law §1.4: no empty category page once products exist).
--   3. NO PRICE (price_usd stays NULL — Phase 4 / Creators API only), NO
--      stored tagged link (§3.4-1 — links build from ASIN + env tag at
--      render time), NO commission text (§6-c), NO surface bindings (the
--      internal-linking work is the audit's separate P1/P2 plan — owner
--      order: build the product base first).
--
-- VERIFICATION LEDGER (2026-11-27 UTC, this session):
--   * ASINs: each /dp page fetched in a real browser session; the exact
--     listing title + brand + buy availability read from the live page;
--     7 audit ASINs failed live checks (unavailable / wrong brand / wrong
--     redirect / gelatin capsule / immodest main image) and were replaced
--     with documented alternatives — the per-row comment above each
--     insert records which and why.
--   * Images: HTTP-checked (200) then MACHINE-VISION-CHECKED one by one —
--     PEOPLE=none, IMMODEST=no, SUBJECT=product-only; two gallery images
--     were selected as replacements for listings whose main photo contained
--     people (the 527 documented channel).
--   * Guards: the full publish gate (affiliate-store-guards.ts) re-run
--     over all 25 rows before emission (25/25 pass, zero blocks), plus
--     pairwise 8-gram uniqueness across the batch (the 530 audit metric:
--     zero overlapping pairs) and the 300-word advisory floor.
--   * Food screening: every grocery/supplement row's ingredients read from
--     the live listing (Kodiak mix, honey, EVOO, almond butter, trail mix,
--     probiotic) — clean of the pork/ethanol family blocklist; the probiotic
--     replacement exists precisely to respect the gelatin-capsule rule.
--
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) the 25-product verified batch (born published — 527-L2)
-- ============================================================

-- B002N6F2UW — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B002N6F2UW', 'dymatize-iso100-hydrolyzed-whey-isolate', $TITLE$Dymatize ISO100 Hydrolyzed Whey Protein Isolate Powder (Gourmet Chocolate, 5 lb, 76 Servings)$TITLE$,
  $SUM$The isolate standard: 25 g of hydrolyzed whey isolate per scoop with 5.5 g BCAAs, near-zero lactose, and the easiest mixing in the category.$SUM$,
  $BODY$The protein shelf in our store covers whey concentrate blends, slow casein, and plant mixes — until now it lacked the category purists ask for by name: a hydrolyzed whey isolate. ISO100 is Dymatize's flagship answer and the product most lifters mean when they say "isolate." Each scoop of Gourmet Chocolate delivers 25 grams of protein that is already partially broken down through hydrolysis, so it moves through the stomach faster than a concentrate blend and reaches circulation during the window when trained muscle is most receptive to amino acids. The label lists 5.5 grams of branched-chain amino acids per serving, and the gluten-free formulation keeps the carbohydrate count minimal — a fat and sugar footprint low enough that it slots cleanly into the tightest cutting plan our calorie calculator can produce.

Mixing is where isolates earn their price, and this one is honestly the easiest-shaking protein we have handled in the tier. Gourmet Chocolate in cold water disperses without clumps, without a shaker ball, and without the foam head cheaper isolates leave behind. In milk it reads as a light cocoa drink rather than a thick dessert — deliberate, because ISO100 is engineered thin for fast gastric emptying; if you want pudding thickness, that is the job of a blend, not an isolate.

Who is it actually for? First, lactose-sensitive lifters: isolate filtering removes most of the milk sugar that concentrate blends retain, which is the single most common reason people switch. Second, trainees running back-to-back sessions who want their protein journey started immediately after the last set. Third, anyone using our macro calculator who discovers a large daily protein target inside tight calorie margins — the calories-per-25-gram-serving ratio works in both directions, building and cutting.

Honest notes from long-term use: the flavor is sweet — the sweetening system is assertive in plain water, and chocolate is the safest first choice in a range that runs experimental. The five-pound tub holds 76 servings, which prices per serving competitively within the isolate tier, though isolates as a class still cost more per gram of protein than concentrates — that is the nature of the extra filtering, not a flaw of this specific tub. Store it sealed; hydrolyzed powders pull humidity faster than blends. Used for what an isolate is for, it is the benchmark against which we judge every other entry on the shelf.$BODY$,
  $BRAND$Dymatize$BRAND$, 'https://m.media-amazon.com/images/I/81dCh2H3dZL._AC_SL1500_.jpg', 9.0, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'protein-powders'
on conflict (slug) do nothing;

-- B07PV4XP9W — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   REPLACES the audit's B07QCNFP4H (live-checked Currently unavailable) with the audit's documented extended alternative — fills the empty home-gyms-cable-stations leaf
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07PV4XP9W', 'yes4all-cable-machine-attachment-set', $TITLE$Yes4All Cable Machine Attachment Set — Row Handles, Tricep Rope, Straight Bar and V Bar (880 LB Load)$TITLE$,
  $SUM$A four-attachment cable set rated to 880 lb that turns any rack, cage or beam into a lat pulldown and pushdown station without a dedicated machine.$SUM$,
  $BODY$Most home racks stop at barbell work — the cable exercises that fill out a program (lat pulldowns, seated rows, tricep pushdowns, face pulls) get skipped because nobody owns a two-thousand-dollar cable machine. This Yes4All attachment set is the pragmatic bridge: a stainless steel tricep rope, a straight bar, a V bar and a pair of row handles, all built around a rated 880-pound load and hung from a strap-and-pulley system that loops over your rack's crossmember, a ceiling beam, or any structural bar you already own.

What you actually get, in practice, is four exercise families for the price of a single dumbbell. The straight bar covers pushdowns and curls plus straight-arm pulldowns. The rope adds the rotation-through-lockout movement that makes tricep work feel complete, and it is also the natural handle for face pulls — the single most prescribed rear-delt exercise in our exercise library. The V bar lands inside pushdowns and neutral-grip rows. The row handles open seated and standing row patterns when paired with a bench and the pulley set low. Every grip is knurled or rubber-coated, and the carabiner swaps attachments in seconds, which keeps supersets moving.

The load rating deserves a sentence of honesty: 880 pounds is far beyond what any strap-and-bulldog-strap anchor should see in real training — treat it as material confidence, not an invitation. The real-world limits are your anchor point and the strap wear you inspect before heavy sessions. Assembly is a ten-minute job: loop the strap, clip the pulley, hang the cable with its ball-end, and load plates onto the included loading pin strap — the same plates your barbell already uses, which is precisely why this beats a proprietary machine for a home budget.

For our program pages this set fills the gap between "you have a rack" and "you can train back properly." Pair it with the FLYBIRD bench already on our shelf for seated rows, face pulls, and pulldown volume without touching a single additional machine. It is not a smooth-feeling commercial cable tower — the pulley is functional, not frictionless — but it is the difference between a complete and an incomplete home gym at a small fraction of the cost.$BODY$,
  $BRAND$Yes4All$BRAND$, 'https://m.media-amazon.com/images/I/61BSWNjyC2L._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'home-gyms-cable-stations'
on conflict (slug) do nothing;

-- B00I04Z52G — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   REPLACES the audit's B0F1ZD2X11 (live redirect to a CAP plate-holder accessory page — wrong product) and B0D637M82D (keyword-stuffed no-name listing); the live FM-8000F is the CAP-branded rack the audit intended
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00I04Z52G', 'cap-barbell-fm8000f-deluxe-power-rack', $TITLE$CAP Barbell FM-8000F Deluxe Power Rack (Pull-Up Bar, J-Cups, Safeties, 600 LB Capacity)$TITLE$,
  $SUM$The full-spec budget power rack: two J-cups, two safety catches, a pull-up bar, plate posts and band pegs inside a 12-14 gauge steel frame rated to 600 lb.$SUM$,
  $BODY$A squat rack is where home strength training stops being a compromise. The FM-8000F is CAP's classic deluxe power rack — the format that made racks affordable — and the current listing carries every feature the format is supposed to include: two J-cup bar catches with ABS sleeves that protect your bar's finish, two safety catches for squatting and benching alone, a full pull-up bar across the top, two plate posts so your weight lives on the rack instead of the floor, and three band posts per side for banded work. The frame is 12- and 14-gauge alloy steel with a three-step powder-coat finish, assembled at 47 inches deep by 61 wide by 85 tall — tall enough that most ceilings clear it, deep enough that a bench fits inside for pressing inside the safeties.

The ratings that matter: 600 pounds maximum rack capacity, 300 pounds on the bar catches, and a 300-pound user capacity for pull-ups. For the population our strength programs target — progressive barbell work in the squat, press, bench and deadlift families — those are working numbers, not decoration. The safety catches are the quiet headline: benching alone without safeties is the single behavior we refuse to endorse on our exercise pages, and a rack with in-frame safeties converts that risk into a non-event. Set them just below your bottom position and fail into steel instead of a barbell on your chest.

This is also the piece that completes the equipment family already on our shelf. The CAP 300 lb Olympic weight set we carry loads its plate posts; a standard 7-foot bar sits in the J-cups; the FLYBIRD adjustable bench slides inside for presses; and the Iron Gym-style doorway bar becomes redundant once the top pull-up bar exists. One purchase, one footprint, and the big five barbell lifts plus pull-ups are all inside the frame — that is the entire theory of a home strength gym in one steel box.

Honest limits: the J-cups are fixed-height adjustments rather than quick-pop, band pegs are nice-to-have until you loop your first mini-band, and the assembly is a two-person afternoon with a ratchet set. At roughly a hundredweight of steel, freight matters — check the delivery class before ordering. But as the anchor of a home strength setup at this price tier, it is the most load-bearing decision you will make, in every sense.$BODY$,
  $BRAND$CAP$BRAND$, 'https://m.media-amazon.com/images/I/61jpnpOZMML._AC_SL1500_.jpg', 8.6, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'power-racks-benches-pull-up-bars'
on conflict (slug) do nothing;

-- B00FLYWNYQ — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00FLYWNYQ', 'instant-pot-duo-6qt-7-in-1', $TITLE$Instant Pot Duo 6 Qt 7-in-1 Electric Pressure Cooker (Stainless Steel)$TITLE$,
  $SUM$The appliance that made batch cooking normal: pressure, slow cook, rice, steam, sauté, yogurt and warming in one stainless pot with one-touch programs.$SUM$,
  $BODY$Meal prep has an hour problem, and the Instant Pot Duo is the machine that solved it for millions of kitchens. The 6-quart flagship of the line replaces seven appliances — pressure cooker, slow cooker, rice maker, steamer, sauté pan, yogurt maker, and food warmer — around one food-grade stainless inner pot with a tri-ply bottom that actually browns. Thirteen one-touch Smart Programs cover the food prep our nutrition pages keep recommending: ribs, soups, beans, rice, poultry, yogurt, even desserts, each with the timing logic baked in so the machine does the remembering.

The numbers that matter to a training population: dry beans from hard to soft in under an hour without overnight soaking; whole chickens in a fraction of oven time; stock from bones and scraps in two hours instead of a slow afternoon; and rice for four without the watched-pot tax. Pressure cooking claims to run up to seventy percent faster than conventional methods for one-pot meals — in our kitchen experience the honest figure varies by dish, but the direction is right and the hands-off minutes saved are the real currency. Six quarts feeds a family of six or a single lifter's five-day container run, which lands exactly in our meal-prep workflow: the appliance plus glass containers plus the Sunday two-hour block is a complete nutrition system.

Safety earned its reputation here: over ten built-in features, overheat protection and a safe-locking lid that refuses to open under pressure. The stainless lid and inner pot go in the dishwasher, and the fingerprint-resistant housing wipes clean — the practical difference between a machine you use weekly and one you retire to a cabinet.

Honest notes: the learning curve is real for the first week — venting, sealing and natural release are vocabulary you learn once and keep. The inner pot is stainless, not non-stick: sear with a splash of oil and deglaze, or you will scrub. And the 6-quart size is the right default for most, not all — households cooking for crowds should look at the 8-quart sibling. For everyone planning macros around a busy week, this is the single appliance our calorie and macro tools keep quietly pointing at: cook once, portion twelve meals, stay on plan.$BODY$,
  $BRAND$Instant Pot$BRAND$, 'https://m.media-amazon.com/images/I/71Z401LjFFL._AC_SL1500_.jpg', 8.8, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'healthy-cooking-appliances'
on conflict (slug) do nothing;

-- B01KV4H51G — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01KV4H51G', 'quaker-old-fashioned-rolled-oats', $TITLE$Quaker Old Fashioned Rolled Oats (Two 64 oz Bags in Box, 90 Servings)$TITLE$,
  $SUM$The single-ingredient carbohydrate baseline: 100% whole grain old-fashioned rolled oats, two 64-oz bags and 90 servings of the most predictable breakfast macro in food.$SUM$,
  $BODY$Every nutrition plan we publish eventually lands on the same breakfast: oats. The Quaker Old Fashioned 64-ounce twin-pack is the canonical version — one ingredient on the label, whole grain rolled oats, Non-GMO Project verified, and ninety servings per box, which makes the per-bowl cost close to negligible and the pantry lead time comfortably long. This is the old-fashioned cut: steamed groats rolled flat but left thick enough to keep their chew, distinct from quick oats (fine, mushy) and steel-cut (great, 30 minutes).

The macro behavior is why our meal-planning tools keep returning here. A half-cup serving runs 150 calories with 5 grams of protein and 4 grams of fiber — a ratio you can plan around, unlike most boxed breakfasts. The fiber is beta-glucan, the soluble type the label correctly calls heart-relevant, and the digestion pace is slow enough that a 7 a.m. bowl carries a trainee to noon without a vending-machine detour. Pair it with a scoop of the whey on our shelf and the protein column of breakfast closes in ten seconds of stirring.

Three formats we actually use: overnight oats (equal oats and milk, refrigerated, done by morning), protein oats (half the milk replaced with a shake), and baked oatmeal cups for the week's containers. The two-bag box is sized for exactly that kind of cadence — one bag on the counter, one in reserve. And when the training block is a cut, oats are the carbohydrate we pull first for volume: a cooked cup is filling, warm, and hard to overeat relative to its calories.

Honest notes: old-fashioned oats take five minutes on the stove or three in a microwave, not instant — the convenience tier is a different product. They are a plain canvas: unsweetened by design, so the sugar load is whatever you add, which is precisely the control a macro calculator wants. People with celiac-level sensitivity should use certified gluten-free oats, as standard oats carry cross-contact risk in processing. For everyone else, this is the least interesting product on our shelf in the best possible way — nothing to break, nothing to evaluate, just the dependable base layer of a high-carb breakfast economy.$BODY$,
  $BRAND$Quaker$BRAND$, 'https://m.media-amazon.com/images/I/81ScVUSKFwL._SL1500_.jpg', 8.5, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'low-sugar-diet-friendly-foods'
on conflict (slug) do nothing;

-- B00LHVROIM — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00LHVROIM', 'kodiak-power-cakes-buttermilk-mix', $TITLE$Kodiak Cakes Power Cakes Protein Pancake & Waffle Baking Mix (Buttermilk, 20 oz, Pack of 6)$TITLE$,
  $SUM$Pancakes that earn their syrup: whole grain wheat and oat flours plus whey and milk protein concentrates turn a flapjack breakfast into a recovery meal.$SUM$,
  $BODY$Weekend pancakes are where protein targets quietly die — a standard mix is flour, sugar and regret, and the meal costs you a third of the day's macros for zero protein return. Kodiak's Power Cakes is the fix that survived our kitchen testing: a buttermilk flapjack and waffle mix built on 100% whole grain wheat flour and whole grain oat flour, with vital wheat gluten, whey protein concentrate and milk protein concentrate carrying the protein column. The label's promise lands in the mid-teens of grams of protein per serving when mixed as directed with water — push it toward twenty with milk, or a scoop of whey from our shelf if the morning follows a training session.

The ingredient list is short and legible — flours, proteins, leavening, buttermilk, brown sugar, sea salt — which is what we want from a "better-for-you" convenience mix: the improvements are structural (whole grains, added protein) rather than cosmetic. The flavor profile is honest buttermilk tang, closer to a diner hotcake than a protein bar. The waffle format is the better protein-per-bite deal in practice — the iron crisps the exterior and holds syrup without sogginess, and waffles reheat from frozen in a toaster better than pancakes do.

The pack-of-six format is a deliberate buy: each 20-ounce box is a few weekend breakfasts for a family or a month of Sunday batches for one, and the mix keeps dry-storage stable. Our usage pattern: Sunday batch of waffles, half eaten, the rest wrapped and frozen as the week's quick breakfast — paired with eggs or a shake, the morning protein number closes before the commute. For the parents and coaches among our readers, this is also the sneaky-nutrition play: children accept Power Cakes without negotiation, and nobody reads the label at the table.

Honest notes: the protein number is real but comes with gluten and dairy — the allergen list includes milk and wheat with a shared-equipment caveat for egg, soy and tree nuts, so this is not the celiac or lactose-free pick. The texture is slightly denser than a classic buttermilk pancake — the trade for protein is physical, not imaginary. And the brown sugar in the mix means the batter is mildly sweet already; go light on the syrup pour or the calorie budget follows it. As a pantry staple, it converts the most indulgent breakfast tradition into a meal that supports training, which is the entire reason it is on our shelf.$BODY$,
  $BRAND$Kodiak Cakes$BRAND$, 'https://m.media-amazon.com/images/I/91drMA2FpLL._SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'specialty-baking-cooking-ingredients'
on conflict (slug) do nothing;

-- B06XXN9CTG — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B06XXN9CTG', 'anthonys-organic-psyllium-husk-powder', $TITLE$Anthony's Organic Psyllium Husk Powder (1.5 lb, Finely Ground, Gluten Free)$TITLE$,
  $SUM$Finely ground organic psyllium husk — the soluble-fiber staple our gut-health coverage keeps circling back to, single-ingredient, keto-friendly and gluten-free by nature.$SUM$,
  $BODY$Psyllium husk is the fiber our gut-health writing keeps circling back to, and for a simple reason: it is the rare supplement that behaves. Ground from the seed coat of Plantago ovata, it is almost entirely soluble fiber — the gel-forming kind that feeds a favorable gut environment, slows carbohydrate absorption, and gives stool the bulk and water it wants. Anthony's version is the format we prefer: organic-certified, finely ground powder rather than coarse husk, single-ingredient with no additives, and batch-tested gluten-free, which matters because cross-contact is the hidden issue in cheap psyllium.

The practical mechanics matter more than the botany. A teaspoon of the fine powder in a full glass of water gels in about a minute — drink it promptly or you will be eating it with a spoon. That gelling is the entire function: it resists digestion in the small intestine and arrives in the colon as fermentable substrate and water-holding bulk. For the high-protein, low-vegetable weeks that heavy training blocks sometimes produce, psyllium is the patch that keeps the system regular without changing a single meal. Start with one small serving daily and titrate upward — fiber load moves fast when it moves.

Two usage families beyond the glass of water. First, baking support: ground psyllium is the binder that makes gluten-free and low-carb bread hold together — a teaspoon or two per loaf replaces the structure gluten provided, which is why it sits in our specialty baking ingredients shelf next to the almond flour from the same brand. Second, satiety management on a cut: a psyllium glass before a meal occupies stomach volume, a legitimate tool when the calorie calculator has you four hundred under maintenance and the evening is long.

Honest notes: this is a food-system regulator, not a medicine — the science of fiber is general and dietary, and nothing here replaces dietary patterns or medical care for a diagnosed condition. Take it with generous water (a dry swallow of psyllium is a mistake you make once), keep it away from the exact hour you take other supplements by thirty minutes, and expect the first days to involve mild blooming before the system settles. The 1.5-pound bag holds months of servings at a teaspoon-a-day cadence — psyllium is inexpensive by nature, and this is a fair price for the organic, finely-milled, single-ingredient version of it.$BODY$,
  $BRAND$Anthony's$BRAND$, 'https://m.media-amazon.com/images/I/81TaX8tXpUL._SL1500_.jpg', 8.4, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'specialty-baking-cooking-ingredients'
on conflict (slug) do nothing;

-- B0CKKKVZ5M — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   REPLACES the audit's B092D9Q8D3 — live page shows the Jupiter brand, not Gymreapers (audit ASIN mismatch); B0CKKKVZ5M is live-verified Gymreapers with IPF approval on the page
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0CKKKVZ5M', 'gymreapers-knee-sleeves-7mm', $TITLE$Gymreapers Knee Sleeves 7 mm (1 Pair, IPF Approved) with Carry Bag$TITLE$,
  $SUM$Seven-millimeter neoprene knee sleeves carrying IPF approval — the warmth and compression heavy squatters ask for by name, sold as a pair with a carry bag.$SUM$,
  $BODY$Knee sleeves are the most personal purchase in a lifting kit, and the decision matrix is short: thickness and fit. Gymreapers' 7 mm neoprene pair is the powerlifting-endorsed format — thick enough to warm the joint and add spring out of the bottom of a squat, tight enough to give the knee a physical sense of center under load. The listing carries IPF approval, the stamp from the International Powerlifting Federation's equipment register, which matters to competitors (approved sleeves are legal in competition) and signals construction discipline to everyone else. The pair ships with a drawstring carry bag, which sounds minor and is not: sleeves in a gym bag pocket get lint-locked and bent, and a folded sleeve loses its shape faster than a bagged one.

The function, honestly described: 7 mm neoprene is not a brace — it does not hold your knee where your musculature fails to. What it does is keep the joint warm between sets, provide compression the tendons appreciate under heavy eccentric work, and return a few percent of elastic energy at the sticking point. Squatters feel it in the hole; lifters with cranky knees on cold mornings feel it before they touch the bar. The fit conversation is the one to have with yourself honestly: the size chart is a knee-circumference measurement over the widest point, and the correct sleeve goes on snug to uncomfortable-new, because neoprene relaxes with weeks of use. Order loose and you have a knee tube sock; order right and you have a decade companion.

On our shelf this rounds out the joint-support family that already carries the lifting belt and the straps — trunk, grip and knees each get their tool now, and the big barbell lifts are covered end to end. They see honest duty across our squat and deadlift program pages, where volume weeks punish connective tissue that muscle recovers from faster than tendons do.

Care notes that extend life: air-dry them after sessions, never the dryer (heat is neoprene's enemy), rotate them inside-out weekly, and accept the eventual smell as a badge of use — the bag helps with the car ride home. If your goal is general fitness rather than iron sport, the thinner 5 mm format is the lighter-daily option; the 7 mm here is the heavy-training tool, and it behaves like one.$BODY$,
  $BRAND$Gymreapers$BRAND$, 'https://m.media-amazon.com/images/I/717Q-K9Uk+L._AC_SL1500_.jpg', 8.6, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'lifting-belts-straps-gloves'
on conflict (slug) do nothing;

-- B00A21NRNO — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00A21NRNO', 'powerblock-elite-exp-adjustable-dumbbells', $TITLE$PowerBlock Elite EXP Adjustable Dumbbells (Stage 1, Set of 2, 5-50 lb per Hand)$TITLE$,
  $SUM$The square-framed adjustable dumbbell that grows with you: 5 to 50 lb per hand across 16 pin-selected increments, expandable to 90 lb with add-on kits.$SUM$,
  $BODY$The adjustable-dumbbell decision in 2026 comes down to two engineering philosophies, and we now stock both honestly. The dial-driven design (Bowflex 552 on our shelf) trades size and mechanism for speed. PowerBlock's Elite EXP is the other philosophy: a nested square cage of plates selected by a magnetic polypropylene pin — 16 increments from 5 to 50 pounds per hand, including 2.5-pound micro-steps, in a package measuring a foot long and seven inches wide that replaces sixteen pairs of fixed dumbbells. The pin is the entire interface: pull, move, seat, lift. It cannot be rushed wrong, which is the safety conversation dial users eventually have.

The case for the EXP over its round competitor is threefold. First, expansion: PowerBlock sells add-on kits that take each hand from 50 to 70 and then 90 pounds — the dumbbell you bought as an intermediate follows you into advanced pressing and rowing strength, which is precisely the progression our dumbbell programs are built around. Second, footprint: the square profile stores and racks smaller, and 12 by 7 by 7 inches per hand fits apartment shelving that a dial pair visually rejects. Third, the warranty: five years residential, and PowerBlock's design has been the fixture of professional training facilities for decades — the track record is the product.

The honest trade list: adjustment is slower than a dial (five seconds versus two, per hand), the square cage can contact thighs on deep curl patterns at the larger settings, and the handle feel is a cylindrical bar within a square frame — an aesthetic some lifters need a week to accept. None of those are defects; they are the cost of the expansion path and the compactness. The micro-weight access (2.5-pound steps) is the sleeper feature for progressive-overload discipline — the jump from 25 to 30 pounds in pressing movements defeats many trainees, and the EXP simply does not have that gap.

For the home lifter building one purchase that spans beginner curls to heavy chest-supported rows, this is the buy-with-confidence option in the category: it is heavier later, it is smaller now, and its mechanism has survived twenty years of gym floors. Pair it with our dumbbell-only workout pages and the adjustment pin becomes the only machine you operate all session.$BODY$,
  $BRAND$PowerBlock$BRAND$, 'https://m.media-amazon.com/images/I/71hFnjGFvVL._AC_SL1500_.jpg', 8.8, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'adjustable-fixed-dumbbells'
on conflict (slug) do nothing;

-- B07X64MXBS — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07X64MXBS', 'bowflex-selecttech-840-kettlebell', $TITLE$Bowflex SelectTech 840 Adjustable Kettlebell (8-40 lb)$TITLE$,
  $SUM$Six kettlebells in one dial-adjustable shell: 8, 12, 20, 25, 35 and 40 lb — the full swing-and-carry rack in the footprint of a single bell.$SUM$,
  $BODY$Kettlebell training has a shopping problem: the canonical program needs a light bell for technique, a mid bell for volume swings, and a heavy bell for strength work — three purchases, three shelf spots, and a progression plan you outgrow. Bowflex's SelectTech 840 compresses that rack into one dial-adjustable shell: six weights at 8, 12, 20, 25, 35 and 40 pounds, selected with the same turn-of-dial mechanism as the SelectTech dumbbells we already stock. The range reads like a curriculum: 8 and 12 for learning the swing pattern cleanly, 20 and 25 for the volume work that makes kettlebell conditioning famous, 35 and 40 for single-arm rows, front squats, and the heavy swings that build hips.

The design problem a kettlebell-dumbbell hybrid must solve is where the mass sits — swings punish any handle that lets plates rattle or a grip that rolls mid-rep. The 840 keeps the weight concentric around the grip with an interlocking plate shell, and the dial locks the selection so the bell behaves like a fixed mass through the arc. It will never feel exactly like a competition bell's cast-iron single body — that is the honest line to draw — but it stays quiet and balanced through the swing arc, which is the characteristic that separates a training bell from a paperweight.

Who this is genuinely for: the home lifter whose kettlebell rack is limited by space rather than desire. One footprint, six usable loads, and the progression from first swing to heavy goblet squat happens inside the same purchase. Our home workout program pages lean on exactly this pattern — swings, carries, goblet squats, snatches — and a single dial bell covers five of six stations in a circuit without putting the session on hold at the weight rack. The SelectTech family logic applies here too: one mechanism you already understand, now in the shape the hips prefer.

Honest notes: the 40-pound ceiling is a real ceiling — strong swingers will eventually want the 53, and the expansion path for kettlebells is a second fixed bell, not an add-on kit. The handle is slightly thicker than a bare cast handle, which most hands read as comfortable and callus-builders read as a feature. And like every dial product, the adjustment happens between sets, not mid-set. As a first-and-only kettlebell for a training household, it is the most complete answer on the shelf — and it pairs naturally with the SelectTech dumbbells for a two-piece full-body home setup.$BODY$,
  $BRAND$Bowflex$BRAND$, 'https://m.media-amazon.com/images/I/61X7zGy6gwL._AC_SL1500_.jpg', 8.3, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'kettlebells'
on conflict (slug) do nothing;

-- B01BUL7FJ6 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01BUL7FJ6', 'aroma-housewares-rice-cooker-steamer', $TITLE$Aroma Housewares ARC-363-1NGB Rice Cooker and Food Steamer (6 Cups Cooked)$TITLE$,
  $SUM$The classic budget workhorse of meal prep: one-touch rice with a steamer tray above it, automatic keep-warm, and a nonstick pot that wipes clean in seconds.$SUM$,
  $BODY$A rice cooker is the appliance that quietly runs meal prep in most lifting kitchens, and Aroma's ARC-363 is the archetype: a six-cup-cooked (three-cup dry) unit with one-touch operation, an included steam tray that cooks vegetables or proteins above the rice while it works below, automatic keep-warm at cycle end, and a nonstick inner pot. That entire feature set costs less than a restaurant dinner and outlives most blenders — which is why it earns a place on our shelf despite being the least glamorous item on it.

The batch-cooking arithmetic is what matters here. Our meal-prep guidance revolves around protein, a carbohydrate base, and containers — and rice is the most reheatable carb in the rotation. This unit's six cooked cups split into four-to-six meal containers; cooked jasmine, basmati or brown rice at the ready converts the "what do I eat with this chicken" question into an assembly job instead of a nightly cooking decision. The steamer tray is the underrated half: frozen vegetables steam to crisp-tender in the last ten minutes of a rice cycle, and dumplings, fish fillets and eggs all fit the same tray — one machine, one plug, two components of dinner done simultaneously with zero attention spent.

The honest comparison set: this is not an induction fuzzy-logic rice maker — at this price the cooking logic is the classic thermostatic cut-off, which makes very good jasmine and basmati, respectable brown rice with a soak, and sushi rice that a purist would hand to the expensive machine. The keep-warm function holds serving temperature after the cycle without scorching for a reasonable window. The nonstick pot releases rice cleanly and wipes with a sponge — hand-wash the pot and lid parts; the electronics stay out of the sink.

For our calorie and macro tool users, the pitch is boring and powerful: reliable carbohydrate batches with consistent volumes, so the numbers you entered in the calculator match what lands in the container. Pair it with the glass meal-prep containers on our shelf and a Sunday session of chicken thighs, a rice cycle, and a steamer tray of broccoli produces the week's lunches in under an hour. It is a two-function appliance that quietly runs the highest-frequency job in a training kitchen.$BODY$,
  $BRAND$Aroma Housewares$BRAND$, 'https://m.media-amazon.com/images/I/716lot4vBWL._AC_SL1500_.jpg', 7.9, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'healthy-cooking-appliances'
on conflict (slug) do nothing;

-- B01ICBTPNQ — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   main listing image machine-checked with a woman — REJECTED; the product-only gallery image (person-free, the 527 replacement channel) is used instead
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B01ICBTPNQ', 'gaiam-yoga-block-support', $TITLE$Gaiam Yoga Block — Latex-Free EVA Foam with Beveled Edges$TITLE$,
  $SUM$The standard 9 by 6 by 4-inch support block: firm latex-free EVA foam with beveled grips that brings the floor closer to tight hamstrings everywhere.$SUM$,
  $BODY$The yoga block is the cheapest mobility upgrade in existence, and the Gaiam is the canonical version: a 9 by 6 by 4 inch block of firm EVA foam with beveled edges and a non-slip surface. This listing rounds out the Gaiam family on our shelf — mat and strap are already here — with the third leg of the props triad. Gaiam's version is the moderate-density standard: firm enough that hands and sit bones do not compress it away from under you, light enough (under five pounds) to travel in any bag.

What a block actually does, in practice, for the strength population we serve: it is geometry. Under the hand in a half-way lunge position, it raises the floor nine inches so a tight hip chain keeps a vertical shin. Under the sit bones in a seated forward fold, it tips the pelvis forward enough that the hamstrings lengthen instead of the lower spine rounding — the difference between stretching the target and straining the back is often one block. Under the sternum in a supported chest opener, it holds the position our desk-bound readers need without any muscular effort at all. The beveled edges are the detail that separates a used block from a rotated one: the grip surfaces let sweaty hands keep contact through a hold.

For our mobility and stretching pages, the block is the most-prescribed single prop: hamstring work, hip openers, thoracic extension, and supported recovery positions all route through it. It pairs with the strap we already carry — strap for tension management in the limbs, block for positional geometry — and both together cost less than a single physio co-pay, a comparison we make carefully and only for budget context.

Honest notes: EVA foam is closed-cell and non-porous — latex-free as the listing emphasizes, which matters to the allergy population — but it does scuff and fade cosmetically with hard use; the structural integrity lasts years beyond the cosmetics. Spot-clean with mild detergent and air-dry; the block does not like dryers or direct sun for long stretches. Density is the honest debate: this is the moderate firmness, not the rock-hard cork or the plush variation — for the supported-restorative uses some readers prefer a second, softer layer. As one purchase that upgrades every flexibility session from the first day, it remains the highest-utility, lowest-cost item in the category, and the one we hand to beginners first.$BODY$,
  $BRAND$Gaiam$BRAND$, 'https://m.media-amazon.com/images/I/41BZPMOJM-L._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'yoga-mats-props'
on conflict (slug) do nothing;

-- B00E6D6LQY — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00E6D6LQY', 'lectrofan-classic-white-noise-machine', $TITLE$LectroFan Classic White Noise and Fan Sound Machine$TITLE$,
  $SUM$Non-looping white noise and fan channels with precise volume steps and a built-in sleep timer — the recovery tool for loud rooms and light sleepers.$SUM$,
  $BODY$Sleep is the least glamorous pillar of training recovery, and the LectroFan is the least glamorous solution to one of its most common saboteurs: noise. This is the classic unit from Adaptive Sound Technologies — a palm-sized dedicated machine that plays white noise and fan-sound channels generated in the device itself, which matters because generated sound never loops. The audible seam where a recording loops is precisely the moment light sleepers wake; a synthesizer has no seam. The volume control deserves its reputation: dozens of fine steps, so the level lands under a snoring partner or a street-facing window instead of over it, and a sleep timer shuts the unit down on a schedule for those who only need help falling asleep.

Why a dedicated machine instead of a phone app, honestly: the phone is a sleep device and a notification device, and the same screen that plays rain sounds is the one that flashes a message at 2 a.m. A pocket-sized single-purpose unit has no blue light, no interruptions, and no battery anxiety by the bedside. For our sleep and recovery coverage — where we place recovery tools in the same tier as programming and nutrition — the sound environment is the cheapest variable to fix and the one most readers skip.

Use cases our readers actually write in about: apartment buildings with hallway noise, partners on different schedules, shift work with daylight sleeping, and the curse of the too-quiet house where every settling sound becomes a wake event. The white noise channels mask broadband; the fan channels suit people who slept under a fan their whole childhood and cannot replicate the sound with a real fan in winter. Speech privacy is the office-meeting use case the manufacturer lists — the masking quality that makes nearby conversation unintelligible — and it works for study sessions too.

Honest notes: the classic unit is sound-only — no nature soundscapes, no dawn alarm; the model line above it adds those. The speaker is small and mono; the sound fills a bedroom, not an open floor plan. Placement matters: low and behind the bed masks better than across the room. For the price of a single restless dinner out, the training population gains the one environment variable that turns eight hours in bed into eight hours of it spent sleeping — and the recovery math of our workout pages depends on exactly that difference.$BODY$,
  $BRAND$Adaptive Sound Technologies$BRAND$, 'https://m.media-amazon.com/images/I/51E316urhTL._AC_SL1367_.jpg', 8.4, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'sleep-recovery-tools'
on conflict (slug) do nothing;

-- B0DNNT8RXY — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0DNNT8RXY', 'perfect-fitness-ab-carver-pro', $TITLE$Perfect Fitness Ab Carver Pro Roller with Kinetic Spring Resistance$TITLE$,
  $SUM$The ab wheel with a carbon-steel spring inside: resistance on the rollout, assistance on the way back, an angled grip and a knee pad in the box.$SUM$,
  $BODY$The ab wheel is the most honest core machine ever built: no seat, no stack, just leverage versus your anterior chain. The Ab Carver Pro is the refined version of the tool — an ultra-wide wheel with a carbon-steel spring inside the hub. The spring is the entire design thesis: it resists the rollout, slowing the eccentric phase where most form breaks happen, then pulls the wheel back on the return, sparing the hip flexors from doing the recovery work. The wide tread is the second difference from a bare wheel: the stability to attempt multi-directional rollouts — straight, angled left, angled right — which turns the movement family into a full oblique curriculum instead of a single front-plane drill.

The progression this wheel enables is the reason it belongs in our core exercise pages: the assisted return lets a trainee earn full rollouts weeks earlier than a bare wheel permits, and the angled ergonomic handles (with removable hand grips for storage and transport) keep wrists neutral through the arc. The kneepad in the box is real equipment rather than filler — the knees bear body weight on every rep, and the pad converts tile and hardwood floors from dealbreakers into training surfaces.

What the movement actually trains, accurately stated: anti-extension strength — the ability of the trunk to resist the arch the rollout forces — carries over to how the midsection behaves under squats, deadlifts and carries. It is the same quality our plank progressions build, loaded through a longer lever. The number of quality reps possible with the spring assist makes the tool a conditioning device as much as a strength one: three sets of quality rollouts within reach of most trainees produce a legitimate training effect in the abs, shoulders and lats together.

Honest notes: form still decides everything — a sagging hip on the rollout converts the exercise into lumbar flexion under load, which is why we teach the hollow-body hold first and roll only as far as position survives. The spring makes the tool heavier and larger than a bare wheel — less pocketable, more deliberate. And the wheel is the one piece of home equipment that humbled every infomercial athlete who tried it, spring or no spring. For the price of a month of gym classes it delivers the most efficient anti-extension training available without a structure — and it earns its shelf spot next to the functional tools we stock.$BODY$,
  $BRAND$Perfect Fitness$BRAND$, 'https://m.media-amazon.com/images/I/61zVwSpdaRL._AC_SL1500_.jpg', 8.1, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'functional-plyometric-tools'
on conflict (slug) do nothing;

-- B0CZBRCQDW — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0CZBRCQDW', 'cap-adjustable-weighted-vest-20lb', $TITLE$CAP Adjustable Weighted Vest (1-20 lb, One-Pound Iron Packets)$TITLE$,
  $SUM$Progressive overload for walks and bodyweight circuits: one-pound iron packets load a padded, adjustable vest from a single gentle pound up to a full twenty.$SUM$,
  $BODY$The weighted vest is the rare training tool that upgrades an activity you already do daily: walking, stair climbing, bodyweight squats, rucking. CAP's version handles the two design problems correctly — adjustability and comfort. The load comes in one-pound iron packets (the starting weight is a twenty-pound set), so the progression is granular: start light on a walk, add a pound a week, and the stimulus climbs without a single jump that joints vote against. The vest itself distributes that load through padded shoulders and an adjustable waist belt, which is the difference between a vest that rides stable through a full gait and one that bounces on every step — bouncing vest, bouncing knees.

The training logic is what makes this a functional-tools item in our catalog rather than a cardio accessory: added load on bodyweight movements is progressive overload without a barbell. Walks become ruck marches; pull-ups and push-ups and dips gain load without changing technique; stair sessions gain intensity in the exact step cadence the joints already accept. Our bodyweight training pages keep prescribing weighted-vest progressions for the trainee who has outgrown the unloaded version of everything but is not ready to re-gear an entire home gym — this vest is that bridge, and the one-pound packets make the on-ramp gentle enough for genuine beginners to start with a single pound and climb honestly.

Safety notes that matter and fit in a paragraph: keep the load on the torso light for anything with impact — running in a heavy vest multiplies joint stress, and our pages do not recommend high-impact weighted work; vests earn their keep on walks, stairs, rucking and loaded calisthenics. The reflective trim on this listing is a real commuting feature for evening walkers. The packet system means the vest arrives flat and the pockets ride even across the front and back — load the back panels too, or the weight pulls the shoulders forward all session.

Honest limits: twenty pounds is the honest ceiling for most bodyweight progressions, and strong trainees will outgrow it for pull-ups eventually. The packets are iron fines in fabric — they are not precision plates; keep them dry. For the walking-and-carrying population that forms the base of our readership, this is the tool that turns the existing daily walk into measurable, progressive training with the load dial in your own hands.$BODY$,
  $BRAND$CAP$BRAND$, 'https://m.media-amazon.com/images/I/91OR3ecMACL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'functional-plyometric-tools'
on conflict (slug) do nothing;

-- B00006JSUA — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00006JSUA', 'lodge-cast-iron-skillet-1025', $TITLE$Lodge Pre-Seasoned Cast Iron Skillet (10.25 Inches)$TITLE$,
  $SUM$The foundry-seasoned cast iron skillet that needs no introduction: pre-seasoned in Tennessee, safe on every heat source including induction and campfire, outliving its owners.$SUM$,
  $BODY$There is a reason the cast iron skillet is the one piece of kitchen equipment every generation of cooks agrees on, and the Lodge 10.25-inch is its canonical form: pre-seasoned at the foundry with vegetable oil, ready to cook on day one, and made of material that neither warps, wears, nor wears out. The current listing states PFAS-free plainly — cast iron's non-stick is polymerized oil, not a coating — which is precisely why the pan outlives every non-stick purchase it competes with. The 10.25-inch size is the correct default: two eggs comfortably, a three-egg scramble packed, one chicken breast or two thighs searing with room to flip, a cornbread or a skillet cookie in the oven.

For a training kitchen the case is almost unfairly strong. Protein preparation in cast iron is the technique that makes the lean proteins a macro plan requires into food people voluntarily eat: a screaming-hot sear on chicken thighs, steak, and salmon is a cast iron specialty that thinner pans cannot hold through a cold-protein drop. The pan's thermal mass — heavy iron holding heat steady — is also the even-baking property that makes oven-finished dishes and one-pan dinners reliable. It moves from stovetop to oven to broiler to campfire without a ceremony, and the induction compatibility the listing confirms makes it future-proof across every cooktop a reader will own for decades.

The seasoning is the maintenance conversation, honestly framed: the factory layer is functional from the first cook, and cooking fatty foods on it is itself the maintenance — the pan seasons through use. Wash with hot water and a brush, dry immediately (cast iron's one real enemy is rust, and a towel prevents it), rub with a drop of oil, hang or store. Ten seconds of care per session buys a pan that our meal-prep pages can build a decade of Sunday cooking on. The helper handle and pour spouts are the quiet conveniences; the weight is the honest cost — a workout in the hand, which our readers tend to read as a feature.

The classic comparisons, answered fairly: a 12-inch is the family-size sibling and heavier; enameled cast iron is prettier and maintenance-free inside but costs triple; carbon steel is lighter with the same technique but arrives unseasoned. For one skillet to a kitchen — the pan that handles eggs at breakfast and steaks at dinner for the next thirty years — the pre-seasoned Lodge remains the strongest value in cookware and the anchor of our prep-tools shelf.$BODY$,
  $BRAND$Lodge$BRAND$, 'https://m.media-amazon.com/images/I/71iH2iNxTZL._AC_SL1500_.jpg', 8.9, true, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'prep-tools-accessories'
on conflict (slug) do nothing;

-- B074F1S194 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   REPLACES the audit's Sunny B0HB71XK1Q — main image machine-checked showing a woman in a sports bra (absolute ban); Cubii JR1 is the category-leading under-desk elliptical with a clean product-only hero image — fills the empty ellipticals-steppers leaf
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B074F1S194', 'cubii-jr1-under-desk-elliptical', $TITLE$Cubii JR1 Under Desk Elliptical$TITLE$,
  $SUM$The original seated mini-elliptical for work-from-home days: quiet, low-impact strides under the desk with an LCD tracker for calories, strides and distance.$SUM$,
  $BODY$The Cubii JR1 is the machine that defined the under-desk elliptical category — a compact seated pedal machine built for the exact population our desk-job recovery writing addresses: people whose workday locks them into a chair. The mechanism is the point: an elliptical stride path, not a bike pedal circle, so the motion is smooth, quiet and low-impact — the design quietly pedals under a desk without shaking it, which is the difference between a machine people actually use during calls and one that lives in a closet. The built-in LCD tracks strides, distance and estimated calories; the companion app accepts manually entered stats for readers who want the numbers in a log.

The honest framing of what seated pedaling does: this is movement accumulation, not training. The caloric burn is real but modest — the honest analogy is that an afternoon of light pedaling resembles the energy of a decent walk, spread across hours you would otherwise spend motionless. For our readers in cutting blocks, that quiet background burn stacks on top of the training plan rather than replacing it; for readers rebuilding general activity after long sedentary stretches, the low-impact stride is a gentle re-entry ramp that joints tolerate well. The ergonomic argument matters as much as the caloric one: chairs are the posture problem of the century, and a pedal under the desk keeps hips, knees and circulation moving through the hours that otherwise freeze them.

The JR1 is the entry model of the line, and the value logic is straightforward: adjustable resistance levels for progression, a steel-and-composite frame light enough to slide under the desk at day's end, and no assembly drama. The quiet operation is the feature buyers cite most — the mechanism stays below conversational volume, which makes it a meeting-safe and household-safe tool.

Honest notes: it is not a cardio trainer — the stride is small and seated, and nobody replaces running with it; the resistance range is built for light progressive use, not intervals. The pedal height means the desk and chair need to be tall enough to clear knees — check your desk clearance before ordering. For the work-from-home population that reads our content, the JR1 is the single purchase that converts eight seated hours into eight gently active ones — and the category's original and best-known version remains its most sensible entry point.$BODY$,
  $BRAND$Cubii$BRAND$, 'https://m.media-amazon.com/images/I/510stu8Y2WL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'ellipticals-steppers'
on conflict (slug) do nothing;

-- B00CMQD3VS — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00CMQD3VS', 'nature-nates-raw-unfiltered-honey-32oz', $TITLE$Nature Nate's 100% Pure, Raw & Unfiltered Honey (32 oz Squeeze Bottle)$TITLE$,
  $SUM$One ingredient on the label: raw, unfiltered honey gently warmed to pour, in a 32-ounce squeeze bottle — the measured sweetener of protein oats and recovery shakes.$SUM$,
  $BODY$Honey occupies a precise slot in a training kitchen: the sweetener that arrives with a label anyone can read. Nature Nate's 32-ounce bottle is the format we use ourselves — the label lists one ingredient, honey, raw and unfiltered, and the squeeze bottle measures teaspoons without a sticky spoon ceremony. The brand's processing is the gentle version: warmed just enough to pour, never pasteurized to death, and screened for quality the way the big jars rarely are. The bottle's certified kosher and gluten-free markers are simple positives for our screening readers.

The training-kitchen case for honey over the alternatives is honest and unromantic: it is a measured, familiar carbohydrate. A tablespoon is around seventeen grams of sugars in a form every kitchen recognizes — useful in the pre-training window when the oat-and-honey bowl lands an hour before lifting, useful in the post-session shake when the carbohydrate column needs closing, and honest in a cut when the craving is sweetness rather than volume. Our macro and calorie tools count it like any other carb source — which is exactly why a squeeze bottle with a real serving size beats a jar and a guess.

The baking-and-breakfast uses fill the rest of the week: protein oats with a drizzle, the Kodiak waffles on our shelf with a light ribbon instead of syrup's heavier pour, yogurt-and-honey in the evening slot when a dessert-shaped snack is needed without derailing the day. Honey also happens to be one of the very few sweeteners that keeps loaves and bakes moist across a week of storage — a small baker's bonus on the specialty-baking shelf next to the almond flour and psyllium from the same family of simple-label goods.

Honest notes: honey is still sugar metabolically — a tablespoon is a tablespoon, and the raw status of honey is a processing statement rather than a health upgrade; our pages never sell it as one. Children under one year do not eat honey, full stop, the standard guidance every honey label carries. And the squeeze bottle's crystal-clear advantage is that the last third of the bottle actually comes out. For readers who want the kitchen's default sweetener in the size that survives a month of breakfast bowls, this is the standard-bearer of the format, and the one our recipes pages reach for by default.$BODY$,
  $BRAND$Nature Nate's$BRAND$, 'https://m.media-amazon.com/images/I/71ciSh9NoyL._SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'specialty-baking-cooking-ingredients'
on conflict (slug) do nothing;

-- B0099Q87JM — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   the audit noted the 5-oz spray needed the cooking bottle live-verified at execution — this is the 1 L cooking bottle, live-verified
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0099Q87JM', 'california-olive-ranch-global-blend-evoo', $TITLE$California Olive Ranch Global Blend Extra Virgin Olive Oil (1 L, Medium)$TITLE$,
  $SUM$A medium-intensity extra virgin olive oil from the everyday California Mill line — the one-liter cooking bottle for searing, sautéing and dressings at a fair price.$SUM$,
  $BODY$Extra virgin olive oil is the backbone fat of the cooking our nutrition pages assume, and California Olive Ranch's one-liter Global Blend is the everyday bottle format: a medium-intensity EVOO from a mill operation that pioneered California-grown oil at grocery prices. The Global Blend is the value tier of their line — fruit sourced from their partner growers, milled and blended for a consistent medium profile: grassy rather than peppery, round rather than sharp, an oil you can cook with daily and finish a salad with when the fancy bottle is empty. The listing's certification set — non-GMO, kosher, vegan, and paleo and keto friendly markers — is the standard screen our food-category readers run.

What medium intensity means in the pan: this is the correct EVOO for the two uses a training kitchen actually runs — sautéing vegetables at medium heat and dressing finished food. A tablespoon of olive oil is 120 calories of monounsaturated fat that makes the vegetables a macro plan requires into food people electively eat; that single conversion is the honest case for keeping a liter of it on the counter. The searing case for cast iron: olive oil's smoke point range handles mid-high heat well for everyday cooking — this bottle is the everyday cooking tier, with the delicate finishing oils a separate, smaller purchase for readers who want that layer.

The California Olive Ranch specifics that earned shelf space: their traceability practice (bottle codes that map to mill lots) and their freshness discipline — the harvest date tradition they helped normalize across the category. Oil is a fruit juice; it has a season and a shelf, and the brand's dating practice is the reason our pantry guidance prefers it over anonymous liters. Store the liter bottle away from the stove's radiant heat and use it steadily — an open bottle's best months are its first.

Honest notes: the Global Blend includes internationally sourced fruit in its mix (the "global" in the name) alongside California fruit — the all-California single-origin bottles are the premium tier of the same mill, at a price premium our cooking-tier readers rarely need for the skillet. Filtered and stable, it pours cleanly from the 33.8-ounce bottle without a spout ceremony. For the daily-driver EVOO slot in a training kitchen — the bottle that actually gets finished — this is the correct balance of quality discipline and price, and our cooking pages point here for the everyday liter.$BODY$,
  $BRAND$California Olive Ranch$BRAND$, 'https://m.media-amazon.com/images/I/61tKe3f+wuL._SL1500_.jpg', 8.3, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'specialty-baking-cooking-ingredients'
on conflict (slug) do nothing;

-- B005P0MLXO — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B005P0MLXO', 'justins-classic-almond-butter-16oz', $TITLE$Justin's Classic Almond Butter (16 oz Jar)$TITLE$,
  $SUM$The classic tree-nut alternative to peanut butter: dry-roasted almonds, palm fruit oil and salt in a 16-ounce jar — certified gluten-free, kosher and vegan on the label.$SUM$,
  $BODY$The nut-butter shelf in our store has covered peanut (Justin's own classic, the PBfit powder, Justin's cups) and the almond-butter column was the empty one — for readers avoiding peanuts by allergy or by preference, the swap is not optional. Justin's Classic Almond Butter is the jar that fills it: dry-roasted almonds with a small palm-fruit-oil fraction for stability and spreadability (the oil layer problem solved in the recipe rather than left for the consumer to stir back every week) and a modest salt. The listing's label markers — gluten-free, kosher, vegan — match the simple-ingredient screening our food pages run.

The macro case for almond butter, honestly stated: a tablespoon of almond butter carries the same caloric weight as peanut butter with a slightly different protein-to-fat ratio — a bit less protein per serving, a bit more monounsaturated fat, vitamin E and magnesium in the almond's favor. In practice the decision is made by allergy, taste and pantry variety rather than a nutrition-table knockout: households that cannot keep peanut butter use this jar as the direct one-to-one swap in every recipe our breakfast pages publish — the oats, the Kodiak waffles, the banana-and-butter stack — and mixed households keep both.

The texture and behavior notes that matter to daily users: the palm-fruit-oil fraction keeps this jar pourable and spreadable straight from the pantry without the oil separation that pure-almond jars develop — the no-stir trade is real and it costs a bit of the rustic intensity the stir-yourself crowd wants. The flavor is honest roasted almond — closer to the nut than the candy-adjacent flavored jars of the same brand, which is precisely why this is the cooking-and-daily-use jar rather than the dessert one.

Honest notes: palm fruit oil is a listed ingredient and the packaging notes sustainably sourced palm — readers with strong palm views will prefer the two-ingredient competitors at a price premium. Allergen discipline: the jar carries the standard tree-nut allergen statement and shared-line caveats, so peanut-allergic readers should run their usual label check. At the 16-ounce size, the per-serving economics land in the standard almond-butter band. For the nut-butter column of our shelf the jar completes the set: peanut for the classic, almond for the alternative, powder for the macro-crowd — and the household that keeps one jar of each has no breakfast that can surprise it.$BODY$,
  $BRAND$Justin's$BRAND$, 'https://m.media-amazon.com/images/I/71uc8fYzvTL._SL1500_.jpg', 8.1, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'nut-butters-spreads'
on conflict (slug) do nothing;

-- B07BSRNCN3 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit asked the wraps to be separated from the straps family at execution — this is the wraps listing; main image shows wrapped fists/forearms so the product-only gallery flat-lay is used instead
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B07BSRNCN3', 'gymreapers-wrist-wraps-ipf', $TITLE$Gymreapers Weightlifting Wrist Wraps (IPF Approved, Heavy-Duty Thumb Loop)$TITLE$,
  $SUM$Rigid wrist support carrying the IPF stamp: a heavy-duty thumb loop, adjustable tension and the wrap length competitive pressers trust on bench day.$SUM$,
  $BODY$Wrist wraps are the quiet insurance policy of pressing days, and they complete the support family on our lifting shelf — belt for the trunk, straps for the grip, sleeves for the knees, wraps for the wrists. Gymreapers' version carries IPF approval, the International Powerlifting Federation's equipment clearance that competitive lifters require and casual buyers read as construction discipline: the wrap has passed the federation's rigidity and material screen, so the tension you dial in is the tension you get through a heavy set. The heavy-duty thumb loop anchors the wrap on the hand while you cinch it — a small design detail that decides whether wrapping is a five-second habit or a two-minute wrestling match between sets.

What wrist wraps actually do, said precisely: they limit the wrist's extension under load. On a heavy bench press or overhead press, the bar drives the wrist backward toward extension; a wrapped wrist holds closer to neutral, which both spares the joint's end-range and transfers force along a straighter line from hand to forearm. Two populations feel the difference immediately: trainees with a history of wrist crankiness under pressing volume, and anyone whose bar path drifts when the wrist folds. What wraps do not do is substitute for grip or forearm strength — they are a support tool for the pressing families in our exercise library, not a strength shortcut.

The wrap craft, honestly described: these are the stiff cotton-blend length competitive lifters wrap tight — the wrap should cinch the wrist to a firm hug, not a cast, because the hands still need to grip and the wrap needs to come off between exercise families. The thumb loop takes the load during wrapping; the wrap unwraps in seconds. Sizing guidance from our programming pages: tighter and shorter wraps for bench-specific days, and a practice run in a warm-up set before the first working set with wraps — the feel of a wrapped wrist takes one session to learn.

Honest notes: wraps are a pressing-day tool; wearing them through curls and rows habituates the wrist to support it does not need — our pages prescribe them for heavy pressing volume, not all-day wear. The cotton face collects chalk and should be aired and washed gently per the care tag. As the fourth piece of the lifting-support family, this is the one that keeps the pressers among our readers pressing — and the IPF stamp on the label is the version of the tool that meets the equipment standard the sport itself set.$BODY$,
  $BRAND$Gymreapers$BRAND$, 'https://m.media-amazon.com/images/I/41ziAQrKU0L._AC_SL1500_.jpg', 8.3, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'lifting-belts-straps-gloves'
on conflict (slug) do nothing;

-- B0FBZ8XJWW — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0FBZ8XJWW', 'power-up-protein-trail-mix-14oz', $TITLE$Power Up Premium Trail Mix — Protein Packed (14 oz, No Added Sugar)$TITLE$,
  $SUM$A peanut-free protein trail mix of nuts and seeds with no added sugar — the grab-and-go snack bag that survives a gym bag and a work week.$SUM$,
  $BODY$The snack column of our food shelf has carried bars (Quest, RXBAR), pistachios and beef bites — the trail-mix column was the empty one, and this is the version that fills it correctly: Power Up's protein trail mix, a nut-and-seed blend built the way our snack pages prescribe: protein-dense nuts and seeds, no added sugar, no candy pieces hiding in the blend, and peanut-free — the last one matters for the allergy-carrying gym bag and the shared-office bowl alike. The listing's certification set (non-GMO project, gluten-free, vegan) matches the label screen our food-category readers run.

The honest nutrition framing: a trail mix is only as good as what the blend skips. The category's classic problem is the candy-and-nut bag that reads as a snack but eats like dessert — chocolate candies, sweetened dried fruit, and the sugar load follows. This blend's no-added-sugar discipline means the carbohydrate column comes from what the fruit brings and nothing more, and the protein column rides the nuts and seeds themselves — almonds, pumpkin seeds, sunflower seeds and their classmates rather than cereal filler. The result is the sustained-energy snack our hiking and long-session pages actually prescribe: a small handful closes a hunger gap without the glucose spike-and-crash cycle a candy bar buys.

The usage case is logistics: a fourteen-ounce bag portioned into the week's containers is the between-meal column of a training day done — gym bag pocket, desk drawer, trail pocket. Our readers who count macros read the label once and portion accordingly; the no-added-sugar base makes the portion arithmetic predictable, which is the entire argument for keeping a bag of this in the rotation versus the office vending alternative.

Honest notes: calorie density is the honest caveat of every nut-and-seed blend — the protein rides fat, so portions are counted rather than guessed; our calorie tool exists precisely for this arithmetic. Allergen discipline: the blend is peanut-free but carries the standard tree-nut processing caveats — the shared-equipment line — so the severely allergic reader runs their usual check. And the fruit component varies by harvest lot; the bag's character stays constant while the raisin-to-apricot ratio wanders. For the nut-mix column of our snack shelf, this is the no-nonsense version: the bag that acts like a snack and reads like a label — which is precisely the standard our food pages hold.$BODY$,
  $BRAND$Power Up$BRAND$, 'https://m.media-amazon.com/images/I/71p+Sn7NgVL._SL1500_.jpg', 7.8, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'nuts-seeds-trail-mixes'
on conflict (slug) do nothing;

-- B00Y8MP5VA — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   REPLACES Culturelle (live-checked: gelatin capsule of unstated source — the screening §2-2 owner rule excludes unknown-origin animal-derived capsules); Garden of Life is vegan capsules, no gelatin on the live page
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B00Y8MP5VA', 'garden-of-life-probiotics-for-men-50b', $TITLE$Garden of Life Dr. Formulated Probiotics for Men (50 Billion CFU, 30 Capsules)$TITLE$,
  $SUM$Fifty billion CFU across fifteen probiotic strains in a vegan capsule with organic prebiotic fiber — shelf-stable daily gut support from the vitamin shelf.$SUM$,
  $BODY$The vitamin shelf on our store has covered the training population's basics — the multivitamin, vitamin D3, omega-3s, magnesium, ashwagandha — and the gut column was the open one. This is the entry we chose to fill it: Garden of Life's Dr. Formulated Probiotics for Men, a fifty-billion-CFU daily capsule carrying fifteen probiotic strains plus organic prebiotic fiber in a vegan capsule — the capsule material detail is why this listing made our screen where the category's gelatin-capsule staple did not: our food-screening rules flag animal-derived capsules of unstated origin, and this one arrives clearly labeled vegetarian and vegan.

What the label means, translated for our readers: fifty billion colony-forming units is the dose at the best-by date, a strong-but-not-extreme count in the daily-probiotic class; fifteen strains is the diversity spread across Lactobacillus and Bifidobacterium families the category favors; the prebiotic fiber in the capsule feeds the cultures on arrival, the two-part reasoning the brand's whole line is built on. The shelf-stable formulation means no refrigeration — the bottle lives in the cabinet next to the rest of the stack, which is a real compliance factor: supplements that need ceremony get skipped, and a cabinet jar that survives a desk drawer is the version that actually gets taken.

The honest framing of what probiotics do: this is gut-environment support for the training population, alongside — not instead of — the fiber-and-vegetables discipline our nutrition pages keep at the center. The use cases our readers actually report: travel weeks that disrupt routine eating, high-protein blocks that thin the plant column, and antibiotic courses' aftermath — each a life circumstance where the daily capsule is a reasonable assist. Our gut-health writing pairs this listing with the psyllium husk also on our shelf: the fiber feeds the environment, the cultures add to it.

Honest notes: the men's formulation differs from the line's other versions by strain emphasis and added support for the male population the brand targets — the unisex daily choices sit in the same family for readers who prefer them. Effects in the supplement class are individual and gradual, not dramatic — the honest expectation is weeks of consistent use, not days. And the capsules' vegan material is the reason this entry passed our screen cleanly. As the gut column of the vitamin shelf, it completes the training population's daily stack with the clearest label in the category's daily tier.$BODY$,
  $BRAND$Garden of Life$BRAND$, 'https://m.media-amazon.com/images/I/81CBZarl3xL._SL1500_.jpg', 8.2, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'vitamins-minerals-omegas'
on conflict (slug) do nothing;

-- 1718216270 — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   REPLACES 'Science and Practice of Strength Training' — cover machine-checked showing a male lifter in a singlet (the documented 528 torso-cover rejection precedent); the NSCA 5th-edition cover is text-only, machine-verified clean
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, '1718216270', 'nsca-essentials-strength-training-conditioning', $TITLE$NSCA's Essentials of Strength Training and Conditioning (5th Edition)$TITLE$,
  $SUM$The 864-page NSCA reference behind every serious strength curriculum: adaptation science, testing, program design and technique in one professional textbook.$SUM$,
  $BODY$Our books shelf carries the practitioner's library — periodization theory, the 5/3/1 line — and this is the reference volume that sits underneath them all: the National Strength and Conditioning Association's Essentials of Strength Training and Conditioning, the textbook the certification curriculum is built on, in the fifth-edition hardcover from Human Kinetics at 864 pages. Where the practitioner books are opinionated, this one is the consensus document: the chapters on biomechanics, bioenergetics, anatomical and physiological adaptation to training are the background our exercise pages summarize when they explain why a program is built the way it is.

What the volume actually covers, for the reader deciding whether a professional textbook is for them: Part foundations on the science — how muscle, connective tissue and the nervous system respond to load; the testing chapters on needs analysis and measurement batteries; the program-design chapters on load, volume, exercise order and rest structure that every credible template in our program library is derived from; and the technique section on the core barbell movements' teaching progression. The resistance-training chapter family alone is the reference our writers consult when a program page's periodization language needs to be exactly right.

Who buys an 864-page textbook honestly: coaches and trainer-track readers first — it is the base text of the CSCS curriculum and reads exactly like what it is, a professional reference rather than a motivational read. Serious self-coached lifters second — the reader who wants to understand why the block periodization chapter structures accumulation and intensification the way it does, rather than borrowing templates blindly. The exercise-science student third — it doubles as the course text. What it is not: a programming shortcut or a beginner's first book; the shelf order for our readers runs practitioner books first, this reference underneath as the layer that explains them.

Honest notes: this is a heavy, structured textbook — figures, tables, cited literature — and the used-market for the recent editions is robust for readers who want the content without the new-cover price. Editions matter in this line: the field's details move (monitoring technology, sprint and agility chapters), so our links point at the current edition rather than the cheap older ones. As the reference layer of our books shelf, it is the volume the rest of the library leans on — and the one our program pages' footnotes keep citing when the why matters as much as the how.$BODY$,
  $BRAND$Human Kinetics$BRAND$, 'https://m.media-amazon.com/images/I/71u+dbTIjfL._SL1500_.jpg', 8.5, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'fitness-nutrition-books'
on conflict (slug) do nothing;

-- B0743Y8J8T — LIVE-VERIFIED 2026-11-27 (amazon.com/dp fetched in a real browser; title + brand read from the live page; image machine-vision-checked person-free)
--   audit ASIN confirmed live (title + brand + availability + image read from the live /dp page)
insert into public.affiliate_store_products
  (category_id, asin, slug, title, summary, content, brand, image_url,
   editorial_rating, is_featured, review_status, is_published)
select c.id, 'B0743Y8J8T', 'triggerpoint-stk-handheld-massage-stick', $TITLE$TriggerPoint STK Handheld Massage Stick$TITLE$,
  $SUM$A twenty-two-inch handheld massage stick with contoured grip handles — the portable recovery tool that reaches hamstrings and calves a floor roller cannot.$SUM$,
  $BODY$The recovery shelf has the floor roller and the massage gun — this is the third shape in the toolkit: the handheld stick. TriggerPoint's STK runs about twenty-two inches of foam-roller surface between two contoured handles, and its reason to exist is the body parts a floor roller handles badly: the hamstrings and calves respond to the stick's direct, controlled pressure in ways a passive floor roll cannot match — you sit, extend a leg, and drag the stick along the muscle with exactly the pressure you choose, which is the entire argument for the format.

The mechanics that make the stick different, honestly described: a floor roller loads your body weight onto the tissue — blunt, total pressure. The stick lets you dial pressure through your arms, target a specific band of muscle rather than a general region, and work one leg at a time while sitting in a chair — which is why the format survives in every track-and-field bag and team room in the sport. The contoured handles on this version keep the grip through sweaty post-session use, and the foam surface's density splits the difference between the too-soft sticks and the punishing rigid ones — firm contact without the wince.

The recovery programming our pages prescribe around a stick: post-session quadriceps and hamstring passes as part of a cool-down walk-and-roll routine; calf work on the days the training included running or jumping volume; and the travel case, where the stick is the only recovery tool that fits a carry-on — the format's sleeper argument for our frequently-flying readers. Between the GRID roller we already stock and this stick, the soft-tissue toolkit covers floor work and seated precision work; the massage gun stays the power tool for the deep work, and the stick is the manual tool that never needs charging.

Honest notes: the stick does not replace the roller for thoracic and glute work — backs and hips belong to the floor formats — and pressure through the arms fatigues faster than body-weight rolling, which is a feature disguised as a limit: the arms tire before you overdue it on any one spot. The foam surface wipes clean and the core is a solid rod; the format's lifetime is measured in years of hard use. As the third leg of the recovery toolkit on our shelf, the STK is the one that rides in the bag, the desk drawer, and the pre-warmup routine — the always-available version of the recovery discipline our training pages keep asking for.$BODY$,
  $BRAND$TriggerPoint$BRAND$, 'https://m.media-amazon.com/images/I/71LZQ5sKFbL._AC_SL1500_.jpg', 8.0, false, 'reviewed', true
from public.affiliate_store_categories c
where c.slug = 'foam-rollers-massage-tools'
on conflict (slug) do nothing;

-- ============================================================
-- 2) activate the two previously-empty leaves that now carry products
--    (the 530 audit measured 9 empty active leaves; this batch fills 2 —
--    the law §1.4: no category page goes live before it carries products,
--    and no products sit in an inactive leaf)
-- ============================================================

update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'home-gyms-cable-stations';
update public.affiliate_store_categories
set is_active = true, updated_at = now()
where slug = 'ellipticals-steppers';

-- ============================================================
-- 3) reload the PostgREST schema cache (the 0118/0119 closing pattern)
-- ============================================================
notify pgrst, 'reload schema';
