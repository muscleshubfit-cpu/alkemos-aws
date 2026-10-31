import { NextRequest, NextResponse } from "next/server";
import { runBilingualResearchPair, runPhase0Research, researchUsedFallback } from "@/lib/blog-research";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getLangParam, findAdoptablePairRow, findRecentPairRows, findResumableRow, findResumePairCandidate, attachPairToQueueRow, markQueueRowCoachRequested, type PipelineLang, type QueueItem } from "@/lib/blog-queue";
import {
  extractSharedBrief,
  isAdoptablePairRow,
  runPairingSelection,
  runResumePairingSelection,
  withCoachTopic,
  JOIN_MAX_AGE_HOURS,
  type SharedBrief,
} from "@/lib/blog-pairing";
import type { LanguageResearch } from "@/lib/blog-research";
import { verifyCronAuth } from "@/lib/cron-auth";
import { randomUUID } from "crypto";
import { cronBlogP0QuerySchema } from "@/lib/validation/schemas";

export const maxDuration = 60;

/**
 * PIPELINE V3 · PHASE 0 — Research + daily-pair protocol (Phase 157).
 *
 * PHASE 157 (owner «نفذ توصيتك» = Proposal 1): ONE daily topic → TWO
 * queue rows (en + ar) sharing pair_id + a sealed sharedBrief. Each
 * language still runs its FULL P1→P5 pipeline BY ITSELF in its own
 * geography-anchored window (AR 05:00 UTC · EN 22:00 UTC — Phase 119
 * tables preserved verbatim). Content is written from scratch per
 * language (topic + shared angle only — never translation).
 *
 * P0 PROTOCOL (in order), with a FULL degradation ladder:
 *   1. ADOPT (≤48h) — my language already has a researched pair row with
 *      a valid sealed brief (created by the twin's earlier window) →
 *      return it; nothing is inserted.
 *   2. JOIN (≤30h) — the OTHER language's pair row exists but MY side
 *      never materialized (my twin insert failed best-effort) → research
 *      MY language + insert MY row only, reusing the twin's pair_id +
 *      sharedBrief.
 *   3. CREATE — I'm first → research BOTH languages + ONE small pairing
 *      call (topicEn/topicAr/shared angle) → insert TWO rows (twin is
 *      best-effort: if it fails, the twin's own P0 JOIN rescues the pair).
 *   DEGRADE — pairing failure / validation failure / migration 0076 not
 *      applied → EXACT legacy V3 behavior: ONE unpaired row. Blind
 *      pairing is FORBIDDEN (a wrong pair is worse than no pair).
 *   DOUBLE-DISPATCH GUARD — CREATE re-checks ADOPT right before inserting
 *   so two concurrent runs for the same language cannot both insert.
 *
 * GET /api/cron/blog/p0-research?lang=en|ar
 *   → { ok, step:"p0", queueId, lang,
 *       pairMode: "adopted"|"joined"|"created"|"legacy", pairId?, twinInserted? }
 */

type P0BundleResearch = Awaited<ReturnType<typeof runPhase0Research>>["research"];

/** AUDIT_REPORT §9-المرحلة 1, item 3 — the fallback-visibility stamp.
 * Every inserted bundle carries researchSource so a curated-pool run is
 * VISIBLE on the queue row (audit C3: 24% of runs fell back silently).
 * Additive top-level bundle field — legacy rows simply lack it. */
function researchSourceStamp(p0Source: string): "fallback" | "model" {
  return researchUsedFallback(p0Source) ? "fallback" : "model";
}

/** AUDIT_REPORT §9-1.3 — the ALERT half of the fallback law: never fall
 * back silently. This console.error lands in the GHA run log where the
 * daily coverage is reviewed (the audit's «تنبيه عند حدوثه بدل النشر
 * الصامت»); queue-health surfaces the same state for the admin panel. */
function alertIfFallback(p0Source: string, lang: string): void {
  if (researchUsedFallback(p0Source)) {
    console.error(
      `[blog/p0-research] ⚠ RESEARCH FALLBACK (${lang}): the whole model chain failed — topics come from the STATIC curated pool, NOT real search data (source=curated-fallback). The queue row is stamped researchSource=fallback and the admin queue-health panel flags it.`,
    );
  }
}

function bundleWithBrief(
  research: P0BundleResearch,
  brief: SharedBrief | null,
  researchSource: "fallback" | "model" = "model",
): string {
  return JSON.stringify(
    brief
      ? { research0: research, sharedBrief: brief, researchSource }
      : { research0: research, researchSource },
  );
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s; // raw string → extractSharedBrief rejects it
  }
}

function briefOf(qi: Pick<QueueItem, "article_bundle">): SharedBrief | null {
  return extractSharedBrief(
    typeof qi.article_bundle === "string" ? safeParse(qi.article_bundle) : qi.article_bundle,
  );
}

/** PHASE 5-E / stage هـ — parse a queue row's bundle as an object (the
 *  resume-pair input). Returns null for raw/garbage/missing bundles. */
function bundleObjectOf(
  qi: Pick<QueueItem, "article_bundle">,
): Record<string, unknown> | null {
  const parsed =
    typeof qi.article_bundle === "string" ? safeParse(qi.article_bundle) : qi.article_bundle;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
}

/** PHASE 5-E / stage هـ — re-stringify a row's bundle with the sealed
 *  brief merged in (every existing key — research0, researchSource, and
 *  any completed outline/content artifacts — survives untouched; only
 *  the sharedBrief key is added). Returns null on a non-object bundle
 *  (the caller degrades to plain resume). */
function bundleWithBriefMerged(
  qi: Pick<QueueItem, "article_bundle">,
  brief: SharedBrief,
): string | null {
  const parsed = bundleObjectOf(qi);
  if (!parsed) return null;
  return JSON.stringify({ ...parsed, sharedBrief: brief });
}

/** Minimal LanguageResearch for the constrained resume-pairing call —
 *  topics are replaced by the row's own topic inside
 *  runResumePairingSelection anyway; keywords/faqs only pad the prompt. */
function minimalResearch(topic: string): LanguageResearch {
  return { keywords: [], faqs: [], topics: [topic] };
}

/** Coerce a parsed research0 into a LanguageResearch (topics non-empty
 *  required); null when unusable. */
function asResearch(raw: unknown): LanguageResearch | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as { keywords?: unknown; faqs?: unknown; topics?: unknown };
  const topics = Array.isArray(r.topics)
    ? r.topics.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];
  if (topics.length === 0) return null;
  return {
    keywords: Array.isArray(r.keywords) ? (r.keywords as LanguageResearch["keywords"]) : [],
    faqs: Array.isArray(r.faqs) ? (r.faqs as LanguageResearch["faqs"]) : [],
    topics,
  };
}

/**
 * PHASE 5-E / stage هـ (Phase-4 §10-هـ-1 / Phase-1 §8-6(أ) — «جعل مسار
 * الاستئناف يقرن (JOIN عند RESUME)»): the RESUME-PAIR attempt for an
 * UNPAIRED resumable row. Finds the other language's unpaired researched
 * row (≤48h), runs the CONSTRAINED pairing call (each side's candidate
 * set is its OWN row's topic — the anti-blind law holds by construction,
 * the call only picks the shared angle), then attaches pair_id + merged
 * brief to BOTH rows. Returns the pairId or null on ANY failure (the
 * caller degrades to the exact plain-resume behavior — unpaired, honest).
 */
async function tryResumePair(
  resumable: QueueItem,
  lang: PipelineLang,
  otherLang: PipelineLang,
): Promise<string | null> {
  if (resumable.pair_id) return null; // already paired — nothing to do
  if (!resumable.topic || resumable.topic.trim().length < 10) return null;
  try {
    const other = await findResumePairCandidate(otherLang);
    if (!other) return null;

    const myResearch =
      asResearch(bundleObjectOf(resumable)?.research0) ??
      minimalResearch(resumable.topic);
    const otherResearch =
      asResearch(bundleObjectOf(other)?.research0) ??
      minimalResearch(other.topic);

    const brief = await runResumePairingSelection({
      myLang: lang,
      myTopic: resumable.topic,
      myResearch,
      otherTopic: other.topic,
      otherResearch,
    });

    // Safety re-check (the constrained candidates make it structural, but
    // a wrong pair is worse than no pair — assert both topics verbatim).
    const mySide = lang === "ar" ? brief.topicAr : brief.topicEn;
    const otherSide = otherLang === "ar" ? brief.topicAr : brief.topicEn;
    if (mySide.trim() !== resumable.topic.trim() || otherSide.trim() !== other.topic.trim()) {
      console.warn(
        "[blog/p0-research] resume-pair rejected the sealed brief (topic mismatch) — plain resume",
      );
      return null;
    }

    const myBundle = bundleWithBriefMerged(resumable, brief);
    const otherBundle = bundleWithBriefMerged(other, brief);
    if (!myBundle || !otherBundle) return null;

    const myErr = await attachPairToQueueRow(resumable.id, brief.pairId, myBundle);
    if (myErr) {
      console.warn(`[blog/p0-research] resume-pair my-row attach failed: ${myErr}`);
      return null;
    }
    const otherErr = await attachPairToQueueRow(other.id, brief.pairId, otherBundle);
    if (otherErr) {
      // Best-effort twin attach (the CREATE law): MY row keeps the pair —
      // the other language's JOIN rescues its side on its own window.
      console.warn(
        `[blog/p0-research] resume-pair other-row attach failed (JOIN will rescue): ${otherErr}`,
      );
    }

    console.log(
      `[blog/p0-research] RESUME-PAIRED rows ${resumable.id} (${lang}) + ${other.id} (${otherLang}) into pair ${brief.pairId} (angle=${brief.angleId}) — the 0/6 root closed`,
    );
    return brief.pairId;
  } catch (e) {
    console.warn(
      `[blog/p0-research] resume-pair degraded: ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

/** Focus-keyword placeholder from a topic (refined by P1's pickKeyword). */
function topicToKeyword(topic: string): string {
  const k = topic.split(/\s+/).slice(0, 6).join(" ").slice(0, 60);
  return k || topic.slice(0, 60);
}

/**
 * PHASE 162 — optional coach topic override (COACH PIPELINE PARITY).
 * Rides workflow_dispatch inputs → PIPELINE_TOPIC → run-step.sh → here.
 * Only topics long enough to be legally sealed into a shared brief
 * (≥ 10 chars — the blog-pairing MIN_TOPIC_CHARS law) are honored; a
 * shorter/absent topic keeps the EXACT automatic behavior (research
 * picks the title). Adopted/JOINED pairs ignore the override by design:
 * their briefs are already sealed by an earlier window.
 */
function getTopicParam(request: NextRequest): string | null {
  const url = new URL(request.url);
  const t = (url.searchParams.get("topic") || "").trim().slice(0, 300);
  return t.length >= 10 ? t : null;
}

/**
 * PHASE 171 (blog-audit proposal ج): the ai_jobs receipt id threaded from
 * workflow_dispatch → PIPELINE_JOB_ID → run-step.mts. Present ONLY on
 * coach-triggered dispatches (blog-pipeline-dispatch.ts always sends it;
 * scheduled runs carry empty inputs). Together with a coach topic it marks
 * the run as owner-requested — such rows bypass the P5 daily quota.
 */
function getJobIdParam(request: NextRequest): string | null {
  const url = new URL(request.url);
  const j = (url.searchParams.get("job_id") || "").trim().slice(0, 64);
  return j.length > 0 ? j : null;
}

/** Insert one researched queue row; returns the row or a PostgREST error message. */
async function insertResearchedRow(args: {
  language: PipelineLang;
  topic: string;
  focus_keyword: string;
  category: string;
  pairId: string | null;
  bundle: string;
  /** PHASE 171 (proposal ج): stamp the coach-requested marker — this row
   *  is EXEMPT from the P5 one-automated-article/day quota (Phase 162
   *  owner-override semantics: the owner asked for THIS article). */
  coachRequested?: boolean;
}): Promise<{ row: QueueItem | null; error: string | null }> {
  let bundleStr = args.bundle;
  if (args.coachRequested) {
    try {
      const obj = JSON.parse(bundleStr) as Record<string, unknown>;
      bundleStr = JSON.stringify({ ...obj, coachRequested: true });
    } catch {
      bundleStr = JSON.stringify({ coachRequested: true });
    }
  }
  const { data, error } = await supabaseAdmin!
    .from("blog_generation_queue")
    .insert({
      language: args.language,
      topic: args.topic,
      focus_keyword: args.focus_keyword,
      category: args.category,
      status: "researched",
      created_at: new Date().toISOString(),
      ...(args.pairId ? { pair_id: args.pairId } : {}),
      article_bundle: bundleStr,
    })
    .select()
    .single();
  if (error) return { row: null, error: error.message };
  return { row: (data as QueueItem) ?? null, error: null };
}

export async function GET(request: NextRequest) {
  // M6 (audit 2026-09-07): constant-time CRON_SECRET check.
  if (!verifyCronAuth(request))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseAdminConfigured || !supabaseAdmin)
    return NextResponse.json({ error: "Supabase admin not configured." }, { status: 500 });

  // Wave 3 zod gate — the QUERY envelope (auth-first preserved: the
  // CRON_SECRET 401 above stays the real boundary). lang is REQUIRED
  // (the legacy «Missing/invalid ?lang=» 400 re-derived verbatim);
  // topic/job_id ceilings = the route's own slice(0,300)/slice(0,64)
  // points — previously silently truncated, now 400 (the P1-7 class).
  const url = new URL(request.url);
  const parsedQuery = cronBlogP0QuerySchema.safeParse({
    lang: url.searchParams.get("lang"),
    topic: url.searchParams.get("topic") ?? undefined,
    job_id: url.searchParams.get("job_id") ?? undefined,
  });
  if (!parsedQuery.success) {
    const rawLang = url.searchParams.get("lang");
    if (rawLang !== "en" && rawLang !== "ar") {
      return NextResponse.json(
        { error: "Missing/invalid ?lang= parameter — must be 'en' or 'ar'." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  // The language IS this run's identity — refuse to guess it. A wrong
  // guess would silently publish articles in the wrong language at the
  // wrong time slots, so fail loudly instead.
  const lang: PipelineLang | null = getLangParam(request);
  if (!lang) {
    return NextResponse.json(
      { error: "Missing/invalid ?lang= parameter — must be 'en' or 'ar'." },
      { status: 400 },
    );
  }

  const otherLang: PipelineLang = lang === "ar" ? "en" : "ar";
  // PHASE 162: coach-supplied topic (may be null — the automatic runs
  // never send ?topic=, so their behavior is byte-identical to before).
  const coachTopic = getTopicParam(request);
  // PHASE 171 (proposal ج): a run carrying a coach topic OR an ai_jobs
  // receipt is owner-requested — its queue row is exempt from the P5
  // one-automated-article/day law (scheduled runs have neither).
  const coachRun = !!(coachTopic || getJobIdParam(request));

  try {
    // ── 0) RESUME (BLOG-RECOVERY-3, owner order 2026-10-21 «استكمال دون
    // فقدان العمل»): MY OWN language's row stuck mid-pipeline (or honestly
    // failed after completed stages) within 48h, never published — its
    // bundle carries every completed artifact; the per-stage idempotency
    // and artifact gates re-run only from the first incomplete stage.
    // Ordered BEFORE ADOPT: my own row preserves the most completed work
    // (a twin-pre-created pair row holds research only). Degrades to the
    // legacy walk on any error.
    try {
      const resumable = await findResumableRow(lang);
      if (resumable) {
        console.log(
          `[blog/p0-research] RESUME: my ${lang} row ${resumable.id} is "${resumable.status}" (≤48h, unpublished) — continuing it instead of creating a new row (completed stages skip idempotently)`,
        );
        // PHASE 5-E / stage هـ (§10-هـ-1 — «جعل RESUME يقرن»): an UNPAIRED
        // resumable row now gets its own pairing attempt BEFORE the resume
        // proceeds — the measured 0/6 root was exactly here (pairing ran
        // at CREATE only, so resumed rows published unpaired forever).
        // Any failure degrades to the exact plain-resume behavior.
        const resumePairId = await tryResumePair(resumable, lang, otherLang);
        if (coachRun) await markQueueRowCoachRequested(resumable.id);
        return NextResponse.json({
          ok: true,
          step: "p0",
          queueId: resumable.id,
          lang,
          pairMode: resumePairId ? ("resume-paired" as const) : ("resumed" as const),
          pairId: resumePairId ?? undefined,
          resumed: true,
          actual_status: resumable.status,
        });
      }
    } catch (e) {
      console.warn(`[blog/p0-research] resume degraded: ${e instanceof Error ? e.message : e}`);
    }

    // ── 1) ADOPT (≤48h) — my side was pre-created by the twin's window.
    try {
      const candidate = await findAdoptablePairRow(lang);
      if (candidate && isAdoptablePairRow(candidate, lang)) {
        const brief = briefOf(candidate);
        if (brief) {
          // PHASE 171: a coach-triggered run consuming an adopted row
          // marks it — the article is owner-requested and must not be
          // counted against (nor blocked by) the automated daily quota.
          if (coachRun) await markQueueRowCoachRequested(candidate.id);
          return NextResponse.json({
            ok: true,
            step: "p0",
            queueId: candidate.id,
            lang,
            pairMode: "adopted" as const,
            pairId: brief.pairId,
            adopted: true,
          });
        }
      }
    } catch (e) {
      console.warn(`[blog/p0-research] adopt degraded: ${e instanceof Error ? e.message : e}`);
    }

    // ── 2) JOIN (≤30h) — the twin's row exists but MY side never landed.
    // (Happens only when CREATE's best-effort twin insert failed. JOIN is
    // executed by the TWIN's own P0 run: it finds MY row as "the other
    // language's pair row" and creates its own row with the same pair.)
    try {
      const joined = await tryJoinPair(lang, otherLang);
      if (joined) {
        // PHASE 171: same coach-marker law as ADOPT (see above).
        if (coachRun) await markQueueRowCoachRequested(joined.id);
        return NextResponse.json({
          ok: true,
          step: "p0",
          queueId: joined.id,
          lang,
          pairMode: "joined" as const,
          pairId: joined.pair_id ?? undefined,
          joined: true,
        });
      }
    } catch (e) {
      console.warn(`[blog/p0-research] join degraded: ${e instanceof Error ? e.message : e}`);
    }

    // ── 3) CREATE — full bilingual protocol.
    // P0-PAIR-SERIAL (BLOG-RECOVERY 2026-10-20): the pair's two grounded
    // walks run SEQUENTIALLY with a token-bucket recovery gap — the old
    // Promise.all launched both on the ONE working grounded arm (Groq
    // free tier) at the same instant and the starving twin killed the
    // step on 15 consecutive daily runs (39403516194 evidence). See
    // blog-research.ts P0-PAIR-SERIAL for the full measured story.
    const { mine, other, twinError } = await runBilingualResearchPair(lang, otherLang);
    // `mine` = MY language's Phase-0 result; `other` = the twin's (null on
    // the round-5 degradation — the twin's research failed after mine
    // succeeded, so no shared brief is possible and MY row becomes an
    // exact legacy single row: the twin's own pipeline run researches its
    // side later and publishes independently (an unpaired article beats
    // no article — three live attempts measured the whole-step throw
    // discarding a SUCCESSFUL research every time: 39495419206, 39550847616).
    const mineResearch = mine.research;
    alertIfFallback(mine.source, lang);
    if (other) alertIfFallback(other.source, otherLang);

    // Pairing call — its failure (or the round-5 twin-research
    // degradation: no twin research → no shared brief possible) degrades
    // the WHOLE run to legacy V3.
    let brief: SharedBrief | null = null;
    try {
      const enResearch = lang === "en" ? mineResearch : other?.research;
      const arResearch = lang === "ar" ? mineResearch : other?.research;
      if (enResearch && arResearch) {
        const choice = await runPairingSelection(enResearch, arResearch);
        brief = {
          pairId: randomUUID(),
          topicEn: choice.topicEn,
          topicAr: choice.topicAr,
          angleId: choice.angleId,
          sealedAt: new Date().toISOString(),
        };
      } else if (twinError) {
        console.warn(
          `[blog/p0-research] twin research failed → no shared brief (legacy single row for ${lang}): ${twinError.slice(0, 200)}`,
        );
      }
    } catch (e) {
      console.warn(
        `[blog/p0-research] pairing failed → legacy single row: ${e instanceof Error ? e.message : e}`,
      );
    }

    // DOUBLE-DISPATCH GUARD: re-check adopt right before inserting.
    try {
      const raced = await findAdoptablePairRow(lang);
      if (raced && isAdoptablePairRow(raced, lang)) {
        const racedBrief = briefOf(raced);
        if (racedBrief) {
          if (coachRun) await markQueueRowCoachRequested(raced.id);
          return NextResponse.json({
            ok: true,
            step: "p0",
            queueId: raced.id,
            lang,
            pairMode: "adopted" as const,
            pairId: racedBrief.pairId,
            adopted: true,
            racedGuard: true,
          });
        }
      }
    } catch {
      /* guard is best-effort */
    }

    // PHASE 162: seal the coach's topic into MY side of the brief (the
    // twin keeps its researched topic — the pair still shares pairId +
    // angle + sealedAt and passes every extractSharedBrief law).
    if (brief && coachTopic) {
      brief = withCoachTopic(brief, lang, coachTopic);
    }

    // MY row first (the pipeline continues on THIS queueId).
    const myTopic = brief
      ? (lang === "ar" ? brief.topicAr : brief.topicEn)
      : ((coachTopic ?? mineResearch.topics[0]) ||
        (lang === "ar" ? "مقال لياقة" : "fitness article"));
    const myKeyword = brief
      ? topicToKeyword(lang === "ar" ? brief.topicAr : brief.topicEn)
      : (coachTopic
          ? topicToKeyword(coachTopic)
          : mineResearch.keywords[0]?.keyword || (lang === "ar" ? "لياقة" : "fitness"));

    let inserted = await insertResearchedRow({
      language: lang,
      topic: myTopic,
      focus_keyword: myKeyword,
      category: mine.category,
      pairId: brief?.pairId ?? null,
      bundle: bundleWithBrief(mineResearch, brief, researchSourceStamp(mine.source)),
      coachRequested: coachRun || undefined,
    });

    // DEGRADATION LAW: a missing pair_id column (0076 not applied) must
    // never stop publishing — retry ONCE as exact legacy V3 (no pair).
    if (inserted.error) {
      const msg = inserted.error;
      const missingColumn = /pair_id|Could not find the .* column|schema cache/i.test(msg);
      if (brief && missingColumn) {
        console.warn(
          `[blog/p0-research] pair insert rejected (0076 applied?) → legacy single row: ${msg}`,
        );
        brief = null;
        inserted = await insertResearchedRow({
          language: lang,
          topic: (coachTopic ?? mineResearch.topics[0]) ||
            (lang === "ar" ? "مقال لياقة" : "fitness article"),
          focus_keyword: coachTopic
            ? topicToKeyword(coachTopic)
            : mineResearch.keywords[0]?.keyword || (lang === "ar" ? "لياقة" : "fitness"),
          category: mine.category,
          pairId: null,
          bundle: bundleWithBrief(mineResearch, null, researchSourceStamp(mine.source)),
          coachRequested: coachRun || undefined,
        });
      }
    }
    if (inserted.error || !inserted.row) {
      throw new Error(`Queue insert: ${inserted.error ?? "no data"}`);
    }

    // TWIN row — best-effort: its failure never fails MY run (the twin's
    // own P0 JOIN rescues the pair later).
    let twinInserted = false;
    if (brief && other) {
      // (other is non-null whenever brief exists — the round-5 degradation
      // nulls the twin research and leaves brief null too; the guard keeps
      // the type system honest about it.)
      try {
        const twinTopic = otherLang === "ar" ? brief.topicAr : brief.topicEn;
        const twinRes = await insertResearchedRow({
          language: otherLang,
          topic: twinTopic,
          focus_keyword: topicToKeyword(twinTopic),
          category: other.category,
          pairId: brief.pairId,
          bundle: bundleWithBrief(other.research, brief, researchSourceStamp(other.source)),
        });
        twinInserted = !!twinRes.row;
        if (twinRes.error) {
          console.warn(`[blog/p0-research] twin insert failed (JOIN will rescue): ${twinRes.error}`);
        }
      } catch (e) {
        console.warn(`[blog/p0-research] twin insert degraded: ${e instanceof Error ? e.message : e}`);
      }
    }

    return NextResponse.json({
      ok: true,
      step: "p0",
      queueId: inserted.row.id,
      lang,
      category: mine.category,
      keywords: mineResearch.keywords.length,
      faqs: mineResearch.faqs.length,
      topics: mineResearch.topics.length,
      source: mine.source,
      // AUDIT_REPORT §9-1.3: the fallback state rides the response too —
      // one boolean the runner log (and any watchdog) can grep.
      researchFallback: researchUsedFallback(mine.source) || undefined,
      pairMode: brief ? ("created" as const) : ("legacy" as const),
      pairId: brief?.pairId,
      twinInserted,
      topicOverride: coachTopic ?? undefined,
      coachRun: coachRun || undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[blog/p0-research] Error:", msg);
    return NextResponse.json({ error: msg || "Failed" }, { status: 500 });
  }
}

/**
 * JOIN lookup: the OTHER language has a researched pair row (≤30h) with a
 * valid sealed brief whose pair has NO my-language sibling → insert MY row
 * only (MY fresh research + the twin's pair_id + sharedBrief). Returns the
 * inserted row, or null when no joinable state exists. Any hard failure
 * throws → caller degrades to CREATE/legacy.
 */
async function tryJoinPair(
  lang: PipelineLang,
  otherLang: PipelineLang,
): Promise<QueueItem | null> {
  if (!supabaseAdmin) return null;
  const { data: otherRows, error } = await supabaseAdmin
    .from("blog_generation_queue")
    .select("*")
    .eq("language", otherLang)
    .eq("status", "researched")
    .not("pair_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) {
    // 0076 not applied lands here — silent degradation (CREATE will too).
    console.warn(`[blog/p0-research] join lookup degraded: ${error.message}`);
    return null;
  }
  const now = new Date();
  for (const row of (otherRows as QueueItem[] | null) ?? []) {
    const created = Date.parse(row.created_at || "");
    if (!Number.isFinite(created)) continue;
    const ageH = (now.getTime() - created) / 3_600_000;
    if (ageH < 0 || ageH > JOIN_MAX_AGE_HOURS) continue;
    const brief = briefOf(row);
    if (!brief || brief.pairId !== row.pair_id) continue;

    const siblings = await findRecentPairRows(row.pair_id);
    if (siblings.some((s) => s.language === lang)) continue; // my side exists → not a JOIN

    const mine = await runPhase0Research(lang);
    const topic = lang === "ar" ? brief.topicAr : brief.topicEn;
    alertIfFallback(mine.source, lang);
    const { row: inserted, error: insErr } = await insertResearchedRow({
      language: lang,
      topic,
      focus_keyword: topicToKeyword(topic),
      category: mine.category,
      pairId: brief.pairId,
      bundle: bundleWithBrief(mine.research, brief, researchSourceStamp(mine.source)),
    });
    if (insErr || !inserted) {
      // Missing pair_id column (0076) → JOIN unavailable; CREATE below
      // will degrade the same way. Surface as null (not a hard failure).
      console.warn(`[blog/p0-research] join insert degraded: ${insErr ?? "no data"}`);
      return null;
    }
    console.log(`[blog/p0-research] JOINED pair ${brief.pairId} as ${lang}`);
    return inserted;
  }
  return null;
}
