"use client";

/**
 * EgpTwin / EgpPriceText — the two render shapes of the site-wide
 * USD + EGP dual-price display (owner order 2026-11-13; the client layer
 * is src/lib/egp-display.tsx — read its header for the resolution law).
 *
 * EgpTwin:
 *   The paired twin for a KNOWN USD figure: «أو 830 جنيه مصري» /
 *   «or 830 EGP», rendered after/below the USD price. Pass planTier +
 *   durationMonths when the figure IS a buyable plan (row-exact twin);
 *   omit them for any other figure (coach/ad packages, top-ups, monthly
 *   equivalents — converted from the stored daily rate). Renders NULL
 *   until the daily payload arrives and whenever no positive twin
 *   resolves: the surface then reads exactly as it did before (USD-only,
 *   the never-zero fail-safe law).
 *
 * EgpPriceText:
 *   The twin carrier for STRINGS with embedded price figures ("$14.99/mo
 *   or $119/yr", "1 month $6 — 3 months $16"): each parsed amount gains a
 *   muted "(أو 830 جنيه مصري)" suffix. Buyable-plan amounts are
 *   product-mapped automatically (row first); foreign figures convert via
 *   the stored rate. Plain text until the payload arrives — server HTML
 *   and the hydration pass are byte-identical to the pre-twin markup.
 *
 * FORMAT LAW: both shapes build their text from dualPriceParts in
 * src/lib/local-prices.ts — the one and only place the paired format is
 * defined (USD first, ثم «أو»/or, ثم the EGP twin, Latin digits, «جنيه
 * مصري» in Modern Standard Arabic). No component invents its own wording.
 */

import { useEgpDisplay, resolveTwinEgp } from "@/lib/egp-display";
import { dualPriceParts } from "@/lib/local-prices";
import type { CSSProperties } from "react";

export function EgpTwin({
  usd,
  planTier,
  durationMonths,
  isAr,
  className,
  style,
  block = false,
  paren = false,
}: {
  /** The USD figure already rendered beside this twin. */
  usd: number;
  /** When the figure is a buyable plan: the exact local_prices row wins. */
  planTier?: string;
  durationMonths?: number;
  isAr: boolean;
  className?: string;
  /** Inline style (muted palette colors vary per surface). */
  style?: CSSProperties;
  /** Render as its own line (display:block) — pricing cards. */
  block?: boolean;
  /** Wrap in parentheses — inline prose contexts. */
  paren?: boolean;
}) {
  const ctx = useEgpDisplay();
  if (!ctx.ready) return null;

  const value = planTier
    ? ctx.planEgp(planTier, durationMonths ?? 1, usd)
    : resolveTwinEgp(usd, ctx);
  if (value === null) return null;

  const parts = dualPriceParts(usd, value, isAr);
  if (!parts.or || !parts.egp) return null;

  const text = `${parts.or} ${parts.egp}`;
  return (
    <span
      className={[block ? "block" : "inline", className].filter(Boolean).join(" ")}
      style={style}
      // The twin is a conversion hint, not a separate price: screen
      // readers should read it right after the USD figure it follows.
      aria-label={isAr ? `أو ما يعادله ${parts.egp}` : `equivalent ${parts.egp}`}
    >
      {paren ? `(${text})` : text}
    </span>
  );
}

/** Split pattern for price figures inside a string: "$14.99", "$119",
 *  "$6,590" AND the Arabic-order "14.99$", "6$" (both orders ship in the
 *  repo's own copy). Global — used with String.split ONLY (the segment
 *  test below is a separate anchored regex, no lastIndex pitfalls). */
const PRICE_IN_TEXT_SPLIT = /(\$[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\$)/g;
/** Anchored per-segment test (mirrors the split pattern). */
const PRICE_IN_TEXT_TEST = /^(\$[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\$)$/;
/** Epsilon for matching a parsed figure against a buyable product price
 *  (mirrors egp-display.ts). */
const PRODUCT_EPSILON = 0.005;

export function EgpPriceText({
  text,
  isAr,
  twinClassName,
  onlyAmounts,
}: {
  /** The full string as shipped today — figures are parsed, never edited. */
  text: string;
  isAr: boolean;
  /** Optional extra classes for each twin suffix span. */
  twinClassName?: string;
  /** When set, ONLY these figures (± epsilon) gain twins — for prose that
   *  mixes plan PRICES with non-price money figures (commissions, savings,
   *  thresholds): the prices twin, the rest stays pure USD. */
  onlyAmounts?: number[];
}) {
  const ctx = useEgpDisplay();
  const segments = text.split(PRICE_IN_TEXT_SPLIT);

  if (!ctx.ready || segments.length === 1) {
    // Not ready (or no figures at all): the exact pre-twin string.
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((segment, i) => {
        if (!segment) return null;
        if (!PRICE_IN_TEXT_TEST.test(segment)) return <span key={i}>{segment}</span>;
        const amount = Number.parseFloat(segment.replace(/[$,]/g, ""));
        const allowed =
          !onlyAmounts || onlyAmounts.some((a) => Math.abs(a - amount) < PRODUCT_EPSILON);
        const value = allowed ? resolveTwinEgp(amount, ctx) : null;
        const parts = value === null ? null : dualPriceParts(amount, value, isAr);
        return (
          <span key={i}>
            {segment}
            {parts?.or && parts?.egp ? (
              <span className={twinClassName}>
                {" "}
                ({parts.or} {parts.egp})
              </span>
            ) : null}
          </span>
        );
      })}
    </>
  );
}
