import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextRequest } from "next/server";

/**
 * MOBILE-DRAWER + KETO RANKING battery (owner order items 2 + the keto
 * correction's «التبديل اليدوي» surface, 2026-10-25).
 *
 * THE MEASURED DEFECT the drawer section pins (owner report: «أصلح التمرير
 * واللمس والارتفاع وتداخل الحاويات في درج اختيار الأصناف، بحيث يمكن تصفح
 * المكتبة كاملة واختيار أي نتيجة على الهاتف، وليس الأصناف الظاهرة
 * فقط»): the food picker was a 256px-wide × 288px-tall Radix Popover
 * anchored INSIDE the meal table's overflow-x-auto wrapper INSIDE the plan
 * modal's own scroll region — clipped/overlapping containers on phones,
 * unreliable touch scrolling (scroll chaining), and «المزيد من المكتبة…»
 * unreachable below the fold. The phone surface is now a PORTAL bottom
 * sheet: fixed to the viewport (no clipping ancestor), 85dvh ceiling, a
 * dedicated min-h-0/overscroll-contain scroll region, 44px touch rows,
 * and load-more INSIDE the scrollable list.
 *
 * Two layers (the repo's drawer-canary pattern — mobile-drawer-a11y):
 *   1. SOURCE PINS — the sheet's structural contract machine-checked in
 *      the CoachClientView source (jsdom cannot measure real touch
 *      scrolling; the structure is what guarantees it).
 *   2. BEHAVIOR — the useMediaQuery hook flips the surface, and
 *      /api/food-search ranks keto-safe rows first under ?diet=keto (the
 *      manual-swap surface of the keto dairy law).
 */

const repoRoot = resolve(__dirname, "../../..");
const coachViewSrc = () =>
  readFileSync(resolve(repoRoot, "src/components/views/CoachClientView.tsx"), "utf8");
const hookSrc = () =>
  readFileSync(resolve(repoRoot, "src/hooks/use-media-query.ts"), "utf8");

/* ──────────────────────────────────────────────────────────────────────── */
/* 1 — SOURCE PINS: the bottom-sheet drawer's structural contract         */
/* ──────────────────────────────────────────────────────────────────────── */

describe("MOBILE-DRAWER 1 — the food picker's phone surface (source pins)", () => {
  it("the sheet exists: a Radix Dialog portal renders when the viewport is phone-width", () => {
    const src = coachViewSrc();
    expect(src).toContain("useMediaQuery(\"(max-width: 639px)\")");
    expect(src).toContain("if (isMobile) {");
    expect(src).toContain("<Dialog");
    expect(src).toContain("<DialogContent");
  });

  it("the sheet is pinned to the viewport bottom — NO clipping ancestor can trap it (تداخل الحاويات)", () => {
    const src = coachViewSrc();
    expect(src).toContain("bottom-0");
    expect(src).toContain("top-auto");
    expect(src).toContain("max-h-[85dvh]");
    expect(src).toContain("rounded-t-2xl");
  });

  it("the sheet's list is a DEDICATED scroll region with scroll containment (التمرير)", () => {
    const src = coachViewSrc();
    expect(src).toContain("min-h-0 flex-1 overflow-y-auto overscroll-contain");
    expect(src).toContain("WebkitOverflowScrolling");
  });

  it("the rows and load-more are TOUCH targets (اللمس) — ≥44px, inside the scroll region", () => {
    const src = coachViewSrc();
    expect(src).toContain("min-h-11");
    // The mobile rows opt OUT of the desktop combobox's mousedown-guard
    // (focus preservation) — touch taps must not be preventDefault-ed:
    expect(src).toContain("onMouseDown={opts?.touch ? undefined : (e) => e.preventDefault()}");
    // Load-more inside the sheet's scroll region (a 44px target too):
    expect(src).toMatch(/min-h-11 w-full items-center justify-center[\s\S]{0,420}المزيد من المكتبة/);
  });

  it("the sheet keeps dialog semantics: an accessible name + a labeled close (a11y parity with the W1-3 law)", () => {
    const src = coachViewSrc();
    expect(src).toContain("<DialogTitle className=\"sr-only\">");
    expect(src).toContain("aria-label={isAr ? \"إغلاق\" : \"Close\"}");
  });

  it("closing the sheet without a pick commits the typed text (the desktop blur law, preserved)", () => {
    const src = coachViewSrc();
    expect(src).toContain("onRename(mealIdx, itemIdx, query.trim())");
  });

  it("the sheet input is 16px (text-base) — iOS never zooms the viewport on focus", () => {
    const src = coachViewSrc();
    expect(src).toContain("className=\"h-10 flex-1 text-base\"");
  });

  it("the desktop popover combobox is UNCHANGED for wide screens (no regression to the W1-4c surface)", () => {
    const src = coachViewSrc();
    expect(src).toContain("max-h-72 w-64 overflow-y-auto p-1");
    expect(src).toContain("onOpenAutoFocus={(e) => e.preventDefault()}");
    expect(src).toContain("onBlur={() => onRename(mealIdx, itemIdx, query.trim())}");
  });

  it("the owning plan's diet rides the library search (?diet=keto) — the keto drawer", () => {
    const src = coachViewSrc();
    expect(src).toContain("diet={planDietType}");
    expect(src).toContain("dietParam = diet === \"keto\" ? \"&diet=keto\" : \"\"");
    // The keto badge on demoted rows (both surfaces):
    expect(src).toContain("r.ketoOk === false");
    expect(src).toContain("غير كيتو");
  });

  it("the useMediaQuery hook is SSR-safe (no window access before mount)", () => {
    const src = hookSrc();
    expect(src).toContain("typeof window === \"undefined\"");
    expect(src).toContain("useState(false)");
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2 — BEHAVIOR: the media-query hook                                     */
/* ──────────────────────────────────────────────────────────────────────── */

describe("MOBILE-DRAWER 2 — useMediaQuery flips the phone surface", () => {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  beforeAll(() => {
    // jsdom has no matchMedia by default — a minimal controllable fake.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
      removeEventListener: () => {},
      addListener: (cb: (e: { matches: boolean }) => void) => listeners.push(cb),
      removeListener: () => {},
    }));
  });

  it("starts false (SSR/hydration safe) then tracks the live match", async () => {
    const { render, act } = await import("@testing-library/react");
    const { createElement } = await import("react");
    const { useMediaQuery } = await import("@/hooks/use-media-query");
    const Probe = () => createElement("div", { "data-testid": "v" }, String(useMediaQuery("(max-width: 639px)")));
    const view = render(createElement(Probe));
    expect(view.getByTestId("v").textContent).toBe("false"); // pre-mount default
    await act(async () => {
      view.rerender(createElement(Probe));
    });
    // matchMedia({matches:false}) → still false:
    expect(view.getByTestId("v").textContent).toBe("false");
    // The live match flips:
    await act(async () => {
      for (const cb of listeners) cb({ matches: true });
    });
    expect(view.getByTestId("v").textContent).toBe("true");
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3 — BEHAVIOR: /api/food-search ?diet=keto (التبديل اليدوي surface)      */
/* ──────────────────────────────────────────────────────────────────────── */

/** Minimal NextRequest shape the route actually reads: request.url. */
function req(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

async function search(pathAndQuery: string) {
  const mod = await import("@/app/api/food-search/route");
  const res = await mod.GET(req("http://localhost" + pathAndQuery));
  return (await res.json()) as {
    results: Array<{ name: string; source: string; ketoOk?: boolean }>;
    totalLocal: number;
  };
}

describe("MOBILE-DRAWER 3 — /api/food-search ?diet=keto ranking (the keto dairy law in the manual drawer)", () => {
  beforeEach(() => {
    // Kill the outbound Open Food Facts half (offline-test stub — the
    // local-library half is the law under test).
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline-test")));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("under ?diet=keto, keto-safe dairy rows (cheese) rank ABOVE regular/flavored yogurt rows", async () => {
    const body = await search("/api/food-search?q=" + encodeURIComponent("زبادي") + "&lang=ar&limit=30&diet=keto");
    expect(body.results.length).toBeGreaterThan(0);
    // Every keto-safe row precedes every demoted row:
    let seenDemoted = false;
    for (const r of body.results) {
      if (r.ketoOk === false) {
        seenDemoted = true;
      } else {
        expect(seenDemoted).toBe(false); // safe rows never AFTER a demoted row
      }
    }
    // The demoted class is PRESENT (visible, flagged — never hidden):
    expect(body.results.some((r) => r.ketoOk === false)).toBe(true);
    // The LIBRARY's real rows: plain REGULAR yogurt (طبيعي) is demoted —
    // the class law; PLAIN Greek (يوناني سادة) rides the exception and
    // stays SAFE; every FLAVORED Greek row (بالفراولة/بالفانيليا/بالفواكه)
    // is demoted as SWEETENED dairy.
    const plainRegular = body.results.find((r) => r.name.includes("زبادي طبيعي"));
    if (plainRegular) expect(plainRegular.ketoOk).toBe(false);
    const FLAVORED = /بالفراولة|بالفانيليا|بالفواكه|بالفاكهة/;
    for (const r of body.results.filter((x) => x.name.includes("يوناني"))) {
      if (FLAVORED.test(r.name)) {
        expect(r.ketoOk).toBe(false); // flavored Greek ≠ the unsweetened exception
      } else {
        expect(r.ketoOk).toBe(true); // زبادي يوناني سادة — the exception, carb-governed
      }
    }
  });

  it("a milk query under keto: rows carry ketoOk:false and sink below keto-safe matches; UNSWEETENED plant milks stay safe", async () => {
    const body = await search("/api/food-search?q=" + encodeURIComponent("حليب") + "&lang=ar&limit=30&diet=keto");
    expect(body.results.some((r) => r.ketoOk === false)).toBe(true);
    // The library's REAL rows: regular milk demoted, unsweetened soy/almond
    // SAFE, SWEETENED plant milk demoted («حليب اللوز المحلى» is a sugar
    // drink — the sweetened check precedes the plant guard).
    const plain = body.results.find((r) => /^حليب \(|^حليب جاموسي|^حليب بالشوكولاتة/.test(r.name));
    if (plain) expect(plain.ketoOk).toBe(false);
    const soy = body.results.find((r) => r.name.includes("حليب الصويا"));
    if (soy) expect(soy.ketoOk).toBe(true);
    const unsweetAlmond = body.results.find((r) => r.name.includes("حليب اللوز غير المحلى"));
    if (unsweetAlmond) expect(unsweetAlmond.ketoOk).toBe(true);
    const sweetenedPlant = body.results.find((r) => r.name.includes("المحلى"));
    if (sweetenedPlant) expect(sweetenedPlant.ketoOk).toBe(false);
    // Ranking invariant:
    let seenDemoted = false;
    for (const r of body.results) {
      if (r.ketoOk === false) seenDemoted = true;
      else expect(seenDemoted).toBe(false);
    }
  });

  it("WITHOUT ?diet=keto the historical contract is unchanged (no ketoOk field, no demotion)", async () => {
    const body = await search("/api/food-search?q=" + encodeURIComponent("زبادي") + "&lang=ar&limit=30");
    for (const r of body.results) {
      expect(r.ketoOk).toBeUndefined();
    }
    expect(body.results.length).toBeGreaterThan(0);
  });
});
