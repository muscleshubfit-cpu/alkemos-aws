import { describe, it, expect } from "vitest";
import {
  detectClinicalConditions,
  clinicalPromptBlock,
  clinicalConditionLabels,
  clinicalForbiddenTokens,
  medicalDisclosureFor,
} from "@/lib/plan-clinical-safety";
import {
  checkItemConstraints,
  buildClientConstraints,
  hasItemConstraints,
} from "@/lib/plan-ai-validation";
import { normalizeNutritionPlan, computeNutritionTargets } from "@/lib/plan-generator";
import type { ClientContext } from "@/lib/ai-local";

/**
 * NUT-12 canaries (fix order 2026-11-16 — gap-register GAP-1, the measured
 * safety gap from the T1 live frame):
 *
 * THE MEASURED DEFECT (raw/t1/job-a7200467-nut12.md · plans#9ed66be8 · run
 * 43925615337): a type-2 diabetic member on metformin received an AI plan
 * with ZERO clinical marks — needs_review=null, data_analysis.health=None —
 * a standard-deficit card presented as safe.
 *
 * THE LAW THESE CANARIES PIN:
 *   · DETECT: declared health text classifies deterministically (Arabic +
 *     English, spelling drift tolerated; the exact live-evidence text
 *     included).
 *   · STEER: detected conditions render a mandatory clinical prompt block
 *     ("" when nothing declared — no invented conditions).
 *   · GATE: the concentrated-sugar family is PROHIBITED for diabetics /
 *     the gluten family for celiacs — checkItemConstraints rejects them
 *     exactly like allergens.
 *   · DISCLOSE: normalizeNutritionPlan stamps medical_disclosure on every
 *     targets-carrying plan (general warning; condition-aware upgrade) and
 *     data_analysis.health echoes the questionnaire truth — while
 *     needs_review stays UNTOUCHED by clinical detection (the owner's
 *     order: NO trainer / in-platform review requirement).
 */

/** The EXACT health text the T1 live evidence used (job a7200467). */
const DIABETIC_EVIDENCE_TEXT = "سكري النوع الثاني — أتناول دواء الميتفورمين مرتين يوميًا";

describe("detectClinicalConditions — deterministic detection", () => {
  it("the live-evidence diabetic text classifies as diabetes (the GAP-1 regression pin)", () => {
    expect(detectClinicalConditions({ healthText: DIABETIC_EVIDENCE_TEXT })).toEqual(["diabetes"]);
  });

  it("English declarations classify the same", () => {
    expect(detectClinicalConditions({ healthText: "Type 2 diabetes, on metformin 500mg twice daily" })).toEqual(["diabetes"]);
    expect(detectClinicalConditions({ healthText: "hypertension, on medication" })).toEqual(["hypertension"]);
    expect(detectClinicalConditions({ healthText: "celiac disease — strict gluten free" })).toEqual(["celiac"]);
  });

  it("spelling drift and Arabic shapes still match", () => {
    expect(detectClinicalConditions({ healthText: "أنيميا وفقر دم مزمن" })).toEqual(["anemia"]);
    expect(detectClinicalConditions({ healthText: "حساسية الجلوتين (سيلياك)" })).toEqual(["celiac"]);
    expect(detectClinicalConditions({ healthText: "غدة درقية خاملة" })).toEqual(["thyroid"]);
  });

  it("multiple conditions in one declaration all fire, in table order", () => {
    expect(detectClinicalConditions({ healthText: "سكري وضغط مرتفع وكوليسترول عالي" })).toEqual([
      "diabetes",
      "hypertension",
      "cholesterol",
    ]);
  });

  it("a clean declaration classifies NOTHING — no invented conditions, ever", () => {
    expect(detectClinicalConditions({ healthText: "لا يوجد" })).toEqual([]);
    expect(detectClinicalConditions({ healthText: "" })).toEqual([]);
    expect(detectClinicalConditions({ healthText: null })).toEqual([]);
  });
});

describe("clinicalPromptBlock — mandatory steering, empty when unconstrained", () => {
  it("renders the diabetes rule + the doctor-review law for the diabetic declaration", () => {
    const block = clinicalPromptBlock(["diabetes"]);
    expect(block).toContain("سكري");
    expect(block).toContain("وزّع الكربوهيدرات");
    expect(block).toContain("data_analysis.health");
    expect(block).toContain("طبيب أو أخصائي تغذية مؤهل");
  });

  it("empty for a clean member (the prompt stays exactly as before)", () => {
    expect(clinicalPromptBlock([])).toBe("");
  });
});

describe("clinicalForbiddenTokens + checkItemConstraints — the item gate", () => {
  it("the concentrated-sugar family is prohibited for a diabetic member (juice/candy/honey class)", () => {
    const constraints = buildClientConstraints({
      clinicalTokens: clinicalForbiddenTokens(["diabetes"]),
    });
    expect(hasItemConstraints(constraints)).toBe(true);
    expect(checkItemConstraints("عصير برتقال طازج", {}, constraints)).toContain("إكلينيكيًا");
    expect(checkItemConstraints("شوكولاتة داكنة", {}, constraints)).toContain("إكلينيكيًا");
    expect(checkItemConstraints("مربى فراولة", {}, constraints)).toContain("إكلينيكيًا");
    // The compliant staples sail through:
    expect(checkItemConstraints("دجاج مشوي", {}, constraints)).toBeNull();
    expect(checkItemConstraints("خبز بلدي", {}, constraints)).toBeNull();
    expect(checkItemConstraints("فول مدمس", {}, constraints)).toBeNull();
  });

  it("the gluten family is prohibited for a celiac member even with an EMPTY allergy field", () => {
    const constraints = buildClientConstraints({
      clinicalTokens: clinicalForbiddenTokens(["celiac"]),
    });
    expect(checkItemConstraints("خبز بلدي", {}, constraints)).toContain("إكلينيكيًا");
    expect(checkItemConstraints("مكرونة بالصلصة", {}, constraints)).toContain("إكلينيكيًا");
    expect(checkItemConstraints("أرز أبيض", {}, constraints)).toBeNull();
  });

  it("no clinical tokens for a clean member — the gate stays exactly as before", () => {
    const constraints = buildClientConstraints({});
    expect(hasItemConstraints(constraints)).toBe(false);
    expect(checkItemConstraints("عصير برتقال", {}, constraints)).toBeNull();
  });
});

/** A diabetic member context mirroring the live evidence questionnaire. */
const diabeticCtx: ClientContext = {
  name: "عضو اختبار — سكري النوع الثاني",
  nutrition: {
    gender: "ذكر",
    weight: "92",
    height: "175",
    age: "48",
    activity: "خفيف",
    health: DIABETIC_EVIDENCE_TEXT,
    allergies: "حساسية مكسرات (فول سوداني وعين جمل)",
    goal: "خسارة الوزن",
    diet: "balanced",
    meals: 4,
  },
  fitness: { goal: "خسارة الوزن", activity: "light", days: "3" },
  recent_measurements: [],
  recent_plan_names: [],
};

/** A clean member context (the T1 adult control). */
const cleanCtx: ClientContext = {
  name: "عضو اختبار — بالغ سليم",
  nutrition: {
    gender: "ذكر",
    weight: "85",
    height: "178",
    age: "30",
    activity: "متوسط",
    health: "لا يوجد",
    goal: "خسارة الوزن",
    diet: "balanced",
    meals: 4,
  },
  fitness: { goal: "خسارة الوزن", activity: "moderate", days: "4" },
  recent_measurements: [],
  recent_plan_names: [],
};

describe("medicalDisclosureFor — the client-facing warning", () => {
  it("condition-aware: names the condition and demands doctor review BEFORE applying", () => {
    const d = medicalDisclosureFor(["diabetes"]);
    expect(d.flag).toBe("medical_review_advised");
    expect(d.conditions).toEqual(clinicalConditionLabels(["diabetes"]));
    expect(d.warning).toContain("سكري");
    expect(d.warning).toContain("طبيب");
    expect(d.warning).toContain("أخصائي تغذية مؤهل");
    expect(d.warning).toContain("قبل تطبيقها");
    expect(d.warning).toContain("أدويتك");
  });

  it("general form for a clean member — still the review-with-a-professional warning", () => {
    const d = medicalDisclosureFor([]);
    expect(d.conditions).toEqual([]);
    expect(d.warning).toContain("طبيبك أو مع أخصائي تغذية مؤهل");
    expect(d.warning).toContain("قبل البدء في تطبيقها");
  });
});

describe("normalizeNutritionPlan — the deterministic NUT-12 stamp (both generation paths flow through here)", () => {
  const modelPlan = {
    overview: "خطة تغذية مخصصة.",
    data_analysis: { bmr: 1700, tdee: 2100 },
    daily_calories: 9999,
    macros: { protein_g: 130, carbs_g: 200, fat_g: 60 },
    meals: [
      { name: "الفطار", total_calories: 500, items: [{ food: "بيض مسلوق", amount: "3 بيضات", calories: 230 }] },
      { name: "الغداء", total_calories: 700, items: [{ food: "دجاج مشوي", amount: "200 جم", calories: 330 }] },
      { name: "العشاء", total_calories: 600, items: [{ food: "سمك بلطي", amount: "200 جم", calories: 300 }] },
    ],
    supplements: [],
    health_notes: [],
    water_target: "2 لتر يومياً",
  };

  it("a diabetic member's plan carries the condition-aware disclosure + the health echo (the GAP-1 kill)", () => {
    const targets = computeNutritionTargets(diabeticCtx);
    const content = normalizeNutritionPlan(modelPlan, undefined, targets);
    expect(content.medical_disclosure).toBeDefined();
    expect(content.medical_disclosure?.flag).toBe("medical_review_advised");
    expect(content.medical_disclosure?.conditions).toContain("سكري");
    expect(content.medical_disclosure?.warning).toContain("طبيب");
    // The model OMITTED data_analysis.health in the GAP-1 evidence — the
    // questionnaire truth now fills it deterministically:
    expect(content.data_analysis?.health).toBe(DIABETIC_EVIDENCE_TEXT);
  });

  it("a clean member's plan carries the general disclosure with an empty conditions list", () => {
    const targets = computeNutritionTargets(cleanCtx);
    const content = normalizeNutritionPlan(modelPlan, undefined, targets);
    expect(content.medical_disclosure?.conditions).toEqual([]);
    expect(content.medical_disclosure?.warning).toContain("أخصائي تغذية مؤهل");
    expect(content.data_analysis?.health).toBe("لا يوجد");
  });

  it("clinical detection NEVER pollutes needs_review — no trainer/in-platform review is required (owner's order)", () => {
    const targets = computeNutritionTargets(diabeticCtx);
    expect(targets.reviewFlags).not.toContain("diabetes");
    expect(targets.reviewFlags.find((f) => f.includes("clinical") || f.includes("medical"))).toBeUndefined();
    const content = normalizeNutritionPlan(modelPlan, undefined, targets);
    const flags = content.needs_review?.flags ?? [];
    expect(flags.find((f) => f.includes("clinical") || f.includes("medical") || f.includes("diabet"))).toBeUndefined();
  });

  it("the health echo prefers the questionnaire truth over a model echo (server truth wins)", () => {
    const targets = computeNutritionTargets(diabeticCtx);
    const content = normalizeNutritionPlan(
      { ...modelPlan, data_analysis: { ...modelPlan.data_analysis, health: "بصحة جيدة" } },
      undefined,
      targets,
    );
    expect(content.data_analysis?.health).toBe(DIABETIC_EVIDENCE_TEXT);
  });
});
