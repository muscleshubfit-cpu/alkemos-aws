import { describe, it, expect } from "vitest";
import { FOODS } from "@/lib/foods";
import {
  FOODS_ENRICHMENT,
  getFoodEnrichment,
  type FoodEnrichment,
} from "@/lib/foods-enrichment";
import { SITEMAP_LASTMOD } from "@/lib/sitemap-lastmod";

/**
 * P1-1 canaries (SEO-ADSENSE-RECOVERY-PLAN-2026-10-31, owner execution
 * order 2026-11-01) — the invariants the foods-enrichment batch ships
 * against the plan's G2 acceptance gate:
 *
 *   - every enriched slug is a real, CURATED food (tags.length > 0 —
 *     the sitemap-advertised set; enrichment never lands on the USDA
 *     long tail);
 *   - unique-content depth ≥ 180 words per food per language
 *     (intro + context + FAQ), intro alone 60-100 EN words;
 *   - template-duplication guard: pairwise 8-gram Jaccard between
 *     same-family enriched pages ≤ 0.15 — the same measurement the
 *     audit used to convict the family at 42.8%; batch 1 must not
 *     regress it back toward a copied-template shape («لا نسخ قالب
 *     نصي واحد» — plan law);
 *   - Arabic purity (prohibition 176 spirit): zero Latin letters in
 *     the Arabic layer (digits and Arabic punctuation are fine);
 *   - the family lastmod anchor was bumped to the ship date
 *     (truthful-recency protocol in sitemap-lastmod.ts).
 */

const words = (s: string) =>
  s
    .replace(/[\u200f\u200e]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

const enrichmentWords = (e: FoodEnrichment, lang: "en" | "ar") =>
  words(e.intro[lang]) +
  words(e.context[lang].alternatives) +
  words(e.context[lang].plan) +
  words(e.context[lang].caution) +
  e.faq[lang].reduce((n, f) => n + words(f.q) + words(f.a), 0);

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

const fullText = (e: FoodEnrichment, lang: "en" | "ar") =>
  [
    e.intro[lang],
    e.context[lang].alternatives,
    e.context[lang].plan,
    e.context[lang].caution,
    ...e.faq[lang].flatMap((f) => [f.q, f.a]),
  ].join(" ");

const bySlug = new Map(FOODS.map((f) => [f.slug, f]));
const enrichedSlugs = Object.keys(FOODS_ENRICHMENT);

describe("foods-enrichment batches 1+2 (P1-1 canaries)", () => {
  it("batches 1+2 cover 40 foods — all real, curated (sitemap-advertised set)", () => {
    expect(enrichedSlugs.length).toBe(40);
    for (const slug of enrichedSlugs) {
      const food = bySlug.get(slug);
      expect(food, `${slug} must exist in FOODS`).toBeDefined();
      expect(
        (food?.tags?.length ?? 0) > 0,
        `${slug} must be CURATED (tags.length > 0 — never the USDA tail)`,
      ).toBe(true);
    }
  });

  it("getFoodEnrichment resolves every batch slug and rejects strangers", () => {
    for (const slug of enrichedSlugs) {
      expect(getFoodEnrichment(slug)).toBeDefined();
    }
    expect(getFoodEnrichment("definitely-not-a-food-slug")).toBeUndefined();
  });

  it("depth gate: ≥180 unique words per food per language; EN intro 60-100 words", () => {
    for (const slug of enrichedSlugs) {
      const e = FOODS_ENRICHMENT[slug];
      expect(
        enrichmentWords(e, "en"),
        `${slug} EN unique content must be ≥180 words (plan G2)`,
      ).toBeGreaterThanOrEqual(180);
      expect(
        enrichmentWords(e, "ar"),
        `${slug} AR unique content must be ≥180 words (plan G2)`,
      ).toBeGreaterThanOrEqual(180);
      const introEn = words(e.intro.en);
      expect(introEn, `${slug} EN intro must be 60-100 words`).toBeGreaterThanOrEqual(60);
      expect(introEn, `${slug} EN intro must be 60-100 words`).toBeLessThanOrEqual(100);
      // Arabic words are longer on average — the plan's 60-100 word spec
      // maps to a slightly lower Arabic word count.
      expect(words(e.intro.ar), `${slug} AR intro must be ≥40 words`).toBeGreaterThanOrEqual(40);
    }
  });

  it("template-duplication gate: pairwise 8-gram Jaccard ≤0.15 within a family (EN + AR)", () => {
    const byFamily = new Map<string, string[]>();
    for (const slug of enrichedSlugs) {
      const fam = bySlug.get(slug)!.category;
      if (!byFamily.has(fam)) byFamily.set(fam, []);
      byFamily.get(fam)!.push(slug);
    }
    for (const [fam, slugs] of byFamily) {
      for (const lang of ["en", "ar"] as const) {
        const sets = slugs.map((s) => grams(fullText(FOODS_ENRICHMENT[s], lang)));
        for (let i = 0; i < sets.length; i++) {
          for (let j = i + 1; j < sets.length; j++) {
            const sim = jaccard(sets[i], sets[j]);
            expect(
              sim,
              `${fam}/${lang}: ${slugs[i]} vs ${slugs[j]} 8-gram Jaccard ${sim.toFixed(3)} must be ≤0.15 (batch 1 must stay genuinely unique — audit convicted the family at 0.428)`,
            ).toBeLessThanOrEqual(0.15);
          }
        }
      }
    }
  });

  it("Arabic purity: zero Latin letters in the Arabic layer (digits fine)", () => {
    for (const slug of enrichedSlugs) {
      const e = FOODS_ENRICHMENT[slug];
      const arText = fullText(e, "ar");
      const latin = arText.match(/[A-Za-z]/g);
      expect(
        latin,
        `${slug} AR layer must carry no Latin letters (prohibition 176 spirit) — found: ${latin?.slice(0, 10).join("")}`,
      ).toBeNull();
    }
  });

  it("FAQ shape: exactly 3 Q&As per food per language, non-empty", () => {
    for (const slug of enrichedSlugs) {
      const e = FOODS_ENRICHMENT[slug];
      expect(e.faq.en.length, `${slug} EN FAQ count`).toBe(3);
      expect(e.faq.ar.length, `${slug} AR FAQ count`).toBe(3);
      for (const f of [...e.faq.en, ...e.faq.ar]) {
        expect(f.q.length).toBeGreaterThan(5);
        expect(f.a.length).toBeGreaterThan(20);
      }
    }
  });

  it("foods family lastmod anchor bumped to the batch-2 ship date (truthful recency)", () => {
    // Batches 1 (2026-11-01) and 2 materially changed the family's served
    // HTML → the sitemap-lastmod protocol requires the latest ship date,
    // not the stale 2026-09-28 anchor. Wired in the same frame as the
    // enrichment.
    expect(SITEMAP_LASTMOD.foods).toBe("2026-11-04");
  });
});
