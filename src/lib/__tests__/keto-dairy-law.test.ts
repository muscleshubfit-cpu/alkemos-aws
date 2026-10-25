import { describe, it, expect, vi } from "vitest";

/**
 * KETO-DAIRY LAW battery (owner MANDATORY correction, 2026-10-25 —
 * «تصحيح إلزامي لقواعد الكيتو: استبعد الحليب العادي والرائب العادي من
 * خطط الكيتو افتراضيًا، ولا تعتبر كامل الدسم وحده دليلًا على ملاءمة
 * المنتج. قيّم الكربوهيدرات الفعلية لكل كمية، ولا تسمح بأي صنف أو وجبة
 * تتجاوز حدود الكيتو المعتمدة. اسم الصنف وحده لا يكفي للحكم؛ استخدم
 * بيانات غذائية موثوقة، وميّز بين المنتجات غير المحلاة والمنتجات
 * المضاف إليها سكر. أضف اختبارات تمنع إعادة ظهور هذه المشكلة في التوليد
 * المحلي والخارجي والتبديل اليدوي»).
 *
 * THE MEASURED PRODUCTION EVIDENCE this battery pins (read read-only from
 * the live rows, 2026-10-25):
 *   - ai_jobs#2384a8a9 (food_item_regenerate, done 13:34:49Z): the local
 *     fallback answered «زبادي عادي قليل الدسم» (7g carbs/100g) AS THE
 *     KETO REPLACEMENT for a «لبن رايب» item — regular yogurt inside a
 *     keto plan, passing the 12g item ceiling at the chosen grams.
 *   - The client's APPROVED keto plan carried «لبن رايب» in breakfast AND
 *     lunch (245g = 11.8g carbs — under the item ceiling, above keto law).
 *
 * ONE LAW, THREE SURFACES (the owner's exact list):
 *   1. التوليد المحلي   — generateNutritionPlan / buildLocalReplacement*
 *      pools are filtered by the shared keto dairy law.
 *   2. التوليد الخارجي  — validateNutritionPlanAIOutput rejects any
 *      provider meal/plan carrying the banned dairy class (named reason).
 *   3. التبديل اليدوي   — validateRegeneratedMeal / validateRegenerated-
 *      FoodItem (the swap engines the coach buttons ride) + the library
 *      drawer's keto ranking (food-picker-mobile-sheet.test.tsx).
 */

const chainState = vi.hoisted(() => {
  const responses: Array<{ text: string; model: string; provider: string } | Error> = [];
  const prompts: string[] = [];
  return { responses, prompts };
});

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async (prompt: string) => {
      chainState.prompts.push(prompt);
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

import {
  ketoDairyViolation,
  buildClientConstraints,
  checkItemConstraints,
  validateNutritionPlanAIOutput,
  validateRegeneratedMeal,
  validateRegeneratedFoodItem,
  type ClientItemConstraints,
} from "@/lib/plan-ai-validation";
import {
  generateNutritionPlan,
  buildLocalReplacementMeal,
  buildLocalReplacementItem,
  FOOD_DB,
  type ClientContext,
} from "@/lib/ai-local";
import { regenerateMeal, regenerateFoodItem } from "@/lib/plan-generator";

const keto: ClientItemConstraints = { dietType: "keto" };
const lowCarb: ClientItemConstraints = { dietType: "low_carb" };

/** The keto-excluded dairy class — one regex, one truth (the law's own
 *  definition: regular milk ANY fat %, rayeb, regular yogurt; Greek
 *  unsweetened excepted; sweetened/flavored dairy banned outright). */
const BANNED_KETO_DAIRY = /حليب|لبن|رايب|رائب|زبادي(?! يوناني)|milk|yogurt|yoghurt|buttermilk|laban|rayeb|labneh|kefir/i;

const ketoCtx = (over: Record<string, unknown> = {}): ClientContext => ({
  name: "عميلة كيتو",
  nutrition: {
    gender: "female", weight: "132.5", height: "179", age: "34", meals: "3",
    diet: "كيتو", allergies: "", disliked: "", ...over,
  },
  fitness: { days: "3", goal: "", activity: "" },
  recent_measurements: [],
  recent_plan_names: [],
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 1 — The law itself: ketoDairyViolation / checkItemConstraints          */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 1 — the dairy class under keto (name law + carb math)", () => {
  it("regular milk (ANY fat %) is banned — «كامل الدسم وحده لا يكفي»", () => {
    for (const name of ["حليب بقري 2%", "حليب كامل الدسم", "لبن رايب", "رايب", "زبادي عادي كامل الدسم", "زبادي عادي قليل الدسم", "لبن زبادي", "Milk 2%", "Buttermilk"]) {
      expect(ketoDairyViolation(name)).not.toBeNull();
      expect(checkItemConstraints(name, { carbs_g: 1 }, keto)).not.toBeNull();
    }
  });

  it("passes UNDER the item carb ceiling too — the NAME class is the trigger (the measured leak)", () => {
    // The exact production leak: 245g rayeb = 11.8g carbs < 12g ceiling —
    // the gram gate alone never fired. The class law must.
    expect(checkItemConstraints("لبن رايب", { carbs_g: 11.8 }, keto)).not.toBeNull();
    expect(checkItemConstraints("زبادي عادي قليل الدسم", { carbs_g: 6.4 }, keto)).not.toBeNull();
  });

  it("UNSWEETENED Greek yogurt is the one yogurt-family exception (carb ceilings still govern)", () => {
    expect(ketoDairyViolation("زبادي يوناني")).toBeNull();
    expect(ketoDairyViolation("Greek Yogurt")).toBeNull();
    // …but its portion still rides the 12g item ceiling:
    expect(checkItemConstraints("زبادي يوناني", { carbs_g: 3.6 }, keto)).toBeNull();
    expect(checkItemConstraints("زبادي يوناني", { carbs_g: 13 }, keto)).not.toBeNull();
  });

  it("SWEETENED / flavored dairy is banned outright — even Greek («ميّز بين المحلى وغير المحلى»)", () => {
    for (const name of ["زبادي يوناني بالفواكه", "زبادي محلى", "حليب بالشوكولاتة", "زبادي بنكهة الفراولة", "Sweetened Greek Yogurt", "زبادي يوناني بالعسل"]) {
      expect(ketoDairyViolation(name)).not.toBeNull();
    }
  });

  it("cheeses and creams pass (keto staples) — the law never over-blocks", () => {
    for (const name of ["جبن قريش", "جبن فيتا", "جبن حلوم مشوي", "جبن بارميزان", "جبن موزاريلا قليلة الدسم", "زبدة", "سمن بلدي", "كريمة الخفق"]) {
      expect(ketoDairyViolation(name)).toBeNull();
    }
  });

  it("plant milks pass the guard (Arabic AND English wording — the extended guard)", () => {
    for (const name of ["حليب جوز الهند", "حليب اللوز", "Coconut Milk", "Almond Milk", "Soy Milk", "Oat Milk"]) {
      expect(ketoDairyViolation(name)).toBeNull();
    }
  });

  it("low_carb is UNTOUCHED by the dairy class (its 50-150g band fits liquid dairy)", () => {
    expect(checkItemConstraints("حليب بقري 2%", { carbs_g: 10 }, lowCarb)).toBeNull();
    expect(checkItemConstraints("لبن رايب", { carbs_g: 9.6 }, lowCarb)).toBeNull();
  });

  it("non-keto constraints are untouched (no dairy law without a diet)", () => {
    expect(ketoDairyViolation("حليب بقري 2%")).not.toBeNull(); // the standalone helper is keto-scoped by name
    expect(checkItemConstraints("حليب بقري 2%", { carbs_g: 6 }, null)).toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2 — MEAL-level keto ceiling («ولا وجبة تتجاوز حدود الكيتو»)            */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 2 — the 25g MEAL carb ceiling rides every gate", () => {
  const mealWith = (items: Array<{ food: string; amount: string; calories: number; carbs_g?: number }>) => ({
    name: "الغداء",
    items,
  });

  it("a keto meal summing past 25g carbs is rejected with a named reason (swap gate) — items each INSIDE the 12g ceiling", () => {
    // سبانخ 7.6 + خيار 9 + فطر 6.6 + كوسة 6 = 29.2g — each item passes
    // the 12g ITEM ceiling; only the MEAL-level law catches the sum.
    const verdict = validateRegeneratedMeal(
      {
        name: "الغداء",
        items: [
          { food: "سبانخ مطبوخة", amount: "200 جم", calories: 46, carbs_g: 7.6, protein_g: 6 },
          { food: "خيار", amount: "250 جم", calories: 37, carbs_g: 9, protein_g: 1.8 },
          { food: "فطر مطبوخ", amount: "200 جم", calories: 44, carbs_g: 6.6, protein_g: 6.2 },
          { food: "كوسة مطبوخة", amount: "200 جم", calories: 30, carbs_g: 6, protein_g: 2.2 },
        ],
      },
      400,
      null,
      keto,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && /25/.test(verdict.error)).toBe(true);
  });

  it("a keto meal inside the ceiling passes (cheese + eggs + oil — the compliant shape)", () => {
    const verdict = validateRegeneratedMeal(
      mealWith([
        { food: "بيض كامل مسلوق", amount: "150 جم", calories: 233, carbs_g: 1.7 },
        { food: "جبن قريش", amount: "100 جم", calories: 98, carbs_g: 3.4 },
        { food: "زيت زيتون", amount: "25 جم", calories: 221, carbs_g: 0 },
      ]),
      550,
      null,
      keto,
    );
    expect(verdict.ok).toBe(true);
  });

  it("the FULL-PLAN gate rejects a keto meal over the ceiling (external generation surface) — items each inside 12g", () => {
    // Meal 1: لوز 50g (11g) + جوز 45g (6.3g) + سبانخ 250g (9.5g) = 26.8g —
    // every item passes alone; the meal sum is the violation.
    const verdict = validateNutritionPlanAIOutput(
      {
        meals: [
          {
            name: "الفطار",
            items: [
              { food: "لوز نيء", amount: "50 جم", calories: 290, carbs_g: 11, protein_g: 10.5, fat_g: 25 },
              { food: "جوز", amount: "45 جم", calories: 294, carbs_g: 6.3, protein_g: 6.8, fat_g: 29.3 },
              { food: "سبانخ مطبوخة", amount: "250 جم", calories: 58, carbs_g: 9.5, protein_g: 7.5 },
            ],
          },
          mealWith([
            { food: "صدر دجاج مشوي", amount: "200 جم", calories: 330 },
            { food: "زيت زيتون", amount: "30 جم", calories: 265 },
            { food: "بروكلي مطبوخ", amount: "200 جم", calories: 70, carbs_g: 14 },
          ]),
          mealWith([
            { food: "سمك سلمون مشوي", amount: "180 جم", calories: 374 },
            { food: "زبدة", amount: "25 جم", calories: 179, carbs_g: 0 },
            { food: "بروكلي مطبوخ", amount: "200 جم", calories: 70, carbs_g: 14 },
          ]),
        ],
      },
      2400,
      null,
      keto,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && /25/.test(verdict.error)).toBe(true);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3 — التوليد الخارجي: the provider gate rejects banned dairy             */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 3 — external generation: the gate rejects the dairy class by NAME", () => {
  it("a provider keto plan carrying regular milk / rayeb / regular yogurt is rejected (named reasons)", () => {
    for (const food of ["حليب بقري 2%", "لبن رايب", "زبادي عادي كامل الدسم"]) {
      const verdict = validateNutritionPlanAIOutput(
        {
          meals: [
            {
              name: "الفطار",
              items: [
                { food, amount: "200 جم", calories: 100, carbs_g: 9.6 },
                { food: "بيض كامل مسلوق", amount: "120 جم", calories: 186, carbs_g: 1.3 },
                { food: "زيت زيتون", amount: "20 جم", calories: 177 },
              ],
            },
            {
              name: "الغداء",
              items: [
                { food: "صدر دجاج مشوي", amount: "220 جم", calories: 363 },
                { food: "زيت زيتون", amount: "25 جم", calories: 221 },
                { food: "بروكلي مطبوخ", amount: "200 جم", calories: 70, carbs_g: 14 },
              ],
            },
            {
              name: "العشاء",
              items: [
                { food: "سمك بلطي مشوي", amount: "220 جم", calories: 282 },
                { food: "زبدة", amount: "20 جم", calories: 143 },
                { food: "كوسة مطبوخة", amount: "200 جم", calories: 30, carbs_g: 6 },
              ],
            },
          ],
        },
        1800,
        null,
        keto,
      );
      expect(verdict.ok).toBe(false);
      expect(verdict.ok === false && verdict.error.includes(food)).toBe(true);
    }
  });

  it("a SWEETENED yogurt item is rejected even though its calories look fine", () => {
    const verdict = validateNutritionPlanAIOutput(
      {
        meals: [
          {
            name: "الفطار",
            items: [
              { food: "زبادي يوناني بالفواكه", amount: "150 جم", calories: 130, carbs_g: 18 },
              { food: "بيض كامل مسلوق", amount: "120 جم", calories: 186, carbs_g: 1.3 },
              { food: "زيت زيتون", amount: "20 جم", calories: 177 },
            ],
          },
          {
            name: "الغداء",
            items: [
              { food: "صدر دجاج مشوي", amount: "220 جم", calories: 363 },
              { food: "زيت زيتون", amount: "25 جم", calories: 221 },
              { food: "بروكلي مطبوخ", amount: "200 جم", calories: 70, carbs_g: 14 },
            ],
          },
          {
            name: "العشاء",
            items: [
              { food: "لحم مفروم قليل الدهن", amount: "200 جم", calories: 382 },
              { food: "زيت زيتون", amount: "20 جم", calories: 177 },
              { food: "سبانخ مطبوخة", amount: "200 جم", calories: 46, carbs_g: 7.6 },
            ],
          },
        ],
      },
      1800,
      null,
      keto,
    );
    expect(verdict.ok).toBe(false);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 4 — التبديل اليدوي: the swap engines (the coach buttons + item swap)   */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 4 — manual swap gates (meal + single item)", () => {
  it("validateRegeneratedFoodItem rejects «زبادي عادي قليل الدسم» under keto — THE EXACT PRODUCTION PAYLOAD (ai_jobs#2384a8a9)", () => {
    // The live local fallback answered exactly this row on 2026-10-25.
    const verdict = validateRegeneratedFoodItem(
      { food: "زبادي عادي قليل الدسم", amount: "156 جم", calories: 98, alternatives: "أو زبادي يوناني بكمية مكافئة" },
      98,
      null,
      keto,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.error.includes("زبادي")).toBe(true);
  });

  it("validateRegeneratedFoodItem still accepts a keto-compliant replacement (قريش for رايب)", () => {
    const verdict = validateRegeneratedFoodItem(
      { food: "جبن قريش", amount: "100 جم", calories: 98, carbs_g: 3.4 },
      98,
      null,
      keto,
    );
    expect(verdict.ok).toBe(true);
  });

  it("buildLocalReplacementItem NEVER proposes the banned dairy class under keto (40 draws, was: regular yogurt)", () => {
    // The exact item the coach swapped live: لبن رايب 245g / 98 kcal.
    for (let i = 0; i < 40; i++) {
      const rep = buildLocalReplacementItem({
        item: { food: "لبن رايب", amount: "245 جم", calories: 98 },
        constraints: keto,
        avoidNames: [],
      });
      expect(rep).not.toBeNull();
      expect(rep!.food).not.toMatch(BANNED_KETO_DAIRY);
      // The built item carries per-100g-derived macros at runtime (the
      // LocalReplacementItem alias is intentionally narrow — widen here).
      const built = rep as unknown as { food: string; amount: string; calories: number; carbs_g?: number };
      const verdict = validateRegeneratedFoodItem(
        { food: built.food, amount: built.amount, calories: built.calories, carbs_g: built.carbs_g },
        98,
        null,
        keto,
      );
      expect(verdict.ok).toBe(true);
    }
  });

  it("regenerateFoodItem (the engine behind the coach button) never ships a provider's milk answer — the local fallback takes over with a compliant row", async () => {
    chainState.responses.length = 0;
    chainState.prompts.length = 0;
    chainState.responses.push({
      text: JSON.stringify({ food: "حليب كامل الدسم", amount: "180 جم", calories: 110 }),
      model: "test-model",
      provider: "test",
    });
    chainState.responses.push({
      text: JSON.stringify({ food: "حليب 2%", amount: "200 جم", calories: 100 }),
      model: "test-model",
      provider: "test",
    });
    // Both provider attempts answered regular milk → the gate rejected
    // both with the named dairy reason → the LOCAL fallback must ship a
    // keto-compliant replacement (never milk — the exact 2384a8a9 class,
    // now with the compliant answer instead of «زبادي عادي قليل الدسم»).
    const out = await regenerateFoodItem(
      { food: "لبن رايب", amount: "245 جم", calories: 98 },
      ketoCtx(),
      [],
      undefined,
      "keto",
    );
    expect(out.source).toBe("local-fallback:item-swap");
    expect(out.item.food).not.toMatch(BANNED_KETO_DAIRY);
    // The repair directive carried the NAMED dairy reason:
    const repairPrompt = chainState.prompts[1] ?? "";
    expect(/حليب|الرائب|كيتو/.test(repairPrompt)).toBe(true);
  });

  it("buildLocalReplacementMeal lands keto replacements free of the banned dairy class (the a26cf95e meal)", () => {
    const constraints = buildClientConstraints({
      dietType: "keto",
      allergyText: "اوقات الجبن والعيش",
      dislikedText: "مفيش",
    });
    // The EXACT live meal (read-only from ai_jobs#a26cf95e) — a loose
    // const so the runtime macros ride without literal-excess checks.
    const originalMeal = {
      name: "الغداء",
      items: [
        { food: "سمك مكاريل مشوي", amount: "166 جم", calories: 340, protein_g: 31.5, fat_g: 23.2 },
        { food: "أفوكادو", amount: "120 جم", calories: 192, carbs_g: 10.8, protein_g: 2.4, fat_g: 18 },
        { food: "لبن رايب", amount: "110 جم", calories: 44, carbs_g: 5.3, protein_g: 3.6, fat_g: 1 },
        { food: "زيت زيتون", amount: "27 جم", calories: 239, fat_g: 27 },
      ],
    };
    for (let i = 0; i < 25; i++) {
      const meal = buildLocalReplacementMeal({
        originalMeal,
        targetCalories: 815,
        constraints,
        avoidNames: ["بيض كامل مسلوق", "زيت زيتون", "لبن رايب", "لحم ضأن مشوي", "أفوكادو"],
      });
      expect(meal).not.toBeNull();
      for (const it of meal!.items) {
        expect(it.food).not.toMatch(BANNED_KETO_DAIRY);
      }
    }
  });

  it("regenerateMeal's prompt carries the keto dairy law line (the provider is told BEFORE the gate burns a retry)", async () => {
    chainState.responses.length = 0;
    chainState.prompts.length = 0;
    chainState.responses.push({
      text: JSON.stringify({
        meal: {
          name: "الغداء",
          items: [
            { food: "صدر دجاج مشوي", amount: "240 جم", calories: 396, protein_g: 74 },
            { food: "زيت زيتون", amount: "25 جم", calories: 221 },
            { food: "بروكلي مطبوخ", amount: "150 جم", calories: 53, carbs_g: 10.5 },
          ],
          total_calories: 670,
        },
        suggestions: [],
      }),
      model: "test-model",
      provider: "test",
    });
    const out = await regenerateMeal(
      { name: "الغداء", items: [{ food: "سمك مكاريل مشوي", amount: "166 جم", calories: 340 }] },
      700,
      ketoCtx(),
      undefined,
      [],
      undefined,
      "keto",
    );
    expect(out.meal.items.length).toBeGreaterThan(0);
    expect(chainState.prompts[0]).toContain("قانون ألبان الكيتو");
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 5 — التوليد المحلي: the local generator's keto output                   */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 5 — local generation: keto plans never carry the banned dairy class", () => {
  it("across 30 randomized keto draws: no milk / rayeb / regular yogurt / sweetened dairy, day ≤ 50g, meals ≤ 25g", () => {
    for (let i = 0; i < 30; i++) {
      const plan = generateNutritionPlan(ketoCtx(), {
        dailyCalories: 2300,
        dietType: "keto",
        mealsCount: 3,
        constraints: keto,
      });
      let dayCarbs = 0;
      for (const m of plan.meals) {
        let mealCarbs = 0;
        for (const it of m.items) {
          expect(it.food).not.toMatch(BANNED_KETO_DAIRY);
          mealCarbs += Number((it as { carbs_g?: number }).carbs_g) || 0;
        }
        expect(mealCarbs).toBeLessThanOrEqual(25.5);
        dayCarbs += mealCarbs;
      }
      expect(dayCarbs).toBeLessThanOrEqual(50);
    }
  });

  it("the keto dairy pool is exactly cheeses + unsweetened Greek yogurt (the class law applied to FOOD_DB)", () => {
    const ketoDairy = FOOD_DB.filter(
      (f) => f.category === "dairy" && checkItemConstraints(f.name, { carbs_g: f.carbsPer100g }, keto) === null,
    );
    expect(ketoDairy.length).toBeGreaterThan(0);
    for (const f of ketoDairy) {
      expect(f.name).not.toMatch(BANNED_KETO_DAIRY);
    }
    // The bench still reaches cheese in breakfast AND lunch slots:
    expect(ketoDairy.some((f) => f.meals.includes("breakfast"))).toBe(true);
    expect(ketoDairy.some((f) => f.meals.includes("lunch"))).toBe(true);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 6 — ARAB-CONTEXT: tofu is never a default protein outside vegan/veg     */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 6 — Arab-context default: التوفو ليس افتراضيًا (owner order item 3)", () => {
  const balancedCtx: ClientContext = {
    name: "عميل مصري",
    nutrition: { gender: "male", weight: "80", height: "175", age: "30", meals: "4", diet: "", allergies: "", disliked: "" },
    fitness: { days: "4", goal: "", activity: "" },
    recent_measurements: [],
    recent_plan_names: [],
  };

  it("balanced plans never surface tofu across 30 draws (the measured live draw had it as lunch protein)", () => {
    for (let i = 0; i < 30; i++) {
      const plan = generateNutritionPlan(balancedCtx, { dailyCalories: 2000 });
      for (const m of plan.meals) {
        for (const it of m.items) {
          expect(it.food).not.toBe("توفو");
        }
      }
    }
  });

  it("keto/low-carb token tables also reject tofu (the gated diets get the hard block)", () => {
    expect(checkItemConstraints("توفو", { carbs_g: 2.8 }, keto)).not.toBeNull();
    expect(checkItemConstraints("توفو", { carbs_g: 2.8 }, lowCarb)).not.toBeNull();
  });

  it("vegan keeps tofu in the bench — with every other vegan protein avoided, tofu MUST appear", () => {
    const veganConstraints = buildClientConstraints({ dietType: "vegan" });
    const otherVeganProteins = FOOD_DB.filter(
      (f) => f.category === "protein" && f.name !== "توفو" && checkItemConstraints(f.name, { carbs_g: f.carbsPer100g }, veganConstraints) === null,
    ).map((f) => f.name);
    const plan = generateNutritionPlan(
      { ...balancedCtx, nutrition: { ...(balancedCtx.nutrition as Record<string, unknown>), diet: "نباتي صرف" } },
      { dailyCalories: 2000, dietType: "vegan", constraints: veganConstraints, avoidNames: otherVeganProteins },
    );
    const foods = plan.meals.flatMap((m) => m.items.map((it) => it.food));
    expect(foods).toContain("توفو");
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 7 — Variety + physical portions (the plan-quality mandates)             */
/* ──────────────────────────────────────────────────────────────────────── */

describe("KETO-LAW 7 — day-level variety + physical portion caps (local generation)", () => {
  const balancedCtx: ClientContext = {
    name: "عميل متنوع",
    nutrition: { gender: "male", weight: "80", height: "175", age: "30", meals: "4", diet: "", allergies: "", disliked: "" },
    fitness: { days: "4", goal: "", activity: "" },
    recent_measurements: [],
    recent_plan_names: [],
  };

  it("no food repeats across the day's meals (balanced — the measured خبز×2 + معكرونة class)", () => {
    for (let i = 0; i < 20; i++) {
      const plan = generateNutritionPlan(balancedCtx, { dailyCalories: 2000 });
      const seen = new Set<string>();
      for (const m of plan.meals) {
        for (const it of m.items) {
          expect(seen.has(it.food)).toBe(false);
          seen.add(it.food);
        }
      }
    }
  });

  it("keto days only repeat ZERO-CARB cooking fats at most (deliberate close-out law)", () => {
    const ZERO_CARB_FATS = new Set(["زيت زيتون", "سمن بلدي", "زيت جوز الهند", "زبدة"]);
    for (let i = 0; i < 20; i++) {
      const plan = generateNutritionPlan(ketoCtx(), { dailyCalories: 2100, dietType: "keto", constraints: keto });
      const counts = new Map<string, number>();
      for (const m of plan.meals) {
        for (const it of m.items) counts.set(it.food, (counts.get(it.food) ?? 0) + 1);
      }
      for (const [food, n] of counts) {
        if (n > 1) expect(ZERO_CARB_FATS.has(food)).toBe(true);
      }
    }
  });

  it("vegetables vary across the day (≥2 distinct veg in a 4-meal balanced plan)", () => {
    for (let i = 0; i < 12; i++) {
      const plan = generateNutritionPlan(balancedCtx, { dailyCalories: 2000 });
      const vegNames = new Set(
        plan.meals
          .flatMap((m) => m.items)
          .map((it) => FOOD_DB.find((f) => f.name === it.food)?.category === "veg" ? it.food : "")
          .filter(Boolean),
      );
      expect(vegNames.size).toBeGreaterThanOrEqual(2);
    }
  });

  it("portion ceilings are physical: no protein > 400g (was: 533g egg whites as one item)", () => {
    const catByName = new Map(FOOD_DB.map((f) => [f.name, f.category]));
    const bounds: Record<string, number> = { protein: 400, carb: 400, fat: 120, veg: 350, fruit: 250, dairy: 350 };
    for (let i = 0; i < 20; i++) {
      const plan = generateNutritionPlan(balancedCtx, { dailyCalories: 2200 });
      for (const m of plan.meals) {
        for (const it of m.items) {
          const cat = catByName.get(it.food);
          if (!cat) continue;
          const grams = Number(String(it.amount).replace(/[^\d.]/g, "")) || 0;
          expect(grams).toBeLessThanOrEqual(bounds[cat] + 2); // gram rounding only
        }
      }
    }
  });
});
