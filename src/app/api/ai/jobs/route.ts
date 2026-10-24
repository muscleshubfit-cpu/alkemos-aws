import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireCoach, authRequired } from "@/lib/auth-server";
import { checkSwapQuota, checkUnifiedPlanQuota } from "@/lib/tier-limits";
import {
  isAiJobType,
  JOB_GATE,
  JOB_ETA_MINUTES,
  MAX_PAYLOAD_BYTES,
  enqueueAiJob,
  JobPayloadError,
} from "@/lib/ai-jobs";
import { dispatchAiJobsRunner } from "@/lib/ai-runner-dispatch";
import { dispatchBlogPipeline, usableCoachTopic } from "@/lib/blog-pipeline-dispatch";
import { aiJobEnqueueBodySchema } from "@/lib/validation/schemas";

/**
 * AI Jobs API — enqueue + poll.
 *
 * OWNER DIRECTIVE (2026-08-27): ALL batch AI work goes through the
 * `ai_jobs` queue and executes natively in GitHub Actions
 * (process-ai-jobs.yml). This route NEVER calls an AI model — it only
 * validates, gates, writes the queue row (service-role), and serves
 * job status back to the UI.
 *
 * POST /api/ai/jobs        body: { type, payload }
 *   Gates per type:
 *     plan_* / article_tool / article_generate / social_post → coach only
 *     meal_regenerate / exercise_regenerate → logged-in user AND the same
 *       weekly tier limits as the old swap system (C16), recorded at enqueue.
 * GET  /api/ai/jobs?id=<uuid>   → own single job (status/result)
 * GET  /api/ai/jobs?limit=10    → own recent jobs (queue visibility)
 *
 * EVENT-DRIVEN DISPATCH (§8, 2026-08-28): GitHub de-registered repo-wide
 * scheduled workflows (the every-10-min worker had ONE run ever) — so after a
 * successful enqueue this route PUSH-triggers the runner via the GitHub
 * API (fail-open; requires GITHUB_DISPATCH_TOKEN on the deployment).
 * The response carries runnerDispatched so clients/logs can warn when
 * only the backstop layers (daily Vercel cron / scheduler) remain.
 *
 * SECURITY: every row carries requested_by = verified session id; RLS lets
 * users SELECT only their own rows; there are NO browser write policies.
 *
 * Wave 2B (2026-09-17): the POST body passes the central zod envelope
 * gate (aiJobEnqueueBodySchema — type is a bounded string, payload stays
 * unknown, unknown keys stripped). Every gate failure re-derives the
 * legacy «Unknown job type» 400 verbatim (legacy coerced non-string
 * types through String() and they died on the same check anyway). The
 * isAiJobType allowlist, the 40KB envelope cap (413) and the
 * sanitizeJobPayload policy inside enqueueAiJob stay this route's.
 */
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // ── Auth: jobs require a logged-in identity when Supabase is wired. ──
    let userId: string | undefined;
    let authTier: string | undefined;
    let authRole: string | undefined;
    if (authRequired) {
      const auth = await requireUser(request);
      if (auth instanceof Response) return auth;
      userId = auth.id;
      authTier = auth.membership_tier;
      authRole = auth.role;
    }

    const body = await request.json().catch(() => null);

    // Wave 2B zod envelope gate — the legacy «Unknown job type» 400 is
    // re-derived verbatim on every gate failure (non-object bodies and
    // non-string types all died on the same check in legacy).
    const parsedJob = aiJobEnqueueBodySchema.safeParse(body);
    if (!parsedJob.success) {
      return NextResponse.json({ error: "Unknown job type" }, { status: 400 });
    }
    const type = parsedJob.data.type;
    // The gate keeps payload shape-open (z.unknown — scalar payloads
    // behaved identically in legacy through the `any` body); this cast
    // only restores the enqueue signature, it changes no runtime step:
    // the REAL payload policy is sanitizeJobPayload inside enqueueAiJob.
    const payload = parsedJob.data.payload as Record<string, unknown> | undefined;

    if (!isAiJobType(type)) {
      return NextResponse.json({ error: "Unknown job type" }, { status: 400 });
    }

    // Payload envelope cap — plan payloads carry questionnaires inline,
    // everything else is smaller; 40 KB rejects abuse without breaking UX.
    const size = JSON.stringify(payload ?? {}).length;
    if (size > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 },
      );
    }

    // ── Per-type gating BEFORE any write. ──────────────────────────────
    const gate = JOB_GATE[type];
    if (gate === "coach") {
      if (authRequired) {
        const coachAuth = await requireCoach(request);
        if (coachAuth instanceof Response) return coachAuth;
      }
    } else if (authRole && authRole !== "client") {
      // STAFF QUOTA SEMANTICS (T-4PILLAR + admin role 2026-08-29): staff
      // (coach | admin) crafting client plans use meal/exercise swaps as
      // an EDITING tool, not as client self-service — quota-bypass them.
      // The weekly C16 limit stays exactly as-is for clients (free 0 ·
      // premium 3 · pro 6 · coaching 6 — Phase 183 inherits Pro), and
      // plan-creation is gated by the Phase 183 unified monthly pool
      // (success-only, ai_plan_usage — see the check further below).
    } else {
      // user_swap_meal | user_swap_exercise → enforce C16 weekly tier limit.
      // AI-PLAN-QUALITY 2026-10-24: the gate is CHECK-ONLY here — the paid
      // unit is recorded by the runner when the job lands `done`
      // (success-only law, mirroring the Phase-183 unified plan pool);
      // a permanently FAILED regeneration no longer burns the member's
      // weekly swap quota. The 429 shape and messages are unchanged.
      if (userId) {
        const swapType = gate === "user_swap_meal" ? "meal" : "exercise";
        const limitCheck = await checkSwapQuota(userId, swapType, authTier, Boolean(authRole && authRole !== "client"));
        if (!limitCheck.allowed) {
          const limitText =
            limitCheck.limit === 0
              ? "الاستبدال متاح لعملاء البريميوم وأعلى."
              : `استهلكت ${limitCheck.used}/${limitCheck.limit} استبدال هذا الأسبوع. الرصيد يتصفّر يوم الاثنين.`;
          return NextResponse.json(
            {
              error: `⏰ ${limitText}`,
              rateLimited: true,
              used: limitCheck.used,
              limit: limitCheck.limit,
            },
            { status: 429, headers: { "Retry-After": "3600" } },
          );
        }
      }
    }

    // ── 0034: COACH PER-CLIENT AI QUOTA (SUPERSEDED 2026-09-02 →
    //    2026-09-13) ──────────────────────────────────────────────
    // The old 4 nutrition + 4 workout coach-side cap is GONE, and the
    // 2026-09-02 one-balance law (weekly 1+1/2+2 + monthly 4+4/8+8) was
    // itself superseded by the Phase 183 UNIFIED monthly pool: ONE
    // success-only budget per client identity (nutrition + workout
    // COMBINED: free 2 · premium 4 · pro 8 · coaching 8), fed by coach
    // AND EVO AND planner generations (owner decree 2026-09-13
    // «البوول الموحد»). Editing tools (meal/
    // exercise regenerate — staff-bypassed above) and manual uploads stay
    // UNLIMITED. Admins remain unlimited (staff quota semantics). A coach
    // may also only generate for his OWN clients — ownership verified
    // below.
    if (
      authRequired &&
      (type === "plan_nutrition" || type === "plan_workout") &&
      authRole === "coach"
    ) {
      const clientId = String(payload?.clientId ?? "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
        return NextResponse.json(
          { error: "الخطة محتاج عميل محدد — افتح صفحة العميل ثم ولّد الخطة منه." },
          { status: 400 },
        );
      }
      const { supabaseAdmin, isSupabaseAdminConfigured } = await import(
        "@/lib/supabase/admin"
      );
      if (!isSupabaseAdminConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: "Server not configured" }, { status: 501 });
      }
      // PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 3): SITE COACH
      // (coach_kind='site' — migration 0067's B2C follow-up roster) generates
      // for the members in HIS site_coach_assignments roster; the B2B money
      // gates below (coach_assignments ownership + active coaching
      // subscription + the client's unified pool) never apply to him — his
      // member already paid the SITE, and his jobs do NOT burn the member's
      // pool (runner-side planPoolBillingForRequester skips coach_kind='site').
      const { data: requesterProfile } = await supabaseAdmin
        .from("profiles")
        .select("role, coach_kind")
        .eq("id", userId!)
        .maybeSingle();
      if (String(requesterProfile?.coach_kind ?? "").toLowerCase() === "site") {
        const { data: rostered } = await supabaseAdmin
          .from("site_coach_assignments")
          .select("client_id")
          .eq("client_id", clientId)
          .eq("coach_id", userId!)
          .maybeSingle();
        if (!rostered) {
          return NextResponse.json(
            { error: "هذا العميل مش ضمن أعضاء متابعتك — كل مدرب موقع يولّد لأعضائه هو فقط." },
            { status: 403 },
          );
        }
        // Site-side work: no B2B activation gate, no client-pool burn —
        // skip straight to the enqueue (the runner records nothing).
      } else {
      const { data: owned } = await supabaseAdmin
        .from("coach_assignments")
        .select("client_id")
        .eq("client_id", clientId)
        .eq("coach_id", userId!)
        .maybeSingle();
      if (!owned) {
        return NextResponse.json(
          { error: "هذا العميل ليس من عملائك — كل مدرب يولّد خططًا لعملائه هو فقط." },
          { status: 403 },
        );
      }
      // ── OWNER DECREE (2026-08-30): «المدرب قدر يولد خطط للعميل بدون ما
      // يدفع او يفعل اشتراك العميل» — plan generation REQUIRES an ACTIVE
      // PAID coaching subscription (the $6/$16 wallet activation).
      // Assignment alone is NOT enough. Admins bypass (staff semantics —
      // this whole block only runs for authRole === "coach").
      const nowIso = new Date().toISOString();
      const { data: activeCoaching } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("client_id", clientId)
        .eq("tier", "coaching")
        .eq("status", "active")
        .or(`end_date.is.null,end_date.gt.${nowIso}`)
        .limit(1)
        .maybeSingle();
      if (!activeCoaching) {
        return NextResponse.json(
          {
            error:
              "العميل ده لسه مش مفعّل — فعّل اشتراكه الأول من صفحته (شهر 6$ — ٣ شهور 16$ بتخصم من محفظتك) وبعدها تقدر تولّد له خطط.",
            code: "client_not_activated",
          },
          { status: 402 },
        );
      }
      // ── OWNER DECREE (2026-09-01, carried by the 2026-09-13 unified
      // pool «البوول الموحد»): «توليد الخطط بيتحسب من الرصيد سواء عن
      // طريق المدرب او عن طريق ايفو» — the coach's generation burns
      // the CLIENT's UNIFIED plan balance (ONE pool for nutrition +
      // workout COMBINED: free 2 · premium 4 · pro 8 · coaching 8,
      // success-only via ai_plan_usage — the member's widget and this
      // gate read the same ledger). The old per-kind split and weekly
      // caps are retired (Phase 183).
      // Soft-quota convention: the enqueue check reads SUCCESS rows —
      // a pending-but-unfinished job isn't counted yet, so two quick
      // enqueues can race past by a 1-off (same documented parity as
      // the weekly swaps).
      const clientQuota = await checkUnifiedPlanQuota({ userId: clientId });
      if (!clientQuota.unlimited && !clientQuota.allowed) {
        const message = `رصيد توليد الخطط الموحد للعميل خلص (${clientQuota.used}/${clientQuota.limit} — تغذية وتمارين من نفس الرصيد). التوليد — منك أو من ايفو عند العميل — بيخصم من نفس الرصيد، وبيتصفّر أول الشهر. تقدر تعدّل الخطة الحالية أو ترفع خطة يدوي من غير حدود.`;
        return NextResponse.json(
          {
            error: message,
            code: "client_plan_quota_exhausted",
            rateLimited: true,
            used: clientQuota.used,
            limit: clientQuota.limit,
          },
          { status: 429, headers: { "Retry-After": "86400" } },
        );
      }
      } // end B2B gates (the site-coach branch above skips them)
    }

    // ── Enqueue via service-role (sanitization happens inside). ────────
    let id: string;
    try {
      ({ id } = await enqueueAiJob({
        type,
        payload: payload ?? {},
        requestedBy: userId ?? null,
      }));
    } catch (e) {
      // Required-field violations are client errors, not server faults.
      // (article_generate no longer requires a topic — empty = smart pick.)
      if (e instanceof JobPayloadError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }

    // ── COACH PIPELINE PARITY (Phase 162, owner directive 2026-09-10
    // «مطلوب مسار الكوتش للتوليد يكون نفس مسار التوليد الالى دون تعطيل
    // للتوليد الالى»): article_generate DISPATCHES the exact workflow the
    // automatic daily generation uses (blog-post-{lang}.yml — research →
    // outline → content → images → review → PUBLISH + pairing handshake).
    // The ai_jobs row becomes the coach's RECEIPT (done + pipelineDispatched
    // result); the pipeline's own queue (blog_generation_queue) tracks the
    // real work. The automatic cron schedule is untouched — a dispatch only
    // queues another run of the same workflow. FAIL-OPEN: dispatch failure
    // falls through to the legacy path below (runner + single-shot draft
    // generator), so generation never silently dies. Tone/audience/keywords
    // stay in the payload for the fallback generator; the pipeline inherits
    // its own (stronger) quality contract. ──
    if (type === "article_generate") {
      const lang = payload?.language === "en" ? "en" : "ar";
      const pipelineDispatched = await dispatchBlogPipeline({
        lang,
        topic: String(payload?.topic ?? ""),
        jobId: id,
      });
      if (pipelineDispatched) {
        const { supabaseAdmin, isSupabaseAdminConfigured } = await import(
          "@/lib/supabase/admin"
        );
        if (isSupabaseAdminConfigured && supabaseAdmin) {
          await supabaseAdmin
            .from("ai_jobs")
            .update({
              status: "done",
              result: {
                pipelineDispatched: true,
                language: lang,
                topic: usableCoachTopic(payload?.topic) ?? "",
                workflow: lang === "en" ? "blog-post-en.yml" : "blog-post-ar.yml",
              },
              error_message: null,
              finished_at: new Date().toISOString(),
            })
            .eq("id", id);
        }
        return NextResponse.json({
          jobId: id,
          pipelineDispatched: true,
          etaMinutes: 45,
          message:
            "المقال دخل نفس خط التوليد الآلي (بحث ← محتوى ← صور ← مراجعة ← نشر) — هينشر في المدونة تلقائيًا خلال ~30-60 دقيقة، والنسخة باللغة التانية هتتولد وترتبط به في نافذتها.",
        });
      }
    }

    // ── Push-trigger the GHA runner (§8 EVENT-DRIVEN DISPATCH LAW). ────
    // The */10 GitHub scheduler is de-registered repo-wide (Phase 18) —
    // without this push a plan job waits for the daily Vercel catch-up.
    const runnerDispatched = await dispatchAiJobsRunner();

    return NextResponse.json({
      jobId: id,
      etaMinutes: runnerDispatched ? 3 : JOB_ETA_MINUTES,
      runnerDispatched,
      message: `تم إرسال الطلب — النتيجة تظهر خلال ~${runnerDispatched ? 3 : JOB_ETA_MINUTES} دقائق.`,
    });
  } catch (e) {
    // Phase 216 (P2-6 — deep-audit confirmed-16, owner §7-approved
    // 2026-09-16): raw internal error text never reaches the client —
    // the server log keeps the detail, the client gets a generic message.
    console.error("[api/ai/jobs] POST error:", e);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again in a moment." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!authRequired) {
      // Demo mode without DB has no queue to poll anyway.
      return NextResponse.json({ error: "Not configured" }, { status: 501 });
    }
    const auth = await requireUser(request);
    if (auth instanceof Response) return auth;
    const userId = auth.id;

    const { supabaseAdmin, isSupabaseAdminConfigured } = await import(
      "@/lib/supabase/admin"
    );
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: "Not configured" }, { status: 501 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return NextResponse.json({ error: "Bad id" }, { status: 400 });
      }
      const { data } = await supabaseAdmin
        .from("ai_jobs")
        .select("id, job_type, status, result, error_message, created_at, finished_at")
        .eq("id", id)
        .eq("requested_by", userId) // hard ownership filter on top of RLS
        .maybeSingle();
      if (!data?.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit")) || 10));
    // T-4PILLAR-COMPLETE: `payload` rides along so the coach recovery card
    // can resolve which client a finished plan_nutrition/plan_workout job
    // belongs to (plans rows carry no job_id). Rows are hard-filtered to
    // requested_by = caller, and plan payloads only ever contain data the
    // coach themselves enqueued — no cross-user exposure.
    const { data } = await supabaseAdmin
      .from("ai_jobs")
      .select("id, job_type, status, error_message, created_at, finished_at, payload")
      .eq("requested_by", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({ jobs: data ?? [] });
  } catch (e) {
    // Phase 216 (P2-6 — deep-audit confirmed-16, owner §7-approved
    // 2026-09-16): same law as the POST handler — generic client message,
    // full detail stays in the server log.
    console.error("[api/ai/jobs] GET error:", e);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again in a moment." },
      { status: 500 },
    );
  }
}
