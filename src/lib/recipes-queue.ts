/**
 * RECIPES-QUEUE — the production queue lifecycle helpers
 * (HEALTHY-RECIPES-PLATFORM plan §3.5/§6.3 — the blog-queue pattern
 * adapted to the atomic-pair pipeline).
 *
 * All writes go through the service-role client (the queue is internal
 * state: no public RLS policies exist on the table by design).
 *
 * Status chain: idea → structured → nutrition_verified → authored →
 * imaged → gates_passed → published (+ held | failed). A held recipe
 * keeps its rerun_target so the admin dashboard can requeue it.
 */

import type { NextRequest } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export type RecipeQueueStatus =
  | "idea"
  | "structured"
  | "nutrition_verified"
  | "authored"
  | "imaged"
  | "gates_passed"
  | "published"
  | "held"
  | "failed";

export type RecipeQueueItem = {
  id: string;
  recipe_id: string | null;
  status: string;
  idea: Record<string, unknown>;
  bundle: Record<string, unknown>;
  error_message: string | null;
  rerun_target: string | null;
  repair_cycles: number;
  scheduled_for: string;
  created_at: string;
  published_at: string | null;
};

/** jsonb payloads cross the wire as serialized JSON (the blog-queue
 *  article_bundle precedent — Json-typed columns accept strings). */
export type RecipeQueueUpdate = {
  status?: string;
  idea?: string;
  bundle?: string;
  error_message?: string | null;
  rerun_target?: string | null;
  repair_cycles?: number;
  recipe_id?: string | null;
  published_at?: string | null;
};

export function getRecipeQueueIdParam(request: NextRequest): string | null {
  const v = new URL(request.url).searchParams.get("queueId");
  return v && v.trim() ? v.trim() : null;
}

/** Parse a jsonb cell that may come back as a JSON string or an object.
 *
 * THE JSONB-WIRE LAW (the first-live-run lesson, 2026-11-10): a value
 * written as `JSON.stringify(x)` reaches a jsonb column as a JSON STRING
 * (a string-valued jsonb document), NOT the object — reading it back
 * gives text, and `cell.calories` / `Array.isArray(cell)` silently produce
 * undefined/[] (the all-zeros + 0-steps N-GATE hold class). Writers must
 * send plain OBJECTS to jsonb columns; this reader stays tolerant of both
 * shapes so pre-fix rows and any future drift degrade safely. */
export function parseJsonCell(v: unknown): Record<string, unknown> {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export async function fetchRecipeQueueItem(
  queueId: string,
): Promise<{ data: RecipeQueueItem | null; error: string | null }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { data: null, error: "admin client not configured" };
  const { data, error } = await supabaseAdmin
    .from("recipe_generation_queue")
    .select("*")
    .eq("id", queueId)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  const row = data as Record<string, unknown>;
  return {
    data: {
      ...(row as unknown as RecipeQueueItem),
      idea: parseJsonCell(row.idea),
      bundle: parseJsonCell(row.bundle),
    },
    error: null,
  };
}

export async function updateRecipeQueueItem(
  queueId: string,
  updates: RecipeQueueUpdate,
): Promise<string | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return "admin client not configured";
  const { error } = await supabaseAdmin.from("recipe_generation_queue").update(updates).eq("id", queueId);
  return error ? error.message : null;
}

/** Honest failure: status='failed' + the reason (≤2000 chars). Never throws. */
export async function markRecipeQueueFailed(queueId: string, errorMessage: string): Promise<void> {
  try {
    await updateRecipeQueueItem(queueId, {
      status: "failed",
      error_message: errorMessage.slice(0, 2000),
    });
  } catch {
    /* never let the bookkeeping crash the pipeline */
  }
}

/** Held with a rerun target (the R5 gate verdict — «حجز» not «فشل»
 *  while repair budget remains). */
export async function markRecipeQueueHeld(
  queueId: string,
  reason: string,
  rerunTarget: string | null,
): Promise<void> {
  try {
    await updateRecipeQueueItem(queueId, {
      status: "held",
      error_message: reason.slice(0, 2000),
      ...(rerunTarget ? { rerun_target: rerunTarget } : {}),
    });
  } catch {
    /* never throws */
  }
}

/** RC4 (forensics 2026-11-12): an R5 hold whose rerun target is r0-idea
 *  ABANDONS this attempt — demote the recipes master out of the live set
 *  ('in_production') so the partial unique index recipes_one_per_day_uidx
 *  RELEASES the scheduled day for the same-day retry (the run-step.sh
 *  fresh-r0 repair chain / the dispatch-pipelines backstop). 'failed'
 *  keeps the row as the honest failure record and its pair_slug stays
 *  burned (the global recipes_pair_slug_uidx anti-dup law is untouched —
 *  the R0 guard corpus now sees it). Non-r0 targets keep the master
 *  in_production: those attempts are still repairable in place. */
export async function abandonRecipeAttemptMaster(recipeId: string): Promise<void> {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
    const { error } = await supabaseAdmin
      .from("recipes")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", recipeId);
    if (error) console.warn(`[recipes-queue] abandon master failed: ${error.message}`);
  } catch {
    /* never let bookkeeping crash the pipeline */
  }
}

/** Find today's (or the newest ≤36h) resumable row — the RESUME protocol. */
export async function findResumableRecipeRow(): Promise<RecipeQueueItem | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const cutoff = Date.now() - 36 * 3600 * 1000;
  const { data, error } = await supabaseAdmin
    .from("recipe_generation_queue")
    .select("*")
    .in("status", ["idea", "structured", "nutrition_verified", "authored", "imaged", "gates_passed"])
    .gte("created_at", new Date(cutoff).toISOString())
    .order("created_at", { ascending: false })
    .limit(5);
  if (error || !data || data.length === 0) return null;
  return data[0] as RecipeQueueItem;
}

/** How many pairs were PUBLISHED on a given UTC day (the layer-2 daily guard). */
export async function countPublishedPairsOnDay(dateISO: string): Promise<number | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { count, error } = await supabaseAdmin
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", `${dateISO}T00:00:00.000Z`)
    .lte("published_at", `${dateISO}T23:59:59.999Z`);
  if (error) return null;
  return count ?? 0;
}

/**
 * Circuit breaker input (plan §6.3-8): how many of the last N scheduled
 * days ended in failure? 3 consecutive failed days → the breaker trips.
 */
export async function consecutiveRecipeFailureDays(windowDays = 7): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("recipe_generation_queue")
    .select("scheduled_for, status")
    .gte("scheduled_for", since)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data || data.length === 0) return 0;

  // one verdict per scheduled day (any success that day = the day is fine)
  const byDay = new Map<string, boolean>();
  for (const row of data as Array<{ scheduled_for: string; status: string }>) {
    const ok = row.status === "published";
    const prev = byDay.get(row.scheduled_for);
    byDay.set(row.scheduled_for, (prev ?? false) || ok);
  }
  const days = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const [day, ok] of days) {
    if (day >= today) continue; // today not yet judged
    if (!ok) streak++;
    else break;
  }
  return streak;
}

/** Admin action: requeue a held/failed row back to its rerun target stage. */
export async function requeueRecipeRow(queueId: string): Promise<{ ok: boolean; error: string | null }> {
  const { data: qi, error } = await fetchRecipeQueueItem(queueId);
  if (error || !qi) return { ok: false, error: error ?? "queue_item_not_found" };
  const target = qi.rerun_target ?? "r1-structure";
  const statusMap: Record<string, RecipeQueueStatus> = {
    "r0-idea": "idea",
    "r1-structure": "structured",
    "r2-nutrition": "nutrition_verified",
    "r3-authoring": "authored",
    "r4-image": "imaged",
  };
  // Requeue to the stage BEFORE the target (the target stage re-runs).
  const order: Array<keyof typeof statusMap> = ["r0-idea", "r1-structure", "r2-nutrition", "r3-authoring", "r4-image"];
  const idx = order.indexOf(target as (typeof order)[number]);
  const back = idx > 0 ? order[idx - 1] : order[0];
  const status = statusMap[back] ?? "idea";
  const err = await updateRecipeQueueItem(queueId, {
    status,
    error_message: null,
    repair_cycles: 0,
  });
  return { ok: !err, error: err };
}

/**
 * RUNNER repair reset (the run-step.sh repair chain — the in-run sibling
 * of requeueRecipeRow above): set the row back to the status the TARGET
 * stage accepts, clear the failure bookkeeping, and INCREMENT
 * repair_cycles (the honest cumulative counter — the admin requeue
 * resets it to 0 for a fresh manual cycle, the in-run chain must not).
 *
 * r0-idea targets answer { reset: false }: R0 cannot be re-run against a
 * row (its RESUME protocol only picks up open rows, never held ones), so
 * the wrapper re-runs R0 WITHOUT a queueId — a FRESH row is created and
 * the held row stays behind as the honest failure record.
 *
 * Callers that want R1's missing-refs feedback preserved (the failing
 * step IS r1-structure) skip this reset entirely and re-run R1 on the
 * held row directly — the route accepts "held" and reads its own
 * error_message as the one-shot repair directive.
 */
export async function resetRecipeRowForRepair(
  queueId: string,
): Promise<{ ok: boolean; reset: boolean; error: string | null }> {
  const { data: qi, error } = await fetchRecipeQueueItem(queueId);
  if (error || !qi) return { ok: false, reset: false, error: error ?? "queue_item_not_found" };
  const target = qi.rerun_target;
  if (!target || target === "r0-idea") return { ok: true, reset: false, error: null };
  const before: Record<string, RecipeQueueStatus> = {
    "r1-structure": "idea",
    "r2-nutrition": "structured",
    "r3-authoring": "nutrition_verified",
    "r4-image": "authored",
  };
  const status = before[target];
  if (!status) return { ok: false, reset: false, error: `unknown rerun_target: ${target}` };
  const err = await updateRecipeQueueItem(queueId, {
    status,
    error_message: null,
    rerun_target: null,
    repair_cycles: (qi.repair_cycles ?? 0) + 1,
  });
  return { ok: !err, reset: !err, error: err };
}

/** The publish kill-switch (plan §6.3 — env-gated, default TRUE). */
export function recipesPublishEnabled(): boolean {
  return process.env.RECIPES_PUBLISH_ENABLED !== "false";
}
