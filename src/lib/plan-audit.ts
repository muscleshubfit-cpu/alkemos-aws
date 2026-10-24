/**
 * PLAN-AUDIT — the INDEPENDENT verification layer for AI nutrition and
 * workout plans (PLAN-REGEN-CONSTRAINTS 2026-10-24, owner order item 2:
 * «أنشئ تحققًا مستقلًا من صحة النتائج»).
 *
 * WHAT "INDEPENDENT" MEANS HERE: this module NEVER trusts a number the
 * generator or the model produced. It takes the FINAL plan content (the
 * exact object that would be displayed and saved) and recomputes every
 * total from the raw items up, with its own arithmetic — then reports
 * drift against the plan's own promises. It shares NO code path with
 * normalizeNutritionPlan / recomputeNutritionTotals (the generator's
 * math); agreement between the two is EVIDENCE, not a tautology.
 *
 * The audit does NOT mutate the plan and never throws — it returns a
 * verdict. Callers: generateNutritionPlanAI / generateWorkoutPlanAI
 * (attach the recomputed truth + surface critical flags on the coach's
 * review banner), the test battery, and the dispatch-only real-provider
 * probe workflow. Food-library anchoring is injected as a callback so
 * this module stays import-free of the 3.6MB FOODS array.
 *
 * DOCUMENTED vs ESTIMATED (owner order item 2): every recomputed number
 * carries its provenance —
 *   - "library"   — the item matched a food-library row and its
 *                   per-100g × grams values were recomputed (documented);
 *   - "items"     — summed from the item values the model supplied
 *                   (estimated — bounded by the gate, not lab-verified);
 *   - "declared"  — the plan's own persisted number, shown only to be
 *                   compared against the recomputation.
 */

import {
  PLAN_AI_SANITY,
  buildClientConstraints,
  checkItemConstraints,
  hasItemConstraints,
  type ClientItemConstraints,
} from "@/lib/plan-ai-validation";
// The zero-dependency diet leaf — resolves the plan's echo label into the
// DietType enum (exact round-trip > classification > null). Same law the
// UI regen paths use, so audit + regen impose the SAME committed diet.
import { resolvePlanDietType } from "@/lib/diet-types";

/* ─────────────────────────── Structural types ─────────────────────────── */

/** The item shape every saved nutrition plan carries (structural only). */
export type AuditItem = {
  food: string;
  amount: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
};

export type AuditMeal = {
  name: string;
  items: AuditItem[];
  total_calories?: number;
  total_protein_g?: number;
};

export type AuditNutritionPlan = {
  daily_calories?: number;
  meals_total_calories?: number;
  macros?: {
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    protein_cal?: number;
    carbs_cal?: number;
    fat_cal?: number;
  };
  meals?: AuditMeal[];
  data_analysis?: { diet_type?: unknown };
  diet_type?: unknown;
};

export type AuditExercise = { name: string; sets?: number; reps?: string; rest?: string };
export type AuditWorkoutDay = { day: string; focus?: string; isRest?: boolean; exercises?: AuditExercise[] };
export type AuditWorkoutPlan = { days?: AuditWorkoutDay[] };

/** Library anchor injected by server callers (see plan-food-grounding). */
export type AnchorItemFn = (
  item: { food: string; amount: string; calories: number },
) => { calories: number; protein_g?: number; carbs_g?: number; fat_g?: number } | null;

/** Library exercise lookup injected by server callers. */
export type LookupExerciseFn = (
  name: string,
) => { equipment: string; level: string; slug: string } | null;

/* ─────────────────────────── Number coercion ─────────────────────────── */

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export type Provenance = "library" | "items" | "declared";

export type AuditNumber = {
  value: number;
  provenance: Provenance;
};

/* ─────────────────────────── Nutrition audit ─────────────────────────── */

export type NutritionAuditFinding = {
  code: string;
  message: string;
  severity: "critical" | "warning";
};

export type NutritionAuditReport = {
  /** Recomputed totals from the raw items (the independent truth). */
  recomputed: {
    meals_total_calories: AuditNumber;
    protein_g: AuditNumber;
    carbs_g: AuditNumber;
    fat_g: AuditNumber;
    /** Atwater check of the RECOMPUTED macros against the recomputed
     * calories (4/4/9 — fiber tolerance documented in the gate). */
    kcal_from_macros: number;
  };
  /** Drift of the recomputed meals sum vs the plan's declared daily target. */
  targetDriftPct: number | null;
  /** Drift of the recomputed item macros vs the plan's declared macros. */
  macroDriftPct: { protein: number | null; carbs: number | null; fat: number | null };
  /** Per-item findings (diet violations, allergens, incoherent macros,
   * implausible gram-amounts vs library anchors). */
  findings: NutritionAuditFinding[];
  constraints: ClientItemConstraints;
};

/**
 * Audit a nutrition plan independently. `anchorItem` (optional) resolves
 * an item against the food library; `dietType`/`allergyText`/`dislikedText`
 * re-impose the client's committed constraints for the compliance check.
 */
export function auditNutritionPlan(
  plan: AuditNutritionPlan,
  opts: {
    dietType?: unknown;
    allergyText?: unknown;
    dislikedText?: unknown;
    anchorItem?: AnchorItemFn | null;
    /** The kcal drift band treated as CRITICAL (default ±25% — the gate's
     * own plan band; the audit reports the number either way). */
    criticalDriftPct?: number;
  } = {},
): NutritionAuditReport {
  const constraints = buildClientConstraints({
    dietType: opts.dietType ?? resolveAuditDiet(plan),
    allergyText: opts.allergyText,
    dislikedText: opts.dislikedText,
  });
  const criticalBand = opts.criticalDriftPct ?? 0.25;

  const findings: NutritionAuditFinding[] = [];
  const meals = Array.isArray(plan.meals) ? plan.meals : [];

  let sumCals = 0;
  let sumProtein = 0;
  let sumCarbs = 0;
  let sumFat = 0;
  let libraryAnchored = 0;
  let itemCount = 0;

  for (const meal of meals) {
    const items = Array.isArray(meal.items) ? meal.items : [];
    for (const it of items) {
      itemCount++;
      const cals = num(it.calories);
      const protein = num(it.protein_g);
      const carbs = num(it.carbs_g);
      const fat = num(it.fat_g);

      // Library anchor — when the item resolves to a per-100g row with a
      // parseable gram amount, the anchored numbers are the DOCUMENTED
      // ones; the audit reports a finding when the plan's numbers deviate
      // beyond the grounding tolerance (35%).
      if (opts.anchorItem) {
        try {
          const anchored = opts.anchorItem({ food: it.food, amount: it.amount, calories: cals });
          if (anchored && anchored.calories > 0) {
            libraryAnchored++;
            const dev = Math.abs(cals - anchored.calories) / anchored.calories;
            if (cals > 0 && dev > 0.35) {
              findings.push({
                code: "library_deviation",
                severity: "warning",
                message: `الصنف «${it.food}»: السعرات المسجلة ${Math.round(cals)} بعيدة عن مرجع المكتبة per-100g×الجرامات (${Math.round(anchored.calories)}) بنسبة ${Math.round(dev * 100)}%`,
              });
            }
          }
        } catch {
          /* anchor is best-effort by contract */
        }
      }

      // Constraint compliance (diet + allergies + banned).
      const violation = checkItemConstraints(it.food, { carbs_g: carbs }, constraints);
      if (violation) {
        findings.push({ code: "constraint_violation", severity: "critical", message: violation });
      }

      // Per-item macro↔calorie coherence (only when all three present) —
      // SAME band law as the gate (PLAN_AI_SANITY), never a second policy.
      if (protein > 0 && carbs > 0 && fat > 0) {
        const kcalMacros = protein * 4 + carbs * 4 + fat * 9;
        if (cals > kcalMacros * (1 + PLAN_AI_SANITY.macroCalorieInflationTolerance)) {
          findings.push({
            code: "macro_calorie_contradiction",
            severity: "critical",
            message: `الصنف «${it.food}»: السعرات المعلنة ${Math.round(cals)} تناقي ماكروزه (4P+4C+9F = ${Math.round(kcalMacros)} سعرة)`,
          });
        }
      }

      sumCals += cals;
      sumProtein += protein;
      sumCarbs += carbs;
      sumFat += fat;
    }
    // Meal-level declared total vs its own items (model-lie detector).
    const declaredMealTotal = num(meal.total_calories);
    const itemsSum = items.reduce((s, it) => s + num(it.calories), 0);
    if (declaredMealTotal > 0 && itemsSum > 0 && Math.abs(declaredMealTotal - itemsSum) > 2) {
      findings.push({
        code: "meal_total_mismatch",
        severity: "warning",
        message: `الوجبة «${meal.name}»: المجموع المعلن ${Math.round(declaredMealTotal)} ≠ مجموع أصنافها ${Math.round(itemsSum)} سعرة`,
      });
    }
  }

  if (itemCount === 0) {
    findings.push({
      code: "empty_plan",
      severity: "critical",
      message: "الخطة بلا أصناف — لا يوجد ما يُحاسب",
    });
  }

  const declaredTarget = num(plan.daily_calories);
  const declaredMealsTotal = num(plan.meals_total_calories);
  const targetDriftPct =
    declaredTarget > 0 && sumCals > 0
      ? Math.round(((sumCals - declaredTarget) / declaredTarget) * 1000) / 10
      : null;
  if (targetDriftPct !== null && Math.abs(targetDriftPct) > criticalBand * 100) {
    findings.push({
      code: "target_drift",
      severity: "critical",
      message: `مجموع الأصناف المعاد حسابه (${Math.round(sumCals)} سعرة) منحرف عن الهدف المعلن (${Math.round(declaredTarget)}) بنسبة ${targetDriftPct}%`,
    });
  }
  if (declaredMealsTotal > 0 && Math.abs(declaredMealsTotal - sumCals) > 2) {
    findings.push({
      code: "declared_sum_mismatch",
      severity: "warning",
      message: `meals_total_calories المعلن (${Math.round(declaredMealsTotal)}) ≠ المجموع المعاد حسابه من الأصناف (${Math.round(sumCals)})`,
    });
  }

  // Macro drift vs the plan's declared macros (when both sides exist).
  const declaredMacros = plan.macros ?? {};
  const macroDrift = (recomputedG: number, declaredG: number): number | null => {
    if (declaredG <= 0 || recomputedG <= 0) return null;
    return Math.round(((recomputedG - declaredG) / declaredG) * 1000) / 10;
  };
  const proteinDrift = macroDrift(sumProtein, num(declaredMacros.protein_g));
  const carbsDrift = macroDrift(sumCarbs, num(declaredMacros.carbs_g));
  const fatDrift = macroDrift(sumFat, num(declaredMacros.fat_g));
  for (const [label, drift] of [
    ["البروتين", proteinDrift],
    ["الكربوهيدرات", carbsDrift],
    ["الدهون", fatDrift],
  ] as const) {
    if (drift !== null && Math.abs(drift) > 35) {
      findings.push({
        code: "macro_drift",
        severity: "warning",
        message: `${label} المعاد حسابه منحرف عن المعلن بنسبة ${drift}% — الماكروز الرسمية لا تطابق محتوى الوجبات`,
      });
    }
  }

  const kcalFromMacros = Math.round(sumProtein * 4 + sumCarbs * 4 + sumFat * 9);

  return {
    recomputed: {
      meals_total_calories: {
        value: Math.round(sumCals),
        provenance: libraryAnchored === itemCount && itemCount > 0 ? "library" : "items",
      },
      protein_g: { value: Math.round(sumProtein * 10) / 10, provenance: "items" },
      carbs_g: { value: Math.round(sumCarbs * 10) / 10, provenance: "items" },
      fat_g: { value: Math.round(sumFat * 10) / 10, provenance: "items" },
      kcal_from_macros: kcalFromMacros,
    },
    targetDriftPct,
    macroDriftPct: { protein: proteinDrift, carbs: carbsDrift, fat: fatDrift },
    findings,
    constraints,
  };
}

/** Resolve the diet a plan CONTENT carries — enum key, the generation
 * echo label, or classification of a wordy/legacy echo. Never a guess. */
function resolveAuditDiet(plan: AuditNutritionPlan): unknown {
  const resolved = resolvePlanDietType(plan as Parameters<typeof resolvePlanDietType>[0]);
  return resolved ?? undefined;
}

/* ─────────────────────────── Workout audit ─────────────────────────── */

export type WorkoutAuditFinding = {
  code: string;
  message: string;
  severity: "critical" | "warning";
};

export type WorkoutAuditReport = {
  findings: WorkoutAuditFinding[];
  stats: { days: number; trainingDays: number; exercises: number; totalSets: number };
};

/**
 * Audit a workout plan: shape sanity (the gate already rejects hollow days
 * at GENERATION — this catches hand-edited / legacy / drift), plus the
 * SUITABILITY axes the owner ordered: training location (home → no
 * barbell/cable/machine exercises), experience level (beginner → no
 * advanced), and injury keywords vs the exercise's slug.
 */
export function auditWorkoutPlan(
  plan: AuditWorkoutPlan,
  opts: {
    location?: unknown;
    experience?: unknown;
    injuries?: unknown;
    lookupExercise?: LookupExerciseFn | null;
  } = {},
): WorkoutAuditReport {
  const findings: WorkoutAuditFinding[] = [];
  const days = Array.isArray(plan.days) ? plan.days : [];
  const isHome = /home|منزل|بيت/i.test(String(opts.location ?? ""));
  const isBeginner = /beginner|مبتدئ/i.test(String(opts.experience ?? ""));
  const injuries = String(opts.injuries ?? "").toLowerCase();

  let trainingDays = 0;
  let exercises = 0;
  let totalSets = 0;

  for (const d of days) {
    const isRest = d.isRest === true || /راحة|rest/i.test(String(d.focus ?? ""));
    const list = Array.isArray(d.exercises) ? d.exercises : [];
    if (isRest) continue;
    trainingDays++;
    if (list.length < 3) {
      findings.push({
        code: "thin_training_day",
        severity: "critical",
        message: `اليوم «${d.day}» تدريبي بـ${list.length} تمرين فقط (الحد الأدنى 3)`,
      });
    }
    for (const ex of list) {
      exercises++;
      const name = String(ex?.name ?? "").trim();
      if (!name) {
        findings.push({
          code: "nameless_exercise",
          severity: "critical",
          message: `تمرين بلا اسم في اليوم «${d.day}»`,
        });
        continue;
      }
      const sets = Number(ex?.sets);
      if (!Number.isFinite(sets) || sets < 1 || sets > 12) {
        findings.push({
          code: "sets_out_of_band",
          severity: "critical",
          message: `التمرين «${name}» يحمل sets=${ex?.sets} — خارج النطاق المنطقي 1-12`,
        });
      } else {
        totalSets += sets;
      }
      if (!String(ex?.reps ?? "").trim()) {
        findings.push({
          code: "missing_reps",
          severity: "warning",
          message: `التمرين «${name}» بلا تكرارات (reps)`,
        });
      }
      if (!String(ex?.rest ?? "").trim()) {
        findings.push({
          code: "missing_rest",
          severity: "warning",
          message: `التمرين «${name}» بلا راحة (rest)`,
        });
      }
      // Suitability axes — library-matched exercises only.
      if (opts.lookupExercise) {
        let lib: { equipment: string; level: string; slug: string } | null = null;
        try {
          lib = opts.lookupExercise(name);
        } catch {
          lib = null;
        }
        if (lib) {
          if (isHome && /barbell|cable|machine/i.test(lib.equipment)) {
            findings.push({
              code: "home_equipment_mismatch",
              severity: "critical",
              message: `التمرين «${name}» يحتاج ${lib.equipment} بينما مكان تدريب العميل منزلي`,
            });
          }
          if (isBeginner && lib.level === "advanced") {
            findings.push({
              code: "advanced_for_beginner",
              severity: "warning",
              message: `التمرين «${name}» متقدم بينما مستوى العميل مبتدئ`,
            });
          }
          const slug = String(lib.slug ?? "").toLowerCase();
          if (injuries) {
            if (/knee|ركبة|رباط صليبي|acl/.test(injuries) && /squat|lunge|jump|plyo|leg-?press|step-?up/.test(slug)) {
              findings.push({
                code: "injury_unsafe",
                severity: "critical",
                message: `التمرين «${name}» غير آمن لإصابة الركبة المسجلة`,
              });
            }
            if (/shoulder|كتف|rotator/.test(injuries) && /overhead-?press|dip|behind-?neck|upright-?row|military/.test(slug)) {
              findings.push({
                code: "injury_unsafe",
                severity: "critical",
                message: `التمرين «${name}» غير آمن لإصابة الكتف المسجلة`,
              });
            }
            if (/\bback\b|ظهر|lumbar|قرص|slipped|hernia/.test(injuries) && /deadlift|good-?morning|bent-?over-?row|squat/.test(slug)) {
              findings.push({
                code: "injury_unsafe",
                severity: "critical",
                message: `التمرين «${name}» غير آمن لإصابة الظهر المسجلة`,
              });
            }
          }
        }
      }
    }
  }

  if (days.length > 0 && trainingDays === 0) {
    findings.push({
      code: "no_training_days",
      severity: "critical",
      message: "البرنامج كله أيام راحة — لا أيام تدريبية",
    });
  }

  return {
    findings,
    stats: { days: days.length, trainingDays, exercises, totalSets },
  };
}

/** True when an audit report carries at least one CRITICAL finding. */
export function hasCriticalFindings(
  report: { findings: Array<{ severity: string }> },
): boolean {
  return report.findings.some((f) => f.severity === "critical");
}

/** True when any constraints are enforceable for this audit. */
export function auditHasConstraints(report: { constraints: ClientItemConstraints }): boolean {
  return hasItemConstraints(report.constraints);
}
