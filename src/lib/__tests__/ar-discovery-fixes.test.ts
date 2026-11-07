import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * AR-DISCOVERY-UI-SETTLE FIXES — execution canaries (2026-11-07).
 *
 * Source report: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md §6.
 * The audit frame (445) was audit-only; this file pins the EXECUTED
 * subset so none of the five shipped fixes can silently regress:
 *
 *   F-1 (P0)  the footer cross-language bridge link — ONE crawlable
 *             <a href> per public footer to the page's language mirror
 *             (killing the measured zero-cross-language-links isolation)
 *   F-3 (P1)  the returning-user session idle cap 2500ms → 1200ms
 *             (the "logged-out → logged-in" flash window)
 *   F-4 (P2)  the homepage #learn island renders from SERVER props —
 *             no deferIdle(2500) client REST fetch (the R-3 late shift)
 *   F-5 (P2)  RECONCILED by F-2-A: the (app) pre-paint lang/dir stamp
 *             shipped by the 446 frame is REMOVED (phase 447 — its
 *             "matches what hydration settles on" premise died when the
 *             URL became the sole language governor; keeping it would
 *             re-create a post-hydration dir flip on the account surfaces)
 *   F-6 (P3)  the dead `mhe:locale` cookie write is GONE (R-6: zero
 *             readers; pure Set-Cookie noise on dynamic surfaces)
 *
 * F-2 was EXECUTED 2026-11-07 (phase 447 — owner order «نفّذ الآن القرار
 * F-2 بالخيار A»: the URL path is the sole governor of the UI language)
 * and is pinned in context-render-storm.test.tsx (source pin + the
 * saved-AR-preference behavior test). F-7 (owner actions: token
 * rotation, GSC) remains deliberately unpinned — owner-side actions.
 */
const read = (rel: string) => readFileSync(resolve(__dirname, rel), "utf8");

const FOOTER = "../../components/SiteFooter.tsx";
const ARTICLE_VIEW = "../../components/blog/BlogArticlePage.tsx";
const EN_ARTICLE_PAGE = "../../app/(en)/blog/[slug]/page.tsx";
const AR_ARTICLE_PAGE = "../../app/(ar)/ar/blog/[slug]/page.tsx";
const AUTH_HOOK = "../../hooks/use-auth.tsx";
const DYN_ISLANDS = "../../components/views/LandingViewDynamicIslands.tsx";
const LANDING = "../../components/views/LandingView.tsx";
const EN_HOME = "../../app/(en)/(home)/page.tsx";
const AR_HOME = "../../app/(ar)/ar/(home)/page.tsx";
const ROOT_SHELL = "../../components/root-shell.tsx";
const APP_LAYOUT = "../../app/(app)/layout.tsx";
const EN_LAYOUT = "../../app/(en)/layout.tsx";
const AR_LAYOUT = "../../app/(ar)/layout.tsx";
const MIDDLEWARE = "../../middleware.ts";
const BLOG = "../../lib/blog.ts";
const CAROUSEL_LIB = "../../lib/blog-home-carousel.ts";

describe("F-1 — the footer cross-language bridge link", () => {
  it("SiteFooter renders ONE crawlable <a href> to the page's mirror, derived from the URL", () => {
    const src = read(FOOTER);
    // The URL-locale derivation (NOT the reactive lang state — stable
    // across the R-1 post-hydration flip, and correct in the raw HTML
    // crawlers see).
    expect(src).toContain("usePathname()");
    expect(src).toContain('pathname === "/ar" || pathname.startsWith("/ar/")');
    // The audit's exact label pair, target-language-first. «العربية ←» is
    // a string literal; «English →» rides as JSX text inside its dir=ltr
    // span (bidi pin — see the component).
    expect(src).toContain('"العربية ←"');
    expect(src).toContain("English →");
    expect(src).toContain('<span dir="ltr">English →</span>');
    // A real anchor with the computed href (not a JS button).
    expect(src).toMatch(/<a\s[^>]*href=\{crossLangHref\}/);
    // The mirrorHref prop exists for the slug-divergent blog twins.
    expect(src).toContain("mirrorHref?: string");
    // The blog-article guards: prefix swap must NOT hit article leaves
    // (language-specific slugs — a swap 404s); the lists are the honest
    // fallback (the LanguageToggle precedent).
    expect(src).toContain('if (/^\\/blog\\/[^/]+$/.test(pathname)) return "/ar/blog";');
    expect(src).toContain('if (/^\\/ar\\/blog\\/[^/]+$/.test(pathname)) return "/blog";');
    // The prefix-swap law for everything else.
    expect(src).toContain('if (pathname === "/ar") return "/";');
    expect(src).toContain('return `/ar${pathname}`;');
  });

  it("both blog article routes pass the server-resolved twin down (crawlable in raw HTML)", () => {
    const en = read(EN_ARTICLE_PAGE);
    const ar = read(AR_ARTICLE_PAGE);
    for (const [src, name, twinBranch, fallback] of [
      [en, "EN", 'og.twinLang === "ar"', '"/ar/blog"'],
      [ar, "AR", 'og.twinLang === "en"', '"/blog"'],
    ] as const) {
      expect(src, `${name}: twinSlug drives the mirror`).toContain("og.twinSlug");
      expect(src, `${name}: twin language branch`).toContain(twinBranch);
      expect(src, `${name}: unpaired fallback = the opposite blog list`).toContain(fallback);
      expect(src, `${name}: prop is forwarded`).toContain("mirrorHref={mirrorHref}");
    }
    // The client view forwards it to the footer.
    const view = read(ARTICLE_VIEW);
    expect(view).toContain("mirrorHref?: string");
    expect(view).toContain("<SiteFooter mirrorHref={mirrorHref} />");
  });
});

describe("F-3 — the returning-user session idle cap", () => {
  it("deferIdle for the returning user dropped 2500 → 1200 (the deferral principle stays)", () => {
    const src = read(AUTH_HOOK);
    expect(src).toContain("deferIdle(() => void startAuth(), 1200)");
    expect(src).not.toContain("deferIdle(() => void startAuth(), 2500)");
  });
});

describe("F-4 — the homepage #learn island renders from server props", () => {
  it("both home routes select the carousels server-side and pass them down", () => {
    for (const [rel, lang] of [
      [EN_HOME, '"en"'],
      [AR_HOME, '"ar"'],
    ] as const) {
      const src = read(rel);
      expect(src).toContain("listPublishedPostsForListPage");
      expect(src).toContain("selectHomeBlogCarousels");
      expect(src).toContain(`listPublishedPostsForListPage(${lang})`);
      expect(src).toContain("blogCarousels={blogCarousels}");
    }
  });

  it("the selection law lives in the directive-free module; blog.ts re-exports it (one public surface)", () => {
    const rawLaw = read(CAROUSEL_LIB);
    // Comments narrate the extraction ("extracted from \"use client\"
    // blog.ts") — the DIRECTIVE check must read the code, so strip
    // comments first (comments are not copy — the glued-latin law).
    const law = rawLaw
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ");
    expect(law).toContain("export const HOME_LATEST_COUNT = 8;");
    expect(law).toContain("export const HOME_FEATURED_COUNT = 6;");
    expect(law).toContain("export function selectHomeBlogCarousels(");
    expect(law).not.toContain('"use client"');
    expect(law).not.toContain("server-only");

    const blog = read(BLOG);
    expect(blog).toContain('from "./blog-home-carousel"');
    // The law is RE-EXPORTED, not duplicated.
    expect(blog).not.toMatch(/export const HOME_LATEST_COUNT/);
    expect(blog).not.toMatch(/export function selectHomeBlogCarousels/);
  });

  it("BlogSection renders from props — the deferred client fetch is GONE, the honest null fallback stays", () => {
    const raw = read(DYN_ISLANDS);
    // Comments narrate the retired engine (the repo's history law) — the
    // CODE is what must stay clean, so strip comments before the negative
    // pins (the check_glued_latin.py precedent: comments are not copy).
    const src = raw
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ");
    expect(src).toContain("latestPosts?: BlogPostCard[]");
    expect(src).toContain("featuredPosts?: BlogPostCard[]");
    expect(src).toContain("if (latestPosts.length === 0) return null;");
    // The old engine is fully retired from the CODE (comments may
    // narrate its history).
    expect(src).not.toContain("listBlogPosts");
    expect(src).not.toContain("deferIdle");
    expect(src).not.toContain("selectHomeBlogCarousels");
    // The pinned merge line (homepage-adoption canary #9) is untouched.
    expect(raw).toContain("posts={[...latestPosts, ...featuredPosts].slice(0, 10)}");
  });

  it("LandingView forwards the carousels into the island", () => {
    const src = read(LANDING);
    expect(src).toContain("blogCarousels?: { latest: BlogPostCard[]; featured: BlogPostCard[] }");
    expect(src).toContain("latestPosts={blogCarousels?.latest ?? []}");
    expect(src).toContain("featuredPosts={blogCarousels?.featured ?? []}");
  });
});

describe("F-5 — RECONCILED by F-2-A: the (app) pre-paint lang/dir stamp is REMOVED", () => {
  it("RootShell carries no prePaintLangDir prop and no alkemos-app-lang-init script", () => {
    const src = read(ROOT_SHELL);
    // The 446-frame script read the saved preference (mhe:lang → browser
    // language) and stamped ar/rtl pre-paint on the (app) group. With F-2-A
    // (URL governs) non-/ar URLs settle on en/ltr — the script would stamp
    // ar/rtl pre-paint then flip BACK after hydration: a fresh post-
    // hydration dir flip violating the owner order. Removed in phase 447.
    expect(src).not.toContain("prePaintLangDir");
    expect(src).not.toContain('id="alkemos-app-lang-init"');
    expect(src).not.toContain("localStorage.getItem('mhe:lang')");
    // The THEME pre-paint script stays (theme was never URL-based).
    expect(src).toContain('id="alkemos-theme-init"');
  });

  it("no group layout opts in — every URL's lang/dir comes from the static per-group root", () => {
    expect(read(APP_LAYOUT)).not.toContain("prePaintLangDir");
    expect(read(EN_LAYOUT)).not.toContain("prePaintLangDir");
    expect(read(AR_LAYOUT)).not.toContain("prePaintLangDir");
    // F-2-A's own source pin (URL-only resolution, no localStorage read)
    // lives in context-render-storm.test.tsx alongside its behavior test.
  });
});

describe("F-6 — the dead mhe:locale cookie write is gone", () => {
  it("middleware no longer writes the cookie, but keeps the real signals", () => {
    const src = read(MIDDLEWARE);
    expect(src).not.toContain('cookies.set("mhe:locale"');
    expect(src).not.toMatch(/mhe:locale',\s*desired/);
    // The crawler signals stay.
    expect(src).toContain('response.headers.set("Content-Language"');
    expect(src).toContain('response.headers.set("x-pathname"');
    // The Supabase session machinery is untouched.
    expect(src).toContain("await supabase.auth.getUser()");
  });
});
