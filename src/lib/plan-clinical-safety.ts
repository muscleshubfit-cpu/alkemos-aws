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
 * GAP-18 (fix order 2026-11-17 — owner remediation order «إصلاح ربط حقل
 * medical في الاستبيان الحقيقي بطبقة الكشف الإكلينيكي… استشر متخصصًا
 * في التغذية العلاجية عند مراجعة منطق السلامة»): the layer was
 * structurally blind to the REAL form's field name — the linkage fix
 * lives in plan-generator.declaredHealthText (the single canonical
 * extraction feeding every consumer). The safety-logic review below was
 * performed with an independent clinical-dietitian consultation
 * (2026-11-17 — documented in raw/t4/gap-18-19-fix-verification.md) and
 * hardened this module where the review found directional harm or
 * detection holes for the EXISTING conditions:
 *   · keyword extensions for the documented Egyptian-context wording gaps
 *     (فيروس سي للكبد · غدة للدرقية · حصوات/غسيل للكلى · سلفونيل يوريا
 *     للسكري · جلطة/سكتة للقلب · sugar بالإنجليزية…) — detection only,
 *     same conditions, same rules;
 *   · a DIRECTIONAL GUARD on hypertension: «ضغط منخفض» must never receive
 *     the low-sodium rule (the one false-positive class with real harm);
 *   · the diabetes item gate now covers the WHOLE concentrated-sugar
 *     family the live evidence exposed (تمر/بلح/زبيب/دبس/قمر الدين/
 *     حلاوة/مشروبات الطاقة…) with the تمرين and عصير-ليمون guards;
 *   · the celiac gate covers the unambiguous gluten family it missed
 *     (شعرية/بسكويت/بيتزا/بقلاوة/بقسماط/فطير…);
 *   · the diabetes prompt rule now addresses fasting (Ramadan/intermittent
 *     — consult the treating doctor first) and hypoglycemia-prone
 *     medication, and a diabetes×celiac merge line resolves the
 *     whole-grains push conflict;
 *   · the condition-aware disclosure adds blood-glucose monitoring (when
 *     diabetes is detected) and the stop-on-symptoms safety valve.
 * The specialist's further recommendations (new condition families —
 * bariatric/IBD/chemo/eating-disorders/G6PD…, a structured pregnancy
 * field, thalassemia split…) are ADDITIONAL CLINICAL EXPANSIONS the
 * consultation proposed BEYOND the owner's order — the owner neither
 * requested nor deferred them; they are documented as reference
 * residuals (implementation would be a separate owner decision). They
 * are NOT a prerequisite for the ordered warning: the
 * DECLARED-BUT-UNCLASSIFIED disclosure state below guarantees that ANY
 * non-empty declared health text receives the explicit
 * consult-a-qualified-specialist warning, even when the table cannot
 * classify it (owner clarification 2026-11-17: «لا تشترط إضافة قواعد
 * غذائية تفصيلية لكل مرض حتى يظهر التحذير العام»).
 *
 * THE LAW THIS MODULE PINS (deterministic, server-side, both generation
 * paths — AI chain AND local fallback):
 *   1. DETECT: the questionnaire's health text is classified against a
 *      fixed clinical-condition table (Arabic + English, spelling-drift
 *      tolerant). Detection is conservative keyword containment over
 *      normalized text — a false positive costs a caution banner (safe
 *      direction); a false negative is the hazard this module exists to
 *      kill, so keywords err on the sensitive side. The ONE exception is
 *      the hypertension directional guard: an explicitly OPPOSITE
 *      declaration («ضغط منخفض») is suppressed — injecting the
 *      low-sodium rule into a hypotensive member's plan is the single
 *      false-positive class with directional harm, so it never fires
 *      unless an affirmative wording is also present.
 *   2. STEER: detected conditions render a MANDATORY clinical block in
 *      the generation prompt (carb distribution for diabetes, sodium for
 *      hypertension, …) — prompt-level instruction, on top of the
 *      existing allergy/diet constraint gates.
 *   3. DISCLOSE: every generated plan content carries a
 *      `medical_disclosure` block — a clear client-facing WARNING to
 *      review the plan with a doctor or a qualified nutritionist BEFORE
 *      applying it. THREE states, never fewer than the general form:
 *      (a) condition-aware (names the detected conditions) when the
 *      table classifies the declaration; (b) DECLARED-BUT-UNCLASSIFIED
 *      (owner clarification 2026-11-17) when the member declared a
 *      NON-EMPTY health text the table cannot classify — the explicit
 *      consult-a-qualified-specialist warning fires regardless, because
 *      the ordered warning does not depend on per-disease rules; (c) the
 *      general form only when nothing at all is declared. This is
 *      deliberately NOT a needs_review flag and NOT in
 *      SELF_SERVICE_BLOCKING_REVIEW_FLAGS: the owner's order explicitly
 *      rules OUT requiring a trainer or an in-platform review — the
 *      member receives the plan WITH the warning, never held hostage to
 *      a review step.
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
  /** GAP-18 (specialist review 2026-11-17): the DIRECTIONAL GUARD — when
   * the declaration names the OPPOSITE of this condition and never
   * affirms it, detection is suppressed. Only hypertension carries one
   * today («ضغط منخفض» → the low-sodium rule would be directional harm);
   * every other condition keeps the unguarded sensitive-side law. */
  suppressWhen?: { opposite: RegExp; affirmative: RegExp };
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
    // GAP-18 (specialist review): += English "sugar/blood sugar" wording
    // ("high blood sugar" passed undetected) and the Egyptian
    // sulfonylurea drug names — they are diabetes medications exactly
    // like metformin, and their hypoglycemia risk rides the prompt rule.
    keywords: ["سكري", "سكر", "ميتفورمين", "جلوكوفاج", "انسولين", "داونيل", "اماريل", "جلينيز", "دياميكرون", "diabetes", "diabetic", "metformin", "insulin", "prediabetes", "sugar", "blood sugar", "glimepiride", "gliclazide", "glibenclamide", "sulfonylurea"],
    promptRuleAr:
      "سكري: وزّع الكربوهيدرات بالتساوي على وجبات ثابتة المواعيد؛ ممنوع نهائيًا السكريات المركزة والعصائر والحلويات والمشروبات المحلاة (بما فيها التمر والرطب وقمر الدين والدبس)؛ فضّل الحبوب الكاملة والألياف العالية؛ لا تقترح صيامًا ولا تخطي وجبات — وإن أشار العميل إلى صيام (رمضان أو متقطع) فاذكر صراحة: استشر طبيبك قبل الصيام لتقييم ملاءمته وتعديل دوائك، ووزّع الكربوهيدرات بين الإفطار والسحور، وتجنب الحلويات الرمضانية والمقليات، وراقب سكرتك وأفطر فورًا عند أي هبوط؛ وإن كان العميل على إنسولين أو أدوية محفزة للإفراز (سلفونيل يوريا كداونيل/أماريل/دياميكرون): لا تتخطى الوجبات إطلاقًا، ونبّه على أعراض هبوط السكر (رعشة/تعرق/دوخة) وعلاجها الفوري، وراجع الطبيب عند تغيير نمط الأكل.",
  },
  {
    key: "hypertension",
    labelAr: "ارتفاع ضغط الدم",
    keywords: ["ضغط", "hypertension", "blood pressure", "htn"],
    // GAP-18 (specialist review): «ضغطي منخفض» / "low blood pressure" is
    // the ONE false-positive class with directional harm — the low-sodium
    // rule would act against a hypotensive member. Suppressed unless an
    // affirmative wording (مرتفع/عالي/high…) is also present (mixed
    // declarations like «منخفض أحيانًا ومرتفع أحيانًا» still detect).
    suppressWhen: {
      opposite: /منخفض|واطي|هبوط|hypotension|\blow\b/,
      affirmative: /مرتفع|عالي|عالية|\bhigh\b|hypertension|\bhtn\b/,
    },
    promptRuleAr:
      "ارتفاع ضغط الدم: قلل الصوديوم — لا مزيدة ملح على المائدة، وتجنب المخللات والأطعمة المصنعة عالية الملح والمرق الجاهز المركز.",
  },
  {
    key: "cardiac",
    labelAr: "حالة قلبية",
    // GAP-18 (specialist review): += the common Egyptian cardiac-event
    // wordings (جلطة/سكتة/قسطرة/دعامة) — same condition, same rule.
    keywords: ["قلب", "ذبحة", "شرايين", "جلطه", "سكتة", "قسطره", "دعامه", "cardiac", "heart failure", "heart disease", "angina", "stroke", "stent"],
    promptRuleAr:
      "حالة قلبية: دهون مشبعة منخفضة (لا زبدة/سمن/لحوم دهنية مكررة)، أسماك دهنية باعتدال، وممنوع نهائيًا أي مكملات منشطة أو مشروبات طاقة.",
  },
  {
    key: "kidney",
    labelAr: "حالة كلوية",
    // GAP-18 (specialist review): += dialysis and stone wordings — the
    // bare «عندي حصوات» passed undetected (حصوة في الكلى caught only via
    // «كلى»; the abstract forms never did).
    keywords: ["كلى", "كلوي", "كلاوي", "غسيل", "ديلزه", "ديال", "حصوه", "حصوات", "حصى", "kidney", "renal", "ckd", "dialysis", "hemodialysis", "stone", "stones"],
    promptRuleAr:
      "حالة كلوية: بروتين معتدل (لا مرتفع)، وتجنب الإفراط في البوتاسيوم والفوسفور (قلل الموز/البرتقال/البطاطس/المكسرات/البقوليات الكثيفة) — الكميات النهائية تبقى لقرار الطبيب المتابع.",
  },
  {
    key: "liver",
    labelAr: "حالة كبدية",
    // GAP-18 (specialist review): += hepatitis B/C — the top Egyptian
    // priority («حامل فيروس سي» passed undetected).
    keywords: ["كبد", "كبدي", "فيروس سي", "فيروس ب", "التهاب كبدي", "liver", "hepatic", "fatty liver", "hepatitis", "hcv", "hbv"],
    promptRuleAr:
      "حالة كبدية: دهون مضافة وسكريات مضافة منخفضة، غذاء متوازن خفيف، وممنوع نهائيًا أي كحول.",
  },
  {
    key: "thyroid",
    labelAr: "حالة الغدة الدرقية",
    // GAP-18 (specialist review): += «غدة» — the most common Egyptian
    // phrasing of a thyroid condition («عندي غدة»)."تكييس" unaffected.
    keywords: ["درقي", "غده", "thyroid", "hypothyroid", "hyperthyroid"],
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
    // GAP-18 (specialist review): += «رضع» so the attached verb forms
    // (بترضع/أرضع) land — «رضاع» alone never caught them.
    keywords: ["رضاع", "رضع", "مرضع", "breastfeeding", "lactating", "lactation"],
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

/** GAP-18 completion (owner clarification 2026-11-17): every condition key
 * in the table — exported so the regression sweep canaries iterate the
 * LIVE table (a newly added condition family is automatically covered by
 * «لكل الحالات الطبية المكتشفة، وليس السكري والسيلياك فقط»). */
export function allClinicalConditionKeys(): ClinicalConditionKey[] {
  return CLINICAL_CONDITIONS.map((d) => d.key);
}

/**
 * Detect clinical conditions from the questionnaire's health text (the
 * member's declared conditions). Deterministic, order-stable: conditions
 * return in table order, each at most once. GAP-18: a directional guard
 * (suppressWhen) can suppress a condition whose declaration names the
 * OPPOSITE — only hypertension carries one today (the hypotension harm).
 */
export function detectClinicalConditions(input: { healthText?: string | null }): ClinicalConditionKey[] {
  const hay = clinNorm(String(input?.healthText ?? ""));
  if (!hay) return [];
  const hits: ClinicalConditionKey[] = [];
  for (const { def, words } of MATCHERS) {
    if (words.some((w) => hay.includes(w))) {
      // GAP-18 directional guard: an explicitly-opposite declaration
      // suppresses the condition UNLESS an affirmative wording is also
      // present (mixed «منخفض أحيانًا ومرتفع أحيانًا» still detects).
      const guard = def.suppressWhen;
      if (guard && guard.opposite.test(hay) && !guard.affirmative.test(hay)) {
        continue;
      }
      hits.push(def.key);
    }
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
  // GAP-18 (specialist review): the diabetes rule PUSHES whole grains while
  // the celiac rule BANS the classic whole-grain carriers — the two rules
  // rode adjacent and tense with no mediator. The merge line resolves the
  // push conflict explicitly when BOTH conditions are declared.
  if (keys.includes("diabetes") && keys.includes("celiac")) {
    rules.push(
      "- سكري + سيلياك (قاعدة دمج): الحبوب الكاملة المسموحة خالية من الجلوتين حصرًا (أرز أسمر، كينوا، ذرة، بطاطا حلوة) — لا قمح/شعير/برغل/شوفان مطلقًا.",
    );
  }
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

/** GAP-18 completion (owner clarification 2026-11-17: «افحص تنفيذ GAP-18
 * الحالي وتأكد من وجود هذا التحذير فعلًا لكل الحالات الطبية المكتشفة،
 * وليس السكري والسيلياك فقط… لا تشترط إضافة قواعد غذائية تفصيلية لكل
 * مرض حتى يظهر التحذير العام»): a member who declared a NON-EMPTY health
 * text the 13-condition table cannot classify (thalassemia, IBD, cancer,
 * bariatric surgery…) still gets the EXPLICIT warning the owner ordered —
 * consult a qualified specialist before following the plan; the plan does
 * not replace medical consultation. Detection (prompt rules / forbidden
 * tokens) stays table-bound by design; the WARNING never does. */
const DECLARED_UNCLASSIFIED_WARNING_AR =
  "تنبيه صحي مهم: هذه الخطة أُنتجت بالذكاء الاصطناعي لأغراض معلوماتية عامة وليست وصفة طبية أو استشارة تغذية علاجية. أخبرتنا في استبيانك بحالة صحية معلنة تستلزم توخي الحذر: استشر طبيبك أو متخصصًا مؤهلًا في التغذية العلاجية قبل اتباع هذه الخطة، وأخبره بحالتك وأدويتك وجرعاتها. هذه الخطة لا تغني عن الاستشارة الطبية، ولا تغيّر نظامك الدوائي أو جرعاته بناءً عليها.";

const CONDITION_WARNING_TAIL_AR =
  "توقف عن الخطة وراجع طبيبك عند أي أعراض غير معتادة (دوخة، رعشة، غثيان، ضيق تنفس).";

/* ── GAP-18 completion: NEGATIVE declarations ─────────────────────────
 * The real form's `medical` field is FREE TEXT (QuestionnairesView
 * nutritionFields), so a healthy member's answer is typically a
 * "nothing" phrasing — «لا يوجد»، «لا أعاني من شيء»، «سليم»، «الحمد
 * لله»، "none"… These are NOT declared conditions: they map to the
 * GENERAL disclosure, never the declared-but-unclassified warning (a
 * false "you declared a condition" scare on a healthy member is the
 * mirror image of the harm this layer exists to kill).
 *
 * Conservative on purpose: UNAMBIGUOUS exact forms and prefixes only —
 * a real declaration that merely STARTS with «لا» («لا أستطيع المشي
 * كثيرًا») never matches, because the allowlist names the full negative
 * constructs, not the bare particle. */
const PRAISE_PREFIX_RE = /^(الحمد لله|الحمدلله|حمد لله|thank god|alhamdulillah)\s*/;
const NEGATIVE_DECLARATION_EXACT = new Set([
  // Arabic negatives (clinNorm shape: ة→ه · ى→ي · ال-dropped)
  "لا", "لا شي", "لا شيء", "لاشئ", "لا يوجد", "لايوجد",
  "سليم", "بصحه جيده", "صحتي جيده", "صحه جيده", "تمام", "جيد",
  "لا اعاني", "لا اعاني من شي", "لا اعاني من شيء", "لا اعاني من اي شي", "لا اعاني من اي شيء",
  // English negatives (clinNorm lowercases)
  "none", "nothing", "no", "not applicable", "n a", "na", "nope", "healthy", "normal", "nothing at all",
]);
const NEGATIVE_DECLARATION_PREFIXES = [
  "لا يوجد", "لايوجد", "لا شي", "لا شيء", "لاشئ", "لا اعاني", "لا يوجد لدي",
  "none", "nothing", "not applicable",
];

/** Is this declared text a NEGATIVE declaration (nothing is wrong)?
 * Package-private (unit-tested via medicalDisclosureFor's three states). */
function isNegativeDeclaration(raw: string): boolean {
  let t = clinNorm(String(raw ?? ""));
  if (!t) return false;
  t = t.replace(PRAISE_PREFIX_RE, "").trim();
  if (!t) return true; // bare praise («الحمد لله») = nothing declared
  if (NEGATIVE_DECLARATION_EXACT.has(t)) return true;
  return NEGATIVE_DECLARATION_PREFIXES.some((p) => t.startsWith(p));
}

/** GAP-18 (specialist review): blood-glucose monitoring rides the
 * condition-aware disclosure when diabetes is among the detected
 * conditions — the first practical interaction between the plan and a
 * glucose-lowering medication (the readings may warrant a dose change,
 * which is the doctor's call, never the plan's). */
const DIABETES_MONITORING_AR =
  "بما أنك تعاني حالة سكرية: راقب سكر دمك عند بدء الخطة واعرض القراءات على طبيبك — فقد يحتاج علاجك تعديلًا.";

/**
 * Build the medical disclosure for a generated plan. ALWAYS returns a
 * disclosure — the owner's fix order demands a clear
 * review-with-a-professional warning on the client's plan,
 * unconditionally. Three states:
 *   · keys non-empty            → condition-aware (names the conditions);
 *   · keys empty + declaredText → DECLARED-BUT-UNCLASSIFIED (the explicit
 *                                 consult-a-specialist warning — the
 *                                 ordered warning does not depend on the
 *                                 table classifying the condition);
 *   · keys empty + no text      → the general form (clean member).
 */
export function medicalDisclosureFor(
  keys: ClinicalConditionKey[],
  declaredText?: string | null,
): MedicalDisclosure {
  const conditions = clinicalConditionLabels(keys);
  if (conditions.length === 0) {
    const declared = String(declaredText ?? "").trim();
    // GAP-18 completion: declared-but-unclassified — the explicit
    // warning + the stop-on-symptoms safety valve (same tail as the
    // condition-aware form; no glucose sentence — no diabetes was
    // detected). A NEGATIVE declaration ("لا يوجد"…) is NOT a condition:
    // the healthy member keeps the general form.
    if (declared && !isNegativeDeclaration(declared)) {
      return {
        flag: "medical_review_advised",
        conditions,
        warning: `${DECLARED_UNCLASSIFIED_WARNING_AR} ${CONDITION_WARNING_TAIL_AR}`,
      };
    }
    return { flag: "medical_review_advised", conditions, warning: GENERAL_WARNING_AR };
  }
  // GAP-18 (specialist review): the condition-aware form gains the
  // diabetes-conditional blood-glucose monitoring sentence and the general
  // stop-on-symptoms safety valve.
  const diabetesNote = keys.includes("diabetes") ? ` ${DIABETES_MONITORING_AR}` : "";
  return {
    flag: "medical_review_advised",
    conditions,
    warning: `${CONDITION_WARNING_AR.replace("{conditions}", conditions.join("، "))}${diabetesNote} ${CONDITION_WARNING_TAIL_AR}`,
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
  // GAP-18 (specialist review 2026-11-17 — the live evidence named dates):
  // the family now covers the WHOLE unambiguous concentrated-sugar class —
  // dates (تمر/بلح), raisins (زبيب), dibs/molasses, قمر الدين, حلاوة,
  // energy drinks — the same class the platform's own keto/low_carb tables
  // already ban (تمر/بلح/زبيب literally ride the keto list). Two guards
  // ride the shared TOKEN_MATCH_EXCEPTIONS mechanism in plan-ai-validation
  // (تمر→تمرين/تمارين · عصير→عصير ليمون) so the additions cannot
  // false-fire on exercise wordings or the default Egyptian salad
  // dressing. «غازي» (normalized) subsumes غازي/غازية/الغازي — the old
  // feminine-only tokens missed «مشروب غازي».
  diabetes: [
    "عصير", "عصائر", "غازي", "حلويات", "حلوى", "شوكولاته", "شوكولا",
    "ايس كريم", "مثلجات", "مربي", "عسل", "كنافه", "بسبوسه", "جاتو", "كيك", "كراميل",
    "سكاكر", "تمر", "بلح", "زبيب", "دبس", "قمر الدين", "حلاوه", "مشروب طاقه", "ريد بول", "مشروب سكري",
    "juice", "soda", "cake", "chocolate", "ice cream", "jam", "honey", "candy",
    "dates", "raisins", "syrup", "molasses", "sweets", "dessert", "energy drink", "red bull",
  ],
  // Zero-tolerance gluten family (cross-listed with the allergy gate, but
  // a declared celiac condition gates it even when the allergy field is
  // empty) — the same grain family DIET_FORBIDDEN_TOKENS uses for keto,
  // plus the wheat/couscous/oats names.
  // GAP-18 (specialist review): += the unambiguous gluten carriers the
  // list missed — شعرية (Egyptian rice-vermicelli staple; the letters
  // differ from شعير so the old token never caught it), بسكويت/بسكوت،
  // بيتزا، بقلاوة، بقسماط، فطير، and the English couscous/cookies/
  // crackers/noodles/semolina (كسكسي covered only the Arabic spelling).
  // Deliberately NOT added: دقيق/طحين/نشا (rice/corn flours and corn
  // starch are gluten-free and legitimate) — same conservative law.
  celiac: [
    "قمح", "شعير", "برغل", "فريك", "كسكسي", "خبز", "عيش", "توست", "مكرونه", "مكرونة",
    "سباجيتي", "باستا", "شوفان", "سيمولينا", "جريش",
    "شعريه", "بسكويت", "بسكوت", "بيتزا", "بقلاوه", "بقسماط", "فطير", "كيك",
    "gluten", "wheat", "barley", "bulgur", "bread", "pasta", "spaghetti", "toast", "oats",
    "couscous", "cookies", "crackers", "noodles", "semolina",
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

