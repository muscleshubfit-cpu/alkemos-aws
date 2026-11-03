/**
 * EXERCISES-ENRICHMENT — per-exercise unique editorial layer for the top-50
 * demand exercise pages (SEO-ADSENSE-RECOVERY-PLAN-2026-10-31 · P1-2, owner
 * execution order 2026-11-04 «ابدأ تنفيذ المرحلة P1-2»).
 *
 * WHY: the comprehensive audit (2026-10-31) measured the exercise family at
 * 755-801 visible words of which only ~350-400 are unique content after
 * stripping shared UI chrome — below the plan's G2 gate (≥600 unique words
 * for a 5-exercise sample) and the measured 21.3% same-family 8-gram
 * duplication leaves the family as the site's second template-thin mass
 * after foods (which P1-1 closed at 80/80).
 *
 * WHAT: the TOP 50 exercises BY DEMAND — selected from three documented
 * data sources, never at random (see docs/SEO-P1-2-EXERCISES-DEEPENING-
 * REPORT-2026-11-04.md §2 for the full methodology):
 *   A) GSC-measured impressions (audit §2.3, window 03-30 Oct) — the only
 *      pages with real query demand evidence: tricep-dumbbell-kickback (16),
 *      crunches (9 @ pos 7.4), leg-lift (9), kettlebell-pistol-squat (AR 4
 *      @ pos 6.25), plus index-verified exercise-ball-crunch / press-sit-up
 *      / spider-crawl (audit §2.4);
 *   B) the master plan's own keyword-demand map (SEO-GEO-MASTER-PLAN §5.1:
 *      "best chest exercises for mass" 1K-10K, "home workout no equipment"
 *      1K-10K, "تمارين بطن للمبتدئين" 1K-10K, "تمارين صدر في البيت" 100-1K,
 *      "best dumbbell exercises for triceps" 100-1K …) mapped to the
 *      canonical movement per query cluster;
 *   C) the canonical movement canon every program page references (master
 *      plan §3.1 competitive map vs ExRx/MuscleWiki): the big lifts + the
 *      standard accessory per muscle group.
 *
 * Each enriched exercise carries a genuinely unique bilingual editorial
 * layer (plan P1-2 scope — «نفس بوابة الكاناري» as P1-1):
 *   - intro     (what the movement is, who it fits, what makes it work);
 *   - muscles   (how the primary + secondary muscles actually act in THIS
 *                movement — not a generic anatomy lesson);
 *   - mistakes  (4 real error→fix pairs specific to this movement);
 *   - alternatives (equipment-based swaps that keep the same training
 *                effect);
 *   - progression (how to regress for a beginner / progress for an
 *                advanced trainee);
 *   - programming (sets/reps/rest guidance and where the movement sits in
 *                a training week — standard coaching prescription, no
 *                invented research claims);
 *   - safety    (movement-specific watch-outs + honest contraindication
 *                notes; null where nothing beyond generic advice applies);
 *   - faq       (3-4 genuinely useful Q&As per language);
 *   - links     (verified internal links: live blog articles from
 *                sitemap-blog.xml + real tool/program/exercise routes —
 *                the registry enforcing them lives in the canary test).
 *
 * LAW (plan P1-2): «لا نسخ قالب نصي واحد» — no single text template copied
 * across exercises. Uniqueness is enforced by
 * src/lib/__tests__/exercises-enrichment.test.ts: pairwise 8-gram Jaccard
 * between same-category enriched pages must stay ≤ 0.15, EN and AR.
 *
 * ARABIC LAW (prohibition 176 spirit): the Arabic layer is pure MSA — zero
 * Latin letters in any Arabic text field (test-enforced); digits are fine.
 *
 * NO INVENTED SCIENCE: every number is either (a) the exercise's own data
 * from src/lib/exercises.ts (angles, tempo cues, durations the library
 * already documents), or (b) standard coaching prescription ranges
 * (sets/reps/rest) stated as practice guidance — never attributed to
 * studies, never a research claim, no fabricated citations.
 *
 * NO FAQPage JSON-LD: Google retired FAQ rich results May 2026
 * (src/lib/seo.ts law) — the FAQ layer is user-visible HTML only.
 *
 * SERVER-SAFE: plain data, no imports of the exercise array — consumption:
 *   getExerciseEnrichment(slug) → rendered inside ExerciseDetailClient
 *   (both the EN route and the /ar mirror pass it as a prop).
 *
 * BATCH PROTOCOL: batches 1-5 (2026-11-04) together cover the full 50 —
 * the P1-2 scope. The canary test automatically covers every entry.
 *   batch 1 — the 7 GSC-measured winners + 3 core anchors (10)
 *   batch 2 — chest family + 2 presses (9)
 *   batch 3 — back family + 2 shoulder isolation moves (10)
 *   batch 4 — legs/glutes family (10)
 *   batch 5 — arms + remaining core (11)
 */

import { BATCH_1 } from "@/lib/exercises-enrichment-batch1";
import { BATCH_2 } from "@/lib/exercises-enrichment-batch2";

export type EnrichedFaq = { q: string; a: string };

export type MistakePair = { error: string; fix: string };

export type ExerciseEnrichmentSections = {
  /** How the primary + secondary muscles act in this specific movement. */
  muscles: string;
  /** 4 real mistake→fix pairs specific to this movement. */
  mistakes: MistakePair[];
  /** Equipment-based swaps preserving the training effect. */
  alternatives: string;
  /** Regressions for beginners / progressions for advanced trainees. */
  progression: string;
  /** Sets/reps/rest + placement in a training week (coaching practice). */
  programming: string;
  /** Movement-specific safety + honest contraindications; null if N/A. */
  safety: string | null;
};

/**
 * Verified internal link. hrefEn/hrefAr are FULL paths in their own URL
 * space (blog slugs differ per language — the /ar prefix alone never maps
 * an EN article slug to its AR twin, so both are stored explicitly).
 */
export type EnrichmentLink = {
  hrefEn: string;
  hrefAr: string;
  labelEn: string;
  labelAr: string;
};

export type ExerciseEnrichment = {
  intro: { en: string; ar: string };
  sections: { en: ExerciseEnrichmentSections; ar: ExerciseEnrichmentSections };
  faq: { en: EnrichedFaq[]; ar: EnrichedFaq[] };
  links: EnrichmentLink[];
};

export const EXERCISES_ENRICHMENT: Record<string, ExerciseEnrichment> = {
  ...BATCH_1,
  ...BATCH_2,
};

/** Resolve the enrichment layer for an exercise slug (undefined = none). */
export function getExerciseEnrichment(
  slug: string,
): ExerciseEnrichment | undefined {
  return EXERCISES_ENRICHMENT[slug];
}
