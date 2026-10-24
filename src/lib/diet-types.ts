/**
 * diet-types.ts — NOTIF→PLAN 2026-10-24 (owner order items 4+5).
 *
 * The diet-type contract as a ZERO-DEPENDENCY leaf module.
 *
 * WHY a separate file: the contract is needed on BOTH sides —
 *   - SERVER: plan-generator.ts (macro policy + prompt) and
 *     ai-jobs.ts (the sanitizeJobPayload whitelist);
 *   - CLIENT: CoachClientView's plan-creation selector (the coach picks
 *     the diet type BEFORE generating).
 * plan-generator itself is a SERVER module (it imports the 1.6MB
 * exercises array + the AI provider chain — the Phase-183 bundle law);
 * the client view must never import its runtime values. This leaf module
 * is the single source of the enum; plan-generator re-exports it so
 * server callers keep one import path.
 */

/** The five supported diet families. */
export const DIET_TYPES = ["balanced", "keto", "low_carb", "vegetarian", "vegan"] as const;
export type DietType = (typeof DIET_TYPES)[number];

export const DIET_TYPE_LABELS_AR: Record<DietType, string> = {
  balanced: "متوازن",
  keto: "كيتو",
  low_carb: "قليل الكربوهيدرات",
  vegetarian: "نباتي",
  vegan: "نباتي صرف",
};

/**
 * Classify free-text diet answers (questionnaire `diet` is a free-text
 * field: "كيتو", "متوازن، نباتي", "keto"…) into the DietType enum.
 * Unrecognized text → "balanced" (the platform default policy) — never a
 * guess beyond the five known families.
 */
export function classifyDietText(raw: unknown): DietType {
  const s = String(raw || "").toLowerCase();
  if (!s) return "balanced";
  if (/keto|ketogenic|كيتو|كيتوجينيك/.test(s)) return "keto";
  if (/low.?carb|لو ?كارب|قليل الكارب|قليل الكربوهيدرات|منخفض الكارب/.test(s)) return "low_carb";
  if (/vegan|نباتي صرف|نباتي صافي|فيجان/.test(s)) return "vegan";
  if (/vegetarian|veg\b|نباتي/.test(s)) return "vegetarian";
  return "balanced";
}

/**
 * PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 1 — the measured
 * keto-loss bug): resolve the diet type a SAVED plan was generated under,
 * so every regeneration path (whole plan / target change / meal / item)
 * can re-impose the SAME diet instead of silently falling back to the
 * questionnaire's free-text classification.
 *
 * Sources tried in order (the generation echo first, the questionnaire
 * classification last):
 *   1. An explicit enum already stored on the content (diet_type as the
 *      enum key — future-proof).
 *   2. The generation echo label in data_analysis.diet_type — the EXACT
 *      DIET_TYPE_LABELS_AR round-trip, then classifyDietText on the label
 *      itself (robust to legacy/coach-pasted plans whose echo was written
 *      by the model or carries extra wording like «كيتو (Keto)»).
 *   3. The questionnaire's diet answer (classifyDietText) — the previous
 *      behavior, kept as the last resort.
 *
 * Returns null when NOTHING resolves (the caller then deliberately
 * passes no diet constraint — never invents one).
 */
export function resolvePlanDietType(
  content: { data_analysis?: { diet_type?: unknown }; diet_type?: unknown } | null | undefined,
  questionnaireDiet?: unknown,
): DietType | null {
  if (!content) return null;
  const asEnum = String(content.diet_type ?? "").trim().toLowerCase();
  if ((DIET_TYPES as readonly string[]).includes(asEnum)) return asEnum as DietType;
  const echo = String(content.data_analysis?.diet_type ?? "").trim();
  if (echo) {
    const exact = (Object.keys(DIET_TYPE_LABELS_AR) as DietType[]).find(
      (k) => DIET_TYPE_LABELS_AR[k] === echo,
    );
    if (exact) return exact;
    const classified = classifyDietText(echo);
    if (classified !== "balanced") return classified;
    // An exact "balanced" echo resolves to balanced itself.
    if (echo === DIET_TYPE_LABELS_AR.balanced) return "balanced";
  }
  if (questionnaireDiet !== undefined && questionnaireDiet !== null && String(questionnaireDiet).trim() !== "") {
    return classifyDietText(questionnaireDiet);
  }
  return null;
}
