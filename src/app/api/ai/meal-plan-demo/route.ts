import { NextRequest, NextResponse } from "next/server";
// R3 (AI-Router unification): the demo surfaces ride the central router —
// policy resolves from ai-registry (meal-demo/workout-demo specs).
import { dispatchAI } from "@/lib/ai-router";
import { clientIp, rateLimit } from "@/lib/rate-limit";
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
  buildDemoPrompt,
  parseDemoPlanText,
  validateDemoRequest,
  type DemoPlanVerdict,
} from "@/lib/ai-meal-planner";

/**
 * POST /api/ai/meal-plan-demo — the AI meal-planner generation endpoint
 * (§12.28 → Phase 183, owner decree 2026-09-13 «البوول الموحد» — spec
 * "Alkemos — Membership & Plan Changes").
 *
 * ONE synchronous free-chain generation per request. Gates, in order:
 *
 *   1. INPUT: calories 1200–4000 · one of the 4 site systems · en|ar ·
 *      notes ≤200 chars (validated BEFORE anything else).
 *   2. BURST GUARD: IP-keyed 20 attempts / 24 h — pure abuse
 *      protection, NOT quota (failures don't burn the quota; the old
 *      5/day entry-counted limit — which burned quota on failure — is
 *      retired per the success-only law).
 *   3. UNIFIED MONTHLY QUOTA (ai_plan_usage ledger, migrations 0085+0086
 *      + 0110) — AI-QUOTAS 2026-11-14: generation is SUBSCRIBER-ONLY:
 *      free members and guests get 402 with the subscribe CTA (the
 *      manual planner and every calculator stay free); members get
 *      their tier quota (premium 4 · pro 8 · coaching 8, aggregated
 *      stacking) renewed on the SUBSCRIPTION-CYCLE window. Checked
 *      BEFORE the provider call, counted ONLY on success.
 *   4. SHAPE: the model's JSON is strictly validated (meals/items/
 *      grams/kcal, ±20% calorie closure) — a drifted payload is
 *      rejected with 422, never displayed, and NEVER counted.
 *
 * MEMBER AUTO-SAVE (spec: «المسجل يحفظ الخطط دائمًا في حسابه ويسترجعها
 * من أجهزته الأخرى»): every successful generation for a signed-in user
 * is inserted into the `plans` table (source 'ai-planner') — the same
 * rows /plans and cross-device retrieval already read. Guests keep
 * their plan on-device via localStorage (plan-persistence.ts).
 */
export const maxDuration = 60;

/** IP burst guard — abuse protection only, deliberately generous. */
const BURST_GUARD = { max: 20, windowMs: 24 * 60 * 60 * 1000 } as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const verdict = validateDemoRequest({
      calories: body?.calories,
      system: body?.system,
      language: body?.language,
      notes: body?.notes,
    });
    if (!verdict.ok) {
      return NextResponse.json({ error: verdict.error }, { status: 400 });
    }
    const req = verdict.value;

    // ── Burst guard (IP, abuse-only — failures don't burn the pool). ──
    const ip = clientIp(request);
    const rl = await rateLimit(`meal-demo:${ip}`, BURST_GUARD.max, BURST_GUARD.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            req.language === "ar"
              ? "عدد كبير من المحاولات من هذا الجهاز اليوم — عد غدًا أو افتح المخطط اليدوي الآن."
              : "Too many attempts from this device today — come back tomorrow, or open the manual planner now.",
          rateLimited: true,
          resetAt: rl.resetAt,
        },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    // ── Unified-quota gate (AI-QUOTAS 2026-11-14). ──
    // SUBSCRIBER-ONLY generation: free members and guests → 402 with the
    // subscribe CTA (sign up + subscribe — the manual planner stays free).
    // Subscribers over their monthly quota → 429 with the cycle renewal date.
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
      // 2026-11-14: the ONLY blocked-with-quota-0 case is a free member or
      // a guest — one honest subscribe CTA everywhere (no wall: signup +
      // the manual planner stay open).
      const renewsOn = quota.renewsAt ? new Date(quota.renewsAt).toLocaleDateString(req.language === "ar" ? "ar-EG" : "en-US") : "";
      return NextResponse.json(
        {
          error:
            quota.subscriptionRequired
              ? req.language === "ar"
                ? "توليد الخطط بالذكاء الاصطناعي متاح لمشتركي بريميوم وأعلى — الحاسبات والمخطط اليدوي يظلان مجانيين بالكامل. اشترك لتوليد خطط التغذية والتمارين بحصة شهرية تتجدد مع دورة الاشتراك."
                : "AI plan generation is available to Premium subscribers and above — the calculators and the manual planner stay completely free. Subscribe to generate nutrition & workout plans with a monthly quota that renews with your subscription cycle."
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
    // (free-tier models drift; the retry stays inside the SAME request
    // so the visitor's burst slot is spent once — and neither attempt
    // burns the pool: success-only). ──
    // R3 (AI-Router unification): policy (3000 tokens · 0.4 · json · 20s
    // two-attempt budget · engine-default depth 2) resolves from the
    // registry — the call site keeps ONLY the system prompt.
    const prompt = buildDemoPrompt(req);
    const demoOverrides = {
      systemPrompt:
        "You are a JSON-only meal-plan generator. Your ENTIRE reply is a single JSON object — no prose, no reasoning, no step-by-step calculation, no markdown fences, no commentary. Output the JSON immediately.",
    };

    let model = "";
    let plan: DemoPlanVerdict = { ok: false, error: "chain call failed" };
    let rawText = "";

    const first = await dispatchAI("meal-demo", prompt, demoOverrides).catch(() => null);
    if (first) {
      model = first.model;
      rawText = first.text;
      plan = parseDemoPlanText(first.text, req.calories);
    }
    if (!plan.ok) {
      // Retry #1 — same request, harder nudge. Still uncounted.
      const second = await dispatchAI(
        "meal-demo",
        prompt +
          '\n\nREMINDER: reply with ONE JSON object exactly like {"meals":[{"name":"…","items":[{"food":"…","grams":120,"kcal":180}]}]} — nothing else.',
        demoOverrides,
      ).catch(() => null);
      if (second) {
        model = second.model;
        rawText = second.text;
        plan = parseDemoPlanText(second.text, req.calories);
      }
    }
    if (!plan.ok) {
      // Model drift is a retry-able client-visible outcome, not a crash
      // — and NOT a counted generation (success-only law).
      console.error(
        "[api/ai/meal-plan-demo] shape rejection:",
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
      kind: "nutrition",
      surface: "planner",
    });

    // ── MEMBER AUTO-SAVE (spec: plans always saved to the account). ──
    // I-4: the title rides the response so the page can offer its
    // editable rename field pre-filled with the auto name.
    let saved: { planId: string; title: string } | null = null;
    if (userId && isSupabaseAdminConfigured && supabaseAdmin) {
      const title =
        req.language === "ar"
          ? `خطة تغذية AI — ${req.calories} سعرة`
          : `AI Meal Plan — ${req.calories} kcal`;
      const { data: planRow, error: insertErr } = await supabaseAdmin
        .from("plans")
        .insert({
          client_id: userId,
          type: "meal",
          title,
          notes: null,
          file_url: null,
          content: {
            source: "ai-planner",
            inputs: {
              calories: req.calories,
              system: req.system,
              notes: req.notes ?? null,
              language: req.language,
            },
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
        console.error("[api/ai/meal-plan-demo] member auto-save failed:", insertErr.message);
      } else {
        saved = { planId: planRow.id, title };
      }
    }

    return NextResponse.json({
      plan: plan.value,
      model,
      quota: {
        used: quota.used + 1,
        limit: quota.limit,
        remaining: Math.max(0, quota.remaining - 1),
        unlimited: quota.unlimited,
        tier: quota.tier,
      },
      saved,
      persisted: Boolean(userId), // members: account-saved; guests: localStorage (client-side)
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/ai/meal-plan-demo] POST error:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
