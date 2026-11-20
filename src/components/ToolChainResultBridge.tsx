"use client";

import Link from "next/link";
import {
  bmiChainBridge,
  bodyFatChainBridge,
  type ChainBridgeLink,
} from "@/lib/tool-chain-bridge";

/**
 * ToolChainResultBridge — ORGANIC-GROWTH-P1-D (owner order 2026-11-20
 * «نفّذ البند التالي مباشرة من خطة التنفيذ» — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md).
 *
 * «جسور السلسلة»: the BMI and body-fat results end at their own numbers
 * while the site owns the exact next step each number begs for. This
 * card opens that path — after the result (value first, law 413):
 *
 *   - BMI → the calorie calculator (ONE bridge: the segment only picks
 *     the message — the calculator serves every goal, lose/maintain/gain);
 *   - body-fat → the macro calculator (the lean mass the visitor just
 *     measured needs its protein grams) + a QUIET coaching line (the
 *     service link renders as a faint contextual text link — the
 *     P0-E/P1-B commercial-zone precedent — because the memberships CTA
 *     stays the tool page's single commercial CTA, law 07-§4.2).
 *
 * Laws this component obeys:
 *   - RESULT-GATED by design: the BMI message depends on the visitor's
 *     own number, so the card renders inside the calculators' FIRST
 *     `{result && (` container (the P0-A split signature keeps its two
 *     gates — the memberships CTA stays between them, untouched).
 *   - SINGLE SOURCE: the segment logic, copy and links come from
 *     src/lib/tool-chain-bridge.ts. Nothing is re-derived here.
 *   - HONESTY (§12.50): every claim is a capability the destination
 *     page actually has; no quota or price claims.
 *   - GA4-READY CLICKS (the diet_plan_bridge_click precedent, P0-C): a
 *     lightweight gtag/dataLayer event — window.gtag when the GA script
 *     is live, dataLayer fallback, NEVER a UX breaker, zero PII.
 *   - lang PROP (the RecipeSuggestStrip/DietPlanResultBridge precedent
 *     — the bilingual tool pages own the locale via their
 *     urlLocale-resolved isAr).
 */

export function ToolChainResultBridge({
  source,
  lang,
  bmi,
}: {
  /** Which calculator fired — picks the chain and the analytics source. */
  source: "bmi-calculator" | "body-fat-calculator";
  /** The page's locale — resolves hrefs and copy. */
  lang: "ar" | "en";
  /** The BMI result — required (and validated) on the BMI source only. */
  bmi?: number;
}) {
  const isAr = lang === "ar";
  const model =
    source === "bmi-calculator"
      ? bmi === undefined
        ? null
        : bmiChainBridge(bmi, isAr)
      : bodyFatChainBridge(isAr);
  if (!model) return null;

  // The DietPlanResultBridge precedent: dependency-free, GA4-ready event
  // push — safe in SSR and on mobile; never includes PII; never breaks UX.
  const trackClick = (link: ChainBridgeLink) => {
    try {
      const w = window as unknown as {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
      };
      const payload = { calculator: source, destination: link.destination, lang };
      if (typeof w.gtag === "function") {
        w.gtag("event", "tool_chain_bridge_click", payload);
      } else if (Array.isArray(w.dataLayer)) {
        w.dataLayer.push({ event: "tool_chain_bridge_click", ...payload });
      }
    } catch {
      /* analytics must NEVER break navigation */
    }
  };

  return (
    <section
      aria-label={isAr ? "الخطوة التالية بعد نتيجتك" : "Your next step after the result"}
      className="rounded-3xl bg-[var(--tint)] p-6 md:p-8"
    >
      <h3 className="text-lg font-semibold tracking-tight">
        {isAr ? model.titleAr : model.titleEn}
      </h3>
      <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
        {isAr ? model.subAr : model.subEn}
      </p>

      {/* The free-tool links — pill buttons (the P0-C bridge recipe). */}
      {model.toolLinks.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {model.toolLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => trackClick(link)}
              className="block rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? link.labelAr : link.labelEn}
            </Link>
          ))}
        </div>
      )}

      {/* The service links — ONE faint contextual line (the P0-E/P1-B
          commercial-zone quiet-link recipe; the memberships CTA stays
          the tool page's single commercial CTA, law 07-§4.2). */}
      {model.serviceLinks.length > 0 && (
        <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
          {isAr ? model.serviceLeadAr : model.serviceLeadEn}{" "}
          {model.serviceLinks.map((link, i) => (
            <span key={link.href}>
              {i > 0 ? " · " : ""}
              <Link
                href={link.href}
                onClick={() => trackClick(link)}
                className="font-medium underline underline-offset-4 hover:text-[var(--text)]"
              >
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </section>
  );
}
