import { NextRequest, NextResponse } from "next/server";
import { buildOutline, pickTopicIndex, type OutlinePlan } from "@/lib/blog-pipeline";
import type { LanguageResearch } from "@/lib/blog-research";
import {
  getQueueIdParam,
  fetchQueueItem,
  validateQueueStatus,
  requireRowLang,
  updateQueueItem,
  markQueueItemFailed,
  type QueueItem,
} from "@/lib/blog-queue";
import { extractSharedBrief } from "@/lib/blog-pairing";
import { verifyCronAuth } from "@/lib/cron-auth";
import { cronBlogQueueQuerySchema } from "@/lib/validation/schemas";
import { getRecentPostsByLanguage, isDuplicateTopic } from "@/lib/blog-topics";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const maxDuration = 60;

/**
 * PIPELINE V3 · PHASE 1 — Topic choice + detailed outline (ONE language).
 * The row's `language` column decides everything. Picks ONE of the 5
 * researched topics (model-ranked + hard duplicate guard against THIS
 * language's recent posts) then builds: SEO title, subtitle, meta
 * description, slug base, 5-7 H2 outline, LSI keywords and a 3-5 image
 * plan. Bundle stays FLAT: { research0, outline }.
 *
 * PHASE 157: when the row carries a valid sealed sharedBrief (bilingual
 * daily pair), the topic + article angle are ALREADY AGREED — the brief
 * wins verbatim (both twins build around the same subject/angle, each in
 * its own language, written from scratch). The dup-guard is skipped for
 * briefed rows: the pairing candidates were already dup-filtered at P0.
 * Legacy/unpaired rows behave EXACTLY as before.
 *
 * GET /api/cron/blog/p1-outline?queueId=<uuid>
 */
async function guardDuplicate(
  lang: "en" | "ar",
  candidates: string[],
): Promise<string> {
  const idx = await pickTopicIndex(lang, candidates);
  let topic = candidates[idx] ?? candidates[0];
  try {
    const recent = await getRecentPostsByLanguage(lang, 100);
    if (recent.some((p) => isDuplicateTopic(topic, topic, [p]).duplicate)) {
      topic =
        candidates.find(
          (t) => !recent.some((p) => isDuplicateTopic(t, t, [p]).duplicate),
        ) ?? topic;
    }
  } catch {
    /* dup-guard is best-effort */
  }
  return topic;
}

function pickKeyword(r: LanguageResearch, topic: string): string {
  // BLOG-RECOVERY-3 (2026-10-21, live run 39580182779): the exact-SUBSTRING
  // match never fires for Arabic compounds (topic and keyword share WORDS,
  // not substrings) and fell through to keywords[0] — measured: a calories
  // article carrying the PROTEIN keyword, which fed the FAQ relevance
  // filter the wrong axis and dropped on-topic FAQs until repairs. Word-
  // overlap scoring picks the keyword that actually targets the topic
  // (≥2 shared meaningful words, stopwords removed, diacritics stripped).
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const stop = new Set([
    "في", "من", "على", "عن", "مع", "أو", "او", "و", "ثم", "كيف", "ما", "متى",
    "هل", "لماذا", "أين", "اليومي", "يوميا", "افضل", "أفضل",
    "the", "a", "an", "of", "to", "for", "in", "on", "at", "with", "and",
    "or", "how", "what", "best", "why", "when", "vs",
  ]);
  const topicWords = new Set(
    norm(topic).split(/\s+/).filter((w) => w.length > 1 && !stop.has(w)),
  );
  let best = "";
  let bestScore = 0;
  for (const k of r.keywords) {
    const kwWords = norm(k.keyword)
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stop.has(w));
    const score = kwWords.filter((w) => topicWords.has(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = k.keyword;
    }
  }
  if (bestScore >= 2) return best;
  // legacy exact-substring fallback, then keywords[0]
  const lower = topic.toLowerCase();
  const hit = r.keywords.find(
    (k) =>
      lower.includes(k.keyword.toLowerCase()) ||
      k.keyword.toLowerCase().includes(lower),
  );
  return hit?.keyword || r.keywords[0]?.keyword || topic.slice(0, 60);
}

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

    const statusErr = validateQueueStatus(qi, "researched");
    if (statusErr) {
      // BLOG-RECOVERY-3 (2026-10-21): the RESUME walk re-enters the
      // pipeline at P1 whatever the stuck row's mid-status — a row that
      // already outlined (or advanced further: written/images_done/
      // reviewed/published, or crashed mid-write at "writing") has its
      // outline DONE; re-outlining would discard the topic/outline/draft
      // alignment and burn the generation quota for nothing. (P2 already
      // carries this fast-exit shape for its own advanced statuses.)
      if (
        ["outlined", "writing", "written", "images_done", "reviewed", "published"].includes(
          qi.status,
        )
      )
        return NextResponse.json({ ok: true, step: "p1", queueId: qi.id, lang, idempotent: true });
      if (qi.status !== "failed")
        return NextResponse.json(
          { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
          { status: 409 },
        );
      // BLOG-RECOVERY-3 (2026-10-21): artifact-preserving resume — a row
      // that failed in a LATER stage keeps its valid outline; re-outlining
      // would discard the topic/outline/draft alignment and burn the
      // generation quota for nothing. Only a row with NO outline artifact
      // re-runs P1 (the failure was AT P1).
      const failedBundle = qi.article_bundle ? (JSON.parse(qi.article_bundle) as Record<string, unknown>) : {};
      if (failedBundle.outline) {
        console.warn(`[blog/p1-outline] RESUME: failed row ${qi.id} carries a valid outline — skipping (the failure was in a later stage)`);
        return NextResponse.json({ ok: true, step: "p1", queueId: qi.id, lang, resumed: true });
      }
      console.warn(`[blog/p1-outline] Re-processing previously failed item ${qi.id}`);
    }

    // FLAT artifact — V3 rows carry exactly ONE language's research.
    const bundle = qi.article_bundle ? JSON.parse(qi.article_bundle) : {};
    const r0 = bundle.research0 as LanguageResearch | undefined;
    if (!r0?.topics?.length) {
      throw new Error("research0 artifact missing on queue item — rerun p0-research");
    }

    // PHASE 157: a valid sealed brief pre-decides topic + angle (pair law).
    const brief = extractSharedBrief(bundle);
    const topic = brief
      ? (lang === "ar" ? brief.topicAr : brief.topicEn)
      : await guardDuplicate(lang, r0.topics);
    const outlineResult = await buildOutline(lang, topic, r0, {
      forcedAngle: brief?.angleId,
    });

    const updatedBundle = JSON.stringify({
      ...bundle,
      outline: outlineResult.outline,
    });

    const updateErr = await updateQueueItem(qi.id, {
      topic,
      // Reporting convenience for AR rows only — EN pipeline leaves the
      // legacy columns untouched.
      ...(lang === "ar" ? { topic_ar: topic } : {}),
      focus_keyword: pickKeyword(r0, topic),
      ...(lang === "ar" ? { focus_keyword_ar: pickKeyword(r0, topic) } : {}),
      status: "outlined",
      article_bundle: updatedBundle,
    });
    if (updateErr) throw new Error(updateErr);

    const o: OutlinePlan = outlineResult.outline;
    return NextResponse.json({
      ok: true,
      step: "p1",
      queueId: qi.id,
      lang,
      title: o.title,
      sections: o.sections.length,
      lsi: o.lsiKeywords.length,
      imagePlan: o.imagePlan.length,
      source: outlineResult.source,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[blog/p1-outline] Error:", msg);
    if (queueId) await markQueueItemFailed(queueId, `p1: ${msg || "Unknown"}`);
    return NextResponse.json({ error: msg || "Failed" }, { status: 500 });
  }
}
