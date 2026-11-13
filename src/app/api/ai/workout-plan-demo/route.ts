import { NextRequest, NextResponse } from "next/server";
// R3 (AI-Router unification): the demo surfaces ride the central router —
// policy resolves from ai-registry (workout-demo spec).
import { dispatchAI } from "@/lib/ai-router";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { enrichWorkoutPlanWithLibrary } from "@/lib/ai-workout-exercise-match";
import { getAuthUser } from "@/lib/auth-server";
import {
  checkUnifiedPlanQuota,
  hashGuestKey,
  hashIpKey,
  recordUnifiedPlanUsage,
} from "@/lib/tier-limits";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import {
  buildWorkoutPrompt,
  parseWorkoutPlanText,
  validateWorkoutRequest,
  type WorkoutPlanVerdict,
} from "@/lib/ai-workout-planner";

/**
 * POST /api/ai/workout-plan-demo — the AI workout-planner generation
 * endpoint (§12.32 → Phase 183, owner decree 2026-09-13 «البوول الموحد»
 * — spec "Alkemos — Membership & Plan Changes") — the workout twin of
 * the meal-planner route, same gate ladder:
 *
 *   1. INPUT: one of the 4 goals · one of the 3 levels · 2–6 days · one
 *      of the 3 equipment worlds · en|ar · notes ≤200 chars (validated
 *      BEFORE anything else).
 *   2. BURST GUARD: IP-keyed 20 attempts / 24 h — abuse protection
 *      only, NOT quota (the old 5/day entry-counted limit is retired;
 *      failures never burn the pool — success-only law).
 *   3. UNIFIED MONTHLY QUOTA (ai_plan_usage ledger, migrations 0085+0086
 *      + 0110) — AI-QUOTAS 2026-11-14: generation is SUBSCRIBER-ONLY:
 *      free members and guests get 402 with the subscribe CTA (the
 *      manual planner, calculators and ready-made programs stay free);
 *      members get their tier quota (premium 4 · pro 8 · coaching 8,
 *      aggregated stacking) renewed on the SUBSCRIPTION-CYCLE window.
 *      Nutrition and workout generations draw from the SAME quota.
 *   4. SHAPE: strictly validated (exact day count, 3–8 exercises/day,
 *      bounded sets/reps) — drifted payloads are rejected 422, never
 *      displayed, never counted.
 *
 * MEMBER AUTO-SAVE (spec: «المسجل يحفظ الخطط دائمًا في حسابه»):
 * successful generations for signed-in users are inserted into the
 * `plans` table (source 'ai-planner'). Guests keep the plan on-device
 * via localStorage (plan-persistence.ts).
 *
 * Live-hardening laws kept from §12.28/§12.32: 3000-token budget
 * (reasoning-capable free models), no-written-reasoning system prompt,
 * reasoning-salvage parser, and 20s per chain call so the first+retry
 * pair fits the 60s function budget (no 504).
 */
export const maxDuration = 60;

/** IP burst guard — abuse protection only, deliberately generous. */
const BURST_GUARD = { max: 20, windowMs: 24 * 60 * 60 * 1000 } as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const verdict = validateWorkoutRequest({
      goal: body?.goal,
      level: body?.level,
      days: body?.days,
      equipment: body?.equipment,
      language: body?.language,
      notes: body?.notes,
    });
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.error }, { status: 400 });
    }
    const req = verdict.value;

    // ── Burst guard (IP, abuse-only — failures don't burn the pool). ──
    const ip = clientIp(request);
    const rl = await rateLimit(`workout-demo:${ip}`, BURST_GUARD.max, BURST_GUARD.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            req.language === "ar"
              ? "عدد كبير من المحاولات من هذا الجهاز اليوم — عد غدًا أو تصفّح برامج التدريب الجاهزة الآن."
              : "Too many attempts from this device today — come back tomorrow, or browse the ready workout programs now.",
          rateLimited: true,
          resetAt: rl.resetAt,
        },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    // ── Unified-quota gate (AI-QUOTAS 2026-11-14). ──
    // SUBSCRIBER-ONLY generation: free members and guests → 402 with the
    // subscribe CTA. Subscribers over their monthly quota → 429 with the
    // cycle renewal date.
    const auth = await getAuthUser(request);
    const userId = auth?.id ?? null;
    let guestKey: string | null = null;
    if (!userId) {
      const rawGuestId = typeof body?.guestId === "string" ? body.guestId.trim() : "";
      if (UUID_RE.test(rawGuestId) || rawGuestId.length >= 8) {
        guestKey = hashGuestKey(rawGuestId);
      }
    }
    const ipKey = userId ? null : hashIpKey(ip);
    const quota = await checkUnifiedPlanQuota({
      userId,
      guestKey,
      ipKey,
      tierHint: auth?.membership_tier ?? null,
      staffHint: auth?.is_staff ?? false,
    });
    if (!quota.allowed) {
      const renewsOn = quota.renewsAt ? new Date(quota.renewsAt).toLocaleDateString(req.language === "ar" ? "ar-EG" : "en-US") : "";
      return NextResponse.json(
        {
          error:
            quota.subscriptionRequired
              ? req.language === "ar"
                ? "توليد الخطط بالذكاء الاصطناعي متاح لمشتركي بريميوم وأعلى — الحاسبات والمخطط اليدوي وبرامج التدريب الجاهزة تظل مجانية بالكامل. اشترك لتوليد خطط التغذية والتمارين بحصة شهرية تتجدد مع دورة الاشتراك."
                : "AI plan generation is available to Premium subscribers and above — the calculators, the manual planner and the ready-made programs stay completely free. Subscribe to generate nutrition & workout plans with a monthly quota that renews with your subscription cycle."
              : req.language === "ar"
                ? `استهلكت حصة توليد الخطط لهذه الدورة (${quota.used}/${quota.limit} — تغذية وتمارين من الحصة نفسها). تتجدد الحصة في ${renewsOn}. خططك السابقة متاحة أدناه دائمًا.`
                : `You've used your AI plan-generation quota for this cycle (${quota.used}/${quota.limit} — nutrition and workout share one quota). It renews on ${renewsOn}. Your previous plans always stay available below.`,
          subscriptionRequired: quota.subscriptionRequired,
          quotaExhausted: !quota.subscriptionRequired,
          quota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
            subscriptionRequired: quota.subscriptionRequired,
            renewsAt: quota.renewsAt,
          },
        },
        {
          status: quota.subscriptionRequired ? 402 : 429,
          headers: { "Retry-After": "3600" },
        },
      );
    }

    // ── One synchronous free-chain call (EVO's interactive pattern),
    // with a single bounded retry when the model misses the JSON shape
    // (the retry stays inside the SAME request so the burst slot is
    // spent once — and neither attempt burns the pool: success-only). ──
    // R3: policy (3000 · 0.4 · json · 20s · engine-default depth 2)
    // resolves from the registry — the call site keeps ONLY the prompt.
    const prompt = buildWorkoutPrompt(req);
    const demoOverrides = {
      systemPrompt:
        "You are a JSON-only workout-plan generator. Your ENTIRE reply is a single JSON object — no prose, no reasoning, no step-by-step planning, no markdown fences, no commentary. Output the JSON immediately.",
    };

    let model = "";
    let plan: WorkoutPlanVerdict = { ok: false, error: "chain call failed" };
    let rawText = "";

    const first = await dispatchAI("workout-demo", prompt, demoOverrides).catch(() => null);
    if (first) {
      model = first.model;
      rawText = first.text;
      plan = parseWorkoutPlanText(first.text, req.days);
    }
    if (!plan.ok) {
      // Retry #1 — same request, harder nudge. Still uncounted.
      const second = await dispatchAI(
        "workout-demo",
        prompt +
          '\n\nREMINDER: reply with ONE JSON object exactly like {"days":[{"name":"Day 1","focus":"...","exercises":[{"name":"...","sets":4,"reps":8}]}]} — nothing else.',
        demoOverrides,
      ).catch(() => null);
      if (second) {
        model = second.model;
        rawText = second.text;
        plan = parseWorkoutPlanText(second.text, req.days);
      }
    }
    if (!plan.ok) {
      // Model drift is a retry-able client-visible outcome, not a crash
      // — and NOT a counted generation (success-only law).
      console.error(
        "[api/ai/workout-plan-demo] shape rejection:",
        plan.error,
        "| model:",
        model,
        "| raw:",
        rawText.slice(0, 500),
      );
      return NextResponse.json(
        {
          error:
            req.language === "ar"
              ? "خرج التوليد عن الشكل المطلوب — جرّب مرة أخرى (الزرر فوق). لا يُخصم من رصيدك إلا التوليد الناجح."
              : "The generated plan missed the required shape — try again (button above). Only successful generations are deducted from your quota.",
          detail: plan.error,
          quota: { used: quota.used, limit: quota.limit, remaining: quota.remaining },
        },
        { status: 422 },
      );
    }

    // ── SUCCESS: burn exactly one pool unit (never on failure). ──
    await recordUnifiedPlanUsage({
      userId,
      guestKey: userId ? null : guestKey,
      ipKey: userId ? null : ipKey,
      kind: "workout",
      surface: "planner",
    });

    // ── MEMBER AUTO-SAVE (spec: plans always saved to the account). ──
    // I-4: the title rides the response so the page can offer its
    // editable rename field pre-filled with the auto name.
    let saved: { planId: string; title: string } | null = null;
    if (userId && isSupabaseAdminConfigured && supabaseAdmin) {
      const title =
        req.language === "ar"
          ? `خطة تمرين AI — ${req.days} أيام`
          : `AI Workout Plan — ${req.days} days`;
      const { data: planRow, error: insertErr } = await supabaseAdmin
        .from("plans")
        .insert({
          client_id: userId,
          type: "workout",
          title,
          notes: null,
          file_url: null,
          content: {
            source: "ai-planner",
            inputs: {
              goal: req.goal,
              level: req.level,
              days: req.days,
              equipment: req.equipment,
              notes: req.notes ?? null,
              language: req.language,
            },
            // Store the RAW validated plan (pre-enrichment): enrichment
            // is a render-time concern (library versions evolve; the
            // saved copy stays the honest generated output).
            plan: plan.value,
          } as unknown as Json,
          status: "approved",
          is_current: true,
          approved_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (insertErr) {
        // The generation SUCCEEDED and is returned; the account save is
        // best-effort here (logged) — the page keeps a localStorage copy
        // either way. Never fail the whole request over the mirror.
        console.error("[api/ai/workout-plan-demo] member auto-save failed:", insertErr.message);
      } else {
        saved = { planId: planRow.id, title };
      }
    }

    // ── §12.35 enrichment (owner directive «استخدم مكتبة التمارين بالصور
    // الخاصة بنا فى النتائج»): every validated exercise is matched against
    // the site's own 868-exercise library — matched rows render the
    // library's real images and link into its pages; unmatched rows stay
    // plain (never a fabricated match). Server-only: the 1.6MB array
    // never reaches the browser. ──
    return NextResponse.json({
      plan: enrichWorkoutPlanWithLibrary(plan.value, req.equipment),
      model,
      quota: {
        used: quota.used + 1,
        limit: quota.limit,
        remaining: Math.max(0, quota.remaining - 1),
        unlimited: quota.unlimited,
        tier: quota.tier,
      },
      saved,
      persisted: Boolean(userId),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/ai/workout-plan-demo] POST error:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
