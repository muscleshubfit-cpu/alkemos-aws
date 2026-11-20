/**
 * ORGANIC-GROWTH-P1-H canary (owner order 2026-11-20 — roadmap 10:
 * «توسيع FAQ الرقمية داخل المحتوى المرجعي (نمط bmi {N} · {N}g macros)
 * (06-§2/T2) … AEO مقيس النمط … قبول: 8+ أقسام قيمية للحاسبتين»).
 *
 * THE MEASURED PATTERNS THIS PINS (no invented demand — both documented):
 *   - BMI numeric-value tail: «bmi 20»→«bmi 43» at positions 72-86
 *     (GSC run 39152491179 — 06-§2/T2 + 02-§8; concrete examples
 *     "27.0 bmi" @72, "30.9 bmi" @78, "43 bmi" @77).
 *   - Macro food-weight pattern: «120g banana macros» @7.5 (02-§8) —
 *     served by reference content on the calculators, never a new page
 *     (the 02-§6 ownership rule: «قيم BMI الرقمية → bmi-calculator» ·
 *     «ماكروز … بالغرام → macro-calculator»).
 *
 * LAWS GUARDED:
 * 1. THE «bmi {N}» TEMPLATE: the BMI page carries SIX explicit value
 *    questions (20 · 25 · 27 · 30 · 40 · 43) spanning the measured tail
 *    20→43 — the roadmap's literal template «bmi {N} يعني ماذا؟».
 * 2. THE «{N}g {food}» TEMPLATE: the macro page answers the banana
 *    worked example with the SITE FOOD LIBRARY's own per-100 g values
 *    and its own default serving (120 g — the measured query's weight
 *    is the library's own banana default, not a coincidence to invent).
 * 3. THE PER-GRAM ITEM: 4/4/9 Atwater conversions computed in-test in
 *    both directions (no number copied from planning without arithmetic).
 * 4. THE ACCEPTANCE COUNT: ≥8 numeric-value FAQ items across the two
 *    calculators — the roadmap's literal «8+ أقسام قيمية للحاسبتين»
 *    (inventory: BMI 7 = six values + the 24.9/25.0 boundary · macro 4).
 * 5. ARITHMETIC-TO-PAGE: every kg figure in the new BMI answers is
 *    height-squared arithmetic (N × 1.75²) and every milestone is the
 *    page's documented 5–10% rule — computed here, byte-pinned there.
 * 6. NO-REGRESSION PINS: the four pre-existing numeric items (27 ·
 *    boundary · 30/40/30 · 2 g/kg) are pinned with distinctive answer
 *    fragments — the expansion ADDS, it never rewrites.
 * 7. UNIQUENESS: no 25-word normalized window shared between any two
 *    inventory answers (the STANDALONE-PER-TOOL spirit inside the
 *    numeric cluster — eleven items, zero boilerplate between them).
 * 8. RENDER: the new items are plain visible FAQ text — a
 *    renderToStaticMarkup proof (question in the markup, inside the
 *    FAQ section, ascending order) and NO FAQPage schema ever.
 * 9. MSA + LATIN: the seven new AR texts pass the same dialect +
 *    Latin machinery the modules ride (§12.25 law surface).
 */
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BMI_CALCULATOR_CONTENT } from "@/lib/content/bmi-calculator";
import { MACRO_CALCULATOR_CONTENT } from "@/lib/content/macro-calculator";
import type { FaqItem } from "@/lib/content/tool-reference";
import { FOODS } from "@/lib/foods";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
import { TOOL_LATIN_ALLOWLIST } from "@/lib/tool-msa";

// The render proof needs useI18n — mocked at the seam (the geo-blocks
// P1-A canary precedent: the real page provides the provider).
const LANG: { current: "en" | "ar" } = { current: "en" };
vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({ lang: LANG.current }),
}));

const bmiFaq = (enQ: string): FaqItem => {
  const hit = BMI_CALCULATOR_CONTENT.faqs.find((f) => f.q.en === enQ);
  if (!hit) throw new Error(`BMI FAQ not found: ${enQ}`);
  return hit;
};
const macroFaq = (enQ: string): FaqItem => {
  const hit = MACRO_CALCULATOR_CONTENT.faqs.find((f) => f.q.en === enQ);
  if (!hit) throw new Error(`macro FAQ not found: ${enQ}`);
  return hit;
};

/** The roadmap template — «bmi {N} يعني ماذا؟» in both languages. */
const bmiValueQ = (n: number) => ({
  en: `What does a BMI of ${n} mean?`,
  ar: `مؤشر ${n} يعني ماذا؟`,
});

// The six explicit values spanning the measured tail (20→43).
const BMI_VALUES = [20, 25, 27, 30, 40, 43] as const;

describe("P1-H — the «bmi {N}» template (06-§2/T2, the measured tail 20→43)", () => {
  it("six explicit value questions exist, both languages, roadmap template verbatim", () => {
    for (const n of BMI_VALUES) {
      const { en, ar } = bmiValueQ(n);
      expect(bmiFaq(en).q.ar, `${n}: the AR question must mirror the EN template`).toBe(ar);
    }
  });

  it("the values span the measured tail: 20 (its floor) through 43 (its documented example)", () => {
    expect(Math.min(...BMI_VALUES)).toBe(20);
    expect(Math.max(...BMI_VALUES)).toBe(43);
    // The concrete queries documented in the PRIORITY-PAGES comment
    // (27.0 @72 · 30.9 @78 · 43 @77) are each served literally — 30.9
    // reads the class-I threshold item at 30 — and the WHO ladder's
    // own thresholds (25 · 30 · 40) are all explicit items.
    expect(BMI_VALUES).toEqual(expect.arrayContaining([20, 27, 30, 43]));
    expect(BMI_VALUES).toEqual(expect.arrayContaining([25, 30, 40]));
  });

  it("ARITHMETIC-TO-PAGE: every kg figure is N × 1.75² (height-squared), both languages", () => {
    const H2 = 1.75 * 1.75; // 3.0625 — the page's own representative height
    const pins: Array<[number, string, string]> = [
      [20, "61.3 kg", "61.3 كجم"], // 20 × 3.0625 = 61.25 → 61.3
      [25, "76.6 kg", "76.6 كجم"], // 25 × 3.0625 = 76.5625 → 76.6
      [30, "91.9 kg", "91.9 كجم"], // 30 × 3.0625 = 91.875 → 91.9
      [40, "122.5 kg", "122.5 كجم"], // 40 × 3.0625 = 122.5
      [43, "131.7 kg", "131.7 كجم"], // 43 × 3.0625 = 131.6875 → 131.7
    ];
    for (const [n, enPin, arPin] of pins) {
      // The pinned figure IS the computed arithmetic (one decimal,
      // the page table's own rounding — 56.7/76.3 at 175 cm).
      expect((n * H2).toFixed(1), `${n} × 1.75²`).toBe(enPin.split(" ")[0]);
      const item = bmiFaq(bmiValueQ(n).en);
      expect(item.a.en, `${n} EN must carry its height-squared kg figure`).toContain(enPin);
      expect(item.a.ar, `${n} AR must carry its height-squared kg figure`).toContain(arPin);
    }
    // The 25 answer also carries the boundary arithmetic: 24.9 × 3.0625
    // = 76.26 → 76.3 (a 300-gram step from 25.0, the honest cliff-buster).
    expect((24.9 * H2).toFixed(1)).toBe("76.3");
    expect(bmiFaq(bmiValueQ(25).en).a.en).toContain("76.3 kg");
    expect(bmiFaq(bmiValueQ(25).en).a.ar).toContain("76.3 كجم");
  });

  it("ARITHMETIC-TO-PAGE: the milestones are the page's own 5–10% rule, computed here", () => {
    // Decimal-safe one-figure rounding (Math.round on the scaled value
    // — toFixed on 6.585 float-dips to 6.5; the content's 6.6 is the
    // exact decimal half-up).
    const f1 = (x: number) => Math.round(x * 10) / 10;
    const rule = (kg: number) => [kg * 0.05, kg * 0.1];
    // 25 @ 76.5 kg → 3.8–7.7 · 30 @ 92 kg → 4.6–9.2 · 40 @ 122.5 → 6–12
    // · 43 @ 131.7 → 6.6–13.2
    expect(rule(76.5).map(f1)).toEqual([3.8, 7.7]);
    expect(rule(92).map(f1)).toEqual([4.6, 9.2]);
    expect([Math.round(122.5 * 0.05), Math.round(122.5 * 0.1)]).toEqual([6, 12]);
    expect(rule(131.7).map(f1)).toEqual([6.6, 13.2]);
    for (const [n, enPin, arPin] of [
      [25, "3.8–7.7 kg", "3.8–7.7 كجم"],
      [30, "4.6–9.2 kg", "4.6–9.2 كجم"],
      [40, "6–12 kg", "6–12 كجم"],
      [43, "6.6–13.2 kg", "6.6–13.2 كجم"],
    ] as Array<[number, string, string]>) {
      expect(bmiFaq(bmiValueQ(n).en).a.en, `${n} EN milestone`).toContain(enPin);
      expect(bmiFaq(bmiValueQ(n).en).a.ar, `${n} AR milestone`).toContain(arPin);
    }
  });

  it("the 43 answer works the distance arithmetic: (43 − 24.9) × 3.0625 ≈ 55 kg", () => {
    expect(Math.round((43 - 24.9) * (1.75 * 1.75))).toBe(55);
    const item = bmiFaq(bmiValueQ(43).en);
    expect(item.a.en).toContain("55 kg");
    expect(item.a.ar).toContain("55 كجم");
  });

  it("each new BMI answer names its WHO band (the calculator's own scale)", () => {
    const bands: Record<number, [string, string]> = {
      20: ["healthy band", "نطاق الصحة"],
      25: ["overweight band", "نطاق زيادة الوزن"],
      30: ["obesity", "للسمنة"],
      40: ["severe) obesity", "السمنة المفرطة"],
      43: ["class III obesity", "السمنة المفرطة"],
    };
    for (const [n, enNeedle, arNeedle] of Object.entries(bands).map(
      ([k, v]) => [Number(k), v[0], v[1]] as [number, string, string],
    )) {
      const item = bmiFaq(bmiValueQ(n).en);
      expect(item.a.en, `${n} EN band`).toContain(enNeedle);
      expect(item.a.ar, `${n} AR band`).toContain(arNeedle);
    }
  });
});

describe("P1-H — the «{N}g {food}» pattern (02-§8: «120g banana macros» @7.5)", () => {
  const BANANA_Q_EN =
    "How do I work out the macros of 120 g of banana — or any food at any weight?";

  it("the measured query's weight IS the food library's own banana default serving", () => {
    const banana = FOODS.find((f) => f.slug === "banana")!;
    expect(banana).toBeDefined();
    expect(banana.defaultGrams, "the library's banana default serving").toBe(120);
  });

  it("the worked numbers are the library's OWN per-100 g values × 1.2 — computed, not copied", () => {
    const banana = FOODS.find((f) => f.slug === "banana")!;
    // Pin the source values first (accuracy-to-source):
    expect(banana.per100g.calories).toBe(89);
    expect(banana.per100g.protein).toBe(1.1);
    expect(banana.per100g.carbs).toBe(23);
    expect(banana.per100g.fat).toBe(0.3);
    // Then the × 1.2 arithmetic the answer must carry:
    const scale = 120 / 100;
    expect(Math.round(banana.per100g.calories * scale)).toBe(107);
    expect((banana.per100g.protein * scale).toFixed(1)).toBe("1.3");
    expect(banana.per100g.carbs * scale).toBeCloseTo(27.6, 5);
    expect((banana.per100g.fat * scale).toFixed(1)).toBe("0.4");
    const item = macroFaq(BANANA_Q_EN);
    for (const needle of ["120 g", "89 kcal", "107 kcal", "1.3 g protein", "27.6 g", "0.4 g fat"]) {
      expect(item.a.en, `EN banana arithmetic: ${needle}`).toContain(needle);
    }
    for (const needle of ["120 غرامًا", "89 سعرة", "107 سعرات", "1.3 غرام بروتين", "27.6 غرام", "0.4 غرام دهون"]) {
      expect(item.a.ar, `AR banana arithmetic: ${needle}`).toContain(needle);
    }
  });

  it("the transferable example (chicken) is the page's own protein-table value", () => {
    // The reference table documents chicken breast 31 g/100 g — the
    // answer's 200 g → 62 g example must be that value scaled.
    expect(31 * (200 / 100)).toBe(62);
    const item = macroFaq(BANANA_Q_EN);
    expect(item.a.en).toContain("31 g per 100 g");
    expect(item.a.en).toContain("62 g of protein");
    expect(item.a.ar).toContain("31 غرامًا لكل 100");
    expect(item.a.ar).toContain("62 غرام بروتين");
  });

  it("the per-gram item carries the 4/4/9 Atwater arithmetic in both directions", () => {
    const item = macroFaq(
      "How many calories are in one gram of protein, carbohydrate, and fat?",
    );
    // Computed here from the module's own documented factors:
    expect(100 * 4).toBe(400);
    expect(200 * 4).toBe(800);
    expect(50 * 9).toBe(450);
    expect(600 / 4).toBe(150);
    expect(13 * 9).toBeCloseTo(117, 0); // the page's 120-kcal oil example
    for (const needle of ["Four, four, and nine", "Atwater", "400 kcal", "800 kcal", "450 kcal", "150 g", "120 kcal"]) {
      expect(item.a.en, `EN Atwater: ${needle}`).toContain(needle);
    }
    for (const needle of ["عوامل Atwater", "400 سعرة", "800 سعرة", "450 سعرة", "150 غرامًا", "120 سعرة"]) {
      expect(item.a.ar, `AR Atwater: ${needle}`).toContain(needle);
    }
  });
});

describe("P1-H — the acceptance count «8+ أقسام قيمية للحاسبتين»", () => {
  /** An inventory question list — deterministic, no loose regex. */
  const BMI_INVENTORY = [
    ...BMI_VALUES.map((n) => bmiValueQ(n).en),
    "Is BMI 24.9 to 25.0 a real boundary?",
  ];
  const MACRO_INVENTORY = [
    "What does 30/40/30 mean in grams on a 2,000-calorie day?",
    "My coach says 2 g of protein per kg — what percentage is that?",
    "How do I work out the macros of 120 g of banana — or any food at any weight?",
    "How many calories are in one gram of protein, carbohydrate, and fat?",
  ];

  it("every inventory item exists on its owning calculator (02-§6 mapping)", () => {
    for (const q of BMI_INVENTORY) {
      expect(BMI_CALCULATOR_CONTENT.faqs.some((f) => f.q.en === q), q).toBe(true);
    }
    for (const q of MACRO_INVENTORY) {
      expect(MACRO_CALCULATOR_CONTENT.faqs.some((f) => f.q.en === q), q).toBe(true);
    }
  });

  it(`BMI ${BMI_INVENTORY.length} + macro ${MACRO_INVENTORY.length} = ${BMI_INVENTORY.length + MACRO_INVENTORY.length} ≥ 8 (the literal acceptance)`, () => {
    expect(BMI_INVENTORY.length).toBe(7);
    expect(MACRO_INVENTORY.length).toBe(4);
    expect(BMI_INVENTORY.length + MACRO_INVENTORY.length).toBeGreaterThanOrEqual(8);
  });

  it("each inventory item has BOTH language sides non-empty (bilingual parity)", () => {
    for (const q of [...BMI_INVENTORY, ...MACRO_INVENTORY]) {
      const item =
        BMI_CALCULATOR_CONTENT.faqs.find((f) => f.q.en === q) ??
        macroFaq(q);
      expect(item.q.en.length).toBeGreaterThan(10);
      expect(item.q.ar.length).toBeGreaterThan(10);
      expect(item.a.en.length).toBeGreaterThan(40);
      expect(item.a.ar.length).toBeGreaterThan(40);
    }
  });

  it("UNIQUENESS: no 25-word window shared between any two inventory answers (per language)", () => {
    const windows = (text: string): Set<string> => {
      const words = text.replace(/\s+/g, " ").trim().toLowerCase().split(" ");
      const out = new Set<string>();
      for (let i = 0; i + 25 <= words.length; i++) {
        out.add(words.slice(i, i + 25).join(" "));
      }
      return out;
    };
    for (const lang of ["en", "ar"] as const) {
      const seen = new Map<string, string>();
      const items = [
        ...BMI_INVENTORY.map((q) => ["bmi", bmiFaq(q)] as const),
        ...MACRO_INVENTORY.map((q) => ["macro", macroFaq(q)] as const),
      ];
      for (const [tool, item] of items) {
        for (const w of windows(item.a[lang])) {
          const owner = `${tool}: ${item.q.en.slice(0, 40)}…`;
          expect(
            seen.has(w),
            `a 25-word window is shared between ${seen.get(w)} and ${owner} (${lang})`,
          ).toBe(false);
          seen.set(w, owner);
        }
      }
    }
  });
});

describe("P1-H — no-regression pins (the expansion adds, never rewrites)", () => {
  it("the pre-existing 27 answer is byte-intact (its 2026-10-19 pins untouched)", () => {
    const item = bmiFaq(bmiValueQ(27).en);
    expect(item.a.en).toContain("about 3.1 kg at 1.75 m");
    expect(item.a.ar).toContain("قرابة 3.1 كجم عند 1.75 متر");
  });

  it("the pre-existing boundary answer is byte-intact", () => {
    const item = bmiFaq("Is BMI 24.9 to 25.0 a real boundary?");
    expect(item.a.en).toContain("A BMI of 24.7 and 25.2 describe nearly identical bodies");
    expect(item.a.ar).toContain("مؤشر 24.7 و25.2 يصفان جسدين متطابقين تقريبًا");
  });

  it("the pre-existing macro numeric pair is byte-intact (seo-growth-p1 pins)", () => {
    const grams = macroFaq("What does 30/40/30 mean in grams on a 2,000-calorie day?");
    expect(grams.a.en).toContain("150 g");
    expect(grams.a.ar).toContain("150 غرامًا");
    const bridge = macroFaq(
      "My coach says 2 g of protein per kg — what percentage is that?",
    );
    expect(bridge.a.en).toContain("640 kcal");
    expect(bridge.a.ar).toContain("640 سعرة");
  });

  it("the FAQ depth bars still clear (the additions only add: 19 + 14)", () => {
    // Original 14 + 5 new BMI value items = 19; original 12 + 2 new
    // macro items = 14 (the ≥10/≥12 legal bars ride the module canary).
    expect(BMI_CALCULATOR_CONTENT.faqs.length).toBeGreaterThanOrEqual(19);
    expect(MACRO_CALCULATOR_CONTENT.faqs.length).toBeGreaterThanOrEqual(14);
  });
});

describe("P1-H — render proof + cluster order (visible plain text, never schema)", () => {
  it("RENDER: the new questions are in the served markup, both languages, in ascending order", async () => {
    const { ToolReferenceContent } = await import(
      "@/components/ToolReferenceContent"
    );
    for (const lang of ["en", "ar"] as const) {
      LANG.current = lang;
      const html = renderToStaticMarkup(
        createElement(ToolReferenceContent, { content: BMI_CALCULATOR_CONTENT }),
      );
      const positions = BMI_VALUES.map((n) =>
        html.indexOf(bmiValueQ(n)[lang]),
      );
      for (const pos of positions) {
        expect(pos, `${lang}: a value question missing from the markup`).toBeGreaterThan(-1);
      }
      expect(positions, `${lang}: the six values must render in ascending order`).toEqual(
        [...positions].sort((a, b) => a - b),
      );
      // Plain visible FAQ — no schema ever (§12.19 DO-NOT).
      expect(html).not.toContain("FAQPage");
      // The FAQ section heading anchors the cluster.
      expect(html).toContain('id="faq"');
    }
    LANG.current = "en";
  });

  it("RENDER: the macro banana + per-gram questions are in the served markup, both languages", async () => {
    const { ToolReferenceContent } = await import(
      "@/components/ToolReferenceContent"
    );
    for (const lang of ["en", "ar"] as const) {
      LANG.current = lang;
      const html = renderToStaticMarkup(
        createElement(ToolReferenceContent, { content: MACRO_CALCULATOR_CONTENT }),
      );
      const banana = macroFaq(
        "How do I work out the macros of 120 g of banana — or any food at any weight?",
      );
      const perGram = macroFaq(
        "How many calories are in one gram of protein, carbohydrate, and fat?",
      );
      expect(html.indexOf(banana.q[lang])).toBeGreaterThan(-1);
      expect(html.indexOf(perGram.q[lang])).toBeGreaterThan(-1);
      expect(html).not.toContain("FAQPage");
    }
    LANG.current = "en";
  });

  it("PAGE WIRING: both pages render their own module through the shared renderer", () => {
    const bmi = readFileSync("src/app/(en)/tools/bmi-calculator/page.tsx", "utf8");
    expect(bmi).toContain("BMI_CALCULATOR_CONTENT");
    expect(bmi).toContain("<ToolReferenceContent content={BMI_CALCULATOR_CONTENT} />");
    const macro = readFileSync("src/app/(en)/tools/macro-calculator/page.tsx", "utf8");
    expect(macro).toContain("MACRO_CALCULATOR_CONTENT");
    expect(macro).toContain("<ToolReferenceContent content={MACRO_CALCULATOR_CONTENT} />");
  });

  it("the BMI value cluster sits contiguous inside the FAQ array (template adjacency)", () => {
    const valueIdx = BMI_VALUES.map((n) =>
      BMI_CALCULATOR_CONTENT.faqs.findIndex((f) => f.q.en === bmiValueQ(n).en),
    );
    for (const idx of valueIdx) expect(idx).toBeGreaterThan(-1);
    // 20 → 25 → 27 → 30 → 40 → 43 in strict ascending array order.
    expect(valueIdx).toEqual([...valueIdx].sort((a, b) => a - b));
    expect(
      Math.max(...valueIdx) - Math.min(...valueIdx),
      "the six value items must sit adjacent (a 5-gap max)",
    ).toBe(BMI_VALUES.length - 1);
  });
});

describe("P1-H — MSA + Latin for the seven new AR texts", () => {
  const NEW_AR_TEXTS: Array<[string, string]> = [
    ...BMI_VALUES.filter((n) => n !== 27).map(
      (n) => [bmiValueQ(n).en, `${bmiValueQ(n).ar}\n${bmiFaq(bmiValueQ(n).en).a.ar}`] as [string, string],
    ),
    [
      "How do I work out the macros of 120 g of banana — or any food at any weight?",
      `${macroFaq("How do I work out the macros of 120 g of banana — or any food at any weight?").q.ar}\n${macroFaq("How do I work out the macros of 120 g of banana — or any food at any weight?").a.ar}`,
    ],
    [
      "How many calories are in one gram of protein, carbohydrate, and fat?",
      `${macroFaq("How many calories are in one gram of protein, carbohydrate, and fat?").q.ar}\n${macroFaq("How many calories are in one gram of protein, carbohydrate, and fat?").a.ar}`,
    ],
  ];

  it("every new AR text passes the dialect scanner (strong=0, weak<5)", () => {
    expect(NEW_AR_TEXTS).toHaveLength(7);
    for (const [label, text] of NEW_AR_TEXTS) {
      const scan = scanArabicDialect(text);
      expect(
        scan.strong,
        `${label}: strong dialect markers ${JSON.stringify(scan.strongHits)}`,
      ).toBe(0);
      expect(
        scan.weak,
        `${label}: weak dialect markers ${JSON.stringify(scan.weakHits)}`,
      ).toBeLessThan(5);
    }
  });

  it("every new AR text carries no bare Latin beyond the tool allowlist", () => {
    for (const [label, text] of NEW_AR_TEXTS) {
      const scan = scanLatinContamination(text, TOOL_LATIN_ALLOWLIST);
      expect(
        scan.count,
        `${label}: bare/glued Latin tokens ${JSON.stringify(scan.tokens)}`,
      ).toBe(0);
    }
  });
});
