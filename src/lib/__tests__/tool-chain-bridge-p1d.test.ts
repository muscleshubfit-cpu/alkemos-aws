import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
import {
  bmiChainSegment,
  bmiChainLinks,
  bodyFatChainLinks,
  bmiChainBridge,
  bodyFatChainBridge,
  BMI_CHAIN_HEALTHY_MIN,
  BMI_CHAIN_HEALTHY_MAX_BOUND,
} from "@/lib/tool-chain-bridge";

/**
 * ORGANIC-GROWTH-P1-D canary (owner order 2026-11-20 «نفّذ البند التالي
 * مباشرة من خطة التنفيذ» — docs/organic-growth-system-2026-11-18/
 * 10-prioritized-execution-roadmap.md): the BMI and body-fat results
 * must open the roadmap's CHAIN bridges (سلاسل منطقية — rule 06-§4.2
 * «لا نتيجة ميتة»):
 *
 *   - BMI  → the calorie calculator (07-§2 matrix row «نتيجة BMI →
 *     /tools/calorie-calculator»);
 *   - body-fat → the macro calculator + a QUIET coaching line (06-§2:
 *     obesity/cutting is explicit coaching intent).
 *
 * Acceptance «جسر واحد لكل نتيجة»: exactly ONE bridge per result — the
 * BMI card carries ONE tool link (no service line), the body-fat card
 * carries ONE tool link + ONE quiet service link inside the SAME single
 * bridge section. The repo's standard canary shape: LOGIC units, LINK
 * builders, COPY byte-pins, SOURCE wiring pins, the component contract,
 * real-route verification, and the MSA law on the new Arabic copy.
 */

const read = (p: string) => {
  const path = resolve(process.cwd(), p);
  expect(existsSync(path), `missing file: ${p}`).toBe(true);
  return readFileSync(path, "utf-8");
};

const TOOL_PAGES = {
  bmi: "src/app/(en)/tools/bmi-calculator/page.tsx",
  bodyFat: "src/app/(en)/tools/body-fat-calculator/page.tsx",
} as const;

const COMPONENT = "src/components/ToolChainResultBridge.tsx";
const LIB = "src/lib/tool-chain-bridge.ts";

const AR_MIRRORS = [
  ["src/app/(ar)/ar/tools/bmi-calculator/page.tsx", "@/app/(en)/tools/bmi-calculator/page"],
  ["src/app/(ar)/ar/tools/body-fat-calculator/page.tsx", "@/app/(en)/tools/body-fat-calculator/page"],
] as const;

/** Build the real route map from the app tree (the cta-crawlability
 *  precedent — a bridge link must resolve to a real route). */
function buildRoutes(root: string): Set<string> {
  const routes = new Set<string>();
  const walk = (dir: string, prefix: string) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        const seg = e.name.startsWith("(") ? "" : `/${e.name}`;
        walk(resolve(dir, e.name), `${prefix}${seg}`);
      } else if (e.name === "page.tsx") {
        routes.add(prefix || "/");
      }
    }
  };
  walk(resolve(process.cwd(), root), "");
  return routes;
}

describe("ORGANIC-GROWTH-P1-D — the BMI segment logic (سلاسل منطقية)", () => {
  it("the healthy-range thresholds mirror the BMI page's own category logic", () => {
    // The page's calculate() splits underweight/normal/overweight at the
    // same WHO boundaries the bridge segments on — pin both sides to the
    // same numbers (a drift on either breaks the chain's honesty).
    const src = read(TOOL_PAGES.bmi);
    expect(src).toContain("if (bmi < 18.5)");
    expect(src).toContain("} else if (bmi < 25)");
    expect(BMI_CHAIN_HEALTHY_MIN).toBe(18.5);
    expect(BMI_CHAIN_HEALTHY_MAX_BOUND).toBe(25);
  });

  it("segments: below / normal / above at the boundaries", () => {
    expect(bmiChainSegment(17.9)).toBe("below");
    expect(bmiChainSegment(18.4)).toBe("below");
    expect(bmiChainSegment(18.5)).toBe("normal");
    expect(bmiChainSegment(22)).toBe("normal");
    expect(bmiChainSegment(24.9)).toBe("normal");
    expect(bmiChainSegment(25)).toBe("above");
    expect(bmiChainSegment(30.1)).toBe("above");
  });

  it("invalid input renders no bridge (null — never a broken section)", () => {
    expect(bmiChainSegment(0)).toBeNull();
    expect(bmiChainSegment(-3)).toBeNull();
    expect(bmiChainSegment(Number.NaN)).toBeNull();
    expect(bmiChainBridge(0, false)).toBeNull();
    expect(bmiChainBridge(Number.NaN, true)).toBeNull();
  });
});

describe("ORGANIC-GROWTH-P1-D — the chain links (BMI→calorie · body-fat→macro/coaching)", () => {
  it("BMI: exactly ONE link — the calorie calculator, language-aware (07-§2 matrix row)", () => {
    expect(bmiChainLinks(false)).toEqual([
      {
        href: "/tools/calorie-calculator",
        destination: "calorie-calculator",
        kind: "tool",
        labelAr: "ابدأ بحاسبة السعرات",
        labelEn: "Start with the calorie calculator",
      },
    ]);
    expect(bmiChainLinks(true)[0].href).toBe("/ar/tools/calorie-calculator");
  });

  it("body-fat: the macro tool link + the coaching service link (the roadmap's destinations)", () => {
    expect(bodyFatChainLinks(false)).toEqual([
      {
        href: "/tools/macro-calculator",
        destination: "macro-calculator",
        kind: "tool",
        labelAr: "احسب توزيع الماكروز من سعراتك اليومية",
        labelEn: "Calculate your macros from your daily calories",
      },
      {
        href: "/coaching",
        destination: "coaching",
        kind: "service",
        labelAr: "التدريب الأونلاين",
        labelEn: "online coaching",
      },
    ]);
    expect(bodyFatChainLinks(true).map((l) => l.href)).toEqual([
      "/ar/tools/macro-calculator",
      "/ar/coaching",
    ]);
  });

  it("every href at both locales resolves to a REAL route on the app tree", () => {
    const routes = buildRoutes("src/app");
    for (const isAr of [false, true]) {
      for (const link of [...bmiChainLinks(isAr), ...bodyFatChainLinks(isAr)]) {
        expect(
          routes.has(link.href),
          `${link.href} is not a real route`,
        ).toBe(true);
      }
    }
  });

  it("the lib carries NO hardcoded href bodies — locales build from the isAr flag", () => {
    const src = read(LIB);
    expect(src).toContain('`${isAr ? "/ar" : ""}/tools/calorie-calculator`');
    expect(src).toContain('`${isAr ? "/ar" : ""}/tools/macro-calculator`');
    expect(src).toContain('`${isAr ? "/ar" : ""}/coaching`');
  });
});

describe("ORGANIC-GROWTH-P1-D — the copy (byte pins + honesty law §12.50)", () => {
  it("BMI: the roadmap message per segment — above/below ask, normal keeps", () => {
    const above = bmiChainBridge(27.5, false)!;
    expect(above.titleEn).toBe("Above the healthy range? Start with a targeted calorie plan");
    expect(above.titleAr).toBe("وزنك فوق المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة");
    const below = bmiChainBridge(17.2, false)!;
    expect(below.titleEn).toBe("Below the healthy range? Start with a targeted calorie plan");
    expect(below.titleAr).toBe("وزنك تحت المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة");
    const normal = bmiChainBridge(22, false)!;
    expect(normal.titleEn).toBe("In the healthy range — keep it there");
    expect(normal.titleAr).toBe("وزنك داخل المعدل الصحي — حافظ عليه");
  });

  it("BMI: every sub-line tells the honest chain (target by goal + the P0-C cells)", () => {
    for (const [bmi, goal] of [
      [27.5, "to reach a healthy weight"],
      [22, "to maintain your current weight"],
      [17.2, "for gaining weight with a moderate surplus"],
    ] as const) {
      const sub = bmiChainBridge(bmi, false)!.subEn;
      expect(sub).toContain(goal);
      expect(sub).toContain(
        "ready-made day plans at the calorie level closest to your number",
      );
    }
    // AR mirrors carry the same honest chain sentence.
    expect(bmiChainBridge(27.5, true)!.subAr).toContain(
      "خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى نتيجتك",
    );
  });

  it("body-fat: the doc's message in the site's vocabulary — the ESTIMATED lean mass needs protein", () => {
    const model = bodyFatChainBridge(false);
    expect(model.titleEn).toBe("Keep your muscle while cutting");
    expect(model.titleAr).toBe("حافظ على عضلاتك أثناء خسارة الدهون");
    expect(model.subEn).toContain("estimated lean mass");
    expect(model.subEn).toContain("enough daily protein");
    expect(model.subEn).toContain("macro calculator");
    expect(model.subEn).toContain("splits your daily calories");
    expect(model.subAr).toContain("المقدَّرة");
    expect(model.subAr).toContain("بروتينًا كافيًا يوميًا");
    expect(model.subAr).toContain("حاسبة الماكروز");
    expect(model.subAr).toContain("توزّع سعراتك اليومية");
    expect(model.serviceLeadEn).toBe("Or let a personal coach guide you step by step with");
    expect(model.serviceLeadAr).toBe("أو دع مدربًا خاصًا يرافقك خطوة بخطوة عبر");
  });

  it("honesty: no quota, price or plan-generation claims in the bridge copy", () => {
    const src = read(LIB) + read(COMPONENT);
    // The bridge must not invent numbers (memberships.ts is the only
    // price/quota source) nor promise generated plans (AI generation is
    // subscriber-only — AI-QUOTAS 2026-11-14).
    expect(src).not.toMatch(/\$\s?\d/);
    expect(src).not.toContain("مجانًا بالذكاء");
    expect(src).not.toContain("free plan generation");
    expect(src).not.toContain("خطة مجانية");
  });

  it("MSA law: the new Arabic copy carries zero dialect markers and zero bare Latin", () => {
    const arCopy = [
      "وزنك تحت المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة",
      "وزنك داخل المعدل الصحي — حافظ عليه",
      "وزنك فوق المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة",
      bmiChainBridge(27.5, true)!.subAr,
      bmiChainBridge(22, true)!.subAr,
      bmiChainBridge(17.2, true)!.subAr,
      bodyFatChainBridge(true).titleAr,
      bodyFatChainBridge(true).subAr,
      bodyFatChainBridge(true).serviceLeadAr,
      ...bmiChainLinks(true).map((l) => l.labelAr),
      ...bodyFatChainLinks(true).map((l) => l.labelAr),
      "الخطوة التالية بعد نتيجتك",
    ].join("\n");
    const dialect = scanArabicDialect(arCopy);
    expect(dialect.strong, JSON.stringify(dialect.strongHits)).toBe(0);
    expect(dialect.weak, JSON.stringify(dialect.weakHits)).toBe(0);
    // Zero bare Latin inside the Arabic copy (labels are Arabic-first).
    expect(scanLatinContamination(arCopy).count).toBe(0);
    expect(/[A-Za-z]/.test(arCopy)).toBe(false);
  });

  it("the stale-pin guard: every pinned string still exists verbatim in its source", () => {
    const lib = read(LIB);
    const comp = read(COMPONENT);
    for (const pinned of [
      "وزنك فوق المعدل الصحي؟ ابدأ بخطة سعرات مستهدفة",
      "حافظ على عضلاتك أثناء خسارة الدهون",
      "أو دع مدربًا خاصًا يرافقك خطوة بخطوة عبر",
      // Owner review 2026-11-20: the corrected honest copy is pinned too —
      // the estimate wording and the calories-based macro description.
      // (Language pass 2026-11-21: the macro anchor now reads «توزيع
      // الماكروز» — the suffixed-loanword form is banned by the language
      // guard below.)
      "كتلتك الصافية المقدَّرة تحتاج بروتينًا كافيًا يوميًا",
      "احسب توزيع الماكروز من سعراتك اليومية",
    ]) {
      expect(lib).toContain(pinned);
    }
    expect(comp).toContain("الخطوة التالية بعد نتيجتك");
    expect(comp).toContain('"Your next step after the result"');
  });
});

describe("ORGANIC-GROWTH-P1-D — the honesty guard (owner review 2026-11-20)", () => {
  /**
   * The owner's code review found two inaccurate claims in the original
   * P1-D copy; this block pins their correction so neither can return:
   *
   *  1. The body-fat page INFERS a weight (healthy-midpoint BMI 22) and
   *     derives fat/lean mass from it — the bridge must never call the
   *     lean mass «measured»; it says «estimated/المقدَّرة».
   *  2. The macro calculator's only inputs are DAILY CALORIES + DIET
   *     TYPE (it splits the calories by the diet preset ratios) — the
   *     bridge must never claim macros «by your weight and goal» nor
   *     promise protein-need computation from lean mass.
   */
  it("the bridge never calls the lean mass measured — it says estimated (both languages)", () => {
    const ar = bodyFatChainBridge(true);
    const en = bodyFatChainBridge(false);
    expect(ar.subAr).not.toContain("قِست");
    expect(en.subEn).not.toMatch(/\bmeasur/);
    expect(ar.subAr).toContain("المقدَّرة");
    expect(en.subEn).toContain("estimated");
    // The old claim phrases stay dead at the SOURCE level too.
    expect(read(LIB)).not.toContain("قِستَها");
    expect(read(LIB)).not.toContain("just measured");
    expect(read(LIB)).not.toContain("بوزنك وهدفك");
    expect(read(LIB)).not.toContain("for your weight and goal");
  });

  it("the macro link label matches the calculator's REAL inputs — calories, no protein-adequacy promise", () => {
    const [macro] = bodyFatChainLinks(false);
    expect(macro.labelAr).not.toContain("الكافي");
    expect(macro.labelEn).not.toContain("enough protein");
    expect(macro.labelAr).toContain("سعراتك اليومية");
    expect(macro.labelEn).toContain("daily calories");
    // The banned label stays dead at the SOURCE level.
    expect(read(LIB)).not.toContain("احسب ماكروزك بالبروتين الكافي");
    expect(read(LIB)).not.toContain("Calculate your macros with enough protein");
  });

  it("the bridge describes the macro calculator by its actual computation — calories split by diet, never weight/goal", () => {
    const ar = bodyFatChainBridge(true).subAr;
    const en = bodyFatChainBridge(false).subEn;
    expect(ar).not.toContain("بوزنك");
    expect(en).not.toContain("your weight");
    expect(ar).toContain("توزّع سعراتك اليومية");
    expect(ar).toContain("حسب نظامك الغذائي");
    expect(en).toContain("splits your daily calories");
    expect(en).toContain("diet type");
    // Cross-check the macro page's real code: calories × diet preset
    // ratios ARE the computation the copy describes.
    const macroPage = read("src/app/(en)/tools/macro-calculator/page.tsx");
    expect(macroPage).toContain("cal * preset.protein / 100");
    expect(macroPage).toContain("const DIET_PRESETS");
  });

  it("the body-fat page marks its fat/lean masses as estimates and pins the estimate basis", () => {
    const src = read(TOOL_PAGES.bodyFat);
    // The estimate basis the note describes is the REAL computation:
    // weight inferred at a healthy-midpoint BMI of 22.
    expect(src).toContain("estimatedWeight = 22 * heightM * heightM");
    // Both cards carry the estimate qualifier in both languages.
    expect(src).toContain("كتلة دهون (تقديرية)");
    expect(src).toContain("Fat mass (est.)");
    expect(src).toContain("كتلة صافية (تقديرية)");
    expect(src).toContain("Lean mass (est.)");
    // The note states the basis and denies a direct measurement.
    expect(src).toContain("تُحسب الكتلتان من وزن مقدَّر");
    expect(src).toContain("لا من قياس مباشر لجسمك");
    expect(src).toContain("not a direct body measurement");
    // The lead-capture summary carries the same qualifiers and never
    // relapses to the wrong «muscle mass» label for lean mass.
    expect(src).toContain("كتلة صافية (تقديرية): ${result.leanMass}");
    expect(src).toContain("Lean mass (est.): ${result.leanMass}");
    expect(src).not.toContain("كتلة عضلية");
  });
});

describe("ORGANIC-GROWTH-P1-D — the language pass (owner order 2026-11-21)", () => {
  /**
   * The owner's mandatory language review (2026-11-21): EVERY
   * user-visible P1-D string in BOTH languages — natural فصحى Arabic
   * (never colloquial, never a literal translation from the English,
   * never a clitic possessive attached to the transliterated loanword
   * — the owner's cited example: a suffixed «macros» reads like
   * slang, «توزيع الماكروز» is the فصيح form) and natural
   * professional English (never mechanical phrasing). The scientific
   * accuracy of the §10 honesty fix is untouched: the macro
   * calculator distributes calories by diet type; the lean mass stays
   * an ESTIMATE from a BMI-22 inferred weight — and the two facts are
   * now TWO separate sentences (a clear split between the estimate
   * and the tool's actual function).
   */
  it("the replaced Arabic and English phrasings stay dead at the source", () => {
    const lib = read(LIB);
    // Arabic: no clitic possessive on the loanword anywhere in the
    // bridge source (comments included — the class itself is banned).
    expect(lib).not.toContain("ماكروزك");
    // The clunky BMI sub-line forms the pass replaced.
    expect(lib).not.toContain("خطط يوم جاهزة");
    expect(lib).not.toContain("عند أقرب مستوى سعرات");
    // English: the mechanical phrasings the pass replaced.
    expect(lib).not.toContain("at the level nearest");
    expect(lib).not.toContain("gives your daily target");
    expect(lib).not.toContain("by your diet type");
  });

  it("the corrected phrasings are pinned live (both languages)", () => {
    const lib = read(LIB);
    expect(lib).toContain("احسب توزيع الماكروز من سعراتك اليومية");
    expect(lib).toContain("تحدد لك هدفك اليومي من السعرات");
    expect(lib).toContain("خططًا يومية جاهزة عند مستوى السعرات الأقرب إلى نتيجتك");
    expect(lib).toContain("works out your daily target");
    expect(lib).toContain("at the calorie level closest to your number");
    expect(lib).toContain("according to your diet type");
  });

  it("the lean-mass estimate and the macro calculator's function are TWO separate sentences", () => {
    // Arabic: period, not a dash — the estimate need and the tool's
    // real function never blend into one claim.
    expect(bodyFatChainBridge(true).subAr).toContain("خسارة الدهون. وحاسبة الماكروز");
    expect(bodyFatChainBridge(true).subAr).not.toContain("الدهون — حاسبة الماكروز");
    // English: the same two-sentence split.
    expect(bodyFatChainBridge(false).subEn).toContain("through fat loss. The macro calculator then splits");
    expect(bodyFatChainBridge(false).subEn).not.toContain("fat loss — the macro calculator");
  });
});

describe("ORGANIC-GROWTH-P1-D — the calculator wiring (source pins)", () => {
  it.each(Object.values(TOOL_PAGES))(
    "ONE bridge inside the FIRST result container, before the commercial CTA (%s)",
    (file) => {
      const src = read(file);
      expect(src).toContain(
        'import { ToolChainResultBridge } from "@/components/ToolChainResultBridge";',
      );
      // The P0-A split signature is PRESERVED: exactly two result gates,
      // the memberships CTA between them — the chain bridge joins the
      // FIRST gate (it is result-gated by design), never a third gate.
      const gates = [...src.matchAll(/\{result && \(/g)];
      expect(gates.length).toBe(2);
      const bridgeIdx = src.indexOf("<ToolChainResultBridge");
      expect(bridgeIdx).toBeGreaterThan(gates[0].index!);
      expect(bridgeIdx).toBeLessThan(gates[1].index!);
      const ctaIdx = src.indexOf('href={isAr ? "/ar/memberships" : "/memberships"}');
      // Value first (law 413): the chain bridge follows the result cards
      // and precedes the commercial CTA.
      expect(bridgeIdx).toBeLessThan(ctaIdx);
      // The acceptance «جسر واحد لكل نتيجة»: exactly ONE bridge element.
      expect(src.split("<ToolChainResultBridge").length - 1).toBe(1);
    },
  );

  it("the BMI page passes its computed BMI (the segment picks the message)", () => {
    const src = read(TOOL_PAGES.bmi);
    expect(src).toContain("bmi={result.bmi}");
    expect(src).toContain('source="bmi-calculator"');
  });

  it("the body-fat page passes its source (message is goal-agnostic)", () => {
    const src = read(TOOL_PAGES.bodyFat);
    expect(src).toContain('source="body-fat-calculator"');
    expect(src).not.toContain("bmi=");
  });

  it("the AR mirrors still re-export the bilingual EN sources (12 surfaces law)", () => {
    for (const [mirror, enPath] of AR_MIRRORS) {
      expect(read(mirror)).toContain(`export { default } from "${enPath}";`);
    }
  });
});

describe("ORGANIC-GROWTH-P1-D — the component contract (source pins)", () => {
  it("the segment logic, copy and links live ONLY in the lib — the component delegates", () => {
    const src = read(COMPONENT);
    expect(src).toContain('from "@/lib/tool-chain-bridge"');
    expect(src).toContain("bmiChainBridge(bmi, isAr)");
    expect(src).toContain("bodyFatChainBridge(isAr)");
    // No local threshold re-implementation and no local href literals.
    expect(src).not.toContain("18.5");
    expect(src).not.toContain("Math.");
    expect(src).not.toMatch(/href=\{?"/);
    expect(src).not.toContain("@/lib/diet-plan-bridge");
  });

  it("the guard: an invalid BMI (or a missing prop) renders nothing", () => {
    const src = read(COMPONENT);
    expect(src).toContain("if (!model) return null;");
    expect(src).toContain("bmi === undefined");
  });

  it("the tool links are pill buttons; the service link is ONE quiet line (07-§4.2)", () => {
    const src = read(COMPONENT);
    const lib = read(LIB);
    // Pills: the P0-C bridge recipe, on the tool links.
    expect(src).toContain("block rounded-full border border-[var(--edge)] bg-[var(--card)]");
    expect(src).toContain("model.toolLinks.map");
    // The quiet service line: the P0-E/P1-B faint-link recipe.
    expect(src).toContain("font-medium underline underline-offset-4 hover:text-[var(--text)]");
    expect(src).toContain("model.serviceLinks.map");
    // The tool/service split is filtered by KIND in the lib (the single
    // source) — the component never re-classifies.
    expect(lib).toContain('l.kind === "tool"');
    expect(lib).toContain('l.kind === "service"');
  });

  it("GA4-ready clicks: the diet_plan_bridge_click precedent (gtag → dataLayer → never break UX)", () => {
    const src = read(COMPONENT);
    expect(src).toContain('"tool_chain_bridge_click"');
    expect(src).toContain('typeof w.gtag === "function"');
    expect(src).toContain("Array.isArray(w.dataLayer)");
    expect(src).toContain("analytics must NEVER break navigation");
  });

  it("the links are next/link anchors (soft-nav, the P0-A/P0-C bridge pattern)", () => {
    const src = read(COMPONENT);
    expect(src).toContain('import Link from "next/link";');
    expect(src).not.toContain("navigate(");
  });
});
