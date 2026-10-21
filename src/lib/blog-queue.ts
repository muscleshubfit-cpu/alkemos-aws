/**
 * Queue helpers for the blog generation pipeline.
 *
 * PIPELINE V3 (2026-08-27 lang split): one queue row == ONE article in
 * ONE language (`language` column: 'en' | 'ar'). Each step processes a
 * single queue item identified by its UUID; the queueId is threaded from
 * P0 (which inserts the row and returns its id) through every subsequent
 * step via `?queueId=<uuid>`.
 *
 * PHASE 157 (SEO-GEO-5.0, owner «نفذ توصيتك»): the daily topic is ONE,
 * but it produces TWO rows (en + ar) sharing a `pair_id` + a sealed
 * `sharedBrief` — each language still executes its FULL P1→P5 pipeline
 * by itself in its own window (AR 05:00 UTC · EN 22:00 UTC). Rows without
 * pair_id are legacy/degraded independent runs and remain fully valid.
 *
 * This file centralizes:
 *   1. Reading the queueId + lang query params.
 *   2. Fetching the queue row by id (NOT by status).
 *   3. Resolving a row's pipeline language defensively.
 *   4. Validating the queue row is in the EXPECTED status.
 *   5. Performing UPDATEs with explicit error checking
 *      (see MH-QUEUE-HANDOFF-007 root cause).
 *   6. PHASE 157 pairing lookups: findAdoptablePairRow (my-language
 *      researched twin row, ≤48h) + findRecentPairRows (both sides of a
 *      pair_id for the JOIN path and the P5 handshake). Both DEGRADE to
 *      null/[] on any error — including migration 0076 not applied — so
 *      the pipeline falls back to the exact legacy V3 behavior.
 */

import type { NextRequest } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export type PipelineLang = "en" | "ar";

export type QueueItem = {
  id: string;
  topic: string;
  focus_keyword: string;
  // LEGACY dual-language columns — kept so old published rows render in
  // admin tooling, but V3 single-language rows leave them null until P1
  // of an 'ar' row mirrors its values in for reporting convenience.
  topic_ar?: string | null;
  focus_keyword_ar?: string | null;
  // LANGUAGE SPLIT (2026-08-27): mandatory since migration 0026 applied.
  language?: string | null;
  category: string;
  status: string;
  article_bundle: string | null;
  error_message: string | null;
  en_post_id: string | null;
  ar_post_id: string | null;
  /** Phase 157: twin row link (0076) — null = legacy independent run. */
  pair_id?: string | null;
  created_at: string;
};

/**
 * Read the `queueId` query parameter from the request URL.
 *
 * Returns null if the parameter is missing or empty.
 */
export function getQueueIdParam(request: NextRequest): string | null {
  const url = new URL(request.url);
  const qid = url.searchParams.get("queueId");
  if (!qid || qid.trim().length === 0) return null;
  return qid.trim();
}

/**
 * Read + validate the `lang` query parameter ('en' | 'ar').
 *
 * P0 REQUIRES it (the language IS the run's identity). Later steps may
 * pass it too for logging symmetry, but they always derive truth from
 * the ROW (rowLang below), never from the URL — the URL only sets up
 * the row once, at P0 time.
 */
export function getLangParam(request: NextRequest): PipelineLang | null {
  const url = new URL(request.url);
  const raw = url.searchParams.get("lang");
  return raw === "en" || raw === "ar" ? raw : null;
}

/**
 * Defensive row-language resolution. Migration 0026 backfills every
 * legacy row, so a NULL here means the migration was not applied yet —
 * callers surface an actionable error instead of silently generating
 * the wrong language.
 */
export function rowLang(qi: Pick<QueueItem, "language">): PipelineLang {
  return qi.language === "ar" ? "ar" : qi.language === "en" ? "en" : (null as unknown as PipelineLang);
}

export function isLangColumnMissing(lang: PipelineLang | null): boolean {
  return lang !== "en" && lang !== "ar";
}

/**
 * Fetch a queue item by id. Returns null if the row doesn't exist
 * (e.g. queueId was malformed, or Step 1's INSERT silently failed).
 *
 * Throws an Error if Supabase returns an error (network / RLS / etc).
 */
export async function fetchQueueItem(
  queueId: string,
): Promise<{ data: QueueItem | null; error: string | null }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return { data: null, error: "Supabase admin not configured." };
  }
  const { data, error } = await supabaseAdmin
    .from("blog_generation_queue")
    .select("*")
    .eq("id", queueId)
    .maybeSingle();
  if (error) return { data: null, error: `Queue read: ${error.message}` };
  return { data: (data as QueueItem | null) ?? null, error: null };
}

/**
 * Validate the queue item is in the EXPECTED status before processing.
 *
 * Defensive: if a prior step's UPDATE silently failed (e.g. column
 * doesn't exist — see MH-QUEUE-HANDOFF-007), the queue item would
 * still be in the prior step's status. This function catches that
 * case and returns a clear error message identifying the queueId +
 * actual vs expected status.
 *
 * Returns null if the status matches, or a descriptive error string
 * if it doesn't.
 */
export function validateQueueStatus(
  qi: QueueItem,
  expected: string,
): string | null {
  if (qi.status !== expected) {
    return (
      `Queue item ${qi.id} is in status "${qi.status}" but step expects "${expected}". ` +
      `This means a prior step's UPDATE silently failed (or the queueId was wrong). ` +
      `Investigate the prior step.`
    );
  }
  return null;
}

const MISSING_LANG_MSG =
  "Queue row has no `language` value — RUN_ON_SUPABASE_0026_LANG_SPLIT.sql was not applied to this database. Apply it first (AGENTS.md §6 has the link).";

/**
 * Throws when the row predates migration 0026. Centralizing the guard
 * keeps per-route boilerplate to one line while making the failure mode
 * loudly actionable.
 */
export function requireRowLang(qi: QueueItem): PipelineLang {
  const lang = rowLang(qi);
  if (isLangColumnMissing(lang)) throw new Error(MISSING_LANG_MSG);
  return lang;
}

/**
 * Update the queue item's status (and optionally article_bundle +
 * error_message). Returns null on success, or a descriptive error
 * string on failure.
 *
 * IMPORTANT: this function CAPTURES the UPDATE response's error field
 * (the previous code didn't — see MH-QUEUE-HANDOFF-007 root cause).
 * If the UPDATE fails (e.g. due to a column not existing in the
 * production schema), this function returns the error message and
 * the caller can throw or return a 500.
 */
export async function updateQueueItem(
  queueId: string,
  updates: { status: string; article_bundle?: string; error_message?: string; en_post_id?: string; ar_post_id?: string; topic?: string; topic_ar?: string; focus_keyword?: string; focus_keyword_ar?: string },
): Promise<string | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return "Supabase admin not configured.";
  }
  const { error } = await supabaseAdmin
    .from("blog_generation_queue")
    .update(updates)
    .eq("id", queueId);
  if (error) return `Queue update ${queueId}: ${error.message}`;
  return null;
}

/**
 * Mark a queue item as failed with a descriptive error message.
 * Best-effort — never throws (used in catch blocks).
 */
export async function markQueueItemFailed(
  queueId: string,
  errorMessage: string,
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  try {
    await supabaseAdmin
      .from("blog_generation_queue")
      .update({
        status: "failed",
        error_message: errorMessage.slice(0, 2000), // cap to avoid DB column overflow
      })
      .eq("id", queueId);
  } catch {
    // Best-effort — the queue item stays in its current status if this fails.
  }
}

// ═══════════════════════════════════════════════════════════════
// R5 REPAIR OBSERVABILITY (Execution-Path Audit §10 Phase R5,
// 2026-09-30 — owner order «نفّذ R5 فقط»): the R1 loop recovers
// rows in-run, but NOTHING recorded that a published row had ever
// been repaired — «repair-first vs regenerate» was unmeasurable.
// P5 now stamps a `repairLoop` marker into the row's bundle at the
// exact moment it issues a repair directive (the same bundle-stamp
// precedent as researchSource:"fallback" / coachRequested). The
// marker SURVIVES the repair chain (P2-force writes
// `{...bundle, content}` and P4 writes `{...bundle, review}`), so a
// row that publishes afterwards carries the proof — and
// /api/ai/queue-health counts it. Pure observability: no gate,
// status, or repair-budget behavior changes anywhere.
// ═══════════════════════════════════════════════════════════════

/** Shape of the `repairLoop` bundle stamp (one row, cumulative). */
export type RepairLoopStamp = {
  /** How many repair directives P5 has issued for this row so far. */
  directives: number;
  /** The rerunTarget of the most recent directive. */
  lastTarget: string;
  /** ISO timestamp of the most recent directive. */
  lastAt: string;
};

/**
 * Pure: read the `repairLoop` stamp from a bundle JSON string.
 * Defensive against every bundle shape (raw string / null / garbage /
 * partial stamp) — returns null when there is no valid stamp, so
 * callers never mistake a malformed marker for a repaired row.
 */
export function parseBundleRepairLoop(bundleJson: string | null): RepairLoopStamp | null {
  if (!bundleJson) return null;
  try {
    const parsed = JSON.parse(bundleJson) as { repairLoop?: unknown } | null;
    if (parsed === null || typeof parsed !== "object") return null;
    const st = (parsed as { repairLoop?: unknown }).repairLoop;
    if (st === null || typeof st !== "object") return null;
    const o = st as { directives?: unknown; lastTarget?: unknown; lastAt?: unknown };
    if (
      typeof o.directives !== "number" ||
      !Number.isFinite(o.directives) ||
      o.directives < 1
    ) {
      return null;
    }
    return {
      directives: Math.floor(o.directives),
      lastTarget: typeof o.lastTarget === "string" ? o.lastTarget : "",
      lastAt: typeof o.lastAt === "string" ? o.lastAt : "",
    };
  } catch {
    return null; // unparseable bundle → no valid stamp
  }
}

/**
 * Stamp (or increment) the `repairLoop` marker on a queue row's
 * bundle — best-effort, NEVER throws (called from P5's catch block
 * where the honest markFailed already ran). `knownBundle` lets the
 * P5 caller pass the bundle it already fetched; when omitted the
 * helper reads the row itself, and if the row cannot be read it
 * writes NOTHING (a blind write could wipe a real bundle).
 */
export async function stampQueueRowRepairDirective(
  queueId: string,
  target: string,
  knownBundle?: string | null,
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  try {
    let existing: string | null = knownBundle ?? null;
    if (knownBundle === undefined) {
      const { data, error } = await supabaseAdmin
        .from("blog_generation_queue")
        .select("article_bundle")
        .eq("id", queueId)
        .maybeSingle();
      if (error || !data) {
        // Row unreadable/missing — do not write (see docblock).
        console.warn(
          `[blog-queue] stampQueueRowRepairDirective skipped: ${
            error ? error.message : "row not found"
          }`,
        );
        return;
      }
      existing = (data as { article_bundle?: string | null }).article_bundle ?? null;
    }
    const base: Record<string, unknown> = {};
    if (existing) {
      try {
        Object.assign(base, JSON.parse(existing) as Record<string, unknown>);
      } catch {
        /* unparseable bundle → start fresh, marker still stamps */
      }
    }
    const prev = parseBundleRepairLoop(existing);
    base.repairLoop = {
      directives: (prev?.directives ?? 0) + 1,
      lastTarget: target,
      lastAt: new Date().toISOString(),
    };
    await supabaseAdmin
      .from("blog_generation_queue")
      .update({ article_bundle: JSON.stringify(base) })
      .eq("id", queueId);
  } catch (e) {
    console.warn(
      `[blog-queue] stampQueueRowRepairDirective degraded: ${e instanceof Error ? e.message : e}`,
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 171 (blog-audit proposal ج) — ONE-AUTOMATIC-ARTICLE/DAY LAW,
// enforced at the PUBLISH layer. The marker `coachRequested` is stamped
// into article_bundle by P0 when the run was coach-triggered (topic or
// job_id present); it survives P1–P4 (every step spreads the bundle).
// Coach rows are EXEMPT from the daily quota (Phase 162 owner override);
// automated rows must refuse to publish when today's automated article
// already landed (the double-publish race's last line of defense).
// ═══════════════════════════════════════════════════════════════

/**
 * Pure: does this queue row's bundle mark it as coach-requested?
 * Defensive against every bundle shape (raw string / null / garbage).
 */
export function bundleMarksCoachRequest(bundleJson: string | null): boolean {
  if (!bundleJson) return false;
  try {
    const parsed = JSON.parse(bundleJson) as { coachRequested?: unknown } | null;
    return parsed !== null && typeof parsed === "object"
      && (parsed as { coachRequested?: unknown }).coachRequested === true;
  } catch {
    return false;
  }
}

/**
 * Stamp `coachRequested: true` onto a queue row's bundle (best-effort,
 * never throws). Used by P0 when an ADOPTED/JOINED row is consumed by a
 * coach-triggered run — the row then bypasses the P5 daily quota.
 */
export async function markQueueRowCoachRequested(queueId: string): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  try {
    const { data } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("article_bundle")
      .eq("id", queueId)
      .maybeSingle();
    const existing = (data as { article_bundle?: string | null } | null)?.article_bundle ?? null;
    const base: Record<string, unknown> = {};
    if (existing) {
      try {
        Object.assign(base, JSON.parse(existing) as Record<string, unknown>);
      } catch {
        /* unparseable bundle → start fresh, marker still stamps */
      }
    }
    base.coachRequested = true;
    await supabaseAdmin
      .from("blog_generation_queue")
      .update({ article_bundle: JSON.stringify(base) })
      .eq("id", queueId);
  } catch (e) {
    console.warn(
      `[blog-queue] markQueueRowCoachRequested degraded: ${e instanceof Error ? e.message : e}`,
    );
  }
}

/**
 * How many AUTOMATIC (non-coach) queue rows for this language were
 * created today (UTC) and reached status "published" — i.e. today's
 * automated daily quota already consumed. Attribution is by the row's
 * CREATION day (the run's day), NOT the publish timestamp: a late-night
 * top-up run that publishes just after midnight still counts against
 * the day it was dispatched for, so the next day's slot stays clean.
 * Returns null when the DB is unavailable (caller degrades open).
 */
export async function countAutomatedPublishedToday(
  lang: "en" | "ar",
  now: Date = new Date(),
): Promise<number | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();
    const { data, error } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("article_bundle")
      .eq("language", lang)
      .eq("status", "published")
      .gte("created_at", dayStart)
      .limit(50);
    if (error) {
      console.warn(`[blog-queue] countAutomatedPublishedToday degraded: ${error.message}`);
      return null;
    }
    const rows = (data as Array<{ article_bundle: string | null }> | null) ?? [];
    return rows.filter((r) => !bundleMarksCoachRequest(r.article_bundle)).length;
  } catch (e) {
    console.warn(
      `[blog-queue] countAutomatedPublishedToday degraded: ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// PHASE 157 — pairing lookups (degrade to legacy on ANY failure)
// ═══════════════════════════════════════════════════════════════

/**
 * RESUME path (BLOG-RECOVERY-3, owner order 2026-10-21 «استكمال دون
 * فقدان العمل»): the newest MY-language row within 48h that sits in a
 * mid-pipeline state — researched/outlined/writing/written/images_done/
 * reviewed — or was honestly marked failed AFTER some stages completed
 * (markQueueItemFailed keeps the row's bundle with every completed
 * artifact). NEVER returns a published row. The P0 route returns this
 * row's id instead of creating a new one; the per-stage idempotency and
 * artifact gates then skip completed work and re-run only from the first
 * incomplete stage — a stuck P5 (e.g. a quality-gate rejection) costs a
 * pure-code re-evaluation, not a full regeneration. Any error → null
 * (the route degrades to the legacy ADOPT/JOIN/CREATE walk).
 */
export async function findResumableRow(
  lang: "en" | "ar",
): Promise<QueueItem | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const since = new Date(Date.now() - 48 * 3_600_000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("*")
      .eq("language", lang)
      .in("status", [
        "researched",
        "outlined",
        "writing",
        "written",
        "images_done",
        "reviewed",
        "failed",
      ])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      console.warn(
        `[blog-queue] findResumableRow degraded: ${error.message}`,
      );
      return null;
    }
    return (data as QueueItem[] | null)?.[0] ?? null;
  } catch (e) {
    console.warn(
      `[blog-queue] findResumableRow degraded: ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

/**
 * ADOPT path: the newest MY-language `researched` row that carries a
 * pair_id (its twin's window created it for me). Returns null when no
 * candidate exists OR on any error — including migration 0076 not yet
 * applied (PostgREST rejects the unknown column) — in which case the
 * route degrades to the exact legacy V3 single-row behavior.
 *
 * The caller validates freshness + the sealed brief via
 * isAdoptablePairRow/extractSharedBrief (pure, unit-tested).
 */
export async function findAdoptablePairRow(
  lang: "en" | "ar",
): Promise<QueueItem | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("*")
      .eq("language", lang)
      .eq("status", "researched")
      .not("pair_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) {
      console.warn(
        `[blog-queue] findAdoptablePairRow degraded: ${error.message} (0076 applied?)`,
      );
      return null;
    }
    return (data as QueueItem[] | null)?.[0] ?? null;
  } catch (e) {
    console.warn(
      `[blog-queue] findAdoptablePairRow degraded: ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

/**
 * Both rows of a pair (P5 handshake + JOIN context). Never throws:
 * any error → [] (the handshake is best-effort and the publish must
 * never fail because of it). Includes MY row — callers filter.
 */
export async function findRecentPairRows(
  pairId: string,
): Promise<QueueItem[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("*")
      .eq("pair_id", pairId)
      .order("created_at", { ascending: true })
      .limit(4);
    if (error) {
      console.warn(
        `[blog-queue] findRecentPairRows degraded: ${error.message} (0076 applied?)`,
      );
      return [];
    }
    return (data as QueueItem[] | null) ?? [];
  } catch (e) {
    console.warn(
      `[blog-queue] findRecentPairRows degraded: ${e instanceof Error ? e.message : e}`,
    );
    return [];
  }
}
