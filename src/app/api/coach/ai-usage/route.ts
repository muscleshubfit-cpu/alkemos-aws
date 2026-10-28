import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { monthStartUtc, checkUnifiedPlanQuota } from "@/lib/tier-limits";

/**
 * COACH AI QUOTA READOUT — GET /api/coach/ai-usage?clientId=<uuid>
 *
 * Phase 183 (owner decree 2026-09-13 «البوول الموحد») + owner order
 * 2026-10-28 «تجميع حصص الاشتراكات المدفوعة»:
 * the CLIENT's plan balance is the ONLY quota — ONE unified monthly
 * pool (nutrition + workout COMBINED) sized as the AGGREGATE of every
 * distinct effectively-active paid tier (free 2 · premium 4 · pro 8 ·
 * coaching 8; premium+pro = 12), success-only via ai_plan_usage
 * (migration 0085), fed by BOTH the coach's generate button and the
 * member's EVO chat / planner pages. `used` mirrors /api/ai/quota
 * exactly. `coachOwn` still reports this coach's own done
 * generations for the month, informational only.
 *
 * Coach counting source = ai_jobs rows (requested_by = this coach, done,
 * payload->>'clientId' = this client) — failed generations never burn
 * anything. Admins are UNLIMITED (staff semantics).
 * Enforced identically in /api/ai/jobs (coach) and /api/ai/chat (member),
 * displayed identically in the member's EVO widget (/api/ai/quota).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function countCompleted(
  coachId: string,
  jobType: "plan_nutrition" | "plan_workout",
  clientId: string,
): Promise<number> {
  const { count, error } = await supabaseAdmin!
    .from("ai_jobs")
    .select("*", { count: "exact", head: true })
    .eq("requested_by", coachId)
    .eq("job_type", jobType)
    .eq("status", "done")
    .eq("payload->>clientId", clientId)
    // Informational readout — THIS calendar month's completed generations
    // by this coach (resets on the 1st, UTC).
    .gte("created_at", monthStartUtc());
  if (error) {
    console.error("[api/coach/ai-usage] count error:", error.message);
    return 0; // fail open — same soft-quota convention as tier-limits
  }
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (auth.role !== "coach" && auth.role !== "admin") {
    return NextResponse.json(
      { error: "forbidden", message: "هذه الصفحة للمدربين فقط" },
      { status: 403 },
    );
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 501 });
  }

  const clientId = new URL(request.url).searchParams.get("clientId") ?? "";
  if (!UUID_RE.test(clientId)) {
    return NextResponse.json(
      { error: "bad_request", message: "عميل غير صحيح" },
      { status: 400 },
    );
  }

  // Coaches read usage only for their OWN clients; admins pass.
  if (auth.role === "coach") {
    const { data: owned } = await supabaseAdmin
      .from("coach_assignments")
      .select("client_id")
      .eq("client_id", clientId)
      .eq("coach_id", auth.id)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json(
        { error: "not_your_client", message: "هذا العميل ليس من عملائك" },
        { status: 403 },
      );
    }
  }

  const unlimited = auth.role === "admin";
  const [nutrition, workout, clientPool] = await Promise.all([
    countCompleted(auth.id, "plan_nutrition", clientId),
    countCompleted(auth.id, "plan_workout", clientId),
    checkUnifiedPlanQuota({ userId: clientId }),
  ]);

  return NextResponse.json({
    unlimited,
    // Informational — this coach's own done generations this month.
    coachOwn: {
      nutrition: { used: nutrition },
      workout: { used: workout },
    },
    // Phase 183 (2026-09-13 «البوول الموحد»): the CLIENT's unified
    // plan balance — ONE pool for nutrition + workout COMBINED,
    // success-only. `used` mirrors /api/ai/quota exactly. The per-kind
    // keys below are deprecated mirrors (one release) — read `pool`.
    clientBalance: {
      tier: clientPool.tier,
      pool: {
        used: clientPool.used,
        limit: clientPool.limit,
        remaining: clientPool.remaining,
        unlimited: clientPool.unlimited,
      },
      nutrition: {
        used: clientPool.used,
        limit: clientPool.limit,
        unlimited: clientPool.unlimited,
        weeklyUsed: 0,
        weeklyLimit: null,
      },
      workout: {
        used: clientPool.used,
        limit: clientPool.limit,
        unlimited: clientPool.unlimited,
        weeklyUsed: 0,
        weeklyLimit: null,
      },
    },
  });
}
