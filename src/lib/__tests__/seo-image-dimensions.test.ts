import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * SEO-P2-12 (SEO audit item 12 — 2026-10-01, Alkemos_SEO_Audit_Report
 * «إضافة width وheight للصور الـ952 الناقصة الأبعاد حيث لا توجد حاوية
 * aspect-ratio»): defensive-CLS law for every image on the PUBLIC
 * server-rendered surface.
 *
 * Measurement first (frame 321): the live re-crawl of all 2,196 sitemap
 * pages found 9,768 <img> tags without width+height (the audit's 952/2,628
 * scaled with the exercise/food/blog surfaces). The pre-load CLS probe
 * (seo-p212-cls-risk.mjs — images BLOCKED, box measured before any load)
 * across all 22 page templates returned ZERO zero-box images: every
 * missing-dimension image is space-reserved by an aspect-ratio or
 * fixed-size container. The only public-SSR pair with NO own aspect CSS
 * was the PageBanner pair (h-full w-full relies on the parent's
 * aspect-[1280/477]) — fixed in the same frame with width/height 1280×477
 * (the prebuilt intrinsic size, verified by parsing the webp headers).
 *
 * What is guarded here (the law, three rules):
 *   1. PageBanner pin — both <img> of the pair carry width={1280}
 *      height={477}, the parent keeps aspect-[1280/477], the light variant
 *      keeps fetchPriority="high" (Phase 137c LCP law) and the dark
 *      variant keeps loading="lazy" (Phase 139 dark-leak law).
 *   2. Dimensions-or-reserved-box — every plain <img> rendered on the
 *      public SSR surface must EITHER carry width+height attributes OR
 *      sit inside a fixed-size CSS box (h-* w-* classes). Auth-gated
 *      client views with user-host avatars are exempt by the QR-asset
 *      precedent (arbitrary hosts ⇒ unknowable intrinsic size), but their
 *      fixed-size reservation classes are pinned instead.
 *   3. Fill-container law — the key next/image `fill` usages must sit in
 *      a space-reserving wrapper (aspect- or fixed h- / w- classes). A
 *      fill image inside an unsized relative container renders at zero
 *      height until the bitmap loads = the CLS this item exists to
 *      prevent.
 *
 * Out of scope by design (documented, not forgotten):
 *   - ThemeImg spread ({...common}): the component takes width/height
 *     optionally; every current call site passes them (rule 4 pins the
 *     callers list — the file-scan law would false-positive on the
 *     component definition itself).
 *   - Blog markdown non-Pexels body images: «no invented dimensions for
 *     unknowns» is the documented §12.38 decision; every live article
 *     image today is a sized Pexels URL (width/height 896×448 emitted by
 *     the renderer — live-verified: 0 missing on article templates).
 *   - Admin/editor views (BlogEditorView, CoachLandingEditor): behind
 *     auth, not a crawl surface — their preview <img>s use aspect-*
 *     classes anyway (CoachLandingEditor) or are tooling previews.
 */

const ROOT = join(process.cwd());
const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

/* ─── Rule 1: PageBanner pin ─────────────────────────────────────────── */

describe("P2-12 rule 1 — PageBanner pair carries intrinsic dimensions", () => {
  const src = read("src/components/PageBanner.tsx");

  // P1-1 (PERFORMANCE-AUDIT-2026-11-08): the pair now carries responsive
  // srcset — the split keys append the closing backtick of the src
  // attribute so the srcSet's own `header-…-light.webp 1280w` candidate
  // (which repeats the filename) can no longer truncate the attrs region.
  // The pins are unchanged in intent + the new responsive-srcset law
  // (both variants offer the 640/828/1280 prebuilt candidates).
  const LIGHT_KEY = "header-${section}-light.webp`";
  const DARK_KEY = "header-${section}-dark.webp`";

  it("light variant: width 1280 + height 477 + fetchPriority high (LCP law)", () => {
    expect(src).toContain('src={`/images/brand/header-${section}-light.webp`}');
    // attrs region of the LIGHT tag only: from its src template literal up
    // to the dark tag's src — the dark tag's own attrs must not leak into
    // this segment and mask a regression (caught by negative-testing the
    // canary: patching the light width alone still passed with a plain
    // "everything-before-theme-img-dark" split).
    const light = src.split(LIGHT_KEY)[1].split(DARK_KEY)[0];
    expect(light).toContain("width={1280}");
    expect(light).toContain("height={477}");
    expect(light).toContain('fetchPriority="high"');
    expect(light).toContain("theme-img-light h-full w-full object-cover");
  });

  it("dark variant: width 1280 + height 477 + loading lazy (Phase 139 law)", () => {
    const dark = src.split(DARK_KEY)[1];
    expect(dark).toContain("width={1280}");
    expect(dark).toContain("height={477}");
    expect(dark).toContain('loading="lazy"');
    expect(dark).not.toContain("fetchPriority");
  });

  it("responsive srcset law (P1-1): both variants offer 640/828/1280", () => {
    const light = src.split(LIGHT_KEY)[1].split(DARK_KEY)[0];
    const dark = src.split(DARK_KEY)[1];
    // NOTE: plain quoted strings — ${section} is the LITERAL template
    // placeholder inside PageBanner's source, not a JS interpolation.
    for (const [label, region] of [["light", light], ["dark", dark]] as const) {
      expect(region, `${label} srcset`).toContain(`header-\${section}-${label}-640.webp 640w`);
      expect(region, `${label} srcset`).toContain(`header-\${section}-${label}-828.webp 828w`);
      expect(region, `${label} srcset`).toContain(`header-\${section}-${label}.webp 1280w`);
      expect(region, `${label} sizes`).toContain("sizes={sizes}");
    }
    // the shared sizes law: hub container ceiling (max-w-6xl px-4)
    expect(src).toContain('"(max-width: 1152px) calc(100vw - 2rem), 1120px"');
  });

  it("parent container keeps the aspect-[1280/477] reservation", () => {
    expect(src).toContain("relative aspect-[1280/477] w-full");
  });
});

/* ─── Rule 2: dimensions or reserved box ─────────────────────────────── */

/** Public-SSR plain <img> surfaces: MUST carry width+height. */
const PUBLIC_IMG_WITH_DIMS: { file: string; note: string }[] = [
  { file: "src/components/PageBanner.tsx", note: "hub banner pair (fixed in P2-12)" },
  { file: "src/app/(en)/coaching/page.tsx", note: "mark-helmet.png 56×56" },
];

/**
 * Auth-gated avatar/thumbnail surfaces (QR-asset precedent — arbitrary
 * user hosts ⇒ no intrinsic size): MUST keep a fixed-size CSS box so the
 * space is reserved regardless of when (or whether) the bitmap arrives.
 */
const FIXED_BOX_AVATARS: { file: string; boxClass: string; note: string }[] = [
  { file: "src/components/SiteHeader.tsx", boxClass: "h-full w-full object-cover", note: "header profile avatar" },
  { file: "src/components/MyCoachCard.tsx", boxClass: "h-14 w-14", note: "coach card avatar" },
  {
    file: "src/components/views/LandingViewDynamicIslands.tsx",
    boxClass: "mx-auto h-16 w-16",
    note: "islands coach photo (fallback twin keeps the same box)",
  },
  {
    file: "src/components/coach/CoachLandingContent.tsx",
    boxClass: "h-28 w-28",
    note: "coach landing hero photo",
  },
];

describe("P2-12 rule 2 — plain <img> has dimensions or a reserved box", () => {
  for (const { file, note } of PUBLIC_IMG_WITH_DIMS) {
    it(`${file} (${note}): every <img carries width + height`, () => {
      const src = read(file);
      // candidate <img …> chunks; keep only REAL tags (must carry a
      // src/srcSet attribute) — comment prose like "<img>s" is dropped.
      const tags = (src.match(/<img\b[\s\S]*?>/g) ?? []).filter((t) =>
        /\s(?:src|srcSet)=/.test(t),
      );
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) {
        expect(tag, `${file}: <img> missing width →\n${tag}`).toMatch(/\bwidth=\{?\d/);
        expect(tag, `${file}: <img> missing height →\n${tag}`).toMatch(/\bheight=\{?\d/);
      }
    });
  }

  for (const { file, boxClass, note } of FIXED_BOX_AVATARS) {
    it(`${file} (${note}): keeps its fixed-size box "${boxClass}"`, () => {
      const src = read(file);
      expect(src).toContain("<img");
      expect(src).toContain(boxClass);
    });
  }
});

/* ─── Rule 3: fill images sit in space-reserving wrappers ────────────── */

/**
 * The key public `fill` usages with their reservation wrappers (the exact
 * class substring the wrapper must keep). A `fill` image whose wrapper
 * loses its aspect- or fixed size renders at height 0 until load — that
 * is the CLS regression this rule exists to catch.
 */
const FILL_WRAPPERS: { file: string; wrapper: string; note: string }[] = [
  {
    file: "src/app/(en)/exercises/[slug]/ExerciseDetailClient.tsx",
    wrapper: "relative aspect-square w-full",
    note: "exercise detail start/end pair",
  },
  {
    file: "src/components/exercises/ExercisesExplorer.tsx",
    wrapper: "relative aspect-[4/3] w-full",
    note: "exercise grid card",
  },
  {
    file: "src/components/blog/BlogListPage.tsx",
    wrapper: "relative aspect-video overflow-hidden",
    note: "blog card cover",
  },
  {
    file: "src/components/blog/BlogCategoryPage.tsx",
    wrapper: "relative aspect-video overflow-hidden",
    note: "category card cover",
  },
  {
    file: "src/app/(en)/coaching/page.tsx",
    wrapper: "aspect-[3/2] w-full",
    note: "coaching hero pair",
  },
  {
    file: "src/app/(en)/authors/page.tsx",
    wrapper: "relative h-20 w-20",
    note: "authors index avatar",
  },
  {
    file: "src/app/(en)/authors/[slug]/page.tsx",
    wrapper: "relative h-24 w-24",
    note: "author profile avatar",
  },
  {
    file: "src/components/foods/FoodsExplorer.tsx",
    wrapper: "relative block h-16 w-16",
    note: "food category tile",
  },
  {
    file: "src/app/(en)/programs/[slug]/ProgramDetailClient.tsx",
    wrapper: "relative aspect-[16/9] w-full",
    note: "program hero",
  },
  {
    file: "src/app/(en)/programs/page.tsx",
    wrapper: "relative aspect-[4/3] w-full",
    note: "program list card",
  },
];

describe("P2-12 rule 3 — next/image fill keeps its reserving wrapper", () => {
  for (const { file, wrapper, note } of FILL_WRAPPERS) {
    it(`${file} (${note}): wrapper keeps "${wrapper}"`, () => {
      const src = read(file);
      expect(src).toContain(wrapper);
    });
  }
});

/* ─── Rule 4: ThemeImg callers pass width ────────────────────────────── */

/** Files that render <ThemeImg (the component definition excluded). */
const THEMEIMG_CALLERS = [
  "src/components/PageBottomPromo.tsx",
  "src/components/SiteFooter.tsx",
  "src/components/SiteHeader.tsx",
  "src/components/EvoFloatingWidget.tsx",
  "src/components/views/LandingViewIslands.tsx",
  "src/components/views/LandingView.tsx",
  "src/components/views/LandingViewDynamicIslands.tsx",
  "src/components/OtherTools.tsx",
  "src/app/(en)/memberships/page.tsx",
];

describe("P2-12 rule 4 — every <ThemeImg call passes width (dims flow into the pair)", () => {
  for (const file of THEMEIMG_CALLERS) {
    it(`${file}: <ThemeImg … width= present`, () => {
      const src = read(file);
      const calls = src.match(/<ThemeImg[\s\S]*?>/g) ?? [];
      if (calls.length === 0) return; // re-exports/comments only — nothing to pin
      for (const call of calls) {
        expect(call, `${file}: <ThemeImg> without width →\n${call}`).toMatch(/\bwidth=\{/);
      }
    });
  }
});
