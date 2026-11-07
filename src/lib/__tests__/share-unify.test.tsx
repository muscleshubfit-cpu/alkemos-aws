import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildShareLinks } from "@/lib/share-links";
import { canonicalShareUrl } from "@/lib/share-url";
import { ShareButtons } from "@/components/ShareButtons";
import { CoachShareButtons } from "@/components/CoachShareButtons";
import { SocialShare } from "@/components/blog/BlogComponents";
import { I18nProvider } from "@/lib/i18n";

vi.mock("next/navigation", () => ({
  usePathname: () => null,
  // 450: UrlLocaleSync (inside I18nProvider) also subscribes to the
  // router for the mirror-replace safety net — stub the seam.
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, prefetch: () => {}, back: () => {} }),
}));

/**
 * PHASE 231 — SHARE UNIFICATION LAW + COVERAGE GUARD
 * (owner order 2026-09-18 «نفّذ الآن جميع إصلاحات Social Sharing
 * المتبقية من تقرير Deep Audit، كمرحلة واحدة بعد إغلاق Phase 230»).
 *
 * The three public share components (ShareButtons · blog SocialShare ·
 * CoachShareButtons) are now thin wrappers over ONE implementation:
 *   - URL: canonicalShareUrl(path, lang) — the Phase-230 single source.
 *     window.location / mountedUrl / query-hash-dependent URLs are
 *     retired from every surface (B1/B2).
 *   - Payloads: buildShareLinks() — the ONLY place a share intent URL is
 *     built; platforms are a per-surface CONFIG (A3/A4).
 *   - Behavior: useShareActions() — copy with execCommand fallback +
 *     post-mount Web Share detection (no hydration-dependent URLs, B3).
 *
 * This file pins:
 *   1. The engine's payload formats (verbatim historical behavior).
 *   2. CoachShareButtons SSR — full canonical URL from the first render,
 *      NO WhatsApp (owner decree «معادا زر واتساب لن نضيفها»).
 *   3. SocialShare clicks — the full canonical article URL reaches
 *      window.open (the blog bar builds URLs deterministically, not
 *      hydration-dependently).
 *   4. THE SHARE-COVERAGE GUARD — every usage site of every share
 *      component across src/ must be REGISTERED here with its
 *      deterministic path; an unregistered future surface FAILS CI until
 *      it declares its canonical path (B4).
 */

const decoded = (html: string): string => html.replace(/&amp;/g, "&");

describe("buildShareLinks — the single payload implementation", () => {
  const URL = "https://alkemos.com/evo";

  it("whatsapp: text + %20 + url", () => {
    const [link] = buildShareLinks({
      url: URL,
      shareText: "Hello",
      fbQuote: "Q",
      platforms: ["whatsapp"],
    });
    expect(link.href).toBe(`https://wa.me/?text=${encodeURIComponent("Hello")}%20${encodeURIComponent(URL)}`);
  });

  it("facebook: u=url&quote=fbQuote (per-surface quote policy)", () => {
    const [link] = buildShareLinks({
      url: URL,
      shareText: "Hello",
      fbQuote: "Q",
      platforms: ["facebook"],
    });
    expect(link.href).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}&quote=${encodeURIComponent("Q")}`,
    );
  });

  it("x / linkedin / telegram formats", () => {
    const links = buildShareLinks({
      url: URL,
      shareText: "Hello",
      fbQuote: "Q",
      platforms: ["x", "linkedin", "telegram"],
    });
    expect(links.map((l) => l.href)).toEqual([
      `https://twitter.com/intent/tweet?text=${encodeURIComponent("Hello")}&url=${encodeURIComponent(URL)}`,
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(URL)}`,
      `https://t.me/share/url?url=${encodeURIComponent(URL)}&text=${encodeURIComponent("Hello")}`,
    ]);
  });

  it("encodes hostile payloads safely (no unencoded &, spaces, or newlines)", () => {
    const [link] = buildShareLinks({
      url: URL,
      shareText: "A & B\nC D",
      fbQuote: "Q",
      platforms: ["whatsapp"],
    });
    expect(link.href).toContain(encodeURIComponent("A & B\nC D"));
  });
});

describe("CoachShareButtons — canonical SSR + the WhatsApp decree", () => {
  function ssrCoach(lang: "en" | "ar", path = "/for-coaches"): string {
    return renderToStaticMarkup(
      // eslint-disable-next-line react/no-children-prop -- provider props TYPE requires children in props (test-only render)
      createElement(
        I18nProvider,
        {
          urlLocale: lang,
          children: createElement(CoachShareButtons, {
            path,
            message: lang === "ar" ? "انضم كمدرب" : "Join as a coach",
            labels: {
              facebook: "Facebook",
              x: "X",
              telegram: "Telegram",
              copy: "Copy link",
              copied: "Copied",
            },
          }),
        },
      ),
    );
  }

  it("SSR (EN): Facebook / X / Telegram carry the FULL canonical URL from the first render", () => {
    const html = decoded(ssrCoach("en"));
    const enc = encodeURIComponent("https://alkemos.com/for-coaches");
    expect(html).toContain(`sharer.php?u=${enc}&quote=`);
    expect(html).toContain(`intent/tweet?text=`);
    expect(html).toContain(`&url=${enc}`);
    expect(html).toContain(`t.me/share/url?url=${enc}&text=`);
  });

  it("SSR (AR): the /ar mirror URL is deterministic from the first render (no window.location phase)", () => {
    const html = decoded(ssrCoach("ar"));
    const enc = encodeURIComponent("https://alkemos.com/ar/for-coaches");
    expect(html).toContain(`sharer.php?u=${enc}&quote=`);
    expect(html).toContain(`t.me/share/url?url=${enc}&text=`);
    expect(html).not.toContain(encodeURIComponent("https://alkemos.com/for-coaches\"")); // no bare EN share target
  });

  it("NEVER renders a WhatsApp target (owner decree) and no query/hash leakage", () => {
    const html = decoded(ssrCoach("en"));
    expect(html).not.toContain("wa.me");
    expect(html).not.toContain("whatsapp");
    expect(html).not.toContain("cb%3D");
    expect(html).not.toContain("utm_");
  });

  it("Copy fallback is present in SSR", () => {
    expect(ssrCoach("en")).toContain("Copy link");
  });
});

describe("SocialShare (blog) — deterministic canonical URL on click", () => {
  const PROPS = {
    path: "/blog/best-whey-guide",
    title: "Best Whey Guide",
    description: "A science-based guide.",
    lang: "en" as const,
  };

  beforeEach(() => {
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function renderBlogBar(lang: "en" | "ar" = "en") {
    const { render } = await import("@testing-library/react");
    return render(createElement(SocialShare, { ...PROPS, lang }));
  }

  it("every platform click opens the FULL canonical article URL (not hydration-dependent)", async () => {
    const view = await renderBlogBar();
    const article = encodeURIComponent("https://alkemos.com/blog/best-whey-guide");
    const text = encodeURIComponent(
      "Best Whey Guide\n\nA science-based guide.\n\nRead the full article on Alkemos:",
    );

    await view.findByLabelText("WhatsApp");
    view.getByLabelText("WhatsApp").click();
    expect(window.open).toHaveBeenLastCalledWith(
      expect.stringContaining(`https://wa.me/?text=${text}%20${article}`),
      "_blank",
      "noopener,noreferrer,width=600,height=400",
    );

    view.getByLabelText("Facebook").click();
    expect(window.open).toHaveBeenLastCalledWith(
      expect.stringContaining(`sharer.php?u=${article}&quote=${text}`),
      "_blank",
      expect.any(String),
    );

    view.getByLabelText("LinkedIn").click();
    expect(window.open).toHaveBeenLastCalledWith(
      expect.stringContaining(`share-offsite/?url=${article}`),
      "_blank",
      expect.any(String),
    );

    view.getByLabelText("X").click();
    expect(window.open).toHaveBeenLastCalledWith(
      expect.stringContaining(`intent/tweet?text=${text}&url=${article}`),
      "_blank",
      expect.any(String),
    );
    view.unmount();
  });

  it("AR mirror shares the /ar/blog canonical URL", async () => {
    const view = await renderBlogBar("ar");
    const article = encodeURIComponent("https://alkemos.com/ar/blog/best-whey-guide");
    await view.findByLabelText("WhatsApp");
    view.getByLabelText("WhatsApp").click();
    expect(window.open).toHaveBeenLastCalledWith(
      expect.stringContaining(article),
      "_blank",
      expect.any(String),
    );
    view.unmount();
  });

  it("no Telegram on the blog bar (historical platform set unchanged)", async () => {
    const view = await renderBlogBar();
    expect(view.queryByLabelText("Telegram")).toBeNull();
    view.unmount();
  });

  it("Web Share button is ABSENT without navigator.share (jsdom) — copy button is the fallback", async () => {
    const view = await renderBlogBar();
    expect(view.queryByLabelText("Share")).toBeNull();
    expect(view.getByLabelText("Copy link")).toBeTruthy();
    view.unmount();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// THE SHARE-COVERAGE GUARD (B4) — every usage site of every public share
// component must be registered with its deterministic canonical path.
// A NEW unregistered surface FAILS this test until declared here.
// ─────────────────────────────────────────────────────────────────────────────

const repoRoot = resolve(__dirname, "../../..");

/** Walk src/ (excluding tests) and collect every file rendering a share component. */
function findShareUsages(): Map<string, Set<string>> {
  const COMPONENTS = ["ShareButtons", "SocialShare", "CoachShareButtons"];
  const found = new Map<string, Set<string>>();
  const SKIP_DIRS = new Set(["__tests__", "node_modules", ".next"]);

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full);
        continue;
      }
      if (!/\.tsx$/.test(entry)) continue;
      const src = readFileSync(full, "utf8");
      for (const component of COMPONENTS) {
        if (src.includes(`<${component}`)) {
          const rel = full.replace(repoRoot + "/", "");
          if (!found.has(rel)) found.set(rel, new Set());
          found.get(rel)!.add(component);
        }
      }
    }
  };
  walk(resolve(repoRoot, "src"));
  return found;
}

/** The registered share surfaces — file → component → the deterministic
 *  canonical path prop that MUST appear at the usage site. */
const REGISTERED_SURFACES: Array<{
  file: string;
  component: string;
  pathExpr: string;
}> = [
  // ShareButtons (12 surfaces — Phase 230 registry, unchanged)
  { file: "src/app/(en)/evo/page.tsx", component: "ShareButtons", pathExpr: 'path="/evo"' },
  { file: "src/app/(en)/coaching/page.tsx", component: "ShareButtons", pathExpr: 'path="/coaching"' },
  { file: "src/app/(en)/memberships/page.tsx", component: "ShareButtons", pathExpr: 'path="/memberships"' },
  { file: "src/app/(en)/meal-planner/page.tsx", component: "ShareButtons", pathExpr: 'path="/meal-planner"' },
  { file: "src/app/(en)/tools/bmi-calculator/page.tsx", component: "ShareButtons", pathExpr: 'path="/tools/bmi-calculator"' },
  { file: "src/app/(en)/tools/body-fat-calculator/page.tsx", component: "ShareButtons", pathExpr: 'path="/tools/body-fat-calculator"' },
  { file: "src/app/(en)/tools/calorie-calculator/page.tsx", component: "ShareButtons", pathExpr: 'path="/tools/calorie-calculator"' },
  { file: "src/app/(en)/tools/macro-calculator/page.tsx", component: "ShareButtons", pathExpr: 'path="/tools/macro-calculator"' },
  { file: "src/app/(en)/tools/water-tracker/page.tsx", component: "ShareButtons", pathExpr: 'path="/tools/water-tracker"' },
  { file: "src/app/(en)/exercises/[slug]/ExerciseDetailClient.tsx", component: "ShareButtons", pathExpr: "path={`/exercises/${slug}`}" },
  { file: "src/app/(en)/foods/[slug]/FoodDetailClient.tsx", component: "ShareButtons", pathExpr: "path={`/foods/${food.slug}`}" },
  { file: "src/app/(en)/programs/[slug]/ProgramDetailClient.tsx", component: "ShareButtons", pathExpr: "path={`/programs/${program.slug}`}" },
  // Blog article share bar (Phase 231 — canonical path from the single source)
  { file: "src/components/blog/BlogArticlePage.tsx", component: "SocialShare", pathExpr: "path={`/blog/${post.slug}`}" },
  // For-coaches share bar (Phase 231 — canonical path, no WhatsApp)
  { file: "src/app/(en)/for-coaches/page.tsx", component: "CoachShareButtons", pathExpr: 'path="/for-coaches"' },
  // SOCIAL-OG-3 (2026-09-30, owner order «تأكد من وجود أزرار مشاركة في كل
  // الصفحات العامة») — the full public-surface law: every content/
  // conversion surface now renders a share row (privacy/terms stay
  // excluded — legal pages carry no share intent).
  { file: "src/app/(en)/muscles/[group]/page.tsx", component: "ShareButtons", pathExpr: "path={`/muscles/${group}`}" },
  { file: "src/app/(ar)/ar/muscles/[group]/page.tsx", component: "ShareButtons", pathExpr: "path={`/muscles/${group}`}" },
  { file: "src/app/(en)/collections/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/collections/${collection.slug}`}" },
  { file: "src/app/(ar)/ar/collections/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/collections/${collection.slug}`}" },
  { file: "src/app/(en)/equipment/[type]/page.tsx", component: "ShareButtons", pathExpr: "path={`/equipment/${hub.slug}`}" },
  { file: "src/app/(ar)/ar/equipment/[type]/page.tsx", component: "ShareButtons", pathExpr: "path={`/equipment/${hub.slug}`}" },
  { file: "src/app/(en)/authors/page.tsx", component: "ShareButtons", pathExpr: 'path="/authors"' },
  { file: "src/app/(ar)/ar/authors/page.tsx", component: "ShareButtons", pathExpr: 'path="/authors"' },
  { file: "src/app/(en)/authors/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/authors/${author.slug}`}" },
  { file: "src/app/(ar)/ar/authors/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/authors/${author.slug}`}" },
  { file: "src/app/(en)/compare/page.tsx", component: "ShareButtons", pathExpr: 'path="/compare"' },
  { file: "src/app/(ar)/ar/compare/page.tsx", component: "ShareButtons", pathExpr: 'path="/compare"' },
  { file: "src/app/(en)/compare/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/compare/${comparison.slug}`}" },
  { file: "src/app/(ar)/ar/compare/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/compare/${comparison.slug}`}" },
  // SEO-GROWTH-P4 (2026-11-05): the food-comparison pilot surfaces —
  // canonical paths mirror the family's [slug] pattern.
  { file: "src/app/(en)/foods/compare/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/foods/compare/${comparison.slug}`}" },
  { file: "src/app/(ar)/ar/foods/compare/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/ar/foods/compare/${comparison.slug}`}" },
  // SEO-GROWTH Phase 2 (2026-11-06): the nutrient-list family surfaces —
  // same [slug] canonical-path pattern as the comparisons family.
  { file: "src/app/(en)/foods/lists/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/foods/lists/${list.slug}`}" },
  { file: "src/app/(ar)/ar/foods/lists/[slug]/page.tsx", component: "ShareButtons", pathExpr: "path={`/ar/foods/lists/${list.slug}`}" },
  { file: "src/app/(en)/diet-plan/page.tsx", component: "ShareButtons", pathExpr: 'path="/diet-plan"' },
  { file: "src/app/(ar)/ar/diet-plan/page.tsx", component: "ShareButtons", pathExpr: 'path="/diet-plan"' },
  { file: "src/app/(en)/ai-meal-planner/page.tsx", component: "ShareButtons", pathExpr: 'path="/ai-meal-planner"' },
  { file: "src/app/(en)/ai-workout-planner/page.tsx", component: "ShareButtons", pathExpr: 'path="/ai-workout-planner"' },
  // P0 SEO audit (2026-09-30): the search-intent landing pair — the EN
  // pages render the share row (the AR mirrors re-export the same
  // component, so the usage site lives in the EN file only).
  { file: "src/app/(en)/workout-tracker/page.tsx", component: "ShareButtons", pathExpr: 'path="/workout-tracker"' },
  { file: "src/app/(en)/macro-tracker/page.tsx", component: "ShareButtons", pathExpr: 'path="/macro-tracker"' },
  { file: "src/components/blog/BlogListPage.tsx", component: "ShareButtons", pathExpr: 'path="/blog"' },
  { file: "src/components/blog/BlogCategoryPage.tsx", component: "ShareButtons", pathExpr: "path={`/blog/category/${categoryId}`}" },
  { file: "src/components/views/StaticPageView.tsx", component: "ShareButtons", pathExpr: 'page === "about" ? "/about" : "/faq"' },
  { file: "src/components/views/ContactView.tsx", component: "ShareButtons", pathExpr: 'path="/contact"' },
  // Phase 318 (P1-8): the accuracy chain's two new pairs — the pillar
  // guide and the food-database methodology reference (share-worthy by
  // design: the methodology page is the citation surface).
  { file: "src/app/(en)/guides/macro-tracking-accuracy/page.tsx", component: "ShareButtons", pathExpr: 'path="/guides/macro-tracking-accuracy"' },
  { file: "src/app/(ar)/ar/guides/macro-tracking-accuracy/page.tsx", component: "ShareButtons", pathExpr: 'path="/ar/guides/macro-tracking-accuracy"' },
  { file: "src/app/(en)/foods/methodology/page.tsx", component: "ShareButtons", pathExpr: 'path="/foods/methodology"' },
  { file: "src/app/(ar)/ar/foods/methodology/page.tsx", component: "ShareButtons", pathExpr: 'path="/ar/foods/methodology"' },
];

describe("SHARE-COVERAGE GUARD — every public share surface is registered + deterministic", () => {
  it("every found usage site is registered with its canonical path", () => {
    const usages = findShareUsages();
    const registered = new Set(REGISTERED_SURFACES.map((r) => `${r.file}::${r.component}`));

    for (const [file, components] of usages) {
      for (const component of components) {
        expect(
          registered.has(`${file}::${component}`),
          `UNREGISTERED share surface: <${component}> in ${file} — add it to REGISTERED_SURFACES with its deterministic canonical path (B4 law)`,
        ).toBe(true);
      }
    }
    // The guard must actually see the surfaces (a scan that finds nothing
    // is a broken guard, not a passing one).
    expect(usages.size).toBeGreaterThanOrEqual(REGISTERED_SURFACES.length);
  });

  it("every registered surface still renders its component with the deterministic path", () => {
    for (const { file, component, pathExpr } of REGISTERED_SURFACES) {
      const src = readFileSync(resolve(repoRoot, file), "utf8");
      expect(src, `${file} must still render <${component}>`).toContain(`<${component}`);
      expect(src, `${file} must pass ${pathExpr} to <${component}>`).toContain(pathExpr);
    }
  });
});
