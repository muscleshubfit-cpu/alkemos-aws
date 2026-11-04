/**
 * local-prices — EGP pricing for the Egyptian manual payment rails
 * (InstaPay / Vodafone Cash). Owner order 2026-11-05 (LOCAL-PAYMENT-EGP).
 *
 * WHAT THIS IS:
 *   The USD price stays the one and only priced currency on every PayPal
 *   surface (GLOBAL USD LAW — migration 0038; resolvePlanPrice in
 *   paypal.ts is untouched and remains the PayPal authority). This module
 *   adds the LOCAL, display-only Egyptian pound twin for the two manual
 *   rails, where the member actually transfers EGP:
 *
 *     $14.99  أو  830 جنيه مصري        (Arabic surface)
 *     $14.99  or  830 EGP              (English surface)
 *
 *   USD is ALWAYS shown first (owner order: «الدولار أولًا ثم أو ثم
 *   الجنيه»), the EGP twin appears ONLY when a local_prices row exists
 *   for the plan — unset means USD-only (never zero, never a guessed
 *   value, never a stale hard-coded conversion).
 *
 * SOURCES (no invented numbers anywhere):
 *   - USD prices: memberships.ts (premium/pro/coaching) + plans.ts
 *     (legacy starter/elite) — the same files resolvePlanPrice reads.
 *     A canary test pins this module's matrix to resolvePlanPrice's
 *     output for every product×duration (equality without touching it).
 *   - USD→EGP rate: the `exchange_rate_updates` table (latest SUCCESS
 *     row), refreshed once daily by GET /api/cron/exchange-rate
 *     (06:47 UTC, owner-fixed time — deliberately not midnight and off
 *     the existing cron grid) from ExchangeRate-API v6
 *     (EXCHANGERATE_API_KEY, server-side only, never in code/DB/browser/
 *     logs). One API request per UTC day, enforced by the rate_date
 *     unique row — a second server or a re-fire the same day is a no-op.
 *
 * MODES (local_price_settings, single row id=1):
 *   - auto (default): the daily job recomputes EVERY local_prices row
 *     from the stored rate × the USD source. Admins never touch it.
 *   - manual (fallback): the daily job still fetches and stores the
 *     rate but NEVER overwrites the rows — an admin edit flips the
 *     mode to manual automatically so tomorrow's run cannot clobber
 *     the hand-set value. One click ("back to auto") recomputes all
 *     rows from the STORED rate (no extra API call — the one-a-day law
 *     holds) and returns the mode to auto.
 *
 * AMOUNT LOCK (owner order: the member pays what they SAW):
 *   the EGP figure shown on checkout is snapshotted into
 *   subscription_requests.price_egp at request-creation time. Later
 *   rate changes or mode flips never rewrite old rows; the admin
 *   review card shows the locked twin. Existing subscriptions are a
 *   different table (subscriptions) and are not touched at all.
 *
 * FAILURE POSTURE (fail-safe, never fail-zero):
 *   API failure / quota exhausted / invalid key → today's row is
 *   recorded with status='failure', the LAST SUCCESSFUL rate keeps
 *   serving everywhere, prices are NOT recomputed, and the admin gets
 *   a bell notification carrying the last-success date. Recovery =
 *   the next day's run (documented in the governing report).
 */

import { MEMBERSHIPS } from "@/lib/memberships";
import { getTier, type TierId } from "@/lib/plans";

// ─────────────────────────────────────────────────────────────────────────
// The product matrix — every buyable plan × duration /checkout serves
// ─────────────────────────────────────────────────────────────────────────

/** One buyable product at checkout. `usd` is DERIVED from the price
 *  sources (never a literal here) so the matrix can never drift from
 *  what PayPal charges. */
export type LocalPriceProduct = {
  planTier: string;
  durationMonths: 1 | 12;
  usd: number;
  nameAr: string;
  nameEn: string;
};

/** The full matrix, derived once at module load from the SAME price
 *  files resolvePlanPrice reads (memberships.ts + plans.ts). Free is
 *  not buyable at checkout, so it has no row. */
export const LOCAL_PRICE_PRODUCTS: readonly LocalPriceProduct[] = [
  ...MEMBERSHIPS.filter((m) => m.id === "premium" || m.id === "pro" || m.id === "coaching").flatMap(
    (m) => {
      const rows: LocalPriceProduct[] = [];
      if (m.priceMonthly && m.priceMonthly > 0) {
        rows.push({
          planTier: m.id,
          durationMonths: 1,
          usd: m.priceMonthly,
          nameAr: m.nameAr,
          nameEn: m.nameEn,
        });
      }
      if (m.priceYearly && m.priceYearly > 0) {
        rows.push({
          planTier: m.id,
          durationMonths: 12,
          usd: m.priceYearly,
          nameAr: m.nameAr,
          nameEn: m.nameEn,
        });
      }
      return rows;
    },
  ),
  // Legacy /coaching products (owner decree 0046 — PayPal-tied prices):
  // Starter $20/mo · $200/yr, Elite $40/mo · $400/yr.
  ...(["starter", "elite"] as const).flatMap((id) => {
    const legacy = getTier(id as TierId);
    if (!legacy) return [];
    return ([1, 12] as const)
      .filter((months) => typeof legacy.prices[months] === "number")
      .map((months) => ({
        planTier: id,
        durationMonths: months,
        usd: legacy.prices[months],
        nameAr: id === "starter" ? "ستارتر" : "إيليت",
        nameEn: id === "starter" ? "Starter" : "Elite",
      }));
  }),
];

// ─────────────────────────────────────────────────────────────────────────
// Rounding — cash-friendly EGP
// ─────────────────────────────────────────────────────────────────────────

/** EGP amounts are rounded to the nearest 5 pounds (owner order
 *  «تقريب معقول»): Vodafone Cash / InstaPay transfers in 5-pound
 *  multiples are the Egyptian cash convention, and a whole-pound price
 *  would leave cents-equivalent noise (830.01) on a transfer rail.
 *  Manual mode can always set an exact value by hand. */
export const EGP_ROUNDING_STEP = 5;

export function roundEgpCash(usd: number, usdToEgp: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(usdToEgp) || usd <= 0 || usdToEgp <= 0) {
    return 0;
  }
  return Math.round((usd * usdToEgp) / EGP_ROUNDING_STEP) * EGP_ROUNDING_STEP;
}

/** Every row the AUTO mode maintains — all products × durations. */
export type ComputedLocalPrice = LocalPriceProduct & { priceEgp: number };

export function computeAutoLocalPrices(usdToEgp: number): ComputedLocalPrice[] {
  return LOCAL_PRICE_PRODUCTS.map((p) => ({
    ...p,
    priceEgp: roundEgpCash(p.usd, usdToEgp),
  })).filter((p) => p.priceEgp > 0);
}

// ─────────────────────────────────────────────────────────────────────────
// Dual-price display — USD first, «أو»/or, EGP twin
// ─────────────────────────────────────────────────────────────────────────

export type DualPriceParts = {
  /** Latin-digit USD string, e.g. "$14.99" (currency stays Latin by the
   *  format-locale law). */
  usd: string;
  /** "أو" / "or" — null when there is no EGP twin (unset → USD-only). */
  or: string | null;
  /** "830 جنيه مصري" / "830 EGP" — null when unset/zero/invalid. */
  egp: string | null;
};

/** Build the paired display parts. USD ALWAYS renders; the EGP twin
 *  renders ONLY for a positive finite value (unset rows, zeros and
 *  garbage never reach the member — the fail-safe display law). */
export function dualPriceParts(
  usd: number,
  egp: number | null | undefined,
  isAr: boolean,
): DualPriceParts {
  const usdText = `$${usd}`;
  const egpValue =
    typeof egp === "number" && Number.isFinite(egp) && egp > 0 ? Math.round(egp) : null;
  if (egpValue === null) {
    return { usd: usdText, or: null, egp: null };
  }
  const egpNumber = egpValue.toLocaleString("en-US");
  return {
    usd: usdText,
    or: isAr ? "أو" : "or",
    egp: isAr ? `${egpNumber} جنيه مصري` : `${egpNumber} EGP`,
  };
}

/** Single-string form (toasts, admin notification bodies, tests).
 *  Bidi note: in RTL the Latin USD run sits rightmost, then أو, then
 *  the EGP tail — reading order is exactly the owner's example
 *  «$14.99 أو 830 جنيه مصري». */
export function dualPriceString(usd: number, egp: number | null | undefined, isAr: boolean): string {
  const parts = dualPriceParts(usd, egp, isAr);
  return parts.egp === null ? parts.usd : `${parts.usd} ${parts.or} ${parts.egp}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Public API of the public read endpoint /api/local-prices
// ─────────────────────────────────────────────────────────────────────────

export type LocalPricesPublicPayload = {
  prices: { plan_tier: string; duration_months: number; price_egp: number }[];
  mode: "auto" | "manual";
  rate: { usd_to_egp: number; rate_date: string; fetched_at: string } | null;
  /** "auto" | "manual" per-row provenance is not needed client-side. */
  scheduledUpdateUtc: string;
};

/** The fixed daily slot (documentation surface — see the crontab line
 *  in deploy/crontab-alkemos). Off-the-hour and clear of the existing
 *  03:47 / 05:30 / 05:45 / 06:00 / 06:10 / 06:30 UTC grid; ExchangeRate
 *  -API publishes its daily rate at 00:00:01 UTC, so 06:47 UTC always
 *  reads the fresh value; a missed fire costs at most one day and the
 *  next run catches up (benign-by-design law). */
export const EXCHANGE_RATE_CRON_UTC = "47 6 * * *";
export const EXCHANGE_RATE_UPDATE_TIME_UTC = "06:47 UTC daily";
