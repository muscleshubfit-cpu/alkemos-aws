/**
 * NUT-12 (audit AI-GENERATION-PIPELINES 2026-11-15 · fix order 2026-11-16 —
 * gap-register GAP-1, owner remediation order «إصلاح NUT-12 بتحسين دقة
 * الخطط الغذائية ومراعاة الحالات الصحية والحساسيات، وإضافة تحذير واضح
 * للعميل بضرورة مراجعة الخطة مع طبيب أو أخصائي تغذية مؤهل قبل تطبيقها،
 * دون اشتراط وجود مدرب أو مراجعة داخل المنصة»).
 *
 * THE MEASURED DEFECT (raw/t1/job-a7200467-nut12.md): a type-2 diabetic
 * member on metformin received an AI plan with ZERO clinical flags —
 * needs_review=null and data_analysis.health=None — a standard-deficit
 * card presented as safe. The health answer rode the prompt only as inert
 * DATA; nothing deterministic classified it, nothing surfaced it.
 *
 * THE LAW THIS MODULE PINS (deterministic, server-side, both generation
 * paths — AI chain AND local fallback):
 *   1. DETECT: the questionnaire's health text is classified against a
 *      fixed clinical-condition table (Arabic + English, spelling-drift
 *      tolerant). Detection is conservative keyword containment over
 *      normalized text — a false positive costs a caution banner (safe
 *      direction); a false negative is the hazard this module exists to
 *      kill, so keywords err on the sensitive side.
 *   2. STEER: detected conditions render a MANDATORY clinical block in
 *      the generation prompt (carb distribution for diabetes, sodium for
 *      hypertension, …) — prompt-level instruction, on top of the
 *      existing allergy/diet constraint gates.
 *   3. DISCLOSE: every generated plan content carries a
 *      `medical_disclosure` block — a clear client-facing WARNING to
 *      review the plan with a doctor or a qualified nutritionist BEFORE
 *      applying it. Condition-aware (names the detected conditions) when
 *      detected; the general form otherwise. This is deliberately NOT a
 *      needs_review flag and NOT in SELF_SERVICE_BLOCKING_REVIEW_FLAGS:
 *      the owner's order explicitly rules OUT requiring a trainer or an
 *      in-platform review — the member receives the plan WITH the
 *      warning, never held hostage to a review step.
 *
 * Pure module — no I/O, no env, unit-testable in isolation.
 */

export type ClinicalConditionKey =
  | "diabetes"
  | "hypertension"
  | "cardiac"
  | "kidney"
  | "liver"
  | "thyroid"
  | "pregnancy"
  | "breastfeeding"
  | "anemia"
  | "gout"
  | "celiac"
  | "cholesterol"
  | "pcos";

type ClinicalConditionDef = {
  key: ClinicalConditionKey;
  /** Arabic display label (rides the disclosure the member reads). */
  labelAr: string;
  /** Normalized detection keywords (Arabic + English). */
  keywords: string[];
  /** The mandatory generation-prompt rule for this condition. */
  promptRuleAr: string;
};

/** Normalize Arabic/Latin text the same way the constraint gate does —
 * diacritics/tatweel stripped, alef/ya/ta-marbuta unified, the leading
 * «ال» dropped, punctuation folded to spaces. */
function clinNorm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ال(?=\S)/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLINICAL_CONDITIONS: ClinicalConditionDef[] = [
  {
    key: "diabetes",
    labelAr: "سكري",
    keywords: ["سكري", "سكر", "ميتفورمين", "جلوكوفاج", "انسولين", "diabetes", "diabetic", "metformin", "insulin", "prediabetes"],
    promptRuleAr:
      "سكري: وزّع الكربوهيدرات بالتساوي على الوجبات مع ثبات مواعيد الطعام؛ ممنوع نهائيًا السكريات المركزة والعصائر والحلويات والمشروبات المحلاة؛ اختر الحبوب الكاملة والألياف العالية؛ لا تقترح صيامًا طويلًا ولا تخطي وجبات.",
  },
  {
    key: "hypertension",
    labelAr: "ارتفاع ضغط الدم",
    keywords: ["ضغط", "hypertension", "blood pressure", "htn"],
    promptRuleAr:
      "ارتفاع ضغط الدم: قلل الصوديوم — لا مزيدة ملح على المائدة، وتجنب المخللات والأطعمة المصنعة عالية الملح والمرق الجاهز المركز.",
  },
  {
    key: "cardiac",
    labelAr: "حالة قلبية",
    keywords: ["قلب", "ذبحة", "شرايين", "cardiac", "heart failure", "heart disease", "angina"],
    promptRuleAr:
      "حالة قلبية: دهون مشبعة منخفضة (لا زبدة/سمن/لحوم دهنية مكررة)، أسماك دهنية باعتدال، وممنوع نهائيًا أي مكملات منشطة أو مشروبات طاقة.",
  },
  {
    key: "kidney",
    labelAr: "حالة كلوية",
    keywords: ["كلى", "كلوي", "kidney", "renal", "ckd"],
    promptRuleAr:
      "حالة كلوية: بروتين معتدل (لا مرتفع)، وتجنب الإفراط في البوتاسيوم والفوسفور (قلل الموز/البرتقال/البطاطس/المكسرات/البقوليات الكثيفة) — الكميات النهائية تبقى لقرار الطبيب المتابع.",
  },
  {
    key: "liver",
    labelAr: "حالة كبدية",
    keywords: ["كبد", "كبدي", "liver", "hepatic", "fatty liver"],
    promptRuleAr:
      "حالة كبدية: دهون مضافة وسكريات مضافة منخفضة، غذاء متوازن خفيف، وممنوع نهائيًا أي كحول.",
  },
  {
    key: "thyroid",
    labelAr: "حالة الغدة الدرقية",
    keywords: ["درقي", "thyroid", "hypothyroid", "hyperthyroid"],
    promptRuleAr:
      "حالة الغدة الدرقية: ثبات مواعيد الوجبات مع دواء الغدة، ولا تضع فول الصويا أو مكملات الحديد/الكالسيوم في نفس توقيت جرعة الدواء.",
  },
  {
    key: "pregnancy",
    labelAr: "حمل",
    keywords: ["حامل", "حمل", "pregnant", "pregnancy"],
    promptRuleAr:
      "حمل: سعرات صيانة على الأقل (لا عجز حراري إطلاقًا)، لا مكملات إلا بإشراف طبي، تجنب الكافيين الزائد والأسماك عالية الزئبق والأجبان غير المبسترة.",
  },
  {
    key: "breastfeeding",
    labelAr: "رضاعة",
    keywords: ["رضاع", "مرضع", "breastfeeding", "lactating", "lactation"],
    promptRuleAr:
      "رضاعة: عجز حراري محدود جدًا إن وُجد، ترطيب مرتفع، وسعرات إضافية وفق إرشاد مختص.",
  },
  {
    key: "anemia",
    labelAr: "أنيميا (فقر دم)",
    keywords: ["انيميا", "فقر دم", "anemia", "anaemia"],
    promptRuleAr:
      "أنيميا: ركّز مصادر الحديد (لحوم/كبدة/عدس/سبانخ) مع فيتامين C في الوجبات الرئيسية لتعزيز الامتصاص.",
  },
  {
    key: "gout",
    labelAr: "نقرس",
    keywords: ["نقرس", "حمض يوريك", "gout", "uric acid"],
    promptRuleAr:
      "نقرس: قلل البيورينات — لا كبدة/سردين/أنشوجة/لحوم حمراء مكررة، ترطيب مرتفع، وممنوع نهائيًا أي كحول.",
  },
  {
    key: "celiac",
    labelAr: "سيلياك / حساسية جلوتين",
    keywords: ["سيلياك", "جلوتين", "غلوتين", "celiac", "coeliac", "gluten"],
    promptRuleAr:
      "سيلياك/حساسية جلوتين: خطة خالية تمامًا من الغلوتين — لا قمح ولا شعير ولا مرق/صويا يحتوي قمحًا؛ الشوفان فقط المعتمد خاليًا من الجلوتين.",
  },
  {
    key: "cholesterol",
    labelAr: "كوليسترول / دهون دم",
    keywords: ["كوليسترول", "كولسترول", "دهون دم", "cholesterol", "dyslipidemia"],
    promptRuleAr:
      "كوليسترول/دهون دم: دهون مشبعة منخفضة، ألياف ذائبة يوميًا (شوفان/بقوليات)، وزيوت نباتية بدل الدهون الحيوانية.",
  },
  {
    key: "pcos",
    labelAr: "تكييس المبايض",
    keywords: ["تكييس", "تكيس", "pcos"],
    promptRuleAr:
      "تكييس المبايض: كربوهيدرات منخفضة المؤشر الجلايسيمي بحصص معتدلة موزعة على الوجبات، مع التركيز على إدارة مقاومة الأنسولين والوزن.",
  },
];

/** Pre-normalized keyword table (built once at module load). */
const MATCHERS: Array<{ def: ClinicalConditionDef; words: string[] }> =
  CLINICAL_CONDITIONS.map((def) => ({ def, words: def.keywords.map(clinNorm).filter(Boolean) }));

/**
 * Detect clinical conditions from the questionnaire's health text (the
 * member's declared conditions). Deterministic, order-stable: conditions
 * return in table order, each at most once.
 */
export function detectClinicalConditions(input: { healthText?: string | null }): ClinicalConditionKey[] {
  const hay = clinNorm(String(input?.healthText ?? ""));
  if (!hay) return [];
  const hits: ClinicalConditionKey[] = [];
  for (const { def, words } of MATCHERS) {
    if (words.some((w) => hay.includes(w))) hits.push(def.key);
  }
  return hits;
}

/** Arabic labels for a set of detected condition keys. */
export function clinicalConditionLabels(keys: ClinicalConditionKey[]): string[] {
  const byKey = new Map(CLINICAL_CONDITIONS.map((d) => [d.key, d.labelAr]));
  return keys.map((k) => byKey.get(k) ?? k);
}

/**
 * The MANDATORY clinical block for the generation prompt. Empty string
 * when no conditions are declared (no invented conditions, ever).
 */
export function clinicalPromptBlock(keys: ClinicalConditionKey[]): string {
  if (keys.length === 0) return "";
  const byKey = new Map(CLINICAL_CONDITIONS.map((d) => [d.key, d]));
  const rules = keys
    .map((k) => byKey.get(k))
    .filter((d): d is ClinicalConditionDef => Boolean(d))
    .map((d) => `- ${d.labelAr}: ${d.promptRuleAr}`);
  return [
    "",
    "⚠ الحالات الصحية المعلنة لهذا العميل — قيود إكلينيكية إلزامية على هذا التوليد (احترمها في كل صنف وكل بديل وكل اقتراح):",
    ...rules,
    "- مع أي حالة مزمنة: لا تقترح مكملات أو أعشاب قد تتفاعل مع الأدوية — اجعل قائمة supplements فارغة أو مقتصرة على الأساسي فقط.",
    "- انسخ الحالة الصحية المعلنة للعميل حرفيًا في حقل data_analysis.health، وأدرج في health_notes توصيات غذائية عامة تتسق معها.",
    "- هذه الخطة ليست بديلًا عن الاستشارة الطبية: سيظهر للعميل تحذير واضح بضرورة مراجعة الخطة مع طبيب أو أخصائي تغذية مؤهل قبل تطبيقها.",
    "",
  ].join("\n");
}

/** The disclosure block stamped on EVERY generated nutrition plan content. */
export type MedicalDisclosure = {
  /** Stable marker (UI + tests). */
  flag: "medical_review_advised";
  /** Arabic labels of the DETECTED declared conditions (may be empty). */
  conditions: string[];
  /** The client-facing warning (Arabic — the plan's own language). */
  warning: string;
};

const GENERAL_WARNING_AR =
  "تنبيه صحي: هذه الخطة أُنتجت بالذكاء الاصطناعي لأغراض معلوماتية عامة وليست وصفة طبية أو استشارة تغذية علاجية. قبل البدء في تطبيقها راجعها مع طبيبك أو مع أخصائي تغذية مؤهل — خاصة إذا كنت تتناول أدوية أو تعاني من أي حالة صحية.";

const CONDITION_WARNING_AR =
  "تنبيه صحي مهم: هذه الخطة أُنتجت بالذكاء الاصطناعي لأغراض معلوماتية عامة وليست وصفة طبية أو استشارة تغذية علاجية. حالتك الصحية المعلنة ({conditions}) تستلزم توخي الحذر: راجع الخطة مع طبيبك أو مع أخصائي تغذية مؤهل قبل تطبيقها، وأخبره بأدويتك وجرعاتها، ولا تغيّر نظامك الدوائي أو جرعاته بناءً عليها.";

/**
 * Build the medical disclosure for a generated plan. ALWAYS returns a
 * disclosure (the general warning when nothing is detected) — the owner's
 * fix order demands a clear review-with-a-professional warning on the
 * client's plan, unconditionally.
 */
export function medicalDisclosureFor(keys: ClinicalConditionKey[]): MedicalDisclosure {
  const conditions = clinicalConditionLabels(keys);
  return {
    flag: "medical_review_advised",
    conditions,
    warning:
      conditions.length > 0
        ? CONDITION_WARNING_AR.replace("{conditions}", conditions.join("، "))
        : GENERAL_WARNING_AR,
  };
}

/**
 * NUT-12 — the deterministic ITEM GATE tables: foods PROHIBITED outright
 * by a declared condition. Conservative and tight on purpose — these
 * reject SAVED plans, so only the unambiguous concentrated-sugar /
 * gluten / alcohol classes ride here; everything subtler (carb
 * distribution, sodium, potassium…) stays prompt-side where the model
 * can weigh quantities. Fixed allowlist — never derived from user text.
 */
const CLINICAL_FORBIDDEN_TOKENS: Partial<Record<ClinicalConditionKey, string[]>> = {
  // Concentrated-sugar family: juices, sodas, sweets, spreads, honey.
  diabetes: [
    "عصير", "عصائر", "غازيه", "مشروبات غازيه", "حلويات", "حلوى", "شوكولاته", "شوكولا",
    "ايس كريم", "مثلجات", "مربي", "عسل", "كنافه", "بسبوسه", "جاتو", "كيك", "كراميل",
    "سكاكر", "juice", "soda", "cake", "chocolate", "ice cream", "jam", "honey", "candy",
  ],
  // Zero-tolerance gluten family (cross-listed with the allergy gate, but
  // a declared celiac condition gates it even when the allergy field is
  // empty) — the same grain family DIET_FORBIDDEN_TOKENS uses for keto,
  // plus the wheat/couscous/oats names.
  celiac: [
    "قمح", "شعير", "برغل", "فريك", "كسكسي", "خبز", "عيش", "توست", "مكرونه", "مكرونة",
    "سباجيتي", "باستا", "شوفان", "سيمولينا", "جريش",
    "gluten", "wheat", "barley", "bulgur", "bread", "pasta", "spaghetti", "toast", "oats",
  ],
};

/** The prohibited-token list for the detected conditions (deduped). */
export function clinicalForbiddenTokens(keys: ClinicalConditionKey[]): string[] {
  const out = new Set<string>();
  for (const k of keys) {
    for (const t of CLINICAL_FORBIDDEN_TOKENS[k] ?? []) out.add(t);
  }
  return [...out];
}

