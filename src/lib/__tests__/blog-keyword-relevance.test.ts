/**
 * src/lib/__tests__/blog-keyword-relevance.test.ts
 *
 * KEYWORD/TAG RELEVANCE CANARY (P1 batch 14, owner order 2026-11-06):
 * pins the shared orphan detector (src/lib/blog-keyword-relevance.ts)
 * used by BOTH the standing corpus inventory (measurement) and the
 * keyword-tag-remediation channel (validation of every replacement
 * before any write). The defect it guards against: the legacy
 * generator's random keyword/tag pools polluting the on-site search
 * predicate (matchesBlogSearch matches on keywords+tags).
 *
 * WHAT IT PINS:
 *   - the detector flags the measured legacy-random class (creatine on a
 *     maintenance-calories article) in BOTH directions (EN + AR samples)
 *   - the detector passes on-topic entries built from the article's own
 *     vocabulary (title/H2 words), including the question forms
 *   - morphological variants: plural (calories/calorie), Arabic definite
 *     article (النوم/نوم), li-al proclitic (للرياضيين → رياضي),
 *     sound plurals (الرياضيون → رياضي), and proclitic chains
 *     (والتدرج → التدرج → تدرج)
 *   - stopword tier: 3-letter function words are stopworded while the
 *     acronym tier (BFR/RPE/TDEE/fat) stays in the basis
 *   - pure-stopword entries are never reported (the detector only judges
 *     topical overlap)
 *   - the committed remediation patch (keyword-tag-remediation.json):
 *     every entry carries 4-8 keywords (2-8 words each) and 3-5 tags
 *     (1-3 words each), no duplicates, keywords/tags disjoint, AR rows
 *     pure-Arabic, and ZERO orphans against each entry's own snapshot
 *     basis (title + category + H2 headings — the batch-13 measured
 *     worksheet; the live channel re-validates against the row itself
 *     widened with focus_keyword + FAQ questions)
 *   - the patch covers exactly the measured polluted set (131 rows —
 *     the batch-13 corpus audit: 99 orphan-keyword rows + 113 orphan-tag
 *     rows + 18 zero-keyword rows, deduplicated) — born-gated: an
 *     entry list that drifts from the measured set FAILS
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  contentWords,
  orphanEntries,
  topicalBasis,
} from "../blog-keyword-relevance";

const MAINT_TITLE =
  "How to Calculate Maintenance Calories for Muscle Gain";
const MAINT_CATEGORY = "nutrition";
const MAINT_FOCUS = "calculate maintenance calories muscle gain";
const LEGACY_RANDOM = [
  "best creatine monohydrate for women over 40",
  "intermittent fasting 16/8 meal plan for fat loss",
  "best vegan omega-3 supplement for athletes",
  "how to improve sleep quality for muscle recovery",
];
const ON_TOPIC = [
  "how to calculate maintenance calories",
  "maintenance calories for muscle gain",
  "Mifflin-St Jeor activity multiplier",
  "two week validation protocol",
  "TEF and protein in maintenance calories",
  "recalculate maintenance after weight change",
];

describe("blog-keyword-relevance — the shared orphan detector", () => {
  it("flags the measured legacy-random pool (EN)", () => {
    const basis = topicalBasis(MAINT_TITLE, MAINT_CATEGORY, MAINT_FOCUS);
    const orphans = orphanEntries(LEGACY_RANDOM, basis);
    expect(orphans.length).toBeGreaterThanOrEqual(3);
    expect(orphans).toContain("best creatine monohydrate for women over 40");
  });

  it("passes on-topic entries built from the article's own vocabulary (EN)", () => {
    const basis = topicalBasis(MAINT_TITLE, MAINT_CATEGORY, MAINT_FOCUS, [
      "Step 1: BMR with Mifflin-St Jeor — the settled formula",
      "Step 2: The activity multiplier trap",
      "Step 3: The two-week validation protocol — where you actually calculate maintenance",
      "Step 4: TEF and protein — the thermic advantage",
      "recalculate maintenance after weight change",
    ]);
    expect(orphanEntries(ON_TOPIC, basis)).toEqual([]);
  });

  it("flags legacy-random Arabic and passes on-topic Arabic (لل + plural chains)", () => {
    const title = "كم سعرة أحتاج يوميا لخسارة الوزن؟ طريقة حساب دقيقة";
    const h2s = [
      "الخطوة الأولى: احسب الأيض الأساسي (BMR)",
      "الخطوة الثانية: اضرب في معامل النشاط الصحيح",
      "الخطوة الثالثة: اطرح العجز المتوسط",
    ];
    const basis = topicalBasis(title, "nutrition", null, h2s);
    expect(
      orphanEntries(
        ["أفضل مكمل كرياتين للنساء", "تمارين هيت في المنزل"],
        basis,
      ),
    ).toEqual(["أفضل مكمل كرياتين للنساء", "تمارين هيت في المنزل"]);
    expect(
      orphanEntries(
        [
          "كم سعرة أحتاج يوميا لخسارة الوزن",
          "حساب الأيض الأساسي",
          "معامل النشاط في حساب السعرات",
        ],
        basis,
      ),
    ).toEqual([]);
  });

  it("morphological variants match across plural/article/proclitic chains", () => {
    const basis = topicalBasis(
      "للرياضيين والتدريب والتدرج مقيس بالنوم والسعرات",
      null,
      null,
    );
    expect(basis.has("رياضي")).toBe(true); // للرياضيين -> رياضيين -> رياضي
    expect(basis.has("تدرج")).toBe(true); // والتدرج -> التدرج -> تدرج
    expect(basis.has("نوم")).toBe(true); // بالنوم -> النوم -> نوم
    expect(basis.has("سعر")).toBe(true); // السعرات -> سعرات -> سعر
    // entry side: bare forms hit
    expect(orphanEntries(["الرياضيون يحتاجون تدرجًا"], basis)).toEqual([]);
    expect(orphanEntries(["نوم القيلولة والسعرات"], basis)).toEqual([]);
  });

  it("stopword tier: function words out, acronyms and topical 3-letter words stay", () => {
    const basis = topicalBasis("BFR with light loads and fat loss", null, "bfr");
    expect(basis.has("bfr")).toBe(true);
    expect(basis.has("fat")).toBe(true);
    expect(basis.has("with")).toBe(false);
    expect(basis.has("and")).toBe(false);
    expect(basis.has("the")).toBe(false);
  });

  it("pure-stopword/number-only entries are never reported", () => {
    const basis = topicalBasis(MAINT_TITLE, MAINT_CATEGORY, MAINT_FOCUS);
    expect(orphanEntries(["how to and the", "16/8", "؟"], basis)).toEqual([]);
  });
});

describe("keyword-tag-remediation.json — the committed patch", () => {
  const patch = JSON.parse(
    readFileSync(
      join(process.cwd(), "scripts", "blog-runner", "keyword-tag-remediation.json"),
      "utf8",
    ),
  ) as {
    entries: Array<{
      slug: string;
      language: "en" | "ar";
      keywords: string[];
      tags: string[];
    }>;
  };

  it("covers exactly the measured polluted set (131 rows, born-gated)", () => {
    expect(patch.entries.length).toBe(131);
    const keys = new Set(patch.entries.map((e) => `${e.slug}|${e.language}`));
    expect(keys.size).toBe(131); // no duplicates
    // spot members of every measured class
    expect(keys.has("calculate-maintenance-calories-muscle-gain|en")).toBe(true); // orphan-kw row
    expect(keys.has("sleep-muscle-growth-science|ar")).toBe(true); // orphan-tag row
    expect(keys.has("calculate-daily-calories-weight-loss|ar")).toBe(true); // zero-keyword row
  });

  it("every entry: shapes, no dupes, disjoint kw/tags, zero orphans vs its own basis snapshot", () => {
    // The measured worksheet (batch 13) — title + category + H2 snapshot per
    // row; the live channel re-validates against the row itself (wider).
    const worksheet = JSON.parse(
      readFileSync(
        join(process.cwd(), "scripts", "blog-runner", "keyword-tag-remediation-basis.json"),
        "utf8",
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as Record<string, { title: string; category: string | null; h2: string[] | null }>;

    for (const e of patch.entries) {
      const key = `${e.slug}|${e.language}`;
      const row = worksheet[key];
      expect(row, `worksheet basis missing for ${key}`).toBeTruthy();
      expect(e.keywords.length).toBeGreaterThanOrEqual(4);
      expect(e.keywords.length).toBeLessThanOrEqual(8);
      expect(e.tags.length).toBeGreaterThanOrEqual(3);
      expect(e.tags.length).toBeLessThanOrEqual(5);
      for (const k of e.keywords) {
        const w = k.trim().split(/\s+/).filter(Boolean).length;
        expect(w, `${key} kw word-count: ${k}`).toBeGreaterThanOrEqual(2);
        expect(w, `${key} kw word-count: ${k}`).toBeLessThanOrEqual(8);
      }
      for (const t of e.tags) {
        const w = t.trim().split(/\s+/).filter(Boolean).length;
        expect(w, `${key} tag word-count: ${t}`).toBeGreaterThanOrEqual(1);
        expect(w, `${key} tag word-count: ${t}`).toBeLessThanOrEqual(3);
      }
      expect(new Set(e.keywords).size, `${key} dup keywords`).toBe(e.keywords.length);
      expect(new Set(e.tags).size, `${key} dup tags`).toBe(e.tags.length);
      expect(
        e.keywords.filter((k) => e.tags.includes(k)),
        `${key} kw/tag overlap`,
      ).toEqual([]);
      if (e.language === "ar") {
        const text = [...e.keywords, ...e.tags].join(" ");
        const letters = text.replace(/[^\p{L}]/gu, "");
        // own-Latin-token tolerance (the live channel's rule): a Latin token
        // that appears in the row's own title/H2s (HIIT in the AR article's own
        // title) is the article's own vocabulary — only foreign tokens count.
        const own = new Set(
          ((row.title + " " + (row.h2 || []).join(" ")).match(/[A-Za-z]+/g) || []).map((t) => t.toLowerCase()),
        );
        const foreign = (text.match(/[A-Za-z]+/g) || []).filter(
          (t) => !own.has(t.toLowerCase()),
        );
        const foreignLetters = foreign.join("").replace(/[^A-Za-z]/g, "").length;
        expect(
          foreignLetters / letters.length,
          `${key} AR foreign-Latin ratio`,
        ).toBeLessThanOrEqual(0.05);
      }
      const basis = topicalBasis(row.title, row.category, null, row.h2 || []);
      expect(
        orphanEntries(e.keywords, basis),
        `${key} orphan keywords`,
      ).toEqual([]);
      expect(orphanEntries(e.tags, basis), `${key} orphan tags`).toEqual([]);
    }
  });
});
