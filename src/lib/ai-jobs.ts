/**
 * AI Jobs — generic queue for ALL batch AI work.
 *
 * OWNER DIRECTIVE (2026-08-27): the whole AI system runs natively inside
 * GitHub Actions (same pattern as the blog pipeline). EVO chat stays on
 * Vercel streaming. Everything else becomes an `ai_jobs` row:
 *
 *   plan_nutrition       coach asks a full nutrition plan  (+2 alts/meal)
 *   plan_workout         coach asks a weekly workout program (4-8 weeks framing)
 *   meal_regenerate      swap one meal (tier-limited weekly, like old C16)
 *   exercise_regenerate  swap one exercise (library-filtered, injury-safe)
 *   food_item_regenerate swap ONE food item (±15% kcal, same role) — staff
 *                        editing tool (Phase 79: same features as the admin
 *                        external-plans console, owner «الكوتشينج يستفيدوا
 *                        من نفس الخصائص»)
 *   day_regenerate       regenerate ONE workout day (same focus, avoid the
 *                        other days) — staff editing tool, same Phase 79 law
 *   article_tool         paraphrase | summarize | proofread | seo_pack |
 *                        subheadings (+ legacy editor tool aliases)
 *   article_generate     coach asks a COMPLETE new article draft (title +
 *                        markdown body + meta + tags) — restored 2026-08-28;
 *                        2026-08-28b: topic is now OPTIONAL — an empty topic
 *                        makes the PROCESSOR pick a fresh title via
 *                        pickSmartTopic() (the same smart topic system the
 *                        automated blog pipeline uses) so the generation
 *                        system itself chooses the article's subject
 *                        (owner report: «مفروض يختار العنوان بنفس نظام
 *                        التوليد»)
 *   social_post          facebook | instagram | x/twitter | linkedin × tone
 *
 * WRITE PATHS:
 *   • enqueueAiJob / status writes → service-role (RLS bypass) only.
 *   • Browsers hold SELECT-own-row RLS policy — they can watch their own
 *     jobs through /api/ai/jobs?id=… but can NEVER forge or mutate rows.
 *
 * RUNNER CONTRACT (scripts/ai-jobs-runner/process.mts):
 *   reapStaleJobs() → claimQueuedJobs() → PROCESSORS[type](payload)
 *   → finishJob()/failJob(); failJob requeues until MAX_ATTEMPTS.
 */
import type { Json } from "@/lib/supabase/types";
import { DIET_TYPES } from "@/lib/diet-types";

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

/* ─────────────────────────── Types ─────────────────────────── */

export const AI_JOB_TYPES = [
  "plan_nutrition",
  "plan_workout",
  "meal_regenerate",
  "exercise_regenerate",
  "food_item_regenerate",
  "day_regenerate",
  "article_tool",
  "article_generate",
  "social_post",
] as const;

export type AiJobType = (typeof AI_JOB_TYPES)[number];

export const AI_JOB_STATUSES = [
  "queued",
  "processing",
  "done",
  "failed",
] as const;

export type AiJobStatus = (typeof AI_JOB_STATUSES)[number];

/** Hard retry ceiling per job before it lands in `failed`. */
export const MAX_JOB_ATTEMPTS = 3;

/** Typical end-to-end latency = poll interval + generation time. */
export const JOB_ETA_MINUTES = 10;

/** Envelope cap on the JSON payload the API route will accept. */
export const MAX_PAYLOAD_BYTES = 40_960; // 40 KB

export type AiJobRow = {
  id: string;
  job_type: AiJobType;
  status: AiJobStatus;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string | null;
  requested_by?: string | null;
  attempts?: number;
  created_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
};

/** How a job is authorized at enqueue time. */
export type JobGate = "coach" | "user_swap_meal" | "user_swap_exercise";

export const JOB_GATE: Record<AiJobType, JobGate> = {
  plan_nutrition: "coach",
  plan_workout: "coach",
  article_tool: "coach",
  article_generate: "coach",
  social_post: "coach",
  meal_regenerate: "user_swap_meal",
  exercise_regenerate: "user_swap_exercise",
  // PHASE 79: item/day swaps are STAFF EDITING TOOLS (coach | admin) —
  // the same unlimited-editing semantics as meal/exercise swaps get for
  // staff (T-4PILLAR quota bypass). Clients never enqueue them.
  food_item_regenerate: "coach",
  day_regenerate: "coach",
};

/** UI labels (kept here so client + runner never drift apart). */
export const JOB_LABELS: Record<AiJobType, { ar: string; en: string }> = {
  plan_nutrition: { ar: "توليد خطة تغذية", en: "Generate nutrition plan" },
  plan_workout: { ar: "توليد برنامج تمارين", en: "Generate workout program" },
  meal_regenerate: { ar: "استبدال وجبة", en: "Swap meal" },
  exercise_regenerate: { ar: "استبدال تمرين", en: "Swap exercise" },
  food_item_regenerate: { ar: "استبدال صنف غذائي", en: "Swap food item" },
  day_regenerate: { ar: "إعادة توليد يوم تدريبي", en: "Regenerate workout day" },
  article_tool: { ar: "أداة تحسين المقال", en: "Article tool" },
  article_generate: { ar: "توليد مقال كامل", en: "Generate article" },
  social_post: { ar: "منشور سوشيال ميديا", en: "Social post" },
};

export function isAiJobType(v: unknown): v is AiJobType {
  return typeof v === "string" && (AI_JOB_TYPES as readonly string[]).includes(v);
}

/** Thrown by sanitizeJobPayload when a REQUIRED field is missing/short —
 * the API route maps this to HTTP 400 (never 500). */
export class JobPayloadError extends Error {}

/* ────────────────── Payload sanitization (server trust boundary) ──────────────────
 * The enqueue route NEVER stores raw body payloads. Every type passes through a
 * whitelist picker that copies ONLY known fields with clamps — deep objects sent
 * from DevTools cannot smuggle prompt injections into uncontrolled fields beyond
 * the user-owned free-text slots explicitly designed for them (`note`, `reason`).
 * ─────────────────────────────────────────────────────────────────────────────── */

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.slice(0, max) : "";
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
};
/** DRAFT-HYGIENE 2026-10-25: the regeneration flow's replacePlanId rides
 * the sanitized payload so the RUNNER (not just the initiating browser)
 * can swap the superseded draft out — strict UUID shape, anything else
 * degrades to undefined (same law as every other whitelisted field). */
const UUIDish = (v: unknown): string | undefined => {
  const s = str(v, 64);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
    ? s
    : undefined;
};

function pickClientContext(cc: unknown) {
  // Same shape CoachClientView builds today — nothing else survives.
  // PHASE 62: recent_plan_names = foods/exercises from the client's
  // previous plans, injected into prompts as an avoid-repeat list.
  if (!cc || typeof cc !== "object") return undefined;
  const o = cc as Record<string, unknown>;
  return {
    name: str(o.name, 80),
    nutrition: o.nutrition && typeof o.nutrition === "object" ? (o.nutrition as Json) : null,
    fitness: o.fitness && typeof o.fitness === "object" ? (o.fitness as Json) : null,
    recent_measurements: Array.isArray(o.recent_measurements)
      ? o.recent_measurements.slice(0, 5)
      : [],
    recent_plan_names: Array.isArray(o.recent_plan_names)
      ? (o.recent_plan_names as unknown[]).filter((n) => typeof n === "string").map((n) => str(n, 60)).slice(0, 60)
      : [],
  };
}

export function sanitizeJobPayload(type: AiJobType, raw: unknown): Json {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  switch (type) {
    case "plan_nutrition":
    case "plan_workout": {
      const o = (p.overrides && typeof p.overrides === "object" ? p.overrides : {}) as Record<string, unknown>;
      return {
        clientId: str(p.clientId, 64),
        clientContext: pickClientContext(p.clientContext),
        // DRAFT-HYGIENE 2026-10-25: the superseded draft's id (regeneration
        // flow) — the runner deletes it AFTER the replacement draft exists
        // and ONLY while it is still an unapproved draft.
        replacePlanId: UUIDish(p.replacePlanId),
        overrides: {
          targetCalories: num(o.targetCalories),
          macros: (() => {
            const m = o.macros && typeof o.macros === "object" ? (o.macros as Record<string, unknown>) : null;
            return m
              ? {
                  protein_g: num(m.protein_g),
                  carbs_g: num(m.carbs_g),
                  fat_g: num(m.fat_g),
                }
              : undefined;
          })(),
          foods: Array.isArray(o.foods) ? (o.foods as unknown[]).map((f) => str(f, 60)).slice(0, 30) : undefined,
          mealsCount: (() => { const n = num(o.mealsCount); return n ? Math.min(6, Math.max(2, Math.round(n))) : undefined; })(),
          notes: str(o.notes, 500),
          // NOTIF→PLAN 2026-10-24 (owner order item 4): the coach's diet-type
          // selection — strict enum whitelist, same shape law as every other
          // override field (a hostile value degrades to undefined, never
          // reaches the prompt as free text).
          dietType: (() => {
            const d = str(o.dietType, 20);
            return (DIET_TYPES as readonly string[]).includes(d) ? d : undefined;
          })(),
        },
      };
    }
    case "meal_regenerate": {
      const m = (p.meal && typeof p.meal === "object" ? p.meal : {}) as Record<string, unknown>;
      return {
        meal: {
          name: str(m.name, 120),
          items: Array.isArray(m.items) ? m.items.slice(0, 15) : [],
          notes: str(m.notes, 300),
        },
        targetCalories: num(p.targetCalories),
        clientContext: pickClientContext(p.clientContext),
        reason: str(p.reason ?? p.note, 400),
        // PHASE 62 VARIETY: other meals' item names from the same plan —
        // the regenerated meal must not duplicate them.
        avoid_names: Array.isArray(p.avoid_names)
          ? (p.avoid_names as unknown[]).filter((n) => typeof n === "string").map((n) => str(n, 60)).slice(0, 40)
          : [],
        // PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 1): the OWNING
        // plan's diet type rides the meal swap so the replacement respects
        // the client's committed diet (keto plan → keto meal). Strict enum
        // whitelist — a hostile value degrades to undefined, same law as
        // plan_nutrition's dietType.
        dietType: (() => {
          const d = str(p.dietType, 20);
          return (DIET_TYPES as readonly string[]).includes(d) ? d : undefined;
        })(),
        // SWAP-DURABILITY 2026-10-25 (owner order item 1 — «أصلح تبديل…
        // وجبة كاملة من واجهة المدرب حتى نجاح الحفظ»): the swap targets the
        // OWNING plan row server-side. Measured production evidence: both
        // swap jobs of 2026-10-25 13:29Z finished `done` in ai_jobs yet the
        // results never reached the saved plan — the browser poller died
        // with the editor the coach navigated away from. The RUNNER now
        // materializes the gated replacement into plans.content itself
        // (strict UUID + bounded index — hostile values degrade to
        // undefined and materialization silently skips).
        planId: UUIDish(p.planId),
        clientId: UUIDish(p.clientId),
        mealIdx: (() => {
          const n = num(p.mealIdx);
          return n !== undefined && Number.isFinite(n) && n >= 0 ? Math.min(30, Math.round(n)) : undefined;
        })(),
      };
    }
    case "exercise_regenerate": {
      const ex = (p.exercise && typeof p.exercise === "object" ? p.exercise : {}) as Record<string, unknown>;
      return {
        exercise: {
          name: str(ex.name, 120),
          sets: num(ex.sets),
          reps: str(ex.reps, 40),
          rest: str(ex.rest, 40),
          focus: str(ex.focus, 120),
        },
        location: str(p.location, 60), // gym | home | …
        clientContext: pickClientContext(p.clientContext),
        reason: str(p.reason ?? p.note, 400), // e.g. knee injury / no machine
        // MEMBER-SWAP-DURABILITY 2026-10-26 (owner order items 1-2): the
        // exercise swap rides the same plan-target law as meal/item swaps —
        // planId + clientId + bounded indices (strict UUID, hostile values
        // degrade to undefined and materialization silently skips). The
        // member's PlansView flow now carries them, so the RUNNER can
        // persist the gated replacement into plans.content server-side
        // (previously ONLY the browser poller applied exercise swaps — a
        // dead tab lost the result, the exact 13:29Z failure class 368
        // fixed for meals but left open here).
        planId: UUIDish(p.planId),
        clientId: UUIDish(p.clientId),
        dayIdx: (() => {
          const n = num(p.dayIdx);
          return n !== undefined && Number.isFinite(n) && n >= 0 ? Math.min(20, Math.round(n)) : undefined;
        })(),
        exIdx: (() => {
          const n = num(p.exIdx);
          return n !== undefined && Number.isFinite(n) && n >= 0 ? Math.min(30, Math.round(n)) : undefined;
        })(),
      };
    }
    case "food_item_regenerate": {
      // PHASE 79: ONE food item — same nutritional role, calories ±15%.
      // Mirrors the admin external-plans regenerate_item contract.
      const it = (p.item && typeof p.item === "object" ? p.item : {}) as Record<string, unknown>;
      return {
        item: {
          food: str(it.food, 120),
          amount: str(it.amount, 80),
          calories: num(it.calories) ?? 0,
          alternatives: str(it.alternatives, 200),
        },
        meal_name: str(p.meal_name, 120),
        clientContext: pickClientContext(p.clientContext),
        note: str(p.note ?? p.reason, 400),
        avoid_names: Array.isArray(p.avoid_names)
          ? (p.avoid_names as unknown[]).filter((n) => typeof n === "string").map((n) => str(n, 60)).slice(0, 40)
          : [],
        // PLAN-REGEN-CONSTRAINTS 2026-10-24: the owning plan's diet type —
        // the ±15%-equivalent item replacement must respect it too.
        dietType: (() => {
          const d = str(p.dietType, 20);
          return (DIET_TYPES as readonly string[]).includes(d) ? d : undefined;
        })(),
        // SWAP-DURABILITY 2026-10-25: same law as meal_regenerate — the
        // runner materializes the item replacement into the owning plan row
        // server-side (strict UUID + bounded indices, best-effort).
        planId: UUIDish(p.planId),
        clientId: UUIDish(p.clientId),
        mealIdx: (() => {
          const n = num(p.mealIdx);
          return n !== undefined && Number.isFinite(n) && n >= 0 ? Math.min(30, Math.round(n)) : undefined;
        })(),
        itemIdx: (() => {
          const n = num(p.itemIdx);
          return n !== undefined && Number.isFinite(n) && n >= 0 ? Math.min(40, Math.round(n)) : undefined;
        })(),
      };
    }
    case "day_regenerate": {
      // PHASE 79: ONE workout day — same weekly slot + same muscle focus,
      // 4-6 fresh exercises that avoid the other days' exercises.
      const d = (p.day && typeof p.day === "object" ? p.day : {}) as Record<string, unknown>;
      const exs = Array.isArray(d.exercises) ? d.exercises.slice(0, 10) : [];
      return {
        day: {
          day: str(d.day, 80),
          focus: str(d.focus, 120),
          exercises: (exs as unknown[]).map((raw) => {
            const e = (raw ?? {}) as Record<string, unknown>;
            return {
              name: str(e.name, 120),
              sets: num(e.sets),
              reps: str(e.reps, 40),
              rest: str(e.rest, 40),
              notes: str(e.notes, 200),
            };
          }),
        },
        clientContext: pickClientContext(p.clientContext),
        note: str(p.note ?? p.reason, 400),
        avoid_names: Array.isArray(p.avoid_names)
          ? (p.avoid_names as unknown[]).filter((n) => typeof n === "string").map((n) => str(n, 60)).slice(0, 60)
          : [],
      };
    }
    case "article_generate": {
      // TOPIC-AUTO LAW (2026-08-28b): an empty topic is a FEATURE — the
      // processor auto-picks a fresh, non-duplicate title through the same
      // pickSmartTopic() system the automated blog pipeline uses. The queue
      // slot is never burned on garbage: pickSmartTopic has curated
      // per-language fallbacks, so a topic ALWAYS exists before generation.
      const topic = str(p.topic, 300).trim();
      return {
        topic, // may be "" → processor-side smart pick
        language: p.language === "en" ? "en" : "ar",
        tone: str(p.tone, 60),
        audience: str(p.audience, 120),
        keywords: Array.isArray(p.keywords)
          ? (p.keywords as unknown[]).map((k) => str(k, 40).trim()).filter(Boolean).slice(0, 8)
          : [],
        category: str(p.category, 60),
      };
    }
    case "article_tool": {
      return {
        tool: str(p.tool, 40),
        content: str(p.content, 30_000),
        title: str(p.title, 200),
        keyword: str(p.keyword, 120),
        category: str(p.category, 60),
        language: p.language === "en" ? "en" : "ar",
      };
    }
    case "social_post": {
      const platformRaw = str(p.platform, 20).toLowerCase();
      const PLATFORMS = ["facebook", "instagram", "x", "twitter", "linkedin"];
      const platform = PLATFORMS.includes(platformRaw)
        ? platformRaw === "twitter" ? "x" : platformRaw
        : "facebook";
      const TONES = ["professional", "friendly", "motivational"];
      const tone = TONES.includes(str(p.tone, 20)) ? str(p.tone, 20) : "motivational";
      return {
        platform,
        tone,
        language: p.language === "en" ? "en" : "ar",
        topic: str(p.topic, 200),
        content: str(p.content, 12_000),
        articleUrl: /^https?:\/\//.test(String(p.articleUrl || "")) ? str(p.articleUrl, 300) : "",
      };
    }
  }
}

/* ─────────────────────────── Server operations ─────────────────────────── */

export async function enqueueAiJob(opts: {
  type: AiJobType;
  payload: Record<string, unknown>;
  requestedBy?: string | null;
}): Promise<{ id: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  }
  const clean = sanitizeJobPayload(opts.type, opts.payload);
  const { data, error } = await supabaseAdmin
    .from("ai_jobs")
    .insert({
      job_type: opts.type,
      payload: clean,
      requested_by: opts.requestedBy ?? null,
      status: "queued",
    })
    .select("id")
    .single();
  if (error) throw new Error(`enqueue failed: ${error.message}`);
  return { id: data.id };
}

/**
 * GHA runner side — atomically claim up to `limit` oldest queued jobs.
 * Optimistic UPDATE … WHERE status='queued' keeps a single winner even if
 * two workflow runs overlap (concurrency group also guards this).
 */
export async function claimQueuedJobs(limit = 10): Promise<AiJobRow[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) throw new Error("admin client missing");
  const { data: candidates } = await supabaseAdmin
    .from("ai_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);
  const claimed: AiJobRow[] = [];
  for (const row of (candidates as unknown as AiJobRow[]) || []) {
    const { data } = await supabaseAdmin
      .from("ai_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        attempts: (row.attempts || 0) + 1,
      })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("*");
    if (data && data.length > 0) claimed.push(data[0] as unknown as AiJobRow);
  }
  return claimed;
}

export async function finishJob(jobId: string, result: unknown): Promise<void> {
  await supabaseAdmin!
    .from("ai_jobs")
    .update({
      status: "done",
      result: result as Json,
      error_message: null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/** Retry-aware failure: back to `queued` until attempts hit the ceiling. */
export async function failJob(jobId: string, currentAttempts: number, message: string): Promise<"requeued" | "failed"> {
  const exhausted = (currentAttempts || 1) >= MAX_JOB_ATTEMPTS;
  await supabaseAdmin!
    .from("ai_jobs")
    .update({
      status: exhausted ? "failed" : "queued",
      error_message: message.slice(0, 2000),
      finished_at: exhausted ? new Date().toISOString() : null,
    })
    .eq("id", jobId);
  return exhausted ? "failed" : "requeued";
}

/** Jobs stuck in `processing` > 30 min (runner crash mid-job) → requeue. */
export async function reapStaleJobs(staleMinutes = 30): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const cutoff = new Date(Date.now() - staleMinutes * 60_000).toISOString();
  const { data } = await supabaseAdmin
    .from("ai_jobs")
    .update({
      status: "queued",
      error_message: "reaped: processing exceeded time limit — auto-retried",
    })
    .eq("status", "processing")
    .lt("started_at", cutoff)
    .select("id");
  return data?.length ?? 0;
}
