/**
 * Diet Plan Result Bridge — ORGANIC-GROWTH-P0-C (owner order 2026-11-19
 * «نفّذ البند التالي مباشرة من خطة التنفيذ» — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md).
 *
 * The highest-value conversion path the site owned but never opened
 * (roadmap finding F-4, 07-§3 path C): a calculator result ended in a
 * commercial dead-end — no «what now?» step — while 24 ready-made
 * day-plan cells already exist at /{,ar/}diet-plan/{level}/{system}.
 * This module is the matching brain the two calculators render from:
 *
 *   nearestDietLevel(calories) — SAFE rounding to the nearest published
 *   level (تقريب آمن لأقرب 100/200 سعرة بمستوياتنا الست, per the roadmap):
 *     - invalid input (≤0 / NaN) → null (the bridge renders nothing);
 *     - below 1200 → 1200, above 3000 → 3000 (clamped to the published
 *       matrix — the actual level is always printed on the card/links,
 *       so the match is honest by construction, law §12.50);
 *     - otherwise the level with the minimum |calories − level|;
 *     - an EXACT TIE rounds UP (1350→1500 · 1650→1800 · 2250→2500):
 *       when two published levels are equidistant we never point BELOW
 *       the calculated requirement — the conservative direction for
 *       eating (the roadmap's pinned example: 2050 → the 2000 cells).
 *
 *   dietPlanBridgeLinks(level, isAr) — the four cell links for the
 *   matched level, in the matrix's canonical system order, built from
 *   DIET_LEVELS/DIET_SYSTEMS THEMSELVES (single source of truth: the
 *   same constants the leaf generateStaticParams builds its 24 routes
 *   from — a link can never drift from a real cell). AR anchors follow
 *   the leaf H1 vocabulary («خطة 2000 سعرة — متوازن» mirrors «نظام
 *   غذائي 2000 سعرة — متوازن»); EN anchors follow the EN leaf title
 *   vocabulary ("2000-calorie Balanced plan"). /ar-prefixed hrefs on
 *   the AR tree (SEO-GEO-4 law).
 *
 * The display component is src/components/DietPlanResultBridge.tsx
 * (rendered inside the calculators' result container — value first,
 * law 413). Guarded in src/lib/__tests__/diet-plan-bridge.test.ts and
 * the render proof diet-plan-bridge-render.test.tsx.
 */

import { DIET_LEVELS, DIET_SYSTEMS, type DietLevel } from "./diet-plan-matrix";

/**
 * The published level closest to a calculated calorie target.
 * Returns null for invalid input (render nothing — never a broken
 * section). Ties round UP; boundaries clamp. See the module header.
 */
export function nearestDietLevel(calories: number): DietLevel | null {
  if (!Number.isFinite(calories) || calories <= 0) return null;

  const lowest = DIET_LEVELS[0];
  const highest = DIET_LEVELS[DIET_LEVELS.length - 1];
  if (calories <= lowest) return lowest;
  if (calories >= highest) return highest;

  let best: DietLevel = lowest;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const level of DIET_LEVELS) {
    const distance = Math.abs(calories - level);
    // `<=` on purpose: an exact tie takes the HIGHER level — never
    // below the calculated target when an equal option exists above.
    if (distance <= bestDistance) {
      best = level;
      bestDistance = distance;
    }
  }
  return best;
}

/** One bridge link — href plus the two language anchors. */
export interface DietPlanBridgeLink {
  /** Locale-aware cell URL (EN: /diet-plan/… · AR: /ar/diet-plan/…). */
  href: string;
  /** The matrix system slug (balanced | high-protein | keto | vegetarian). */
  systemSlug: string;
  /** AR anchor — «خطة 2000 سعرة — متوازن» (nameAr from the matrix). */
  labelAr: string;
  /** EN anchor — "2000-calorie Balanced plan" (nameEn from the matrix). */
  labelEn: string;
}

/**
 * The four cell links for a matched level — every system the matrix
 * publishes, in DIET_SYSTEMS order, exactly the four cells the leaf
 * generateStaticParams builds from the same constants.
 */
export function dietPlanBridgeLinks(
  level: DietLevel,
  isAr: boolean,
): DietPlanBridgeLink[] {
  return DIET_SYSTEMS.map((system) => ({
    href: `${isAr ? "/ar" : ""}/diet-plan/${level}/${system.slug}`,
    systemSlug: system.slug,
    labelAr: `خطة ${level} سعرة — ${system.nameAr}`,
    labelEn: `${level}-calorie ${system.nameEn} plan`,
  }));
}
