import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
  updateRecipeQueueItem,
  countPublishedPairsOnDay,
  consecutiveRecipeFailureDays,
  markRecipeQueueFailed,
  recipesPublishEnabled,
} from "@/lib/recipes-queue";

export const maxDuration = 60;

/**
 * RECIPES PIPELINE · R6 — the atomic publish (plan §6.2 / §3.7).
 *
 * ONE transaction via publish_recipe_pair(): the RPC re-checks the
 * pair (exactly two versions), the verification battery, and the image
 * — then publishes BOTH versions together or throws. «ممنوع نشر نسخة
 * منفردة» is enforced IN THE DATABASE, not by pipeline discipline.
 *
 * Layers around it (plan §11-2): the kill-switch env, the circuit
 * breaker, the daily-quota layer check, and the ISR flush. A failed
 * transaction leaves the recipe `verified` but UNPUBLISHED — nothing
 * partial ever reaches the site.
 *
 * GET /api/cron/recipes/r6-publish?queueId=<uuid>
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const queueId = getRecipeQueueIdParam(request);
  if (!queueId) return NextResponse.json({ error: "Missing queueId query parameter" }, { status: 400 });

  try {
    const { data: qi, error: fetchErr } = await fetchRecipeQueueItem(queueId);
    if (fetchErr) throw new Error(fetchErr);
    if (!qi) {
      return NextResponse.json({ ok: false, queueId, skipped: true, reason: "queue_item_not_found" }, { status: 404 });
    }
    if (qi.status === "published") {
      return NextResponse.json({ ok: true, step: "r6", queueId: qi.id, idempotent: true });
    }
    if (qi.status !== "gates_passed") {
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }
    if (!qi.recipe_id) throw new Error("queue row carries no recipe_id — rerun r1-structure");

    // Layer 0 — the kill switch (default TRUE; owner-only off switch).
    if (!recipesPublishEnabled()) {
      return NextResponse.json({ ok: true, step: "r6", queueId, skipped: true, reason: "publish_disabled" });
    }

    // Layer 1 — the circuit breaker (3 consecutive failed days).
    const streak = await consecutiveRecipeFailureDays();
    if (streak >= 3) {
      return NextResponse.json({ ok: true, step: "r6", queueId, skipped: true, reason: "circuit_breaker_tripped", streak });
    }

    // Layer 2 — the daily quota (a published pair today = honest skip).
    const today = new Date().toISOString().slice(0, 10);
    const publishedToday = await countPublishedPairsOnDay(today);
    if (publishedToday !== null && publishedToday > 0) {
      return NextResponse.json({ ok: true, step: "r6", queueId, skipped: true, reason: "already_published_today" });
    }

    // Layer 3 — the structural guard: the unique partial index
    // recipes_one_per_day_uidx (scheduled_for) backs this same check
    // INSIDE the transaction.

    // THE atomic publish — both versions together or nothing.
    const { error: rpcErr } = await supabaseAdmin.rpc("publish_recipe_pair", {
      p_recipe_id: qi.recipe_id,
    });
    if (rpcErr) {
      // The recipe stays `verified` + unpublished — never a single half.
      const qErr = await updateRecipeQueueItem(queueId, {
        status: "held",
        error_message: `R6: publish_recipe_pair failed — ${rpcErr.message}`.slice(0, 2000),
        rerun_target: null,
      });
      void qErr;
      return NextResponse.json(
        { ok: false, queueId, held: true, error: rpcErr.message },
        { status: 500 },
      );
    }

    // ISR flush — the fresh pair is live on the next request.
    try {
      const { revalidateRecipeCaches } = await import("@/lib/recipes-server");
      await revalidateRecipeCaches();
    } catch {
      /* the hourly TTL still applies — non-fatal */
    }

    const now = new Date().toISOString();
    const qErr = await updateRecipeQueueItem(queueId, {
      status: "published",
      published_at: now,
      error_message: null,
      rerun_target: null,
    });
    if (qErr) throw new Error(qErr);

    return NextResponse.json({ ok: true, step: "r6", queueId, recipeId: qi.recipe_id, publishedAt: now });
  } catch (err) {
    console.error("[recipes/r6] failed:", err);
    await markRecipeQueueFailed(queueId, `R6: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
