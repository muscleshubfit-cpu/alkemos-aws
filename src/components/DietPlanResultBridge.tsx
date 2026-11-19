"use client";

import Link from "next/link";
import {
  nearestDietLevel,
  dietPlanBridgeLinks,
} from "@/lib/diet-plan-bridge";

/**
 * DietPlanResultBridge — ORGANIC-GROWTH-P0-C (owner order 2026-11-19
 * «نفّذ البند التالي مباشرة من خطة التنفيذ» — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md).
 *
 * «نتيجتك → خطتك الجاهزة»: the result block of the calorie and macro
 * calculators ends in a commercial dead-end (F-4) while the site owns
 * 24 ready-made day-plan cells; this card opens that path — after the
 * result (value first, law 413) it offers the four cells at the level
 * nearest the visitor's number, in the roadmap's «خطة يوم كاملة
 * بسعراتك» style.
 *
 * Laws this component obeys:
 *   - RESULT-GATED by design: the links depend on the visitor's own
 *     number, so the card renders inside the calculators' FIRST
 *     `{result && (` container (the P0-A split signature keeps its two
 *     gates — the memberships CTA stays between them, untouched).
 *   - SINGLE SOURCE: the level math and the four links come from
 *     src/lib/diet-plan-bridge.ts, which builds them from
 *     DIET_LEVELS/DIET_SYSTEMS — the same constants the 24 leaf pages
 *     generate their routes from. Nothing is re-derived here.
 *   - HONESTY (§12.50 + the roadmap's legal acceptance text): the
 *     sub-line prints the actual matched level, and the note states
 *     that the plans are published at fixed levels (1200–3000) with
 *     each plan's final grams/calories shown on the plan's own page —
 *     the numbers always come from the source.
 *   - GA4-READY CLICKS (roadmap verification «نقرات داخلية تُرصد بـGA4
 *     بعد التفعيل»): a lightweight gtag/dataLayer event on click —
 *     the CopyButton precedent (window.gtag when the GA script is
 *     live, dataLayer fallback, NEVER a UX breaker, zero PII).
 *   - lang PROP (the RecipeSuggestStrip precedent — the bilingual tool
 *     pages own the locale via their urlLocale-resolved isAr).
 */

export function DietPlanResultBridge({
  calories,
  lang,
  source,
}: {
  /** The visitor's calculated calorie number (target / input). */
  calories: number;
  /** The page's locale — resolves hrefs and copy. */
  lang: "ar" | "en";
  /** Which calculator fired — the analytics dimension. */
  source: "calorie-calculator" | "macro-calculator";
}) {
  const isAr = lang === "ar";
  const level = nearestDietLevel(calories);
  if (!level) return null;
  const links = dietPlanBridgeLinks(level, isAr);

  // The CopyButton precedent: dependency-free, GA4-ready event push —
  // safe in SSR and on mobile; never includes PII; never breaks UX.
  const trackClick = (systemSlug: string) => {
    try {
      const w = window as unknown as {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
      };
      const payload = { calculator: source, level, system: systemSlug, lang };
      if (typeof w.gtag === "function") {
        w.gtag("event", "diet_plan_bridge_click", payload);
      } else if (Array.isArray(w.dataLayer)) {
        w.dataLayer.push({ event: "diet_plan_bridge_click", ...payload });
      }
    } catch {
      /* analytics must NEVER break navigation */
    }
  };

  return (
    <section
      aria-label={isAr ? "خطط جاهزة بسعراتك" : "Ready-made plans at your calories"}
      className="rounded-3xl bg-[var(--tint)] p-6 md:p-8"
    >
      <h3 className="text-lg font-semibold tracking-tight">
        {isAr ? "خطة يوم كاملة بسعراتك" : "A full day plan at your calories"}
      </h3>
      <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
        {isAr
          ? `أقرب مستوى منشور لنتيجتك: ${level} سعرة في اليوم.`
          : `The nearest published level to your result: ${level} calories a day.`}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => trackClick(link.systemSlug)}
            className="block rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
          >
            {isAr ? link.labelAr : link.labelEn}
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
        {isAr
          ? "الخطط الجاهزة تُنشر بمستويات ثابتة (1200–3000 سعرة) ويُقرَّب رقمك إلى أقرب مستوى منشور؛ أرقام كل خطة النهائية بالغرامات والسعرات تُعرض من صفحة الخطة نفسها."
          : "The ready-made plans are published at fixed levels (1200–3000 calories) and your number is rounded to the nearest published level; each plan's final grams and calories are shown on the plan's own page."}
      </p>
    </section>
  );
}
