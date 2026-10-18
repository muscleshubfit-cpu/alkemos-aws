/**
 * AI Workout Planner demo — §12.32 (owner directive 2026-09-12: «ضيف أداة
 * جديده مخطط التمارين بالذكاء الاصطناعي»).
 *
 * The pure layer behind /api/ai/workout-plan-demo and the
 * /ai-workout-planner pages — the workout twin of §12.28's meal-planner
 * trial: input validation, the generation prompt, and a STRICT response
 * validator. The route stays thin; everything here is unit-testable.
 *
 * LAWS (guarded in src/lib/__tests__/ai-workout-planner.test.ts):
 *   - TRIAL FOR EVERYONE, NO SIGNUP WALL (Phase 183 «البوول الموحد»):
 *     one synchronous demo call on the free-chain — no ai_jobs queue,
 *     no membership gate. Generation is gated by the caller's unified
 *     monthly pool (guests = the free 2/month) counted SUCCESS-ONLY;
 *     the route auto-saves member plans to the `plans` table and guests
 *     keep theirs in localStorage (plan-persistence.ts).
 *   - COST CEILING: an IP burst guard runs BEFORE any provider call
 *     (abuse-only — failures never burn the pool).
 *   - HONEST SHAPE: the returned week must carry EXACTLY the requested
 *     number of training days, each with 3–8 exercises carrying real
 *     sets (1–10) and reps (numeric 1–50 or an "8-12" range) — anything
 *     else is rejected (422) rather than displayed.
 */

import { parseJSON } from "./parse-json";

export const WORKOUT_DAYS_MIN = 2;
export const WORKOUT_DAYS_MAX = 6;
export const WORKOUT_NOTES_MAX = 200;
/** Phase 183 (2026-09-13 «البوول الموحد»): the old IP-keyed 5/day trial
 * ceiling is retired — generations are gated by the UNIFIED monthly pool
 * (ai_plan_usage, migration 0085; guests get the free 2) counted
 * SUCCESS-ONLY by the route; an IP burst guard (abuse-only, failures
 * don't burn the pool) lives in the route, not here. */

export const WORKOUT_GOALS = ["fat-loss", "muscle", "strength", "endurance"] as const;
export type WorkoutGoal = (typeof WORKOUT_GOALS)[number];

export const WORKOUT_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type WorkoutLevel = (typeof WORKOUT_LEVELS)[number];

export const WORKOUT_EQUIPMENT = ["bodyweight", "home-dumbbells", "full-gym"] as const;
export type WorkoutEquipment = (typeof WORKOUT_EQUIPMENT)[number];

export interface WorkoutPlanRequest {
  goal: WorkoutGoal;
  level: WorkoutLevel;
  days: number;
  equipment: WorkoutEquipment;
  language: "en" | "ar";
  notes?: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number | string;
}

export interface WorkoutDay {
  name: string;
  focus?: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  days: WorkoutDay[];
}

export type WorkoutRequestVerdict =
  | { ok: true; value: WorkoutPlanRequest }
  | { ok: false; error: string };

const GOAL_LABELS: Record<WorkoutGoal, { ar: string; en: string }> = {
  "fat-loss": { ar: "خسارة الدهون", en: "losing fat" },
  muscle: { ar: "بناء العضلات", en: "building muscle" },
  strength: { ar: "زيادة القوة", en: "getting stronger" },
  endurance: { ar: "اللياقة العامة", en: "general fitness" },
};

const LEVEL_LABELS: Record<WorkoutLevel, { ar: string; en: string }> = {
  beginner: { ar: "مبتدئ", en: "beginner" },
  intermediate: { ar: "متوسط", en: "intermediate" },
  advanced: { ar: "متقدم", en: "advanced" },
};

const EQUIPMENT_LABELS: Record<WorkoutEquipment, { ar: string; en: string }> = {
  bodyweight: { ar: "وزن الجسم بلا معدات", en: "bodyweight only, no equipment" },
  "home-dumbbells": { ar: "دمبل في البيت", en: "a pair of dumbbells at home" },
  "full-gym": { ar: "نادي كامل التجهيز", en: "a fully equipped gym" },
};

/** Validate the demo request (pure — mirrored server-side by the route). */
export function validateWorkoutRequest(input: {
  goal?: unknown;
  level?: unknown;
  days?: unknown;
  equipment?: unknown;
  language?: unknown;
  notes?: unknown;
}): WorkoutRequestVerdict {
  const goal = String(input.goal ?? "");
  if (!(WORKOUT_GOALS as readonly string[]).includes(goal)) {
    return { ok: false, error: `goal must be one of: ${WORKOUT_GOALS.join(", ")}` };
  }
  const level = String(input.level ?? "");
  if (!(WORKOUT_LEVELS as readonly string[]).includes(level)) {
    return { ok: false, error: `level must be one of: ${WORKOUT_LEVELS.join(", ")}` };
  }
  const days = Number(input.days);
  if (
    !Number.isFinite(days) ||
    !Number.isInteger(days) ||
    days < WORKOUT_DAYS_MIN ||
    days > WORKOUT_DAYS_MAX
  ) {
    return {
      ok: false,
      error: `days must be an integer between ${WORKOUT_DAYS_MIN} and ${WORKOUT_DAYS_MAX}`,
    };
  }
  const equipment = String(input.equipment ?? "");
  if (!(WORKOUT_EQUIPMENT as readonly string[]).includes(equipment)) {
    return { ok: false, error: `equipment must be one of: ${WORKOUT_EQUIPMENT.join(", ")}` };
  }
  const language = input.language === "ar" ? "ar" : input.language === "en" ? "en" : null;
  if (!language) {
    return { ok: false, error: "language must be 'en' or 'ar'" };
  }
  const notes =
    typeof input.notes === "string" && input.notes.trim()
      ? input.notes.trim().slice(0, WORKOUT_NOTES_MAX)
      : undefined;
  return {
    ok: true,
    value: { goal: goal as WorkoutGoal, level: level as WorkoutLevel, days, equipment: equipment as WorkoutEquipment, language, notes },
  };
}

/** The form's select options in the page's own language. */
export function workoutGoalOptions(lang: "en" | "ar") {
  return WORKOUT_GOALS.map((g) => ({
    slug: g,
    label: lang === "ar" ? GOAL_LABELS[g].ar : GOAL_LABELS[g].en,
  }));
}

export function workoutLevelOptions(lang: "en" | "ar") {
  return WORKOUT_LEVELS.map((l) => ({
    slug: l,
    label: lang === "ar" ? LEVEL_LABELS[l].ar : LEVEL_LABELS[l].en,
  }));
}

export function workoutEquipmentOptions(lang: "en" | "ar") {
  return WORKOUT_EQUIPMENT.map((e) => ({
    slug: e,
    label: lang === "ar" ? EQUIPMENT_LABELS[e].ar : EQUIPMENT_LABELS[e].en,
  }));
}

/**
 * The generation prompt — JSON-only, self-contained, and language-aware.
 * Both languages pin the requested day count (the honesty anchor the
 * validator enforces) and steer the model to well-known exercise families
 * matched to the available equipment.
 */
export function buildWorkoutPrompt(req: WorkoutPlanRequest): string {
  const notesLine = req.notes
    ? req.language === "ar"
      ? `\nقيود خاصة يجب احترامها: ${req.notes}`
      : `\nSpecial constraints to respect: ${req.notes}`
    : "";
  if (req.language === "ar") {
    return [
      `أنت مدرب قوة ولياقة. ولّد نظاماً تدريبياً أسبوعياً من ${req.days} أيام تمرين لهدف ${GOAL_LABELS[req.goal].ar}، لمتدرب ${LEVEL_LABELS[req.level].ar}، يتدرب بتجهيزة ${EQUIPMENT_LABELS[req.equipment].ar}.`,
      "اختر تمارين معروفة من عائلاتها الأساسية (سكوات، رفعة ميتة، بنش برس، تجديف، ضغط كتف، سحب، دفع، ثني، بسط...) بحيث تناسب التجهيزة المتاحة، ووزّع عضلات الجسم عبر الأسبوع بتوازن — لا تكرر العضلة الكبيرة في يومين متتاليين.",
      `اكتب اسم كل يوم وعضلاته المستهدفة وأسماء التمارين بالعربية.${notesLine}`,
      `أعد JSON فقط بهذا الشكل: {"days":[{"name":"اليوم الأول","focus":"صدر وترايسبس","exercises":[{"name":"بنش برس بار مستوي","sets":4,"reps":8}]}]}`,
      `قواعد صارمة: مصفوفة الأيام تحمل ${req.days} أيام بالضبط؛ 4 إلى 6 تمارين لكل يوم؛ كل تمرين 2 إلى 6 مجموعات بتكرارات 5 إلى 20 (رقم واحد أو مدى مثل "8-12")؛ لا نص خارج JSON.`,
    ].join("\n");
  }
  return [
    `You are a strength and conditioning coach. Generate a ${req.days}-day weekly workout split for ${GOAL_LABELS[req.goal].en}, for a ${LEVEL_LABELS[req.level].en} trainee, training with ${EQUIPMENT_LABELS[req.equipment].en}.`,
    'Pick well-known exercises from the basic families (squat, deadlift, bench press, rows, overhead press, pull-downs/pull-ups, lunges, curls, extensions...) that match the available equipment, and distribute muscle groups across the week in balance — never the same big muscle group on back-to-back days.',
    `Write every day name, its target muscles, and every exercise name in English.${notesLine}`,
    `Return JSON only, exactly this shape: {"days":[{"name":"Day 1","focus":"chest and triceps","exercises":[{"name":"Barbell bench press","sets":4,"reps":8}]}]}`,
    `Hard rules: the days array carries exactly ${req.days} days; 4 to 6 exercises per day; every exercise 2 to 6 sets of 5 to 20 reps (a single number or a range like "8-12"); no text outside the JSON.`,
  ].join("\n");
}

export type WorkoutPlanVerdict =
  | { ok: true; value: WorkoutPlan }
  | { ok: false; error: string };

/**
 * STRICT response validator — a drifted or hallucinated payload is
 * REJECTED (the route answers 422) rather than shown to the visitor.
 * The honesty anchor: the week must carry EXACTLY the requested number
 * of training days. Free-tier models often WRAP the plan object
 * ({plan:…}, {workout:…}) — the extractor tolerates the wrappers; the
 * shape bounds stay honest.
 */
function unwrapDays(raw: unknown): unknown[] | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.days)) return obj.days;
  // Common model wrappers — descend one level.
  for (const key of ["plan", "workout", "workout_plan", "workoutPlan", "week", "split", "result", "data"]) {
    const inner = obj[key];
    if (inner && typeof inner === "object") {
      const days = (inner as Record<string, unknown>).days;
      if (Array.isArray(days)) return days;
    }
  }
  return null;
}

/** A reps value is honest when it is a 1–50 integer or an "8-12" range. */
function normalizeReps(reps: unknown): number | string | null {
  if (typeof reps === "number" && Number.isInteger(reps) && reps >= 1 && reps <= 50) {
    return reps;
  }
  if (typeof reps === "string") {
    const range = reps.trim().match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
    if (range) {
      const lo = Number(range[1]);
      const hi = Number(range[2]);
      if (lo >= 1 && hi <= 50 && lo <= hi) return `${lo}-${hi}`;
    }
  }
  return null;
}

export function validateWorkoutPlan(
  raw: unknown,
  requestedDays: number,
): WorkoutPlanVerdict {
  const days = unwrapDays(raw);
  if (!days) {
    return { ok: false, error: "model returned no days array" };
  }
  if (days.length !== requestedDays) {
    return {
      ok: false,
      error: `plan must carry exactly ${requestedDays} training days (got ${days.length})`,
    };
  }
  const out: WorkoutDay[] = [];
  for (const d of days) {
    const day = d as { name?: unknown; focus?: unknown; exercises?: unknown; movements?: unknown };
    const name = typeof day.name === "string" ? day.name.trim() : "";
    if (!name || name.length > 60) {
      return { ok: false, error: "every training day needs a name (≤60 chars)" };
    }
    const focus =
      typeof day.focus === "string" && day.focus.trim() ? day.focus.trim().slice(0, 60) : undefined;
    const rawExercises = Array.isArray(day.exercises)
      ? day.exercises
      : Array.isArray(day.movements)
        ? day.movements
        : null;
    if (!rawExercises || rawExercises.length < 3 || rawExercises.length > 8) {
      return { ok: false, error: `day "${name}" must carry 3 to 8 exercises` };
    }
    const exercises: WorkoutExercise[] = [];
    for (const ex of rawExercises) {
      const e = ex as { name?: unknown; exercise?: unknown; sets?: unknown; reps?: unknown };
      const exName =
        typeof e.name === "string" ? e.name.trim() : typeof e.exercise === "string" ? e.exercise.trim() : "";
      if (!exName || exName.length > 60) {
        return { ok: false, error: `an exercise in "${name}" has no valid name` };
      }
      const sets = Number(e.sets);
      if (!Number.isInteger(sets) || sets < 1 || sets > 10) {
        return { ok: false, error: `exercise "${exName}" sets must be an integer 1–10` };
      }
      const reps = normalizeReps(e.reps);
      if (reps === null) {
        return { ok: false, error: `exercise "${exName}" reps must be 1–50 or a range like "8-12"` };
      }
      exercises.push({ name: exName, sets, reps });
    }
    out.push(focus ? { name, focus, exercises } : { name, exercises });
  }
  return { ok: true, value: { days: out } };
}

/**
 * Parse a model reply into a plan — with REASONING SALVAGE (the §12.28
 * live lesson applied from day one): reasoning-capable free models prefix
 * chain-of-thought text before the JSON. When the direct parse yields no
 * days, re-parse from the LAST plausible {"days"…} start — the plan
 * itself, wherever the model put it.
 */
export function parseWorkoutPlanText(
  text: string,
  requestedDays: number,
): WorkoutPlanVerdict {
  const direct = validateWorkoutPlan(parseJSON<unknown>(text), requestedDays);
  if (direct.ok) return direct;

  const idx = text.lastIndexOf('{"days"');
  if (idx > 0) {
    const salvaged = validateWorkoutPlan(
      parseJSON<unknown>(text.slice(idx)),
      requestedDays,
    );
    if (salvaged.ok) return salvaged;
  }
  // Fallback: an enclosing brace just before a "days" key anywhere.
  const keyIdx = text.lastIndexOf('"days"');
  if (keyIdx > 0) {
    const brace = text.lastIndexOf("{", keyIdx);
    if (brace >= 0 && brace < keyIdx) {
      const salvaged = validateWorkoutPlan(
        parseJSON<unknown>(text.slice(brace)),
        requestedDays,
      );
      if (salvaged.ok) return salvaged;
    }
  }
  return direct;
}
