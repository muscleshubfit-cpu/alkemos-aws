import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  SPECIAL_LOCALE_PREFIXES,
  isArabicPath,
  isSpecialSurface,
  normalizeLang,
  LANG_COOKIE,
  LANG_STORAGE_KEY,
  LANG_COOKIE_MAX_AGE,
} from "../surface-locale";

/**
 * 449 SURFACE LOCALE LAW — execution canaries (2026-11-07).
 *
 * Source: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md §11 (owner
 * order «مراجعة شاملة لمنظومة اللغة والتنقل على مستوى الموقع بالكامل…
 * حدد سبب عدم وجود ضمان مركزي لاستمرار اللغة في جميع الصفحات والمكونات،
 * بما فيها لوحة الأدمن والأسطح الخاصة»).
 *
 * The live-reproduced production bug this law fixes: the admin panel
 * could not stay Arabic — /admin/dashboard toggled to Arabic → ONE
 * sidebar link → the whole chrome reverted to en/ltr (UrlLocaleSync
 * force-reset every non-/ar pathname), and a reload booted English
 * even with mhe:lang=ar saved (the server never saw the preference).
 *
 * Three layers, mirroring the repo's canary discipline:
 *   1. PREDICATES — the classifier's boundary behavior.
 *   2. THE CENTRAL GUARANTEE — the prefix list IS the (app) route group
 *      (filesystem walk: a new (app) route without a classifier prefix
 *      FAILS the suite — the guarantee can never silently drift).
 *   3. SOURCE PINS — the law is wired in all three layers (the sync
 *      leaf, the setLang cookie mirror, the dynamic (app) layout) and
 *      the PUBLIC trees stay static/cookie-free (F-2-A byte-identical).
 *
 * The BEHAVIORAL side (SPA navigations across the three surface
 * classes) lives in context-render-storm.test.tsx alongside the
 * F-2-A behavior test it must keep green.
 */
const read = (rel: string) => readFileSync(resolve(__dirname, rel), "utf8");

const I18N = "../../lib/i18n.tsx";
const APP_LAYOUT = "../../app/(app)/layout.tsx";
const EN_LAYOUT = "../../app/(en)/layout.tsx";
const AR_LAYOUT = "../../app/(ar)/layout.tsx";
const MIDDLEWARE = "../../middleware.ts";
const SURFACE_LOCALE = "../../lib/surface-locale.ts";

describe("449 predicates — the classifier's boundaries", () => {
  it("isArabicPath: exactly /ar or the /ar/ subtree (the middleware's rule)", () => {
    expect(isArabicPath("/ar")).toBe(true);
    expect(isArabicPath("/ar/")).toBe(true);
    expect(isArabicPath("/ar/exercises/barbell-squat")).toBe(true);
    expect(isArabicPath("/")).toBe(false);
    expect(isArabicPath("/exercises")).toBe(false);
    expect(isArabicPath("/archive")).toBe(false); // loose startsWith would misclassify
    expect(isArabicPath("/artificial")).toBe(false);
  });

  it("isSpecialSurface: exact-or-subtree for every (app) prefix — /administration is NOT special", () => {
    for (const p of SPECIAL_LOCALE_PREFIXES) {
      expect(isSpecialSurface(p)).toBe(true); // the hub itself
      expect(isSpecialSurface(`${p}/`)).toBe(true);
      expect(isSpecialSurface(`${p}/deep/child`)).toBe(true);
    }
    // Boundary discipline: a longer PUBLIC route sharing a prefix's
    // stem must not be captured (same rule as isArabicPath vs /archive).
    expect(isSpecialSurface("/administration")).toBe(false);
    expect(isSpecialSurface("/supporting")).toBe(false);
    expect(isSpecialSurface("/coachella")).toBe(false);
    // The public trees are never special — not even under a prefix stem.
    expect(isSpecialSurface("/")).toBe(false);
    expect(isSpecialSurface("/ar")).toBe(false);
    expect(isSpecialSurface("/ar/admin")).toBe(false); // /ar/* is PUBLIC ARABIC by URL
    expect(isSpecialSurface("/exercises")).toBe(false);
    expect(isSpecialSurface("/blog/some-post")).toBe(false);
  });

  it("normalizeLang: only \"ar\" survives as Arabic — absent/tampered values fall back to \"en\"", () => {
    expect(normalizeLang("ar")).toBe("ar");
    expect(normalizeLang("en")).toBe("en");
    expect(normalizeLang(undefined)).toBe("en");
    expect(normalizeLang(null)).toBe("en");
    expect(normalizeLang("AR")).toBe("en"); // case-sensitive by design
    expect(normalizeLang("ar-EG")).toBe("en"); // no locale negotiation
    expect(normalizeLang("")).toBe("en");
    expect(normalizeLang(42)).toBe("en");
  });

  it("the storage contract: one key name in both stores + the 1-year cookie precedent", () => {
    expect(LANG_COOKIE).toBe("mhe:lang");
    expect(LANG_STORAGE_KEY).toBe("mhe:lang"); // the legacy key — zero migration
    expect(LANG_COOKIE).not.toBe("mhe:locale"); // the DEAD cookie F-6 removed
    expect(LANG_COOKIE_MAX_AGE).toBe(31536000);
  });
});

describe("449 the central guarantee — the prefix list IS the (app) route group", () => {
  it("every (app) route folder (top level + (authed)) has its prefix, and NOTHING else does", () => {
    const appDir = resolve(__dirname, "../../app/(app)");
    const dirsOf = (p: string) =>
      readdirSync(p).filter((f) => statSync(resolve(p, f)).isDirectory());
    const top = dirsOf(appDir).filter((d) => !d.startsWith("(")); // skip (authed)
    const authed = dirsOf(resolve(appDir, "(authed)"));
    const expected = [...top, ...authed]
      .map((d) => `/${d}`)
      .sort();
    expect([...SPECIAL_LOCALE_PREFIXES].sort()).toEqual(expected);
  });
});

describe("449 source pins — the law is wired in all three layers", () => {
  it("UrlLocaleSync resolves through the classifier: ar / special-preference / en — no binary force", () => {
    const src = read(I18N);
    // The three-class resolution (report §11)…
    expect(src).toContain("if (isArabicPath(pathname))");
    expect(src).toContain("if (isSpecialSurface(pathname))");
    expect(src).toContain("readPersistedLang()");
    expect(src).toContain("persistLangCookie(pref)");
    // …and the binary force that caused the admin revert is GONE.
    expect(src).not.toContain('isArPath ? "ar" : "en"');
    // The imports come from the central classifier (single source).
    expect(src).toContain('from "@/lib/surface-locale"');
  });

  it("setLang mirrors the choice into the cookie (the SSR-readable store)", () => {
    const src = read(I18N);
    expect(src).toContain("persistLangCookie(l)");
    expect(src).toContain("localStorage.setItem(LANG_STORAGE_KEY, l)");
    expect(src).not.toContain('localStorage.setItem("mhe:lang"');
  });

  it("the (app) root layout server-renders lang/dir from the preference cookie (dynamic group)", () => {
    const src = read(APP_LAYOUT);
    expect(src).toContain('export const dynamic = "force-dynamic"');
    expect(src).toContain("(await cookies()).get(LANG_COOKIE)");
    expect(src).toContain("normalizeLang");
    expect(src).toContain('dir={lang === "ar" ? "rtl" : "ltr"}');
    expect(src).toContain("<RootShell lang={lang}");
  });

  it("F-2-A byte-identical: the PUBLIC layouts stay static and NEVER read cookies", () => {
    for (const layout of [EN_LAYOUT, AR_LAYOUT]) {
      const src = read(layout);
      // Pin the CODE, not the prose (the layouts' doc comments
      // legitimately MENTION the retired cookies()-reading layout they
      // replaced): no next/headers import and no classifier wiring can
      // reach these trees without these lines.
      expect(src).not.toContain("next/headers");
      expect(src).not.toContain("surface-locale");
      expect(src).toContain("<RootShell lang=");
    }
  });

  it("no server Set-Cookie of the preference anywhere — the cookie is CLIENT-written only", () => {
    // The middleware (the only server edge that stamps cookies wholesale)
    // must not know about mhe:lang at all — public cache noise stays zero
    // and the (app) layout only READS.
    expect(read(MIDDLEWARE)).not.toContain("mhe:lang");
    const layout = read(APP_LAYOUT);
    expect(layout).not.toMatch(/cookies\.set/);
    // The writer lives in the client module, guarded to document.cookie.
    const law = read(SURFACE_LOCALE);
    expect(law).toContain("document.cookie = `${LANG_COOKIE}=${l}");
    expect(law).not.toContain("navigator.language"); // no browser sniffing — R-1 stays dead
  });
});
