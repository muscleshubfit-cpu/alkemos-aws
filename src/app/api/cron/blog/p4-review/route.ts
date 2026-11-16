import { NextRequest, NextResponse } from "next/server";
import {
  reviewAndEnhance,
  ensureFaqSection,
  countWords,
  repairArabicLatinContamination,
  repairArabicDialectContamination,
  type OutlinePlan,
  type ReviewReport,
} from "@/lib/blog-pipeline";
import { scanLatinContamination, scanArabicDialect } from "@/lib/blog-msa";
import { UnfixableDefectError } from "@/lib/quality-repair/repair-ledger";
import { verifyCronAuth } from "@/lib/cron-auth";
import { cronBlogQueueQuerySchema } from "@/lib/validation/schemas";
import type { LanguageResearch } from "@/lib/blog-research";
import { getRecentPostsByLanguage } from "@/lib/blog-topics";
import {
  getQueueIdParam,
  fetchQueueItem,
  requireRowLang,
  updateQueueItem,
  markQueueItemFailed,
  stampQueueRowRepairDirective,
  type QueueItem,
} from "@/lib/blog-queue";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export const maxDuration = 300;

/**
 * PIPELINE V3 · PHASE 4 — Quality review & enhancement (ONE language):
 * proofread/flow/dedup, keyword coverage check, conservative fact-guard
 * (never invents citations), 2-4 internal links from real posts in THIS
 * language, ≤2 authoritative external links, closing Call-to-Action.
 * Deterministic FAQ-append safety net guarantees length & P0 answers.
 * Bundle stays FLAT: { research0, outline, content, images, review }.
 *
 * GET /api/cron/blog/p4-review?queueId=<uuid>
 *
 * B1 REPAIR DIRECTIVE (Execution-Path Audit §8.2 B1 — owner order
 * 2026-10-01): `&repairDiagnostics=<text>` is set ONLY by run-step.mts
 * when run-step.sh's R1 repair loop re-runs p4-review after a P5 gate
 * failure — the value is the P5 violation text itself, passed through
 * reviewAndEnhance into the prompt as a one-shot REPAIR note (not a
 * permanent editorial law — absent on every normal run, the prompt is
 * the plain review prompt plus the length contract). URL param only:
 * scheduled/dispatched workflows never carry it, so automatic behavior
 * is unchanged.
 */
type LangReview = {
  markdown: string;
  report: ReviewReport;
  internalLinks: { slug: string; anchorText: string }[];
  externalLinks: { url: string; anchorText: string }[];
  source: string;
};

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

  // B1: the repair directive from the loop (absent on normal runs —
  // sanitizeRepairDirective inside reviewAndEnhance re-caps it).
  const repairDiagnostics =
    new URL(request.url).searchParams.get("repairDiagnostics")?.trim() || undefined;

  let qi: QueueItem | null = null;

  try {
    const { data, error: fetchErr } = await fetchQueueItem(queueId);
    if (fetchErr) throw new Error(fetchErr);
    if (!data)
      return NextResponse.json({ ok: false, queueId, skipped: true, reason: "queue_item_not_found" }, { status: 404 });
    qi = data;

    const lang = requireRowLang(qi);

    if (!["images_done", "reviewed"].includes(qi.status) && qi.status !== "failed") {
      if (qi.status === "published")
        return NextResponse.json({ ok: true, step: "p4", queueId: qi.id, lang, idempotent: true });
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }

    const bundle = qi.article_bundle ? JSON.parse(qi.article_bundle) : {};

    // BLOG-RECOVERY-3 (2026-10-21): artifact-preserving resume — a failed
    // row that already carries a review keeps it UNLESS the caller asked
    // for a repair regeneration (?repairDiagnostics=… rides the B1
    // contract — exactly the P5 repair loop that must re-run P4).
    if (qi.status === "failed" && bundle.review && !repairDiagnostics) {
      console.warn(`[blog/p4-review] RESUME: failed row ${qi.id} carries a completed review — skipping (the failure was at P5; pass ?repairDiagnostics to force a re-review)`);
      return NextResponse.json({ ok: true, step: "p4", queueId: qi.id, lang, resumed: true });
    }

    const outline: OutlinePlan | undefined = bundle.outline;
    const research: LanguageResearch | undefined = bundle.research0;
    const draft: string | undefined = bundle.content?.markdown;
    if (!outline || !research || !draft) {
      throw new Error(`p4 ${lang}: missing outline/research/draft artifacts`);
    }

    // Internal-link candidates come from THIS language's own archive so
    // an EN article never links to an Arabic slug and vice versa.
    const recent = await getRecentPostsByLanguage(lang, 20);
    const candidates = recent
      .filter((p) => p.slug)
      .map((p) => ({ slug: p.slug, title: p.title }));

    const r = await reviewAndEnhance(lang, draft, outline, candidates, repairDiagnostics);

    // Deterministic safety net: article-specific FAQ section guaranteed.
    // PHASE 172 (owner order — FAQ filler fix): relevance-filtered against
    // the article's title/focus (≤6, zero-relevant → no FAQ at all) — the
    // pre-172 net appended ALL niche-generic P0 FAQs (up to 10) to any
    // article that lacked a model-written FAQ section.
    const withFaq = ensureFaqSection(lang, r.markdown, research, outline.title);

    // PHASE 176 — Arabic Latin-contamination repair (the 09-11 incident:
    // "يُ marketed" / "لا توجد evidences" shipped inside AR prose because
    // weak chain models ignore prompt laws). Deterministic DETECTION → one
    // targeted AI repair → deterministic RE-VALIDATION (links/headings/
    // images/length preserved + zero dialect + zero Latin). A failing
    // repair THROWS → markQueueItemFailed → the runner's ×3 retry re-runs
    // P4 on a fresh model draw. EN articles skip (Latin is their prose).
    //
    // AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16): the DIALECT pass
    // now runs FIRST — the live failure class (run التشغيلة العربية المجدولة (16 نوفمبر 2026) + 8 of
    // the last 13 AR runs before 2026-11-16) died because «حاجة»×1 was
    // detected, no repairer existed for Arabic dialect words, and the
    // validator demanded an improvement nothing could produce. The
    // dialect pass (dictionary + context-aware AI tokens + the shared
    // repair loop) fixes the markers BEFORE the Latin pass runs, so
    // validateMsaConversion's weak-improvement clause judges an output
    // that genuinely improved. NO gate changed — a repairer was added.
    let finalMd = withFaq.md;
    let latinRepairNote: string | null = null;
    let dialectRepairNote: string | null = null;
    if (lang === "ar") {
      const dialect = scanArabicDialect(finalMd);
      if (dialect.strong > 0 || dialect.weak > 0) {
        console.log(
          `[blog/p4-review] dialect markers detected (strong=${dialect.strong}, weak=${dialect.weak}) — dialect repair pass engaged`,
        );
        const repaired = await repairArabicDialectContamination(finalMd);
        finalMd = repaired.out;
        dialectRepairNote = `dialect-repair: ${repaired.ledgerSummary}`;
      }
      const latin = scanLatinContamination(finalMd);
      if (latin.count > 0) {
        console.log(
          `[blog/p4-review] latin contamination detected (${latin.count} tokens) — repair pass engaged`,
        );
        finalMd = await repairArabicLatinContamination(finalMd, latin.tokens);
        latinRepairNote = `latin-repair: ${latin.count} bare Latin token(s) arabized deterministically-gated`;
      }
    }

    const review: LangReview = {
      markdown: finalMd,
      report: {
        ...r.report,
        changesSummary: [
          ...r.report.changesSummary,
          ...(withFaq.appended
            ? [`appended ${withFaq.appendedCount} topic-relevant FAQ item(s) from P0 answers`]
            : []),
          ...(dialectRepairNote ? [dialectRepairNote] : []),
          ...(latinRepairNote ? [latinRepairNote] : []),
        ],
      },
      internalLinks: r.internalLinks,
      externalLinks: r.externalLinks,
      source: r.source,
    };

    const updateErr = await updateQueueItem(qi.id, {
      status: "reviewed",
      article_bundle: JSON.stringify({ ...bundle, review }),
    });
    if (updateErr) throw new Error(updateErr);

    return NextResponse.json({
      ok: true,
      step: "p4",
      queueId: qi.id,
      lang,
      words: countWords(review.markdown),
      coverage: review.report.keywordCoverage,
      source: review.source,
      ...(repairDiagnostics ? { repairDirected: true } : {}),
      ...(dialectRepairNote ? { dialectRepair: dialectRepairNote } : {}),
      ...(latinRepairNote ? { latinRepair: latinRepairNote } : {}),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const msg = err.message || "Unknown";
    console.error("[blog/p4-review] Error:", msg);
    if (queueId) await markQueueItemFailed(queueId, `p4: ${msg}`);
    // AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16): a DETERMINISTIC
    // quality-gate failure at P4 (the dialect/Latin repair validators —
    // the exact class that killed run التشغيلة العربية المجدولة (16 نوفمبر 2026)) is a REPAIR
    // DIRECTIVE, not a transient error: the blind ×3 runner retry
    // re-reads the IDENTICAL prompt on the IDENTICAL draft and
    // reproduces the identical defect. The 500 body now carries the
    // SAME machine-readable contract P5 emits (blog-repair-target's
    // closed set — p4-review is already a member) plus the gate
    // violations as repairDiagnostics, so run-step.sh's repair chain
    // re-runs P4 with a ONE-SHOT directed repair directive (the B1
    // law, now self-referential for P4's own gate failures). The
    // UnfixableDefectError ledger rides the diagnostics so the
    // directed re-review knows every strategy already tried and why
    // each failed. Parse/length failures stay the plain ×3 fresh-draw
    // class (no content exists to direct a repair at). No gate or
    // threshold changed — only WHO recovers the row and WHEN.
    const rerunTarget =
      /^(dialect|latin)-repair failed|quality-repair unfixable/i.test(msg) ? "p4-review" : null;
    const repairDiag =
      rerunTarget === "p4-review"
        ? buildP4RepairDiagnostics(msg, err instanceof UnfixableDefectError ? err.ledger : null)
        : undefined;
    if (rerunTarget && queueId) {
      await stampQueueRowRepairDirective(queueId, rerunTarget);
    }
    return NextResponse.json(
      rerunTarget
        ? {
            error: msg,
            rerunTarget,
            ...(repairDiag ? { repairDiagnostics: repairDiag } : {}),
          }
        : { error: msg },
      { status: 500 },
    );
  }
}

/**
 * B1 twin for P4's own gate failures (the P5 buildRepairDiagnostics
 * law, scoped to what P4 knows): the violation text (minus the p4:
 * prefix) plus — when the shared repair loop exhausted its strategies —
 * the honest ledger summary (defects that remained, every strategy
 * tried, why each failed). Capped by the same sanitize law the P4
 * prompt applies to incoming directives (1,500 chars, control chars
 * stripped upstream by sanitizeRepairDirective).
 */
function buildP4RepairDiagnostics(msg: string, ledger: { unfixableReason?: string } | null): string {
  const base = msg.replace(/^p4:\s*/, "").trim();
  const ledgerLine = ledger?.unfixableReason ? ` ${ledger.unfixableReason}` : "";
  return `${base}${ledgerLine}`.replace(/\s+/g, " ").slice(0, 1500);
}
