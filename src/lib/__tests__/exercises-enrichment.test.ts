import { describe, it, expect } from "vitest";
import { EXERCISES } from "@/lib/exercises";
import {
  EXERCISES_ENRICHMENT,
  getExerciseEnrichment,
  type ExerciseEnrichment,
} from "@/lib/exercises-enrichment";
import { SITEMAP_LASTMOD } from "@/lib/sitemap-lastmod";

/**
 * P1-2 canaries (SEO-ADSENSE-RECOVERY-PLAN-2026-10-31, owner execution
 * order 2026-11-04) — the invariants the exercise-enrichment batches ship
 * against the plan's G2 acceptance gate, mirroring the P1-1 foods canary:
 *
 *   - every enriched slug is a real exercise in the 868-row library;
 *   - coverage: exactly the batch protocol count (batches 1-5 → 50);
 *   - unique-content depth ≥ 600 words per exercise per language
 *     (plan P1-2 scope: "600-800 كلمة فريدة");
 *   - template-duplication guard: pairwise 8-gram Jaccard between
 *     same-category enriched pages ≤ 0.15, EN and AR («لا نسخ قالب نصي
 *     واحد» — plan law; the audit measured the exercise family at 21.3%);
 *   - Arabic purity (prohibition 176 spirit): zero Latin letters in every
 *     Arabic text field — intro, sections, mistakes, FAQ, link labels;
 *   - shape: exactly 4 mistake→fix pairs + ≥3 FAQ Q&As per language,
 *     2-3 verified internal links;
 *   - link registry: every href must resolve to a REAL live route —
 *     blog articles verified against the live sitemap-blog.xml snapshot
 *     (136 URLs, fetched 2026-11-04), tools/programs against
 *     sitemap-pages.xml, exercise links against the library itself;
 *   - the exercises family lastmod anchor carries the ship date
 *     (truthful-recency protocol in sitemap-lastmod.ts).
 */

/** Batch protocol coverage — grows to 50 when all five batches land. */
const EXPECTED_COVERED = 20;

const words = (s: string) =>
  s.replace(/[\u200f\u200e]/g, "").split(/\s+/).filter(Boolean).length;

function sectionWords(e: ExerciseEnrichment, lang: "en" | "ar") {
  const sec = e.sections[lang];
  return (
    words(e.intro[lang]) +
    words(sec.muscles) +
    sec.mistakes.reduce((n, m) => n + words(m.error) + words(m.fix), 0) +
    words(sec.alternatives) +
    words(sec.progression) +
    words(sec.programming) +
    (sec.safety ? words(sec.safety) : 0) +
    e.faq[lang].reduce((n, f) => n + words(f.q) + words(f.a), 0)
  );
}

/** 8-word shingles (the audit's measured duplication methodology). */
function grams(text: string, n = 8): Set<string> {
  const toks = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= toks.length; i++) {
    out.add(toks.slice(i, i + n).join(" "));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  return inter / (a.size + b.size - inter);
}

const fullText = (e: ExerciseEnrichment, lang: "en" | "ar") => {
  const sec = e.sections[lang];
  return [
    e.intro[lang],
    sec.muscles,
    ...sec.mistakes.flatMap((m) => [m.error, m.fix]),
    sec.alternatives,
    sec.progression,
    sec.programming,
    ...(sec.safety ? [sec.safety] : []),
    ...e.faq[lang].flatMap((f) => [f.q, f.a]),
  ].join(" ");
};

/** Every Arabic text field in one string (purity + CJD/corruption scan). */
const allArabicText = (e: ExerciseEnrichment) => {
  const sec = e.sections.ar;
  return [
    e.intro.ar,
    sec.muscles,
    ...sec.mistakes.flatMap((m) => [m.error, m.fix]),
    sec.alternatives,
    sec.progression,
    sec.programming,
    ...(sec.safety ? [sec.safety] : []),
    ...e.faq.ar.flatMap((f) => [f.q, f.a]),
    ...e.links.map((l) => l.labelAr),
  ].join(" ");
};

/**
 * LIVE-ROUTE REGISTRY (snapshot 2026-11-04 — alkemos.com sitemap-blog.xml
 * + sitemap-pages.xml; blog slugs verified live, tools/programs from the
 * pages sitemap). Blog article slugs differ per language, so EN and AR
 * lists are separate.
 */
const LIVE_EN_BLOG = new Set([
  "12-week-dumbbell-band-muscle-plan", "12-week-periodized-muscle-building-plan", "12-week-progressive-overload-home-workout", "12-week-progressive-overload-intermediate", "4-day-split-hypertrophy-fat-loss", "4-day-upper-lower-hypertrophy-split", "4-week-beginner-muscle-building-plan", "adjust-training-volume-cut-muscle-retention", "beef-protein-vs-whey-isolate-muscle-comparison", "best-plant-based-protein-powder-muscle-gain-2026", "best-protein-supplement-ramadan-guide", "best-protein-timing-after-workout-guide", "best-time-to-take-creatine-guide", "best-wearable-sleep-tracking-athletes-guide", "bfr-training-checklist", "budget-home-gym-equipment-comparison", "build-muscle-without-supplements-guide", "calculate-daily-calories-fuel-fat-loss-bulking", "calculate-maintenance-calories-muscle-gain", "calorie-cycling-fat-loss-diet", "chest-muscle-bodyweight-home-guide", "choose-smart-scale-body-composition", "choose-smartwatch-fitness-tracking", "choose-whey-protein-muscle-gain", "combine-hiit-strength-fat-loss-guide", "contrast-therapy-7day-recovery-plan", "creatine-cycling-long-term-gains", "creatine-loading-strength-hypertrophy-guide", "deload-week-rest-training-guide", "deload-week-structure-strength-gains", "does-creatine-make-you-gain-weight-water-retention-vs-muscle", "foam-roller-recovery-4-week-guide", "heart-rate-monitor-fat-loss-guide", "hiit-home-fat-burning-workout", "home-muscle-building-no-equipment-guide", "how-many-calories-to-gain-muscle-and-lose-fat", "how-to-periodize-nutrition-body-recomposition", "hrv-overtraining-7day-plan-athletes", "improve-gut-health-muscle-gain-4-week-plan", "intermittent-fasting-muscle-gain-workout-plan", "lose-belly-fat-without-losing-muscle-cardio-plan", "macro-tracking-meal-prep-1800-fat-loss", "magnesium-forms-sleep-recovery", "optimize-preworkout-nutrition-evening-training", "pilates-hypertrophy-muscle-building-guide", "post-workout-recovery-meal-plan-7-recipes", "pre-workout-nutrition-guide", "progressive-overload-home-food-plan", "progressive-overload-no-weight", "protein-after-workout-grams-guide", "protein-myths-busted-muscle-gain", "protein-per-day-muscle-build-plan", "quick-healthy-meal-ideas-busy-people", "red-light-therapy-muscle-recovery-mistakes", "sauna-muscle-recovery-hormone-optimization", "schedule-cardio-muscle-gain-guide", "science-backed-belly-fat-loss-8-weeks", "sleep-better-faster-gym-results", "smart-water-bottle-hydration-tracking-during-workouts", "track-macros-no-food-scale", "train-muscle-group-frequency-fixes", "warm-up-before-lifting-5min-routine", "whey-protein-dosage-muscle-gain", "women-home-muscle-building-program-guide",
]);
const LIVE_AR_BLOG = new Set([
  "12-week-progressive-overload-intermediate-guide", "4-day-split-muscle-fat-loss-guide", "4-week-beginner-muscle-building-plan-guide", "belly-fat-loss-8-weeks-guide", "best-creatine-men-guide", "best-creatine-supplement-for-women-guide", "best-dynamic-stretching-before-gym", "best-dynamic-stretching-exercises-athletes-injury-prevention", "best-omega-3-supplement-athletes", "best-plant-based-protein-powder-guide", "best-protein-supplement-ramadan", "best-protein-supplement-women-ramadan", "best-protein-timing-after-workout", "beta-alanine-guide-selection", "bfr-training-guide", "bmr-calculator-athletes", "calculate-calories-fat-loss", "calculate-daily-calories-muscle-gain-beginners-guide", "calculate-daily-calories-weight-loss", "calculate-daily-calories-weight-loss-muscle-gain", "calorie-cycling-fat-loss-guide", "calorie-macro-guide-muscle-fat", "carb-loading-plan-competition", "cardio-scheduling-muscle-gain-guide", "chest-muscle-bodyweight-home", "chest-muscle-home-workout-guide", "choose-best-wearable-sleep-tracker-athletes", "choose-creatine-women-guide", "choose-vitamin-d-supplement-athletes", "choose-weightlifting-shoes-men", "choose-whey-protein-muscle-gain-guide", "choose-whey-protein-ramadan-women", "cold-bath-home-wellness", "common-fat-burning-mistakes", "compare-whey-soy-protein-athletes", "creatine-beginners-guide", "creatine-water-retention-scientific-analysis-beginners-guide", "deload-week-guide", "design-diet-fat-loss-egyptian-lifestyle", "fat-burning-macro-diet-plan", "healthy-high-protein-meals-office", "hiit-home-workout-guide", "hiit-strength-training-fat-loss-guide", "home-muscle-building-guide-no-equipment", "home-muscle-building-guide-simple-weights", "home-muscle-gain-8-weeks", "how-many-hours-sleep-for-muscle-growth", "how-to-calc-daily-protein-athletes", "how-to-start-muscle-building-beginners", "increase-muscle-mass-no-protein-supplements", "intermittent-fasting-muscle-gain-guide", "muscle-building-home-workout-guide", "muscle-group-frequency-optimal", "nutrition-before-workout-guide", "nutrition-periodization-body-recomposition-guide", "optimal-rest-periods-resistance-training", "post-workout-recovery-meal-plan-guide", "progressive-overload-without-weights-guide", "progressive-weight-increase", "protein-grams-after-workout-guide", "protein-intake-calculator-muscle-build", "protein-myths-muscle-gain-guide", "protein-supplements-veg-animal-comparison", "reduce-water-retention-muscle-building", "sauna-muscle-recovery-guide", "sleep-muscle-growth-science", "sleep-recovery-gym-results", "track-macros-without-scale-guide", "upper-lower-split-4-days-guide", "water-intake-athlete-guide", "weekly-fat-burning-diet-plan", "women-bodyweight-muscle-workout",
]);
const LIVE_TOOLS = new Set([
  "/tools/calorie-calculator", "/tools/bmi-calculator", "/tools/macro-calculator",
  "/tools/body-fat-calculator", "/tools/water-tracker", "/meal-planner",
  "/ai-meal-planner", "/ai-workout-planner", "/workout-tracker", "/macro-tracker",
]);
const LIVE_PROGRAMS = new Set([
  "/programs/home-beginner-fullbody", "/programs/home-fat-loss-hiit",
  "/programs/home-core-specialization", "/programs/home-dumbbell-ppl",
  "/programs/gym-beginner-fullbody", "/programs/gym-ppl-intermediate",
  "/programs/gym-strength-5x5",
]);

const EXERCISE_SLUGS = new Set(EXERCISES.map((e) => e.slug));

/** Full-route resolver: is this exact href a real, live route? */
function isLiveRoute(href: string): boolean {
  if (href.startsWith("/ar/")) {
    const rest = href.slice(3); // "/blog/x" | "/tools/x" | ...
    if (rest.startsWith("/blog/")) return LIVE_AR_BLOG.has(rest.slice(6));
    if (rest.startsWith("/tools/")) return LIVE_TOOLS.has(`/tools/${rest.slice(7)}`);
    if (LIVE_TOOLS.has(rest)) return true; // root-level tools under /ar
    if (rest.startsWith("/programs/")) return LIVE_PROGRAMS.has(`/programs/${rest.slice(10)}`);
    if (rest.startsWith("/exercises/")) return EXERCISE_SLUGS.has(rest.slice(11));
    return false;
  }
  if (href.startsWith("/blog/")) return LIVE_EN_BLOG.has(href.slice(6));
  if (href.startsWith("/tools/")) return LIVE_TOOLS.has(href);
  if (href.startsWith("/programs/")) return LIVE_PROGRAMS.has(href);
  if (href.startsWith("/exercises/")) return EXERCISE_SLUGS.has(href.slice(11));
  // Root-level tool routes (/workout-tracker, /macro-tracker, /meal-planner,
  // /ai-workout-planner) live in the pages sitemap without a prefix.
  return LIVE_TOOLS.has(href);
}

const bySlug = new Map(EXERCISES.map((e) => [e.slug, e]));
const enrichedSlugs = Object.keys(EXERCISES_ENRICHMENT);

describe("exercises-enrichment batches (P1-2 canaries)", () => {
  it("covers exactly the batch-protocol count of real library exercises", () => {
    expect(enrichedSlugs.length).toBe(EXPECTED_COVERED);
    for (const slug of enrichedSlugs) {
      expect(bySlug.has(slug), `${slug} must exist in the 868-row library`).toBe(true);
    }
  });

  it("getExerciseEnrichment resolves every batch slug and rejects strangers", () => {
    for (const slug of enrichedSlugs) {
      expect(getExerciseEnrichment(slug)).toBeDefined();
    }
    expect(getExerciseEnrichment("definitely-not-an-exercise-slug")).toBeUndefined();
  });

  it("depth gate: ≥600 unique words per exercise per language (plan P1-2)", () => {
    for (const slug of enrichedSlugs) {
      const e = EXERCISES_ENRICHMENT[slug];
      expect(
        sectionWords(e, "en"),
        `${slug} EN unique content must be ≥600 words`,
      ).toBeGreaterThanOrEqual(600);
      expect(
        sectionWords(e, "ar"),
        `${slug} AR unique content must be ≥600 words`,
      ).toBeGreaterThanOrEqual(600);
    }
  });

  it("template-duplication gate: pairwise 8-gram Jaccard ≤0.15 within a category (EN + AR)", () => {
    const byCategory = new Map<string, string[]>();
    for (const slug of enrichedSlugs) {
      const cat = bySlug.get(slug)!.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(slug);
    }
    for (const [cat, slugs] of byCategory) {
      for (const lang of ["en", "ar"] as const) {
        const sets = slugs.map((s) => grams(fullText(EXERCISES_ENRICHMENT[s], lang)));
        for (let i = 0; i < sets.length; i++) {
          for (let j = i + 1; j < sets.length; j++) {
            const sim = jaccard(sets[i], sets[j]);
            expect(
              sim,
              `${cat}/${lang}: ${slugs[i]} vs ${slugs[j]} 8-gram Jaccard ${sim.toFixed(3)} must be ≤0.15 (plan law «لا نسخ قالب نصي واحد»)`,
            ).toBeLessThanOrEqual(0.15);
          }
        }
      }
    }
  });

  it("Arabic purity: zero Latin letters and zero CJK in every Arabic text field", () => {
    for (const slug of enrichedSlugs) {
      const text = allArabicText(EXERCISES_ENRICHMENT[slug]);
      const latin = text.match(/[A-Za-z]/g);
      expect(
        latin,
        `${slug} AR layer must carry no Latin letters (prohibition 176 spirit) — found: ${latin?.slice(0, 10).join("")}`,
      ).toBeNull();
      const cjk = text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g);
      expect(cjk, `${slug} AR layer must carry no CJK corruption`).toBeNull();
    }
  });

  it("shape: exactly 4 mistake→fix pairs, ≥3 FAQ Q&As, 2-3 links per language", () => {
    for (const slug of enrichedSlugs) {
      const e = EXERCISES_ENRICHMENT[slug];
      expect(e.sections.en.mistakes.length, `${slug} EN mistakes`).toBe(4);
      expect(e.sections.ar.mistakes.length, `${slug} AR mistakes`).toBe(4);
      expect(e.faq.en.length, `${slug} EN FAQ`).toBeGreaterThanOrEqual(3);
      expect(e.faq.ar.length, `${slug} AR FAQ`).toBeGreaterThanOrEqual(3);
      expect(e.links.length, `${slug} links`).toBeGreaterThanOrEqual(2);
      expect(e.links.length, `${slug} links`).toBeLessThanOrEqual(3);
      for (const f of [...e.faq.en, ...e.faq.ar]) {
        expect(f.q.length).toBeGreaterThan(8);
        expect(f.a.length).toBeGreaterThan(40);
      }
      for (const m of [...e.sections.en.mistakes, ...e.sections.ar.mistakes]) {
        expect(m.error.length).toBeGreaterThan(10);
        expect(m.fix.length).toBeGreaterThan(20);
      }
    }
  });

  it("link registry: every href is a real live route (blog/tools/programs/exercises)", () => {
    for (const slug of enrichedSlugs) {
      for (const l of EXERCISES_ENRICHMENT[slug].links) {
        expect(
          l.hrefAr.startsWith("/ar/"),
          `${slug}: AR href must live in the /ar space — got ${l.hrefAr}`,
        ).toBe(true);
        expect(
          !l.hrefEn.startsWith("/ar/"),
          `${slug}: EN href must not live in the /ar space — got ${l.hrefEn}`,
        ).toBe(true);
        expect(isLiveRoute(l.hrefEn), `${slug}: EN href ${l.hrefEn} is not a verified live route`).toBe(true);
        expect(isLiveRoute(l.hrefAr), `${slug}: AR href ${l.hrefAr} is not a verified live route`).toBe(true);
        expect(l.labelEn.length).toBeGreaterThan(8);
        expect(l.labelAr.length).toBeGreaterThan(8);
      }
    }
  });

  it("language parity: both sides of every enriched exercise fully populated", () => {
    for (const slug of enrichedSlugs) {
      const e = EXERCISES_ENRICHMENT[slug];
      for (const lang of ["en", "ar"] as const) {
        expect(e.intro[lang].length).toBeGreaterThan(200);
        expect(e.sections[lang].muscles.length).toBeGreaterThan(150);
        expect(e.sections[lang].alternatives.length).toBeGreaterThan(150);
        expect(e.sections[lang].progression.length).toBeGreaterThan(150);
        expect(e.sections[lang].programming.length).toBeGreaterThan(150);
      }
    }
  });

  it("exercises family lastmod anchor carries the P1-2 ship date (truthful recency)", () => {
    // The 2026-11-04 title-ceiling fix already bumped the anchor; P1-2's
    // enrichment is a second material change to the family's served HTML
    // on the same ship date, so the anchor stays truthful at 2026-11-04.
    expect(SITEMAP_LASTMOD.exercises).toBe("2026-11-04");
  });
});
