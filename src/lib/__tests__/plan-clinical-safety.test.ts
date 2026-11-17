import { describe, it, expect } from "vitest";
import {
  detectClinicalConditions,
  clinicalPromptBlock,
  clinicalConditionLabels,
  clinicalForbiddenTokens,
  medicalDisclosureFor,
  allClinicalConditionKeys,
} from "@/lib/plan-clinical-safety";
import {
  checkItemConstraints,
  buildClientConstraints,
  hasItemConstraints,
} from "@/lib/plan-ai-validation";
import {
  normalizeNutritionPlan,
  normalizeCoachPlanText,
  computeNutritionTargets,
  declaredHealthText,
  constraintsFromContext,
} from "@/lib/plan-generator";
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

/* ═══════════════ GAP-18 CANARIES (fix order 2026-11-17 — gap-register
 * GAP-18, owner remediation order «إصلاح ربط حقل medical في الاستبيان
 * الحقيقي بطبقة الكشف الإكلينيكي… استشر متخصصًا في التغذية العلاجية عند
 * مراجعة منطق السلامة») ═══════════════
 *
 * THE MEASURED DEFECT (live re-verified on beacon 3269d924 —
 * raw/t4/gap-18-19-fix-verification.md): the REAL questionnaire form
 * (QuestionnairesView nutritionFields) writes the health answer under
 * `medical` — the diabetic member's production row carries ONLY that key —
 * while the clinical layer read `health`/`medical_conditions`: the plan
 * (c2a952fc) shipped with medical_disclosure.conditions=[] and
 * data_analysis.health="" while the questionnaire literally declared
 * «سكري النوع الثاني — أتناول دواء الميتفورمين مرتين يوميًا».
 *
 * THE LAW THESE CANARIES PIN:
 *   · LINKAGE: ONE canonical extraction (declaredHealthText) feeds EVERY
 *     consumer — the `medical` key now reaches detection, the clinical
 *     prompt block, the clinical item gate and the disclosure exactly like
 *     the legacy `health` key always did.
 *   · SPECIALIST REVIEW (clinical-dietitian consultation 2026-11-17):
 *     Egyptian-context keyword extensions, the hypertension directional
 *     guard («ضغط منخفض» never gets the low-sodium rule), the completed
 *     concentrated-sugar gate (تمر/بلح/زبيب/دبس/قمر الدين…) with the
 *     تمرين and عصير-ليمون guards, the completed gluten gate, the
 *     fasting-aware diabetes rule, the diabetes×celiac merge line, and
 *     the disclosure's glucose-monitoring + stop-on-symptoms sentences.
 */

describe("GAP-18 — declaredHealthText: the REAL form's `medical` key is the canonical extraction", () => {
  /** The EXACT keys the live production questionnaire row carries. */
  const REAL_FORM_ROW = {
    gender: "ذكر",
    age: "48",
    height: "175",
    weight: "92",
    target_weight: "80",
    waist: "105",
    neck: "40",
    hip: "",
    diet: "balanced",
    allergies: "حساسية مكسرات (فول سوداني وعين جمل)",
    disliked: "",
    meals: "4",
    water: "",
    medical: DIABETIC_EVIDENCE_TEXT,
    supplements: "",
  };

  it("extracts the `medical` key (the live form's field — no `health` key exists on the row)", () => {
    expect(declaredHealthText(REAL_FORM_ROW)).toBe(DIABETIC_EVIDENCE_TEXT);
  });

  it("precedence: `medical` (the live form) wins; `health` (T1 fixture/legacy) then `medical_conditions` fall back", () => {
    expect(declaredHealthText({ medical: "أ", health: "ب", medical_conditions: "ج" })).toBe("أ");
    expect(declaredHealthText({ health: "ب", medical_conditions: "ج" })).toBe("ب");
    expect(declaredHealthText({ medical_conditions: "ج" })).toBe("ج");
    expect(declaredHealthText({})).toBe("");
    expect(declaredHealthText(null)).toBe("");
    expect(declaredHealthText({ medical: "  نص بفراغات  " })).toBe("نص بفراغات");
  });
});

/** A diabetic member context shaped EXACTLY like the live questionnaire row
 * (the `medical` key — what production actually sends as clientContext.nutrition). */
const realFormDiabeticCtx: ClientContext = {
  name: "عضو سكري — الاستبيان الحقيقي",
  nutrition: {
    gender: "ذكر",
    age: "48",
    height: "175",
    weight: "92",
    target_weight: "80",
    diet: "balanced",
    allergies: "حساسية مكسرات (فول سوداني وعين جمل)",
    meals: "4",
    medical: DIABETIC_EVIDENCE_TEXT,
  },
  fitness: { goal: "خسارة الوزن", activity: "light", days: "3" },
  recent_measurements: [],
  recent_plan_names: [],
};

describe("GAP-18 — the `medical` key reaches EVERY clinical consumer through the ONE canonical extraction", () => {
  it("constraintsFromContext: the real-form diabetic ctx builds clinical gate tokens (the item-gate linkage)", () => {
    const constraints = constraintsFromContext(realFormDiabeticCtx, null);
    expect(constraints).toBeDefined();
    expect(hasItemConstraints(constraints)).toBe(true);
    // The concentrated-sugar family rides the gate from the `medical` key:
    expect(checkItemConstraints("تمر مجفف", {}, constraints)).toContain("إكلينيكيًا");
    expect(checkItemConstraints("مشروب غازي", {}, constraints)).toContain("إكلينيكيًا");
    // The nut allergy rides the SAME bundle (both layers, one gate):
    expect(checkItemConstraints("زبدة فول سوداني", {}, constraints)).toBeTruthy();
    // Compliant staples sail through:
    expect(checkItemConstraints("دجاج مشوي", {}, constraints)).toBeNull();
  });

  it("computeNutritionTargets: targets.healthText carries the `medical` answer (the disclosure/echo source)", () => {
    const targets = computeNutritionTargets(realFormDiabeticCtx);
    expect(targets.healthText).toBe(DIABETIC_EVIDENCE_TEXT);
  });

  it("normalizeNutritionPlan: the real-form diabetic plan stamps the condition-aware disclosure + the health echo", () => {
    const targets = computeNutritionTargets(realFormDiabeticCtx);
    const content = normalizeNutritionPlan(
      {
        overview: "خطة مخصصة.",
        daily_calories: 9999,
        macros: { protein_g: 130, carbs_g: 200, fat_g: 60 },
        meals: [
          { name: "الفطار", total_calories: 500, items: [{ food: "بيض مسلوق", amount: "3 بيضات", calories: 230 }] },
          { name: "الغداء", total_calories: 700, items: [{ food: "دجاج مشوي", amount: "200 جم", calories: 330 }] },
          { name: "العشاء", total_calories: 600, items: [{ food: "سمك بلطي", amount: "200 جم", calories: 300 }] },
        ],
      },
      undefined,
      targets,
    );
    // The GAP-18 kill: conditions=[] is impossible for the real form now.
    expect(content.medical_disclosure?.conditions).toContain("سكري");
    expect(content.medical_disclosure?.warning).toContain("حالتك الصحية المعلنة (سكري)");
    expect(content.data_analysis?.health).toBe(DIABETIC_EVIDENCE_TEXT);
  });
});

describe("GAP-18 — specialist review: Egyptian-context keyword extensions for the EXISTING conditions", () => {
  it("the documented local wordings now detect (غدة · فيروس سي · حصوات · بترضع · جلطة · داونيل · high blood sugar)", () => {
    expect(detectClinicalConditions({ healthText: "عندي غدة" })).toEqual(["thyroid"]);
    expect(detectClinicalConditions({ healthText: "حامل فيروس سي" })).toEqual(["liver", "pregnancy"]);
    expect(detectClinicalConditions({ healthText: "عندي حصوات في الكلى" })).toEqual(["kidney"]);
    expect(detectClinicalConditions({ healthText: "بترضع توأم" })).toEqual(["breastfeeding"]);
    expect(detectClinicalConditions({ healthText: "جلطة سابقة وقسطرة" })).toEqual(["cardiac"]);
    expect(detectClinicalConditions({ healthText: "على داونيل للسكر" })).toEqual(["diabetes"]);
    expect(detectClinicalConditions({ healthText: "high blood sugar" })).toEqual(["diabetes"]);
    expect(detectClinicalConditions({ healthText: "على غسيل كلوي" })).toEqual(["kidney"]);
  });
});

describe("GAP-18 — specialist review: the hypertension DIRECTIONAL guard", () => {
  it("«ضغط منخفض» / low blood pressure NEVER gets the low-sodium rule (the one harmful false positive)", () => {
    expect(detectClinicalConditions({ healthText: "ضغط الدم منخفض" })).toEqual([]);
    expect(detectClinicalConditions({ healthText: "low blood pressure" })).toEqual([]);
    expect(detectClinicalConditions({ healthText: "ضغطي واطي دايمًا" })).toEqual([]);
  });

  it("affirmative and MIXED declarations still detect (the guard never hides a real hypertensive)", () => {
    expect(detectClinicalConditions({ healthText: "ضغط مرتفع" })).toEqual(["hypertension"]);
    expect(detectClinicalConditions({ healthText: "ارتفاع ضغط الدم" })).toEqual(["hypertension"]);
    expect(detectClinicalConditions({ healthText: "high blood pressure" })).toEqual(["hypertension"]);
    expect(detectClinicalConditions({ healthText: "ضغطي منخفض أحيانًا ومرتفع أحيانًا" })).toEqual(["hypertension"]);
  });
});

describe("GAP-18 — specialist review: the COMPLETED concentrated-sugar gate for diabetes", () => {
  const diabeticGate = buildClientConstraints({
    clinicalTokens: clinicalForbiddenTokens(["diabetes"]),
  });

  it("dates/raisins/dibs/قمر الدين/halawa/energy drinks — the live-evidence class — now reject", () => {
    for (const food of [
      "تمر مجفف", "بلح", "زبيب", "دبس التمر", "قمر الدين", "حلاوة طحينية",
      "مشروب طاقة", "ريد بول", "مشروب غازي", "Dates with coffee", "raisins",
    ]) {
      expect(checkItemConstraints(food, {}, diabeticGate), food).toContain("إكلينيكيًا");
    }
  });

  it("the تمرين guard: exercise wordings never fire the date token", () => {
    expect(checkItemConstraints("وجبة ما قبل تمارين الصباح", {}, diabeticGate)).toBeNull();
    expect(checkItemConstraints("سعرات قبل التمرين", {}, diabeticGate)).toBeNull();
    expect(checkItemConstraints("يتمرن بالمشي", {}, diabeticGate)).toBeNull();
  });

  it("the عصير-ليمون guard: the default Egyptian salad dressing never fires the juice token", () => {
    expect(checkItemConstraints("سلطة بعصير ليمون", {}, diabeticGate)).toBeNull();
    expect(checkItemConstraints("سلطة خضراء بليمون", {}, diabeticGate)).toBeNull();
    // Every other juice wording keeps matching:
    expect(checkItemConstraints("عصير برتقال", {}, diabeticGate)).toContain("إكلينيكيًا");
    expect(checkItemConstraints("عصائر طازجة", {}, diabeticGate)).toContain("إكلينيكيًا");
  });
});

describe("GAP-18 — specialist review: the COMPLETED gluten gate for celiac", () => {
  const celiacGate = buildClientConstraints({
    clinicalTokens: clinicalForbiddenTokens(["celiac"]),
  });

  it("the missed unambiguous gluten carriers now reject (شعرية · بسكويت · بيتزا · بقلاوة · بقسماط · فطير)", () => {
    for (const food of ["رز بالشعرية", "بسكويت شوفان", "بيتزا", "بقلاوة", "بقسماط", "فطير مشلتت", "couscous"]) {
      expect(checkItemConstraints(food, {}, celiacGate), food).toContain("إكلينيكيًا");
    }
  });

  it("gluten-free flours/starches stay legitimate (the conservative law — no overreach)", () => {
    for (const food of ["دقيق أرز", "نشا ذرة", "أرز أبيض", "بطاطس مشوية"]) {
      expect(checkItemConstraints(food, {}, celiacGate), food).toBeNull();
    }
  });
});

describe("GAP-18 — specialist review: the fasting-aware diabetes rule + the diabetes×celiac merge", () => {
  it("the diabetes prompt rule addresses fasting (Ramadan/intermittent) with the doctor-first law", () => {
    const block = clinicalPromptBlock(["diabetes"]);
    expect(block).toContain("استشر طبيبك قبل الصيام");
    expect(block).toContain("الإفطار والسحور");
    expect(block).toContain("أعراض هبوط السكر");
    expect(block).toContain("التمر والرطب");
  });

  it("diabetes + celiac renders the merge line (whole grains: gluten-free ONLY)", () => {
    const block = clinicalPromptBlock(["diabetes", "celiac"]);
    expect(block).toContain("قاعدة دمج");
    expect(block).toContain("خالية من الجلوتين حصرًا");
  });

  it("the merge line never renders for either condition alone", () => {
    expect(clinicalPromptBlock(["diabetes"])).not.toContain("قاعدة دمج");
    expect(clinicalPromptBlock(["celiac"])).not.toContain("قاعدة دمج");
  });
});

describe("GAP-18 — specialist review: the disclosure's glucose-monitoring + stop-on-symptoms sentences", () => {
  it("a diabetic member's disclosure demands blood-glucose monitoring and names the red-flag symptoms", () => {
    const d = medicalDisclosureFor(["diabetes"]);
    expect(d.warning).toContain("راقب سكر دمك");
    expect(d.warning).toContain("اعرض القراءات على طبيبك");
    expect(d.warning).toContain("توقف عن الخطة");
    expect(d.warning).toContain("دوخة، رعشة، غثيان، ضيق تنفس");
  });

  it("a NON-diabetic condition's disclosure keeps the tail but skips the glucose sentence", () => {
    const d = medicalDisclosureFor(["hypertension"]);
    expect(d.warning).not.toContain("راقب سكر دمك");
    expect(d.warning).toContain("توقف عن الخطة");
    expect(d.conditions).toEqual(["ارتفاع ضغط الدم"]);
  });

  it("the general form (clean member) is unchanged — no monitoring, no tail", () => {
    const d = medicalDisclosureFor([]);
    expect(d.warning).toBe(
      "تنبيه صحي: هذه الخطة أُنتجت بالذكاء الاصطناعي لأغراض معلوماتية عامة وليست وصفة طبية أو استشارة تغذية علاجية. قبل البدء في تطبيقها راجعها مع طبيبك أو مع أخصائي تغذية مؤهل — خاصة إذا كنت تتناول أدوية أو تعاني من أي حالة صحية.",
    );
  });
});

/* ═══════════════ GAP-18 COMPLETION CANARIES (owner clarification
 * 2026-11-17 — «افحص تنفيذ GAP-18 الحالي وتأكد من وجود هذا التحذير
 * فعلًا لكل الحالات الطبية المكتشفة، وليس السكري والسيلياك فقط… تأكد
 * من ظهوره في جميع مسارات توليد الخطط، سواء AI أو Local، وعلى القنوات
 * والواجهات التي تعرض الخطة… لا تشترط إضافة قواعد غذائية تفصيلية لكل
 * مرض حتى يظهر التحذير العام») ═══════════════
 *
 * THE LAW THESE CANARIES PIN:
 *   · EVERY classified condition (the LIVE table — 13 today, more
 *     tomorrow) yields the condition-aware warning: the label rides the
 *     warning, professional review is demanded BEFORE applying, and the
 *     plan is explicitly not a medical prescription.
 *   · A declared condition OUTSIDE the table (thalassemia, IBD,
 *     cancer…) still gets the EXPLICIT warning — consult a qualified
 *     specialist before following the plan; the plan does not replace
 *     medical consultation. Detection/gates stay table-bound; the
 *     WARNING never does (the ordered warning does not depend on
 *     per-disease rules).
 *   · NEGATIVE declarations («لا يوجد»…) are NOT conditions — the
 *     healthy member keeps the general form (no false scare).
 *   · The disclosure FLOOR: normalizeNutritionPlan stamps a disclosure
 *     on EVERY nutrition content it returns — targets path (AI +
 *     local), targets-less path (coach-paste / external floor) — no
 *     diet plan leaves the normalizer without the warning. */

describe("GAP-18 completion — the explicit warning fires for EVERY classified condition (the live table, not just diabetes/celiac)", () => {
  it("every condition key in the LIVE table yields the condition-aware warning (label + review-before-applying + not-a-prescription)", () => {
    const keys = allClinicalConditionKeys();
    expect(keys.length).toBeGreaterThanOrEqual(13);
    for (const key of keys) {
      const d = medicalDisclosureFor([key]);
      expect(d.flag).toBe("medical_review_advised");
      expect(d.conditions.length).toBe(1);
      // The condition's own label rides the warning text:
      expect(d.warning).toContain(d.conditions[0]);
      // Consult a professional BEFORE applying the plan:
      expect(d.warning).toContain("راجع الخطة مع طبيبك أو مع أخصائي تغذية مؤهل قبل تطبيقها");
      // The plan is explicitly NOT a medical consultation:
      expect(d.warning).toContain("ليست وصفة طبية أو استشارة تغذية علاجية");
      // The stop-on-symptoms safety valve rides every condition-aware form:
      expect(d.warning).toContain("توقف عن الخطة وراجع طبيبك");
    }
  });

  it("the live-table keys each classify their canonical keyword (the sweep is not vacuous)", () => {
    const probes: Partial<Record<string, string>> = {
      diabetes: "سكري",
      hypertension: "ضغط الدم مرتفع",
      cardiac: "قلب",
      kidney: "كلى",
      liver: "كبد",
      thyroid: "غدة درقية",
      pregnancy: "حامل",
      breastfeeding: "بترضع",
      anemia: "انيميا",
      gout: "نقرس",
      celiac: "سيلياك",
      cholesterol: "كوليسترول",
      pcos: "تكييس",
    };
    for (const key of allClinicalConditionKeys()) {
      const probe = probes[key];
      expect(probe, `probe for ${key}`).toBeDefined();
      expect(detectClinicalConditions({ healthText: probe })).toContain(key);
    }
  });

  it("a multi-condition declaration renders ALL labels in the warning (table order)", () => {
    const keys: ReturnType<typeof allClinicalConditionKeys> = ["hypertension", "diabetes", "celiac"];
    const d = medicalDisclosureFor(keys);
    expect(d.conditions).toEqual(["ارتفاع ضغط الدم", "سكري", "سيلياك / حساسية جلوتين"]);
    for (const label of d.conditions) expect(d.warning).toContain(label);
  });
});

describe("GAP-18 completion — declared-but-unclassified: the explicit warning WITHOUT per-disease rules", () => {
  it("a declared condition OUTSIDE the table (thalassemia) gets the EXPLICIT warning — not the general form", () => {
    const text = "عندي تلاسيميا وأتناول نقل دم منتظم";
    const keys = detectClinicalConditions({ healthText: text });
    expect(keys).toEqual([]); // genuinely outside the 13-condition table
    const d = medicalDisclosureFor(keys, text);
    expect(d.flag).toBe("medical_review_advised");
    expect(d.conditions).toEqual([]);
    // The explicit consult-a-qualified-specialist warning (the owner's ordered wording):
    expect(d.warning).toContain("حالة صحية معلنة");
    expect(d.warning).toContain("استشر طبيبك أو متخصصًا مؤهلًا في التغذية العلاجية قبل اتباع هذه الخطة");
    // The plan does NOT replace medical consultation:
    expect(d.warning).toContain("هذه الخطة لا تغني عن الاستشارة الطبية");
    // The stop-on-symptoms valve rides this form too:
    expect(d.warning).toContain("توقف عن الخطة وراجع طبيبك");
    // NOT the general form (the general-only conditional phrasing is absent):
    expect(d.warning).not.toContain("خاصة إذا كنت تتناول أدوية");
  });

  it("more unclassified declarations (IBD · cancer · bariatric) — the same explicit warning, no per-disease rules needed", () => {
    for (const text of [
      "عندي كرونز (التهاب أمعاء) من 3 سنين",
      "سرطان قولون تحت علاج كيماوي",
      "عاملة تحويل مسار معدة قبل سنتين",
    ]) {
      expect(detectClinicalConditions({ healthText: text })).toEqual([]);
      const d = medicalDisclosureFor([], text);
      expect(d.warning).toContain("استشر طبيبك أو متخصصًا مؤهلًا في التغذية العلاجية");
      expect(d.warning).toContain("لا تغني عن الاستشارة الطبية");
    }
  });

  it("NEGATIVE declarations keep the general form — «لا يوجد» is not a condition (no false scare on a healthy member)", () => {
    for (const negative of [
      "لا يوجد",
      "لا يوجد لدي أمراض",
      "لا أعاني من شيء",
      "الحمد لله",
      "الحمد لله سليم",
      "سليم",
      "بصحة جيدة",
      "لا",
      "none",
      "Nothing",
    ]) {
      expect(detectClinicalConditions({ healthText: negative })).toEqual([]);
      const d = medicalDisclosureFor([], negative);
      expect(d.warning).toContain("قبل البدء في تطبيقها"); // the general form
      expect(d.warning).not.toContain("حالة صحية معلنة"); // never the explicit-declared form
    }
  });

  it("a REAL declaration that merely starts with «لا» never misclassifies as negative", () => {
    const text = "لا أستطيع المشي كثيرًا بسبب مشكلة في الركبة والحوض";
    expect(detectClinicalConditions({ healthText: text })).toEqual([]);
    const d = medicalDisclosureFor([], text);
    expect(d.warning).toContain("حالة صحية معلنة"); // the explicit form — it IS a declaration
  });
});

describe("GAP-18 completion — normalizeNutritionPlan: the disclosure floor on EVERY generation path", () => {
  const modelPlan = {
    overview: "خطة تغذية مخصصة.",
    daily_calories: 1800,
    macros: { protein_g: 130, carbs_g: 180, fat_g: 60 },
    meals: [
      { name: "الفطار", total_calories: 500, items: [{ food: "بيض مسلوق", amount: "3 بيضات", calories: 230 }] },
      { name: "الغداء", total_calories: 700, items: [{ food: "دجاج مشوي", amount: "200 جم", calories: 330 }] },
    ],
    supplements: [],
    health_notes: [],
  };

  it("targets path (AI + local): an UNCLASSIFIED declared condition stamps the explicit warning (the GAP-18 completion state)", () => {
    const targets = computeNutritionTargets({
      ...cleanCtx,
      nutrition: {
        gender: "ذكر",
        weight: "85",
        height: "178",
        age: "30",
        activity: "متوسط",
        health: "عندي تلاسيميا",
        goal: "خسارة الوزن",
        diet: "balanced",
        meals: 4,
      },
    });
    const content = normalizeNutritionPlan(modelPlan, undefined, targets);
    expect(content.medical_disclosure?.conditions).toEqual([]);
    expect(content.medical_disclosure?.warning).toContain("استشر طبيبك أو متخصصًا مؤهلًا في التغذية العلاجية");
    expect(content.medical_disclosure?.warning).toContain("لا تغني عن الاستشارة الطبية");
    expect(content.data_analysis?.health).toBe("عندي تلاسيميا");
  });

  it("targets path: the real form's `medical` key with a NEGATIVE answer keeps the general disclosure (healthy member)", () => {
    const targets = computeNutritionTargets({
      ...cleanCtx,
      nutrition: {
        gender: "ذكر",
        weight: "85",
        height: "178",
        age: "30",
        activity: "متوسط",
        medical: "لا يوجد",
        goal: "خسارة الوزن",
        diet: "balanced",
        meals: 4,
      },
    });
    const content = normalizeNutritionPlan(modelPlan, undefined, targets);
    expect(content.medical_disclosure?.conditions).toEqual([]);
    expect(content.medical_disclosure?.warning).toContain("قبل البدء في تطبيقها");
    expect(content.medical_disclosure?.warning).not.toContain("حالة صحية معلنة");
  });

  it("targets-LESS path (coach-paste): the client's declaredHealthText stamps the condition-aware disclosure", () => {
    const content = normalizeNutritionPlan(modelPlan, undefined, undefined, DIABETIC_EVIDENCE_TEXT);
    expect(content.medical_disclosure?.conditions).toContain("سكري");
    expect(content.medical_disclosure?.warning).toContain("راجع الخطة مع طبيبك أو مع أخصائي تغذية مؤهل قبل تطبيقها");
  });

  it("targets-LESS path with NO declared text (external-plans floor): the GENERAL warning still stamps — no diet plan leaves the normalizer without a disclosure", () => {
    const content = normalizeNutritionPlan(modelPlan, undefined, undefined);
    expect(content.medical_disclosure).toBeDefined();
    expect(content.medical_disclosure?.flag).toBe("medical_review_advised");
    expect(content.medical_disclosure?.conditions).toEqual([]);
    expect(content.medical_disclosure?.warning).toContain("أخصائي تغذية مؤهل");
  });

  it("targets-LESS path with an unclassified declared text stamps the explicit warning too (the three states hold on every path)", () => {
    const content = normalizeNutritionPlan(modelPlan, undefined, undefined, "عندي تلاسيميا");
    expect(content.medical_disclosure?.warning).toContain("لا تغني عن الاستشارة الطبية");
  });
});

describe("GAP-18 completion — normalizeCoachPlanText (the coach-paste path): the SAME disclosure, no alternative warning path", () => {
  const pastedPlanJson = JSON.stringify({
    overview: "خطة لصق مدرب.",
    daily_calories: 1600,
    macros: { protein_g: 120, carbs_g: 160, fat_g: 53 },
    meals: [
      { name: "الفطار", total_calories: 400, items: [{ food: "شوفان", amount: "60 جم", calories: 220 }] },
      { name: "العشاء", total_calories: 500, items: [{ food: "سمك مشوي", amount: "200 جم", calories: 300 }] },
    ],
    supplements: [],
    health_notes: [],
  });

  it("JSON-direct: a pasted diet plan for a diabetic client carries the condition-aware disclosure", async () => {
    const { content, source } = await normalizeCoachPlanText(pastedPlanJson, "nutrition", DIABETIC_EVIDENCE_TEXT);
    expect(source).toBe("json-direct");
    const md = (content as unknown as { medical_disclosure?: { conditions?: string[]; warning?: string } }).medical_disclosure;
    expect(md?.conditions).toContain("سكري");
    expect(md?.warning).toContain("قبل تطبيقها");
  });

  it("JSON-direct: a pasted diet plan with NO declared text still carries the GENERAL floor", async () => {
    const { content } = await normalizeCoachPlanText(pastedPlanJson, "nutrition");
    const md = (content as unknown as { medical_disclosure?: { flag?: string; conditions?: string[]; warning?: string } }).medical_disclosure;
    expect(md?.flag).toBe("medical_review_advised");
    expect(md?.conditions).toEqual([]);
    expect(md?.warning).toContain("أخصائي تغذية مؤهل");
  });

  it("a pasted WORKOUT plan never carries the nutrition disclosure (the owner's order names the diet plan)", async () => {
    const { content } = await normalizeCoachPlanText(
      JSON.stringify({ overview: "", days: [] }),
      "workout",
      DIABETIC_EVIDENCE_TEXT,
    );
    expect(content && typeof content === "object" && "medical_disclosure" in content).toBe(false);
  });
});
