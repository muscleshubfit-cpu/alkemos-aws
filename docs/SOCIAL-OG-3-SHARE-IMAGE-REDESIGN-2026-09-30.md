> **⚠️ SUPERSEDED LAW (2026-11-06 — SOCIAL-OG-4):** the DEDICATED-FAMILY-CARD
> system this report shipped (30 new family cards + static per-comparison cards)
> was retired by the owner's 2026-11-06 order («استخدام الصورة الأولى الخاصة
> بكل صفحة تلقائيًا كصورة معاينة… وإن لم تكن للصفحة صورة خاصة فصورة الصفحة
> الرئيسية»): pages with an own content image keep it; every image-less page now
> shares the homepage card as the default fallback. The design system, the
> cache-bust mechanism and the crawler edge rules from this frame REMAIN LIVE
> and are the foundation SOCIAL-OG-4 builds on — see
> `docs/SOCIAL-OG-4-FIRST-OWN-IMAGE-HOME-FALLBACK-2026-11-06.md`.

# SOCIAL-OG-3 (2026-09-30) — Share-Card System Redesign & Full Coverage
## «نفّذ الخطة» — Brand-True Card Redesign, Static Comparison Cards, v=3 Re-bust, Share Buttons on Every Public Page

> **Task:** owner order 2026-09-30 — execute the fix plan from the two 2026-09-30 audits
> (blue/placeholder share-card root cause + og-home generic-card coverage audit), verify
> share buttons exist on every public page, test, document, push to `main`.
> **Task ID:** SOCIAL-OG-3-2026-09-30 · **Status:** EXECUTED (all gates green; live-verified)

---

## 1. What the audits proved (and this frame fixes)

1. **The card DESIGN was the root cause of «المربع الأزرق».** Every share card — 20 static
   family cards (Phase 187) AND the dynamic generator — used a dark
   `#1d1d1f → #0071e3` Apple-blue gradient that matches nothing in the brand. The site is a
   LIGHT monochrome marble & chrome system (`--bg #FAF8F5`, `--text #201D1A`,
   `--edge #E5DFD6`, `--tint #F1EDE7` — zero blue anywhere). ~354 wired surfaces shared a
   card that looked like a generic blue placeholder on Facebook/WhatsApp/SEO tools, while
   every earlier "fix" verified only HTTP status/content-type — never the pixels.
2. **The dynamic generator never understood `type=compare`.** It looked every slug up in
   `blog_posts`, missed the 3 comparison slugs, and rendered a default-English title on all
   6 comparison cards — even for `?lang=ar`. Its ~5 s cold render also burned the
   FB/WhatsApp crawler budget (the SOCIAL-OG-2 measured 1.7–5.2 s).
3. **The AR card footer had reversed word order.** Satori renders flex children in DOM
   order and IGNORES `direction` for flex layout — verified empirically this frame by
   rendering the exact fragment through `next/og`: DOM `[مدونة, Alkemos]` rendered مدونة
   LEFT of Alkemos (the audit's observed defect).
4. **~90 URLs across ~15 surface types × 2 languages shared the generic og-home card**
   (audit round 2): programs hub, memberships, coaching, diet-plan hub + 24 cells,
   equipment ×7, authors hub, compare hub, about, contact, faq, affiliate,
   for-coaches/register, privacy, terms — the static generator covered only 10 families
   and the "Phase 187 asset law" bound every uncovered surface to og-home.
5. **Share buttons existed on only 13 surfaces** (tools, evo, coaching, memberships,
   meal-planner, for-coaches, food/exercise/program details, blog articles). Compare
   (hub + all 6 detail pages), blog index, blog categories, muscle hubs, collections,
   equipment, authors, diet-plan, AI planners, about/faq/contact had NO share row.

## 2. Executed fixes (scope-locked to the share system)

### 2.1 Full visual redesign — the real brand palette (50 cards)
`scripts/generate-og-cards.py` now paints every card in the site's actual identity:
warm off-white diagonal gradient `#FAF8F5 → #EAE3D8`, machined hairline rules
(`#E5DFD6`) framing the title block (the "1px machined edge" motif), near-black circle
"A" mark + wordmark (`#201D1A`), warm-gray description/footer (`#6E675D`/`#8A8378`).
The retired blue is banned by test law (§3). Arabic cards verified: libraqm connected
glyphs + correct RTL bidi (deterministic correlation 0.984 RTL vs 0.522 LTR against
reference renders; VLM visual check clean).

### 2.2 30 new cards — dedicated card for every former og-home surface
12 new families × 2 languages (programs, memberships, coaching, diet-plan, equipment,
authors, compare hub, about, contact, faq, affiliate, legal[privacy+terms]) + 3 static
per-comparison cards × 2 languages (`og-compare-alkemos-vs-{myfitnesspal,freeletics,exrx}-{en,ar}`).
All 30 former og-home surfaces re-wired (EN + AR) — og-home now lives ONLY on the true
home roots and the noindex coach-landing pair (correct: for-coaches card carries
recruiting copy, wrong intent for a profile share).

### 2.3 Comparison pages leave the generator (static cards, zero cold start)
`/compare/[slug]` EN+AR now declare the static per-comparison card in og:image +
twitter:image + Article JSON-LD (§12.40 consistency kept) — correct bilingual title,
brand-true design, no serverless cold start on the crawler path. The generator keeps a
correct `type=compare` branch (looks up `COMPARISONS` — pure data, edge-safe) so every
LEGACY generator URL still cached by platforms renders correctly on re-fetch.

### 2.4 Dynamic generator redesign + two defect fixes
`src/app/api/og-image/[slug]/route.tsx`: same light brand palette as the static cards
(§2.1); `type=compare` honored (real bilingual H1); AR footer word order fixed by
ordering the children `[Alkemos, مدونة]` — the Arabic word comes LAST in the DOM and
therefore renders RIGHTMOST (the empirical Satori law, documented in the route).

### 2.5 `?v=3` site-wide share-cache-bust
Every self-hosted share-image reference (79 files) bumped `?v=2 → ?v=3`. A new image
URL is a cache miss at every platform — the next scrape of ANY page must fetch the
redesigned card. Single bump point: `SHARE_IMG_VER` in `og-image-coverage.test.ts`.

### 2.6 Share buttons on every public content/conversion surface (+23 surfaces)
`ShareButtons` (canonical-URL law, Phase 230) added to: compare hub + detail (EN+AR),
blog index + 10 categories ×2 (shared `BlogListPage`/`BlogCategoryPage`), muscle hubs,
collections, equipment, authors hub + profiles, diet-plan hub, AI meal/workout planners
(AR mirrors re-export the EN pages), about + faq (shared `StaticPageView`, path-aware),
contact (`ContactView`). Documented exclusions: privacy/terms (legal pages carry no
share intent); the raw home pages keep their existing patterns.

## 3. Guardrails shipped with the same commit

- **`og-image-visual.test.ts` (NEW — 51 tests):** dependency-free PNG decoder
  (zlib inflate + scanline unfilter) asserting for EVERY card on disk: true 1200×630,
  **zero strong-blue pixels** (the `#0071e3` class can never return unnoticed), warm-light
  corners (r ≥ b, light), and real ink (a silently-blank card fails). Plus the
  source-level twin over the generator route (code-only, comments excluded).
- **`og-image-coverage.test.ts` (71 tests):** 50-card existence law, 30 re-wired surface
  contracts, per-comparison static-card law (every `COMPARISONS` slug must have a card
  pair on disk — adding a comparison without running the generator fails CI), legacy
  `type=compare` route law, orphan-card law (no stray PNGs).
- **`share-url.test.tsx` / `share-unify.test.tsx`:** the SURFACES/REGISTERED_SURFACES
  registries extended to the full public-surface law (34 + 16 entries) — a future
  unregistered share surface fails CI.
- **`ar-mirrors.test.ts` / `low-fixes-p2-14.test.ts`:** updated for the dedicated
  affiliate card and the static compare cards (§12.40 og ↔ JSON-LD identity).

## 4. Verification (all green, 2026-09-30)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx eslint .` | 0 errors (1 pre-existing warning, untouched file) |
| `npx vitest run` | **1,977 / 1,977** (118 files) |
| `npx next build` | green — 2,023 routes |
| Live `next start` smoke (facebookexternalhit UA) | compare EN+AR emit the static card URLs (?v=3) in og + twitter; 8 EN + 4 AR hubs emit their dedicated cards; all sampled cards serve `200 image/png`; the LEGACY `?type=compare&v=2` generator URL renders the NEW light design with the real AR title (pixel-verified: 0 blue px); share buttons SSR-render on compare pages (EN + AR labels) |
| Visual (PIL + VLM) | 50/50 cards pass palette law; AR shaping + RTL order verified deterministically |

## 5. After-deploy expectations & owner actions

- Fresh shares re-scrape → new URL (?v=3) → the redesigned warm-light card renders.
  Pages already poisoned in Facebook's cache still need ONE of: a fresh share, ≤30-day
  TTL decay, or Sharing-Debugger "Scrape Again" (batch the top URLs first) — same
  residual as SOCIAL-OG-2 §4, now with a cache-proof URL.
- No edge-side work needed: the SOCIAL-OG-2 Cloudflare crawler-allow WAF rule is
  path-based and untouched; static PNGs were never on the cold path.
- If a NEW comparison is added to `src/lib/comparisons.ts`: add its SPECS pair to
  `scripts/generate-og-cards.py`, run it, and CI enforces the rest.

### 5.1 Measured post-deploy transition (2026-09-30, ~1 h after push)

The origin (Vercel production) serves the NEW build — verified directly: the
brand-new card URLs (`/images/og/og-programs-en.png?v=3` etc.) return `200 image/png`
with the new byte sizes, and those URLs could only exist on the new deployment.
However, the **Cloudflare edge serves CACHED HTML from the previous build** for pages
crawled before the deploy (`cf-cache-status: HIT`, `age` ≈ 2 h and growing, origin
headers `s-maxage=3600, stale-while-revalidate=86400`; the zone's HTML edge TTL
observably exceeds s-maxage). Until each page's edge entry revalidates (≤ 24 h worst
case), a scrape of THAT cached page still reads the previous og:image — which now
resolves to the generator/old-asset path and, at worst, the old cached PNG.

**This is NOT a failed deploy.** Expectations:
- Within ≤ 24 h every page self-flips to the new meta (new static card URL ?v=3 =
  guaranteed CF cache miss = new card immediately).
- To flip INSTANTLY (optional, one click): Cloudflare dashboard → Caching →
  **Purge Everything** (or purge the top shared URLs). Alternatively, testing a share
  with `?v=3` appended to the PAGE URL bypasses the HTML cache for a quick preview.
- Recommended order once CF is purged: Facebook Sharing Debugger → "Scrape Again"
  on the top shared URLs.

## 6. Files touched (summary)

- `scripts/generate-og-cards.py` (redesign + 36 new SPECS) + 50 regenerated PNGs (30 new).
- `src/app/api/og-image/[slug]/route.tsx` — compare support, light redesign, RTL footer fix.
- `src/app/(en|ar)/.../compare/[slug]/page.tsx` ×2 — static cards (og + twitter + JSON-LD).
- 30 surface files re-wired to dedicated family cards; 79 files bumped `?v=3`.
- 23 share-button surfaces added (25 files incl. 4 shared components).
- Tests: `og-image-visual.test.ts` (new), `og-image-coverage.test.ts`, `share-url.test.tsx`,
  `share-unify.test.tsx`, `ar-mirrors.test.ts`, `low-fixes-p2-14.test.ts`.
- Docs: this report + `docs/README.md` row + `worklog.md` entry + `STATE.md` phase 308.
