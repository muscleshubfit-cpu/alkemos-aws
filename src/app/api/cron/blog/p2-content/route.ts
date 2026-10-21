import { NextRequest, NextResponse } from "next/server";
import { generateFullArticle, countWords } from "@/lib/blog-pipeline";
import type { LanguageResearch } from "@/lib/blog-research";
import type { OutlinePlan } from "@/lib/blog-pipeline";
import {
  getQueueIdParam,
  fetchQueueItem,
  requireRowLang,
  updateQueueItem,
  markQueueItemFailed,
  type QueueItem,
} from "@/lib/blog-queue";
import { verifyCronAuth } from "@/lib/cron-auth";
import { cronBlogQueueQuerySchema } from "@/lib/validation/schemas";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const maxDuration = 300;

/**
 * PIPELINE V3 · PHASE 2 — Full content generation (1500–2500 words),
 * ONE language per row (from its own outline + FAQ set). Canonical
 * executor is the native GitHub Actions runner (no 60s cap); the route
 * keeps maxDuration 300 for direct manual pings.
 *
 * R1 REPAIR CONTRACT (Execution-Path Audit §8.2 A4, 2026-09-29):
 * `?force=1` skips ONLY the resume fast-exit below, letting P2
 * REGENERATE content over an existing draft on the SAME queue row
 * (bundle.content replaced; research0/outline/images preserved).
 * It is set exclusively by run-step.sh's repair loop (P2_FORCE_REGENERATE
 * → run-step.mts → URL) after a P5 word-floor failure — the status gate
 * above still applies (only 'outlined'/'failed' rows regenerate), so
 * force can never walk over a healthy in-flight row.
 *
 * V3 STATUS CHAIN (language-split): outlined → writing → written
 * (legacy en/ar-pair statuses never occur on new rows).
 *
 * GET /api/cron/blog/p2-content?queueId=<uuid>[&force=1]
 */
export async function GET(request: NextRequest) {
  // M6 (audit 2026-09-07): constant-time CRON_SECRET check.
  if (!verifyCronAuth(request))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseAdminConfigured)
    return NextResponse.json({ error: "Supabase admin not configured." }, { status: 500 });

  // Wave 3 zod gate — the queueId envelope (auth-first preserved: the
  // CRON_SECRET 401 above stays the real boundary). Missing/empty
  // re-derives the legacy «Missing queueId query parameter» 400
  // verbatim; oversized garbage 400s BEFORE the doomed DB roundtrip.
  const parsedQueueQuery = cronBlogQueueQuerySchema.safeParse({
    queueId: new URL(request.url).searchParams.get("queueId"),
  });
  if (!parsedQueueQuery.success) {
    const rawQueueId = getQueueIdParam(request);
    if (!rawQueueId)
      return NextResponse.json({ error: "Missing queueId query parameter" }, { status: 400 });
    return NextResponse.json(
      { error: parsedQueueQuery.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const queueId = getQueueIdParam(request);
  if (!queueId)
    return NextResponse.json({ error: "Missing queueId query parameter" }, { status: 400 });

  let qi: QueueItem | null = null;

  try {
    const { data, error: fetchErr } = await fetchQueueItem(queueId);
    if (fetchErr) throw new Error(fetchErr);
    if (!data)
      return NextResponse.json({ ok: false, queueId, skipped: true, reason: "queue_item_not_found" }, { status: 404 });
    qi = data;

    const lang = requireRowLang(qi);

    // Idempotent fast-exits for already-advanced rows; wrong_status for
    // anything genuinely out of order.
    // BLOG-RECOVERY-3 (2026-10-21): "writing" is RE-ATTEMPTABLE — a row
    // crashed mid-write (status set before the write, bundle.content may
    // or may not exist) used to dead-end here with 409 forever.
    if (qi.status !== "outlined" && qi.status !== "failed" && qi.status !== "writing") {
      if (["written", "images_done", "reviewed", "published"].includes(qi.status)) {
        return NextResponse.json({ ok: true, step: "p2", queueId: qi.id, lang, idempotent: true });
      }
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }

    let bundle = qi.article_bundle ? JSON.parse(qi.article_bundle) : {};

    // R1 REPAIR CONTRACT (A4): the repair loop's p2 re-run carries
    // force=1 — without it the resume fast-exit below would return the
    // SAME too-short draft that just failed P5's word floor and the
    // repair cycle would be a no-op.
    const force = new URL(request.url).searchParams.get("force") === "1";

    // Resumable after crash mid-write (force=1 = repair regeneration).
    if (bundle.content?.markdown) {
      if (!force) {
        return NextResponse.json({
          ok: true,
          step: "p2",
          queueId: qi.id,
          lang,
          resumed: true,
          words: countWords(bundle.content.markdown),
        });
      }
      console.log(
        `[blog/p2-content] force=1 — regenerating content over the existing draft (R1 repair contract) on row ${qi.id}`,
      );
    }

    const outline: OutlinePlan | undefined = bundle.outline;
    const research: LanguageResearch | undefined = bundle.research0;
    if (!outline || !research) {
      throw new Error("p2: missing outline/research artifacts — rerun p1-outline");
    }

    const upd1 = await updateQueueItem(qi.id, { status: "writing" });
    if (upd1) throw new Error(upd1);

    const article = await generateFullArticle(lang, outline, research);
    bundle = { ...bundle, content: { markdown: article.markdown, words: article.wordCount, source: article.source } };

    const upd2 = await updateQueueItem(qi.id, {
      status: "written",
      article_bundle: JSON.stringify(bundle),
    });
    if (upd2) throw new Error(upd2);

    console.log(`[blog/p2-content] ${lang} done (~${article.wordCount} words)`);

    return NextResponse.json({
      ok: true,
      step: "p2",
      queueId: qi.id,
      lang,
      words: article.wordCount,
      source: article.source,
      ...(force ? { regenerated: true } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[blog/p2-content] Error:", msg);
    if (queueId) await markQueueItemFailed(queueId, `p2: ${msg || "Unknown"}`);
    return NextResponse.json({ error: msg || "Failed" }, { status: 500 });
  }
}
