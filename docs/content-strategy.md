# Alkemos Content Strategy — Source of Truth (Non-Blog Pages)

**Version:** 1.1 (final content quality gate) · **Date:** 2026-09-19 (UTC) · **Owner scope:** every public non-blog page, Arabic and English.
**Law of this document:** when any page copy, metadata string, schema text, or card label disagrees
with this document, this document wins — unless it disagrees with the code, in which case the code
wins and this document is updated first.

---

## 1. What Alkemos actually is (positioning)

Alkemos is a bilingual (Arabic-first + English) fitness and nutrition platform that combines:

| Surface | Reality (from code) |
|---|---|
| Exercise library | 868 exercises, per-muscle and per-equipment hubs (`exercises-shared.ts`, test-pinned) |
| Food database | 8,830 foods with calories/macros per 100 g (`foods-shared.ts`, test-pinned) |
| Free tools | 8: calorie, BMI, macro, body-fat calculators + water tracker + meal planner + AI meal planner + AI workout planner (`tools-shared.ts`) |
| Diet plan library | 24 ready-made daily plans (6 calorie levels × 4 systems), in grams (`diet-plan-matrix.ts`) |
| Workout programs | 7 ready-made programs, home + gym, 6–12 weeks (`workout-programs.ts`) |
| EVO | AI coach on every page: free 10 msgs/day; answers from platform blog with links; guides to platform pages; builds plans from the unified monthly pool |
| Memberships | Free $0 · Premium $14.99/mo \| $119/yr · Pro $29.99/mo \| $239/yr · Coaching $39.99/mo \| $359/yr (`memberships.ts`) |
| Coaching tier | Personal coach: plans, weekly check-in reminders, manual swaps, direct contact, priority support + all Pro limits |
| For coaches | Free registration, instant activation; coach sets client prices and collects directly (0% commission); platform charges a fixed per-active-client activation fee from the coach wallet |
| Payments | PayPal (automatic), InstaPay + Vodafone Cash (manual receipt, reviewed within 24 h) |

**One-line positioning:**
- **EN:** Alkemos is the bilingual fitness platform that turns your numbers into plans: 868 exercises, 8,830 foods, 8 free tools, ready programs and diets — with EVO, an AI coach that knows your data, and optional personal coaching.
- **AR:** Alkemos منصة لياقة وتغذية ثنائية اللغة تحوّل أرقامك إلى خطط: 868+ تمرينًا، و8,830+ صنفًا غذائيًا، و8 أدوات مجانية، وبرامج وخطط جاهزة — مع EVO مدرب ذكي يعرف بياناتك، وكوتشينج خاص اختياري.

**Positioning ladder (who it's for):** Arabic speaker underserved by Western fitness apps (primary),
and any lifter/learner worldwide who wants free, no-signup tools + reference content (secondary).
Arabic is a **standalone market**, not a translation of English.

---

## 2. Search intent research (captured 2026-09-19)

**Method & sources.** Competitor and SERP observations below come from 13 live
web-search result sets captured on 2026-09-19 and stored as raw JSON in
`docs/research/2026-09-19-serp/` in this repo (files:
`ar-calorie-serp`, `ar-macro-serp`, `ar-programs-serp`, `ar-diet-serp`,
`ar-coach-serp`, `ar-coachprice-serp`, `ar-platform-serp`,
`arabic-fitness-apps-serp`, `en-aicoach-serp`, `en-aimeal-serp`,
`en-coaching-serp`, `en-exdb-serp`, `en-mfp-alt-serp`). Rows marked
**(desk)** were not SERP-captured — they are editorial assessments and must
not be quoted as SERP findings.

**No ranking claims.** These snapshots describe what appeared in results on
the capture date. They say nothing about where Alkemos ranks (new pages, no
rank history) and no superiority over any competitor is claimed or implied.
Competitor names are listed as observed result participants, not as
benchmarks we assert to beat.

### Arabic market (SERP snapshots + desk notes)

| Query cluster | Intent | What the results showed (source file) | Alkemos angle |
|---|---|---|---|
| حاسبة السعرات الحرارية | Calculate my daily calories | Health ministries (moh.gov.sa, mohap.gov.ae), hospitals, portals — basic calculators, no macros split, no method named (`ar-calorie-serp`) | Name the method (Mifflin-St Jeor), give macros + BMR/TDEE too, Arabic reference content, results savable |
| حاسبة الماكروز / ماكروز | Split calories into P/C/F | saudi-fit, nutridaybyday, arabketo, arabianbodybuilding — single-page tools (`ar-macro-serp`) | Same tool quality + macro presets + meal-planner handoff |
| حاسبة كتلة الجسم / BMI | Check weight category | **(desk)** medical/health portals dominate this family generally; not captured in this pass | WHO bands + honest limitations content (already strong) |
| جدول تمارين للمبتدئين | Ready weekly schedule | saudi-fit (5-day splits), daily.sa, scribd PDFs (`ar-programs-serp`) | Real programs with full weekly tables + linked exercise pages |
| نظام غذائي للتخسيس / جدول وجبات | Ready meal table with calories | dietworldsa, altibbi, clinic pages, Play Store diet apps (`ar-diet-serp`) | 24 gram-level plans (6 levels × 4 systems) from a familiar Arab kitchen |
| مدرب شخصي أونلاين | Human follow-up, price check | Individual coach sites (`ar-coach-serp`) + 2026 global pricing guides — coachway.io, gainsfromgeebs.com, warriorbabe.com (`ar-coachprice-serp`; those guides discuss 1-on-1 rates, exact ranges not re-verified here) | Coaching at a fixed, published price ($39.99/mo) with real limits shown up front |
| منصة رياضية أونلاين | Integrated training + nutrition | Play Store apps, generic portals (hadafpro, for9a) — no strong integrated-platform result (`ar-platform-serp`) | "المنصة المتكاملة" play: tools + libraries + AI + coaching in one place |

### English / global market

| Query cluster | Intent | What the results showed (source file) | Alkemos angle |
|---|---|---|---|
| calorie calculator / TDEE calculator | Compute numbers | **(desk)** mature, long-established tool space; not captured in this pass | Method transparency, no-signup use, free JSON export |
| AI meal planner free no signup | Generate a plan now | strongrfastr, dishgen, easy-peasy, template.net, clove.kitchen, calfix — "free, no signup" is the entry ticket (`en-aimeal-serp`) | Lead with "2 free generations/month, no signup, grams-level, Arab-kitchen foods" |
| exercise database / library | Browse exercises with instructions | muscleandstrength (1500+), kilo (1400+), legend-tracker (1600+), ACE (`en-exdb-serp`) | We are smaller on count — compete on bilingual depth, linked programs, integrated planner, clean UX |
| AI fitness coach | Chat-based advice | BodBot, budy.fit, generic chatbots; press coverage of ChatGPT trainers (`en-aicoach-serp`) | EVO = reads your data + platform-grounded answers with links |
| MyFitnessPal alternatives | Leave MFP | Fitia, PlateLens, FoodNoms, eatthismuch, mealthinker, nutriscan (`en-mfp-alt-serp`) | Free basics not paywalled, Arabic, AI plans, no barcode (be honest) |
| online coaching platform (B2B) | Software for coaches | Trainerize, promealplan comparison guide, coachcatalyst (`en-coaching-serp`) | /for-coaches: 0% commission, your prices, your clients |

### Intent→page mapping (page-to-keyword map)

| Page (EN → AR) | Primary keyword | Secondary keywords | Intent |
|---|---|---|---|
| `/` → `/ar` | fitness & nutrition platform / منصة اللياقة والتغذية | free fitness tools, AI coach, exercise library, حاسبات مجانية, مدرب ذكاء اصطناعي | Navigational + informational |
| `/evo` → `/ar/evo` | AI fitness coach / مدرب الذكاء الاصطناعي | AI nutrition coach, chatbot that builds plans, EVO | Informational |
| `/memberships` → `/ar/memberships` | fitness membership pricing / أسعار العضويات | premium vs pro, fitness subscription, باقات اللياقة | Commercial |
| `/coaching` → `/ar/coaching` | online coaching / كوتشينج أونلاين | online personal trainer, مدرب شخصي أونلاين, weekly check-ins | Commercial |
| `/for-coaches` → `/ar/for-coaches` | coach platform / منصة للمدربين | personal trainer software, 0% commission, عمل كمدرب أونلاين | Commercial (B2B) |
| `/tools` → `/ar/tools` | free fitness tools / أدوات لياقة مجانية | fitness calculators, حاسبات اللياقة | Navigational |
| `/tools/calorie-calculator` → AR | calorie calculator / حاسبة السعرات الحرارية | TDEE, BMR, daily calorie needs, احتياجك اليومي | Tool |
| `/tools/bmi-calculator` → AR | BMI calculator / حاسبة مؤشر كتلة الجسم | healthy weight range, وزن صحي | Tool |
| `/tools/macro-calculator` → AR | macro calculator / حاسبة الماكروز | protein carbs fat split, توزيع الماكروز | Tool |
| `/tools/body-fat-calculator` → AR | body fat calculator / حاسبة نسبة الدهون | Navy method, طريقة البحرية الأمريكية | Tool |
| `/tools/water-tracker` → AR | water tracker / متتبع شرب الماء | daily water intake, كمية الماء اليومية | Tool |
| `/meal-planner` → AR | meal planner / مخطط الوجبات | build meals with macros, بناء وجبات بالماكروز | Tool |
| `/ai-meal-planner` → AR | AI meal planner / مخطط الوجبات بالذكاء الاصطناعي | free meal plan generator, توليد خطة غذائية | Tool |
| `/ai-workout-planner` → AR | AI workout planner / مخطط التمارين بالذكاء الاصطناعي | weekly split generator, تقسيمة أسبوعية | Tool |
| `/diet-plan` → AR | diet plan library / خطط غذائية جاهزة | 1200-calorie meal plan, نظام غذائي للتخسيس, جدول وجبات | Informational |
| `/exercises` → AR | exercise library / مكتبة التمارين | workout database with instructions | Informational |
| `/foods` → AR | food database / مكتبة الأطعمة | calories per 100g, السعرات لكل 100 جرام | Informational |
| `/programs` → AR | workout programs / برامج التدريب | beginner program, جدول تمارين, home workout plan | Informational |
| `/muscles/[group]` → AR | chest exercises / تمارين الصدر (+7 groups) | best chest exercises, تمارين [عضلة] | Informational |
| `/equipment/[type]` → AR | dumbbell exercises / تمارين الدمبل (+7 types) | barbell/bodyweight/cable… | Informational |
| `/collections/[slug]` → AR | high protein foods / أطعمة عالية البروتين (+9) | keto food list, vegan protein sources | Informational |
| `/compare/[slug]` → AR | alkemos vs myfitnesspal (+freeletics, exrx) | mfp alternative, مقارنة تطبيقات اللياقة | Commercial |
| `/about`, `/faq`, `/contact` → AR | brand queries | — | Navigational |

**Anti-cannibalization rules:** one page = one primary keyword. Calculators never target
"protein calculator" (belongs to macro). The tools hub targets the cluster word, individual tool
pages own their tool name. `/diet-plan` owns "خطط غذائية جاهزة"; `/ai-meal-planner` owns
"AI meal planner / توليد خطة بالذكاء الاصطناعي"; `/meal-planner` owns manual building. `/coaching` owns "كوتشينج أونلاين";
`/for-coaches` owns B2B coach intent; `/evo` owns AI-coach intent.

---

## 3. Terminology (unified — all surfaces)

### Arabic canonical terms

| Concept | Canonical AR | Forbidden variants |
|---|---|---|
| Coach (person) | مدرب | كوتش (allowed only inside fixed brand/product names) |
| Coaching (product) | الكوتشينج | تدريب أونلاين alone |
| AI coach | مدرب ذكاء اصطناعي | الكوتش الذكي |
| Membership/tier | عضوية / باقة | اشتراك (only for the act of subscribing & cancellation copy) |
| Plan (generated/coaching) | خطة | برنامج |
| Program (ready-made training) | برنامج | خطة تدريب |
| Calorie | سعرة حرارية (long) / سعرة (unit value) | كالوري (allowed in stats chips alongside سعرة? → NO: unify to سعرة) |
| Gram | جرام (spell out) / جم (unit chip) | غ (diet-plan leaves must switch to جم) |
| Macro | ماكروز | الماكروزية، العناصر الكبيرة |
| Meal | وجبة | أكلة |
| Breakfast | الفطور | فطار، الفطار، سحور (Ramadan context only) |
| Maintain (goal) | تثبيت الوزن | ثبات |
| Exercise | تمرين | حركة (allowed in coaching register) |
| Sets/reps | مجموعات / تكرارات | ستات، ريبات |
| Body fat % | نسبة الدهون | الدهون alone |
| Lean mass | الكتلة الصافية (خالية الدهون) | الكتلة العضلية (muscle ≠ lean) |
| BMI | مؤشر كتلة الجسم (BMI on first mention) | كتلة الجسم alone |
| Exercise library | مكتبة التمارين | قاعدة بيانات التمارين |
| Food library | مكتبة الأطعمة | قاعدة بيانات الأطعمة (metadata may use it as secondary keyword) |
| Save | حفظ | خزّن |
| Upgrade CTA | طوّر باقتك / ارتقِ بباقتك | ترقّي (colloquial-leaning) |
| Tier names | مجاني، بريميوم، برو، كوتشينج | free/premium/pro bare Latin in AR sentences |
| Numerals | Western digits (868, 8,830, 24) everywhere | Arabic-Indic ٢٤/٦/٤ (only inside quoted classical text) |

Tool names (fixed, used by hub, nav, footer, cross-links, schema):
حاسبة السعرات الحرارية · حاسبة مؤشر كتلة الجسم · حاسبة الماكروز · حاسبة نسبة الدهون ·
متتبع شرب الماء · مخطط الوجبات · مخطط الوجبات بالذكاء الاصطناعي · مخطط التمارين بالذكاء الاصطناعي.

### English canonical terms

"Coach" (personal), "AI coach" (EVO), "membership" (tier), "plan" (generated/coaching),
"program" (ready-made), "meal planner" (manual), "AI meal/workout planner" (generators),
"diet plan library" (24 ready plans), "exercise library", "food database" (EN may keep
"database" — it is the global search term), "swaps" (meal/exercise swaps).

### Numbers (facts that must stay in sync — derive from code, never hardcode)

868 exercises · 8,830 foods · 8 tools · 24 diet plans · 7 programs · prices
$14.99/$119 · $29.99/$239 · $39.99/$359 · free pool 2 generations/month (visitors too) ·
premium 4 · pro/coaching 8 · swaps 3/wk (premium) 6/wk (pro+) · EVO free chat 10 msgs/day ·
meal planner caps 3/1, 6/10, 8/50 · saved results 3/50/200 · refund 7 days if no paid feature used.

Number grammar (AR): after 868 / 8,830 (compounds ending 11–99) the counted noun is singular
accusative: "868+ تمرينًا", "8,830+ صنفًا غذائيًا". After 8: "8 أدوات".

---

## 4. Writing rules

### Arabic (MSA, independent market)

1. **MSA only** — understandable from Morocco to Oman. Forbidden: Egyptian dialect
   (عشان، بتاع، كده، لازم، محتاج، فاضل، بيتخزن، ضيف، اقبض، جرب تاني، ده، توصل، خد، شوف، حصل خطأ، بعتنا، باقتي، حدك)،
   Gulf dialect (شلون، شكثر، فيه للوجود), and any Latin-letter Arabizi (الشراگ).
2. **Not a translation.** EN and AR are written for their own audiences: AR leads with the
   Arab-kitchen foods, regional realities (Ramadan, baladi bread, ful medames), and Arab-market
   price/value framing; EN leads with method names and global comparisons.
3. Direct address: المخاطب المفرد (أنت) — "احسب، ابنِ، تدرّب" — respectful, never chatty.
   Gender: neutral masculine grammatical forms (standard MSA).
4. No religious clichés, no political references, no body-shaming. Health disclaimers where due.
5. Punctuation: Arabic comma (،) and question mark (؟) in AR copy. Latin brand tokens
   (Alkemos, EVO, PayPal, BMI) may sit inline with correct spacing.
6. Numbers: Western digits. Units: جرام spelled in prose, جم in tight chips, سعرة for values.

### English (global, human)

1. Plain, confident, specific. Name methods and numbers (Mifflin-St Jeor, WHO bands, 35 ml × kg).
2. Forbidden AI-isms: "unleash", "game-changer", "revolutionize", "take your fitness to the
   next level", "everything you need… in one place", "journey" (except where already
   conventional), "dive in", "unlock" (except literal feature gating), em-dash aphorisms.
3. Claims must be verifiable from the code or hedged ("for most people", "a useful estimate").
   No invented social proof, no "best/first/leading" without a named, checkable basis.
4. US spelling. Sentence case for headings. Oxford comma.

### Both languages (GEO / answer-engine readability)

- Every page answers its title question in the first 40–60 words of the H1 section, in plain
  sentences an answer engine can lift verbatim.
- One H1. H2s phrased as the questions users actually ask where natural ("How many AI plans
  per month?"). FAQ blocks use the exact question as the heading.
- Define entities once, then reuse the exact term (EVO, unified monthly pool, swaps).
- Numbers with units in the sentence ("8,830 foods with calories and macros per 100 g").
- No keyword stuffing: primary keyword once in title, once in H1/intro, once in a subheading
  or alt; synonyms and entities do the rest.

---

## 5. Approved claims register

**Approved (backed by code/tests):** library counts; tier limits and prices; 2 free generations
for every visitor with no signup; plans stay on-device without an account, saved + synced with a
free account; only successful generations count; pool resets on the 1st (UTC); swaps reset
Mondays; 7-day refund if no paid feature used; payment methods (PayPal automatic, InstaPay/
Vodafone Cash manual, reviewed within 24 h); PWA installable; data access controlled at the
database level (RLS); EVO answers from the platform blog with links; EVO memory free with an
account; weekly knowledge distillation from anonymized platform plans.

**Banned (unproven — must not appear):**
- "Most popular" (no subscriber data) → use "Recommended" (editorial).
- "Certified coaches / مدربون معتمدون" without a named certifier → "professional coaches /
  مدربون محترفون" (bio: drop "certified" unless a certificate body is named).
- "Vetted coaches / مدربين موثّقين" in comparisons → "personal coaches at $39.99/mo".
- "المنصة الأولى" / "the leading platform" → aspirational vision phrased as ambition, not fact.
- "Best platform / أفضل منصة", "#1", invented user counts, invented review scores.
- Time-to-result promises ("see abs in 30 days").
- "5 generations per day" (stale) → unified pool: 2/month free visitors.
- "Nothing is saved" for AI planners (stale) → plans persist on device/account.
- Water tracker "Reminder" (no reminder feature exists) → "daily hydration goal & log".

**Founder claims (About/Coaching):** Ahmed Zake, founder; fitness & nutrition coach with 10+
years of practical experience training clients online and in person; personally reviews
platform content before publication. The word "certified/معتمد" is dropped pending a named
certificate. "First-hand review of every article" stays because it describes his own role.

---

## 6. Page-by-page content strategy

Each page: **[Job] → structure notes → CTA → internal links.**

1. **Home `/`+`/ar`** — [Discovery + usage, not a sales pitch] Hero (positioning line + real
   numbers + signup/save ladder), quick-nav, tools section, training library (muscle chips +
   real samples), food database (real samples), articles carousel, coaching spotlight, FAQ (5).
   CTAs: guest → create free account; member → dashboard. Links: tools, exercises, foods,
   programs, blog, coaching, memberships (footer/header only).
2. **EVO** — [Explain + try] What-is block (answer-engine-first), EVO vs chatbot table,
   features, how it works, Free-vs-Subscriber table (mirrors real enforcement), platform-fit
   link grid. CTA: open the chat widget (no signup), see plans.
3. **Memberships** — [Choose a tier] Positioning ladder Free=experience → Premium=manage →
   Pro=adapt → Coaching=personal. Cards from `memberships.ts`, comparison table, pool + swaps
   explainer, refund policy, 5 FAQs. Links: /coaching, /compare, /checkout.
4. **About** — [Trust] Who we are (human + AI vision), what the platform actually contains
   (linked), founder, EVO summary (linked), memberships summary (linked, 4 products not 3),
   honest vision phrased as ambition. Internal links are mandatory here.
5. **Coaching** — [Convert high-intent] What you get (4 pillars = real coaching features),
   4-step journey, EVO included, trust row (founder oversight, transparent limits, 7-day
   refund), single $39.99 card with real limits, 6 FAQs, honest closing CTA. No body-promise
   clichés ("Your new body is waiting" → replaced).
6. **For Coaches** — [B2B convert] Your price/your money (0% commission, fixed activation
   fee — described qualitatively, amount shown only where the product shows it), client
   ownership, tools (AI pool rules), upsell membership, 4 steps, FAQ (7), share block.
7. **Tools hub + 8 tools** — [Use] One H1 per tool, immediate "what this does + what you get",
   form → result → save/share → reference content (the strong long-form layer) → OtherTools
   cross-links. Every tool page names its method. Metas list all 8 tools on the hub only.
8. **Diet plan library** — [Pick a plan] 24 plans explained (6 levels × 4 systems), how to
   read a plan, customize path to planners. Leaves: full day in grams, macro table, guidance,
   4 FAQs, related plans mesh.
9. **Exercises / Foods / Programs** — [Browse + learn] Explorers with live counts, filters,
   real samples; detail pages with instructions/nutrition + related items + plan CTA.
10. **Muscles / Equipment / Collections hubs** — [Own the topic] H1 = the exact search phrase,
    guide + FAQs + live grid + cross-links to the other hub family + tools CTA.
11. **Compare** — [High-intent decision] Honest tables, wins both ways, verdict that names who
    should pick the competitor. 3 comparisons (MFP, Freeletics, ExRx).
12. **FAQ** — [Answer + route] 10 Q&As that route to the right page; visible copy = schema copy
    (one source: `faq-content.ts`).
13. **Contact** — [Route correctly] Email, logged-in ticket path, honest guest-path copy
    (message stays on device; email us for a guaranteed reply).

---

## 7. Internal linking strategy

- **Hub-and-spoke:** `/exercises` ↔ `/muscles/*` ↔ `/equipment/*` ↔ exercise details;
  `/foods` ↔ `/collections/*` ↔ food details ↔ `/meal-planner`.
- **Tool chain:** every calculator → (calorie → macro → meal planner → AI meal planner);
  AI workout planner → `/exercises/*` (from generated plans) → `/programs`.
- **Money pages get linked from information pages, not the reverse flooding:** every tool page
  CTA → `/memberships` (soft); coaching pillars → `/coaching`; comparisons → `/memberships`,
  `/evo`, `/tools`.
- **EVO is the AI intent hub:** planners, coaching, about, tools hub all link `/evo`;
  `/evo` links back to planners + coaching + tools + programs + memberships.
- **About links the platform surfaces it describes** (exercises, foods, tools, EVO,
  memberships) — previously zero links.
- AR pages always link AR mirrors (except shared `/auth`).
- Anchor text = the destination's canonical name (terminology table §3). No "click here".

---

## 8. Tone benchmarks (do / don't)

**AR — do:** «خطة تغذية بالغرامات تبدأ من أرقامك أنت، لا من قالب عام.»
**AR — don't:** «احصل على الجسم الذي تحلم به مع أفضل منصة رياضية!»
**EN — do:** "Your calorie target comes from the Mifflin-St Jeor equation — the most accurate
estimate you can get from just a scale and a tape measure."
**EN — don't:** "Unlock your dream body with the ultimate AI-powered fitness revolution!"

---

## 9. Out of scope (this pass)

- Blog (all posts, categories, authors pages) — explicitly excluded.
- The 868-exercise data file (names/instructions/tips) and the 8,830-food data rows — data
  quality programs (Food Arabization batches) track those separately; only UI chrome copy here.
- Business logic: prices, quotas, checkout flows, tier enforcement.
- The coach landing pages' DB-driven content (coach-authored bios).
- Design system changes, new sections, new pages.
