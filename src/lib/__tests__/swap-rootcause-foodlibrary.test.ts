import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * SWAP-ROOTCAUSE + FOOD-LIBRARY-COMPLETENESS battery (owner order
 * 2026-10-25 — «تتبّع فشل تبديل الوجبة… وأصلحه» + «مكتبة الأطعمة في
 * التعديل اليدوي… حدد سبب غياب الأصناف المعروفة»).
 *
 * THE MEASURED PRODUCTION FAILURE this file pins (ai_jobs row
 * a26cf95e-1129-47da-b9f4-2886598534aa, failed 2026-10-25T03:14Z after
 * 3 attempts with «بوابة الجودة رفضت المخرجات: الوجبة البديلة لازم
 * تحمل 1-10 أصناف (وصلت 0)»): a REAL coach swapped the LUNCH meal of a
 * keto plan (815 kcal, allergies «اوقات الجبن والعيش»). The provider
 * chain answered 3 times with unusable payloads; the local fallback —
 * the last line of defense — returned null 40/40 draws because the
 * avoid-list (the plan's OTHER meals) contained BOTH lunch-compatible
 * fats (olive oil + avocado), collapsing the keto fat pool to EMPTY.
 *
 * These tests are PERMANENT: they reproduce the exact payload, prove the
 * rebuild lands a gate-passing replacement, pin the structural canaries
 * that keep the fat pool deep, pin the gate's wrapper unwrapping, and
 * pin the food-search normalization/ranking/pagination fixes.
 */

const chainState = vi.hoisted(() => {
  const responses: Array<{ text: string; model: string; provider: string } | Error> = [];
  return { responses };
});

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async () => {
      const next = chainState.responses.shift();
      if (!next) throw new Error("no scripted response");
      if (next instanceof Error) throw next;
      return next;
    }),
  };
});

vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

import { regenerateMeal } from "@/lib/plan-generator";
import {
  buildLocalReplacementMeal,
  buildLocalReplacementItem,
  generateNutritionPlan,
  FOOD_DB,
  type ClientContext,
} from "@/lib/ai-local";
import {
  buildClientConstraints,
  checkItemConstraints,
  tokenizeConstraintText,
  validateRegeneratedMeal,
  type ClientItemConstraints,
} from "@/lib/plan-ai-validation";

/* ── THE EXACT PRODUCTION PAYLOAD (read read-only from the live row) ── */

const PROD_PAYLOAD = {
  meal: {
    name: "الغداء",
    items: [
      { food: "سمك مكاريل مشوي", amount: "166 جم", calories: 340, protein_g: 31.5, fat_g: 23.2 },
      { food: "أفوكادو", amount: "120 جم", calories: 192, carbs_g: 10.8, protein_g: 2.4, fat_g: 18 },
      { food: "لبن رايب", amount: "110 جم", calories: 44, carbs_g: 5.3, protein_g: 3.6, fat_g: 1 },
      { food: "زيت زيتون", amount: "27 جم", calories: 239, fat_g: 27 },
    ],
    notes: "وجبة رئيسية — ركّز على البروتين",
  },
  avoid_names: [
    "الفطار", "بيض كامل مسلوق", "زيت زيتون", "لبن رايب",
    "العشاء", "لحم ضأن مشوي", "أفوكادو", "زيت زيتون",
  ],
  allergies: "اوقات الجبن والعيش",
  disliked: "مفيش",
  targetCalories: 815,
  dietType: "keto" as const,
};

const prodConstraints = buildClientConstraints({
  dietType: PROD_PAYLOAD.dietType,
  allergyText: PROD_PAYLOAD.allergies,
  dislikedText: PROD_PAYLOAD.disliked,
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 1 — THE REPRODUCTION: the exact failed payload now lands locally       */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-ROOTCAUSE 1 — the exact production payload (ai_jobs#a26cf95e)", () => {
  it("buildLocalReplacementMeal lands a replacement for the EXACT payload (was null 40/40)", () => {
    let passes = 0;
    for (let i = 0; i < 40; i++) {
      const meal = buildLocalReplacementMeal({
        originalMeal: PROD_PAYLOAD.meal,
        targetCalories: PROD_PAYLOAD.targetCalories,
        constraints: prodConstraints,
        avoidNames: PROD_PAYLOAD.avoid_names,
      });
      if (!meal) continue;
      const verdict = validateRegeneratedMeal(
        { meal },
        PROD_PAYLOAD.targetCalories,
        null,
        prodConstraints,
      );
      if (verdict.ok) passes++;
    }
    expect(passes).toBe(40);
  });

  it("the replacement is keto-bounded (item carb ceiling + meal carb total) and cheese-free", () => {
    const meal = buildLocalReplacementMeal({
      originalMeal: PROD_PAYLOAD.meal,
      targetCalories: PROD_PAYLOAD.targetCalories,
      constraints: prodConstraints,
      avoidNames: PROD_PAYLOAD.avoid_names,
    });
    expect(meal).not.toBeNull();
    let mealCarbs = 0;
    for (const it of meal!.items) {
      expect(it.carbs_g).toBeLessThanOrEqual(12.05); // ketoItemCarbsMax + rounding
      // The client's NAMED allergens are cheese + bread (CONSERVATIVE
      // family law: «الجبن» stays a containment token — yogurt was in her
      // own original meal and is legitimately allowed).
      expect(String(it.food)).not.toMatch(/جبن|جبنة|قريش|موزاريلا|حلوم|بارميزان|شيدر/);
      mealCarbs += it.carbs_g;
    }
    // One swapped meal keeps ≤ ~half the ketogenic day band (20–50g).
    expect(mealCarbs).toBeLessThanOrEqual(27);
    expect(meal!.items.length).toBeGreaterThanOrEqual(2);
    expect(meal!.items.length).toBeLessThanOrEqual(10);
  });

  it("regenerateMeal: provider chain dead (the «وصلت 0» class) → LOCAL fallback ships a gate-passing meal", async () => {
    chainState.responses.length = 0;
    // The provider answers 200-with-garbage exactly as measured live:
    // a payload whose meal carries ZERO items — the gate rejects it on
    // both the first attempt AND the named-reason repair retry.
    chainState.responses.push(
      { text: '{"meal": {"name": "الغداء", "items": []}}', model: "test", provider: "test" },
      { text: '{"meal": {"name": "الغداء", "items": []}}', model: "test", provider: "test" },
    );
    const ctx: ClientContext = {
      name: "Samar samy",
      nutrition: {
        age: "34", diet: "كيتو", meals: "3", gender: "female",
        height: "179", weight: "132.5", disliked: PROD_PAYLOAD.disliked,
        allergies: PROD_PAYLOAD.allergies, target_weight: "100",
      },
      fitness: { days: "2", goal: "تحسين الصحه خساره الوزن", activity: "light" },
      recent_measurements: [],
      recent_plan_names: [],
    };
    const out = await regenerateMeal(
      PROD_PAYLOAD.meal,
      PROD_PAYLOAD.targetCalories,
      ctx,
      "",
      PROD_PAYLOAD.avoid_names,
      undefined,
      "keto",
    );
    expect(out.source).toBe("local-fallback:meal-swap");
    const meal = out.meal as unknown as {
      items: Array<{ food: string; calories: number; carbs_g?: number }>;
    };
    const total = meal.items.reduce((s, i) => s + i.calories, 0);
    expect(Math.abs(total - 815) / 815).toBeLessThanOrEqual(0.2);
    expect(meal.items.length).toBeGreaterThanOrEqual(2);
    for (const i of meal.items) {
      expect(String(i.food)).not.toMatch(/جبن|أرز|خبز|عيش|مكرونة|بطاطس|شوفان/);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2 — STRUCTURAL CANARIES: the pools can never collapse that thinly again */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-ROOTCAUSE 2 — FOOD_DB structural canaries (the collapse cannot recur)", () => {
  it("keto + nut allergy still leaves ≥6 lunch-compatible fat sources (was 0 when olive oil + avocado avoided)", () => {
    const constraints = buildClientConstraints({ dietType: "keto", allergyText: "مكسرات" });
    const fats = FOOD_DB.filter(
      (f) =>
        f.category === "fat" &&
        f.meals.includes("lunch") &&
        f.name !== "زيت زيتون" &&
        f.name !== "أفوكادو",
    );
    const safe = fats.filter(
      (f) => tokenizeConstraintText("مكسرات").every((t) => !f.name.includes(t)),
    );
    expect(safe.length).toBeGreaterThanOrEqual(6);
  });

  it("the keto lunch bench: ≥14 proteins, ≥12 vegetables (variety across swaps)", () => {
    const proteins = FOOD_DB.filter(
      (f) => f.category === "protein" && f.meals.includes("lunch"),
    );
    const vegs = FOOD_DB.filter((f) => f.category === "veg" && f.meals.includes("lunch"));
    expect(proteins.length).toBeGreaterThanOrEqual(14);
    expect(vegs.length).toBeGreaterThanOrEqual(12);
  });

  it("eggs are dinner-compatible (keto-vegetarian dinners no longer protein-less)", () => {
    const eggs = FOOD_DB.filter(
      (f) => f.category === "protein" && f.name.startsWith("بيض") && f.meals.includes("dinner"),
    );
    expect(eggs.length).toBeGreaterThanOrEqual(2);
  });

  it("ghee/butter/coconut-oil/olives/tahini exist as distinct fat rows (close-out depth)", () => {
    for (const name of ["سمن بلدي", "زبدة", "زيت جوز الهند", "زيتون أسود", "زيتون أخضر", "طحينة"]) {
      expect(FOOD_DB.some((f) => f.name === name && f.category === "fat")).toBe(true);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3 — The gate's wrapper unwrapping (the «وصلت 0» rejection class)        */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-ROOTCAUSE 3 — validateRegeneratedMeal unwraps provider wrappers", () => {
  const items = [
    { food: "صدر دجاج مشوي", amount: "200 جم", calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7 },
    { food: "بروكلي مطبوخ", amount: "150 جم", calories: 53, protein_g: 3.6, carbs_g: 10.5, fat_g: 0.6 },
  ];
  const target = 383;

  it("accepts the literal prompt shape { meal: { items } }", () => {
    const v = validateRegeneratedMeal({ meal: { name: "الغداء", items } }, target, null, null);
    expect(v.ok).toBe(true);
  });

  it("accepts a FLAT meal object (historical contract)", () => {
    const v = validateRegeneratedMeal({ name: "الغداء", items }, target, null, null);
    expect(v.ok).toBe(true);
  });

  it("accepts { replacement: { items } } — the measured free-tier drift shape that died as «وصلت 0»", () => {
    const v = validateRegeneratedMeal({ replacement: { name: "الغداء", items } }, target, null, null);
    expect(v.ok).toBe(true);
  });

  it("accepts { result: { meal: { items } } } (two-level nesting)", () => {
    const v = validateRegeneratedMeal({ result: { meal: { name: "الغداء", items } } }, target, null, null);
    expect(v.ok).toBe(true);
  });

  it("accepts { data: { items } } and { new_meal: { items } }", () => {
    expect(validateRegeneratedMeal({ data: { items } }, target, null, null).ok).toBe(true);
    expect(validateRegeneratedMeal({ new_meal: { items } }, target, null, null).ok).toBe(true);
  });

  it("foods[] still works as the items alias", () => {
    const v = validateRegeneratedMeal({ meal: { name: "الغداء", foods: items } }, target, null, null);
    expect(v.ok).toBe(true);
  });

  it("a genuinely empty payload still rejects honestly (never a fake pass)", () => {
    const v = validateRegeneratedMeal({ meal: { name: "الغداء", items: [] } }, target, null, null);
    expect(v.ok).toBe(false);
    expect(!v.ok && v.error).toMatch(/وصلت 0/);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 4 — Constraint-table refinements (the production allergy text)          */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-ROOTCAUSE 4 — tokenizer refinements on live questionnaire text", () => {
  it("«اوقات الجبن والعيش» yields the FOOD tokens (جبن + عيش), not the fillers", () => {
    const tokens = tokenizeConstraintText("اوقات الجبن والعيش");
    expect(tokens).toContain("جبن");
    // The و-conjunction split: the BARE form «عيش» joins the token set so
    // the match reaches bread names («وعيش» alone never matches a name —
    // the raw form rides along as harmless redundancy).
    expect(tokens).toContain("عيش");
    expect(tokens).not.toContain("اوقات");
  });

  it("«مفيش» (nothing) produces NO banned tokens", () => {
    expect(tokenizeConstraintText("مفيش")).toHaveLength(0);
  });

  it("sesame allergy expands to tahini (the new fat row)", () => {
    const tokens = tokenizeConstraintText("سمسم");
    expect(tokens.some((t) => "طحينة".includes(t) || t === "طحينه")).toBe(true);
  });

  it("dairy allergy expands to ghee (سمن — the new fat row is dairy-derived)", () => {
    const tokens = tokenizeConstraintText("البان");
    expect(tokens).toContain("سمن");
  });

  it("vegan constraint table bans ghee (سمن) and butter — animal fats", () => {
    const vegan = buildClientConstraints({ dietType: "vegan" });
    const gheeRow = FOOD_DB.find((f) => f.name === "سمن بلدي");
    expect(gheeRow).toBeDefined();
    // The gate: a vegan plan may never carry سمن بلدي (banned token «سمن»).
    expect(checkItemConstraints("سمن بلدي", { carbs_g: 0 }, vegan)).not.toBeNull();
    expect(checkItemConstraints("زيتون أسود", { carbs_g: 6 }, vegan)).toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 5 — Local plan quality: variety avoid-list + honest failure             */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-QUALITY — generateNutritionPlan variety + compliance", () => {
  const balancedCtx: ClientContext = {
    name: "عميل متنوع",
    nutrition: { gender: "male", weight: "80", height: "175", age: "30", meals: "4", diet: "", allergies: "", disliked: "" },
    fitness: { days: "4", goal: "", activity: "" },
    recent_measurements: [],
    recent_plan_names: [],
  };

  it("avoidNames steers pools toward NEW foods without emptying any category", () => {
    // Avoid EVERY protein in the DB — the pool must ignore the list
    // rather than produce a protein-less plan (compliance > variety).
    const allProteins = FOOD_DB.filter((f) => f.category === "protein").map((f) => f.name);
    const plan = generateNutritionPlan(balancedCtx, {
      dailyCalories: 2000,
      avoidNames: allProteins,
    });
    expect(plan.meals.length).toBeGreaterThanOrEqual(2);
    // The protein share survives as items (the plan stays protein-forward
    // even when the variety list names every DB protein).
    const proteinCals = plan.meals.flatMap((m) => m.items).reduce(
      (s, it) => s + (Number((it as { protein_g?: number }).protein_g) || 0) * 4,
      0,
    );
    expect(proteinCals).toBeGreaterThan(200);
  });

  it("avoidNames shifts the draw when the pool has fresh alternatives", () => {
    // Deterministic law: with only ONE protein NOT avoided, that protein
    // must appear (the fresh row wins the shuffled pool).
    const proteins = FOOD_DB.filter((f) => f.category === "protein");
    const keep = proteins[0].name;
    const avoid = proteins.slice(1).map((f) => f.name);
    const found: string[] = [];
    for (let i = 0; i < 8; i++) {
      const plan = generateNutritionPlan(balancedCtx, { dailyCalories: 2200, avoidNames: avoid });
      found.push(...plan.meals.flatMap((m) => m.items.map((it) => it.food)));
    }
    expect(found).toContain(keep);
  });

  it("keto local plan stays inside the day carb band across randomized draws", () => {
    const ketoCtx: ClientContext = {
      ...balancedCtx,
      nutrition: {
        ...(balancedCtx.nutrition as Record<string, unknown>),
        diet: "كيتو",
      },
    };
    for (let i = 0; i < 12; i++) {
      const plan = generateNutritionPlan(ketoCtx, { dailyCalories: 1800, dietType: "keto" });
      const dayCarbs = plan.meals.reduce(
        (s, m) =>
          s +
          m.items.reduce(
            (s2, it) => s2 + (Number((it as { carbs_g?: number }).carbs_g) || 0),
            0,
          ),
        0,
      );
      expect(dayCarbs).toBeLessThanOrEqual(50);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 6 — Honest failure is preserved (no compliance laundering)               */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-ROOTCAUSE 5 — impossible constraints still fail honestly", () => {
  it("hostile allergies (every protein family banned) → local meal swap stays null → regenerateMeal throws", async () => {
    chainState.responses.length = 0;
    const hostile: ClientContext = {
      name: "عميل مستحيل",
      nutrition: {
        gender: "male", weight: "90", height: "180", age: "40", meals: "3",
        diet: "كيتو",
        allergies: "بيض، سمك، مكسرات، ألبان، صويا",
        disliked: "دجاج، لحم، رومي، كبدة",
      },
      fitness: { days: "3", goal: "", activity: "" },
      recent_measurements: [],
      recent_plan_names: [],
    };
    await expect(
      regenerateMeal(
        { name: "الغداء", items: [{ food: "x", amount: "100 جم", calories: 400 }] },
        400,
        hostile,
        undefined,
        [],
        undefined,
        "keto",
      ),
    ).rejects.toThrow();
  });

  it("degenerate anchor (0 calories) refuses before any provider call", async () => {
    chainState.responses.length = 0;
    await expect(
      regenerateMeal({ name: "الغداء", items: [] }, 0, undefined, undefined, [], undefined, "keto"),
    ).rejects.toThrow(/بلا سعرات مرجعية/);
    expect(chainState.responses.length).toBe(0);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 7 — Single-item swap: the new fat rows serve as replacements            */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-QUALITY — buildLocalReplacementItem with the deepened DB", () => {
  it("an olive-oil item swaps to a DIFFERENT fat (keto, olive oil itself avoided)", () => {
    const constraints = buildClientConstraints({ dietType: "keto", allergyText: "" });
    const rep = buildLocalReplacementItem({
      item: { food: "زيت زيتون", amount: "27 جم", calories: 239 },
      constraints,
      avoidNames: ["زيت زيتون", "أفوكادو"],
    });
    expect(rep).not.toBeNull();
    expect(rep!.food).not.toBe("زيت زيتون");
    expect(rep!.food).not.toBe("أفوكادو");
    expect(Math.abs(rep!.calories - 239) / 239).toBeLessThanOrEqual(0.15);
    expect(rep!.carbs_g ?? 0).toBeLessThanOrEqual(12);
  });

  it("SMALL meals (510 kcal balanced): portion floors never overshoot the ±20% band — the measured flake", () => {
    // The category floors are MEAL-scale calibrations: a 60g floor of
    // dates (169 kcal against a 20-kcal share) used to push small swaps
    // past the gate with no shrink path (the rescale floored at the same
    // 60g). Pins: every draw closes inside ±20%, tight mode ≤ ±2%.
    const smallMeal = {
      name: "الغداء",
      items: [
        { food: "أرز", amount: "200 جم", calories: 260 },
        { food: "دجاج", amount: "150 جم", calories: 250 },
      ],
    };
    let fails = 0;
    let maxDrift = 0;
    for (let i = 0; i < 200; i++) {
      const meal = buildLocalReplacementMeal({
        originalMeal: smallMeal,
        targetCalories: 510,
        constraints: null,
        avoidNames: [],
      });
      if (!meal) {
        fails++;
        continue;
      }
      const sum = meal.items.reduce((s, it) => s + it.calories, 0);
      const drift = Math.abs(sum - 510) / 510;
      maxDrift = Math.max(maxDrift, drift);
      if (drift > 0.2) fails++;
    }
    expect(fails).toBe(0);
    expect(maxDrift).toBeLessThanOrEqual(0.02); // the close-out lands ~±1.5%
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 8 — FOOD-SEARCH: normalization, ranking, pagination (the live gaps)     */
/* ──────────────────────────────────────────────────────────────────────── */

/** Minimal NextRequest shape the route actually reads: request.url. */
function req(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

async function search(pathAndQuery: string) {
  const mod = await import("@/app/api/food-search/route");
  const res = await mod.GET(req("http://localhost" + pathAndQuery));
  return (await res.json()) as {
    results: Array<{ name: string; source: string; slug?: string }>;
    localCount: number;
    totalLocal: number;
    nextOffset: number | null;
  };
}

describe("FOOD-LIBRARY-COMPLETENESS — /api/food-search (owner order item 7)", () => {
  beforeEach(() => {
    // Kill the outbound Open Food Facts half (offline-test law).
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline-test")));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("«ارز» WITHOUT hamza reaches «أرز أبيض (مطبوخ)» — the live gap (was 0 rows)", async () => {
    const body = await search("/api/food-search?q=" + encodeURIComponent("ارز") + "&lang=ar");
    expect(body.localCount).toBeGreaterThan(0);
    const names = body.results.map((r) => r.name);
    expect(names.some((n) => n.includes("أرز")) || names.some((n) => n.includes("ارز"))).toBe(true);
  });

  it("«صدور دجاج» keeps chicken-breast FIRST and surfaces MORE than one chicken row", async () => {
    const body = await search("/api/food-search?q=" + encodeURIComponent("صدور دجاج") + "&lang=ar");
    const local = body.results.filter((r) => r.source === "local");
    expect(local[0].slug).toBe("chicken-breast");
    expect(local.length).toBeGreaterThan(1); // the live endpoint returned exactly 1
  });

  it("«دجاج صدور» (reversed word order) reaches the same row — order-free tokens", async () => {
    const body = await search("/api/food-search?q=" + encodeURIComponent("دجاج صدور") + "&lang=ar");
    expect(body.results.some((r) => r.slug === "chicken-breast")).toBe(true);
  });

  it("an English query no longer floods the first page with Babyfood rows", async () => {
    const body = await search("/api/food-search?q=chicken&lang=ar");
    const firstPage = body.results.filter((r) => r.source === "local");
    expect(firstPage.length).toBeGreaterThan(0);
    expect(firstPage.slice(0, 5).every((r) => !/babyfood/i.test(r.name))).toBe(true);
  });

  it("pagination: limit/offset page through the FULL matching library", async () => {
    const page1 = await search("/api/food-search?q=chicken&lang=ar&limit=5");
    expect(page1.results.filter((r) => r.source === "local")).toHaveLength(5);
    expect(page1.totalLocal).toBeGreaterThan(5);
    expect(page1.nextOffset).toBe(5);
    const page2 = await search("/api/food-search?q=chicken&lang=ar&limit=5&offset=5");
    const p1Names = new Set(page1.results.map((r) => r.name));
    const p2New = page2.results.filter((r) => r.source === "local" && !p1Names.has(r.name));
    expect(p2New.length).toBeGreaterThan(0); // real paging, no repetition
  });

  it("the historical ?lang contract survives (nameAr under ar, nameEn default)", async () => {
    const ar = await search("/api/food-search?q=butter&lang=ar");
    const hit = ar.results.find((r) => r.slug === "butter-salted");
    expect(hit?.name).toBe("زبدة مملحة");
    const en = await search("/api/food-search?q=" + encodeURIComponent("زبدة"));
    const hitEn = en.results.find((r) => r.slug === "butter-salted");
    expect(hitEn?.name).toBe("Butter, salted");
  });

  it("a known keto staple (طحينة / زيتون) is findable from the library", async () => {
    const tahini = await search("/api/food-search?q=" + encodeURIComponent("طحينة") + "&lang=ar");
    expect(tahini.localCount).toBeGreaterThan(0);
    const olives = await search("/api/food-search?q=" + encodeURIComponent("زيتون") + "&lang=ar");
    expect(olives.localCount).toBeGreaterThan(0);
  });
});
