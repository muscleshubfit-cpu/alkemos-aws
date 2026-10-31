/**
 * src/lib/blog-pairing.ts — PHASE 157 · SEO-GEO-5.0 bilingual pairing core.
 *
 * Owner directive «نفذ توصيتك» = Proposal 1 of the bilingual generation
 * study: ONE daily topic → TWO queue rows (en + ar) sharing a `pair_id`
 * and a sealed `sharedBrief` inside each row's article_bundle. Each
 * language then executes its FULL P1→P5 pipeline BY ITSELF, in its own
 * geography-anchored window (AR 05:00 UTC · EN 22:00 UTC — the Phase 119
 * tables are preserved verbatim). Content is WRITTEN FROM SCRATCH per
 * language (topic + shared angle only — never translation): native
 * meta/keywords/FAQs per language, latin slugs (M15 law), per-language
 * dedup — the V3 per-language quality bar is untouched.
 *
 * PROTOCOL (P0): adopt → join → create, with a FULL degradation ladder.
 *   • ADOPT   : my language already has a researched row with pair_id +
 *               valid sharedBrief (≤48h) → reuse it (the other language's
 *               earlier window created my row for me).
 *   • JOIN    : the OTHER language's pair row exists (≤30h) but my side
 *               was never created (best-effort insert failed) → create MY
 *               row only, copying pair_id + sharedBrief from the twin.
 *   • CREATE  : I'm first → research BOTH languages + a small pairing
 *               call picks topicEn/topicAr/shared angle → insert TWO rows.
 *   • ANY failure (pairing call, validation, missing pair_id column =
 *               0076 not applied) → EXACT legacy V3 behavior: a single
 *               unpaired row. Blind pairing is FORBIDDEN — a wrong pair
 *               is worse than no pair.
 *
 * P5 HANDSHAKE: the later-published side fills its own linked_post_id AND
 * the twin's (bidirectional) — hreflang (blog-sitemap) + LanguageToggle
 * light up automatically per pair. Best-effort: never fails the publish.
 *
 * This module is intentionally split so every pure piece is unit-testable
 * without a DB (see __tests__/blog-pairing.test.ts — 22 tests).
 */
import { randomUUID } from "crypto";
import { parseJSON } from "./ai-provider";
// R4 (AI-Router unification): pairing rides the registry (blog:pairing —
// the measured CF 70b fixed-lead + ordinary-chain fallback).
import { dispatchAI } from "./ai-router";
import { type LanguageResearch } from "./blog-research";
import { ARTICLE_ANGLES } from "./blog-pipeline";
// PHASE 171 (blog-audit proposal ب): parsePairingJSON rides the
// 161.5-hardened parseJSON from ai-provider (was the weak parseJSONLoose —
// strict-only, no truncation repair / control-char escaping).

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

/** The sealed per-pair agreement stored in article_bundle.sharedBrief. */
export type SharedBrief = {
  pairId: string;
  topicEn: string;
  topicAr: string;
  /** One of ARTICLE_ANGLES ids — both twins build their outline around it. */
  angleId: string;
  /** ISO timestamp of when the brief was sealed (drives the freshness window). */
  sealedAt: string;
};

/** Structural view of a queue row needed for pairing decisions (tests feed literals). */
export type PairRowView = {
  id: string;
  language?: string | null;
  status?: string | null;
  pair_id?: string | null;
  created_at?: string | null;
};

export type PairingChoice = {
  topicEn: string;
  topicAr: string;
  angleId: string;
};

// ─────────────────────────────────────────────────────────────────
// Angle registry access (single source: ARTICLE_ANGLES in blog-pipeline)
// ─────────────────────────────────────────────────────────────────

export function isValidAngleId(id: unknown): id is string {
  return (
    typeof id === "string" && ARTICLE_ANGLES.some((a) => a.id === id)
  );
}

// ─────────────────────────────────────────────────────────────────
// Freshness windows (STATE 157 law — AUDIT_REPORT §9-المرحلة 2, item 5,
// 2026-09-29: widened 48h→72h adopt · 30h→48h join).
//
// DIAGNOSIS (live data, 2026-09-29): of 53 pair-era queue rows only 4
// carried a pair_id (7.5%) — and the binding constraint was NEVER the
// windows (the 2 complete pairs were consumed 0.0h apart; zero stale
// 'researched' rows existed) — it was the ONE-SHOT pairing call failing
// on the free chain (chain failure + strict JSON laws → legacy).
// The widening is resilience for the REAL failure mode: a language's
// window failing for 1-2 days (23% row failures measured) leaves its
// twin row unadopted — at 48h it expired forever; at 72h a second-day
// run still adopts it (evergreen fitness content — a 3-day-old research
// brief is still fresh; news it is not).
// ─────────────────────────────────────────────────────────────────

export const ADOPT_MAX_AGE_HOURS = 72;
export const JOIN_MAX_AGE_HOURS = 48;

function ageHours(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (now.getTime() - t) / 3_600_000;
}

// ─────────────────────────────────────────────────────────────────
// extractSharedBrief — read + fully validate a sealed brief
// ─────────────────────────────────────────────────────────────────

const MIN_TOPIC_CHARS = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extracts the sharedBrief from a queue row's article_bundle and validates
 * EVERY law: shape, uuid pairId, topic lengths, known angleId, freshness
 * (≤ maxAgeHours between sealedAt and `now`, injectable for tests).
 * Returns null for legacy rows, raw/garbage bundles, unknown angles and
 * stale briefs — callers degrade to the exact legacy V3 behavior.
 */
export function extractSharedBrief(
  bundle: unknown,
  opts?: { now?: Date; maxAgeHours?: number },
): SharedBrief | null {
  const now = opts?.now ?? new Date();
  const maxAgeHours = opts?.maxAgeHours ?? ADOPT_MAX_AGE_HOURS;

  // Raw text (double-encoded bundle or garbage) is NOT a brief.
  if (typeof bundle !== "object" || bundle === null || Array.isArray(bundle)) return null;
  const raw = (bundle as Record<string, unknown>).sharedBrief;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

  const b = raw as Record<string, unknown>;
  const pairId = typeof b.pairId === "string" ? b.pairId.trim() : "";
  const topicEn = typeof b.topicEn === "string" ? b.topicEn.trim() : "";
  const topicAr = typeof b.topicAr === "string" ? b.topicAr.trim() : "";
  const angleId = typeof b.angleId === "string" ? b.angleId.trim() : "";
  const sealedAt = typeof b.sealedAt === "string" ? b.sealedAt.trim() : "";

  if (!UUID_RE.test(pairId)) return null;
  if (topicEn.length < MIN_TOPIC_CHARS || topicAr.length < MIN_TOPIC_CHARS) return null;
  if (!isValidAngleId(angleId)) return null;

  const age = ageHours(sealedAt, now);
  if (age === null || age < 0 || age > maxAgeHours) return null;

  return { pairId, topicEn, topicAr, angleId, sealedAt };
}

// ─────────────────────────────────────────────────────────────────
// isAdoptablePairRow — structural adoptability check (no DB, pure)
// ─────────────────────────────────────────────────────────────────

/**
 * TRUE iff the row is MY language, still `researched`, carries a pair_id,
 * is well-formed, and was created within the freshness window (≤48h by
 * default — injectable `now`/`maxAgeHours` keep this deterministic in
 * tests). The brief itself is validated separately (extractSharedBrief).
 */
export function isAdoptablePairRow(
  row: unknown,
  myLang: "en" | "ar",
  opts?: { now?: Date; maxAgeHours?: number },
): boolean {
  const now = opts?.now ?? new Date();
  const maxAgeHours = opts?.maxAgeHours ?? ADOPT_MAX_AGE_HOURS;

  if (typeof row !== "object" || row === null || Array.isArray(row)) return false;
  const r = row as PairRowView;
  if (typeof r.id !== "string" || r.id.length === 0) return false;
  if (r.language !== myLang) return false;
  if (r.status !== "researched") return false;
  if (typeof r.pair_id !== "string" || !UUID_RE.test(r.pair_id)) return false;

  const age = ageHours(r.created_at, now);
  if (age === null || age < 0 || age > maxAgeHours) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────
// PHASE 162 — coach topic override (pure, unit-tested)
// ─────────────────────────────────────────────────────────────────

/**
 * Seal the coach's topic into MY side of a sealed brief, immutably.
 * The twin side, pairId, angleId and sealedAt are untouched — the pair
 * stays fully valid (extractSharedBrief laws hold); only MY article's
 * subject becomes the coach's. Pure so P0's CREATE path stays trivially
 * testable without a DB.
 */
export function withCoachTopic(
  brief: SharedBrief,
  lang: "en" | "ar",
  topic: string,
): SharedBrief {
  return lang === "ar" ? { ...brief, topicAr: topic } : { ...brief, topicEn: topic };
}

// ─────────────────────────────────────────────────────────────────
// parsePairingJSON — validate the pairing model's JSON (hard laws)
// ─────────────────────────────────────────────────────────────────

const ARABIC_RE = /[\u0600-\u06FF]/;
const LATIN_LETTER_RE = /[A-Za-z]/;

/**
 * Parses + validates the pairing call's JSON against HARD laws:
 *   • topicEn MUST be one of the EN candidates (literal, trimmed) — the
 *     pairing model curates, it never invents English topics.
 *   • topicAr MAY be a literal AR candidate OR a NEW Arabic long-tail
 *     phrasing (must contain Arabic script, no Latin letters, min length).
 *   • angleId MUST be a known ARTICLE_ANGLES id.
 *   • Both topics respect the minimum length.
 * ANY violation → null (route degrades to legacy V3 — blind pairing is
 * forbidden: a wrong pair is worse than no pair).
 */
export function parsePairingJSON(
  text: string,
  ctx: { enCandidates: string[]; arCandidates: string[] },
): PairingChoice | null {
  const parsed = parseJSON<Record<string, unknown>>(text);
  if (!parsed || typeof parsed !== "object") return null;

  const topicEn = typeof parsed.topicEn === "string" ? parsed.topicEn.trim() : "";
  const topicAr = typeof parsed.topicAr === "string" ? parsed.topicAr.trim() : "";
  const angleId = typeof parsed.angleId === "string" ? parsed.angleId.trim() : "";

  if (topicEn.length < MIN_TOPIC_CHARS || topicAr.length < MIN_TOPIC_CHARS) return null;
  if (!ctx.enCandidates.some((c) => c.trim() === topicEn)) return null;
  if (!isValidAngleId(angleId)) return null;

  const arIsLiteral = ctx.arCandidates.some((c) => c.trim() === topicAr);
  const arIsNewArabicPhrasing =
    ARABIC_RE.test(topicAr) && !LATIN_LETTER_RE.test(topicAr);
  if (!arIsLiteral && !arIsNewArabicPhrasing) return null;

  return { topicEn, topicAr, angleId };
}

// ─────────────────────────────────────────────────────────────────
// runPairingSelection — the small pairing call (≤400 output tokens)
// ─────────────────────────────────────────────────────────────────

export type PairingSelectionResult = PairingChoice & { source: string };

/**
 * ONE small model call over BOTH languages' research: picks topicEn from
 * the (already dup-filtered) EN candidates, topicAr from the AR candidates
 * or a NEW Arabic long-tail phrasing of the same daily subject, and ONE
 * shared article angle id. Throws on any invalid output — the route
 * catches and degrades to legacy V3 (never pairs blindly).
 *
 * AUDIT_REPORT §9-المرحلة 2, item 5 (2026-09-29) — the RETRY law: the
 * pairing call was ONE shot on a free chain that fails often (measured:
 * only 2 complete pairs in the whole pair era). It now runs up to
 * PAIRING_MAX_ATTEMPTS times (fresh chain call per attempt — the chain's
 * provider-lead rotation changes between attempts) with a short backoff;
 * a lightweight ≤400-token call, so the extra attempts cost seconds, and
 * P0's total budget still fits the GHA step comfortably. A wrong pair
 * stays worse than no pair: every parse/validation law is UNCHANGED —
 * retries only fight transport/model failure, never the strict JSON
 * contract.
 *
 * PHASE 5-E / stage هـ (owner order 2026-10-31 «نفّذ جميع المراحل
 * المتبقية» approving Phase-4 §12-6, the Phase-1 §8-6 precedent): the
 * retry budget is RAISED 2→3 and the chain walk deepened maxModels 3→4
 * (the P4 precedent — more healthy entries beat two leading hiccups),
 * AND the resume path gained its own pairing entry point
 * (runResumePairingSelection below) — pairing was CREATE-only and
 * resumed rows published unpaired forever (the measured 0/6 alert
 * root, frame 380).
 */
export const PAIRING_MAX_ATTEMPTS = 3;

export async function runPairingSelection(
  enResearch: LanguageResearch,
  arResearch: LanguageResearch,
): Promise<PairingSelectionResult> {
  const angleList = ARTICLE_ANGLES.map((a) => a.id).join("|");
  const prompt = `You are a bilingual SEO editor pairing ONE daily topic for a fitness blog.
Pick:
1. "topicEn": copy ONE of the EN candidates EXACTLY (no rewriting).
2. "topicAr": copy ONE of the AR candidates EXACTLY, or write ONE new Arabic long-tail topic phrasing the same daily subject for Arab searchers (natural Arabic only).
3. "angleId": ONE shared article-type id from: ${angleList} — the type that best fits the subject for BOTH languages.

EN CANDIDATES:
${enResearch.topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

AR CANDIDATES:
${arResearch.topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Return STRICT JSON only:
{"topicEn":"<exact EN candidate>","topicAr":"<exact AR candidate or new natural Arabic topic>","angleId":"<one id>"}`;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= PAIRING_MAX_ATTEMPTS; attempt += 1) {
    try {
      // R4: policy (0.3 · 400 · json · 45s · depth 4 — the §10-هـ deep walk
      // riding the CF role lead) resolves from the registry.
      const { text, model, provider } = await dispatchAI("blog:pairing", prompt);
      const choice = parsePairingJSON(text, {
        enCandidates: enResearch.topics,
        arCandidates: arResearch.topics,
      });
      if (choice) {
        console.log(
          `[blog-pairing] paired (${provider}:${model}, attempt ${attempt}) angle=${choice.angleId}`,
        );
        return { ...choice, source: `${provider}:${model}` };
      }
      // Valid transport, invalid payload: retry the whole chain (the
      // next attempt rotates the leading provider).
      lastError = new Error(`pairing: invalid JSON from ${provider}:${model}`);
      console.warn(`[blog-pairing] attempt ${attempt} invalid — ${lastError.message}`);
    } catch (e) {
      // The chain itself died (all walked models failed) — the primary
      // measured failure mode. Retry once with a fresh chain walk.
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`[blog-pairing] attempt ${attempt} chain failure — ${lastError.message}`);
    }
  }
  throw lastError ?? new Error("pairing: all attempts failed");
}

// ─────────────────────────────────────────────────────────────────
// PHASE 5-E / stage هـ — RESUME PAIRING (JOIN at resume)
// ─────────────────────────────────────────────────────────────────

/**
 * The RESUME-path pairing entry point (Phase-4 §10-هـ-1, the Phase-1
 * §8-6(أ) recommendation — «جعل مسار الاستئناف يقرن (JOIN عند
 * RESUME) — يعالج جذر تنبيه 0/6 مباشرة»).
 *
 * THE MEASURED ROOT (frame 380 + the Phase-1 audit §2.4): pairing ran
 * at CREATE only. When BOTH languages' pairing calls failed (the free
 * chain's old failure mode), each language landed a LEGACY unpaired
 * row — and from then on every run RESUMED those rows (≤48h) instead
 * of creating new ones, so no pairing call EVER ran again: the rows
 * published unpaired forever (the 0/6 queue-health alert).
 *
 * THE FIX — the anti-blind law PRESERVED BY CONSTRUCTION: both rows
 * already exist with their OWN sealed topics (my row may even have
 * completed outline/content around its topic). So each language's
 * candidate set is constrained to EXACTLY ONE topic — the row's own
 * topic. parsePairingJSON's hard law (topicEn ∈ enCandidates, literal)
 * then forces the model to echo both rows' topics VERBATIM or fail —
 * the sealed brief can never rewrite either side's subject. What the
 * call actually picks is the ONE shared angle (ARTICLE_ANGLES id), the
 * only pairing decision that was never row-local. A wrong pair stays
 * worse than no pair: on ANY failure the caller degrades to the exact
 * plain-resume behavior (unpaired, honest).
 */
export type ResumePairInputs = {
  myLang: "en" | "ar";
  /** MY resumable row's own topic (sealed — never rewritten). */
  myTopic: string;
  /** MY row's bundle research (topics are replaced by [myTopic]). */
  myResearch: LanguageResearch;
  /** The OTHER language's candidate row topic (sealed — never rewritten). */
  otherTopic: string;
  /** The other row's bundle research (topics replaced by [otherTopic]). */
  otherResearch: LanguageResearch;
};

export async function runResumePairingSelection(
  inputs: ResumePairInputs,
): Promise<SharedBrief> {
  const { myLang, myTopic, myResearch, otherTopic, otherResearch } = inputs;
  const enResearch: LanguageResearch =
    myLang === "en"
      ? { ...myResearch, topics: [myTopic] }
      : { ...otherResearch, topics: [otherTopic] };
  const arResearch: LanguageResearch =
    myLang === "ar"
      ? { ...myResearch, topics: [myTopic] }
      : { ...otherResearch, topics: [otherTopic] };

  const choice = await runPairingSelection(enResearch, arResearch);
  return {
    pairId: randomUUID(),
    topicEn: choice.topicEn,
    topicAr: choice.topicAr,
    angleId: choice.angleId,
    sealedAt: new Date().toISOString(),
  };
}
