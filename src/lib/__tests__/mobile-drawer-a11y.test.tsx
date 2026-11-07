import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";

/**
 * PHASE 336 — W1-3d (remediation plan §6.2, audit A-02): the header's
 * mobile drawer — the site-wide navigation surface — was closed and
 * aria-hidden yet every link inside stayed TAB-REACHABLE (WCAG 2.4.3),
 * the hamburger exposed no expanded state (aria-expanded/aria-controls),
 * and focus could wander to the page behind the aria-modal panel.
 *
 * The A-02 gaps this canary pins as CLOSED:
 *   - the closed drawer is INERT (`inert={!open}`) — out of the tab
 *     order, the a11y tree, and pointer events in one declaration;
 *     aria-hidden stays as the redundant belt (the exit animation —
 *     opacity + translate, never display:none — is exactly why the
 *     drawer stays mounted; conditional render would kill the slide-out);
 *   - the hamburger is an expanded-state control: aria-expanded flips and
 *     aria-controls points at the real dialog panel;
 *   - Tab is TRAPPED inside the open drawer (first↔last wrap, the same
 *     law the Radix FocusScope enforces on the W1-3a/b/c modals) and
 *     focus lands on the PANEL on open and RESTORES to the hamburger on
 *     close (Escape · backdrop · X — every path).
 *
 * Two layers, like the W1-3a/b/c canaries:
 *   1. SOURCE PINS — the drawer's contract is machine-checked in the
 *      source (inert at close · expanded-state hamburger · trap + restore
 *      wiring · the pre-existing dialog semantics that must not regress).
 *   2. BEHAVIOR — jsdom renders the REAL SiteHeader (auth/nav/theme-img
 *      mocked at the seam, the logged-out visitor) and drives the drawer
 *      exactly the way a keyboard user would.
 */

// F-2 Option A (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07, owner decision
// 2026-11-07): usePathname is a MUTABLE seam so the AR case mounts the
// provider the way a real /ar page does — urlLocale "ar" under an /ar
// path. The legacy localStorage ("mhe:lang") override is gone from the
// provider, so a saved preference no longer flips the language.
const navState = vi.hoisted(() => ({ pathname: null as string | null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => navState.pathname,
}));

// next/image would need the image loader — the helmet MARK renders through
// a plain img stub (the seo-image-dimensions canary owns the real
// <ThemeImg> width/height contract at the source level).
vi.mock("@/components/ThemeImg", () => ({
  ThemeImg: ({ alt }: { alt?: string }) =>
    createElement("img", { alt: alt ?? "" }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    profile: null,
    loading: false,
    isCoach: false,
    isAdmin: false,
    coachKind: null,
    isSiteCoach: false,
    isB2BCoach: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInGoogle: vi.fn(),
    signOutAsync: vi.fn(),
  }),
}));

import { I18nProvider } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";

const repoRoot = resolve(__dirname, "../../..");
const headerSrc = () =>
  readFileSync(resolve(repoRoot, "src/components/SiteHeader.tsx"), "utf8");

async function renderHeader(locale: "en" | "ar" = "en") {
  const rtl = await import("@testing-library/react");
  const view = rtl.render(
    // eslint-disable-next-line react/no-children-prop -- createElement needs children in props (test-only; repo precedent evo-drawer-a11y.test.tsx)
    createElement(I18nProvider, {
      urlLocale: locale,
      children: createElement(SiteHeader),
    })
  );
  return { view, fireEvent: rtl.fireEvent };
}

const menuButton = () =>
  document.body.querySelector('button[aria-label="Open menu"]');
const drawerPanel = () => document.getElementById("site-mobile-drawer");

/** The SAME focusable query the trap uses — the test never hardcodes which
 * menu item is first/last (group contents are role-dependent and evolve). */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

describe("W1-3d source pins — inert drawer, expanded-state trigger, trapped focus", () => {
  it("the closed drawer is INERT — the A-02 fix, literally", () => {
    const s = headerSrc();
    expect(s).toContain("inert={!open}");
    // The AT-hide belt stays (pre-existing behavior, redundant safety for
    // engines without inert support) — both keyed to the same `open` state.
    expect(s).toMatch(/aria-hidden=\{!open\}/);
  });

  it("the hamburger is an expanded-state control — aria-expanded + aria-controls at the panel", () => {
    const s = headerSrc();
    expect(s).toContain("aria-expanded={open}");
    expect(s).toContain('aria-controls="site-mobile-drawer"');
    // …and the target of that control really is the dialog panel.
    expect(s).toMatch(/<aside[^>]*id="site-mobile-drawer"/);
  });

  it("the dialog semantics must not regress — role=dialog + aria-modal + the named panel", () => {
    const s = headerSrc();
    expect(s).toMatch(/<aside[^>]*role="dialog"/);
    expect(s).toMatch(/<aside[^>]*aria-modal="true"/);
    expect(s).toContain('aria-label={isAr ? "القائمة الرئيسية" : "Main menu"}');
  });

  it("Tab is trapped — the keydown handler owns Escape AND the Tab wrap", () => {
    const s = headerSrc();
    expect(s).toContain('if (e.key === "Escape")');
    expect(s).toContain('if (e.key !== "Tab") return;');
    // The wrap: first↔last via the focusable query, both directions.
    expect(s).toMatch(/e\.shiftKey && \(active === first \|\| outside\)/);
    expect(s).toMatch(/!e\.shiftKey && \(active === last \|\| outside\)/);
    expect(s).toContain("focusables");
  });

  it("the focus lifecycle — panel in on open, hamburger back on close", () => {
    const s = headerSrc();
    expect(s).toContain("drawerPanelRef.current?.focus({ preventScroll: true })");
    expect(s).toContain("menuButtonRef.current?.focus({ preventScroll: true })");
    // The panel is the focus target itself — the named-dialog pattern.
    expect(s).toMatch(/<aside[^>]*tabIndex=\{-1\}/);
  });

  it("the drawer stays MOUNTED for the exit animation — no conditional render", () => {
    const s = headerSrc();
    // The plan chose inert over conditional rendering precisely to keep
    // the slide-out; a `{open && <div…}` unmount would kill it (and the
    // restore target would be gone before cleanup could focus it).
    expect(s).not.toMatch(/\{open && \(\s*<div/);
  });
});

describe("W1-3d behavior — the real header in jsdom", () => {
  beforeAll(() => {
    // jsdom ships no matchMedia — the REAL ThemeToggle's use-theme-mode
    // listens to it on mount. Polyfill it (rather than stubbing the toggle
    // away) so the canary keeps rendering the real header at full fidelity.
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
    navState.pathname = null;
  });

  it("the hamburger: aria-expanded flips on open and aria-controls resolves to the dialog", async () => {
    const { view, fireEvent } = await renderHeader();
    const btn = menuButton() as HTMLElement;
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-controls")).toBe("site-mobile-drawer");
    // The controlled element exists and IS the role=dialog panel.
    const panel = drawerPanel();
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("role")).toBe("dialog");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    view.unmount();
  });

  it("the closed drawer is inert; opening removes it", async () => {
    const { view, fireEvent } = await renderHeader();
    const panel = drawerPanel() as HTMLElement;
    // React 19 renders inert as a boolean attribute on the subtree root.
    const shell = panel.parentElement as HTMLElement;
    expect(shell.hasAttribute("inert")).toBe(true);
    fireEvent.click(menuButton() as HTMLElement);
    expect(shell.hasAttribute("inert")).toBe(false);
    view.unmount();
  });

  it("focus lands ON the dialog panel when the drawer opens", async () => {
    const { view, fireEvent } = await renderHeader();
    fireEvent.click(menuButton() as HTMLElement);
    expect(document.activeElement).toBe(drawerPanel());
    view.unmount();
  });

  it("Tab on the last item wraps to the first (the trap)", async () => {
    const { view, fireEvent } = await renderHeader();
    fireEvent.click(menuButton() as HTMLElement);
    const panel = drawerPanel() as HTMLElement;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    expect(focusables.length).toBeGreaterThan(1);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    last.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    view.unmount();
  });

  it("Shift+Tab on the first item wraps to the last (the trap, backwards)", async () => {
    const { view, fireEvent } = await renderHeader();
    fireEvent.click(menuButton() as HTMLElement);
    const panel = drawerPanel() as HTMLElement;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    view.unmount();
  });

  it("focus OUTSIDE the open drawer is pulled back in on Tab (escape-proof while open)", async () => {
    const { view, fireEvent } = await renderHeader();
    fireEvent.click(menuButton() as HTMLElement);
    const panel = drawerPanel() as HTMLElement;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    // Simulate focus stranded outside the panel — the hamburger itself is
    // a real focusable outside the trap (jsdom's body is not focusable).
    (menuButton() as HTMLElement).focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(focusables[0]);
    view.unmount();
  });

  it("Escape closes — and focus RESTORES to the hamburger", async () => {
    const { view, fireEvent } = await renderHeader();
    const btn = menuButton() as HTMLElement;
    fireEvent.click(btn);
    expect(drawerPanel()).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(btn);
    view.unmount();
  });

  it("the X button closes — one click, focus restored", async () => {
    const { view, fireEvent } = await renderHeader();
    const btn = menuButton() as HTMLElement;
    fireEvent.click(btn);
    const close = drawerPanel()?.querySelector(
      'button[aria-label="Close menu"]'
    ) as HTMLElement;
    expect(close).not.toBeNull();
    fireEvent.click(close);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(btn);
    view.unmount();
  });

  it("the backdrop closes — and the drawer goes inert again", async () => {
    const { view, fireEvent } = await renderHeader();
    const btn = menuButton() as HTMLElement;
    fireEvent.click(btn);
    const panel = drawerPanel() as HTMLElement;
    const shell = panel.parentElement as HTMLElement;
    const backdrop = shell.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(shell.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(btn);
    view.unmount();
  });

  it("the open/close names are localized (EN then AR)", async () => {
    const en = await renderHeader();
    expect(
      document.body.querySelector('button[aria-label="Open menu"]')
    ).not.toBeNull();
    expect(
      drawerPanel()?.querySelector('button[aria-label="Close menu"]')
    ).not.toBeNull();
    en.view.unmount();

    // F-2-A: Arabic now renders the URL-correct way — urlLocale "ar"
    // under an /ar path (the saved-preference override is gone).
    navState.pathname = "/ar";
    const ar = await renderHeader("ar");
    expect(
      document.body.querySelector('button[aria-label="فتح القائمة"]')
    ).not.toBeNull();
    expect(
      drawerPanel()?.querySelector('button[aria-label="إغلاق القائمة"]')
    ).not.toBeNull();
    ar.view.unmount();
  });
});
