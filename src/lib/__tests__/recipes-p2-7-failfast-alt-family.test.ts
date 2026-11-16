import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * P2-7 canaries (audit AI-GENERATION-PIPELINES 2026-11-15, plan §9 item 7 —
 * «رفع fail-late إلى fail-fast بالوصفات (REC-12) ومطابقة weightState (REC-5)
 * وصور alt عربية (REC-4) وعائلة الطبق للصور (REC-2)», owner order 2026-11-16
 * «نفّذ البند التالي غير المنفّذ بالكامل»).
 *
 * Pre-execution check (§3.1 — the CODE, not the docs): REC-5 and the FIRST
 * halves of REC-4/REC-12 were code-implemented by the P1 sweep (§12, commit
 * 2c8b1f48) — the weight-state conversion at computeRecipeNutrition + R1
 * prompt instruction 8 + the per-ingredient state lines in the R3 prompt;
 * the Arabic alt built from name_ar; the R3 early battery inside the retry
 * loop. THIS frame implements what remained: REC-2 (not implemented at all
 * — R4 passed mealType as the "dish family", so DISH_TYPE_KEYWORDS was never
 * consulted and altMatchesDish accepted the generic food/dish/meal/plate
 * plea words), the REC-4 second half (Q-GATE-1 never scanned the alt), the
 * REC-12 zod/gate alignment (the shared schema allowed metaTitle up to 90
 * while the gate clamps at 70 ar / 60 en), and the REC-5 regression shield
 * (the prompt/wiring sides had no canary). Every test below fails if its
 * pillar regresses.
 */

// ── the image-chain boundary (REC-2/REC-4): the mock records every query
// it is handed and answers from a programmable result queue, so the
// canaries assert on the REAL composite queries fetchRecipeImage builds
// and the REAL alt verification it applies. ──────────────────────────────
vi.mock("@/lib/blog-images", () => {
  const state = { queue: [] as Array<{ url: string; alt: string } | null> };
  const queries: string[] = [];
  return {
    __state: state,
    __queries: queries,
    getRecentFeaturedImageUrls: vi.fn(async () => [] as string[]),
    fetchFeaturedImageMultiQuery: vi.fn(
      async (qs: readonly string[]): Promise<{ url: string; alt: string; credit: string } | null> => {
        queries.push(...qs);
        const next = state.queue.shift() ?? null;
        return next ? { url: next.url, alt: next.alt, credit: "test" } : null;
      },
    ),
  };
});

// ── the AI-router boundary (REC-12/REC-5): the mock records every prompt
// and answers from a per-function programmable response (the P2-6
// prompt-capture pattern). ───────────────────────────────────────────────
vi.mock("@/lib/ai-router", () => {
  const state = {
    nextByFn: {} as Record<string, unknown>,
    prompts: [] as Array<{ fnId: string; prompt: string }>,
  };
  return {
    __state: state,
    dispatchAI: vi.fn(async (fnId: string, prompt: string) => {
      state.prompts.push({ fnId, prompt });
      return { text: JSON.stringify(state.nextByFn[fnId] ?? {}), provider: "test", model: "test-model" };
    }),
  };
});

import { fetchRecipeImage } from "@/lib/recipes-images";
import {
  authorRecipeVersion,
  generateRecipeStructure,
  type RecipeIdea,
} from "@/lib/recipes-pipeline";
import { runRecipeQualityGates, type RecipeGateInput } from "@/lib/recipes-quality-gates";
import { mapR5FailureToRerunTarget } from "@/lib/recipes-repair-target";
import { computeRecipeNutrition } from "@/lib/recipes-nutrition";
import { REFS, cleanIngredients } from "./recipes-fixtures";
import * as blogImages from "@/lib/blog-images";
import * as aiRouter from "@/lib/ai-router";

const imageState = (blogImages as unknown as {
  __state: { queue: Array<{ url: string; alt: string } | null> };
}).__state;
const imageQueries = (blogImages as unknown as { __queries: string[] }).__queries;
const aiState = (aiRouter as unknown as {
  __state: { nextByFn: Record<string, unknown>; prompts: Array<{ fnId: string; prompt: string }> };
}).__state;

const R4 = readFileSync(resolve(process.cwd(), "src/app/api/cron/recipes/r4-image/route.ts"), "utf-8");
const R5 = readFileSync(resolve(process.cwd(), "src/app/api/cron/recipes/r5-gates/route.ts"), "utf-8");
const R3 = readFileSync(resolve(process.cwd(), "src/app/api/cron/recipes/r3-authoring/route.ts"), "utf-8");
const R2 = readFileSync(resolve(process.cwd(), "src/app/api/cron/recipes/r2-nutrition/route.ts"), "utf-8");
const IMAGES = readFileSync(resolve(process.cwd(), "src/lib/recipes-images.ts"), "utf-8");

beforeEach(() => {
  imageState.queue = [];
  imageQueries.length = 0;
  aiState.nextByFn = {};
  aiState.prompts.length = 0;
  (globalThis as { __recentRecipeImageUrls?: Set<string> }).__recentRecipeImageUrls = undefined;
});

/* ═════════ REC-2 — the dish family for the images ═════════ */

describe("REC-2 — the family keyword is DERIVED from the theme (never mealType)", () => {
  it("an ARABIC theme derives its family (شوربة عدس → soup) and it rides the composite query", async () => {
    imageState.queue = [{ url: "https://img.test/soup-1.jpg", alt: "A bowl of lentil soup with crusty bread" }];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian lentil plate",
      themeAr: "شوربة عدس المصرية",
      mainIngredientsEn: ["lentils", "onion"],
      mainIngredientsAr: ["عدس", "بصل"],
      queueId: "q-soup-ar",
    });
    // the family came from the ARABIC arm of the dictionary (the EN theme
    // carries no family word) — the old anchored ^شوربة could never fire
    // behind an English theme; mealType (lunch/dinner) is nowhere in it.
    expect(out).not.toBeNull();
    expect(out!.verified).toBe(true);
    expect(out!.matchNotes).toContain("soup");
    expect(imageQueries.length).toBeGreaterThan(0);
    expect(imageQueries[0]).toContain("soup");
    expect(imageQueries[0]).not.toContain("lunch");
    expect(imageQueries[0]).not.toContain("dinner");
  });

  it("an ENGLISH theme derives its family the same way (curry mid-theme)", async () => {
    imageState.queue = [{ url: "https://img.test/curry-1.jpg", alt: "Chicken curry served with basmati rice" }];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian chicken with rice and curry sauce",
      themeAr: "دجاج مصري بالأرز",
      mainIngredientsEn: ["chicken breast", "white rice"],
      queueId: "q-curry-en",
    });
    expect(out).not.toBeNull();
    expect(out!.matchNotes).toContain("curry");
    expect(imageQueries[0]).toContain("curry");
  });

  it("the generic plea words no longer satisfy the match — the specific family evidence is required", async () => {
    // generic food-photo alts (the exact class the old check passed for
    // ANY dish) are rejected; the walk continues to the next query.
    imageState.queue = [
      { url: "https://img.test/generic-1.jpg", alt: "Beautiful healthy food on a plate" },
      { url: "https://img.test/soup-2.jpg", alt: "Rustic lentil soup in a ceramic bowl" },
    ];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian lentil plate",
      themeAr: "شوربة عدس المصرية",
      mainIngredientsEn: ["lentils", "onion"],
      queueId: "q-walk",
    });
    expect(out).not.toBeNull();
    expect(out!.url).toBe("https://img.test/soup-2.jpg");
    expect(out!.verified).toBe(true);
    // the generic first image was consumed by the walk (2 provider calls)
    expect(imageQueries.length).toBe(2);
  });

  it("all-generic results hold the recipe honestly (no image beats a wrong image)", async () => {
    imageState.queue = [
      { url: "https://img.test/g1.jpg", alt: "Delicious meal ready to eat" },
      { url: "https://img.test/g2.jpg", alt: "Traditional dish on a wooden table" },
      { url: "https://img.test/g3.jpg", alt: "Food photography from above" },
      { url: "https://img.test/g4.jpg", alt: "A plate of something tasty" },
    ];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian lentil plate",
      themeAr: "شوربة عدس المصرية",
      mainIngredientsEn: ["lentils", "onion"],
      queueId: "q-hold",
    });
    expect(out).toBeNull();
  });

  it("a theme with NO family word carries no family claim (any honest food photo passes)", async () => {
    imageState.queue = [{ url: "https://img.test/koshary.jpg", alt: "Traditional Egyptian food on a table" }];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian koshary with rice",
      themeAr: "كشري مصري بالأرز",
      mainIngredientsEn: ["rice", "lentils"],
      queueId: "q-koshary",
    });
    expect(out).not.toBeNull();
    expect(out!.verified).toBe(true);
  });

  it("an ARABIC alt satisfies the family via its AR stems without the EN key", async () => {
    imageState.queue = [{ url: "https://img.test/soup-ar.jpg", alt: "صحن شوربة عدس ساخن مع الخبز" }];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian lentil plate",
      themeAr: "شوربة عدس المصرية",
      mainIngredientsEn: ["lentils"],
      queueId: "q-alt-ar",
    });
    expect(out).not.toBeNull();
    expect(out!.verified).toBe(true);
  });

  it("source contract: the mealType-as-family passthrough is GONE from R4 and the module", () => {
    // the FIELD USAGE must be gone (property/param shape) — prose may
    // mention the retired name, the compiler may not.
    expect(R4).not.toMatch(/dishTypeEn\s*:/);
    expect(R4).not.toMatch(/structure\?\.\s*mealType/);
    expect(R4).toContain("mainIngredientsAr: mainsAr");
    expect(IMAGES).not.toMatch(/dishTypeEn\s*:/);
    // the generic plea words are deleted from the match check
    expect(IMAGES).not.toMatch(/a\.includes\("food"\)/);
    expect(IMAGES).not.toMatch(/a\.includes\("dish"\)/);
    expect(IMAGES).not.toMatch(/a\.includes\("meal"\)/);
    expect(IMAGES).not.toMatch(/a\.includes\("plate"\)/);
  });
});

/* ═════════ REC-4 — the Arabic image alt ═════════ */

describe("REC-4 — altAr from the ARABIC names + the alt inside Q-GATE-1", () => {
  it("the returned altAr is built from the ARABIC mains (zero Latin contamination)", async () => {
    imageState.queue = [{ url: "https://img.test/soup-3.jpg", alt: "A bowl of lentil soup" }];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian lentil plate",
      themeAr: "شوربة عدس المصرية",
      mainIngredientsEn: ["lentils", "onion"],
      mainIngredientsAr: ["عدس", "بصل"],
      queueId: "q-alt-build",
    });
    expect(out).not.toBeNull();
    expect(out!.altAr).toContain("شوربة عدس المصرية");
    expect(out!.altAr).toContain("بـعدس وبصل");
    // the REC-4 defect class: ENGLISH names inside the ARABIC alt
    expect(out!.altAr).not.toContain("lentils");
    expect(out!.altAr).not.toContain("onion");
    expect(out!.altEn).toContain("lentils and onion");
    expect(out!.altEn).toContain("— soup");
  });

  it("a legacy caller without Arabic mains falls back to the theme-only form (no crash)", async () => {
    imageState.queue = [{ url: "https://img.test/soup-4.jpg", alt: "Lentil soup from above" }];
    const out = await fetchRecipeImage({
      themeEn: "Egyptian lentil plate",
      themeAr: "شوربة عدس المصرية",
      mainIngredientsEn: ["lentils"],
      queueId: "q-alt-legacy",
    });
    expect(out).not.toBeNull();
    expect(out!.altAr).toContain("شوربة عدس المصرية");
    expect(out!.altAr).not.toContain("بـ");
  });

  it("Q-GATE-1 scans the alt: latin contamination holds with rerun r4-image (the alt is REBUILT at R4)", () => {
    const out = runRecipeQualityGates(
      baseGateInput({ imageAltAr: "شوربة عدس المصرية بـchicken breast وrice" }),
    );
    const hit = out.find((x) => x.gate === "Q-GATE-1" && x.message.includes("image alt"));
    expect(hit).toBeDefined();
    expect(hit!.message).toContain("rerun r4-image");
    expect(mapR5FailureToRerunTarget(hit!.message)).toBe("r4-image");
  });

  it("a clean Arabic alt adds ZERO violations (the whole battery stays green)", () => {
    expect(runRecipeQualityGates(baseGateInput({ imageAltAr: "شوربة عدس المصرية مع الخبز — وصفة صحية" }))).toEqual([]);
  });

  it("MSA dialect inside the alt holds the same way (strong marker)", () => {
    const out = runRecipeQualityGates(
      baseGateInput({ imageAltAr: "شوربة عدس عشان تاخد البروتين بتاعك — وصفة صحية" }),
    );
    expect(out.some((x) => x.gate === "Q-GATE-1" && x.message.includes("image alt"))).toBe(true);
  });

  it("a null alt (legacy row) adds no alt-scan violation — P-GATE-3 owns the image itself", () => {
    expect(runRecipeQualityGates(baseGateInput({ imageAltAr: null }))).toEqual([]);
  });

  it("source contract: R5 selects image_alt_ar and passes it into the battery", () => {
    expect(R5).toContain("image_alt_ar");
    expect(R5).toContain("imageAltAr: master.image_alt_ar");
  });
});

/* ═════════ REC-12 — fail-fast at R3 + the zod/gate alignment ═════════ */

describe("REC-12 — the zod ceilings mirror the gate ceilings (fail at the parse, not after the images)", () => {
  const baseAuthored = {
    title: "Grilled chicken with rice and salad",
    excerpt:
      "A balanced high-protein plate ready in under an hour, for lunch or dinner, drizzled with olive oil.",
    steps: [
      "Season the chicken breasts with salt, black pepper, and a tablespoon of olive oil.",
      "Grill over medium heat for six to eight minutes per side until fully cooked through.",
      "Boil the rice in plain water with no added fat, then fluff and serve alongside.",
    ],
    tips: "Serve hot with lemon.",
    storageInfo: "Keeps one day refrigerated in a sealed container.",
    substitutions: [{ from: "white rice", to: "brown rice", note: "For extra fiber use brown rice instead." }],
    metaDescription: "A balanced high-protein plate with computed per-serving values for active lifestyles.",
  };

  it("an EN metaTitle of 65 chars is rejected AT THE SCHEMA DOOR (the old max was 90)", async () => {
    aiState.nextByFn["recipe:author-en"] = { ...baseAuthored, metaTitle: "T".repeat(65) };
    await expect(
      authorRecipeVersion("en", {
        themeAr: "شوربة عدس المصرية",
        themeEn: "Egyptian lentil plate",
        cuisine: "egyptian",
        mealType: "lunch",
        servings: 2,
        prepMinutes: 15,
        cookMinutes: 25,
        ingredients: [{ nameAr: "عدس", nameEn: "lentils", amountG: 300, weightState: "raw" }],
        stepsOutline: ["تبّل العدس", "اسلق العدس", "قدمه بالليمون"],
        computedPerServing: { calories: 550, protein: 40, carbs: 50, fat: 18, fiber: 5 },
      }),
    ).rejects.toThrow(/metaTitle/);
  });

  it("an AR metaTitle of 75 chars is rejected the same way", async () => {
    aiState.nextByFn["recipe:author-ar"] = { ...baseAuthored, metaTitle: "ع".repeat(75) };
    await expect(
      authorRecipeVersion("ar", {
        themeAr: "شوربة عدس المصرية",
        themeEn: "Egyptian lentil plate",
        cuisine: "egyptian",
        mealType: "lunch",
        servings: 2,
        prepMinutes: 15,
        cookMinutes: 25,
        ingredients: [{ nameAr: "عدس", nameEn: "lentils", amountG: 300, weightState: "raw" }],
        stepsOutline: ["تبّل العدس", "اسلق العدس", "قدمه بالليمون"],
        computedPerServing: { calories: 550, protein: 40, carbs: 50, fat: 18, fiber: 5 },
      }),
    ).rejects.toThrow(/metaTitle/);
  });

  it("the exact gate limits PASS: EN 60 / AR 70 (the alignment, not a tighter regime)", async () => {
    aiState.nextByFn["recipe:author-en"] = { ...baseAuthored, metaTitle: "T".repeat(60) };
    aiState.nextByFn["recipe:author-ar"] = { ...baseAuthored, metaTitle: "ع".repeat(70) };
    const en = await authorRecipeVersion("en", authoringInput());
    const ar = await authorRecipeVersion("ar", authoringInput());
    expect(en.version.metaTitle).toHaveLength(60);
    expect(ar.version.metaTitle).toHaveLength(70);
  });

  it("the PROMPT layer carries the same budgets (the four-layer law: prompt → zod → early battery → Q-GATE-2)", async () => {
    aiState.nextByFn["recipe:author-en"] = { ...baseAuthored, metaTitle: "T".repeat(60) };
    aiState.nextByFn["recipe:author-ar"] = { ...baseAuthored, metaTitle: "ع".repeat(70) };
    await authorRecipeVersion("en", authoringInput());
    await authorRecipeVersion("ar", authoringInput());
    const enPrompt = aiState.prompts.find((p) => p.fnId === "recipe:author-en")!.prompt;
    const arPrompt = aiState.prompts.find((p) => p.fnId === "recipe:author-ar")!.prompt;
    expect(enPrompt).toContain("metaTitle ≤ 60 chars");
    expect(arPrompt).toContain("metaTitle ≤ 70 حرفًا");
  });

  it("source contract: the early battery still runs INSIDE the R3 retry loop (the P1 half stays)", () => {
    expect(R3).toContain("r3EarlyDeterministicViolations(done.version, language, computedPerServing)");
  });
});

/* ═════════ REC-5 — the weight-state shield (code done in P1 — this is the regression armor) ═════════ */

describe("REC-5 — the weight-state law on the PROMPT side + the R2 wiring", () => {
  it("the R1 structure prompt carries the explicit WEIGHT STATE instruction (gate-enforced)", async () => {
    aiState.nextByFn["recipe:structure"] = STRUCTURE_JSON;
    await generateRecipeStructure(IDEA, CATALOG);
    const prompt = aiState.prompts.find((p) => p.fnId === "recipe:structure")!.prompt;
    expect(prompt).toContain("8. WEIGHT STATE (gate-enforced)");
    expect(prompt).toContain('weightState ("raw" or "cooked"');
  });

  it("the R3 authoring prompts annotate every ingredient with its state (AR + EN)", async () => {
    aiState.nextByFn["recipe:author-ar"] = AUTHORED_OK;
    aiState.nextByFn["recipe:author-en"] = AUTHORED_OK;
    await authorRecipeVersion("ar", authoringInput());
    await authorRecipeVersion("en", authoringInput());
    const arPrompt = aiState.prompts.find((p) => p.fnId === "recipe:author-ar")!.prompt;
    const enPrompt = aiState.prompts.find((p) => p.fnId === "recipe:author-en")!.prompt;
    expect(arPrompt).toContain("300 جم (نيئ)");
    expect(arPrompt).toContain("200 جم (مطبوخ)");
    expect(enPrompt).toContain("300 g (raw)");
    expect(enPrompt).toContain("200 g (cooked)");
  });

  it("source contract: R2 runs the conversion owner (computeRecipeNutrition — the REC-5 engine)", () => {
    expect(R2).toContain("computeRecipeNutrition(");
  });
});

/* ═════════ helpers ═════════ */

const IDEA: RecipeIdea = {
  ideaId: "test-idea",
  themeAr: "شوربة عدس المصرية",
  themeEn: "Egyptian lentil plate",
  cuisine: "egyptian",
  goal: "weight-loss",
  mealType: "lunch",
  brief: "A healthy Egyptian lentil plate for a light high-protein lunch.",
  sealedAt: new Date().toISOString(),
};

const CATALOG = [
  { slug: "chicken-breast-raw", nameAr: "صدور دجاج", nameEn: "chicken breast" },
  { slug: "white-rice-raw", nameAr: "أرز أبيض", nameEn: "white rice" },
  { slug: "olive-oil", nameAr: "زيت زيتون", nameEn: "olive oil" },
];

const STRUCTURE_JSON = {
  servings: 2,
  prepMinutes: 15,
  cookMinutes: 25,
  budgetTier: "medium",
  ingredients: [
    { nameAr: "صدور دجاج", nameEn: "chicken breast", amountG: 300, weightState: "raw", nutrientRefSlug: "chicken-breast-raw", isOptional: false },
    { nameAr: "أرز أبيض", nameEn: "white rice", amountG: 200, weightState: "raw", nutrientRefSlug: "white-rice-raw", isOptional: false },
    { nameAr: "زيت زيتون", nameEn: "olive oil", amountG: 30, weightState: "raw", nutrientRefSlug: "olive-oil", isOptional: false },
  ],
  stepsOutlineAr: ["تبّل الدجاج بالملح والفلفل", "اشوِ الدجاج حتى النضج", "اسلق الأرز وقدمه مع الزيت"],
  stepsOutlineEn: [
    "Season the chicken with salt and pepper",
    "Grill the chicken until fully done",
    "Boil the rice and serve it with the oil",
  ],
};

const AUTHORED_OK = {
  title: "Grilled chicken with rice and salad",
  excerpt: "A balanced high-protein plate ready in under an hour, for lunch or dinner, drizzled with olive oil.",
  steps: [
    "Season the chicken breasts with salt, black pepper, and a tablespoon of olive oil.",
    "Grill over medium heat for six to eight minutes per side until fully cooked through.",
    "Boil the rice in plain water with no added fat, then fluff and serve alongside.",
  ],
  tips: "Serve hot with lemon.",
  storageInfo: "Keeps one day refrigerated in a sealed container.",
  substitutions: [{ from: "white rice", to: "brown rice", note: "For extra fiber use brown rice instead." }],
  metaTitle: "T".repeat(60),
  metaDescription: "A balanced high-protein plate with computed per-serving values for active lifestyles.",
};

function authoringInput() {
  return {
    themeAr: "شوربة عدس المصرية",
    themeEn: "Egyptian lentil plate",
    cuisine: "egyptian",
    mealType: "lunch",
    servings: 2,
    prepMinutes: 15,
    cookMinutes: 25,
    ingredients: [
      { nameAr: "صدور دجاج", nameEn: "chicken breast", amountG: 300, weightState: "raw" as const },
      { nameAr: "أرز أبيض", nameEn: "white rice", amountG: 200, weightState: "cooked" as const },
      { nameAr: "زيت زيتون", nameEn: "olive oil", amountG: 30, weightState: "raw" as const },
    ],
    stepsOutline: ["تبّل الدجاج", "اشوِ الدجاج", "اسلق الأرز"],
    computedPerServing: { calories: 550, protein: 40, carbs: 50, fat: 18, fiber: 5 },
  };
}

/** The gates-hold baseline shape (real computed nutrition — a passing battery). */
function baseGateInput(overrides: Partial<RecipeGateInput> = {}): RecipeGateInput {
  const computation = computeRecipeNutrition({ servings: 3, ingredients: cleanIngredients(), refs: REFS });
  return {
    pairSlug: "grilled-chicken-rice-salad",
    servings: 3,
    servingWeightG: computation.servingWeightG,
    prepMinutes: 15,
    cookMinutes: 30,
    ingredients: cleanIngredients(),
    refs: REFS,
    versions: [
      {
        language: "ar",
        title: "دجاج مشوي مع الأرز والسلطة",
        excerpt: "وجبة متوازنة غنية بالبروتين تُحضّر في أقل من ساعة وتصلح للغداء أو العشاء.",
        steps: [
          { position: 1, text: "تبّل صدور الدجاج بالملح والفلفل الأسود وملعقة زيت الزيتون." },
          { position: 2, text: "اشوِ الصدور على حرارة متوسطة من ست إلى ثماني دقائق لكل وجه." },
          { position: 3, text: "اسلق الأرز في الماء المغلي دون إضافة دهون." },
          { position: 4, text: "قطّع الطماطم وقدمها جانبًا مع الطبق." },
        ],
        tips: "قدّمه ساخنًا",
        storageInfo: "يوم في الثلاجة",
        metaTitle: "دجاج مشوي مع الأرز والسلطة",
        metaDescription: "وجبة متوازنة غنية بالبروتين بقيم محسوبة لكل حصة.",
      },
      {
        language: "en",
        title: "Grilled Chicken with Rice and Salad",
        excerpt: "A balanced protein-rich plate ready in under an hour, for lunch or dinner.",
        steps: [
          { position: 1, text: "Season the chicken breasts with salt, black pepper, and a tablespoon of olive oil." },
          { position: 2, text: "Grill over medium heat for six to eight minutes per side." },
          { position: 3, text: "Boil the rice in plain water with no added fat." },
          { position: 4, text: "Dice the tomatoes and serve alongside." },
        ],
        tips: "Serve hot",
        storageInfo: "One day",
        metaTitle: "Grilled Chicken with Rice and Salad",
        metaDescription: "A balanced high-protein plate with computed per-serving values.",
      },
    ],
    perServing: computation.perServing,
    consistency: computation.consistency,
    derivedDiets: [],
    imageUrl: "https://images.pexels.com/photos/123/plate.jpg",
    imageVerified: true,
    imageAltAr: null,
    existingPairSlugs: new Set(),
    existingTitlesByLang: new Map([
      ["ar", new Set<string>()],
      ["en", new Set<string>()],
    ]),
    publishedIngredientSets: [],
    ...overrides,
  };
}
