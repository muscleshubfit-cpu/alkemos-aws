/**
 * AI Meal Planner demo — §12.28 (owner directive 2026-09-12: «مءكور خطط
 * وجباتك بالذكاء الاصطناعي ورابط الى بمخطط الوجبات ( اين صفحة تخطيط
 * الوجبات بالذكاء الاصطناعي؟ مطلوب إنشاؤها مع سماح بالتجربة للجميع
 * بدون تعارض مع الاشتراكات )»).
 *
 * The pure layer behind /api/ai/meal-plan-demo and the /ai-meal-planner
 * pages: input validation, the generation prompt, and a STRICT response
 * validator. The route stays thin; everything here is unit-testable.
 *
 * LAWS (guarded in src/lib/__tests__/ai-meal-planner.test.ts):
 *   - TRIAL FOR EVERYONE, NO SIGNUP WALL (Phase 183 «البوول الموحد»):
 *     one synchronous demo call on the free-chain — no ai_jobs queue,
 *     no membership gate. Generation is gated by the caller's unified
 *     monthly pool (guests = the free 2/month) counted SUCCESS-ONLY;
 *     the route auto-saves member plans to the `plans` table and guests
 *     keep theirs in localStorage (plan-persistence.ts).
 *   - COST CEILING: an IP burst guard runs BEFORE any provider call
 *     (abuse-only — failures never burn the pool).
 *   - HONEST SHAPE: the generated day must close within ±20% of the
 *     requested calories and every item must carry real grams — anything
 *     else is rejected (422) rather than displayed.
 */

import { DIET_SYSTEMS, getDietSystem } from "./diet-plan-matrix";
import { parseJSON } from "./parse-json";

export const DEMO_CALORIE_MIN = 1200;
export const DEMO_CALORIE_MAX = 4000;
export const DEMO_NOTES_MAX = 200;
/** Phase 183 (2026-09-13 «البوول الموحد»): the old IP-keyed 5/day
 * trial ceiling is retired — generations are gated by the UNIFIED
 * monthly pool (ai_plan_usage, migration 0085; guests get the free 2)
 * counted SUCCESS-ONLY by the route; an IP burst guard (abuse-only,
 * failures don't burn the pool) lives in the route, not here. */
/** The generated day must close within ±20% of the requested calories. */
export const DEMO_CALORIE_DRIFT = 0.2;

export interface DemoPlanRequest {
  calories: number;
  system: string;
  language: "en" | "ar";
  notes?: string;
}

export interface DemoMealItem {
  food: string;
  grams: number;
  kcal: number;
}

export interface DemoMeal {
  name: string;
  items: DemoMealItem[];
  kcal: number;
}

export interface DemoPlan {
  meals: DemoMeal[];
  kcal: number;
}

export type DemoRequestVerdict =
  | { ok: true; value: DemoPlanRequest }
  | { ok: false; error: string };

/** Validate the demo request (pure — mirrored server-side by the route). */
export function validateDemoRequest(input: {
  calories?: unknown;
  system?: unknown;
  language?: unknown;
  notes?: unknown;
}): DemoRequestVerdict {
  const calories = Number(input.calories);
  if (
    !Number.isFinite(calories) ||
    !Number.isInteger(calories) ||
    calories < DEMO_CALORIE_MIN ||
    calories > DEMO_CALORIE_MAX
  ) {
    return {
      ok: false,
      error: `calories must be an integer between ${DEMO_CALORIE_MIN} and ${DEMO_CALORIE_MAX}`,
    };
  }
  const system = String(input.system ?? "");
  if (!getDietSystem(system)) {
    return { ok: false, error: "system must be one of: balanced, high-protein, keto, vegetarian" };
  }
  const language = input.language === "ar" ? "ar" : input.language === "en" ? "en" : null;
  if (!language) {
    return { ok: false, error: "language must be 'en' or 'ar'" };
  }
  const notes =
    typeof input.notes === "string" && input.notes.trim()
      ? input.notes.trim().slice(0, DEMO_NOTES_MAX)
      : undefined;
  return { ok: true, value: { calories, system, language, notes } };
}

/**
 * The generation prompt — JSON-only, self-contained, and language-aware.
 * The Arabic prompt asks for an ARABIC-KITCHEN day (the matrix's food
 * world); the English prompt allows the broader international pantry.
 * Both pin the system's macro split so the model respects the site's
 * presets (the same splits the macro calculator uses).
 */
export function buildDemoPrompt(req: DemoPlanRequest): string {
  const sys = getDietSystem(req.system)!;
  const split = `${sys.split.protein}/${sys.split.carbs}/${sys.split.fat}`;
  const notesLine = req.notes ? `\nPreferences to respect: ${req.notes}` : "";
  if (req.language === "ar") {
    return [
      "أنت مخطط وجبات. ولّد خطة يوم كاملة (فطور، غداء، عشاء، سناك) من مطبخ عربي مألوف — فول، عدس، خبز بلدي، أرز، دجاج، سمك، زبادي، خضار — بلا مساحيق ولا مكملات.",
      `الهدف: ${req.calories} سعرة تقريباً بنظام ${sys.nameAr} (توزيع بروتين/كارب/دهون ${split} من السعرات).`,
      `اكتب أسماء الأصناف بالعربية، وكل صنف بغرامات محسوبة وسعراته المقدّرة.${notesLine}`,
      'أعد JSON فقط بهذا الشكل: {"meals":[{"name":"الفطور","items":[{"food":"…","grams":150,"kcal":230}]}]}',
      "قواعد صارمة: 3 إلى 5 وجبات؛ 2 إلى 6 أصناف لكل وجبة؛ كل صنف بين 5 و600 غرام (الزيوت والدهون بملعقة أو اثنتين) — وكميات كل وجبة على حدها لا لليوم كله؛ مجموع سعرات اليوم ضمن 20% من الهدف؛ لا نص خارج JSON.",
    ].join("\n");
  }
  return [
    "You are a meal planner. Generate a full day of food (breakfast, lunch, dinner, snack) from ordinary, affordable groceries — eggs, oats, rice, chicken, fish, legumes, dairy, vegetables — no powders, no supplements.",
    `Target: about ${req.calories} kcal on the ${sys.nameEn} system (protein/carbs/fat split ${split} of calories).`,
    `Write food names in English, every item with computed grams and its estimated kcal.${notesLine}`,
    'Return JSON only, exactly this shape: {"meals":[{"name":"Breakfast","items":[{"food":"...","grams":150,"kcal":230}]}]}',
    "Hard rules: 3 to 5 meals; 2 to 6 items per meal; every item 5 to 600 grams (oils and fats by the spoonful) — each meal's quantities are for THAT meal alone, never the whole day; the day total within 20% of target; no text outside the JSON.",
  ].join("\n");
}

export type DemoPlanVerdict =
  | { ok: true; value: DemoPlan }
  | { ok: false; error: string };

/**
 * STRICT response validator — a drifted or hallucinated payload is
 * REJECTED (the route answers 422) rather than shown to the visitor.
 * Totals are recomputed server-side from the items; model-provided
 * totals are never trusted. Free-tier models often WRAP the plan object
 * ({plan:…}, {day_plan:…}) or emit a one-item snack — the extractor
 * below tolerates the wrappers; the item bounds stay honest.
 */
function unwrapMeals(raw: unknown): unknown[] | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.meals)) return obj.meals;
  // Common model wrappers — descend one level.
  for (const key of ["plan", "day_plan", "dayPlan", "day", "result", "data"]) {
    const inner = obj[key];
    if (inner && typeof inner === "object") {
      const meals = (inner as Record<string, unknown>).meals;
      if (Array.isArray(meals)) return meals;
    }
  }
  return null;
}

export function validateDemoPlan(
  raw: unknown,
  targetCalories: number,
): DemoPlanVerdict {
  const meals = unwrapMeals(raw);
  if (!meals) {
    return { ok: false, error: "model returned no meals array" };
  }
  if (meals.length < 3 || meals.length > 5) {
    return { ok: false, error: "plan must carry 3 to 5 meals" };
  }
  const out: DemoMeal[] = [];
  for (const m of meals) {
    const meal = m as { name?: unknown; items?: unknown; foods?: unknown };
    const name = typeof meal.name === "string" ? meal.name.trim() : "";
    if (!name || name.length > 60) {
      return { ok: false, error: "every meal needs a name (≤60 chars)" };
    }
    const rawItems = Array.isArray(meal.items) ? meal.items : Array.isArray(meal.foods) ? meal.foods : null;
    if (!rawItems || rawItems.length < 1 || rawItems.length > 8) {
      return { ok: false, error: `meal "${name}" must carry 1 to 8 items` };
    }
    const items: DemoMealItem[] = [];
    for (const it of rawItems) {
      const item = it as { food?: unknown; name?: unknown; grams?: unknown; kcal?: unknown; calories?: unknown };
      const food = typeof item.food === "string" ? item.food.trim() : typeof item.name === "string" ? item.name.trim() : "";
      const grams = Number(item.grams);
      const kcal = Number(item.kcal ?? item.calories);
      if (!food || food.length > 60) {
        return { ok: false, error: `item in "${name}" has no valid food name` };
      }
      if (!Number.isFinite(grams) || grams < 5 || grams > 900) {
        return { ok: false, error: `item "${food}" grams must be 5–900` };
      }
      if (!Number.isFinite(kcal) || kcal < 5 || kcal > 1500) {
        return { ok: false, error: `item "${food}" kcal must be 5–1500` };
      }
      items.push({ food, grams: Math.round(grams), kcal: Math.round(kcal) });
    }
    out.push({ name, items, kcal: items.reduce((s, i) => s + i.kcal, 0) });
  }
  const kcal = out.reduce((s, m) => s + m.kcal, 0);
  const drift = Math.abs(kcal - targetCalories) / targetCalories;
  if (drift > DEMO_CALORIE_DRIFT) {
    return {
      ok: false,
      error: `plan total ${kcal} kcal drifted beyond ±20% of ${targetCalories}`,
    };
  }
  return { ok: true, value: { meals: out, kcal } };
}

/** The four demo systems in the page's own language (AR preset names). */
export function demoSystemOptions(lang: "en" | "ar") {
  return DIET_SYSTEMS.map((s) => ({
    slug: s.slug,
    label: lang === "ar" ? s.nameAr : s.nameEn,
  }));
}

/**
 * Parse a model reply into a plan — with REASONING SALVAGE (live fix,
 * §12.28): reasoning-capable free models prefix chain-of-thought text
 * before the JSON (sometimes with stray braces that break the outermost
 * slice). When the direct parse yields no meals, re-parse from the LAST
 * plausible {"meals"…} start — the plan itself, wherever the model put it.
 */
export function parseDemoPlanText(
  text: string,
  targetCalories: number,
): DemoPlanVerdict {
  const direct = validateDemoPlan(parseJSON<unknown>(text), targetCalories);
  if (direct.ok) return direct;

  const idx = text.lastIndexOf('{"meals"');
  if (idx > 0) {
    const salvaged = validateDemoPlan(
      parseJSON<unknown>(text.slice(idx)),
      targetCalories,
    );
    if (salvaged.ok) return salvaged;
  }
  // Fallback: an enclosing brace just before a "meals" key anywhere.
  const keyIdx = text.lastIndexOf('"meals"');
  if (keyIdx > 0) {
    const brace = text.lastIndexOf("{", keyIdx);
    if (brace >= 0 && brace < keyIdx) {
      const salvaged = validateDemoPlan(
        parseJSON<unknown>(text.slice(brace)),
        targetCalories,
      );
      if (salvaged.ok) return salvaged;
    }
  }
  return direct;
}
