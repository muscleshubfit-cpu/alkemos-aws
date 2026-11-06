/**
 * PUBLIC-CONTENT META-TEXT BAN (2026-11-06 — growth-plan batch 8)
 *
 * LAW: public page content (exercise/food enrichment, comparisons, nutrient
 * lists, hub collections) must NEVER reference the site's internal
 * analytics or page-selection methodology. Phrases like "16 impressions in
 * the last measured window", "search engines surfaced this page", "the
 * keyword map", "top-50 seat", "استعلامات", "نافذة القياس", "الخمسين"
 * are internal working language — a reader has no idea what they mean,
 * and an answer engine citing the page would quote the leak verbatim.
 *
 * ORIGIN: owner order 2026-11-06 «راجع المحتوى العربي والإنجليزي، وصحح
 * الترجمات والصياغة والمعلومات» — the live-audit session found 33
 * exercise intros (×2 languages) carrying GSC numbers, "query cluster"
 * and "top-50 seat" references; all were rewritten in the same batch.
 *
 * This canary reads the SOURCE string values of every generated-content
 * family module and fails on any banned pattern, so a future batch can
 * never reintroduce the leak. Comments (/* *\/ and //) are exempt — they
 * are not rendered to users.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

/** Files whose public string content is guarded by this law. */
const GUARDED_FILES = [
  "src/lib/exercises-enrichment.ts",
  // All exercise batches (glob-like explicit list keeps the guard honest
  // when a new batch file lands: CI fails here until it is added — by design).
  "src/lib/exercises-enrichment-batch1.ts",
  "src/lib/exercises-enrichment-batch2.ts",
  "src/lib/exercises-enrichment-batch3.ts",
  "src/lib/exercises-enrichment-batch4.ts",
  "src/lib/exercises-enrichment-batch5.ts",
  "src/lib/exercises-enrichment-batch6.ts",
  "src/lib/exercises-enrichment-batch7.ts",
  "src/lib/exercises-enrichment-batch8.ts",
  "src/lib/exercises-enrichment-batch9.ts",
  "src/lib/exercises-enrichment-batch10.ts",
  "src/lib/exercises-enrichment-batch11.ts",
  "src/lib/exercises-enrichment-batch12.ts",
  "src/lib/exercises-enrichment-batch13.ts",
  "src/lib/exercises-enrichment-batch14.ts",
  "src/lib/exercises-enrichment-batch15.ts",
  "src/lib/exercises-enrichment-batch16.ts",
  "src/lib/foods-enrichment.ts",
  "src/lib/food-comparisons.ts",
  "src/lib/food-nutrient-lists.ts",
  "src/lib/hub-collections.ts",
  "src/lib/hub-depth-collections.ts",
];

/**
 * Banned patterns — every one of these leaked to production at least once
 * (measured 2026-11-06 live crawl of /ar/exercises/leg-lift and
 * /ar/exercises/spider-crawl quoting "نافذة القياس الأخيرة" verbatim).
 * Patterns are specific enough to avoid legitimate fitness phrasing
 * ("the exercise demands bracing strength", "stabilizer demand").
 */
const BANNED: { pattern: RegExp; note: string }[] = [
  // English leaks (case-insensitive)
  { pattern: /\bGSC\b/i, note: "Google Search Console abbreviation" },
  { pattern: /impressions? in (the )?(last|measured)/i, note: "impression counts" },
  { pattern: /measured window/i, note: "measurement window" },
  { pattern: /search engines? (surfaced|showed|ranked)/i, note: "search-engine meta claims" },
  { pattern: /searchers find/i, note: "searcher behavior claims" },
  { pattern: /keyword map/i, note: "internal keyword map" },
  { pattern: /quer(y|ies) (cluster|space|map)/i, note: "query-cluster language" },
  { pattern: /\btop[ -]50\b/i, note: "internal top-50 selection" },
  { pattern: /the fifty\b/i, note: "internal top-50 selection" },
  { pattern: /(earned|booked|keeps?|won) (its |a |the )?(top-50 |)?(seat|place|spot) (on|through|by) demand/i, note: "demand-seat language" },
  // Arabic leaks
  { pattern: /نافذة القياس/, note: "نافذة القياس" },
  { pattern: /أظهرت محركات البحث/, note: "أظهرت محركات البحث" },
  { pattern: /محركات البحث/, note: "محركات البحث" },
  { pattern: /فهرس الموقع/, note: "فهرس الموقع" },
  { pattern: /أداء البحث/, note: "أداء البحث" },
  { pattern: /بيانات أداء/, note: "بيانات أداء" },
  { pattern: /خريطة (الكلمات|كلمات)/, note: "خريطة الكلمات" },
  { pattern: /استعلامات/, note: "استعلامات" },
  { pattern: /الاستعلام/, note: "الاستعلام" },
  { pattern: /(في|هذه|الخمسين) الخمسين/, note: "الخمسين (top-50)" },
  { pattern: /الخمسين (الأولى|الأول)/, note: "الخمسين الأولى" },
  { pattern: /بمتوسط مركز/, note: "متوسط مركز (avg position)" },
  { pattern: /ظهورً?ا?t? في نافذة/, note: "impressions in window" },
  { pattern: /\d+ ظهور/, note: "impression counts (AR)" },
];

/** Strip comments so code documentation may keep explaining methodology. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|\s)\/\/[^\n]*/g, " ");
}

describe("public-content meta-text ban (growth-plan batch 8 law)", () => {
  for (const file of GUARDED_FILES) {
    it(`${file} carries no internal analytics/selection meta-text`, () => {
      const src = stripComments(
        readFileSync(resolve(process.cwd(), file), "utf-8"),
      );
      const hits: string[] = [];
      for (const { pattern, note } of BANNED) {
        const m = src.match(pattern);
        if (m) {
          const at = src.indexOf(m[0]);
          hits.push(`"${m[0]}" (${note}) near: …${src.slice(Math.max(0, at - 60), at + 60).replace(/\s+/g, " ")}…`);
        }
      }
      expect(hits, `internal meta-text leaked into public content:\n${hits.join("\n")}`).toEqual([]);
    });
  }

  it("guards every exercises-enrichment batch file present on disk (no silent gaps)", () => {
    // If someone adds batch15+ without registering it above, this fails —
    // the guard list must stay exhaustive by design.
    const onDisk = readdirSync(resolve(process.cwd(), "src/lib"))
      .filter((f) => /^exercises-enrichment-batch\d+\.ts$/.test(f))
      .sort();
    const guarded = GUARDED_FILES.map((f) => f.split("/").pop() ?? "")
      .filter((f) => /^exercises-enrichment-batch\d+\.ts$/.test(f))
      .sort();
    expect(guarded).toEqual(onDisk);
  });
});
