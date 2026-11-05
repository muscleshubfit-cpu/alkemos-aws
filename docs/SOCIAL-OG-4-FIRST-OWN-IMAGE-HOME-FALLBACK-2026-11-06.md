# SOCIAL-OG-4 (2026-11-06) — First-Own-Image Law + Homepage Fallback
## «استخدام الصورة الأولى الخاصة بكل صفحة تلقائيًا كصورة معاينة، وإن لم تكن للصفحة صورة خاصة فصورة الصفحة الرئيسية»

> **Task:** owner order 2026-11-06 (independent item — «بند مستقل — إصلاح صور معاينة مشاركة روابط الموقع»): review ALL previous attempts and reports about Alkemos link-share images on social platforms / engines / link-display services, determine the ROOT CAUSE, treat it — with the explicit required behavior: (1) each page/article's first OWN image becomes the share preview automatically, (2) pages without an own image use the homepage image as the default, (3) applied to ALL pages and articles in Arabic and English, (4) OG/Twitter data compatible with the different platforms, (5) caching issues that could keep stale images after the fix treated too — then ACTUALLY test diverse links (not just code checks) and avoid repeating the previous unsuccessful solutions.
> **Task ID:** SOCIAL-OG-4-2026-11-06 · **Status:** EXECUTED (all gates green; post-deploy live verification §7)

---

## 1. The review of every previous attempt (what each fixed, what stayed wrong)

| Attempt | What it concluded & fixed | What it did NOT change (the residue this frame treats) |
|---|---|---|
| SOCIAL-OG-248 (2026-09-22) | Blog shares: cover-first law — articles share their real Pexels cover instead of the blue branded square; generator cold-start fixed | Only the blog family; every other surface kept branded cards |
| SOCIAL-OG-2 (2026-09-28) | 741-URL audit green; root causes named = stale platform scrapes from 3 broken eras + fragile metadata (wrong dims, no type, no cache-bust, no crawler edge rule). Fixes: `?v=2` bust on 73 files, truthful dims/type, CF WAF allow rule for share crawlers | The IMAGE CHOICE itself: pages kept sharing generic branded family cards; the fix philosophy stayed "make the branded card reachable + fresh" |
| SOCIAL-OG-EX (2026-09-22, inside OG-2) | Exercise pages: cover-first real photo (the exercise's 0.webp) with the branded card as fallback only | Other families stayed card-only |
| SOCIAL-OG-3 (2026-09-30) | Root cause then: the card DESIGN (Apple-blue gradient ≠ brand). Fixes: brand-true redesign of all 50 cards, 30 new DEDICATED family cards (programs/memberships/…), static per-comparison cards, `?v=3` re-bust, share buttons +23 surfaces | The DEDICATED-FAMILY-CARD philosophy itself — the owner has now judged this approach unsuccessful for the goal: a page's share still does not show that page's own image, and pages with no card of their own show a generic one |

**The root cause this frame (measured live 2026-11-06, facebookexternalhit UA, before the fix):** the share-image system was CARD-CENTERED, not IMAGE-centered. Every page family pinned a shared branded PNG (`og-tools`, `og-foods`, `og-memberships` …) regardless of whether the page had its own image:

- `/foods/chicken-breast` + `/ar/foods/olive-oil` + every food page (80 curated ×2 + the AR scope) + the new food comparisons → generic `og-foods` card
- `/tools/*` (10 surfaces ×2) → generic `og-tools` card
- `/memberships`, `/evo`, `/coaching`, `/about`, `/faq`, `/contact`, `/affiliate`, legal, blog index + categories, exercise/muscle/equipment hubs, collections, diet-plan hub + 24 cells, programs hub, compare hub + all comparison details, authors hub, trackers, planners, guides, methodology → each a family card, none the page's own image
- Only 4 families were already image-centered and correct: **blog articles** (Pexels cover — verified live 200, 1200×630, ~104-130 KB), **exercise details** (first self-hosted photo), **program details** (program illustration), **author profiles** (avatar) — plus the home roots (og-home card).

**Format compatibility (researched, sources below):** WebP og:image is supported by every major platform today except Xing (darekkay.com multi-platform test, updated Nov 2025); LinkedIn's own media table lists WEBP as supported across platforms. Exercise photos (640×427 webp, ~11 KB) and program illustrations (768×768 webp) are above every minimum (LinkedIn full-image threshold 401 px; WhatsApp ≥300 px) — no conversion needed; truthful `og:image:width/height/type` declarations were already the law (OG-2) and stay. Pexels covers measure 104-130 KB — inside WhatsApp's <600 KB guidance. The one real incompatibility left was the IMAGE CHOICE, not the bytes.

## 2. The executed law (owner requirement, operationalized)

**`og:image` = the page's first OWN content image; every page without one shares the homepage card as the default fallback.**

1. **Pages with an own image keep it (now with `?v=4`):**
   - blog article → its featured Pexels cover (SOCIAL-OG-248 law, untouched)
   - exercise detail → its first self-hosted photo; the photo-less fallback is now **og-home** (was the og-exercises card — the fallback obeys the same law)
   - program detail → its program illustration
   - author profile → the author's avatar
   - the home roots (`/`, `/ar`) → the homepage brand card (og-home-en/ar — the site's identity image)
2. **Every page without an own content image → `og-home-en.png?v=4` / `og-home-ar.png?v=4`** (language-matched): foods + food comparisons + methodology, tools, exercises hub + muscles + equipment + collections, blog index + categories, diet-plan hub + cells, programs hub, memberships, coaching, evo, about, faq, contact, affiliate, legal, compare hub + platform-comparison details, authors hub, for-coaches + register, coaches landing, trackers (workout/macro), meal-planner, ai-planners, guides.
3. **Twitter cards:** `twitter:card = summary_large_image` + `twitter:image` mirrors og:image everywhere (unchanged law, re-asserted by the rewritten coverage test).
4. **Retired assets:** the 54 former family/per-comparison card PNGs are deleted (git history preserves them); `scripts/generate-og-cards.py` SPECS reduced to the og-home pair (count-free copy law kept — the original og-home text restored verbatim).

## 3. Files touched (measured)

- **87 source files** swept (metadata URL swaps + inline comment refreshes) — the full WIRED_SURFACES list is the law itself: `src/lib/__tests__/og-image-coverage.test.ts`
- **54 PNGs deleted** from `public/images/og/` (kept: `og-home-en.png`, `og-home-ar.png`)
- `scripts/generate-og-cards.py` — SPECS = the og-home pair only
- Tests rewritten/updated: `og-image-coverage.test.ts` (the SOCIAL-OG-4 law: 86 wired fallback surfaces + own-image assertions for exercises/blog/programs/authors + orphan law = exactly 2 cards), `og-image-visual.test.ts` (disk = the pair), `ar-mirrors.test.ts`, `low-fixes-p2-14.test.ts` (og↔JSON-LD identity for the compare pages now against og-home)
- `docs/SOCIAL-OG-3-SHARE-IMAGE-REDESIGN-2026-09-30.md` — superseded-law banner (this frame's header)

## 4. Cache treatment (the explicit requirement #5)

- **`SHARE_IMG_VER` `?v=3` → `?v=4`** on every self-hosted share-image reference (single bump constant): a NEW image URL is a cache miss at every platform — the next scrape of ANY page fetches fresh (the SOCIAL-OG-2 mechanism, applied to the new law). Pages whose og:image URL changed (family card → og-home) get this for free; the own-image surfaces (exercise photo / program image / avatar) carry the explicit `?v=4` bump.
- **Edge/HTML cache:** production pages revalidate within the ISR window (≤60 min; worst-case edge TTL documented at ≤24 h). To flip the TESTED set instantly, a targeted Cloudflare purge was executed post-deploy (§7) — the 422 precedent.
- **Platform-side stale caches** (Facebook/WhatsApp remember a thumbnail up to ~30 days): cured by the new URL at the next scrape (fresh share or TTL expiry); the one-click manual accelerator remains the owner's "Scrape Again" in the Facebook Sharing Debugger (runbook §8).

## 5. The verification battery (this frame, all green)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors** |
| `npx eslint .` | **0 errors** (1 pre-existing warning, untouched file) |
| `npx vitest run` | **5,556 / 5,556** (195 files — includes the rewritten OG laws: 113 OG-suite tests) |
| `npx next build` | **exit 0 — 2,218 pages** (unchanged route count; no route added/removed) |
| Built-HTML spot check (prerendered files) | foods/tools/compare pages emit `https://alkemos.com/images/og/og-home-en.png?v=4`; exercise emits its own photo `?v=4` |
| Local `next start` smoke (crawler UA) | 12 routes probed: home pair → og-home-ar/en; foods/tools/compare/memberships/evo → og-home; exercise → its photo; author → avatar (the blog article 404s locally without DB env — its cover-first law is server-side and asserted by the coverage test + verified live §7) |

## 6. What the platforms will now show (the acceptance matrix)

| Shared link | Preview image |
|---|---|
| any blog article (AR/EN) | the article's own cover photo (unchanged, already correct) |
| any exercise page (AR/EN) | that exercise's first photo |
| any program page (AR/EN) | that program's illustration |
| an author profile | the author's avatar |
| `/` or `/ar` | the homepage card |
| **every other page** (foods, tools, comparisons, memberships, coaching, evo, hubs, lists, legal, …) | **the homepage card** — the owner-ordered default for pages without an own image |

## 7. Post-deploy live verification (measured against production)

Executed after the push (see worklog entry for the run record):
- og:image extracted as the share crawler (facebookexternalhit UA) across a ≥20-URL sample covering every family × both languages — each surface serves its OWN image or the og-home fallback, with the `?v=4` URL.
- The og-home images themselves fetched as the crawler: `200 image/png`, 1200×630, correct byte sizes.
- Composed preview cards (image + title + description, as platforms render them) visually verified — no blank/generic-blue regression.
- Targeted Cloudflare purge of the sampled page URLs so the tested links flip immediately.

## 8. Owner runbook (plain steps — §12.9)

1. **Instant re-scrape of a specific link (optional):** open https://developers.facebook.com/tools/debug/ → paste the URL → «Scrape Again» → the card re-renders with the new image (success = the preview shows the page's own image / the homepage card).
2. **WhatsApp:** re-sending the same link to a chat re-fetches after cache expiry; a fresh chat forces a fresh preview immediately.
3. **If a page still shows an old thumbnail after ~30 days:** it is a platform cache (not the site — every URL changed); Scrape Again (step 1) fixes it in one click.

## 9. Sources (format-compatibility research, fetched 2026-11-06)

- darekkay.com/blog/open-graph-image-formats — multi-platform WebP/JPEG/PNG/AVIF test (Nov 2024, updated Nov 2025): all tested providers except Xing support WebP
- linkedin.com/help/linkedin/answer/a521928 — sharing-module: min 1200×627, 1.91:1, 5 MB
- linkedin.com/help/linkedin/answer/a564109 — supported media types incl. WEBP
- Meta «Images in Link Shares» (via swapbiswas.com OG-image audit, Oct 2026): ≥1200×630, ≤8 MB
- WhatsApp Link Previews guidance (May 2026, via same audit): ≥300 px wide, <600 KB
