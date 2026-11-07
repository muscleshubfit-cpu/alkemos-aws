import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, useEffect, type ReactNode } from "react";

/**
 * PHASE 338 — W1-4a (remediation plan §6.2, audit P-01): the SPA render
 * storm. Both root providers (AuthProvider + I18nProvider) subscribed to
 * `usePathname()` themselves AND handed their consumers a FRESH context
 * value object on every render — so every SPA route change re-rendered
 * the providers and then every useAuth/useI18n consumer in the app (audit
 * count at inspection: 49 + 92 components) even though neither auth state
 * nor language had changed, and SiteHeader re-allocated its ~11 drawer
 * groups × ~60 items + the desktop SERVICE_NAV on each of those renders.
 *
 * The P-01 fix this canary pins as CLOSED (fix direction, verbatim:
 * «useMemo للقيمتين + فصل المنطق المعتمد على pathname خارج المزود +
 * رفع المصفوفات الثابتة لنطاق الوحدة»):
 *   - both ctx values are MEMOIZED — the reference changes ONLY when the
 *     underlying state (profile/loading · lang) actually changes;
 *   - the pathname subscription is TORN OFF into null-rendering LEAF
 *     components inside each provider (AuthRouteTrigger · UrlLocaleSync)
 *     — a route change re-renders only the leaf;
 *   - SiteHeader's navigation arrays are STATIC module-scope definitions
 *     (both languages, both href variants) resolved through useMemo keyed
 *     ONLY on lang/role flags — item actions are DATA (nav view / evo
 *     flag), never closures, so the arrays never depend on `navigate`.
 *
 * Two layers, like the W1-3a..e canaries:
 *   1. SOURCE PINS — the three contracts machine-checked in the source.
 *   2. BEHAVIOR — jsdom drives a FAITHFUL navigation: `usePathname` is
 *      mocked as a CONTEXT-BACKED hook, so changing the provided value
 *      re-renders ONLY the pathname subscribers (the leaves + useNav) —
 *      exactly what a real App-Router navigation does — never the
 *      providers. Render-counting probes inside each provider prove the
 *      storm is gone and real state changes still propagate.
 */

// ── The navigation seam: a context-backed usePathname ────────────────────
// (exported from the factory as __PathnameCtx so the harness can provide
// it — the same React-legal pattern the evo-drawer canary uses for its
// chat-context harness).
vi.mock("next/navigation", async () => {
  const { createContext, useContext } = await import("react");
  const PathnameCtx = createContext<string>("/");
  return {
    __PathnameCtx: PathnameCtx,
    usePathname: () => useContext(PathnameCtx),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    }),
  };
});

// ── The auth provider's lazy layer (Phase 182), mocked at the seam ───────
// The holder captures the LIVE onAuthChange callback so the behavior layer
// can fire REAL auth events into the provider; a set `profile` replays to
// every new subscriber (the real contract: current session on subscribe).
const dataLayer = vi.hoisted(() => ({
  seedCalls: 0,
  cb: null as ((p: unknown) => void) | null,
  profile: null as unknown,
}));
vi.mock("@/lib/data", () => ({
  seedLocalData: () => {
    dataLayer.seedCalls += 1;
  },
  onAuthChange: (cb: (p: unknown) => void) => {
    dataLayer.cb = cb;
    cb(dataLayer.profile);
    return () => {};
  },
  // The header bells import these dynamically at their call sites — stub
  // them so a logged-in header render stays quiet (this canary's subject
  // is the render storm, not the bells).
  listNotifications: async () => [],
  markNotificationsRead: async () => {},
  listAdminNotifications: async () => [],
  listAdminNotificationsForAdmin: async () => [],
  markAdminNotificationsRead: async () => {},
}));

// next/image would need the image loader — the helmet MARK renders through
// a plain img stub (the seo-image-dimensions canary owns the real
// <ThemeImg> width/height contract at the source level).
vi.mock("@/components/ThemeImg", () => ({
  ThemeImg: ({ alt }: { alt?: string }) =>
    createElement("img", { alt: alt ?? "" }),
}));

import { I18nProvider, useI18n, type I18nCtx } from "@/lib/i18n";
import { AuthProvider, useAuth, type AuthCtx } from "@/hooks/use-auth";
import type { Profile } from "@/lib/supabase/types";

const repoRoot = resolve(__dirname, "../../..");
const authSrc = () => readFileSync(resolve(repoRoot, "src/hooks/use-auth.tsx"), "utf8");
const i18nSrc = () => readFileSync(resolve(repoRoot, "src/lib/i18n.tsx"), "utf8");
const headerSrc = () =>
  readFileSync(resolve(repoRoot, "src/components/SiteHeader.tsx"), "utf8");

/** The provider function body (up to the leaf that owns the torn-off
 * pathname subscription) — the region that must NOT subscribe itself. */
function span(src: string, from: string, to: string): string {
  const i = src.indexOf(from);
  const j = src.indexOf(to);
  expect(i).toBeGreaterThan(-1);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

// ── Render-counting probes (inside each provider — the storm's victims) ──
// The recordings live at MODULE scope (the react-hooks/immutability law
// forbids mutating props even inside effects): every committed render
// appends exactly one tick and stores the ctx reference it received.
// Reset in beforeEach — the bags are per-test state.
type Bag<T> = { renders: number; last: T | null };
const i18nBag: Bag<I18nCtx> = { renders: 0, last: null };
const authBag: Bag<AuthCtx> = { renders: 0, last: null };
function I18nProbe() {
  const ctx = useI18n();
  useEffect(() => {
    i18nBag.renders += 1;
    i18nBag.last = ctx;
  });
  return null;
}
function AuthProbe() {
  const ctx = useAuth();
  useEffect(() => {
    authBag.renders += 1;
    authBag.last = ctx;
  });
  return null;
}

const coachProfile: Profile = {
  id: "test-coach",
  email: "coach@test.local",
  full_name: "Test Coach",
  phone: null,
  role: "coach",
  coach_kind: "b2b",
  invite_adopted_at: null,
  avatar_url: null,
  referral_code: null,
  is_test_account: false,
  created_at: "2026-01-01T00:00:00Z",
};

describe("W1-4a source pins — memoized values, torn-off pathname, module-scope arrays", () => {
  // ── Auth provider ──────────────────────────────────────────────────────
  it("the auth ctx value is memoized — no inline value object survives", () => {
    const s = authSrc();
    expect(s).toContain("useMemo<AuthCtx>");
    expect(s).toContain("[profile, loading, kind, signUp, signIn, signInGoogle, signOutAsync]");
    expect(s).not.toMatch(/value=\{\{/); // the fresh-object-per-render handoff
  });

  it("AuthProvider itself does NOT subscribe to pathname — the leaf does", () => {
    const s = authSrc();
    // The span ends at the leaf's header comment (which QUOTES the old
    // call in prose) — the provider body itself is what must stay clean.
    const provider = span(s, "export function AuthProvider", "/* ── W1-4a");
    expect(provider).not.toMatch(/usePathname\(\)/);
    // The leaf exists, subscribes, and carries the trigger VERBATIM
    // (Phase 182 engine: gated/OAuth → immediate · session cookie →
    // idle · anonymous → resolved logged-out).
    const leaf = span(s, "function AuthRouteTrigger", "export function useAuth");
    expect(leaf).toContain("usePathname()");
    expect(leaf).toContain("isGatedPath(pathname)");
    // F-3 re-pin (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed
    // 2026-11-07): the returning-user idle cap dropped 2500 → 1200 —
    // the pin follows the text (the trigger engine itself is unchanged).
    expect(leaf).toContain("deferIdle(() => void startAuth(), 1200)");
    expect(leaf).not.toContain("deferIdle(() => void startAuth(), 2500)");
    expect(leaf).toContain("setLoading(false)");
  });

  // ── I18n provider ──────────────────────────────────────────────────────
  it("the i18n ctx value is memoized — identity tracks ONLY lang", () => {
    const s = i18nSrc();
    expect(s).toContain("useMemo<I18nCtx>");
    expect(s).toContain("[lang, setLang, t]");
    expect(s).not.toMatch(/value=\{\{ lang/);
  });

  it("I18nProvider itself does NOT subscribe to pathname — the leaf does", () => {
    const s = i18nSrc();
    const provider = span(s, "export function I18nProvider", "function UrlLocaleSync");
    expect(provider).not.toMatch(/usePathname\(\)/);
    const leaf = span(s, "function UrlLocaleSync", "export function useI18n");
    expect(leaf).toContain("usePathname()");
    // URL-first resolution moved VERBATIM: /ar/* always Arabic; the
    // saved-preference → browser-language → "en" chain for the rest.
    expect(leaf).toContain('pathname === "/ar" || pathname.startsWith("/ar/")');
    expect(leaf).toContain('localStorage.getItem("mhe:lang")');
  });

  // ── SiteHeader ─────────────────────────────────────────────────────────
  it("the navigation definitions live at MODULE scope — no per-render rebuild", () => {
    const s = headerSrc();
    const headerAt = s.indexOf("export function SiteHeader");
    expect(s.indexOf("const DRAWER_GROUP_DEFS")).toBeGreaterThan(-1);
    expect(s.indexOf("const DRAWER_GROUP_DEFS")).toBeLessThan(headerAt);
    expect(s.indexOf("const SERVICE_NAV_DEFS")).toBeGreaterThan(-1);
    expect(s.indexOf("const SERVICE_NAV_DEFS")).toBeLessThan(headerAt);
    // The old imperative build is extinct.
    expect(s).not.toContain("groups.push");
  });

  it("the groups resolve through a useMemo keyed ONLY on lang/role flags — never navigate", () => {
    const s = headerSrc();
    expect(s).toContain(
      "}, [isAr, isLoggedIn, isCoach, isAdmin, isB2BCoach, isSiteCoach]);",
    );
    // Item actions are DATA (nav/evo), resolved at click time by
    // handleItemClick — the arrays never capture `navigate` (whose
    // identity changes with the pathname for the AR-mirror law).
    expect(s).toContain("if (item.nav) navigate(item.nav);");
    expect(s).toContain("else if (item.evo) openEvoFloatingChat();");
    expect(s).not.toContain("onClick: () => navigate(");
  });

  it("the laws the refactor must not lose — role surfaces + admin blog + locale pairs", () => {
    const s = headerSrc();
    // ROLE SURFACE LAW: coaching + funnel entries are nonStaff; EVO is
    // hidden from staff in the AI group.
    expect(s).toMatch(/id: "coaching",[\s\S]{0,200}audience: "nonStaff"/);
    expect(s).toContain("hideForCoach: true");
    // Admin reads the CMS; everyone else the public blog (both locales).
    expect(s).toContain('adminHref: "/admin/blog"');
    expect(s).toContain('hrefAr: "/ar/blog", hrefEn: "/blog"');
  });
});

describe("W1-4a behavior — a faithful SPA navigation in jsdom", () => {
  beforeAll(() => {
    // jsdom ships no matchMedia — the REAL ThemeToggle's use-theme-mode
    // listens to it on mount (mobile-drawer canary precedent).
    if (typeof window.matchMedia !== "function") {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) =>
          ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as unknown as MediaQueryList,
      });
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = "";
    dataLayer.cb = null;
    dataLayer.profile = null;
    dataLayer.seedCalls = 0;
    i18nBag.renders = 0;
    i18nBag.last = null;
    authBag.renders = 0;
    authBag.last = null;
  });

  /** Renders `app` under a pathname provider the test can navigate; the
   * SAME `app` element instance is reused across `navigate` calls so the
   * only thing that changes is the provided path — a real navigation. */
  async function mountAt(path: string, app: ReactNode) {
    const rtl = await import("@testing-library/react");
    const nav = (await import("next/navigation")) as unknown as {
      __PathnameCtx: import("react").Context<string>;
    };
    const Harness = ({ path: p, children }: { path: string; children?: ReactNode }) =>
      createElement(nav.__PathnameCtx.Provider, { value: p }, children);
    const view = rtl.render(createElement(Harness, { path }, app));
    return {
      view,
      navigate: async (next: string) => {
        view.rerender(createElement(Harness, { path: next }, app));
        await rtl.act(async () => {});
      },
    };
  }

  it("i18n: a route change does NOT re-render useI18n consumers — a lang change does", async () => {
    const bag = i18nBag;
    // eslint-disable-next-line react/no-children-prop -- createElement needs children in props (test-only; repo precedent mobile-drawer-a11y.test.tsx)
    const app = createElement(I18nProvider, { urlLocale: "en", children: createElement(I18nProbe) });
    const { navigate, view } = await mountAt("/", app);
    await (await import("@testing-library/react")).act(async () => {});
    // Mount settled: initial render only (lang stays "en" — the leaf's
    // first resolution is a no-op setState).
    const baseline = bag.renders;
    expect(baseline).toBe(1);
    expect(bag.last?.lang).toBe("en");
    expect(bag.last?.dir).toBe("ltr");
    const before = bag.last;

    // PUBLIC → PUBLIC navigation: the provider + consumers stay asleep —
    // same render count, SAME ctx object identity.
    await navigate("/memberships");
    expect(bag.renders).toBe(baseline);
    expect(bag.last).toBe(before);
    await navigate("/foods");
    expect(bag.renders).toBe(baseline);
    expect(bag.last).toBe(before);

    // /ar/* navigation: the language REALLY changes — the memo produces a
    // NEW value and the consumer re-renders exactly once for it.
    await navigate("/ar/memberships");
    expect(bag.renders).toBe(baseline + 1);
    expect(bag.last).not.toBe(before);
    expect(bag.last?.lang).toBe("ar");
    expect(bag.last?.dir).toBe("rtl");
    view.unmount();
  });

  it("auth: route changes do NOT re-render useAuth consumers — a real auth event does", async () => {
    const bag = authBag;
    const app = createElement(AuthProvider, null, createElement(AuthProbe));
    const { navigate, view } = await mountAt("/", app);
    await (await import("@testing-library/react")).act(async () => {});
    // Mount at a public path, anonymous (no session cookie in jsdom):
    // loading resolves false — one extra render for the state flip.
    const baseline = bag.renders;
    expect(baseline).toBe(2);
    expect(bag.last?.loading).toBe(false);
    expect(bag.last?.profile).toBeNull();
    const before = bag.last;

    // PUBLIC → PUBLIC: nothing changes — same renders, same identity.
    await navigate("/foods");
    expect(bag.renders).toBe(baseline);
    expect(bag.last).toBe(before);

    // PUBLIC → GATED (/memberships is in GATED_PREFIXES): startAuth loads
    // the (mocked) layer and subscribes; no profile event fires (holder
    // empty) — the consumer stays asleep.
    await navigate("/memberships");
    expect(bag.renders).toBe(baseline);
    expect(bag.last).toBe(before);
    expect(dataLayer.seedCalls).toBe(1);
    expect(dataLayer.cb).not.toBeNull();

    // A REAL auth event (the live onAuthChange callback): the memo
    // produces a NEW value — exactly one re-render, coach flags flip.
    const rtl = await import("@testing-library/react");
    await rtl.act(async () => {
      dataLayer.cb?.(coachProfile);
    });
    expect(bag.renders).toBe(baseline + 1);
    expect(bag.last).not.toBe(before);
    expect(bag.last?.profile?.id).toBe("test-coach");
    expect(bag.last?.isCoach).toBe(true);
    expect(bag.last?.isB2BCoach).toBe(true);
    view.unmount();
  });

  it("SiteHeader: the nav arrays resolve per lang/role — links flip locale, coach hides the funnel", async () => {
    const { SiteHeader } = await import("@/components/SiteHeader");
    const links = () =>
      Array.from(document.body.querySelectorAll("a[href]")).map((a) =>
        a.getAttribute("href"),
      );
    const bodyText = () => document.body.textContent ?? "";

    // Logged-out visitor at "/": EN links, coaching + EVO visible.
    // eslint-disable-next-line react/no-children-prop -- createElement needs children in props (test-only; repo precedent mobile-drawer-a11y.test.tsx)
    const app = createElement(I18nProvider, {
      urlLocale: "en",
      children: createElement(AuthProvider, null, createElement(SiteHeader)),
    });
    const { navigate, view } = await mountAt("/", app);
    await (await import("@testing-library/react")).act(async () => {});
    expect(links()).toContain("/exercises");
    expect(links()).toContain("/coaching");
    expect(links()).toContain("/evo");
    expect(links()).toContain("/compare");
    expect(bodyText()).toContain("Exercises");

    // Navigation to another public page: the header re-renders (useNav
    // legitimately subscribes to pathname) but the resolved arrays are
    // the memoized ones — links identical, no regression.
    await navigate("/foods");
    expect(links()).toContain("/exercises");
    expect(links()).toContain("/coaching");

    // /ar: the locale flips the SAME definitions — AR hrefs + labels.
    await navigate("/ar");
    expect(links()).toContain("/ar/exercises");
    expect(links()).not.toContain("/exercises");
    expect(bodyText()).toContain("مكتبة التمارين");
    view.unmount();

    // A LOGGED-IN COACH (profile fires through the real provider at a
    // gated path): ROLE SURFACE LAW — the sales-funnel Coaching entry is
    // gone (both surfaces) and the coach console group is present. The
    // DESKTOP EVO link is pre-existing staff-visible behavior (only the
    // drawer's EVO entry rides hideForCoach) — unchanged by this frame.
    dataLayer.profile = coachProfile;
    // eslint-disable-next-line react/no-children-prop -- createElement needs children in props (test-only; repo precedent mobile-drawer-a11y.test.tsx)
    const coachApp = createElement(I18nProvider, {
      urlLocale: "en",
      children: createElement(AuthProvider, null, createElement(SiteHeader)),
    });
    const coach = await mountAt("/memberships", coachApp);
    await (await import("@testing-library/react")).act(async () => {});
    expect(links()).not.toContain("/coaching");
    expect(links()).not.toContain("/ar/coaching");
    expect(bodyText()).toContain("Coach Admin");
    expect(bodyText()).toContain("Coach Dashboard");
    coach.view.unmount();
  });
});
