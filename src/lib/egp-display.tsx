"use client";

/**
 * egp-display — the SITE-WIDE dual-currency display layer
 * (owner order 2026-11-13: «توحيد عرض الأسعار بالدولار والجنيه المصري
 * على مستوى الموقع بالكامل»).
 *
 * WHAT THIS IS:
 *   The single CLIENT-side reader behind every USD + EGP paired price on
 *   public marketing surfaces, checkout, the affiliate page and the coach
 *   app. It reuses the ENTIRE 0104 LOCAL-PAYMENT-EGP machinery — the same
 *   public endpoint (/api/local-prices), the same Supabase rows
 *   (local_prices / local_price_settings / exchange_rate_updates), the
 *   same ExchangeRate-API daily refresh (06:47 UTC) and the same render
 *   law (dualPriceParts in local-prices.ts: USD first, ثم «أو»/or, ثم the
 *   EGP twin). NO parallel conversion system exists: this module holds
 *   ZERO rate math of its own beyond roundEgpCash, and never talks to
 *   ExchangeRate-API directly.
 *
 * USD PRIMACY (owner order, unchanged):
 *   USD stays the priced currency and the ONLY currency actually charged
 *   (PayPal money path untouched — canary 10 in local-payment-egp.test.ts
 *   still pins zero EGP references inside the PayPal files). The EGP twin
 *   is a DISPLAY-ONLY local equivalent — on PayPal surfaces it is
 *   explicitly labeled indicative (checkout shows the note «الدفع الفعلي
 *   عبر PayPal بالدولار الأمريكي»).
 *
 * RESOLUTION LAW (one figure per plan everywhere):
 *   - Buyable plans (the LOCAL_PRICE_PRODUCTS matrix): the exact
 *     local_prices ROW when one is set (manual-mode truth), otherwise the
 *     same stored daily rate × roundEgpCash — exactly what the auto-mode
 *     cron would write. Marketing surfaces therefore never disagree with
 *     the checkout twin.
 *   - The manual-rail transfer box and the 0104 AMOUNT LOCK keep reading
 *     the ROW ONLY (never a computed fallback) — the member transfers and
 *     locks exactly what local_prices carries (unchanged law).
 *   - Any other USD figure (coach packages, ad packages, wallet top-ups,
 *     monthly equivalents): the stored daily rate × roundEgpCash — an
 *     honest illustrative conversion, never a hardcoded literal.
 *
 * FETCH DISCIPLINE:
 *   ONE request per browser page load, shared by every mounted twin via a
 *   module-level singleton (a second component mounting reuses the same
 *   promise; a client-side navigation reuses the cached payload). Failure
 *   or an empty payload means the surfaces render exactly as they did
 *   before this layer existed: USD-only, the never-zero fail-safe law —
 *   nothing is guessed, nothing is zero.
 *
 * SSR/HYDRATION SAFETY:
 *   The hook returns not-ready during server render AND the first client
 *   render (state only changes inside useEffect), so server HTML and the
 *   hydration pass are byte-identical to the pre-twin markup; the twin
 *   appears after the payload arrives. No hydration mismatch by
 *   construction.
 */

import { useEffect, useState } from "react";
import {
  dualPriceParts,
  LOCAL_PRICE_PRODUCTS,
  roundEgpCash,
  type LocalPricesPublicPayload,
} from "@/lib/local-prices";

// ─────────────────────────────────────────────────────────────────────────
// The module-level singleton — one fetch per page load, shared everywhere
// ─────────────────────────────────────────────────────────────────────────

let cachedPayload: LocalPricesPublicPayload | null = null;
let inflight: Promise<LocalPricesPublicPayload | null> | null = null;

function loadLocalPrices(): Promise<LocalPricesPublicPayload | null> {
  if (cachedPayload) return Promise.resolve(cachedPayload);
  if (!inflight) {
    inflight = fetch("/api/local-prices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LocalPricesPublicPayload | null) => {
        if (data) cachedPayload = data;
        return cachedPayload;
      })
      .catch(() => {
        // Fail-safe USD-only for this page load (the never-zero display
        // law); the DB keeps serving the last successful rate everywhere.
        return null;
      });
  }
  return inflight;
}

// ─────────────────────────────────────────────────────────────────────────
// The hook
// ─────────────────────────────────────────────────────────────────────────

export type EgpDisplayContext = {
  /** False until the payload resolves (server render + first client
   *  render included) — twins render nothing while false. */
  ready: boolean;
  /** The last successful USD→EGP rate, or null before the first success. */
  usdToEgp: number | null;
  /** The EXACT local_prices row for a buyable plan — null when unset.
   *  The manual-rail transfer box and the 0104 AMOUNT LOCK read THIS
   *  only (never a computed fallback). */
  rowEgp: (planTier: string, durationMonths: number) => number | null;
  /** The display twin for a buyable plan: the exact row when set,
   *  otherwise the stored rate × the cron's own rounding. */
  planEgp: (planTier: string, durationMonths: number, usd: number) => number | null;
  /** The illustrative twin for any USD figure: stored rate × cash
   *  rounding (coach/ad packages, top-ups, monthly equivalents). */
  egpForUsd: (usd: number) => number | null;
};

export function useEgpDisplay(): EgpDisplayContext {
  // useState(cachedPayload): on a hard load the cache is empty (server
  // HTML = USD-only, first client render matches); on client-side
  // navigation the cache is already warm and twins render instantly.
  const [payload, setPayload] = useState<LocalPricesPublicPayload | null>(cachedPayload);

  useEffect(() => {
    if (cachedPayload) return; // already resolved — no fetch, no churn
    let alive = true;
    loadLocalPrices().then((data) => {
      if (alive && data) setPayload(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const prices = payload?.prices ?? [];
  const usdToEgp = payload?.rate?.usd_to_egp ?? null;

  const rowEgp = (planTier: string, durationMonths: number): number | null => {
    const row = prices.find(
      (p) => p.plan_tier === planTier && p.duration_months === durationMonths,
    );
    return row && Number(row.price_egp) > 0 ? Number(row.price_egp) : null;
  };

  const egpForUsd = (usd: number): number | null =>
    usdToEgp && usdToEgp > 0 ? roundEgpCash(usd, usdToEgp) : null;

  const planEgp = (planTier: string, durationMonths: number, usd: number): number | null =>
    rowEgp(planTier, durationMonths) ?? egpForUsd(usd);

  return {
    ready: payload !== null,
    usdToEgp,
    rowEgp,
    planEgp,
    egpForUsd,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Pure resolution helpers (shared by EgpTwin / EgpPriceText / inline prose)
// ─────────────────────────────────────────────────────────────────────────

/** Epsilon for matching a parsed figure against a buyable product price
 *  (protects "$14.99" vs 14.99 float noise; never matches a foreign
 *  figure). */
const PRODUCT_EPSILON = 0.005;

/** Resolve the twin value for ANY USD figure: a buyable-plan amount maps
 *  to its product resolution (row first — manual-mode truth — then the
 *  stored rate), everything else converts via the stored daily rate. */
export function resolveTwinEgp(amount: number, ctx: EgpDisplayContext): number | null {
  if (!ctx.ready) return null;
  const product = LOCAL_PRICE_PRODUCTS.find(
    (p) => Math.abs(p.usd - amount) < PRODUCT_EPSILON,
  );
  if (product) return ctx.planEgp(product.planTier, product.durationMonths, amount);
  return ctx.egpForUsd(amount);
}

/** The paired suffix for inline prose contexts: " (أو 830 جنيه مصري)" /
 *  " (or 830 EGP)" — "" while not ready or unset (the prose then reads
 *  exactly as it did before this layer existed). */
export function egpPairSuffix(amount: number, ctx: EgpDisplayContext, isAr: boolean): string {
  const value = resolveTwinEgp(amount, ctx);
  if (value === null) return "";
  const parts = dualPriceParts(amount, value, isAr);
  return parts.egp && parts.or ? ` (${parts.or} ${parts.egp})` : "";
}
