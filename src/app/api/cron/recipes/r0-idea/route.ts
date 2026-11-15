import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  generateRecipeIdea,
  ideaPassesGuards,
  type RecipeIdea,
} from "@/lib/recipes-pipeline";
import {
  findResumableRecipeRow, reapStaleRecipeRows,
  countPublishedPairsOnDay,
  consecutiveRecipeFailureDays,
} from "@/lib/recipes-queue";

export const maxDuration = 60;

/**
 * RECIPES PIPELINE · R0 — the daily idea (HEALTHY-RECIPES-PLATFORM plan
 * §6.2). One queue row per day carrying the sealed idea (the sharedBrief
 * equivalent: themeAr/En + cuisine + goal + mealType + brief).
 *
 * Protocols (the blog P0 RESUME/ADOPT/JOIN/CREATE law, adapted):
 *   RESUME  — an open row (≤36h, mid-pipeline) is THE row of the day.
 *   GUARD   — a pair already PUBLISHED today → honest skip (daily law).
 *   BREAKER — 3 consecutive failed days → held-only mode + admin
 *             notification (plan §6.3-8 «إيقاف النشر عند خلل متكرر»).
 *   CREATE  — fresh idea through the Q-GATE-4/5 guards, ≤2 fallback
 *             attempts, then the row insert.
 *
 * GET /api/cron/recipes/r0-idea
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }
  const admin = supabaseAdmin;

  const today = new Date().toISOString().slice(0, 10);

  try {
    // REC-11 (audit P1): reap the stale open rows FIRST — rows older than
    // the 36h resume window are closed honestly + their masters released,
    // so openRows never grows monotonically and the day-index frees up.
    await reapStaleRecipeRows();

    // RESUME — the open row of the day wins.
    const resumable = await findResumableRecipeRow();
    if (resumable) {
      return NextResponse.json({ ok: true, step: "r0", queueId: resumable.id, resumed: true });
    }

    // GUARD — one published pair per day (layer 2 of the daily law).
    const publishedToday = await countPublishedPairsOnDay(today);
    if (publishedToday !== null && publishedToday > 0) {
      return NextResponse.json({
        ok: true,
        step: "r0",
        skipped: true,
        reason: "already_published_today",
        publishedToday,
      });
    }

    // BREAKER — 3 consecutive failed days trip the circuit.
    const failureStreak = await consecutiveRecipeFailureDays();
    if (failureStreak >= 3) {
      await notifyBreakerTripped(failureStreak, admin);
      return NextResponse.json({
        ok: true,
        step: "r0",
        skipped: true,
        reason: "circuit_breaker_tripped",
        failureStreak,
      });
    }

    // CREATE — the idea, guarded, with a deterministic fallback ladder.
    let idea: RecipeIdea | null = null;
    let source = "";
    let guardReason: string | null = null;
    for (let attempt = 0; attempt < 3 && !idea; attempt++) {
      const generated = await generateRecipeIdea();
      const guard = await ideaPassesGuards(generated.idea);
      if (guard === null) {
        idea = generated.idea;
        source = generated.source;
      } else {
        guardReason = guard;
        console.warn(`[recipes/r0] attempt ${attempt + 1} rejected: ${guard}`);
      }
    }
    if (!idea) {
      // Honest hold — no idea passed the guards (never a forced publish).
      // REC-7 (audit AI-GENERATION-PIPELINES 2026-11-15, P1 bucket 7):
      // the hold used to answer a body WITHOUT rerunTarget, so the runner
      // exited 1 (plain failure) and the wrapper's blind ×3 retry inserted
      // a NEW held row per attempt (~6 wasted minutes + duplicate rows).
      // Now: (a) the body carries rerunTarget:"r0-idea" → run-step.mts
      // exits 3 → the repair loop executes the directive (a FRESH r0 row)
      // instead of blind-retrying the same guards; (b) the insert is
      // IDEMPOTENT for the day — an existing held-r0 row for today is
      // reused, never duplicated.
      const { data: existingHeld } = await admin
        .from("recipe_generation_queue")
        .select("id")
        .eq("status", "held")
        .eq("rerun_target", "r0-idea")
        .eq("scheduled_for", today)
        .limit(1)
        .maybeSingle();
      let heldId = (existingHeld as { id?: string } | null)?.id ?? null;
      if (!heldId) {
        const { data: inserted, error: insertErr } = await admin
          .from("recipe_generation_queue")
          .insert({
            status: "held",
            idea: JSON.stringify({ guardReason: guardReason ?? "idea_guards_failed" }),
            error_message: `R0: no idea passed the duplication/intent guards — ${guardReason ?? "unknown"}`,
            rerun_target: "r0-idea",
            scheduled_for: today,
          })
          .select("id")
          .single();
        if (insertErr || !inserted) throw new Error(insertErr?.message ?? "queue insert failed");
        heldId = (inserted as { id: string }).id;
      } else {
        console.log(`[recipes/r0] REC-7 idempotent hold: reusing held row ${String(heldId).slice(0, 8)} for ${today}`);
      }
      return NextResponse.json({
        ok: false,
        queueId: heldId,
        held: true,
        reason: guardReason,
        rerunTarget: "r0-idea",
      });
    }

    const { data: inserted, error: insertErr } = await admin
      .from("recipe_generation_queue")
      .insert({
        status: "idea",
        idea: JSON.stringify({ ...idea, source }),
        scheduled_for: today,
      })
      .select("id")
      .single();
    if (insertErr || !inserted) throw new Error(insertErr?.message ?? "queue insert failed");

    return NextResponse.json({ ok: true, step: "r0", queueId: (inserted as { id: string }).id, source });
  } catch (err) {
    console.error("[recipes/r0] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

/** Breaker notification — the admin_notifications system (plan §6.3-8). */
async function notifyBreakerTripped(streak: number, admin: NonNullable<typeof supabaseAdmin>): Promise<void> {
  try {
    await admin.from("admin_notifications").insert({
      type: "recipes_circuit_breaker",
      title: "توقف نشر الوصفات اليومي ⚠️",
      body: `قاطع الدارة: ${streak} أيام فشل متتالية في خط إنتاج الوصفات — النشر اليومي موقوف حتى الفحص. راجع لوحة /admin/recipes.`,
      link: "/admin/recipes",
      target_role: "admin",
      payload: { streak, component: "recipes-pipeline" },
      read: false,
    });
  } catch {
    /* never let the notification crash the pipeline */
  }
}
