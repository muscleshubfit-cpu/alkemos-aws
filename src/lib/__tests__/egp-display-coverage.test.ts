import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { dualPriceParts } from "@/lib/local-prices";
import { resolveTwinEgp, egpPairSuffix, type EgpDisplayContext } from "@/lib/egp-display";

/**
 * EGP-DISPLAY canaries (owner order 2026-11-13 — «توحيد عرض الأسعار
 * بالدولار والجنيه المصري على مستوى الموقع بالكامل، بما فيها PayPal»).
 * Each verification item of the order, pinned so the regression class can
 * never silently return:
 *
 *  1. ONE MECHANISM, NO PARALLEL SYSTEM — the client layer reads ONLY the
 *     0104 endpoint /api/local-prices and reuses roundEgpCash/dualPriceParts
 *     from local-prices.ts; ExchangeRate-API is referenced NOWHERE outside
 *     the cron route (the daily 06:47 UTC job keeps being the only fetcher).
 *  2. FORMAT SINGLE-SOURCE — dualPriceParts stays the one and only paired
 *     formatter (USD first, ثم «أو»/or, ثم the EGP twin): both new modules
 *     import it; neither invents its own wording.
 *  3. COVERAGE — every price-bearing surface carries the twin layer:
 *     landing, memberships (the shared AR/EN client page), coaching (the
 *     shared AR/EN client page), checkout, about (StaticPageView), compare
 *     (EN + AR server pages), affiliate, coach client/ads/wallet views.
 *  4. PAYPAL ISOLATION (extends local-payment-egp canary 10 to the new
 *     layer) — the PayPal money-path files import NOTHING from egp-display
 *     / EgpTwin / local-prices; the charge currency stays USD-only.
 *  5. AMOUNT LOCK + ROW-ONLY MANUAL RAILS — localPriceEgp derives from
 *     egp.rowEgp (the exact local_prices row, never a computed fallback),
 *     the submit still snapshots `price_egp: localPriceEgp`, and the Total
 *     row computes the indicative twin ONLY on the PayPal branch
 *     (`localPriceEgp ?? egp.egpForUsd`), never on the manual rails.
 *  6. THE PAYPAL NOTE — the PayPal-side twin is labeled indicative on the
 *     surface (AR + EN note strings under the Total row).
 *  7. RESOLUTION LAW (pure functions) — not-ready → null (USD-only,
 *     fail-safe); buyable-plan figures map to the product resolution
 *     (row first); foreign figures convert via the stored rate; the prose
 *     suffix follows the owner's exact paired format.
 *  8. MACHINE SURFACES STAY USD-ONLY (deliberate exceptions) — schema.org
 *     JSON-LD offers, meta descriptions and the llms.txt feeds carry ONE
 *     payable currency (USD) and no EGP twins: priceCurrency must describe
 *     what PayPal actually charges, and build-time text must not freeze a
 *     daily rate. Documented in docs/DUAL-CURRENCY-DISPLAY-2026-11-13.md.
 *  9. HYDRATION SAFETY — the hook changes state only inside useEffect
 *     (server HTML and the first client render are USD-only, byte-equal
 *     to the pre-twin markup; no hydration mismatch by construction).
 */

const repo = (...parts: string[]) => path.join(process.cwd(), ...parts);
const read = (...parts: string[]) => readFileSync(repo(...parts), "utf8");

const BOOTSTRAP_RATE = 55.3706; // the live-measured 0104 seed rate

// A stub context mirroring a resolved payload (rows as seeded in 0104).
function ctxWith(overrides: Partial<EgpDisplayContext> = {}): EgpDisplayContext {
  const rows: Record<string, number> = {
    "premium:1": 830,
    "premium:12": 6590,
    "pro:1": 1660,
    "coaching:1": 2215,
  };
  const egpForUsd = (usd: number) =>
    usd > 0 ? Math.round((usd * BOOTSTRAP_RATE) / 5) * 5 : 0;
  return {
    ready: true,
    usdToEgp: BOOTSTRAP_RATE,
    rowEgp: (tier, months) => rows[`${tier}:${months}`] ?? null,
    planEgp: (tier, months, usd) => rows[`${tier}:${months}`] ?? egpForUsd(usd),
    egpForUsd,
    ...overrides,
  };
}

describe("EGP-DISPLAY (2026-11-13) — the nine canaries", () => {
  // ── 1. One mechanism, no parallel system ──
  it("1a. the client layer fetches ONLY /api/local-prices (the 0104 endpoint)", () => {
    const lib = read("src/lib/egp-display.tsx");
    expect(lib).toContain('fetch("/api/local-prices"');
    // No other URL is fetched anywhere in the layer.
    const fetches = lib.match(/fetch\(([^)]+)\)/g) ?? [];
    expect(fetches.length).toBe(1);
    // No direct ExchangeRate-API call — the daily cron stays the only fetcher.
    expect(lib).not.toContain("exchangerate-api.com");
  });

  it("1b. ExchangeRate-API is referenced ONLY by the cron route in shipped src", () => {
    const shipped = ["src/app/api/cron/exchange-rate/route.ts"];
    const offenders = [
      "src/lib/egp-display.tsx",
      "src/components/egp/EgpTwin.tsx",
      "src/app/api/local-prices/route.ts",
    ];
    for (const f of offenders) {
      expect(read(f), `${f} must stay fetcher-free`).not.toContain("exchangerate-api.com");
    }
    expect(read(shipped[0])).toContain("exchangerate-api.com");
  });

  it("1c. the rounding + format come from local-prices.ts (no parallel math)", () => {
    const lib = read("src/lib/egp-display.tsx");
    expect(lib).toContain("roundEgpCash");
    expect(lib).toMatch(/from "@\/lib\/local-prices"/);
    const twin = read("src/components/egp/EgpTwin.tsx");
    expect(twin).toMatch(/from "@\/lib\/local-prices"/);
  });

  // ── 2. Format single-source ──
  it("2. dualPriceParts is the only paired formatter — both modules import it, neither hand-builds the wording", () => {
    const lib = read("src/lib/egp-display.tsx");
    const twin = read("src/components/egp/EgpTwin.tsx");
    expect(lib).toContain("dualPriceParts");
    expect(twin).toContain("dualPriceParts");
    // The wording literals live in local-prices.ts alone (checked against
    // the module under test — a hand-built copy would carry them here).
    expect(twin).not.toMatch(/جنيه مصري"/);
    expect(lib).not.toMatch(/جنيه مصري"/);
  });

  // ── 3. Coverage — every price-bearing surface carries the layer ──
  it("3. every price surface mounts the twin layer (EGP-DISPLAY marker law)", () => {
    const surfaces = [
      "src/components/views/LandingView.tsx",
      "src/app/(en)/memberships/page.tsx", // the shared AR/EN client page
      "src/app/(en)/coaching/page.tsx", // the shared AR/EN client page
      "src/components/views/CheckoutView.tsx",
      "src/components/views/StaticPageView.tsx", // about (+ privacy/terms carry no prices)
      "src/app/(en)/compare/[slug]/page.tsx",
      "src/app/(ar)/ar/compare/[slug]/page.tsx",
      "src/components/views/AffiliateProgramView.tsx",
      "src/components/views/CoachClientView.tsx",
      "src/components/views/CoachAdsView.tsx",
      "src/components/views/CoachWalletView.tsx",
    ];
    for (const f of surfaces) {
      const src = read(f);
      expect(src, `${f} must mount the EGP twin layer`).toContain("EGP-DISPLAY");
      expect(src, `${f} must import the shared twin component`).toMatch(
        /from "@\/components\/egp\/EgpTwin"/,
      );
    }
    // The AR memberships/coaching mirrors re-export the EN pages — one edit
    // covers both languages (the bilingual law).
    expect(read("src/app/(ar)/ar/memberships/page.tsx")).toContain(
      'import MembershipsPage from "@/app/(en)/memberships/page"',
    );
    expect(read("src/app/(ar)/ar/coaching/page.tsx")).toContain(
      'export { default } from "@/app/(en)/coaching/page"',
    );
  });

  // ── 4. PayPal isolation (the new layer extends the 0104 canary 10) ──
  it("4. the PayPal money path imports NOTHING from the EGP display layer (USD-only charge law)", () => {
    const paypalFiles = [
      "src/lib/paypal.ts",
      "src/app/api/paypal/create-order/route.ts",
      "src/app/api/paypal/capture-order/route.ts",
      "src/app/api/paypal/webhook/route.ts",
    ];
    const forbidden = /egp-display|EgpTwin|local-prices|dualPrice/i;
    for (const f of paypalFiles) {
      const src = read(f);
      expect(src, `${f} must stay free of the display layer`).not.toMatch(forbidden);
    }
  });

  // ── 5. Amount lock + row-only manual rails ──
  it("5. localPriceEgp is ROW-ONLY; the manual rails never render a computed twin; the lock still snapshots it", () => {
    const checkout = read("src/components/views/CheckoutView.tsx");
    // ROW-ONLY derivation (the exact local_prices figure — never computed).
    expect(checkout).toContain("const localPriceEgp = egp.rowEgp(");
    // The 0104 AMOUNT LOCK still submits exactly the displayed row figure.
    expect(checkout).toContain("price_egp: localPriceEgp");
    expect(checkout).toContain("0104 AMOUNT LOCK");
    // The Total row computes the fallback ONLY on the PayPal branch —
    // manual rails keep `localPriceEgp` bare (isManualMethod ternary).
    expect(checkout).toMatch(
      /isManualMethod\s*\?\s*localPriceEgp\s*:\s*\(localPriceEgp \?\? egp\.egpForUsd\(plan\.price\)\)/,
    );
    // The manual-rail transfer box stays row-gated (never a computed figure).
    expect(checkout).toContain("{localPriceEgp !== null &&");
    expect(checkout).toContain("Amount to transfer");
  });

  // ── 6. The PayPal-side twin is labeled indicative ──
  it("6. the PayPal selection carries the indicative note in BOTH languages", () => {
    const checkout = read("src/components/views/CheckoutView.tsx");
    expect(checkout).toContain("الدفع الفعلي عبر PayPal بالدولار الأمريكي");
    expect(checkout).toContain("PayPal charges in USD");
    expect(checkout).toContain('method === "paypal"');
  });

  // ── 7. Resolution law (pure functions, stubbed context) ──
  it("7a. not-ready → null (USD-only fail-safe; nothing guessed, nothing zero)", () => {
    const notReady = ctxWith({ ready: false, usdToEgp: null, egpForUsd: () => null });
    expect(resolveTwinEgp(14.99, notReady)).toBeNull();
    expect(egpPairSuffix(14.99, notReady, true)).toBe("");
    expect(egpPairSuffix(14.99, notReady, false)).toBe("");
  });

  it("7b. buyable-plan figures map to the product resolution (row first, computed fallback)", () => {
    const ctx = ctxWith();
    // $14.99 IS the premium monthly product → the exact row (830).
    expect(resolveTwinEgp(14.99, ctx)).toBe(830);
    // Row missing (manual deletion) → the same stored rate the cron uses.
    const noRow = ctxWith({
      rowEgp: () => null,
      planEgp: (_t, _m, usd) => Math.round((usd * BOOTSTRAP_RATE) / 5) * 5,
    });
    expect(resolveTwinEgp(14.99, noRow)).toBe(830);
  });

  it("7c. foreign figures convert via the stored daily rate (coach/ad packages, equivalents)", () => {
    const ctx = ctxWith();
    // $6 coach package → 6 × 55.3706 = 332.2 → 330 (nearest-5 cash law).
    expect(resolveTwinEgp(6, ctx)).toBe(330);
    // $119.88 yearly saving is NOT a price — but if asked, it converts.
    expect(resolveTwinEgp(119.88, ctx)).toBe(6640);
  });

  it("7d. the prose suffix follows the owner's exact paired format", () => {
    const ctx = ctxWith();
    expect(egpPairSuffix(14.99, ctx, true)).toBe(" (أو 830 جنيه مصري)");
    expect(egpPairSuffix(14.99, ctx, false)).toBe(" (or 830 EGP)");
    // dualPriceParts stays the formatter (the suffix derives from it).
    expect(dualPriceParts(14.99, 830, true).egp).toBe("830 جنيه مصري");
  });

  // ── 8. Machine surfaces stay USD-only (deliberate, documented) ──
  it("8. schema.org offers, meta descriptions and llms feeds carry NO EGP twins (single payable currency)", () => {
    const machineSurfaces = [
      "src/lib/seo.ts",
      "src/lib/tool-schema.ts",
      "src/app/(en)/memberships/layout.tsx",
      "src/app/(ar)/ar/memberships/page.tsx", // AR meta + OfferCatalog JSON-LD
      "src/app/(en)/coaching/layout.tsx",
      "src/app/llms-full.txt/route.ts",
      "public/llms.txt",
    ];
    for (const f of machineSurfaces) {
      const src = read(f);
      expect(src, `${f} stays USD-only (documented exception)`).not.toContain("جنيه");
      expect(src, `${f} stays USD-only (documented exception)`).not.toContain("EGP");
      expect(src, `${f} must not mount the twin layer`).not.toContain("EgpTwin");
    }
  });

  // ── 9. Hydration safety ──
  it("9. the hook mutates state ONLY inside useEffect (server HTML = first client render)", () => {
    const lib = read("src/lib/egp-display.tsx");
    // No synchronous state initializer that could diverge from SSR on a
    // hard load: the initial state reads the module cache (empty on a
    // fresh page), and every later change rides the effect.
    expect(lib).toContain("useState<LocalPricesPublicPayload | null>(cachedPayload)");
    const effectStart = lib.indexOf("useEffect(() => {");
    const setState = lib.indexOf("setPayload(data)");
    expect(effectStart).toBeGreaterThan(-1);
    expect(setState).toBeGreaterThan(effectStart);
    // The payload never arrives synchronously in render scope (no direct
    // loadLocalPrices() call between the effect's end and the return).
    const effectEnd = lib.indexOf("}, []);", effectStart);
    const renderScope = lib.slice(effectEnd, lib.indexOf("return {", effectEnd));
    expect(effectEnd).toBeGreaterThan(effectStart);
    expect(renderScope).not.toContain("loadLocalPrices()");
  });
});
