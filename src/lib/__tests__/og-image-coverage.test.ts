import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * SOCIAL-OG-4 (2026-11-06, owner order) — the FIRST-OWN-IMAGE law with a
 * homepage-card fallback, replacing the SOCIAL-OG-3 dedicated-family-card
 * law. Owner requirement (verbatim): «استخدام الصورة الأولى الخاصة بكل
 * صفحة أو مقال تلقائيًا كصورة معاينة عند مشاركة الرابط. إذا لم تكن
 * للصفحة صورة خاصة، تُستخدم صورة الصفحة الرئيسية كصورة افتراضية.
 * تطبيق ذلك على جميع صفحات الموقع والمقالات باللغتين العربية
 * والإنجليزية.»
 *
 * The law, operationally:
 *   1. A page WITH an own content image shares THAT image:
 *      - blog article → its featured Pexels cover (SOCIAL-OG-248 law)
 *      - exercise detail → its first self-hosted photo (SOCIAL-OG-EX law)
 *      - program detail → its program illustration
 *      - author profile → the author's avatar
 *      - the home roots → the homepage brand card (og-home)
 *   2. EVERY page without an own content image (tools, foods + food
 *      comparisons, exercise/muscle/equipment hubs, collections, blog
 *      index + categories, diet-plan hub + cells, programs hub,
 *      memberships, coaching, evo, about, faq, contact, affiliate,
 *      legal, compare hub + platform-comparison details, authors hub,
 *      trackers, planners, guides, methodology, coach landing) shares
 *      the HOMEPAGE card (og-home-en / og-home-ar) as the default
 *      fallback — NOT a per-family card (the retired SOCIAL-OG-3
 *      system the owner judged unsuccessful).
 *   3. twitter:card stays summary_large_image and twitter.images
 *      mirrors og:image everywhere (a "summary" card ignores images).
 *   4. SHARE_IMG_VER is the single bump point for a site-wide
 *      share-cache re-bust (SOCIAL-OG-2 law): v=4 = this law's sweep.
 *      Platforms that scraped a URL during an earlier era keep serving
 *      the remembered thumbnail for up to 30 days; a NEW image URL
 *      forces a fresh fetch at the next scrape.
 */

const OG_DIR = resolve(__dirname, "../../../public/images/og");

/**
 * SOCIAL-OG-4 share-image cache-bust version. Bump (v=5, v=6 …) whenever a
 * full-site thumbnail re-fetch at the platforms is needed again — the
 * coverage assertions below enforce that every wired surface carries it.
 * SOCIAL-OG-4 (2026-11-06): v=4 — the first-own-image law rewired every
 * image-less surface to og-home, making every one of those share URLs
 * fresh at the platforms.
 */
const SHARE_IMG_VER = "?v=4";

const CARDS = ["og-home-en", "og-home-ar"] as const;

/** surface source → og-home card (language-matched) — the fallback law */
const WIRED_SURFACES: Array<[string, string]> = [
  // Detail / list surfaces that carry NO own content image.
  ["src/app/(en)/foods/[slug]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/foods/[slug]/page.tsx", "og-home-ar"],
  ["src/app/(en)/foods/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/foods/page.tsx", "og-home-ar"],
  ["src/app/(en)/foods/compare/[slug]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/foods/compare/[slug]/page.tsx", "og-home-ar"],
  ["src/app/(en)/foods/methodology/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/foods/methodology/page.tsx", "og-home-ar"],
  ["src/app/(en)/muscles/[group]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/muscles/[group]/page.tsx", "og-home-ar"],
  ["src/app/(en)/collections/[slug]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/collections/[slug]/page.tsx", "og-home-ar"],
  ["src/app/(en)/blog/category/[slug]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/blog/category/[slug]/page.tsx", "og-home-ar"],
  ["src/app/(en)/tools/layout.tsx", "og-home-en"],
  ["src/app/(en)/tools/bmi-calculator/layout.tsx", "og-home-en"],
  ["src/app/(en)/tools/body-fat-calculator/layout.tsx", "og-home-en"],
  ["src/app/(en)/tools/calorie-calculator/layout.tsx", "og-home-en"],
  ["src/app/(en)/tools/macro-calculator/layout.tsx", "og-home-en"],
  ["src/app/(en)/tools/water-tracker/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/tools/layout.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/tools/bmi-calculator/layout.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/tools/body-fat-calculator/layout.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/tools/calorie-calculator/layout.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/tools/macro-calculator/layout.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/tools/water-tracker/layout.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/layout.tsx", "og-home-ar"],
  ["src/app/(en)/exercises/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/exercises/page.tsx", "og-home-ar"],
  ["src/app/(en)/programs/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/programs/page.tsx", "og-home-ar"],
  ["src/app/(en)/coaching/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/coaching/layout.tsx", "og-home-ar"],
  ["src/app/(en)/memberships/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/memberships/page.tsx", "og-home-ar"],
  ["src/app/(en)/evo/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/evo/layout.tsx", "og-home-ar"],
  ["src/app/(en)/diet-plan/page.tsx", "og-home-en"],
  ["src/app/(en)/diet-plan/[level]/[system]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/diet-plan/page.tsx", "og-home-ar"],
  ["src/app/(ar)/ar/diet-plan/[level]/[system]/page.tsx", "og-home-ar"],
  ["src/app/(en)/equipment/[type]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/equipment/[type]/page.tsx", "og-home-ar"],
  ["src/app/(en)/compare/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/compare/page.tsx", "og-home-ar"],
  ["src/app/(en)/compare/[slug]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/compare/[slug]/page.tsx", "og-home-ar"],
  ["src/app/(en)/faq/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/faq/page.tsx", "og-home-ar"],
  ["src/app/(en)/about/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/about/page.tsx", "og-home-ar"],
  ["src/app/(en)/contact/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/contact/page.tsx", "og-home-ar"],
  ["src/app/(en)/privacy/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/privacy/page.tsx", "og-home-ar"],
  ["src/app/(en)/terms/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/terms/page.tsx", "og-home-ar"],
  ["src/app/(en)/authors/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/authors/page.tsx", "og-home-ar"],
  ["src/app/(en)/affiliate/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/affiliate/layout.tsx", "og-home-ar"],
  ["src/app/(en)/for-coaches/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/for-coaches/layout.tsx", "og-home-ar"],
  ["src/app/(en)/for-coaches/register/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/for-coaches/register/layout.tsx", "og-home-ar"],
  ["src/app/(en)/workout-tracker/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/workout-tracker/layout.tsx", "og-home-ar"],
  ["src/app/(en)/macro-tracker/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/macro-tracker/layout.tsx", "og-home-ar"],
  ["src/app/(en)/guides/macro-tracking-accuracy/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/guides/macro-tracking-accuracy/page.tsx", "og-home-ar"],
  ["src/app/(en)/meal-planner/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/meal-planner/layout.tsx", "og-home-ar"],
  ["src/app/(en)/ai-meal-planner/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/ai-meal-planner/layout.tsx", "og-home-ar"],
  ["src/app/(en)/ai-workout-planner/layout.tsx", "og-home-en"],
  ["src/app/(ar)/ar/ai-workout-planner/layout.tsx", "og-home-ar"],
  // Phase 218 (D-02): the noindex coach-landing pair — no own content
  // image, so the homepage card (the default fallback) is also its share.
  ["src/app/(en)/coaches/[slug]/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/coaches/[slug]/page.tsx", "og-home-ar"],
  // Phase 231: the blog index pair (list page — no own content image).
  ["src/app/(en)/blog/page.tsx", "og-home-en"],
  ["src/app/(ar)/ar/blog/page.tsx", "og-home-ar"],
];

function repoRootPath(rel: string): string {
  return resolve(__dirname, "../../..", rel);
}

describe("og:image coverage (SOCIAL-OG-4 — first-own-image + homepage fallback)", () => {
  it("the homepage card pair exists on disk (run scripts/generate-og-cards.py)", () => {
    for (const card of CARDS) {
      const p = resolve(OG_DIR, `${card}.png`);
      expect(existsSync(p), `${card}.png missing (run scripts/generate-og-cards.py)`).toBe(true);
    }
  });

  it.each(WIRED_SURFACES)("%s shares the homepage card in og + twitter (the fallback law)", (rel, card) => {
    const src = readFileSync(repoRootPath(rel), "utf8");
    // the card path is asserted substring-style so BOTH URL forms pass:
    // relative ("/images/og/og-home-en.png?v=4") and absolute
    // ("https://alkemos.com/images/og/og-home-en.png?v=4" — the compare
    // detail pages pin absolute URLs) — the law is the ASSET, not the form.
    const needle = `/images/og/${card}.png${SHARE_IMG_VER}`;
    const occurrences = src.split(needle).length - 1;
    // >= 1: some surfaces define a single OG_IMAGE constant that feeds BOTH
    // openGraph.images and twitter.images (foods/compare — the URL string
    // legitimately appears once); the others inline it twice (og + twitter).
    expect(occurrences, `${rel} must reference ${needle}`).toBeGreaterThanOrEqual(1);
    expect(src).toContain('card: "summary_large_image"');
    // no regression to the raw logo card
    expect(src).not.toContain('url: "/logo.png"');
  });

  it("the EN root metadata shares the homepage card (not /logo.png)", () => {
    const src = readFileSync(repoRootPath("src/app/metadata.ts"), "utf8");
    expect(src).toContain(`url: "/images/og/og-home-en.png${SHARE_IMG_VER}"`);
    expect(src).not.toContain('url: "/logo.png"');
  });

  it("the generator lives in repo tooling with timeless copy (no library counts)", () => {
    const p = repoRootPath("scripts/generate-og-cards.py");
    expect(existsSync(p)).toBe(true);
    const gen = readFileSync(p, "utf8");
    // PNG text is un-greppable and un-guardable once baked — the BAKED copy
    // (the SPECS entries) must stay count-free (868/8830 change as the
    // library grows). The rule's docstring may mention the numbers.
    const specs = gen.slice(gen.indexOf("SPECS = ["));
    expect(specs).not.toMatch(/868/);
    expect(specs).not.toMatch(/8830|8162/);
  });

  it("SOCIAL-OG-EX + SOCIAL-OG-4: exercise shares use the exercise's real photo — cover-first, homepage-card fallback only", () => {
    for (const [rel, homeCard] of [
      ["src/app/(en)/exercises/[slug]/page.tsx", "og-home-en"],
      ["src/app/(ar)/ar/exercises/[slug]/page.tsx", "og-home-ar"],
    ] as const) {
      const src = readFileSync(repoRootPath(rel), "utf8");
      // cover-first: primary photo derived from the exercise's imageKey
      expect(src).toContain("getExerciseImages(exercise.imageKey)[0]");
      expect(src).toContain("images: [shareImage]");
      expect(src).toContain("images: [shareImage.url]");
      // absolute share URL (crawlers never resolve relative og:image)
      // + SOCIAL-OG-2/4 cache-bust suffix on the photo URL
      const verRe = SHARE_IMG_VER.replace(/\?/g, "\\?");
      expect(src).toMatch(
        new RegExp(
          `\\$\\{primaryPhoto\\}${verRe}|https:\\/\\/alkemos\\.com\\$\\{primaryPhoto\\}${verRe}`,
        ),
      );
      // the homepage card is the photo-less fallback only (fallback law)
      expect(src).toContain(`/images/og/${homeCard}.png${SHARE_IMG_VER}`);
      expect(src).toContain('card: "summary_large_image"');
      // no regression to the raw logo card
      expect(src).not.toContain('url: "/logo.png"');
    }
  });

  it("SOCIAL-OG-248 + SOCIAL-OG-4: article shares use the real featured photo — cover-first, generator fallback only", () => {
    const server = readFileSync(repoRootPath("src/lib/blog-server.ts"), "utf8");
    // shareImage is built at the single choke point (blog-server): the
    // featured photo Pexels-cropped to 1200×630 fm=jpeg, with the branded
    // generator ONLY when the article carries no photo.
    expect(server).toMatch(
      /sizedRemoteImage\(featuredAbsolute,\s*1200,\s*1200 \/ 630,\s*"jpeg"\)/,
    );
    expect(server).toContain("${baseUrl}/api/og-image/${data.slug}?lang=${lang}");
    for (const rel of [
      "src/app/(en)/blog/[slug]/page.tsx",
      "src/app/(ar)/ar/blog/[slug]/page.tsx",
    ]) {
      const src = readFileSync(repoRootPath(rel), "utf8");
      // og:image object + twitter array + JSON-LD all read og.shareImage
      expect(src).toContain("url: og.shareImage");
      expect(src).toContain("images: [og.shareImage]");
      expect(src).toContain("image: og.shareImage,");
      // the inline generator URL pattern must be gone from article pages
      expect(src).not.toContain("api/og-image/${slug}");
      // no regression to the raw logo card
      expect(src).not.toContain('url: "/logo.png"');
    }
  });

  it("SOCIAL-OG-4: program detail shares the program's own illustration (cache-bust v=4)", () => {
    for (const rel of [
      "src/app/(en)/programs/[slug]/page.tsx",
      "src/app/(ar)/ar/programs/[slug]/page.tsx",
    ] as const) {
      const src = readFileSync(repoRootPath(rel), "utf8");
      const verRe = SHARE_IMG_VER.replace(/\?/g, "\\?");
      expect(src).toMatch(new RegExp(`\\$\\{program\\.image\\}${verRe}`));
      expect(src).not.toContain("/images/og/og-home");
    }
  });

  it("SOCIAL-OG-4: author profiles share the author's own avatar (cache-bust v=4)", () => {
    for (const rel of [
      "src/app/(en)/authors/[slug]/page.tsx",
      "src/app/(ar)/ar/authors/[slug]/page.tsx",
    ] as const) {
      const src = readFileSync(repoRootPath(rel), "utf8");
      const verRe = SHARE_IMG_VER.replace(/\?/g, "\\?");
      expect(src).toMatch(new RegExp(`\\$\\{author\\.avatarUrl\\}${verRe}`));
    }
  });

  it("SOCIAL-OG-4: no stray card files — the og-home pair is the only static card on disk", () => {
    const pngs = readdirSync(OG_DIR)
      .filter((f) => f.endsWith(".png"))
      .map((f) => f.replace(/\.png$/, ""));
    const known = new Set<string>([...CARDS]);
    for (const png of pngs) {
      expect(known.has(png), `orphan card ${png}.png — the SOCIAL-OG-4 law retired it; delete it`).toBe(true);
    }
    expect(pngs.length).toBe(2);
  });
});
