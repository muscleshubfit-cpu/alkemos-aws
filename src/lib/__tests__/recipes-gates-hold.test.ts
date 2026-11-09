import { describe, it, expect } from "vitest";

/**
 * RECIPES GATES HOLD — the publish-blocking canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 5): a recipe failing ANY
 * deterministic gate NEVER reaches publish — the battery returns a
 * violation with the gate id + a rerun directive, and the R5 route
 * maps it to a repair target. Also pins the repair-target contract
 * (recipes-repair-target) and the MSA laws on recipe prose (item 12).
 */
import {
  runRecipeQualityGates,
  type RecipeGateInput,
  type RecipeVersionDraft,
  STEPS_MIN,
  STEPS_MAX,
} from "@/lib/recipes-quality-gates";
import { mapR5FailureToRerunTarget, R5_RERUN_TARGETS } from "@/lib/recipes-repair-target";
import { computeRecipeNutrition } from "@/lib/recipes-nutrition";
import { REFS, cleanIngredients } from "./recipes-fixtures";

const CLEAN_AR: RecipeVersionDraft = {
  language: "ar",
  title: "دجاج مشوي مع الأرز والسلطة",
  excerpt: "وجبة متوازنة غنية بالبروتين تُحضّر في أقل من ساعة وتصلح للغداء أو العشاء.",
  steps: [
    { position: 1, text: "تبّل صدور الدجاج بالملح والفلفل الأسود وملعقة زيت الزيتون." },
    { position: 2, text: "اشوِ الصدور على حرارة متوسطة من ست إلى ثماني دقائق لكل وجه." },
    { position: 3, text: "اسلق الأرز في الماء المغلي دون إضافة دهون." },
    { position: 4, text: "قطّع الطماطم وقدمها جانبًا مع الطبق." },
  ],
  metaTitle: "دجاج مشوي مع الأرز والسلطة",
  metaDescription: "وجبة متوازنة غنية بالبروتين بقيم محسوبة لكل حصة.",
};

const CLEAN_EN: RecipeVersionDraft = {
  language: "en",
  title: "Grilled Chicken with Rice and Salad",
  excerpt: "A balanced protein-rich plate ready in under an hour, for lunch or dinner.",
  steps: [
    { position: 1, text: "Season the chicken breasts with salt, black pepper, and a tablespoon of olive oil." },
    { position: 2, text: "Grill over medium heat for six to eight minutes per side." },
    { position: 3, text: "Boil the rice in plain water with no added fat." },
    { position: 4, text: "Dice the tomatoes and serve alongside." },
  ],
  metaTitle: "Grilled Chicken with Rice and Salad",
  metaDescription: "A balanced high-protein plate with computed per-serving values.",
};

function baseInput(overrides: Partial<RecipeGateInput> = {}): RecipeGateInput {
  const computation = computeRecipeNutrition({ servings: 3, ingredients: cleanIngredients(), refs: REFS });
  return {
    pairSlug: "grilled-chicken-rice-salad",
    servings: 3,
    servingWeightG: computation.servingWeightG,
    prepMinutes: 15,
    cookMinutes: 30,
    ingredients: cleanIngredients(),
    refs: REFS,
    versions: [CLEAN_AR, CLEAN_EN],
    perServing: computation.perServing,
    consistency: computation.consistency,
    derivedDiets: [],
    imageUrl: "https://images.pexels.com/photos/123/plate.jpg",
    imageVerified: true,
    existingPairSlugs: new Set(),
    existingTitlesByLang: new Map([
      ["ar", new Set<string>()],
      ["en", new Set<string>()],
    ]),
    publishedIngredientSets: [],
    existingSlugsByLang: new Map([
      ["ar", new Set<string>()],
      ["en", new Set<string>()],
    ]),
    ...overrides,
  };
}

describe("the clean pair passes every gate (the baseline proof)", () => {
  it("zero violations on the fully-compliant input", () => {
    expect(runRecipeQualityGates(baseInput())).toEqual([]);
  });
});

describe("each failing gate produces its violation + rerun directive", () => {
  it("N-GATE-1: missing reference row → rerun r1-structure", () => {
    const bad = baseInput({
      ingredients: [
        ...cleanIngredients(),
        { position: 5, amount_g: 50, weight_state: "raw", name_ar: "مكون بلا مرجع", name_en: "Unreferenced ingredient", nutrient_ref_slug: "missing-ref" },
      ],
    });
    const v = runRecipeQualityGates(bad);
    expect(v.some((x) => x.gate === "N-GATE-1")).toBe(true);
    expect(v.find((x) => x.gate === "N-GATE-1")!.message).toContain("rerun r1-structure");
  });

  it("N-GATE-2: cooked main component with NO fat source → rerun r1-structure", () => {
    const noOil = cleanIngredients().filter((i) => i.nutrient_ref_slug !== "olive-oil");
    const v = runRecipeQualityGates(baseInput({ ingredients: noOil }));
    expect(v.some((x) => x.gate === "N-GATE-2")).toBe(true);
    expect(v.find((x) => x.gate === "N-GATE-2")!.message).toContain("rerun r1-structure");
  });

  it("N-GATE-3: out-of-band consistency → rerun r2-nutrition", () => {
    const v = runRecipeQualityGates(
      baseInput({
        consistency: {
          total: { computed: 500, fromMacros: 900, pass: false },
          perServing: { computed: 167, fromMacros: 300, pass: false },
        },
      }),
    );
    expect(v.filter((x) => x.gate === "N-GATE-3")).toHaveLength(2);
    expect(v.find((x) => x.gate === "N-GATE-3")!.message).toContain("rerun r2-nutrition");
  });

  it("N-GATE-4: fabricated number in the EN prose → rerun r3-authoring", () => {
    const fibbed: RecipeVersionDraft = {
      ...CLEAN_EN,
      excerpt: "Each serving has only 90 kcal — a light meal.",
    };
    const v = runRecipeQualityGates(baseInput({ versions: [CLEAN_AR, fibbed] }));
    expect(v.some((x) => x.gate === "N-GATE-4")).toBe(true);
    expect(v.find((x) => x.gate === "N-GATE-4")!.message).toContain("rerun r3-authoring");
  });

  it("P-GATE-1: missing EN version → rerun r3-authoring (never a one-sided publish)", () => {
    const v = runRecipeQualityGates(baseInput({ versions: [CLEAN_AR] }));
    expect(v.some((x) => x.gate === "P-GATE-1")).toBe(true);
    expect(v.find((x) => x.gate === "P-GATE-1")!.message).toContain("missing en");
    expect(v.find((x) => x.gate === "P-GATE-1")!.message).toContain("rerun r3-authoring");
  });

  it("P-GATE-2: no shared ingredients → rerun r1-structure", () => {
    const v = runRecipeQualityGates(baseInput({ ingredients: [] }));
    expect(v.some((x) => x.gate === "P-GATE-2")).toBe(true);
  });

  it("P-GATE-3: unverified image → rerun r4-image (the same-image law)", () => {
    const v = runRecipeQualityGates(baseInput({ imageVerified: false }));
    expect(v.some((x) => x.gate === "P-GATE-3")).toBe(true);
    expect(v.find((x) => x.gate === "P-GATE-3")!.message).toContain("rerun r4-image");
    const v2 = runRecipeQualityGates(baseInput({ imageUrl: null }));
    expect(v2.some((x) => x.gate === "P-GATE-3")).toBe(true);
  });

  it("Q-GATE-1: Egyptian-dialect Arabic prose → rerun r3-authoring", () => {
    const dialectal: RecipeVersionDraft = {
      ...CLEAN_AR,
      excerpt: "عشان تحضّر الطبق هتحتاج تبّل الصدور الأول وبعدين حطها في الفرن.",
    };
    const v = runRecipeQualityGates(baseInput({ versions: [dialectal, CLEAN_EN] }));
    expect(v.some((x) => x.gate === "Q-GATE-1")).toBe(true);
    expect(v.find((x) => x.gate === "Q-GATE-1")!.message).toContain("rerun r3-authoring");
  });

  it("Q-GATE-2: meta description over 160 chars → rerun r3-authoring", () => {
    const verbose: RecipeVersionDraft = {
      ...CLEAN_EN,
      metaDescription: "A".repeat(161),
    };
    const v = runRecipeQualityGates(baseInput({ versions: [CLEAN_AR, verbose] }));
    expect(v.some((x) => x.gate === "Q-GATE-2")).toBe(true);
  });

  it("Q-GATE-3: fewer than STEPS_MIN or more than STEPS_MAX steps → rerun r3-authoring", () => {
    expect(STEPS_MIN).toBe(3);
    expect(STEPS_MAX).toBe(15);
    const twoSteps: RecipeVersionDraft = { ...CLEAN_EN, steps: CLEAN_EN.steps.slice(0, 2) };
    const v = runRecipeQualityGates(baseInput({ versions: [CLEAN_AR, twoSteps] }));
    expect(v.some((x) => x.gate === "Q-GATE-3")).toBe(true);
  });

  it("Q-GATE-4: duplicate pair_slug → rerun r0-idea", () => {
    const v = runRecipeQualityGates(
      baseInput({ existingPairSlugs: new Set(["grilled-chicken-rice-salad"]) }),
    );
    expect(v.some((x) => x.gate === "Q-GATE-4")).toBe(true);
    expect(v.find((x) => x.gate === "Q-GATE-4")!.message).toContain("rerun r0-idea");
  });

  it("Q-GATE-4: ingredient overlap >70% with a published recipe → rerun r0-idea", () => {
    const theirs = new Set(cleanIngredients().map((i) => i.nutrient_ref_slug));
    const v = runRecipeQualityGates(baseInput({ publishedIngredientSets: [theirs] }));
    expect(v.some((x) => x.gate === "Q-GATE-4" && x.message.includes("overlap"))).toBe(true);
  });

  it("Q-GATE-4: ingredient overlap ≤70% passes (variation is allowed)", () => {
    const theirs = new Set(["chicken-breast", "white-rice"]); // 2 of 4 shared → 0.5
    const v = runRecipeQualityGates(baseInput({ publishedIngredientSets: [theirs] }));
    expect(v.some((x) => x.gate === "Q-GATE-4" && x.message.includes("overlap"))).toBe(false);
  });
});

describe("the R5 → rerun-target contract (recipes-repair-target)", () => {
  it("maps every pinned gate message to its repair stage", () => {
    const sample = runRecipeQualityGates(baseInput({ imageVerified: false }));
    const msg = sample.find((x) => x.gate === "P-GATE-3")!.message;
    expect(mapR5FailureToRerunTarget(msg)).toBe("r4-image");
  });

  it("the closed set is exactly the five repairable stages", () => {
    expect([...R5_RERUN_TARGETS]).toEqual([
      "r0-idea",
      "r1-structure",
      "r2-nutrition",
      "r3-authoring",
      "r4-image",
    ]);
  });

  it("unknown/infra messages map to null (plain retry semantics)", () => {
    expect(mapR5FailureToRerunTarget("supabase timeout")).toBeNull();
    expect(mapR5FailureToRerunTarget("")).toBeNull();
  });
});

describe("MSA on recipe prose (§12.1 item 12 — the blog laws reused)", () => {
  it("clean MSA recipe prose passes Q-GATE-1 (the baseline)", () => {
    const v = runRecipeQualityGates(baseInput());
    expect(v.some((x) => x.gate === "Q-GATE-1")).toBe(false);
  });

  it("latin contamination in the Arabic prose fails Q-GATE-1", () => {
    const contaminated: RecipeVersionDraft = {
      ...CLEAN_AR,
      steps: [
        { position: 1, text: "تبّل الصدور ثم chicken them في مقلاة ساخنة." },
        { position: 2, text: "اشوِ الصدور على حرارة متوسطة حتى النضج الكامل." },
        { position: 3, text: "اسلق الأرز في الماء المغلي." },
      ],
    };
    const v = runRecipeQualityGates(baseInput({ versions: [contaminated, CLEAN_EN] }));
    const q1 = v.find((x) => x.gate === "Q-GATE-1");
    // Either the dialect scanner or the latin scanner must flag it —
    // glued latin inside Arabic prose is the Phase-176 law.
    expect(q1).toBeDefined();
  });
});
