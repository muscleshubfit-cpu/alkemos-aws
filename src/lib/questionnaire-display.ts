/**
 * questionnaire-display — m5 FIX (DEEP-UX-AUDIT-2026-09-18).
 *
 * PROBLEM (audit m5): the questionnaires page rendered raw technical
 * enum-ish tokens verbatim. The live audit account's submitted fitness
 * questionnaire stored `goal: "lose_fat"`, `location: "home"`,
 * `equipment: "dumbbells"`, `preferred: "strength"`,
 * `experience: "beginner"` — and BOTH display surfaces (the member's
 * review step and the coach's client QuestionnaireCard) printed them
 * as-is. Only `gender` and `activity` had mapping; the remaining
 * free-text fields had none ("عرض بلا mapping").
 *
 * ROOT CAUSE: the fitness/nutrition form fields are free-text inputs
 * (placeholders invite enum-like answers: "e.g. lose fat, build muscle"),
 * so users legitimately store snake_case tokens — and the DISPLAY layer
 * never mapped the known vocabulary back to human labels.
 *
 * FIX (display layer only — no business logic, no data, no API change):
 * one shared formatter maps KNOWN tokens to bilingual labels; anything
 * else (genuine free text like "I want to run a marathon") falls through
 * VERBATIM — honest fallback, never masks real user input. Matching is
 * whitespace/hyphen/case tolerant ("lose fat" and "Lose-Fat" resolve to
 * the same token as "lose_fat").
 *
 * Consumers: QuestionnairesView (member review step) · CoachClientView
 * (coach's read-only questionnaire card).
 */

type Bilingual = { ar: string; en: string };

/** Known enum-ish token vocabulary per questionnaire field. */
const TOKEN_LABELS: Record<string, Record<string, Bilingual>> = {
  goal: {
    lose_fat: { ar: "خسارة الدهون", en: "Lose fat" },
    build_muscle: { ar: "بناء العضلات", en: "Build muscle" },
    maintain: { ar: "الحفاظ على الوزن", en: "Maintain weight" },
    recomp: { ar: "إعادة تشكيل الجسم", en: "Recomposition" },
    endurance: { ar: "تحمّل", en: "Endurance" },
    general_health: { ar: "صحة عامة", en: "General health" },
    strength: { ar: "زيادة القوة", en: "Get stronger" },
  },
  location: {
    home: { ar: "المنزل", en: "Home" },
    gym: { ar: "النادي الرياضي", en: "Gym" },
    outdoor: { ar: "في الخارج", en: "Outdoors" },
  },
  experience: {
    beginner: { ar: "مبتدئ", en: "Beginner" },
    intermediate: { ar: "متوسط الخبرة", en: "Intermediate" },
    advanced: { ar: "متقدم", en: "Advanced" },
  },
  preferred: {
    strength: { ar: "تدريب المقاومة", en: "Strength training" },
    cardio: { ar: "كارديو", en: "Cardio" },
    hybrid: { ar: "مختلط", en: "Hybrid" },
    calisthenics: { ar: "تمارين وزن الجسم", en: "Calisthenics" },
    mobility: { ar: "مرونة وحركة", en: "Mobility" },
  },
  equipment: {
    none: { ar: "بدون معدات", en: "None" },
    bodyweight: { ar: "وزن الجسم فقط", en: "Bodyweight only" },
    dumbbells: { ar: "دمبل", en: "Dumbbells" },
    barbell: { ar: "بار أولمبي", en: "Barbell" },
    bands: { ar: "أشرطة مقاومة", en: "Resistance bands" },
    full_gym: { ar: "نادٍ رياضي كامل", en: "Full gym" },
    machines: { ar: "الأجهزة", en: "Machines" },
  },
  diet: {
    balanced: { ar: "متوازن", en: "Balanced" },
    keto: { ar: "كيتو", en: "Keto" },
    low_carb: { ar: "منخفض الكربوهيدرات", en: "Low-carb" },
    vegetarian: { ar: "نباتي", en: "Vegetarian" },
    vegan: { ar: "نباتي صرف", en: "Vegan" },
    mediterranean: { ar: "متوسطي", en: "Mediterranean" },
  },
};

/** Normalize user input to the canonical token form: lose fat / Lose-Fat
 *  / lose_fat all resolve to `lose_fat`. */
function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * Format a questionnaire answer for DISPLAY.
 *
 * - Known enum-ish tokens render as bilingual human labels.
 * - Unknown / genuinely free-text values render VERBATIM (honest fallback).
 * - Empty values render as an em dash placeholder (callers may override).
 */
export function formatQuestionnaireValue(
  key: string,
  value: unknown,
  isAr: boolean,
): string {
  const raw = value == null ? "" : String(value);
  if (!raw.trim()) return "—";
  const table = TOKEN_LABELS[key];
  if (!table) return raw;
  const label = table[normalizeToken(raw)];
  return label ? (isAr ? label.ar : label.en) : raw;
}
