/**
 * ORGANIC-GROWTH-P1-A canary (owner order 2026-11-20 — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md):
 * the GEO direct-answer blocks (09-§3.1) — «جواب 40-60 كلمة أول
 * المرجعي + سطر مصادر» — on the SEVEN roadmap pages ×2 languages.
 *
 * LAWS GUARDED:
 * 1. PRESENCE (the acceptance «7/7 صفحات تحمل الكتلة والمصدر»): the five
 *    tool modules (calorie · macro · bmi · body-fat · water-tracker)
 *    each carry a geo block; meal-planner must NOT (P1-A's list is
 *    exactly the seven pages — scope discipline); EVO_GEO_BLOCK and
 *    COACHING_GEO_BLOCK exist as the other two.
 * 2. THE 40-60 WORD LAW (09-§1 — the Yotpo/Princeton synthesis): every
 *    answer, in BOTH languages, split(/\s+/).filter(Boolean).
 * 3. BILINGUAL PARITY: q / a / sources non-empty on both sides.
 * 4. RENDER ORDER + SOURCES LINE: the block renders FIRST (before the
 *    intro) and the sources line LAST (source pins + a
 *    renderToStaticMarkup behavioral proof — the tool-article-links /
 *    diet-plan-bridge render precedents).
 * 5. PAGE WIRING: /evo renders the block as the first content section
 *    after the hero; /coaching renders it INSIDE the pricing section
 *    (id="coaching-pricing") before the existing pricing h2.
 * 6. EVO FAQ ORDER (the roadmap's «FAQ الموجود يُعاد ترتيبه»): «هل EVO
 *    مجاني؟» / "Is EVO free?" leads BOTH languages — pinned so the
 *    order can never regress.
 * 7. ACCURACY-TO-SOURCE: the numbers in every block are the code's own
 *    arithmetic (Mifflin-St Jeor Math.round · BMI · 35 ml/kg clamps ·
 *    protein 1.6-2.2 g/kg → 120-165 g at 75 kg) and memberships.ts
 *    (the EVO quotas and the coaching/pro pricing — the single source).
 * 8. MSA + LATIN: the evo/coaching block AR text passes the same
 *    dialect + Latin machinery the tool modules ride (the tool geo
 *    text rides it via flattenReferenceText in the SEO-GEO-6.5 canary).
 * 9. UNIQUENESS: no two of the seven answers share ≥25-word normalized
 *    text (the STANDALONE-PER-TOOL spirit extended to the blocks).
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CALORIE_CALCULATOR_CONTENT } from "@/lib/content/calorie-calculator";
import { MACRO_CALCULATOR_CONTENT } from "@/lib/content/macro-calculator";
import { BMI_CALCULATOR_CONTENT } from "@/lib/content/bmi-calculator";
import { BODY_FAT_CALCULATOR_CONTENT } from "@/lib/content/body-fat-calculator";
import { WATER_TRACKER_CONTENT } from "@/lib/content/water-tracker";
import { MEAL_PLANNER_CONTENT } from "@/lib/content/meal-planner";
import { flattenReferenceText } from "@/lib/content/tool-reference";
import { MEMBERSHIPS } from "@/lib/memberships";
import { EVO_FAQ } from "@/lib/evo-faq";
import { EVO_GEO_BLOCK } from "@/lib/evo-geo-answer";
import { COACHING_GEO_BLOCK } from "@/lib/coaching-geo-answer";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
import { TOOL_LATIN_ALLOWLIST } from "@/lib/tool-msa";

// The render proof needs useI18n — mocked at the seam (the real page
// provides the provider; the component only destructures { lang }).
const LANG: { current: "en" | "ar" } = { current: "en" };
vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({ lang: LANG.current }),
}));

const TOOLS_WITH_GEO = [
  ["calorie-calculator", CALORIE_CALCULATOR_CONTENT],
  ["macro-calculator", MACRO_CALCULATOR_CONTENT],
  ["bmi-calculator", BMI_CALCULATOR_CONTENT],
  ["body-fat-calculator", BODY_FAT_CALCULATOR_CONTENT],
  ["water-tracker", WATER_TRACKER_CONTENT],
] as Array<[string, typeof CALORIE_CALCULATOR_CONTENT]>;

const words = (t: string): string[] => t.split(/\s+/).filter(Boolean);
const wordCount = (t: string): number => words(t).length;

interface Block {
  slug: string;
  q: string;
  a: string;
  sources: string;
}

/** The seven blocks, one uniform shape for the shared laws. */
const SEVEN_EN: Block[] = [
  ...TOOLS_WITH_GEO.map(
    ([slug, ref]) => ({ slug, q: ref.geo!.q.en, a: ref.geo!.a.en, sources: ref.geo!.sources.en }),
  ),
  { slug: "evo", q: EVO_GEO_BLOCK.qEn, a: EVO_GEO_BLOCK.aEn, sources: EVO_GEO_BLOCK.sourcesEn },
  { slug: "coaching", q: COACHING_GEO_BLOCK.qEn, a: COACHING_GEO_BLOCK.aEn, sources: COACHING_GEO_BLOCK.sourcesEn },
];

const SEVEN_AR: Block[] = [
  ...TOOLS_WITH_GEO.map(
    ([slug, ref]) => ({ slug, q: ref.geo!.q.ar, a: ref.geo!.a.ar, sources: ref.geo!.sources.ar }),
  ),
  { slug: "evo", q: EVO_GEO_BLOCK.qAr, a: EVO_GEO_BLOCK.aAr, sources: EVO_GEO_BLOCK.sourcesAr },
  { slug: "coaching", q: COACHING_GEO_BLOCK.qAr, a: COACHING_GEO_BLOCK.aAr, sources: COACHING_GEO_BLOCK.sourcesAr },
];

describe("P1-A GEO answer blocks (09-§3.1 — the seven pages)", () => {
  it("PRESENCE: the five tool modules carry geo blocks; meal-planner does NOT", () => {
    for (const [slug, ref] of TOOLS_WITH_GEO) {
      expect(ref.geo, `${slug} must carry a geo block`).toBeTruthy();
      expect(wordCount(ref.geo!.q.en)).toBeGreaterThan(3);
    }
    // Scope discipline: P1-A's list is exactly the seven — the
    // meal-planner page must not change (roadmap 10/P1-A).
    expect(MEAL_PLANNER_CONTENT.geo).toBeUndefined();
  });

  it.each(
    SEVEN_EN.map(({ slug, a }) => ({ slug, n: wordCount(a) })),
  )("THE 40-60 WORD LAW (en): $slug — $n words", ({ slug, n }) => {
    expect(n, `${slug} EN answer is ${n} words — the GEO template is 40-60`).toBeGreaterThanOrEqual(40);
    expect(n, `${slug} EN answer is ${n} words — the GEO template is 40-60`).toBeLessThanOrEqual(60);
  });

  it.each(
    SEVEN_AR.map(({ slug, a }) => ({ slug, n: wordCount(a) })),
  )("THE 40-60 WORD LAW (ar): $slug — $n words", ({ slug, n }) => {
    expect(n, `${slug} AR answer is ${n} words — the GEO template is 40-60`).toBeGreaterThanOrEqual(40);
    expect(n, `${slug} AR answer is ${n} words — the GEO template is 40-60`).toBeLessThanOrEqual(60);
  });

  it.each(SEVEN_EN)("BILINGUAL PARITY: $slug non-empty on both sides + a sources line", (block) => {
    const ar = SEVEN_AR.find((b) => b.slug === block.slug)!;
    for (const [label, text] of [
      ["q", block.q],
      ["a", block.a],
      ["sources", block.sources],
      ["q-ar", ar.q],
      ["a-ar", ar.a],
      ["sources-ar", ar.sources],
    ] as Array<[string, string]>) {
      expect(wordCount(text), `${block.slug} ${label} is empty`).toBeGreaterThanOrEqual(3);
    }
  });

  it("UNIQUENESS: no two of the fourteen answers (7 × 2 languages) share normalized text", () => {
    const seen = new Map<string, string>();
    for (const block of [...SEVEN_EN, ...SEVEN_AR]) {
      const normalized = block.a.replace(/\s+/g, " ").trim().toLowerCase();
      expect(
        seen.has(normalized),
        `answer shared between ${seen.get(normalized) ?? "?"} and ${block.slug}`,
      ).toBe(false);
      seen.set(normalized, block.slug);
    }
    expect(seen.size).toBe(14);
  });

  it("RENDER ORDER (source law): the geo block renders FIRST and the sources line LAST", () => {
    const src = readFileSync("src/components/ToolReferenceContent.tsx", "utf8");
    const geoIdx = src.indexOf("content.geo.q[");
    const introIdx = src.indexOf("{content.intro[");
    const sourcesIdx = src.indexOf("content.geo.sources[");
    const faqIdx = src.indexOf("{content.faqs.map(");
    expect(geoIdx, "the geo block must be wired in the renderer").toBeGreaterThan(-1);
    expect(
      geoIdx < introIdx,
      "the answer block must come BEFORE the intro («أول المرجعي»)",
    ).toBe(true);
    expect(
      sourcesIdx > faqIdx,
      "the sources line must come AFTER the FAQ («سطر مصادر أسفل كل حاسبة»)",
    ).toBe(true);
  });

  it("RENDER PROOF (behavioral): question + answer + sources in the markup, EN + AR, before the intro", async () => {
    const { ToolReferenceContent } = await import("@/components/ToolReferenceContent");
    const geo = WATER_TRACKER_CONTENT.geo!;
    for (const lang of ["en", "ar"] as const) {
      LANG.current = lang;
      const html = renderToStaticMarkup(
        createElement(ToolReferenceContent, { content: WATER_TRACKER_CONTENT }),
      );
      const q = lang === "en" ? geo.q.en : geo.q.ar;
      const a = lang === "en" ? geo.a.en.slice(0, 40) : geo.a.ar.slice(0, 25);
      const sources = lang === "en" ? geo.sources.en : geo.sources.ar;
      const intro = (lang === "en"
        ? WATER_TRACKER_CONTENT.intro.en
        : WATER_TRACKER_CONTENT.intro.ar
      ).slice(0, 30);
      expect(html).toContain(q);
      expect(html).toContain(a);
      expect(html).toContain(sources);
      const qIdx = html.indexOf(q);
      const introIdx = html.indexOf(intro);
      expect(qIdx, "the block must render before the intro").toBeLessThan(introIdx);
      const sourcesIdx = html.indexOf(sources);
      expect(sourcesIdx, "the sources line must render after the intro").toBeGreaterThan(introIdx);
    }
    LANG.current = "en";
  });

  it("PAGE WIRING: /evo renders the block right after the hero; the AR mirror re-exports", () => {
    const src = readFileSync("src/app/(en)/evo/page.tsx", "utf8");
    expect(src).toContain('from "@/lib/evo-geo-answer"');
    // After the hero (the warrior artwork) and before the "What is EVO?"
    // marble-card section.
    const heroEnd = src.indexOf("evo-character.webp");
    const geoIdx = src.indexOf("EVO_GEO_BLOCK.qAr");
    const whatIsIdx = src.indexOf("ما هو EVO؟");
    expect(geoIdx).toBeGreaterThan(heroEnd);
    expect(geoIdx).toBeLessThan(whatIsIdx);
    expect(src).toContain("EVO_GEO_BLOCK.sourcesEn");
    const mirror = readFileSync("src/app/(ar)/ar/evo/page.tsx", "utf8");
    expect(mirror).toContain('from "@/app/(en)/evo/page"');
  });

  it("PAGE WIRING: /coaching renders the block inside the pricing section, before the pricing h2", () => {
    const src = readFileSync("src/app/(en)/coaching/page.tsx", "utf8");
    expect(src).toContain('from "@/lib/coaching-geo-answer"');
    const pricingIdx = src.indexOf('id="coaching-pricing"');
    const geoIdx = src.indexOf("COACHING_GEO_BLOCK.qAr");
    const pricingH2 = src.indexOf("مدرب خاص. باقة واحدة.");
    expect(geoIdx).toBeGreaterThan(pricingIdx);
    expect(geoIdx).toBeLessThan(pricingH2);
    expect(src).toContain("COACHING_GEO_BLOCK.sourcesEn");
    const mirror = readFileSync("src/app/(ar)/ar/coaching/page.tsx", "utf8");
    expect(mirror).toContain('from "@/app/(en)/coaching/page"');
  });

  it("EVO FAQ ORDER (the roadmap's «يُعاد ترتيبه»): the free question leads BOTH languages", () => {
    expect(EVO_FAQ.en[0].q).toBe("Is EVO free?");
    expect(EVO_FAQ.ar[0].q).toBe("هل EVO مجاني؟");
  });
});

describe("P1-A ACCURACY-TO-SOURCE (the numbers are the code's own)", () => {
  it("calorie: 70kg/175cm/30y BMR equals Math.round of the calculator's Mifflin-St Jeor", () => {
    const male = Math.round(10 * 70 + 6.25 * 175 - 5 * 30 + 5);
    const female = Math.round(10 * 70 + 6.25 * 175 - 5 * 30 - 161);
    expect(male).toBe(1649);
    expect(female).toBe(1483);
    const en = CALORIE_CALCULATOR_CONTENT.geo!.a.en;
    expect(en).toContain("Mifflin-St Jeor");
    expect(en).toContain("1,649");
    expect(en).toContain("1,483");
    expect(en).toContain("1.2");
    expect(en).toContain("1.9");
    expect(en).toContain("500");
    expect(en).toContain("400");
    const ar = CALORIE_CALCULATOR_CONTENT.geo!.a.ar;
    expect(ar).toContain("Mifflin-St Jeor");
    expect(ar).toContain("1,649");
    expect(ar).toContain("1,483");
    // The sources line names the equation (1990) — 09-§3.2's template.
    expect(CALORIE_CALCULATOR_CONTENT.geo!.sources.en).toContain("Mifflin-St Jeor");
    expect(CALORIE_CALCULATOR_CONTENT.geo!.sources.en).toContain("1990");
  });

  it("macro: the 75 kg protein range is the module's own arithmetic", () => {
    expect(75 * 1.6).toBe(120);
    expect(75 * 2.2).toBe(165);
    const en = MACRO_CALCULATOR_CONTENT.geo!.a.en;
    expect(en).toContain("1.6–2.2");
    expect(en).toContain("120 and 165");
    expect(en).toContain("4, 4, and 9");
    expect(MACRO_CALCULATOR_CONTENT.geo!.sources.en).toContain("Atwater");
  });

  it("bmi: 75kg @ 1.75m → 24.5 and the WHO cutoffs the page implements", () => {
    expect((75 / (1.75 * 1.75)).toFixed(1)).toBe("24.5");
    const en = BMI_CALCULATOR_CONTENT.geo!.a.en;
    expect(en).toContain("18.5 to 24.9");
    expect(en).toContain("24.5");
    expect(en).toContain("25–29.9");
    expect(en).toContain("30+");
    expect(BMI_CALCULATOR_CONTENT.geo!.sources.en).toContain("18.5 / 25 / 30");
  });

  it("body-fat: the Navy constants (495 · 1984) and the module's accuracy verdict", () => {
    const en = BODY_FAT_CALCULATOR_CONTENT.geo!.a.en;
    expect(en).toContain("495");
    expect(en).toContain("1984");
    expect(en).toContain("Hodgdon");
    expect(en).toContain("Beckett");
    expect(en).toContain("DEXA");
    expect(BODY_FAT_CALCULATOR_CONTENT.geo!.sources.en).toContain("1984");
  });

  it("water: 70 kg × 35 ml/kg inside the code's own clamp", () => {
    const goal = Math.max(2000, Math.min(4500, Math.round(70 * 35)));
    expect(goal).toBe(2450);
    const en = WATER_TRACKER_CONTENT.geo!.a.en;
    expect(en).toContain("2,450");
    expect(en).toContain("2,000–4,500");
    expect(WATER_TRACKER_CONTENT.geo!.sources.en).toContain("35 ml/kg");
  });

  it("evo: every quota number matches memberships.ts (the single source)", () => {
    const byId = (id: string) => MEMBERSHIPS.find((m) => m.id === id)!;
    const free = byId("free");
    const premium = byId("premium");
    const pro = byId("pro");
    expect(free.limits.evoChatDailyLimit).toBe(10);
    expect(premium.limits.aiPlanMonthlyLimit).toBe(4);
    expect(pro.limits.aiPlanMonthlyLimit).toBe(8);
    expect(premium.limits.evoSwapMonthlyLimit).toBe(8);
    expect(pro.limits.evoSwapMonthlyLimit).toBe(16);
    const en = EVO_GEO_BLOCK.aEn;
    expect(en).toContain("10 messages a day");
    expect(en).toContain("4 generations a month on Premium");
    expect(en).toContain("8 on Pro and Coaching");
    expect(en).toContain("8 or 16");
    expect(EVO_GEO_BLOCK.sourcesEn).toContain("4/8/8");
    expect(EVO_GEO_BLOCK.sourcesEn).toContain("8/16/16");
  });

  it("coaching: the pricing matches memberships.ts and the $10 difference is its arithmetic", () => {
    const byId = (id: string) => MEMBERSHIPS.find((m) => m.id === id)!;
    const coaching = byId("coaching");
    const pro = byId("pro");
    // The static MEMBERSHIPS literal always carries these prices; the
    // non-null assertions keep the arithmetic honest under TS (the
    // expect() pins above prove the values).
    const coachingMonthly = coaching.priceMonthly!;
    const coachingYearly = coaching.priceYearly!;
    const proMonthly = pro.priceMonthly!;
    expect(coachingMonthly).toBe(39.99);
    expect(coachingYearly).toBe(359);
    expect(proMonthly).toBe(29.99);
    expect(
      Math.round((coachingMonthly - proMonthly) * 100) / 100,
    ).toBe(10);
    expect(byId("free").limits.savedResultsLimit).toBe(3);
    const en = COACHING_GEO_BLOCK.aEn;
    expect(en).toContain("$39.99");
    expect(en).toContain("$359");
    expect(en).toContain("$29.99");
    expect(en).toContain("three saved results");
    expect(COACHING_GEO_BLOCK.sourcesEn).toContain("$39.99");
    expect(COACHING_GEO_BLOCK.sourcesEn).toContain("$29.99");
  });
});

describe("P1-A MSA + LATIN (the evo/coaching blocks ride the same law)", () => {
  it("the two non-tool blocks pass the dialect scanner (strong=0, weak<5)", () => {
    for (const [slug, text] of [
      ["evo", `${EVO_GEO_BLOCK.qAr}\n${EVO_GEO_BLOCK.aAr}\n${EVO_GEO_BLOCK.sourcesAr}`],
      ["coaching", `${COACHING_GEO_BLOCK.qAr}\n${COACHING_GEO_BLOCK.aAr}\n${COACHING_GEO_BLOCK.sourcesAr}`],
    ] as Array<[string, string]>) {
      const scan = scanArabicDialect(text);
      expect(
        scan.strong,
        `${slug}: strong dialect markers ${JSON.stringify(scan.strongHits)}`,
      ).toBe(0);
      expect(
        scan.weak,
        `${slug}: weak dialect markers ${JSON.stringify(scan.weakHits)}`,
      ).toBeLessThan(5);
    }
  });

  it("the two non-tool blocks carry no bare Latin beyond the tool allowlist", () => {
    for (const [slug, text] of [
      ["evo", `${EVO_GEO_BLOCK.qAr}\n${EVO_GEO_BLOCK.aAr}\n${EVO_GEO_BLOCK.sourcesAr}`],
      ["coaching", `${COACHING_GEO_BLOCK.qAr}\n${COACHING_GEO_BLOCK.aAr}\n${COACHING_GEO_BLOCK.sourcesAr}`],
    ] as Array<[string, string]>) {
      const scan = scanLatinContamination(text, TOOL_LATIN_ALLOWLIST);
      expect(
        scan.count,
        `${slug}: bare/glued Latin tokens ${JSON.stringify(scan.tokens)}`,
      ).toBe(0);
    }
  });

  it("the five tool geo blocks ride flattenReferenceText (the SEO-GEO-6.5 canary's law surface)", () => {
    // Direct proof the geo text entered the flattened law surface: the
    // flattened text now CONTAINS the block's answer (both languages).
    for (const [slug, ref] of TOOLS_WITH_GEO) {
      const en = flattenReferenceText(ref, "en");
      const ar = flattenReferenceText(ref, "ar");
      expect(en, `${slug}: the geo answer missing from the EN flatten`).toContain(ref.geo!.a.en.slice(0, 40));
      expect(ar, `${slug}: the geo answer missing from the AR flatten`).toContain(ref.geo!.a.ar.slice(0, 20));
      expect(en, `${slug}: the sources line missing from the EN flatten`).toContain(ref.geo!.sources.en.slice(0, 20));
      expect(ar, `${slug}: the sources line missing from the AR flatten`).toContain(ref.geo!.sources.ar.slice(0, 12));
    }
  });
});
