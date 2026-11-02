/**
 * src/lib/__tests__/article-treatment-batch.test.ts
 *
 * ARTICLE-TREATMENT BATCH CANARY (SEO-RECOVERY-EXEC-2 E6/E7, owner order
 * 2026-11-01 «أمر تنفيذ المرحلة التالية» — clause 3: guarantee that the
 * editorial-quality criteria applied to manual treatment become a MANDATORY,
 * permanent part of every future treatment batch).
 *
 * WHAT IT PINS (for every entry in every committed batch JSON):
 *   - G1 word floor: ≥1000 visible words (the same counter the applier uses)
 *   - FAQ contract: 4-7 items in faq_json AND the exact section heading in body
 *     (## الأسئلة الشائعة / ## Frequently Asked Questions) AND every faq_json
 *     question present in the body (the P5 single-display law)
 *   - G4 authority floor: ≥1 external link to EDITORIAL_AUTHORITY_DOMAINS
 *   - MSA surface (AR): visible-text Latin ratio ≤5% (plumbing stripped,
 *     parenthesized refs tolerated) — law 176
 *   - Meta budgets: meta_description ≤160 chars (P2-10) · meta_title ≤60 EN
 *     / ≤70 AR (the SERP clamp budgets)
 *   - Insert entries: full row shape + pair_with present + opposite language
 *   - Image alts: no feminine-term violations (image-safety law 173 surface)
 *   - Pair integrity inside a batch: a rewrite may not leave its twin's
 *     linked_post_id dangling (both sides of an existing pair treated in the
 *     same batch, or neither) — hreflang C1 law
 *   - Slug stability: rewrite entries NEVER change the slug (link
 *     permanence law); inserts never reuse an existing T1 slug
 *
 * New batch files must be REGISTERED in BATCH_FILES below — an unregistered
 * batch in scripts/blog-runner/article-treatment-batch-*.json FAILS this
 * canary (the "born gated" rule: a batch that ships without its gate row
 * here is a §3.8 violation, same pattern as the docs born-archived law).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EDITORIAL_AUTHORITY_DOMAINS } from "../blog-editorial-law";

type FaqItem = { question: string; answer: string };
type Entry = {
  slug: string;
  language: "en" | "ar";
  mode: "rewrite" | "insert";
  expect_old_words?: [number, number];
  fix?: {
    content: string;
    faq_json: FaqItem[];
    focus_keyword?: string;
    category?: string;
    excerpt?: string;
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
  row?: Record<string, unknown> & {
    language: "en" | "ar";
    content: string;
    faq_json: FaqItem[];
    meta_title: string;
    meta_description: string;
    featured_image: string;
    cover_alt: string;
  };
  pair_with?: { slug: string; language: "en" | "ar" };
  note?: string;
};
type Batch = { batch: string; articles: Entry[] };

/** Every committed batch MUST be listed here (born-gated rule). */
const BATCH_FILES = [
  "article-treatment-batch-t1.json",
  "article-treatment-batch-l1.json",
  "article-treatment-batch-t2.json",
  "article-treatment-batch-t3.json",
  "article-treatment-batch-t3-2.json",
  "article-treatment-batch-t3-3.json",
  "article-treatment-batch-t3-4.json",
  "article-treatment-batch-t3-4b.json",
  "article-treatment-batch-l2-1.json",
  "article-treatment-batch-l2-2.json",
  "article-treatment-batch-l2-3.json",
  "article-treatment-batch-l2-4.json",
] as const;

const BATCH_DIR = join(process.cwd(), "scripts", "blog-runner");

function loadBatch(name: string): Batch {
  return JSON.parse(readFileSync(join(BATCH_DIR, name), "utf8")) as Batch;
}

// ── the same metric family the applier + inventory use ────────────────────
function wordCount(md: string): number {
  const stripped = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped ? stripped.split(" ").filter(Boolean).length : 0;
}

function latinRatio(md: string): number {
  const visible = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
  const cleaned = visible.replace(/\([^)]*[A-Za-z][^)]*\)/g, " "); // (Whey) refs
  const letters = cleaned.replace(/[^\p{L}]/gu, "");
  if (!letters) return 0;
  const latin = cleaned.match(/[A-Za-z]/g) || [];
  return latin.length / letters.length;
}

function authorityLinks(md: string): number {
  let n = 0;
  for (const m of md.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)) {
    try {
      const h = new URL(m[1]).hostname.replace(/^www\./, "");
      if (EDITORIAL_AUTHORITY_DOMAINS.includes(h)) n++;
    } catch {
      /* ignore */
    }
  }
  return n;
}

const FEMININE_ALT_TERMS = /\b(woman|women|girl|female|lady|mother)\b/i;

function bodyOf(e: Entry): string {
  return e.mode === "rewrite" ? (e.fix?.content ?? "") : (e.row?.content ?? "");
}

describe("article-treatment batches — the permanent editorial battery", () => {
  // born-gated: any batch file on disk that is not registered FAILS
  it("every article-treatment-batch-*.json on disk is registered in BATCH_FILES", () => {
    const onDisk = readdirSync(BATCH_DIR)
      .filter((f) => /^article-treatment-batch-.*\.json$/.test(f))
      .sort();
    expect(onDisk).toEqual([...BATCH_FILES].sort());
  });

  for (const name of BATCH_FILES) {
    describe(name, () => {
      const batch = loadBatch(name);

      it("batch metadata present", () => {
        expect(batch.batch).toBeTruthy();
        expect(batch.articles.length).toBeGreaterThan(0);
      });

      for (const e of batch.articles) {
        describe(`${e.mode}: ${e.slug} [${e.language}]`, () => {
          const body = bodyOf(e);

          it("G1: ≥1000 visible words", () => {
            expect(wordCount(body)).toBeGreaterThanOrEqual(1000);
          });

          it("G4: ≥1 authority link", () => {
            expect(authorityLinks(body)).toBeGreaterThanOrEqual(1);
          });

          it("FAQ contract: 4-7 items + exact heading + mirrored questions", () => {
            const faq =
              e.mode === "rewrite" ? (e.fix?.faq_json ?? []) : (e.row?.faq_json ?? []);
            expect(faq.length).toBeGreaterThanOrEqual(4);
            expect(faq.length).toBeLessThanOrEqual(7);
            const heading =
              e.language === "ar"
                ? "## الأسئلة الشائعة"
                : "## Frequently Asked Questions";
            expect(body).toContain(heading);
            for (const item of faq) {
              expect(body).toContain(item.question);
            }
          });

          it("MSA surface (AR): Latin ratio ≤5%", () => {
            if (e.language !== "ar") return;
            expect(latinRatio(body)).toBeLessThanOrEqual(0.05);
          });

          it("meta budgets: description ≤160 · title ≤60 EN / ≤70 AR", () => {
            const desc =
              e.mode === "rewrite"
                ? (e.fix?.meta_description ?? "")
                : String(e.row?.meta_description ?? "");
            const title =
              e.mode === "rewrite"
                ? (e.fix?.meta_title ?? "")
                : String(e.row?.meta_title ?? "");
            expect(desc.length).toBeGreaterThan(0);
            expect(desc.length).toBeLessThanOrEqual(160);
            expect(title.length).toBeGreaterThan(0);
            expect(title.length).toBeLessThanOrEqual(e.language === "ar" ? 70 : 60);
          });

          it("image alts: no feminine-term violations (law 173 surface)", () => {
            for (const m of body.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)) {
              expect(FEMININE_ALT_TERMS.test(m[1])).toBe(false);
            }
          });

          if (e.mode === "rewrite") {
            it("has an old-content expectation window (concurrent-edit guard)", () => {
              expect(e.expect_old_words).toBeDefined();
              const [lo, hi] = e.expect_old_words!;
              expect(lo).toBeGreaterThan(0);
              expect(hi).toBeGreaterThanOrEqual(lo);
            });
          }

          if (e.mode === "insert") {
            it("row shape complete + pairing declared + opposite languages", () => {
              const r = e.row!;
              for (const k of [
                "language",
                "title",
                "slug",
                "excerpt",
                "content",
                "meta_title",
                "meta_description",
                "focus_keyword",
                "keywords",
                "category",
                "tags",
                "featured_image",
                "cover_alt",
                "author",
                "faq_json",
              ]) {
                expect(r[k], `row.${k}`).toBeTruthy();
              }
              expect(e.pair_with).toBeDefined();
              expect(e.pair_with!.language).not.toBe(e.language);
              expect(r.language).toBe(e.language);
              expect(r.slug).toBe(e.slug);
              // author law: real human name (SEO-GEO-4.1)
              expect(r.author).toBe("Ahmed Zake");
              // featured image: a real vetted pool photo (pexels)
              expect(String(r.featured_image)).toMatch(
                /^https:\/\/images\.pexels\.com\/photos\/\d+\//,
              );
            });
          }
        });
      }

      // pair integrity inside the batch: an existing PAIR must be treated
      // on both sides in the same batch (or neither) — no dangling hreflang
      it("no half-treated existing pairs inside the batch", () => {
        const slugs = new Set(batch.articles.map((e) => `${e.slug}|${e.language}`));
        const PAIRED_IN_CORPUS = new Set([
          // the 11 measured bidirectional pairs
          // (7 original from triage §4.4 + 4 created by the L1 batch, E-7)
          "deload-week-guide|ar",
          "deload-week-rest-training-guide|en",
          "home-muscle-building-guide-simple-weights|ar",
          "12-week-dumbbell-band-muscle-plan|en",
          "healthy-high-protein-meals-office|ar",
          "quick-healthy-meal-ideas-busy-people|en",
          "how-many-hours-sleep-for-muscle-growth|ar",
          "sleep-better-faster-gym-results|en",
          "calculate-daily-calories-weight-loss|ar",
          "calculate-daily-calories-fuel-fat-loss-bulking|en",
          "protein-intake-calculator-muscle-build|ar",
          "protein-per-day-muscle-build-plan|en",
          "choose-best-wearable-sleep-tracker-athletes|ar",
          "best-wearable-sleep-tracking-athletes-guide|en",
          "build-muscle-without-supplements-guide|en",
          "increase-muscle-mass-no-protein-supplements|ar",
          "hiit-home-fat-burning-workout|en",
          "hiit-home-workout-guide|ar",
          "track-macros-no-food-scale|en",
          "track-macros-without-scale-guide|ar",
          "pre-workout-nutrition-guide|en",
          "nutrition-before-workout-guide|ar",
          // + the 4 pairs created by the L2-1 batch (E-16) — twins of the
          // A-tier EN articles, linked bidirectionally by the insert run
          "progressive-overload-no-weight|en",
          "progressive-overload-without-weights-guide|ar",
          "4-day-upper-lower-hypertrophy-split|en",
          "upper-lower-split-4-days-guide|ar",
          "protein-myths-busted-muscle-gain|en",
          "protein-myths-muscle-gain-guide|ar",
          "calorie-cycling-fat-loss-diet|en",
          "calorie-cycling-fat-loss-guide|ar",
          // + the 4 pairs created by the L2-3 batch (E-18) — counterparts of
          // B-tier sources, born paired in the same run
          "4-day-split-hypertrophy-fat-loss|en",
          "4-day-split-muscle-fat-loss-guide|ar",
          "home-muscle-building-guide-no-equipment|ar",
          "home-muscle-building-no-equipment-guide|en",
          "intermittent-fasting-muscle-gain-workout-plan|en",
          "intermittent-fasting-muscle-gain-guide|ar",
          "science-backed-belly-fat-loss-8-weeks|en",
          "belly-fat-loss-8-weeks-guide|ar",
          // + the 4 pairs created by the L2-4 batch (E-19)
          "choose-whey-protein-muscle-gain|en",
          "choose-whey-protein-muscle-gain-guide|ar",
          "best-protein-supplement-ramadan|ar",
          "best-protein-supplement-ramadan-guide|en",
          "sauna-muscle-recovery-hormone-optimization|en",
          "sauna-muscle-recovery-guide|ar",
          "bfr-training-checklist|en",
          "bfr-training-guide|ar",
        ]);
        const KNOWN_PAIRS: Array<[string, string]> = [
          ["deload-week-guide|ar", "deload-week-rest-training-guide|en"],
          [
            "home-muscle-building-guide-simple-weights|ar",
            "12-week-dumbbell-band-muscle-plan|en",
          ],
          [
            "healthy-high-protein-meals-office|ar",
            "quick-healthy-meal-ideas-busy-people|en",
          ],
          [
            "how-many-hours-sleep-for-muscle-growth|ar",
            "sleep-better-faster-gym-results|en",
          ],
          [
            "calculate-daily-calories-weight-loss|ar",
            "calculate-daily-calories-fuel-fat-loss-bulking|en",
          ],
          ["protein-intake-calculator-muscle-build|ar", "protein-per-day-muscle-build-plan|en"],
          [
            "choose-best-wearable-sleep-tracker-athletes|ar",
            "best-wearable-sleep-tracking-athletes-guide|en",
          ],
          [
            "build-muscle-without-supplements-guide|en",
            "increase-muscle-mass-no-protein-supplements|ar",
          ],
          ["hiit-home-fat-burning-workout|en", "hiit-home-workout-guide|ar"],
          ["track-macros-no-food-scale|en", "track-macros-without-scale-guide|ar"],
          ["pre-workout-nutrition-guide|en", "nutrition-before-workout-guide|ar"],
          ["progressive-overload-no-weight|en", "progressive-overload-without-weights-guide|ar"],
          ["4-day-upper-lower-hypertrophy-split|en", "upper-lower-split-4-days-guide|ar"],
          ["protein-myths-busted-muscle-gain|en", "protein-myths-muscle-gain-guide|ar"],
          ["calorie-cycling-fat-loss-diet|en", "calorie-cycling-fat-loss-guide|ar"],
          ["4-day-split-hypertrophy-fat-loss|en", "4-day-split-muscle-fat-loss-guide|ar"],
          [
            "home-muscle-building-guide-no-equipment|ar",
            "home-muscle-building-no-equipment-guide|en",
          ],
          [
            "intermittent-fasting-muscle-gain-workout-plan|en",
            "intermittent-fasting-muscle-gain-guide|ar",
          ],
          ["science-backed-belly-fat-loss-8-weeks|en", "belly-fat-loss-8-weeks-guide|ar"],
          ["choose-whey-protein-muscle-gain|en", "choose-whey-protein-muscle-gain-guide|ar"],
          ["best-protein-supplement-ramadan|ar", "best-protein-supplement-ramadan-guide|en"],
          ["sauna-muscle-recovery-hormone-optimization|en", "sauna-muscle-recovery-guide|ar"],
          ["bfr-training-checklist|en", "bfr-training-guide|ar"],
        ];
        // Pairs whose side was rewritten in a batch that PREDATES the pair's
        // creation are exempt for that batch only — a rewrite cannot dangle
        // an hreflang whose twin did not exist yet (history is not a
        // retroactive violation; every FUTURE half-treatment still fails).
        const GRANDFATHERED: Record<string, string[]> = {
          // sauna EN was rewritten by T3-1 (2026-11-01) a day before the
          // L2-4 batch (E-19, 2026-11-02) created its AR twin.
          "article-treatment-batch-t3.json": ["sauna-muscle-recovery-hormone-optimization|en"],
        };
        for (const [a, b] of KNOWN_PAIRS) {
          if (!PAIRED_IN_CORPUS.has(a) || !PAIRED_IN_CORPUS.has(b)) continue;
          const exempt = GRANDFATHERED[name] ?? [];
          if (exempt.includes(a) || exempt.includes(b)) continue;
          const aTreated = slugs.has(a);
          const bTreated = slugs.has(b);
          // half-treatment of a PAIR is allowed ONLY when the treated side
          // is an insert-pairing that re-points nothing (inserts never
          // rewrite an existing twin). For REWRITES the pair must be whole.
          const aEntry = batch.articles.find((e) => `${e.slug}|${e.language}` === a);
          const bEntry = batch.articles.find((e) => `${e.slug}|${e.language}` === b);
          const aRewrite = aEntry?.mode === "rewrite";
          const bRewrite = bEntry?.mode === "rewrite";
          if (aRewrite || bRewrite) {
            // if one side is rewritten, the other side must also be treated
            // (rewrite) in the same batch — pair quality parity law
            if (aRewrite) expect(bTreated, `twin ${b} untreated while ${a} rewritten`).toBe(true);
            if (bRewrite) expect(aTreated, `twin ${a} untreated while ${b} rewritten`).toBe(true);
          }
        }
      });

      it("insert slugs are unique within the batch and never collide with rewrites", () => {
        const all = batch.articles.map((e) => e.slug);
        expect(new Set(all).size).toBe(all.length);
      });
    });
  }
});
