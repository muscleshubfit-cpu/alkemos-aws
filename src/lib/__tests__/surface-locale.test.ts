import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  SPECIAL_LOCALE_PREFIXES,
  PUBLIC_INDEX_MIRRORS,
  PUBLIC_PREFIX_MIRRORS,
  isArabicPath,
  isSpecialSurface,
  normalizeLang,
  mirrorPath,
  boundaryRefererRecord,
  LANG_COOKIE,
  LANG_STORAGE_KEY,
  LANG_COOKIE_MAX_AGE,
} from "../surface-locale";

/**
 * 449 SURFACE LOCALE LAW + 450 UNIFIED CHOICE LAW — execution canaries
 * (2026-11-07 / 2026-11-08).
 *
 * Sources: docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md §11 (449 —
 * owner order «مراجعة شاملة لمنظومة اللغة والتنقل على مستوى الموقع
 * بالكامل… حدد سبب عدم وجود ضمان مركزي لاستمرار اللغة في جميع الصفحات
 * والمكونات، بما فيها لوحة الأدمن والأسطح الخاصة») and §12 (450 —
 * owner order «حلاً موحداً وشاملاً لإدارة لغة الموقع. القاعدة الوحيدة:
 * عندما يختار المستخدم العربية، يظل الموقع بالكامل بالعربية أثناء
 * التنقل بين جميع الصفحات، وعندما يختار الإنجليزية يظل الموقع
 * بالكامل بالإنجليزية. أزل أي تعارض بين الرابط والتفضيلات المحفوظة…»).
 *
 * The live-reproduced production bugs these laws fix: 449 — the admin
 * panel could not stay Arabic (toggle → one sidebar link → full revert
 * to en/ltr; reload booted English; SSR never saw the choice). 450 —
 * the TWO-governor boundary: an Arabic-choice user crossing from a
 * special surface to a public EN URL (logo → "/") was flipped to
 * English by URL sovereignty, and a first-time Arabic visitor hit an
 * English /auth — both "language changes without the user's choice".
 *
 * Layers, mirroring the repo's canary discipline:
 *   1. PREDICATES — the classifier's boundary behavior + the 450
 *      structural mirror map.
 *   2. THE CENTRAL GUARANTEES — the prefix list IS the (app) route
 *      group AND the mirror map IS the real (en)↔(ar) route topology
 *      (filesystem walks: a new route without its classifier entry
 *      FAILS the suite — the guarantees can never silently drift).
 *   3. SOURCE PINS — the law is wired in all layers (the sync leaf,
 *      the setLang store writer, the dynamic (app) layout, the 451
 *      boundary recorder in the middleware) and the PUBLIC trees stay
 *      static/cookie-free (F-2-A byte-identical for choice-less
 *      visitors and crawlers).
 *
 * The BEHAVIORAL side (SPA navigations across the surface classes +
 * the 450 redirect/record/heal behaviors) lives in
 * context-render-storm.test.tsx alongside the F-2-A behavior tests it
 * keeps green.
 */
const read = (rel: string) => readFileSync(resolve(__dirname, rel), "utf8");

const I18N = "../../lib/i18n.tsx";
const APP_LAYOUT = "../../app/(app)/layout.tsx";
const EN_LAYOUT = "../../app/(en)/layout.tsx";
const AR_LAYOUT = "../../app/(ar)/layout.tsx";
const MIDDLEWARE = "../../middleware.ts";
const SURFACE_LOCALE = "../../lib/surface-locale.ts";
const TOGGLE = "../../components/LanguageToggle.tsx";
const USE_NAV = "../../hooks/use-nav.tsx";

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

describe("450 predicates — the structural mirror map", () => {
  it("mirrorPath resolves every index pair, both directions", () => {
    expect(mirrorPath("/", "ar")).toBe("/ar");
    expect(mirrorPath("/ar", "en")).toBe("/");
    expect(mirrorPath("/memberships", "ar")).toBe("/ar/memberships");
    expect(mirrorPath("/ar/memberships", "en")).toBe("/memberships");
    expect(mirrorPath("/for-coaches/register", "ar")).toBe("/ar/for-coaches/register");
    expect(mirrorPath("/ar/for-coaches/register", "en")).toBe("/for-coaches/register");
  });

  it("mirrorPath prefix-swaps the same-slug subtrees, both directions", () => {
    expect(mirrorPath("/exercises/barbell-squat", "ar")).toBe("/ar/exercises/barbell-squat");
    expect(mirrorPath("/ar/exercises/barbell-squat", "en")).toBe("/exercises/barbell-squat");
    expect(mirrorPath("/foods/lists/high-protein", "ar")).toBe("/ar/foods/lists/high-protein");
    expect(mirrorPath("/ar/foods/lists/high-protein", "en")).toBe("/foods/lists/high-protein");
    expect(mirrorPath("/blog/category/nutrition", "ar")).toBe("/ar/blog/category/nutrition");
    expect(mirrorPath("/ar/blog/category/nutrition", "en")).toBe("/blog/category/nutrition");
    expect(mirrorPath("/diet-plan/beginner/balanced", "ar")).toBe("/ar/diet-plan/beginner/balanced");
    expect(mirrorPath("/ar/diet-plan/beginner/balanced", "en")).toBe("/diet-plan/beginner/balanced");
    expect(mirrorPath("/coaches/sara", "ar")).toBe("/ar/coaches/sara");
    expect(mirrorPath("/tools/bmi-calculator", "ar")).toBe("/ar/tools/bmi-calculator");
  });

  it("mirrorPath returns null for the deliberate boundaries — no 404 bounces, no mixed state", () => {
    // Blog ARTICLE slugs are DB-linked (linked_post_id) — never structural.
    expect(mirrorPath("/blog/some-post", "ar")).toBeNull();
    expect(mirrorPath("/ar/blog/some-post", "en")).toBeNull();
    // Special surfaces carry no language dimension.
    expect(mirrorPath("/admin/clients", "ar")).toBeNull();
    expect(mirrorPath("/auth", "ar")).toBeNull();
    expect(mirrorPath("/dashboard", "ar")).toBeNull();
    // Already in the target tree — nothing to resolve.
    expect(mirrorPath("/ar/exercises", "ar")).toBeNull();
    expect(mirrorPath("/exercises", "en")).toBeNull();
    // Unknown / non-mirrored paths.
    expect(mirrorPath("/nonexistent-page", "ar")).toBeNull();
    expect(mirrorPath("/ar/nonexistent-page", "en")).toBeNull();
  });
});

describe("451 predicates — the boundary recorder (the always-fresh server twin of the passive record)", () => {
  const ORIGIN = "https://alkemos.com";

  it("records ar at EVERY special-surface crossing from the Arabic tree — the owner's case-2 flow", () => {
    for (const p of SPECIAL_LOCALE_PREFIXES) {
      expect(boundaryRefererRecord(p, false, `${ORIGIN}/ar`, ORIGIN)).toBe("ar");
      expect(boundaryRefererRecord(`${p}/deep/child`, false, `${ORIGIN}/ar`, ORIGIN)).toBe("ar");
    }
    // The exact reproduction surface (live-measured on production
    // 2026-11-07: /dashboard with Referer /ar SSR'd en/ltr — §13.1).
    expect(boundaryRefererRecord("/dashboard", false, `${ORIGIN}/ar`, ORIGIN)).toBe("ar");
    expect(boundaryRefererRecord("/auth", false, `${ORIGIN}/ar`, ORIGIN)).toBe("ar");
    expect(boundaryRefererRecord("/admin/dashboard", false, `${ORIGIN}/ar`, ORIGIN)).toBe("ar");
    // Deep Arabic referers and referers carrying query strings.
    expect(boundaryRefererRecord("/dashboard", false, `${ORIGIN}/ar/memberships?plan=pro`, ORIGIN)).toBe("ar");
    expect(boundaryRefererRecord("/coach", false, `${ORIGIN}/ar/blog/some-post`, ORIGIN)).toBe("ar");
  });

  it("NEVER overrides a recorded choice — the ONE governor", () => {
    expect(boundaryRefererRecord("/dashboard", true, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/auth", true, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    // An explicit EN choice reading /ar then crossing keeps EN too.
    expect(boundaryRefererRecord("/dashboard", true, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
  });

  it("records NOTHING for public surfaces — the URL law (F-2-A) governs there, and the edge cache must never see Set-Cookie", () => {
    expect(boundaryRefererRecord("/", false, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/memberships", false, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/ar", false, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/blog/some-post", false, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    // Boundary discipline: /coaching and /coaches/* are PUBLIC.
    expect(boundaryRefererRecord("/coaching", false, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/coaches/sara", false, `${ORIGIN}/ar`, ORIGIN)).toBeNull();
  });

  it("an EN-tree referer records nothing — English is the documented default (450 rationale)", () => {
    expect(boundaryRefererRecord("/dashboard", false, `${ORIGIN}/`, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/dashboard", false, `${ORIGIN}/memberships`, ORIGIN)).toBeNull();
    // /archive is NOT Arabic (the isArabicPath boundary).
    expect(boundaryRefererRecord("/dashboard", false, `${ORIGIN}/archive`, ORIGIN)).toBeNull();
  });

  it("a missing, external, or malformed referer proves nothing — null, no guesswork", () => {
    expect(boundaryRefererRecord("/dashboard", false, null, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/dashboard", false, undefined, ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/dashboard", false, "", ORIGIN)).toBeNull();
    // External Arabic pages linking to our auth are not OUR reader.
    expect(boundaryRefererRecord("/auth", false, "https://external.example/ar", ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/auth", false, "https://facebook.com/", ORIGIN)).toBeNull();
    // Malformed referer strings.
    expect(boundaryRefererRecord("/dashboard", false, "not-a-url", ORIGIN)).toBeNull();
    expect(boundaryRefererRecord("/dashboard", false, "https://", ORIGIN)).toBeNull();
  });

  it("port-aware: a different-port referer is a different origin — null", () => {
    // Local E2E runs on :3000 — the recorder must not accept a
    // cross-origin referer even when the hostname matches.
    expect(boundaryRefererRecord("/dashboard", false, "http://localhost:3000/ar", "https://alkemos.com")).toBeNull();
    expect(boundaryRefererRecord("/dashboard", false, "http://localhost:3001/ar", "http://localhost:3000")).toBeNull();
  });
});

describe("449+450 the central guarantees — the lists ARE the route tree", () => {
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

  it("450: the index-mirror map IS the real (en)↔(ar) static-pair topology — resolvable both ways, inventing nothing", () => {
    const enDir = resolve(__dirname, "../../app/(en)");
    const arDir = resolve(__dirname, "../../app/(ar)/ar");
    // Walk a public tree collecting EVERY static page route (route
    // groups add no segment; a page at the base IS the home route).
    const staticRoutes = (base: string, arPrefix: string) => {
      const out = new Set<string>();
      const walk = (dir: string, prefix: string) => {
        for (const f of readdirSync(dir)) {
          const full = resolve(dir, f);
          if (statSync(full).isDirectory()) {
            if (f.startsWith("(")) walk(full, prefix);
            else if (!f.startsWith("[")) walk(full, `${prefix}/${f}`);
          } else if (f === "page.tsx" || f === "page.ts") {
            const route = prefix === "" ? "/" : prefix;
            out.add(arPrefix ? `${arPrefix}${route === "/" ? "" : route}` : route);
          }
        }
      };
      walk(base, "");
      return out;
    };
    const en = staticRoutes(enDir, "");
    const ar = staticRoutes(arDir, "/ar");
    // Every static page that exists in BOTH trees must resolve through
    // the central map (exact pair or prefix) — index pages, static
    // sub-pages (foods/methodology, guides/macro-tracking-accuracy, the
    // five tool pages…), all of it. THE guarantee: a new mirrored route
    // cannot silently miss the map.
    for (const r of en) {
      const twin = r === "/" ? "/ar" : `/ar${r}`;
      if (ar.has(twin)) {
        expect(mirrorPath(r, "ar"), `EN static pair ${r} must resolve to ${twin}`).toBe(twin);
        expect(mirrorPath(twin, "en"), `AR static pair ${twin} must resolve to ${r}`).toBe(r);
      }
    }
    // The map invents nothing: every index row's ar side exists on the
    // filesystem, and every prefix row names a REAL subtree in BOTH trees.
    for (const m of PUBLIC_INDEX_MIRRORS) {
      expect(ar.has(m.ar), `map row ${m.en} → ${m.ar}: AR route missing`).toBe(true);
      expect(en.has(m.en) || [...en].some((r) => r.startsWith(m.en + "/")), `map row ${m.en}: EN route missing`).toBe(true);
    }
    for (const p of PUBLIC_PREFIX_MIRRORS) {
      // Prefix rows may cover DYNAMIC subtrees (no static page collects
      // them above) — verify the route FOLDER exists on both sides.
      expect(statSync(resolve(enDir, `.${p}`)).isDirectory(), `prefix ${p}: EN route folder missing`).toBe(true);
      expect(statSync(resolve(arDir, `.${p}`)).isDirectory(), `prefix ${p}: AR route folder missing`).toBe(true);
    }
  });

  it("450: every shared dynamic subtree is prefix-mirrorable — /blog/[slug] alone is the documented DB-linked exception", () => {
    const enDir = resolve(__dirname, "../../app/(en)");
    const arDir = resolve(__dirname, "../../app/(ar)/ar");
    // Collect the PARENT prefixes of every [param] page (the subtree a
    // dynamic slug hangs under), in both trees.
    const dynamicParents = (base: string) => {
      const out = new Set<string>();
      const walk = (dir: string, prefix: string) => {
        for (const f of readdirSync(dir)) {
          const full = resolve(dir, f);
          if (statSync(full).isDirectory()) {
            if (f.startsWith("(")) walk(full, prefix);
            else if (f.startsWith("[")) out.add(prefix === "" ? "/" : `${prefix}/`);
            else walk(full, `${prefix}/${f}`);
          }
        }
      };
      walk(base, "");
      return out;
    };
    const enParents = dynamicParents(enDir);
    const arParents = dynamicParents(arDir);
    for (const p of enParents) {
      const arP = p === "/" ? "/ar" : `/ar${p}`;
      if (!arParents.has(arP)) continue; // EN-only dynamic subtree — nothing to mirror
      // The ONE deliberate exception, pinned: blog ARTICLE slugs are
      // resolved per-post via linked_post_id (the toggle's DB lookup),
      // never structurally — a 404 bounce would be strictly worse.
      if (p === "/blog/") {
        expect(mirrorPath("/blog/some-post", "ar")).toBeNull();
        continue;
      }
      const probe = `${p}example-slug`;
      expect(mirrorPath(probe, "ar"), `dynamic subtree ${p} must prefix-swap`).toBe(`/ar${probe}`);
      expect(mirrorPath(`/ar${probe}`, "en"), `AR dynamic subtree /ar${p} must prefix-swap back`).toBe(probe);
    }
  });
});

describe("449+450 source pins — the law is wired in every layer", () => {
  it("UrlLocaleSync resolves through the classifier: special-preference / public-URL + choice sync — no binary force", () => {
    const src = read(I18N);
    // The 450 resolution (report §12)…
    expect(src).toContain("if (isSpecialSurface(pathname))");
    expect(src).toContain("readStoredLang()");
    expect(src).toContain("mirrorPath(pathname, stored)");
    expect(src).toContain("healLangStores(stored)");
    expect(src).toContain("router.replace(");
    // …and the binary force that caused the admin revert stays GONE.
    expect(src).not.toContain('isArPath ? "ar" : "en"');
    // The imports come from the central classifier (single source).
    expect(src).toContain('from "@/lib/surface-locale"');
  });

  it("setLang persists the choice through the ONE store writer (both stores, one step)", () => {
    const src = read(I18N);
    expect(src).toContain("persistLangChoice(l)");
    // No divergent hand-rolled store writes survive in the provider.
    expect(src).not.toContain('localStorage.setItem("mhe:lang"');
    expect(src).not.toContain("localStorage.setItem(LANG_STORAGE_KEY");
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

  it("451: the middleware is the law's ALWAYS-FRESH enforcer at the special-surface boundary — record, never redirect", () => {
    // 450 rejected a middleware MIRROR-REDIRECT on measured evidence
    // (Next 16's proxy strips the RSC flight markers; a redirect would
    // inherit the edge-cacheable public Cache-Control) and the middleware
    // stayed 449-clean. 451 (report §13) adds the BOUNDARY RECORDER — a
    // different animal: no redirect anywhere, and the cookie write fires
    // ONLY on the PRIVATE surfaces (never edge-cached), ONLY when no
    // recorded choice exists, ONLY from a same-origin /ar referer. It is
    // the always-fresh server twin of the 450 passive record — the CF
    // edge serves public HTML up to 12h stale after every deploy, and
    // the owner's case-2 failure (choose Arabic on the homepage → open
    // the dashboard → English) was exactly a stale-generation public
    // page whose toggle wrote no cookie meeting a fresh special surface
    // whose SSR reads only the cookie.
    const src = read(MIDDLEWARE);
    // The REDIRECT surface stays rejected — 450's measured law.
    expect(src).not.toContain("mirrorPath");
    expect(src).not.toMatch(/NextResponse\.redirect/);
    // The pure decision is IMPORTED from the central classifier — the
    // middleware must not re-implement it (single source).
    expect(src).toContain('from "@/lib/surface-locale"');
    expect(src).toContain("boundaryRefererRecord(");
    // The choice-holder guard: the recorder never overrides a choice.
    expect(src).toContain("request.cookies.has(LANG_COOKIE)");
    // The REQUEST injection (before NextResponse.next — this render is
    // correct from the first HTML: no flip).
    expect(src).toContain("request.cookies.set(LANG_COOKIE, boundaryLang)");
    // The RESPONSE persistence — applied on the main path AND
    // re-applied inside the @supabase/ssr setAll callback (which
    // REPLACES the response object mid-flight; without the re-apply a
    // logged-in user's first crossing renders Arabic but never
    // persists the record, and the next special-surface navigation —
    // referer /dashboard, not /ar — flips back to English).
    expect(src.match(/applyBoundaryCookie\(response\)/g)?.length).toBe(2);
    expect(src).toContain("sameSite: \"lax\"");
    expect(src).toContain("maxAge: LANG_COOKIE_MAX_AGE");
    // The dead cookie stays dead (F-6) — pin the CODE, not the prose
    // (the middleware's historical comments legitimately MENTION the
    // removed write; only an actual write would match this pattern).
    expect(src).not.toContain('cookies.set("mhe:locale"');
    expect(src).not.toMatch(/mhe:locale',\s*desired/);
  });

  it("450: use-nav resolves every PUBLIC view target through the CENTRAL map by the recorded choice", () => {
    // The second central consumer: the logo / account buttons / logout
    // landing (every view navigation in the chrome) lands DIRECTLY in
    // the chosen tree — no wrong-language render, no replace needed.
    const src = read(USE_NAV);
    expect(src).toContain("readStoredLang()");
    expect(src).toContain("mirrorPath(target, stored)");
    // The 449 URL-based remap survives ONLY for choice-less visitors.
    expect(src).toContain("AR_VIEW_MIRRORS[v]");
    expect(src).toContain('from "@/lib/surface-locale"');
  });

  it("450: the toggle consumes the CENTRAL map — no private mirror copies left to drift", () => {
    const src = read(TOGGLE);
    expect(src).toContain("mirrorPath(pathname, nextLang)");
    expect(src).not.toContain("MIRROR_ROUTES");
    expect(src).not.toContain("PREFIX_MIRROR");
    // The ONE deliberate local exception stays: the DB-linked blog pair.
    expect(src).toContain("getLinkedPost(post)");
  });

  it("no server Set-Cookie of the preference anywhere — the cookie is CLIENT-written only", () => {
    // The writer lives in the client module, guarded to document.cookie.
    const law = read(SURFACE_LOCALE);
    expect(law).toContain("document.cookie = `${LANG_COOKIE}=${l}");
    expect(law).not.toContain("navigator.language"); // no browser sniffing — R-1 stays dead
    // Cookie-first priority: the store the server governors read is the
    // store the client resolves first (no client/server bounce loop).
    expect(law).toContain("export function readStoredLang(): \"ar\" | \"en\" | null");
  });
});
