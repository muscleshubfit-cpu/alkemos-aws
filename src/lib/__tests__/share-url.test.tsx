import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { canonicalShareUrl, SHARE_BASE_URL } from "@/lib/share-url";
import { ShareButtons } from "@/components/ShareButtons";
import { I18nProvider } from "@/lib/i18n";

// ShareButtons/I18nProvider are client components — under vitest there is
// no Next router, so usePathname() is stubbed (the provider already
// tolerates null: `usePathname() || "/"`).
vi.mock("next/navigation", () => ({
  usePathname: () => null,
  // 450: UrlLocaleSync (inside I18nProvider) also subscribes to the
  // router for the mirror-replace safety net — stub the seam.
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, prefetch: () => {}, back: () => {} }),
}));

/**
 * SHARE URL LAW (Phase 230 — P0 of the Social Sharing deep audit, owner
 * order «نفّذ الآن P0 بالكامل من تقرير Deep Audit لنظام Social Sharing»).
 *
 * History this file guards against:
 *  - pre-227: ShareButtons read window.location.href DURING render → the
 *    server rendered EMPTY share hrefs and React never patched them up
 *    (WhatsApp shared text with no URL — the owner-reported symptom).
 *  - 227: mountedUrl via useEffect — hydration-safe but empty BEFORE
 *    mount, and window.location.href leaked utm/cb into shared URLs.
 *  - 230 (this law): canonical URL is deterministic from the FIRST
 *    server render, built from the required `path` prop.
 */

const EN_EVO = encodeURIComponent("https://alkemos.com/evo");
const AR_EVO = encodeURIComponent("https://alkemos.com/ar/evo");

function ssr(lang: "en" | "ar", path = "/evo"): string {
  return renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop -- provider props TYPE requires children in props (test-only render)
    createElement(
      I18nProvider,
      {
        urlLocale: lang,
        children: createElement(ShareButtons, {
          title:
            lang === "ar" ? "EVO — مدرب ذكاء اصطناعي | Alkemos" : "EVO — AI Coach | Alkemos",
          path,
        }),
      },
    ),
  );
}

/** Attribute values are HTML-escaped (`&` → `&amp;`) — decode back so the
 *  assertions see exactly what the BROWSER sees in the live DOM. */
function decoded(html: string): string {
  return html.replace(/&amp;/g, "&");
}

/** Strip comments so the source guard checks CODE, not the docblock that
 *  documents the history of the law. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("canonicalShareUrl — the share URL builder (single source)", () => {
  it("builds the absolute EN URL as-is", () => {
    expect(canonicalShareUrl("/evo", "en")).toBe("https://alkemos.com/evo");
  });

  it("prefixes /ar for the AR mirrors", () => {
    expect(canonicalShareUrl("/evo", "ar")).toBe("https://alkemos.com/ar/evo");
    expect(canonicalShareUrl("/tools/bmi-calculator", "ar")).toBe(
      "https://alkemos.com/ar/tools/bmi-calculator",
    );
  });

  it("never double-prefixes /ar (idempotent)", () => {
    expect(canonicalShareUrl("/ar/evo", "ar")).toBe("https://alkemos.com/ar/evo");
  });

  it("strips query params — utm/cb trackers can never reach a share", () => {
    expect(canonicalShareUrl("/evo?cb=29859&utm_source=whatsapp", "en")).toBe(
      "https://alkemos.com/evo",
    );
    expect(canonicalShareUrl("/evo?cb=29859", "ar")).toBe("https://alkemos.com/ar/evo");
  });

  it("strips hash fragments", () => {
    expect(canonicalShareUrl("/evo#results", "en")).toBe("https://alkemos.com/evo");
  });

  it("normalizes trailing/duplicate slashes", () => {
    expect(canonicalShareUrl("/tools/bmi-calculator/", "en")).toBe(
      "https://alkemos.com/tools/bmi-calculator",
    );
    expect(canonicalShareUrl("//evo//", "en")).toBe("https://alkemos.com/evo");
  });

  it("collapses the root path to the bare origin (never an empty URL)", () => {
    expect(canonicalShareUrl("", "en")).toBe("https://alkemos.com");
    expect(canonicalShareUrl("/", "en")).toBe("https://alkemos.com");
    expect(canonicalShareUrl("/", "ar")).toBe("https://alkemos.com/ar");
  });

  it("exports a trailing-slash-free absolute base", () => {
    expect(SHARE_BASE_URL).toBe("https://alkemos.com");
  });
});

describe("ShareButtons SSR — no empty share href can exist (regression law)", () => {
  it("SSR (EN): WhatsApp carries the FULL canonical URL from the first render", () => {
    const html = decoded(ssr("en"));
    // Full share URL present inside the WhatsApp text payload
    expect(html).toContain("https://wa.me/?text=");
    expect(html).toMatch(new RegExp(`wa\\.me/\\?text=[^"]*%20${EN_EVO}`));
  });

  it("SSR (EN): Facebook / X / LinkedIn / Telegram carry the canonical URL", () => {
    const html = decoded(ssr("en"));
    expect(html).toContain(`sharer.php?u=${EN_EVO}&quote=`);
    expect(html).toContain("intent/tweet?text=");
    expect(html).toContain(`&url=${EN_EVO}`);
    expect(html).toContain(`share-offsite/?url=${EN_EVO}`);
    expect(html).toContain(`t.me/share/url?url=${EN_EVO}&text=`);
  });

  it("SSR (EN): zero empty-URL share hrefs (the pre-230 failure mode)", () => {
    const html = decoded(ssr("en"));
    expect(html).not.toContain("sharer.php?u=&");
    expect(html).not.toContain('&url="');
    expect(html).not.toContain("?url=&");
    expect(html).not.toContain('share-offsite/?url="');
  });

  it("SSR (EN): no query/hash leakage into any share href", () => {
    const html = decoded(ssr("en", "/evo?cb=42&utm_source=x#top"));
    expect(html).toContain(EN_EVO);
    expect(html).not.toContain("cb%3D");
    expect(html).not.toContain("utm_");
  });

  it("SSR (AR): the canonical /ar URL space is used, Arabic labels render", () => {
    const html = decoded(ssr("ar"));
    expect(html).toMatch(new RegExp(`wa\\.me/\\?text=[^"]*%20${AR_EVO}`));
    expect(html).toContain(`share-offsite/?url=${AR_EVO}`);
    expect(html).toContain("شارك:");
    expect(html).not.toContain(EN_EVO);
  });

  it("Web Share button is ABSENT from SSR and the Copy fallback is present (WEB SHARE LAW)", () => {
    const html = ssr("en");
    // Native share button renders only after mount, when navigator.share exists
    expect(html).not.toContain('aria-label="Share"');
    expect(html).not.toContain('title="Share"');
    // The always-visible copy fallback
    expect(html).toContain('aria-label="Copy link"');
    const htmlAr = ssr("ar");
    expect(htmlAr).toContain('aria-label="نسخ الرابط"');
  });

  it("post-mount behavior: the button appears when navigator.share exists (jsdom render)", async () => {
    // jsdom has no navigator.share → simulate a supporting device, then
    // let the mount effect flip the flag through @testing-library.
    const nav = navigator as Navigator & { share?: unknown };
    const originalShare = nav.share;
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockResolvedValue(undefined),
      configurable: true,
    });
    try {
      const { render } = await import("@testing-library/react");
      const view = render(
        // eslint-disable-next-line react/no-children-prop -- provider type requires children in props (test-only render)
        createElement(I18nProvider, {
          urlLocale: "en",
          children: createElement(ShareButtons, {
            title: "EVO — AI Coach | Alkemos",
            path: "/evo",
          }),
        }),
      );
      // Mount effect ran → supported → native share button now rendered
      expect(await view.findByLabelText("Share")).toBeTruthy();
      view.unmount();
    } finally {
      if (originalShare === undefined) {
        delete (nav as unknown as { share?: unknown }).share;
      } else {
        Object.defineProperty(navigator, "share", {
          value: originalShare,
          configurable: true,
        });
      }
    }
  });
});

const repoRoot = resolve(__dirname, "../../..");

/** The live ShareButtons surfaces — each MUST declare its canonical path.
 * SOCIAL-OG-3 (2026-09-30, owner order «تأكد من وجود أزرار مشاركة في كل
 * الصفحات العامة»): extended from 12 to the full public-surface law —
 * every content/conversion surface renders ShareButtons with its
 * deterministic canonical path (legal pages privacy/terms are the
 * documented exception: no share intent). */
const SURFACES: Array<[string, string]> = [
  ["src/app/(en)/evo/page.tsx", 'path="/evo"'],
  ["src/app/(en)/coaching/page.tsx", 'path="/coaching"'],
  ["src/app/(en)/memberships/page.tsx", 'path="/memberships"'],
  ["src/app/(en)/meal-planner/page.tsx", 'path="/meal-planner"'],
  ["src/app/(en)/tools/bmi-calculator/page.tsx", 'path="/tools/bmi-calculator"'],
  ["src/app/(en)/tools/body-fat-calculator/page.tsx", 'path="/tools/body-fat-calculator"'],
  ["src/app/(en)/tools/calorie-calculator/page.tsx", 'path="/tools/calorie-calculator"'],
  ["src/app/(en)/tools/macro-calculator/page.tsx", 'path="/tools/macro-calculator"'],
  ["src/app/(en)/tools/water-tracker/page.tsx", 'path="/tools/water-tracker"'],
  ["src/app/(en)/exercises/[slug]/ExerciseDetailClient.tsx", "path={`/exercises/${slug}`}"],
  ["src/app/(en)/foods/[slug]/FoodDetailClient.tsx", "path={`/foods/${food.slug}`}"],
  ["src/app/(en)/programs/[slug]/ProgramDetailClient.tsx", "path={`/programs/${program.slug}`}"],
  // SOCIAL-OG-3 additions — hub/detail surfaces that had no share row
  ["src/app/(en)/muscles/[group]/page.tsx", "path={`/muscles/${group}`}"],
  ["src/app/(ar)/ar/muscles/[group]/page.tsx", "path={`/muscles/${group}`}"],
  ["src/app/(en)/collections/[slug]/page.tsx", "path={`/collections/${collection.slug}`}"],
  ["src/app/(ar)/ar/collections/[slug]/page.tsx", "path={`/collections/${collection.slug}`}"],
  ["src/app/(en)/equipment/[type]/page.tsx", "path={`/equipment/${hub.slug}`}"],
  ["src/app/(ar)/ar/equipment/[type]/page.tsx", "path={`/equipment/${hub.slug}`}"],
  ["src/app/(en)/authors/page.tsx", 'path="/authors"'],
  ["src/app/(ar)/ar/authors/page.tsx", 'path="/authors"'],
  ["src/app/(en)/authors/[slug]/page.tsx", "path={`/authors/${author.slug}`}"],
  ["src/app/(ar)/ar/authors/[slug]/page.tsx", "path={`/authors/${author.slug}`}"],
  ["src/app/(en)/compare/page.tsx", 'path="/compare"'],
  ["src/app/(ar)/ar/compare/page.tsx", 'path="/compare"'],
  ["src/app/(en)/compare/[slug]/page.tsx", "path={`/compare/${comparison.slug}`}"],
  ["src/app/(ar)/ar/compare/[slug]/page.tsx", "path={`/compare/${comparison.slug}`}"],
  ["src/app/(en)/diet-plan/page.tsx", 'path="/diet-plan"'],
  ["src/app/(ar)/ar/diet-plan/page.tsx", 'path="/diet-plan"'],
  ["src/app/(en)/ai-meal-planner/page.tsx", 'path="/ai-meal-planner"'],
  ["src/app/(en)/ai-workout-planner/page.tsx", 'path="/ai-workout-planner"'],
  ["src/components/blog/BlogListPage.tsx", 'path="/blog"'],
  ["src/components/blog/BlogCategoryPage.tsx", "path={`/blog/category/${categoryId}`}"],
  ["src/components/views/StaticPageView.tsx", 'page === "about" ? "/about" : "/faq"'],
  ["src/components/views/ContactView.tsx", 'path="/contact"'],
];

describe("SHARE URL LAW source guards — regression net over every surface", () => {
  it("every ShareButtons surface passes its deterministic canonical path", () => {
    for (const [file, expectedProp] of SURFACES) {
      const src = readFileSync(resolve(repoRoot, file), "utf8");
      expect(src, `${file} must still render <ShareButtons>`).toContain("<ShareButtons");
      expect(src, `${file} must pass ${expectedProp}`).toContain(expectedProp);
    }
  });

  it("ShareButtons.tsx never again reads window.location (no primary, no fallback)", () => {
    const src = codeOnly(
      readFileSync(resolve(repoRoot, "src/components/ShareButtons.tsx"), "utf8"),
    );
    expect(src).not.toContain("window.location");
    expect(src).not.toContain("mountedUrl");
    expect(src).toContain("canonicalShareUrl(path, lang)");
  });

  it("the whole family is unified over the shared engine (Phase 231 law): blog SocialShare + CoachShareButtons consume buildShareLinks/canonicalShareUrl, and NO share component hand-builds intents or reads window.location", () => {
    const components = [
      "src/components/ShareButtons.tsx",
      "src/components/blog/BlogComponents.tsx",
      "src/components/CoachShareButtons.tsx",
    ];
    for (const file of components) {
      const raw = readFileSync(resolve(repoRoot, file), "utf8");
      const src = codeOnly(raw);
      expect(src, `${file} must import the Phase-230 single source`).toContain(
        "canonicalShareUrl",
      );
      expect(src, `${file} must build hrefs via the shared engine`).toContain(
        "buildShareLinks",
      );
      // The unified behavior hook (copy fallback + post-mount Web Share)
      expect(src, `${file} must use the shared useShareActions hook`).toContain(
        "useShareActions",
      );
      // No hand-rolled share intents may survive in any component — the
      // payload formats live ONLY in src/lib/share-links.ts.
      expect(src, `${file} hand-builds a wa.me intent`).not.toContain("wa.me/");
      expect(src, `${file} hand-builds a Facebook sharer`).not.toContain("sharer.php");
      expect(src, `${file} hand-builds a tweet intent`).not.toContain("intent/tweet");
      expect(src, `${file} hand-builds a t.me intent`).not.toContain("t.me/share");
      expect(src, `${file} hand-builds a LinkedIn sharer`).not.toContain("share-offsite");
      // window.location / mountedUrl are retired from EVERY share surface
      expect(src, `${file} reads window.location`).not.toContain("window.location");
      expect(src, `${file} still has a mountedUrl fallback`).not.toContain("mountedUrl");
    }
  });

  it("the platform decisions survive the unification (WhatsApp decree + blog Telegram absence)", () => {
    // OWNER DECREE «معادا زر واتساب لن نضيفها»: for-coaches never offers
    // WhatsApp — the platform config in CoachShareButtons stays
    // facebook/x/telegram.
    const coach = readFileSync(resolve(repoRoot, "src/components/CoachShareButtons.tsx"), "utf8");
    expect(coach).toContain('["facebook", "x", "telegram"]');
    expect(coach.toLowerCase()).not.toContain('"whatsapp"');
    // The blog share bar keeps its historical set (no Telegram) and the
    // article URL comes from the single source via the /blog/<slug> path.
    const blog = readFileSync(resolve(repoRoot, "src/components/blog/BlogComponents.tsx"), "utf8");
    expect(blog).toContain('["facebook", "linkedin", "x", "whatsapp"]');
    // ShareButtons keeps the full five-platform set.
    const buttons = readFileSync(resolve(repoRoot, "src/components/ShareButtons.tsx"), "utf8");
    expect(buttons).toContain('"whatsapp"');
    expect(buttons).toContain('"telegram"');
  });
});
