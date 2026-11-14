/**
 * EVO intent classification — pure + unit-tested.
 *
 * Extracted from /api/ai/chat during T-AI-DEEP-AUDIT-V2 (2026-08-28).
 * The old route had ONE flat `subscriberOnlyPatterns` list, which could
 * only answer "is this a subscriber feature?" — it could NOT distinguish
 * PLAN CREATION (unified monthly pool — Phase 183 «البوول الموحد»)
 * from SWAP REQUESTS (unified monthly swap quota, enforced server-side
 * by /api/ai/jobs — the 2026-11-14 completion order).
 * Result: the advertised "3/6 plans per month" quotas were never enforced.
 *
 * This module classifies a message into:
 *   - isPlanCreation  → counts against the MONTHLY plan quota (per domain)
 *   - isSwapRequest   → conversational advice in chat; the structured swap
 *                       action goes through /api/ai/jobs (unified monthly
 *                       swap quota)
 *   - isSubscriberOnly→ plan creation OR swap (the subscriber gate — SAME
 *                       coverage as the old flat list, no regression)
 *   - planDomain      → "nutrition" | "workout" (nutrition when food-ish
 *                       keywords dominate; workout is the default for
 *                       generic "plan/program/جدول" requests)
 */

export type EvoPlanDomain = "nutrition" | "workout";

/** Plan-creation intents — these consume the monthly plan quota. */
const PLAN_CREATION_PATTERNS: RegExp[] = [
  /\bmake\s+me\s+(a|an)?\s*(meal|workout|plan|diet|menu)/i,
  /\bgenerate\s+(a|an)?\s*(meal|workout|plan|diet|menu)/i,
  /\bcreate\s+(a|an)?\s*(meal|workout|plan|diet|menu)/i,
  /\bplan\s+(for|with)\s+\d+\s*(calorie|kcal|cal)/i,
  /\bmeal\s+(plan|with|for)\s+\d+/i,
  /\d+\s*(calorie|kcal|cal)\s*(meal|plan|diet)/i,
  /\bworkout\s+(plan|program|routine)\s*(for|with)/i,
  // EN want/need family (deep-audit closure 2026-09-10): "I want a meal
  // plan" / "I need a workout program" — the article and domain noun
  // are optional so "I want a plan" fires, but "I want to plan my week"
  // (to-infinitive) stays free.
  /\b(?:want|need|wanna)\s+(?:a|an|the|my)?\s*(?:meal|workout|diet|nutrition|training)?\s*(?:plans?|menus?|programs?|routines?)\b/i,
  /اعمل\s+(وجبة|خطة|برنامج|جدول|دايت|مينو)/i,
  /صمم\s+(وجبة|خطة|برنامج|جدول)/i,
  /انشئ\s+(وجبة|خطة|برنامج|جدول)/i,
  /خطة\s+(تغذية|تمارين|دايت)\s+/i,
  /وجبة\s+\d+\s*سعر/i,
  /\d+\s*سعرة\s*(وجبة|خطة|مينو)/i,
  // AR — deep-audit closure (2026-09-10): 9 of 10 common plan-request
  // phrasings bypassed the static gate and reached the model (cost +
  // non-deterministic refusal language + quota bypass). The families
  // below close the gap with HIGH-PRECISION shape rules — every pattern
  // requires an explicit PLAN OBJECT noun (وجبة/خطة/برنامج/جدول/دايت/
  // مينو) so informational questions («إزاي أعمل بنش بريس؟", «عايز أعرف
  // إيه أفضل دايت؟") can never match.
  // (a) Imperative family — masc/fem verb + optional «لي/لى» clitic
  //     (attached اعمللي or spaced اعمل لي): «اعملي خطة»، «اعمللي
  //     جدول»، «صممي برنامج»، «أنشئ لي مينو».
  /(?:اعمل[ىي]?|صمم[ىي]?|[اأ]نشئ[ىي]?|جهز[ىي]?)\s*(?:لي|لى)?\s*(?:وجبه|وجبة|وجبات|خطه|خطة|خطط|برنامج|برامج|جدول|جداول|دايت|مينو)/i,
  // (b) Want/need family — «عايز/عاوز/محتاج (+ة) / بدي / أريد / نفسي
  //     في» + object: «عايز خطة»، «محتاجة جدول»، «بدي دايت».
  /(?:عايز|عاوز|عايزه|عايزة|عاوزه|عاوزة|محتاج|محتاجه|محتاجة|بدي|نفسي في|[اأ]ريد)\s+(?:وجبه|وجبة|وجبات|خطه|خطة|خطط|برنامج|برامج|جدول|جداول|دايت|مينو)/i,
  // (c) Polite «ممكن» family — verb optional: «ممكن تعمللي خطة»،
  //     «ممكن تعملي برنامج»، «ممكن خطة تمارين».
  /ممكن\s+(?:(?:تعمل|تعملي)\s*(?:لي|لى)?\s*)?(?:وجبه|وجبة|وجبات|خطه|خطة|خطط|برنامج|برامج|جدول|جداول|دايت|مينو)/i,
  // (d) Future «ه/ح تعمل» family: «هتعمللي خطة»، «حتعمل جدول».
  /(?:ه|ح)(?:تعمل|تعملي)\s*(?:لي|لى)?\s*(?:وجبه|وجبة|وجبات|خطه|خطة|خطط|برنامج|برامج|جدول|جداول|دايت|مينو)/i,
];

/** Swap/regenerate intents — subscriber-only, but NOT monthly-quota'd. */
const SWAP_REQUEST_PATTERNS: RegExp[] = [
  /\bswap\s+(this|my|the)\s*(meal|food|exercise)/i,
  /بدّل\s+(وجبة|أكلة|تمرين)/i,
  /بديل\s+(وجبة|أكلة|تمرين)/i,
  /\bregenerate\s+(meal|plan|workout)/i,
  /أعد\s+(توليد|صناعة)\s*(وجبة|خطة)/i,
];

/** Food/nutrition keywords — decide the plan domain for quota accounting. */
const NUTRITION_HINT_RE =
  /meal|food|diet|nutrition|calorie|kcal|macro|menu|وجبة|أكل|اكل|تغذية|دايت|سعر|سعرة|كالوري|مينو/i;

export type EvoIntent = {
  /** Message asks EVO to CREATE a meal/workout plan → monthly quota. */
  isPlanCreation: boolean;
  /** Message asks for a swap/regeneration → subscriber-only, unified monthly swap quota. */
  isSwapRequest: boolean;
  /** The subscriber gate (plan creation OR swap) — same as the old flat list. */
  isSubscriberOnly: boolean;
  /** Quota domain — only meaningful when isPlanCreation is true. */
  planDomain: EvoPlanDomain;
};

export function classifyEvoIntent(message: string): EvoIntent {
  const isPlanCreation = PLAN_CREATION_PATTERNS.some((p) => p.test(message));
  const isSwapRequest = SWAP_REQUEST_PATTERNS.some((p) => p.test(message));
  const planDomain: EvoPlanDomain = NUTRITION_HINT_RE.test(message)
    ? "nutrition"
    : "workout";
  return {
    isPlanCreation,
    isSwapRequest,
    isSubscriberOnly: isPlanCreation || isSwapRequest,
    planDomain,
  };
}
