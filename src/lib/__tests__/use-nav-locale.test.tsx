import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { createElement, type ReactNode } from "react";

/**
 * 450 UNIFIED CHOICE LAW — use-nav canary (2026-11-08, report §12:
 * docs/AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07.md).
 *
 * use-nav is the SECOND central consumer of the structural mirror map
 * (after the toggle, before the sync's safety net): every chrome view
 * navigation — the header logo («الرئيسية» → landing), the account
 * buttons, the logout landing — must land a RECORDED-CHOICE holder
 * DIRECTLY in their chosen tree, with no wrong-language render and no
 * post-hydration replace. This is the fix for the boundary conflict
 * the owner's order outlaws: pre-450, an Arabic admin clicking the
 * logo navigated to "/" and the whole site flipped to English.
 *
 * Behavior is driven in jsdom exactly like context-render-storm: a
 * context-backed usePathname + a hoisted stable router mock, so the
 * pushed target of every navigate() call is assertable.
 */

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
}));
vi.mock("next/navigation", async () => {
  const { createContext, useContext } = await import("react");
  const PathnameCtx = createContext<string>("/");
  return {
    __PathnameCtx: PathnameCtx,
    usePathname: () => useContext(PathnameCtx),
    useRouter: () => routerMock,
  };
});

import { useNav } from "@/hooks/use-nav";

function NavProbe({ onNavigate }: { onNavigate: (fn: ReturnType<typeof useNav>["navigate"]) => void }) {
  const { navigate } = useNav();
  onNavigate(navigate);
  return null;
}

describe("450 use-nav — the recorded choice governs every public view target", () => {
  beforeAll(() => {
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
    document.cookie = "mhe:lang=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
  });

  /** Mounts the probe under a pathname provider and hands back the live
   * navigate() plus the harness rerender for path changes. */
  async function mountNav(path: string) {
    const rtl = await import("@testing-library/react");
    const nav = (await import("next/navigation")) as unknown as {
      __PathnameCtx: import("react").Context<string>;
    };
    let navigate: ReturnType<typeof useNav>["navigate"] | null = null;
    const holder = (fn: ReturnType<typeof useNav>["navigate"]) => {
      navigate = fn;
    };
    const Harness = ({ path: p }: { path: string; children?: ReactNode }) =>
      createElement(nav.__PathnameCtx.Provider, { value: p }, createElement(NavProbe, { onNavigate: holder }));
    const app = createElement(Harness, { path });
    const view = rtl.render(app);
    await rtl.act(async () => {});
    return {
      navigate: () => navigate!,
      rerender: async (next: string) => {
        view.rerender(createElement(Harness, { path: next }));
        await rtl.act(async () => {});
      },
      view,
    };
  }

  it("the logo from an ARABIC-CHOICE admin session lands on /ar — no EN render first", async () => {
    document.cookie = "mhe:lang=ar; path=/";
    const { navigate, view } = await mountNav("/admin/dashboard");
    navigate()("landing");
    expect(routerMock.push).toHaveBeenCalledWith("/ar");
    expect(routerMock.push).not.toHaveBeenCalledWith("/");
    view.unmount();
  });

  it("every public view target follows the choice — memberships/blog/about/faq/contact/privacy/terms", async () => {
    document.cookie = "mhe:lang=ar; path=/";
    const { navigate, view } = await mountNav("/admin/clients");
    for (const [v, expected] of [
      ["memberships", "/ar/memberships"],
      ["blog", "/ar/blog"],
      ["about", "/ar/about"],
      ["faq", "/ar/faq"],
      ["contact", "/ar/contact"],
      ["privacy", "/ar/privacy"],
      ["terms", "/ar/terms"],
    ] as const) {
      routerMock.push.mockClear();
      navigate()(v);
      expect(routerMock.push, `view ${v}`).toHaveBeenCalledWith(expected);
    }
    view.unmount();
  });

  it("the EN direction holds — an EN-choice user on /ar lands on the EN tree", async () => {
    document.cookie = "mhe:lang=en; path=/";
    const { navigate, view } = await mountNav("/ar/memberships");
    navigate()("landing");
    expect(routerMock.push).toHaveBeenCalledWith("/");
    routerMock.push.mockClear();
    navigate()("memberships");
    expect(routerMock.push).toHaveBeenCalledWith("/memberships");
    view.unmount();
  });

  it("SPECIAL view targets pass through untouched (no language dimension)", async () => {
    document.cookie = "mhe:lang=ar; path=/";
    const { navigate, view } = await mountNav("/admin/dashboard");
    navigate()("auth", { mode: "login" });
    expect(routerMock.push).toHaveBeenCalledWith("/auth?mode=login");
    routerMock.push.mockClear();
    navigate()("checkout", { tier: "coaching", months: "3" });
    expect(routerMock.push).toHaveBeenCalledWith("/checkout?tier=coaching&months=3");
    routerMock.push.mockClear();
    navigate()("dashboard");
    expect(routerMock.push).toHaveBeenCalledWith("/dashboard");
    view.unmount();
  });

  it("a CHOICE-LESS visitor on /ar keeps the 449 URL-based remap (F-2-A verbatim)", async () => {
    const { navigate, view } = await mountNav("/ar/memberships");
    navigate()("landing");
    expect(routerMock.push).toHaveBeenCalledWith("/ar");
    routerMock.push.mockClear();
    navigate()("memberships");
    expect(routerMock.push).toHaveBeenCalledWith("/ar/memberships");
    view.unmount();
  });

  it("a CHOICE-LESS visitor on an EN URL gets the plain EN target (no remap)", async () => {
    const { navigate, view } = await mountNav("/memberships");
    navigate()("landing");
    expect(routerMock.push).toHaveBeenCalledWith("/");
    view.unmount();
  });

  it("the legacy localStorage-only choice is honored (the cookie backfill source)", async () => {
    window.localStorage.setItem("mhe:lang", "ar");
    const { navigate, view } = await mountNav("/admin/dashboard");
    navigate()("landing");
    expect(routerMock.push).toHaveBeenCalledWith("/ar");
    view.unmount();
  });
});
