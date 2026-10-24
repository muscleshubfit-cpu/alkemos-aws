import { describe, it, expect } from "vitest";
import {
  auditNutritionPlan,
  auditWorkoutPlan,
  hasCriticalFindings,
  type AnchorItemFn,
  type LookupExerciseFn,
} from "@/lib/plan-audit";

/**
 * PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 2: «أنشئ تحققًا
 * مستقلًا من صحة النتائج»): the INDEPENDENT audit battery. The audit
 * recomputes every total from the raw items with its own arithmetic and
 * reports drift/contradictions — these tests pin its numbers against
 * HAND-CALCULATED expectations (independent of the generator's math).
 */

/* ── nutrition: hand-calculated fixture ── */

const fixture = () => ({
  daily_calories: 1800,
  meals_total_calories: 1710, // deliberately STALE (real sum below is 1620)
  macros: { protein_g: 130, carbs_g: 150, fat_g: 60 },
  data_analysis: { diet_type: "كيتو" },
  meals: [
    {
      name: "الفطور",
      items: [
        { food: "بيض مسلوق", amount: "150 جم", calories: 234, protein_g: 18, carbs_g: 2, fat_g: 16 },
        { food: "جبن قريش", amount: "100 جم", calories: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4 },
      ],
      total_calories: 332,
    },
    {
      name: "الغداء",
      items: [
        { food: "دجاج مشوي", amount: "200 جم", calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7.2 },
        { food: "سلطة بزيت الزيتون", amount: "طبق", calories: 120, protein_g: 2, carbs_g: 6, fat_g: 10 },
      ],
      total_calories: 450, // model lie — real items sum 450 ✓ (kept honest)
    },
    {
      name: "العشاء",
      items: [
        { food: "سلمون مشوي", amount: "180 جم", calories: 375, protein_g: 37, carbs_g: 0, fat_g: 23 },
        { food: "بروكلي سوتيه", amount: "150 جم", calories: 75, protein_g: 6, carbs_g: 8, fat_g: 0.9 },
      ],
      total_calories: 450,
    },
  ],
});

// HAND-CALCULATED expectations (the independent truth):
// calories: 234+98+330+120+375+75                    = 1232
// protein : 18+11+62+2+37+6                          = 136
// carbs   : 2+3.4+0+6+0+8                            = 19.4
// fat     : 16+4+7.2+10+23+0.9                       = 61.1
// kcal from macros: 136*4 + 19.4*4 + 61.1*9          = 544+77.6+549.9 = 1171.5 → 1172

describe("auditNutritionPlan — independent recomputation", () => {
  it("recomputes every total from the raw items with its OWN arithmetic", () => {
    const r = auditNutritionPlan(fixture());
    expect(r.recomputed.meals_total_calories.value).toBe(1232);
    expect(r.recomputed.protein_g.value).toBe(136);
    expect(r.recomputed.carbs_g.value).toBe(19.4);
    expect(r.recomputed.fat_g.value).toBe(61.1);
    expect(r.recomputed.kcal_from_macros).toBe(1172);
  });

  it("reports target drift vs the declared daily target", () => {
    const r = auditNutritionPlan(fixture());
    // (1232 - 1800) / 1800 = -31.6%
    expect(r.targetDriftPct).toBeCloseTo(-31.6, 1);
    expect(r.findings.some((f) => f.code === "target_drift" && f.severity === "critical")).toBe(true);
  });

  it("flags the STALE declared meals_total_calories (declared-sum mismatch)", () => {
    const r = auditNutritionPlan(fixture());
    expect(
      r.findings.some((f) => f.code === "declared_sum_mismatch"),
    ).toBe(true); // declared 1710 ≠ recomputed 1232
  });

  it("flags macro drift vs the plan's declared macros (protein +4.6%, carbs −87%, fat +1.8%)", () => {
    const r = auditNutritionPlan(fixture());
    expect(r.macroDriftPct.protein).toBeCloseTo(4.6, 1);
    expect(r.macroDriftPct.carbs).toBeCloseTo(-87.1, 1);
    expect(r.macroDriftPct.fat).toBeCloseTo(1.8, 1);
    // carbs are ~87% below the declared 150g → the warning fires
    expect(r.findings.some((f) => f.code === "macro_drift")).toBe(true);
  });

  it("enforces the plan's OWN diet (echo label) with no injected dietType", () => {
    // The keto echo rides data_analysis.diet_type — the audit re-imposes it.
    const r = auditNutritionPlan(fixture());
    expect(r.constraints.dietType).toBe("keto");
    // the fixture is keto-clean → no constraint violations
    expect(r.findings.some((f) => f.code === "constraint_violation")).toBe(false);
  });

  it("detects a keto violation the generation gate already rejected — defense in depth", () => {
    const plan = fixture();
    plan.meals[1].items.push({ food: "أرز أبيض", amount: "150 جم", calories: 195, protein_g: 4, carbs_g: 42, fat_g: 0.5 });
    const r = auditNutritionPlan(plan);
    expect(r.findings.some((f) => f.code === "constraint_violation" && f.severity === "critical")).toBe(true);
  });

  it("detects the inflated-calories macro contradiction per item", () => {
    const plan = fixture();
    plan.meals[0].items.push({ food: "كرة بروتين", amount: "60 جم", calories: 600, protein_g: 30, carbs_g: 20, fat_g: 10 });
    const r = auditNutritionPlan(plan);
    expect(r.findings.some((f) => f.code === "macro_calorie_contradiction" && f.severity === "critical")).toBe(true);
  });

  it("anchors items against the food library and reports deviations (documented vs estimated)", () => {
    // library says 150g chicken breast = 248 kcal; the plan claims 330 → +33%
    // → inside the 35% band → NO finding; then an extreme claim fires one.
    const anchor: AnchorItemFn = ({ food }) => {
      if (String(food).includes("دجاج")) return { calories: 248, protein_g: 46.5, carbs_g: 0, fat_g: 5.4 };
      return null;
    };
    const clean = auditNutritionPlan(fixture(), { anchorItem: anchor });
    expect(clean.findings.some((f) => f.code === "library_deviation")).toBe(false);

    const inflated = fixture();
    inflated.meals[1].items[0].calories = 500; // 500 vs 248 → +102% deviation
    const flagged = auditNutritionPlan(inflated, { anchorItem: anchor });
    expect(flagged.findings.some((f) => f.code === "library_deviation")).toBe(true);
    // provenance: anchored rows counted, un-anchored stay model-estimated
    expect(clean.recomputed.meals_total_calories.provenance).toBe("items");
  });

  it("an empty plan is a critical finding, never a crash", () => {
    const r = auditNutritionPlan({ daily_calories: 2000, meals: [] });
    expect(hasCriticalFindings(r)).toBe(true);
  });
});

/* ── workout: shape + suitability ── */

const lookup: LookupExerciseFn = (name) => {
  const n = name.toLowerCase();
  if (n.includes("barbell squat")) return { equipment: "barbell", level: "intermediate", slug: "barbell-squat" };
  if (n.includes("bench press")) return { equipment: "barbell", level: "intermediate", slug: "bench-press" };
  if (n.includes("lat pulldown")) return { equipment: "cable", level: "beginner", slug: "lat-pulldown" };
  if (n.includes("push-up")) return { equipment: "bodyweight", level: "beginner", slug: "push-up" };
  if (n.includes("plank")) return { equipment: "bodyweight", level: "beginner", slug: "plank" };
  if (n.includes("muscle-up")) return { equipment: "bodyweight", level: "advanced", slug: "muscle-up" };
  return null;
};

const workoutFixture = () => ({
  days: [
    {
      day: "السبت",
      focus: "أعلى الجسم",
      isRest: false,
      exercises: [
        { name: "Bench Press", sets: 4, reps: "8-12", rest: "90 ثانية" },
        { name: "Lat Pulldown", sets: 3, reps: "10-12", rest: "75 ثانية" },
        { name: "Push-Up", sets: 3, reps: "12-15", rest: "60 ثانية" },
        { name: "Plank", sets: 3, reps: "45 ثانية", rest: "45 ثانية" },
      ],
    },
    { day: "الأحد", focus: "راحة", isRest: true, exercises: [] },
    {
      day: "الإثنين",
      focus: "أرجل",
      isRest: false,
      exercises: [
        { name: "Barbell Squat", sets: 4, reps: "6-8", rest: "120 ثانية" },
        { name: "Push-Up", sets: 3, reps: "15", rest: "60 ثانية" },
        { name: "Plank", sets: 3, reps: "60 ثانية", rest: "45 ثانية" },
      ],
    },
  ],
});

describe("auditWorkoutPlan — shape + suitability", () => {
  it("counts days/exercises/sets honestly", () => {
    const r = auditWorkoutPlan(workoutFixture(), { lookupExercise: lookup });
    expect(r.stats).toEqual({ days: 3, trainingDays: 2, exercises: 7, totalSets: 23 });
    expect(hasCriticalFindings(r)).toBe(false);
  });

  it("HOME client: gym-equipment exercises are CRITICAL", () => {
    const r = auditWorkoutPlan(workoutFixture(), { location: "منزل", lookupExercise: lookup });
    const eq = r.findings.filter((f) => f.code === "home_equipment_mismatch");
    expect(eq.length).toBeGreaterThanOrEqual(3); // Bench Press + Lat Pulldown + Barbell Squat
    expect(hasCriticalFindings(r)).toBe(true);
  });

  it("gym client with the same plan: no equipment findings", () => {
    const r = auditWorkoutPlan(workoutFixture(), { location: "gym", lookupExercise: lookup });
    expect(r.findings.some((f) => f.code === "home_equipment_mismatch")).toBe(false);
  });

  it("BEGINNER client: advanced exercises are flagged (warning)", () => {
    const plan = workoutFixture();
    plan.days[0].exercises.push({ name: "Muscle-Up", sets: 3, reps: "3-5", rest: "120 ثانية" });
    const r = auditWorkoutPlan(plan, { experience: "beginner", lookupExercise: lookup });
    expect(r.findings.some((f) => f.code === "advanced_for_beginner")).toBe(true);
  });

  it("KNEE injury: squat-class exercises are CRITICAL", () => {
    const r = auditWorkoutPlan(workoutFixture(), { injuries: "إصابة ركبة قديمة", lookupExercise: lookup });
    expect(r.findings.some((f) => f.code === "injury_unsafe" && f.severity === "critical")).toBe(true);
  });

  it("hollow days, absurd sets and nameless exercises are caught (hand-edited drift)", () => {
    const plan = workoutFixture();
    plan.days[2].exercises = [
      { name: "", sets: 3, reps: "10", rest: "60 ثانية" },
      { name: "Push-Up", sets: 99, reps: "10", rest: "60 ثانية" },
      { name: "Plank", sets: 0, reps: "45 ثانية", rest: "45 ثانية" },
    ];
    const r = auditWorkoutPlan(plan, { lookupExercise: lookup });
    expect(r.findings.some((f) => f.code === "thin_training_day")).toBe(false); // 3 items
    expect(r.findings.some((f) => f.code === "nameless_exercise")).toBe(true);
    expect(r.findings.filter((f) => f.code === "sets_out_of_band").length).toBe(2); // 99 and 0
  });

  it("an all-rest program is critical; no lookup → suitability silently skipped (documented)", () => {
    const r = auditWorkoutPlan({ days: [{ day: "السبت", focus: "راحة", isRest: true, exercises: [] }] });
    expect(hasCriticalFindings(r)).toBe(true);
    expect(auditWorkoutPlan(workoutFixture()).findings.some((f) => f.code === "home_equipment_mismatch")).toBe(false);
  });
});
