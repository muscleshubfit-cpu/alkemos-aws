import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { normalizeCategory } from "@/lib/blog-server";
import { countWords, splitFaqSection, filterFaqsByRelevance, clampMetaTitle, clampMetaDescription, type OutlinePlan } from "@/lib/blog-pipeline";
import { scanLatinContamination } from "@/lib/blog-msa";
import { runP5QualityGates } from "@/lib/blog-quality-gates";
import { verifyBodyLinks } from "@/lib/blog-link-verify";
import { EDITORIAL_FAQ_COUNT_RANGE, EDITORIAL_AUTHORITY_DOMAINS, EDITORIAL_SEED_AUTHORITY_LINKS } from "@/lib/blog-editorial-law";
import { getRecentPostsByLanguage } from "@/lib/blog-topics";
import { embedBodyImages } from "@/lib/blog-images";
import { insertToolLinks } from "@/lib/blog-tool-links";
import { slugifyAscii } from "@/lib/slug";
import {
  getQueueIdParam,
  fetchQueueItem,
  validateQueueStatus,
  requireRowLang,
  updateQueueItem,
  markQueueItemFailed,
  findRecentPairRows,
  countAutomatedPublishedToday,
  bundleMarksCoachRequest,
  stampQueueRowRepairDirective,
  type QueueItem,
} from "@/lib/blog-queue";
import { verifyCronAuth } from "@/lib/cron-auth";
import { cronBlogQueueQuerySchema } from "@/lib/validation/schemas";
import { mapP5FailureToRerunTarget } from "@/lib/blog-repair-target";

export const maxDuration = 60;

/** AUDIT_REPORT §9-0.3 (2026-09-29) — the REAL length floor at the publish
 * layer. The P2 ask is 1500–2500 words (mandatory), yet NOTHING enforced
 * any floor at publish (audit F3/C1: the only code floor was P2's 400-word
 * parse-validity net; measured median 1,202 words, only 15% in range, six
 * sub-800-word articles shipped). The audit's Phase-0 floor was 1300 —
 * below the 1500 ask (models get slack) but far above the measured median.
 * Owner order 2026-10-02 (Phase 323): floor LOWERED 1300 → 1000 to match
 * the lowered execution floor (BLOG_EXECUTION_WORD_FLOOR); still above
 * the old 400-word net, so a deficient draft can never reach production. */
const P5_WORD_FLOOR = 1000;

/**
 * PIPELINE V3 · PHASE 5 — Publish & Update (ONE language).
 * Pure Node.js / Supabase — NO AI models here (owner spec).
 * Inserts the blog_posts row for the row's OWN language, marks the
 * queue row published. The app's dynamic sitemap.ts picks up new posts
 * automatically on next request.
 *
 * PHASE 157 — BILINGUAL HANDSHAKE: when the queue row carries a pair_id,
 * the later-published twin fills its OWN linked_post_id AND the earlier
 * twin's (bidirectional) — hreflang (blog-sitemap) + LanguageToggle light
 * up automatically per pair. Best-effort in EVERY direction: any failure
 * logs and moves on, the publish itself NEVER fails because of pairing.
 * Unpaired (legacy/degraded) rows keep the exact pre-157 behavior.
 *
 * PHASE 171 (blog-audit proposal ج — 2026-09-10): ONE-AUTOMATIC-ARTICLE/
 * DAY/LANGUAGE LAW now enforced HERE, at the publish layer. Live race
 * evidence: EN published two posts on 09-05 (23:07 + 23:33) — the 23:00
 * backstop dispatched a top-up while GitHub's delayed scheduled run was
 * still on its way; both runs published. The dispatch layer got grace +
 * post-counting (dispatch-pipelines route), and THIS guard is the last
 * line of defense: an AUTOMATIC row (bundle WITHOUT coachRequested) may
 * not publish when another automated row of the same language, created
 * the same UTC day, already published. Coach-requested rows (Phase 162
 * owner override) are exempt — the owner asked for that article.
 *
 * GET /api/cron/blog/p5-publish?queueId=<uuid>
 */
// ONE-SLUG-LAW (2026-08-28j): the local slugify() copy was DELETED —
// slug logic lives only in src/lib/slug.ts (slugifyAscii = exact port).

async function uniqueSlug(base: string, language: "en" | "ar"): Promise<string> {
  if (!supabaseAdmin) return base;
  let slug = base || `post-${Date.now()}`;
  const effectiveBase = base || slug;
  let attempt = 0;
  while (attempt < 5) {
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .eq("language", language)
      .maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${effectiveBase}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${effectiveBase}-${Date.now()}`;
}

async function titleAlreadyExists(title: string, language: "en" | "ar"): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const normalized = title.trim().toLowerCase();
  if (!normalized) return false;
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("id")
    .eq("language", language)
    .ilike("title", normalized)
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

export async function GET(request: NextRequest) {
  // M6 (audit 2026-09-07): constant-time CRON_SECRET check.
  if (!verifyCronAuth(request))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseAdminConfigured || !supabaseAdmin)
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

  let publishedPostId: string | null = null;
  let qi: QueueItem | null = null;

  // BLOG-RECOVERY 2026-10-16 (RC3) — repair-directive CONTEXT holder.
  // The pre-recovery B1 diagnostics carried ONLY the gate-violation
  // sentence; the P4 re-run then reproduced the same violations because
  // it had no way to know (a) WHICH citation URLs link-verify had just
  // confirmed dead (it re-added the same famous-but-404 pages: run
  // 36949956731 removed who.int/sodium + acsm/fluid-replacement, the
  // repair re-added them, P5 removed them again — 2 wasted cycles) or
  // (b) WHICH FAQ questions the deterministic relevance filter dropped
  // (6/7 dropped, then 2/2 — the count fell 7→1→0 across the repair
  // cycles instead of recovering). The catch block appends both lists
  // to repairDiagnostics so the ONE-SHOT directive names the actual
  // CAUSES. Pure additive context — no gate, threshold, or error
  // message changes (the `error` field and mapP5FailureToRerunTarget
  // anchors stay byte-identical).
  const repairCtx: { deadUrls: string[]; droppedFaqs: string[]; relevanceHint: string } = {
    deadUrls: [],
    droppedFaqs: [],
    relevanceHint: "",
  };

  try {
    const { data, error: fetchErr } = await fetchQueueItem(queueId);
    if (fetchErr) throw new Error(fetchErr);
    if (!data)
      return NextResponse.json({ ok: false, queueId, skipped: true, reason: "queue_item_not_found" }, { status: 404 });
    qi = data;

    const lang = requireRowLang(qi);

    const statusErr = validateQueueStatus(qi, "reviewed");
    if (statusErr) {
      if (qi.status === "published")
        return NextResponse.json({ ok: true, step: "p5", queueId: qi.id, lang, idempotent: true });
      if (qi.status !== "failed" && !qi.status.startsWith("failed:")) {
        return NextResponse.json(
          { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
          { status: 409 },
        );
      }
      console.warn(`[blog/p5-publish] Re-processing previously failed item ${qi.id}`);
    }

    // FLAT artifacts (V3).
    const bundle = JSON.parse(qi.article_bundle || "{}");
    const outline = bundle.outline as OutlinePlan | undefined;
    const review = bundle.review as { markdown?: string } | undefined;
    const images = (bundle.images ?? []) as { url: string; alt: string; credit: string }[];
    if (!outline?.title || !review?.markdown) {
      throw new Error("p5: missing reviewed artifacts — rerun p4-review");
    }

    // AUDIT_REPORT §9-0.3 (2026-09-29) — publish-layer LENGTH GATE (same
    // mechanism as the Phase-176 Latin gate below: fail honestly → the row
    // is marked failed with the diagnostic → the 23:40 UTC dispatch backstop
    // tops the day's slot up with a fresh run). Measured on the SAME basis
    // as reading_time and the audit's n=109 baseline (review.markdown — the
    // lifted FAQ section included, it renders as the visible FAQ cards).
    // Runs BEFORE the quota/dup guards so a short draft fails fast without
    // spending DB roundtrips; a failed row never consumed the daily quota
    // (the guard counts PUBLISHED rows only).
    const draftWords = countWords(review.markdown);
    if (draftWords < P5_WORD_FLOOR) {
      throw new Error(
        `p5: article too short (${draftWords} words < ${P5_WORD_FLOOR}-word floor) — rerun p2-content`,
      );
    }

    // PHASE 171 (proposal ج) — DAILY QUOTA GUARD (publish-layer law):
    // automated rows refuse to publish a SECOND article of the same UTC
    // day for their language. Attribution = queue-row CREATION day (the
    // run's day), so a late-night top-up publishing just after midnight
    // does not eat the next day's slot. Coach rows are exempt. DB
    // unavailable → guard degrades OPEN (never blocks publishing on an
    // infra hiccup — the dispatch layer still prevents the race).
    if (!bundleMarksCoachRequest(qi.article_bundle)) {
      const publishedAutomated = await countAutomatedPublishedToday(lang);
      if (publishedAutomated !== null && publishedAutomated >= 1) {
        console.warn(
          `[blog/p5-publish] daily quota already met for ${lang} (${publishedAutomated} automated row(s) created today published) — skipping ${qi.id}`,
        );
        return quotaSkip(qi.id, lang, publishedAutomated);
      }
    }

    const safeCategory = normalizeCategory(qi.category);
    const now = new Date().toISOString();

    const title = outline.title || qi.topic;

    if (await titleAlreadyExists(title, lang))
      return dupSkip(qi.id, title, lang);

    const slug = await uniqueSlug(
      slugifyAscii(outline.slugBase || qi.focus_keyword),
      lang,
    );
    const featured = images[0]?.url ?? null;

    // AUTOMATIC FREE-TOOL INTERNAL LINKING (owner SEO directive,
    // 2026-09-01): deterministic pass — wraps natural mentions (calories,
    // macros, meal plans, water, body fat, BMI…) with links to the
    // matching FREE TOOL on the site. Language-aware (EN/AR triggers),
    // idempotent, max 3 links/article, never inside existing markdown
    // links. Runs AFTER the P4 review (so the review model cannot strip
    // these links) and BEFORE image embedding.
    //
    // PHASE 172 (owner order — FAQ filler fix): the article-specific FAQ
    // section written in the reviewed markdown is LIFTED into
    // blog_posts.faq_json (the visual FAQ cards) and REMOVED from the
    // body — pre-172 the page rendered the FAQ TWICE (body + cards) and
    // the cards carried the niche-generic P0 FAQs instead of the
    // article's own questions. The lift happens BEFORE the tool-link
    // pass (FAQ card answers render as plain text — no markdown links
    // should be planted in them). Degradation: no recognizable FAQ
    // section → legacy behavior (faq_json from research0, body intact).
    //
    // PHASE 176 (owner report «التعديلات الجديدة اختفت مرة أخرى» — live
    // evidence: the 09-11 protein-timing article lifted creatine +
    // intermittent-fasting + metabolism questions into a protein-TIMING
    // article's FAQ cards): the lifted questions AND the research0
    // fallback now pass the DETERMINISTIC relevance filter
    // (filterFaqsByRelevance — ≥2 shared meaningful words with the
    // article's title+focus; P4's model-ignored instruction was not
    // enough). Relevant-but-fewer beats padded-but-off-topic; zero
    // relevant → no FAQ cards at all (the Phase-172 no-forced-filler
    // law). AR answers that still carry bare Latin tokens are dropped
    // the same way (belt-and-braces for the P4 repair gate).
    const { body: faqStrippedMd, faqs: parsedFaqs } = splitFaqSection(lang, review.markdown);
    const relevanceHint = `${outline.title} ${qi.focus_keyword ?? ""}`;
    const relevantFaqs = filterFaqsByRelevance(parsedFaqs, relevanceHint);
    const faqRelevanceDropped = parsedFaqs.length - relevantFaqs.length;
    // RC3: capture the dropped questions + the hint for the repair directive.
    repairCtx.droppedFaqs = parsedFaqs
      .filter((f) => !relevantFaqs.includes(f))
      .map((f) => f.question);
    repairCtx.relevanceHint = relevanceHint;
    if (faqRelevanceDropped > 0) {
      console.log(
        `[blog/p5-publish] FAQ relevance filter: ${faqRelevanceDropped} off-topic question(s) dropped (of ${parsedFaqs.length} lifted)`,
      );
    }
    let finalFaqs = relevantFaqs;
    if (lang === "ar" && finalFaqs.length > 0) {
      const beforeDrop = finalFaqs.length;
      finalFaqs = finalFaqs.filter(
        (f) =>
          scanLatinContamination(f.question).count === 0 &&
          scanLatinContamination(f.answer).count === 0,
      );
      if (finalFaqs.length < beforeDrop) {
        console.log(
          `[blog/p5-publish] FAQ latin gate: ${beforeDrop - finalFaqs.length} contaminated answer(s) dropped`,
        );
      }
    }
    const toolLinkPass = insertToolLinks(faqStrippedMd, lang);

    // AUDIT_REPORT §9-المرحلة 2, item 2 (2026-09-29) — the CITATION
    // LINK VERIFICATION GATE («بوابة تحقق من الروابط (HEAD request)»).
    // The honest-citation policy (option أ) now lets the writing phases
    // cite evidence as links to the whitelisted authority domains —
    // better for GEO than the old blanket ban. Free-chain models DO
    // hallucinate URLs, so every EXTERNAL link in the final body is
    // HEAD-verified here: CONFIRMED-dead links (404/410) are removed to
    // their anchor text BEFORE the battery, so the G4 authority floor
    // measures the VERIFIED state (dead-citation-removed + no authority
    // link left → honest battery failure → backstop regenerates).
    // Fail-OPEN by design (403/405/429/timeout/DNS = kept): an authority
    // that refuses HEAD must never cost a good citation, and the whole
    // pass is bounded (≤12 URLs · ≤30s). Runs on the GHA runner
    // (network available; the Vercel-cron backstop only DISPATCHES the
    // workflow, it never runs P5 itself).
    const linkVerify = await verifyBodyLinks(toolLinkPass.md);
    // RC3: capture the confirmed-dead URLs for the repair directive.
    repairCtx.deadUrls = linkVerify.dead;
    if (linkVerify.dead.length > 0) {
      console.warn(
        `[blog/p5-publish] link-verify: ${linkVerify.dead.length} confirmed-dead citation link(s) REMOVED (anchor kept): ${linkVerify.dead.slice(0, 5).join(", ")}`,
      );
    }
    if (linkVerify.unverified.length > 0) {
      console.log(
        `[blog/p5-publish] link-verify: ${linkVerify.unverified.length} link(s) inconclusive (kept — 403/405/429/timeout): ${linkVerify.unverified.slice(0, 5).join(", ")}`,
      );
    }
    const verifiedMd = linkVerify.md;
    // AUDIT_REPORT §9-1.4: the FAQ ceiling applies to the degraded
    // research0 path too (its pool holds up to 10 — the lifted path is
    // already capped at 7 by splitFaqSection).
    const finalFaqJson =
      finalFaqs.length > 0
        ? finalFaqs
        : filterFaqsByRelevance(bundle.research0?.faqs ?? [], relevanceHint).slice(
            0,
            EDITORIAL_FAQ_COUNT_RANGE.max,
          );

    // AUDIT_REPORT §9-المرحلة 1, item 4 (2026-09-29) — the EXPANDED
    // deterministic quality battery (G2-G6; G1 length ran above).
    // Same mechanism as the Latin gate and the Phase-0 length floor:
    // any violation fails the row HONESTLY with a diagnostic naming the
    // gate, and the 23:40 UTC dispatch backstop tops the day's slot up
    // with a fresh run (audit: «أي فشل → إعادة توليد… markFailed +
    // backstop»). The whole blog is YMYL health content, so the
    // authority-link floor applies to every article (audit F6: 62/97
    // shipped with zero external links). legalTitles = published post
    // titles of THIS language (the P4 anchor law allows an exact title
    // as anchor text); the scan is one light card query and degrades to
    // an empty whitelist on any DB hiccup (gate still runs — a real
    // title-anchor is then judged by the grammar rules alone, which
    // 2-5-word grammatical titles pass anyway).
    let legalTitles: string[] = [];
    try {
      legalTitles = (await getRecentPostsByLanguage(lang, 100)).map((p) => p.title);
    } catch {
      /* best-effort whitelist — battery runs regardless */
    }
    const gateViolations = runP5QualityGates({
      lang,
      bodyMd: verifiedMd,
      faqCount: finalFaqJson.length,
      legalTitles,
    });
    if (gateViolations.length > 0) {
      throw new Error(
        `p5: quality-gate battery failed — ${gateViolations.join(" | ")} — rerun p4-review`,
      );
    }

    // PHASE 176 — final deterministic Latin gate (publish-layer law,
    // mirror of the 171 daily-quota guard): an AR article whose BODY
    // still carries bare Latin tokens after the P4 repair did not pass
    // fails HONESTLY here — the row is marked failed with the token
    // list and the 23:40 dispatch backstop tops the day's slot up. EN
    // articles skip (Latin is their prose).
    if (lang === "ar") {
      const bodyLatin = scanLatinContamination(verifiedMd);
      if (bodyLatin.count > 0) {
        throw new Error(
          `p5: latin contamination in final body (${bodyLatin.count} tokens: ${bodyLatin.tokens.slice(0, 10).join(", ")}) — rerun p4-review`,
        );
      }
    }

    const row = {
      language: lang,
      title,
      slug,
      // PHASE 178: excerpt + meta_description ride the same clamped value
      // (the P1 parser already clamps; this is the idempotent safety for
      // outlines serialized into older queue rows) — no more mid-word cuts.
      excerpt: clampMetaDescription(outline.metaDescription, lang),
      // BODY IMAGE EMBEDDING LAW: images[0] = featured/og cover; images[1..N]
      // are inserted into the article markdown at section boundaries (was:
      // dropped entirely → every post was a wall of text).
      content: embedBodyImages(verifiedMd, images),
      // Phase SEO-GEO-6.3 (§12.19 P0-3): word-boundary clamp replaces the
      // old `.slice(0, 60)` mid-word hard cut (23/31 EN titles were landing
      // in the SERP truncated mid-word; AR budget is wider at 70).
      meta_title: clampMetaTitle(outline.title, lang),
      meta_description: clampMetaDescription(outline.metaDescription, lang),
      focus_keyword: qi.focus_keyword,
      keywords: outline.lsiKeywords,
      category: safeCategory,
      tags: outline.lsiKeywords.slice(0, 5),
      featured_image: featured,
      cover_alt: title,
      reading_time: Math.max(1, Math.ceil(countWords(review.markdown) / 200)),
      // Phase SEO-GEO-4.1 (2026-09-08): author is the human founder Ahmed
      // Zake, not the brand "Alkemos". The byline UI + Article schema's
      // `author` Person both display this value — using a real human name
      // is the strongest E-E-A-T signal per Google's QRG. resolveAuthor()
      // in authors.ts still normalizes legacy "Alkemos"/"MuscleHub" values
      // to Ahmed Zake for backward compatibility, but new posts ship with
      // the canonical name from the start.
      author: "Ahmed Zake",
      is_published: true,
      published_at: now,
      // AUDIT_REPORT §9-المرحلة 2, item 1 (0097 — 2026-09-29): every
      // pipeline article publishes in the HONEST pending-review state —
      // the byline reads «AI-generated · medical review pending» and the
      // Article schema omits reviewedBy/lastReviewed until the owner
      // actually reviews it (POST /api/admin/blog/review or the editor's
      // own publish). last_reviewed_at stays null — NEVER automatic.
      review_status: "pending",
      last_reviewed_at: null,
      // PHASE 172: article-specific FAQs lifted from the reviewed markdown
      // (see the splitFaqSection block above); research0 fallback only in
      // the degraded no-FAQ-section path.
      faq_json: finalFaqJson,
    };

    const { data: post, error: insertErr } = await supabaseAdmin
      .from("blog_posts")
      .insert(row)
      .select()
      .single();
    if (insertErr) throw new Error(`Post insert (${lang}): ${insertErr.message}`);
    publishedPostId = post?.id || null;

    const updateErr = await updateQueueItem(qi.id, {
      status: "published",
      ...(lang === "en"
        ? { en_post_id: publishedPostId ?? undefined }
        : { ar_post_id: publishedPostId ?? undefined }),
    });
    if (updateErr) throw new Error(updateErr);

    // PHASE 157 — BILINGUAL HANDSHAKE (best-effort, never fails the
    // publish): find the twin queue row by pair_id; if the twin already
    // published, fill linked_post_id in BOTH directions.
    let handshake: "bidirectional" | "first-of-pair" | "skipped" = "skipped";
    if (qi.pair_id) {
      try {
        const rowId = qi.id; // narrowed snapshot (mutable let loses narrowing in callbacks)
        const pairRows = await findRecentPairRows(qi.pair_id);
        const twin = pairRows.find((r) => r.id !== rowId && r.language !== lang);
        const twinPostId = twin
          ? (lang === "en" ? twin.ar_post_id : twin.en_post_id)
          : null;
        if (twinPostId && publishedPostId) {
          // I published second: point me → twin AND twin → me.
          const mineErr = await supabaseAdmin
            .from("blog_posts")
            .update({ linked_post_id: twinPostId })
            .eq("id", publishedPostId)
            .then(({ error }) => error?.message ?? null);
          const twinErr = await supabaseAdmin
            .from("blog_posts")
            .update({ linked_post_id: publishedPostId })
            .eq("id", twinPostId)
            .then(({ error }) => error?.message ?? null);
          if (mineErr || twinErr) {
            console.warn(
              `[blog/p5-publish] handshake partial (mine=${mineErr ?? "ok"}, twin=${twinErr ?? "ok"})`,
            );
            handshake = mineErr && twinErr ? "skipped" : "bidirectional";
          } else {
            handshake = "bidirectional";
            console.log(`[blog/p5-publish] pair linked ${qi.pair_id}: ${publishedPostId} ↔ ${twinPostId}`);
          }
        } else {
          // I published first — the twin's P5 fills both directions later.
          handshake = "first-of-pair";
        }
      } catch (e) {
        console.warn(
          `[blog/p5-publish] handshake degraded: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      step: "p5",
      queueId: qi.id,
      lang,
      postId: publishedPostId,
      sitemap: "auto (dynamic sitemap.ts)",
      title: row.title,
      slug,
      toolLinksInserted: toolLinkPass.inserted.length,
      linkVerify: {
        checked: linkVerify.checked.length,
        deadRemoved: linkVerify.dead.length,
        unverifiedKept: linkVerify.unverified.length,
      },
      reviewStatus: "pending",
      faqLifted: finalFaqs.length,
      ...(faqRelevanceDropped > 0 ? { faqRelevanceDropped } : {}),
      handshake,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[blog/p5-publish] Error:", msg);
    if (queueId) {
      const partial = publishedPostId
        ? `partial_publish: ${String(qi?.language ?? "?").toUpperCase()} post ${publishedPostId} inserted but post-update failed. `
        : "";
      await markQueueItemFailed(queueId, `p5: ${partial}${msg || "Unknown"}`);
    }
    // R1 REPAIR CONTRACT (Execution-Path Audit §8.2 A1, 2026-09-29):
    // the deterministic gates above fail on an IMMUTABLE bundle — a
    // blind ×3 retry re-runs the same checks on the same bytes and
    // fails identically (live evidence: three byte-identical P5
    // failures in run 36507693416). The 500 body now carries a
    // machine-readable rerunTarget naming the step that can actually
    // repair THIS row; run-step.mts translates it to exit code 3 and
    // run-step.sh executes the repair in-run on the same queue row
    // (≤2 cycles) before this markFailed becomes final. No gate or
    // threshold changed — only WHO recovers the row and WHEN. Null
    // (infra / unknown) keeps the exact legacy body.
    const rerunTarget = mapP5FailureToRerunTarget(msg);
    // B1 REPAIR DIAGNOSTICS (Execution-Path Audit §8.2 B1 — owner order
    // 2026-10-01): when the repair contract points at p4-review, the 500
    // body ALSO carries the gate violations themselves (the message minus
    // the "p5: " prefix and the "— rerun p4-review" tail) as
    // `repairDiagnostics`. run-step.mts re-emits them as a base64 stdout
    // line, run-step.sh threads them to the p4-review re-run, and the P4
    // route injects them into the review prompt as a ONE-SHOT repair
    // directive — so the model learns WHICH gates rejected the previous
    // review instead of re-reading the identical prompt and reproducing
    // the identical violations (live evidence: runs 78/81/82 — "FAQ count
    // 3" + the same Arabic anchors failed three byte-identical retries).
    // Pure message passthrough: the `error` field above stays verbatim;
    // p2-content targets carry no diagnostics (a word-floor failure needs
    // regeneration, not directed repair — B1 is scoped to p4-review).
    const repairDiagnostics =
      rerunTarget === "p4-review" ? buildRepairDiagnostics(msg, repairCtx) : undefined;
    // R5 REPAIR OBSERVABILITY (Execution-Path Audit §10 Phase R5,
    // 2026-09-30): stamp the directive into the row's bundle so the
    // repair path is MEASURABLE — the marker survives the repair chain
    // (P2-force and P4 spread the bundle) and a row that publishes
    // afterwards carries the proof for the queue-health counter
    // («repair-first vs regenerate»). Best-effort by the same law as
    // markQueueItemFailed above: a stamping hiccup must never mask the
    // honest failure. Pure observability — no gate or budget change.
    if (rerunTarget) {
      await stampQueueRowRepairDirective(queueId, rerunTarget, qi?.article_bundle ?? undefined);
    }
    return NextResponse.json(
      rerunTarget
        ? {
            error: msg || "Failed",
            rerunTarget,
            ...(repairDiagnostics ? { repairDiagnostics } : {}),
          }
        : { error: msg || "Failed" },
      { status: 500 },
    );
  }
}

async function dupSkip(queueId: string, title: string, lang: "en" | "ar") {
  const err = await updateQueueItem(queueId, {
    status: "skipped_duplicate",
    error_message: `p5: duplicate-${lang}-title "${title}"`,
  });
  if (err) console.error(`[blog/p5-publish] Failed to mark skipped_duplicate: ${err}`);
  return NextResponse.json({ ok: true, step: "p5", queueId, lang, skipped: true, reason: `duplicate-${lang}-title`, title });
}

/** BLOG-RECOVERY 2026-10-16 (RC3) — B1 diagnostics + actionable context.
 * Base = the pure violation text exactly as before (the p5: prefix and
 * the "— rerun p4-review" tail stripped; absent context keeps the
 * byte-identical legacy string so the B1 canaries stay green). When the
 * run actually removed dead citation URLs or dropped off-topic FAQ
 * questions, those CAUSES are appended so the P4 repair model can fix
 * them at the root instead of reproducing the identical violations
 * (live evidence: run 36949956731 — 2 repair cycles, FAQ count 7→1→0,
 * the same dead who.int/acsm links re-added and re-removed). Compact by
 * design (≤3 URLs · ≤3 questions · total sliced to the 1500-char B1
 * sanitize cap, core violations first). */
function buildRepairDiagnostics(
  msg: string,
  ctx: { deadUrls: string[]; droppedFaqs: string[]; relevanceHint: string },
): string | undefined {
  const base = msg
    .replace(/^p5:\s*/, "")
    .replace(/\s*—\s*rerun p4-review\s*$/, "")
    .trim();
  if (!base) return undefined;
  const extras: string[] = [];
  // BLOG-RECOVERY-3 round-2 (2026-10-21, live run 39628616769): a repair
  // re-review that regenerates the body WITHOUT any external authority
  // link kept failing G4 again and again (measured: two consecutive
  // cycles rebuilt the article with zero authority links) — the repair
  // directive must carry the exact requirement: keep/restore at least
  // one link to a whitelisted authority domain.
  if (/no external authority link/i.test(base)) {
    extras.push(
      `AUTHORITY LINK REQUIRED: the previous body carried ZERO links to a whitelisted authority domain. Add ONE link to a REAL page — prefer one of these VERIFIED links (they exist; cite the one most relevant to the sentence you attach it to): ${EDITORIAL_SEED_AUTHORITY_LINKS.join(" ; ")} — otherwise use a page on: ${EDITORIAL_AUTHORITY_DOMAINS.slice(0, 6).join(" / ")}. NEVER invent a URL path you are not certain exists. The YMYL E-E-A-T floor is a hard publish gate.`,
    );
  }
  if (ctx.deadUrls.length > 0) {
    extras.push(
      `DEAD CITATION URLS REMOVED at publish verification (confirmed 404/410 — do NOT re-add these exact URLs; cite DIFFERENT authority pages you are certain exist): ${ctx.deadUrls.slice(0, 3).join(" ; ")}`,
    );
  }
  if (ctx.droppedFaqs.length > 0) {
    const hint = ctx.relevanceHint.trim().slice(0, 120);
    extras.push(
      `OFF-TOPIC FAQ QUESTIONS DROPPED by the deterministic relevance filter (a kept FAQ must share at least 2 meaningful words with the article title/focus keyword${hint ? ` "${hint}"` : ""}; rewrite these questions genuinely on-topic for THIS article, or replace them): ${ctx.droppedFaqs.slice(0, 3).map((q) => `"${q}"`).join(" ; ")}`,
    );
  }
  const extra = extras.join(" — ");
  return extra ? `${base} — ${extra}`.slice(0, 1_500) : base;
}

/** PHASE 171 (proposal ج): automated row refused — the day's automated
 *  article already published (one-article/day law, Phase 119). */
async function quotaSkip(queueId: string, lang: "en" | "ar", alreadyPublished: number) {
  const err = await updateQueueItem(queueId, {
    status: "skipped_daily_quota",
    error_message: `p5: daily-quota-${lang} — ${alreadyPublished} automated article(s) created today already published (Phase 119 law, enforced 171)`,
  });
  if (err) console.error(`[blog/p5-publish] Failed to mark skipped_daily_quota: ${err}`);
  return NextResponse.json({
    ok: true,
    step: "p5",
    queueId,
    lang,
    skipped: true,
    reason: "daily-quota-met",
    alreadyPublished,
  });
}
