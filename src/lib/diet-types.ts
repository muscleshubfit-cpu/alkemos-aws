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
