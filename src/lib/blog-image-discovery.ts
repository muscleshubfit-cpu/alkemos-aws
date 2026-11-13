/**
 * src/lib/blog-image-discovery.ts — BLOG-DIVERSITY-ENGINE · IMAGE
 * DISCOVERY V2 (owner order 2026-11-13 §2 «تحسين البحث عن الصور»).
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT CHANGED vs the legacy P3 sourcing (blog-images.ts
 * fetchFeaturedImage + random pickResultIndex):
 *
 *   LEGACY FAILURE MODES (measured by the owner complaint «نفس الأشخاص
 *   والمشاهد مع تغيير زاوية التصوير»):
 *     1. The COVER query for AR rows was the Arabic focus keyword + Arabic
 *        title — Pexels' Arabic matching is weak → generic gym photos for
 *        every article.
 *     2. imagePlan subjects drifted to the same generic objects ("dumbbell
 *        rack", "healthy meal bowl") for EVERY article → same query → same
 *        photo pool → same scenes.
 *     3. pickResultIndex(variationKey) = Math.random inside that shared
 *        pool — randomness ≠ topical relevance and ≠ visual diversity.
 *     4. Selection trusted alt-text only — the same person/scene from a
 *        different photo or CDN URL was never caught (no pixel inspection).
 *     5. No re-querying: weak/similar results were accepted as-is.
 *
 *   V2 (this module):
 *     • VISUAL BRIEF — one light model call (registry `blog:visual-brief`)
 *       turns the article (title + topic + H2 sections + image plan) into a
 *       precise ENGLISH multi-query plan: a concrete visual description +
 *       4-6 queries, each with a sceneType and 2 alternative phrasings.
 *       Deterministic per-domain fallback queries when the model call
 *       fails (the pipeline NEVER dies on the brief).
 *     • REAL VISUAL INSPECTION — every candidate thumbnail is downloaded
 *       and fingerprinted (64-bit dHash perceptual hash, jpeg-js decode —
 *       pixels, not filenames). Candidates too similar to a recent
 *       article's images (Hamming < NEAR_DUPLICATE_BITS) are REJECTED;
 *       similarity up to SIMILAR_BITS is penalized in ranking.
 *     • RANKED SELECTION — relevance (query ↔ alt overlap + result
 *       position) × visual diversity (Hamming distance to everything
 *       recently used) × scene-type spread — the best candidate wins,
 *       not a random one.
 *     • RE-QUERY LADDER — when every candidate of the primary query is
 *       rejected/excluded, the alternatives are tried BEFORE falling back.
 *     • PAIR COVER SHARING — a bilingual pair (pair_id) shares ONE cover
 *       image: the later language adopts the twin's already-sourced cover
 *       (owner order §3 «صورة مناسبة واحدة للمقالين المرتبطين»), and the
 *       exclusion machinery keeps that image out of UNRELATED articles.
 *
 * SAFETY LAWS UNCHANGED: every query passes sanitizeImageQuery (NSFW +
 * negation + PHASE 173 female-subject stripping) and every candidate's
 * alt-text passes the combined modesty screen — the image-safety.ts choke
 * point stays the single door. Pexels-first, Unsplash/Pixabay failover.
 */

import jpeg from "jpeg-js";
import { parseJSON } from "@/lib/ai-provider";
import { dispatchAI } from "@/lib/ai-router";
import {
  sanitizeImageQuery,
  isExcludedImageUrl,
  hashKey,
} from "@/lib/image-safety";
import {
  classifyPrimaryDomain,
  type DomainId,
} from "@/lib/blog-semantic";
import { fetchImageCandidates, type ImageCandidate } from "@/lib/blog-images";
import { findRecentPairRows } from "@/lib/blog-queue";

// ─────────────────────────────────────────────────────────────────
// Perceptual hashing (dHash 64-bit) — the REAL visual inspection
// ─────────────────────────────────────────────────────────────────

/** Hamming-distance thresholds over the 64-bit dHash. */
export const NEAR_DUPLICATE_BITS = 10; // < 10 → the same photo/scene — REJECT
export const SIMILAR_BITS = 18; // 10..18 → visually close — diversity penalty

/** Decode a JPEG buffer into a 9×8 grayscale matrix (box-sampled). */
function grayscaleMatrix(data: Uint8Array, width: number, height: number): number[][] {
  const GW = 9;
  const GH = 8;
  const gray = new Float64Array(width * height);
  for (let i = 0, p = 0; p < gray.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const out: number[][] = [];
  for (let gy = 0; gy < GH; gy += 1) {
    const row: number[] = [];
    const y0 = Math.floor((gy * height) / GH);
    const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * height) / GH));
    for (let gx = 0; gx < GW; gx += 1) {
      const x0 = Math.floor((gx * width) / GW);
      const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * width) / GW));
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1 && y < height; y += 1) {
        for (let x = x0; x < x1 && x < width; x += 1) {
          sum += gray[y * width + x];
          n += 1;
        }
      }
      row.push(n > 0 ? sum / n : 0);
    }
    out.push(row);
  }
  return out;
}

/** 64-bit difference hash (row-adjacent comparisons over 9×8 gray). */
export function computeDHash(
  data: Uint8Array,
  width: number,
  height: number,
): string | null {
  if (!data || width < 9 || height < 8) return null;
  try {
    const m = grayscaleMatrix(data, width, height);
    let hex = "";
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const bit = m[y][x] < m[y][x + 1] ? 0 : 1;
        hex += bit ? "1" : "0";
      }
    }
    return hex; // 64 chars of 0/1 — readable + debuggable
  } catch {
    return null;
  }
}

/** Hamming distance between two 64-char binary hashes (Infinity on mismatch). */
export function hammingDistance(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let d = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) d += 1;
  return d;
}

/** Decode JPEG bytes → dHash (null for non-JPEG / broken bytes — honest skip). */
export function dHashFromJpegBytes(bytes: Uint8Array): string | null {
  try {
    const img = jpeg.decode(Buffer.from(bytes), {
      useTArray: true,
      maxMemoryUsageInMB: 256,
      formatAsRGBA: true,
    });
    return computeDHash(img.data, img.width, img.height);
  } catch {
    return null;
  }
}

/** Smallest practical variant of a stock CDN URL for hashing (~96px). */
export function thumbnailUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("images.pexels.com")) {
      return `${u.origin}${u.pathname}?auto=compress&cs=tinysrgb&w=96`;
    }
    if (u.hostname.endsWith("images.unsplash.com")) {
      u.searchParams.set("w", "96");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

const MAX_HASH_DOWNLOAD_BYTES = 1_500_000; // 1.5 MB safety cap
const hashCache = new Map<string, string | null>();

/** Download (tiny variant) + fingerprint one image URL; cached, never throws. */
export async function hashImageUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (!url) return null;
  const key = url.split("?")[0];
  if (hashCache.has(key)) return hashCache.get(key) ?? null;
  let hash: string | null = null;
  try {
    const res = await fetchImpl(thumbnailUrl(url), {
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 0 && buf.byteLength <= MAX_HASH_DOWNLOAD_BYTES) {
        hash = dHashFromJpegBytes(buf);
      }
    }
  } catch {
    hash = null;
  }
  if (hashCache.size > 300) hashCache.clear(); // bounded memory
  hashCache.set(key, hash);
  return hash;
}

// ─────────────────────────────────────────────────────────────────
// Deterministic AR→EN image vocabulary + per-domain scene pools
// ─────────────────────────────────────────────────────────────────

/** Common Arabic fitness terms → the English words stock sites match on. */
const AR_EN_IMAGE_TERMS: Record<string, string> = {
  عضلات: "muscle", بناء: "building", تضخيم: "hypertrophy", قوة: "strength",
  تمرين: "workout", تمارين: "workout", تدريب: "training", وزن: "weight",
  اوزان: "weights", دمبل: "dumbbell", بار: "barbell", جيم: "gym",
  نادي: "gym", منزل: "home", منزلي: "home", كارديو: "cardio",
  جري: "running", سباحة: "swimming", دراجة: "cycling", stretching: "stretching",
  اطالة: "stretching", مرونه: "flexibility", يوجا: "yoga", نوم: "sleep",
  تعافي: "recovery", استشفاء: "recovery", راحه: "rest", ارهاق: "fatigue",
  توتر: "stress", مكمل: "supplement", مكملات: "supplements",
  كرياتين: "creatine", بروتين: "protein", واي: "whey", كافيين: "caffeine",
  قهوه: "coffee", مغنيسيوم: "magnesium", فيتامين: "vitamin",
  اوميغا: "omega", زنك: "zinc", حديد: "iron", تغذيه: "nutrition",
  وجبه: "meal", وجبات: "meal", سعرات: "calories", كارب: "carbs",
  كربوهيدرات: "carbohydrates", دهون: "fats", سكر: "sugar", ماء: "water",
  ترطيب: "hydration", الياف: "fiber", خضار: "vegetables", فواكه: "fruit",
  فاكهه: "fruit", دجاج: "chicken", سمك: "fish", لحم: "meat",
  بيض: "eggs", ارز: "rice", شوفان: "oats", لبن: "yogurt", حليب: "milk",
  خساره: "loss", حرق: "burning", بطن: "belly", وزن_الجسم: "bodyweight",
  قف_ال_نفس: "calisthenics", اصابه: "injury", ركبه: "knee", كتف: "shoulder",
  ظهر: "back", الم: "pain", مفصل: "joint", احماء: "warmup",
  وقايه: "prevention", هرمون: "hormone", تستوستيرون: "testosterone",
  ايض: "metabolism", ساركوبينيا: "sarcopenia", تقدم_العمر: "aging",
  دراسه: "study", علمي: "science", ابحاث: "research", دليل: "guide",
  مقارنه: "comparison", خطا: "mistake", اخطاء: "mistakes",
  خرافه: "myth", خطه: "plan", برنامج: "program", جدول: "schedule",
  تحضير: "prep", وصفه: "recipe", مطبخ: "kitchen", تسوق: "groceries",
  ميزانيه: "budget", وقت: "time", سرعه: "speed", تحمل: "endurance",
  قفز: "jump", سحب: "pull", دفع: "push", سكوات: "squat",
  رفعه: "deadlift", ضغط: "press", تكرار: "repetition", مجموعه: "set",
  حميه: "diet", صيام: "fasting", رمضان: "ramadan", جوع: "hunger",
  شبع: "satiety", هضم: "digestion", معده: "stomach", امعاء: "gut",
  ميكروبيوم: "microbiome", منشط: "preworkout", طاقه: "energy",
  تعب: "tired", نتيجه: "results", تقدم: "progress", ثبات: "plateau",
};

/** Translate the strongest Arabic concepts of a text into English query words. */
export function translateArabicToImageEnglish(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\s،,.؛:؟!()\-/]+/)) {
    const w = raw
      .replace(/[\u064B-\u0652\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/^(وال|بال|كال|فال|ال|لل)/, "");
    const en = AR_EN_IMAGE_TERMS[w];
    if (en && !out.includes(en)) out.push(en);
  }
  return out;
}

/** Domain-specific scene pools — DIFFERENT domains default to DIFFERENT
 *  scenes, so even the deterministic fallback never repeats one look. */
const DOMAIN_SCENE_POOLS: Record<DomainId, string[]> = {
  nutrition: [
    "grilled chicken rice meal bowl", "fresh vegetables cutting board",
    "food scale measuring kitchen", "oats berries breakfast bowl",
    "salmon avocado dinner plate", "grocery basket healthy food",
  ],
  "muscle-strength": [
    "barbell squat rack gym", "dumbbell bench press setup",
    "pull up bar grip hands", "lat pulldown machine gym",
    "loaded barbell plates closeup", "chest press machine gym",
  ],
  "fat-loss": [
    "body weighing scale floor", "measuring tape waist closeup",
    "treadmill running cardio gym", "portion control meal plate",
    "high fiber vegetables plate", "calorie tracking notebook",
  ],
  training: [
    "home workout dumbbells living room", "kettlebell wooden floor training",
    "resistance bands exercise home", "workout timer stopwatch gym",
    "push up mat home training", "jump rope outdoor fitness",
  ],
  recovery: [
    "dark quiet bedroom sleep", "foam roller stretching mat",
    "massage gun leg muscles", "legs up wall resting",
    "cold water immersion tub", "relaxation breathing calm",
  ],
  supplements: [
    "protein powder scoop shaker", "creatine jar measuring spoon",
    "vitamin supplement bottles counter", "fish oil capsules closeup",
    "pre workout drink glass gym", "pill organizer weekly box",
  ],
  "injury-prevention": [
    "knee support brace closeup", "resistance band shoulder exercise",
    "athletic tape wrist wrapping", "dynamic warm up stretching gym",
    "foam pad joint protection", "physiotherapy elastic band rehab",
  ],
  "metabolic-aging": [
    "light dumbbells home training", "brisk walking outdoor park",
    "balance pad stability training", "swimming pool lanes adult",
    "resistance band strength senior gym", "stairs climbing fitness",
  ],
  "mistakes-myths": [
    "gym chalk hands barbell", "crumpled paper notes desk",
    "wrong vs right checklist paper", "man thinking confused gym",
    "red flag warning note", "crossed out mistakes list",
  ],
  "research-applied": [
    "science journal papers desk", "microscope laboratory research",
    "data charts graph analysis", "sports science lab testing equipment",
    "researcher notes statistics", "metabolism lab equipment",
  ],
  "practical-guides": [
    "meal prep containers week", "gym bag packed equipment",
    "shopping list groceries planning", "checklist notebook pen",
    "weekly planner schedule desk", "training log journal",
  ],
};

const FALLBACK_SCENE_TYPES = [
  "environment", "equipment", "detail", "food", "person-action", "anatomy",
] as const;
export type SceneType = (typeof FALLBACK_SCENE_TYPES)[number];

/** Deterministic rotation offset so two articles of the same domain still
 *  start at different pool entries (hash of queueId). */
function poolOffset(queueId: string): number {
  return hashKey(queueId) % 6;
}

/** Deterministic EN query plan when the model brief is unavailable. */
export function buildDeterministicQueries(input: {
  lang: "en" | "ar";
  queueId: string;
  topic: string;
  title: string;
  focusKeyword: string;
  domain: DomainId | null;
  slots: number;
}): Array<{ query: string; sceneType: SceneType; alternatives: string[] }> {
  const domain: DomainId = input.domain ?? "training";
  const pool = DOMAIN_SCENE_POOLS[domain];
  const off = poolOffset(input.queueId);
  const rotated = pool.slice(off).concat(pool.slice(0, off));
  const translated = input.lang === "ar" ? translateArabicToImageEnglish(`${input.topic} ${input.focusKeyword}`) : [];
  const ownTerms = input.lang === "ar" ? translated.slice(0, 3) : extractEnglishTerms(`${input.topic} ${input.title}`);

  const coverQuery = [...ownTerms.slice(0, 2), rotated[0].split(" ").slice(-2).join(" ")].join(" ").trim();
  const out: Array<{ query: string; sceneType: SceneType; alternatives: string[] }> = [
    {
      query: coverQuery || rotated[0],
      sceneType: "environment",
      alternatives: [rotated[1], rotated[2]],
    },
  ];
  for (let i = 1; i < Math.max(2, input.slots); i += 1) {
    const base = rotated[(i + 1) % rotated.length];
    out.push({
      query: base,
      sceneType: FALLBACK_SCENE_TYPES[i % FALLBACK_SCENE_TYPES.length],
      alternatives: [rotated[(i + 3) % rotated.length], rotated[(i + 4) % rotated.length]],
    });
  }
  return out;
}

/** Pull the 2-4 most meaningful EN words out of an EN title/topic. */
function extractEnglishTerms(text: string): string[] {
  const stop = new Set(["the", "a", "an", "of", "to", "for", "in", "on", "at", "and", "or", "how", "what", "why", "best", "your", "with", "vs", "is", "are", "do", "does", "guide", "complete", "ultimate"]);
  const words = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w));
  return [...new Set(words)].slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────
// Model visual brief (registry blog:visual-brief-{lang}) + validation
// ─────────────────────────────────────────────────────────────────

export type BriefQuery = { query: string; sceneType: SceneType; alternatives: string[] };
export type VisualBrief = {
  visualDescription: string;
  queries: BriefQuery[];
  source: "model" | "deterministic";
};

const SCENE_TYPES: readonly SceneType[] = [
  "person-action", "equipment", "food", "anatomy", "environment", "detail",
];

/** Model prompt (bilingual input, ENGLISH queries — Pexels matches EN). */
function visualBriefPrompt(input: {
  lang: "en" | "ar";
  topic: string;
  title: string;
  focusKeyword: string;
  sections: string[];
  imagePlanSubjects: string[];
}): string {
  return `You are a stock-photo search strategist for a fitness blog article. Free stock sites are searched in ENGLISH only.

ARTICLE (language: ${input.lang === "ar" ? "Arabic" : "English"})
Title: ${input.title}
Topic: ${input.topic}
Focus keyword: ${input.focusKeyword}
Article sections (H2):
${input.sections.slice(0, 7).map((s, i) => `${i + 1}. ${s}`).join("\n")}
Planned image subjects: ${input.imagePlanSubjects.slice(0, 5).join(" | ")}

TASK — build a PRECISE image search plan (the current pipeline fails because every article searches generic "fitness gym" words and reuses the same photos):
1. "visualDescription": ONE concrete sentence describing the single cover image that fits THIS article's core idea (name the actual objects/scene/action — never "a fitness image").
2. "queries": 4 to 6 search queries, ALL IN ENGLISH, 2 to 7 words each, each describing a DIFFERENT visual scene that DIRECTLY illustrates one section of THIS article (specific equipment, food, body area, environment or action from the article).
   - Scene spread (mandatory): across the queries use at least 3 DIFFERENT sceneType values from: person-action (adult men only if people appear), equipment, food, anatomy, environment, detail.
   - SPECIFICITY (mandatory): a query naming the article's actual subject beats any generic word — "kettlebell goblet squat home" beats "workout"; "casein yogurt night meal" beats "food".
   - FORBIDDEN: standalone generic words (fitness, gym, workout, health alone), brand names, and any female subject wording (the site's image law: no women/girls in photos; adult men or non-human subjects only).
   - Each query carries exactly 2 alternative phrasings in "alternatives" (different wording, same scene idea) used when the primary returns weak results.
Return STRICT JSON only, no markdown fences:
{"visualDescription":"...","queries":[{"query":"english search query","sceneType":"person-action|equipment|food|anatomy|environment|detail","alternatives":["alt phrasing","alt phrasing"]}]}`;
}

/** Validate a parsed brief payload → BriefQuery[] | null. */
export function validateBriefQueries(
  raw: unknown,
  slots: number,
): BriefQuery[] | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.queries)) return null;
  const out: BriefQuery[] = [];
  const seen = new Set<string>();
  for (const q of r.queries) {
    if (typeof q !== "object" || q === null) continue;
    const qr = q as Record<string, unknown>;
    const query = String(qr.query ?? "").trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 8) continue;
    if (!/^[a-z0-9\s\-']+$/.test(query)) continue; // English-only for stock search
    if (seen.has(query)) continue;
    const sceneType = SCENE_TYPES.includes(String(qr.sceneType) as SceneType)
      ? (String(qr.sceneType) as SceneType)
      : "environment";
    const alternatives = Array.isArray(qr.alternatives)
      ? qr.alternatives
          .map((a) => String(a ?? "").trim().toLowerCase())
          .filter((a) => a.split(/\s+/).length >= 2 && a.split(/\s+/).length <= 8 && /^[a-z0-9\s\-']+$/.test(a))
          .slice(0, 2)
      : [];
    seen.add(query);
    out.push({ query, sceneType, alternatives });
    if (out.length >= Math.max(slots, 5)) break;
  }
  if (out.length < 3) return null;
  const sceneSpread = new Set(out.map((q) => q.sceneType));
  if (sceneSpread.size < 3) return null; // the scene-spread law
  return out;
}

/** Build the visual brief: model first, deterministic fallback — never throws. */
export async function buildVisualBrief(input: {
  lang: "en" | "ar";
  queueId: string;
  topic: string;
  title: string;
  focusKeyword: string;
  sections: string[];
  imagePlanSubjects: string[];
  slots: number;
}): Promise<VisualBrief> {
  const fallback = (): VisualBrief => ({
    visualDescription: "deterministic domain-scene plan",
    queries: buildDeterministicQueries({
      lang: input.lang,
      queueId: input.queueId,
      topic: input.topic,
      title: input.title,
      focusKeyword: input.focusKeyword,
      domain: classifyPrimaryDomain(`${input.topic} ${input.title} ${input.focusKeyword}`),
      slots: input.slots,
    }),
    source: "deterministic",
  });

  try {
    const { text } = await dispatchAI(`blog:visual-brief-${input.lang}`, visualBriefPrompt(input), {
      systemPrompt:
        "You are a strict JSON API endpoint. The user message describes a fitness article; your ENTIRE response MUST be a single valid JSON object matching the requested schema — no prose, no markdown, no code fences. All query values are in ENGLISH.",
    });
    const parsed = parseJSON<Record<string, unknown>>(text);
    const queries = validateBriefQueries(parsed, input.slots);
    if (!queries) {
      console.warn("[blog-image-discovery] visual brief invalid — deterministic plan");
      return fallback();
    }
    return {
      visualDescription: String(parsed?.visualDescription ?? "").slice(0, 300),
      queries,
      source: "model",
    };
  } catch (e) {
    console.warn(
      `[blog-image-discovery] visual brief model call failed — deterministic plan: ${e instanceof Error ? e.message : e}`,
    );
    return fallback();
  }
}

// ─────────────────────────────────────────────────────────────────
// Ranked selection (pure) + re-query ladder
// ─────────────────────────────────────────────────────────────────

export type RankContext = {
  query: string;
  sceneType?: SceneType;
  /** dHashes of recent articles' images + already-picked images this run. */
  usedHashes: string[];
  pickedSceneTypes: SceneType[];
  excludeUrls: string[];
};

export type RankedCandidate = {
  candidate: ImageCandidate;
  score: number;
  relevance: number;
  diversity: number;
  hamming: number;
  rejected?: "excluded" | "near-duplicate";
};

/** Query↔alt token overlap (0..1). */
function altRelevance(query: string, alt: string): number {
  const qs = new Set(query.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  if (qs.size === 0 || !alt) return 0;
  const as = new Set(alt.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2));
  let hit = 0;
  for (const w of qs) if (as.has(w)) hit += 1;
  return hit / qs.size;
}

/**
 * Rank candidates: relevance (alt overlap + result position) × visual
 * diversity (min Hamming distance to everything used) × scene spread.
 * Near-duplicates (Hamming < NEAR_DUPLICATE_BITS) are REJECTED outright.
 */
export function rankImageCandidates(
  candidates: ImageCandidate[],
  ctx: RankContext,
  hashes: Map<string, string | null>,
): RankedCandidate[] {
  const out: RankedCandidate[] = [];
  for (const c of candidates) {
    if (isExcludedImageUrl(c.url, ctx.excludeUrls)) {
      out.push({ candidate: c, score: 0, relevance: 0, diversity: 0, hamming: Number.POSITIVE_INFINITY, rejected: "excluded" });
      continue;
    }
    const qTokens = ctx.query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const relevance = Math.min(
      1,
      altRelevance(ctx.query, c.alt) * 0.7 +
        Math.max(0, 1 - (c.rank ?? 0) * 0.04) * 0.3 +
        (qTokens.length > 0 && qTokens.every((t) => c.alt.toLowerCase().includes(t)) ? 0.15 : 0),
    );
    const hash = hashes.get(c.url) ?? null;
    let diversity = 0.5; // unknown hash (download/decode failed) — neutral
    let hamming = Number.POSITIVE_INFINITY;
    if (hash && ctx.usedHashes.length > 0) {
      hamming = Math.min(...ctx.usedHashes.map((h) => hammingDistance(hash, h)));
      if (hamming < NEAR_DUPLICATE_BITS) {
        out.push({ candidate: c, score: 0, relevance, diversity: 0, hamming, rejected: "near-duplicate" });
        continue;
      }
      diversity = hamming >= 24 ? 1 : hamming >= SIMILAR_BITS ? 0.75 : hamming >= NEAR_DUPLICATE_BITS ? 0.35 : 0.1;
    } else if (hash) {
      diversity = 1; // hashable and nothing to compare against
    }
    const scenePenalty =
      ctx.sceneType && ctx.pickedSceneTypes.includes(ctx.sceneType) ? 0.85 : 1;
    out.push({
      candidate: c,
      score: (relevance * 0.5 + diversity * 0.5) * scenePenalty,
      relevance,
      diversity,
      hamming,
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────
// Twin cover sharing (bilingual pair = ONE cover image)
// ─────────────────────────────────────────────────────────────────

export type SourcedImageLite = { url: string; alt: string; credit: string };

/**
 * The later-published language of a bilingual pair adopts the twin's
 * already-sourced cover (owner order §3). Best-effort by the pairing law:
 * any failure → null → the normal discovery path runs.
 */
export async function findTwinCover(
  pairId: string | null | undefined,
  myLang: "en" | "ar",
): Promise<SourcedImageLite | null> {
  if (!pairId) return null;
  try {
    const rows = await findRecentPairRows(pairId);
    const twin = rows.find((r) => r.language && r.language !== myLang);
    if (!twin) return null;
    const inFlight = ["images_done", "reviewed", "published"].includes(twin.status ?? "");
    if (!inFlight) return null;
    const bundle = twin.article_bundle ? JSON.parse(twin.article_bundle) : null;
    const imgs = Array.isArray(bundle?.images) ? bundle.images : [];
    const cover = imgs[0];
    if (cover && typeof cover.url === "string" && cover.url.startsWith("http")) {
      return {
        url: cover.url,
        alt: String(cover.alt ?? ""),
        credit: String(cover.credit ?? ""),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// The P3 orchestrator — multi-query, ranked, visually-verified sourcing
// ─────────────────────────────────────────────────────────────────

export type ImageDiscoveryResult = {
  images: Array<SourcedImageLite & { sceneType?: SceneType }>;
  diagnostics: {
    briefSource: "model" | "deterministic";
    visualDescription: string;
    twinCoverAdopted: boolean;
    queries: Array<{ query: string; results: number; picked?: string; requeryUsed: boolean; rejectedNearDup?: number }>;
    hashes: Record<string, string>;
    nearDuplicateRejected: number;
  };
};

/** How many candidates per query get the (download+decode) visual check. */
const MAX_HASHED_CANDIDATES_PER_QUERY = 8;

export async function selectImagesWithDiscovery(input: {
  lang: "en" | "ar";
  queueId: string;
  topic: string;
  title: string;
  focusKeyword: string;
  sections: string[];
  imagePlanSubjects: string[];
  pairId?: string | null;
  excludeUrls: string[];
  recentImageUrls: string[];
  minImages: number;
  maxImages: number;
}): Promise<ImageDiscoveryResult> {
  const slots = Math.max(3, Math.min(input.maxImages, 5));
  const diagnostics: ImageDiscoveryResult["diagnostics"] = {
    briefSource: "deterministic",
    visualDescription: "",
    twinCoverAdopted: false,
    queries: [],
    hashes: {},
    nearDuplicateRejected: 0,
  };

  // 0) PAIR COVER SHARING — adopt the twin's cover when it exists.
  const picked: Array<SourcedImageLite & { sceneType?: SceneType }> = [];
  const pickedSceneTypes: SceneType[] = [];
  const twinCover = await findTwinCover(input.pairId, input.lang);
  if (twinCover) {
    picked.push(twinCover);
    pickedSceneTypes.push("environment");
    diagnostics.twinCoverAdopted = true;
    console.log(`[blog-image-discovery] pair ${input.pairId}: adopted the twin's cover (${twinCover.url.split("?")[0]})`);
  }

  // 1) VISUAL BRIEF (model → deterministic fallback).
  const brief = await buildVisualBrief({
    lang: input.lang,
    queueId: input.queueId,
    topic: input.topic,
    title: input.title,
    focusKeyword: input.focusKeyword,
    sections: input.sections,
    imagePlanSubjects: input.imagePlanSubjects,
    slots,
  });
  diagnostics.briefSource = brief.source;
  diagnostics.visualDescription = brief.visualDescription;

  // 2) Fingerprints of everything recently used (featured + body images).
  const recentHashes: string[] = [];
  for (const url of input.recentImageUrls.slice(0, 30)) {
    const h = await hashImageUrl(url);
    if (h) {
      recentHashes.push(h);
      diagnostics.hashes[url.split("?")[0]] = h;
    }
  }

  // 3) Per-slot sourcing with the re-query ladder.
  const briefQueries = brief.queries.slice(0, slots - picked.length);
  for (let qi = 0; qi < briefQueries.length && picked.length < slots; qi += 1) {
    const bq = briefQueries[qi];
    const attempts = [bq.query, ...bq.alternatives].map((q) => sanitizeImageQuery(q).query).filter(Boolean);
    let chosen: (SourcedImageLite & { sceneType?: SceneType }) | null = null;
    let requeryUsed = false;
    let resultsCount = 0;
    let rejectedNearDup = 0;

    for (const rawQuery of attempts.slice(0, 3)) {
      const candidates = await fetchImageCandidates(rawQuery, {
        variationKey: `${input.queueId}-${qi}`,
        excludeUrls: input.excludeUrls,
        limit: 12,
      });
      resultsCount = Math.max(resultsCount, candidates.length);
      if (candidates.length === 0) {
        requeryUsed = true;
        continue; // weak results → re-phrase (owner order §2.7)
      }
      const hashes = new Map<string, string | null>();
      for (const c of candidates.slice(0, MAX_HASHED_CANDIDATES_PER_QUERY)) {
        const h = await hashImageUrl(c.url);
        hashes.set(c.url, h);
        if (h) diagnostics.hashes[c.url.split("?")[0]] = h;
      }
      const ranked = rankImageCandidates(
        candidates,
        {
          query: rawQuery,
          sceneType: bq.sceneType,
          usedHashes: [...recentHashes, ...picked
            .map((p) => diagnostics.hashes[p.url.split("?")[0]])
            .filter((h): h is string => Boolean(h))],
          pickedSceneTypes,
          excludeUrls: input.excludeUrls,
        },
        hashes,
      );
      rejectedNearDup = ranked.filter((r) => r.rejected === "near-duplicate").length;
      const best = ranked.find((r) => !r.rejected && r.candidate.url);
      if (best && best.score > 0) {
        chosen = {
          url: best.candidate.url,
          alt: best.candidate.alt || rawQuery,
          credit: best.candidate.credit,
          sceneType: bq.sceneType,
        };
        pickedSceneTypes.push(bq.sceneType);
        break;
      }
      requeryUsed = true; // all rejected/excluded → try the alternative phrasing
    }

    diagnostics.queries.push({
      query: attempts[0] ?? bq.query,
      results: resultsCount,
      picked: chosen?.url,
      requeryUsed,
      rejectedNearDup: rejectedNearDup || undefined,
    });
    if (chosen) {
      picked.push(chosen);
      diagnostics.nearDuplicateRejected += rejectedNearDup;
    } else {
      diagnostics.nearDuplicateRejected += rejectedNearDup;
    }
  }

  // 4) MIN-fill: unused brief alternatives first, then domain pool queries.
  if (picked.length < input.minImages) {
    const spare: string[] = [];
    for (const bq of brief.queries) {
      for (const q of [bq.query, ...bq.alternatives]) {
        const s = sanitizeImageQuery(q).query;
        if (s && !spare.includes(s)) spare.push(s);
      }
    }
    const domain = classifyPrimaryDomain(`${input.topic} ${input.title} ${input.focusKeyword}`);
    if (domain) {
      for (const q of DOMAIN_SCENE_POOLS[domain]) {
        const s = sanitizeImageQuery(q).query;
        if (s && !spare.includes(s)) spare.push(s);
      }
    }
    for (const q of spare) {
      if (picked.length >= input.minImages) break;
      const img = await fetchImageCandidates(q, {
        variationKey: `${input.queueId}-fill-${picked.length}`,
        excludeUrls: [...input.excludeUrls, ...picked.map((p) => p.url)],
        limit: 8,
      }).then((cands) => {
        if (cands.length === 0) return null;
        const ranked = rankImageCandidates(
          cands,
          {
            query: q,
            usedHashes: [...recentHashes, ...picked
              .map((p) => diagnostics.hashes[p.url.split("?")[0]])
              .filter((h): h is string => Boolean(h))],
            pickedSceneTypes,
            excludeUrls: [...input.excludeUrls, ...picked.map((p) => p.url)],
          },
          new Map(), // fill path: positional relevance only
        );
        const best = ranked.find((r) => !r.rejected && r.candidate.url);
        return best
          ? { url: best.candidate.url, alt: best.candidate.alt || q, credit: best.candidate.credit }
          : null;
      });
      if (img) picked.push(img);
    }
  }

  return {
    images: picked.slice(0, input.maxImages),
    diagnostics,
  };
}
