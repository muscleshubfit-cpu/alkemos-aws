import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DIET_LEVELS, DIET_SYSTEMS } from "@/lib/diet-plan-matrix";
import {
  nearestDietLevel,
  dietPlanBridgeLinks,
} from "@/lib/diet-plan-bridge";

/**
 * ORGANIC-GROWTH-P0-C canary (owner order 2026-11-19 «نفّذ البند التالي
 * مباشرة من خطة التنفيذ» — docs/organic-growth-system-2026-11-18/
 * 10-prioritized-execution-roadmap.md): the calculators' result block must
 * open the «نتيجتك → خطتك الجاهزة» path (F-4 — the roadmap's highest-value
 * conversion path, dead at the result while 24 ready cells exist).
 *
 * Two layers, the repo's standard canary shape:
 *   1. LOGIC — the safe rounding (تقريب آمن لأقرب 100/200 سعرة بمستوياتنا
 *      الست) and the four link builders, as vitest units (the roadmap's
 *      mandated «وحدات vitest لمنطق التقريب»).
 *   2. SOURCE PINS — the wiring machine-checked in the two calculator
 *      sources and the component: the bridge renders INSIDE the first
 *      result container (the P0-A two-gate split signature preserved),
 *      the matching logic lives ONLY in the lib (single source — built
 *      from DIET_LEVELS/DIET_SYSTEMS, the same constants the 24 leaf
 *      routes generate from), the honesty note (أرقام الخطة من المصدر)
 *      is pinned byte-stable, and the GA4-ready click event follows the
 *      CopyButton precedent.
 */

const read = (p: string) => readFileSync(p, "utf8");

const CALCULATOR_PAGES = [
  "src/app/(en)/tools/calorie-calculator/page.tsx",
  "src/app/(en)/tools/macro-calculator/page.tsx",
] as const;

const COMPONENT = "src/components/DietPlanResultBridge.tsx";
const LIB = "src/lib/diet-plan-bridge.ts";

describe("ORGANIC-GROWTH-P0-C — the safe level matching (منطق التقريب)", () => {
  it("the roadmap's pinned example: 2,050 → the 2000 cells", () => {
    expect(nearestDietLevel(2050)).toBe(2000);
  });

  it("every published level maps to itself", () => {
    for (const level of DIET_LEVELS) {
      expect(nearestDietLevel(level)).toBe(level);
    }
  });

  it("the nearest level wins below the midpoints", () => {
    expect(nearestDietLevel(1250)).toBe(1200);
    expect(nearestDietLevel(1450)).toBe(1500);
    expect(nearestDietLevel(1750)).toBe(1800);
    expect(nearestDietLevel(2050)).toBe(2000);
    expect(nearestDietLevel(2200)).toBe(2000);
    expect(nearestDietLevel(2350)).toBe(2500);
    expect(nearestDietLevel(2750)).toBe(3000);
  });

  it("an exact tie rounds UP — never below the calculated target", () => {
    expect(nearestDietLevel(1350)).toBe(1500);
    expect(nearestDietLevel(1650)).toBe(1800);
    expect(nearestDietLevel(2250)).toBe(2500);
  });

  it("boundaries clamp to the published matrix", () => {
    expect(nearestDietLevel(100)).toBe(1200);
    expect(nearestDietLevel(1199)).toBe(1200);
    expect(nearestDietLevel(3001)).toBe(3000);
    expect(nearestDietLevel(9000)).toBe(3000);
  });

  it("invalid input renders no bridge (null — never a broken section)", () => {
    expect(nearestDietLevel(0)).toBeNull();
    expect(nearestDietLevel(-50)).toBeNull();
    expect(nearestDietLevel(Number.NaN)).toBeNull();
  });
});

describe("ORGANIC-GROWTH-P0-C — the four cell links (المصدر الوحيد)", () => {
  it("exactly four links, in the matrix's canonical system order", () => {
    const links = dietPlanBridgeLinks(2000, false);
    expect(links.map((l) => l.systemSlug)).toEqual(
      DIET_SYSTEMS.map((s) => s.slug),
    );
  });

  it("EN hrefs target the four real leaf cells", () => {
    const links = dietPlanBridgeLinks(2000, false);
    expect(links.map((l) => l.href)).toEqual([
      "/diet-plan/2000/balanced",
      "/diet-plan/2000/high-protein",
      "/diet-plan/2000/keto",
      "/diet-plan/2000/vegetarian",
    ]);
  });

  it("AR hrefs carry the /ar prefix (SEO-GEO-4 law)", () => {
    const links = dietPlanBridgeLinks(2000, true);
    expect(links.map((l) => l.href)).toEqual([
      "/ar/diet-plan/2000/balanced",
      "/ar/diet-plan/2000/high-protein",
      "/ar/diet-plan/2000/keto",
      "/ar/diet-plan/2000/vegetarian",
    ]);
  });

  it("every href at every level is a route the leaf pages actually publish", () => {
    const leafEn = read("src/app/(en)/diet-plan/[level]/[system]/page.tsx");
    const leafAr = read("src/app/(ar)/ar/diet-plan/[level]/[system]/page.tsx");
    // The 24 leaf routes are generated from the SAME constants the bridge
    // builds from — pin that both leaf generateStaticParams keep deriving
    // from them (a drifted matrix would break every bridge link).
    for (const leaf of [leafEn, leafAr]) {
      expect(leaf).toContain("DIET_LEVELS.flatMap");
      expect(leaf).toContain("from \"@/lib/diet-plan-matrix\"");
    }
    for (const level of DIET_LEVELS) {
      for (const isAr of [false, true]) {
        for (const link of dietPlanBridgeLinks(level, isAr)) {
          const path = link.href.replace(/^\/ar\/diet-plan\/|^\/diet-plan\//, "");
          const [levelPart, slugPart] = path.split("/");
          expect(DIET_LEVELS).toContain(Number(levelPart));
          expect(DIET_SYSTEMS.map((s) => s.slug)).toContain(slugPart);
        }
      }
    }
  });

  it("the anchors are built from the matrix's own name fields (single source)", () => {
    for (const level of DIET_LEVELS) {
      const links = dietPlanBridgeLinks(level, false);
      links.forEach((link, i) => {
        expect(link.labelAr).toBe(
          `خطة ${level} سعرة — ${DIET_SYSTEMS[i].nameAr}`,
        );
        expect(link.labelEn).toBe(
          `${level}-calorie ${DIET_SYSTEMS[i].nameEn} plan`,
        );
      });
    }
  });

  it("the lib carries NO hardcoded level list — it imports the matrix", () => {
    const src = read(LIB);
    expect(src).toContain('from "./diet-plan-matrix"');
    expect(src).toContain("DIET_LEVELS");
    expect(src).toContain("DIET_SYSTEMS");
    // No re-derived arithmetic constants: the levels are never spelled as
    // a literal array inside the bridge lib.
    expect(src).not.toMatch(/=\s*\[\s*1200\s*,/);
  });
});

describe("ORGANIC-GROWTH-P0-C — the calculator wiring (source pins)", () => {
  it.each(CALCULATOR_PAGES)(
    "the bridge renders inside the FIRST result container, before the commercial CTA (%s)",
    (file) => {
      const src = read(file);
      expect(src).toContain(
        'import { DietPlanResultBridge } from "@/components/DietPlanResultBridge";',
      );
      // The P0-A split signature is PRESERVED: exactly two result gates,
      // the memberships CTA between them — the bridge joins the FIRST
      // gate (it is result-dependent by design, the roadmap's «بعد
      // النتيجة»), never a third gate.
      const gates = [...src.matchAll(/\{result && \(/g)];
      expect(gates.length).toBe(2);
      const bridgeIdx = src.indexOf("<DietPlanResultBridge");
      expect(bridgeIdx).toBeGreaterThan(gates[0].index!);
      expect(bridgeIdx).toBeLessThan(gates[1].index!);
      const ctaIdx = src.indexOf('href={isAr ? "/ar/memberships" : "/memberships"}');
      // Value first (law 413): the bridge follows the result cards and
      // precedes the commercial CTA.
      expect(bridgeIdx).toBeLessThan(ctaIdx);
    },
  );

  it("the calorie calculator passes its computed target", () => {
    const src = read(CALCULATOR_PAGES[0]);
    expect(src).toContain("calories={result.target}");
    expect(src).toContain('source="calorie-calculator"');
  });

  it("the macro calculator passes the SNAPSHOT of the calculated number — not the live input", () => {
    const src = read(CALCULATOR_PAGES[1]);
    // `cal` snapshots the number the visible macros were computed from
    // (editing the input without recalculating must not move the links).
    expect(src).toContain("cal: number;");
    expect(src).toContain("setResult({\n      cal,");
    expect(src).toContain("calories={result.cal}");
    expect(src).toContain('source="macro-calculator"');
  });

  it("the AR mirrors still re-export the bilingual EN sources (12 surfaces law)", () => {
    expect(read("src/app/(ar)/ar/tools/calorie-calculator/page.tsx")).toContain(
      'export { default } from "@/app/(en)/tools/calorie-calculator/page";',
    );
    expect(read("src/app/(ar)/ar/tools/macro-calculator/page.tsx")).toContain(
      'export { default } from "@/app/(en)/tools/macro-calculator/page";',
    );
  });
});

describe("ORGANIC-GROWTH-P0-C — the component contract (source pins)", () => {
  it("the matching logic lives ONLY in the lib — the component delegates", () => {
    const src = read(COMPONENT);
    expect(src).toContain(
      'from "@/lib/diet-plan-bridge"',
    );
    expect(src).toContain("nearestDietLevel(calories)");
    expect(src).toContain("dietPlanBridgeLinks(level, isAr)");
    // No local rounding re-implementation in the component (the note's
    // «1200–3000» range is the pinned legal text, not matching logic) —
    // and it never imports the matrix directly: only through the lib.
    expect(src).not.toContain("Math.abs");
    expect(src).not.toContain("@/lib/diet-plan-matrix");
    expect(src).not.toContain("./diet-plan-matrix");
  });

  it("the guard: invalid level renders nothing", () => {
    const src = read(COMPONENT);
    expect(src).toContain("if (!level) return null;");
  });

  it("the heading pair and the roadmap style are pinned byte-stable", () => {
    const src = read(COMPONENT);
    expect(src).toContain('"خطة يوم كاملة بسعراتك"');
    expect(src).toContain('"A full day plan at your calories"');
  });

  it("the legal acceptance text (أرقام الخطة من المصدر) is pinned in both languages", () => {
    const src = read(COMPONENT);
    expect(src).toContain(
      "الخطط الجاهزة تُنشر بمستويات ثابتة (1200–3000 سعرة) ويُقرَّب رقمك إلى أقرب مستوى منشور؛ أرقام كل خطة النهائية بالغرامات والسعرات تُعرض من صفحة الخطة نفسها.",
    );
    expect(src).toContain(
      "The ready-made plans are published at fixed levels (1200–3000 calories) and your number is rounded to the nearest published level; each plan's final grams and calories are shown on the plan's own page.",
    );
    // The sub-line prints the ACTUAL matched level (honesty law §12.50).
    expect(src).toContain("أقرب مستوى منشور لنتيجتك: ${level} سعرة في اليوم.");
    expect(src).toContain(
      "The nearest published level to your result: ${level} calories a day.",
    );
  });

  it("GA4-ready clicks: the CopyButton precedent (gtag → dataLayer → never break UX)", () => {
    const src = read(COMPONENT);
    expect(src).toContain('"diet_plan_bridge_click"');
    expect(src).toContain('typeof w.gtag === "function"');
    expect(src).toContain("Array.isArray(w.dataLayer)");
    expect(src).toContain("analytics must NEVER break navigation");
  });

  it("the links are next/link anchors (soft-nav, the P0-A/P0-B bridge pattern)", () => {
    const src = read(COMPONENT);
    expect(src).toContain('import Link from "next/link";');
    expect(src).not.toContain("navigate(");
  });
});
