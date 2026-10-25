/**
 * AI Job Processors — the execution registry used by the native GitHub
 * Actions runner (scripts/ai-jobs-runner/process.mts).
 *
 * OWNER DIRECTIVE (2026-08-27): ALL batch AI runs here, never on Vercel.
 * EVO chat alone stays on Vercel streaming and does NOT appear here.
 *
 * Each processor receives the SANITIZED payload stored by the enqueue API
 * route (see src/lib/ai-jobs.ts sanitizeJobPayload) and returns a JSON
 * result that gets persisted into ai_jobs.result by the runner.
 */

import { callFreeAIFallbackChain, parseJSON } from "@/lib/ai-provider";
import {
  generateNutritionPlanAI,
  generateWorkoutPlanAI,
  regenerateMeal,
  regenerateFoodItem,
  regenerateWorkoutDay,
  substituteExercise,
} from "@/lib/plan-generator";
import { DIET_TYPES, type DietType } from "@/lib/diet-types";
import type { ClientContext } from "@/lib/ai-local";
import { generateSocialPost } from "@/lib/social-posts";
import { pickSmartTopic } from "@/lib/blog-topics";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

import { weeksUnitAr } from "@/lib/utils";
import type { PlanContent } from "@/lib/data/plans";
import type { SocialPlatform, SocialTone } from "@/lib/social-posts";
import { VALID_CATEGORY_IDS } from "@/lib/blog";
import { articleSlugFromTitle } from "@/lib/ai-jobs-client";
import { resolveSlug, sanitizeModelSlug } from "@/lib/slug";
import { AR_MSA_EDITOR_LAW } from "@/lib/blog-msa";
// AUDIT_REPORT §9-المرحلة 1, item 2 (2026-09-29): the single-shot
// fallback generator composes the SAME canonical law blocks as the
// automated pipeline (blog-editorial-law.ts) — its previous inline
// paraphrases were the audit's F8 fork (two systems, drifting specs).
import {
  EDITORIAL_ANSWER_FIRST,
  EDITORIAL_EEAT,
  EDITORIAL_FACT_GUARD,
  EDITORIAL_FAQ_COUNT_RANGE,
} from "@/lib/blog-editorial-law";
import {
  fetchFeaturedImage,
  embedBodyImages,
  getRecentFeaturedImageUrls,
  type SourcedImage,
} from "@/lib/blog-images";
import { sanitizeImageQuery } from "@/lib/image-safety";
import { loadEvoNutritionKnowledge } from "@/lib/evo-nutrition-knowledge.server";
// SWAP-DURABILITY 2026-10-25: the runner materializes gated meal/item swaps
// into the owning plans row — the same pure totals math the coach editor
// uses, imported from the zero-dep leaf (type-only from the generator).
import { recomputeNutritionTotals } from "@/lib/nutrition-totals";
import type { NutritionPlanContent } from "@/lib/plan-generator";

/* ─────────────────── SWAP-DURABILITY 2026-10-25 (owner order item 1) ───────────────────
 *
 * THE MEASURED PRODUCTION DEFECT this law kills: both swap jobs enqueued
 * 2026-10-25 13:29Z (ai_jobs 2384a8a9 food_item + 3ee1bcea meal, the
 * owner's own live test) finished `done` on the runner — and their results
 * NEVER reached the client's saved plan. The old contract kept the swap
 * result ONLY inside ai_jobs.result + a browser poller (runAiJob) that
 * dies the moment the coach navigates off the plan editor mid-wait
 * (measured: the coach opened ANOTHER client's page 81 seconds after
 * enqueuing). Full-plan generation already had the registry +
 * server-side draft materialization law; articles got theirs after the
 * «watched success, reported failure» incident. Meal/item swaps were the
 * LAST result class whose persistence depended on a live tab.
 *
 * THE LAW: the swap payload carries the owning plan (planId + clientId +
 * bounded indices — whitelisted by sanitizeJobPayload), and the RUNNER
 * applies the gated replacement to plans.content server-side:
 *   - fresh-fetch: the row is read at materialization time, so a coach
 *     edit saved in the interim survives (only the swap delta rides on
 *     top — no stale-content overwrite of unrelated items);
 *   - the replacement rides the SAME pure recomputeNutritionTotals the
 *     editor uses, so meal/plan totals stay coherent in the saved row;
 *   - ownership sanity: the plan must belong to the payload's client;
 *   - best-effort by design: a materialization hiccup NEVER fails the job
 *     (the in-session poller path still applies the result live) — but
 *     when it lands, the swap survives navigation, reloads and dead tabs.
 * The UI keeps applying the result in-editor when its poller is alive —
 * the two paths write the same bytes (idempotent content).
 * ─────────────────────────────────────────────────────────────────────────────────────── */

const SWAP_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pure MEAL-swap content transform — the editor's exact semantics
 * (replace the meal at mealIdx, recompute every total). Null when the
 * content shape or the index does not fit (never throws). Exported for
 * the permanent canary battery. */
export function applyMealSwapToContent(
  content: unknown,
  mealIdx: number,
  replacementMeal: Record<string, unknown>,
): NutritionPlanContent | null {
  if (!content || typeof content !== "object") return null;
  const c = content as Record<string, unknown>;
  if (!Array.isArray(c.meals)) return null;
  if (!Number.isInteger(mealIdx) || mealIdx < 0 || mealIdx >= c.meals.length) return null;
  const items = (replacementMeal as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const next = JSON.parse(JSON.stringify(c)) as NutritionPlanContent;
  next.meals[mealIdx] = replacementMeal as NutritionPlanContent["meals"][number];
  return recomputeNutritionTotals(next);
}

/** Pure ITEM-swap content transform — the editor's exact semantics
 * (merge the replacement over the old item, recompute every total). */
export function applyItemSwapToContent(
  content: unknown,
  mealIdx: number,
  itemIdx: number,
  replacementItem: Record<string, unknown>,
): NutritionPlanContent | null {
  if (!content || typeof content !== "object") return null;
  const c = content as Record<string, unknown>;
  if (!Array.isArray(c.meals)) return null;
  if (!Number.isInteger(mealIdx) || mealIdx < 0 || mealIdx >= c.meals.length) return null;
  const meal = c.meals[mealIdx] as { items?: unknown } | null;
  const items = meal && Array.isArray(meal.items) ? meal.items : null;
  if (!items || !Number.isInteger(itemIdx) || itemIdx < 0 || itemIdx >= items.length) return null;
  const repFood = (replacementItem as { food?: unknown }).food;
  if (typeof repFood !== "string" || !repFood.trim()) return null;
  const next = JSON.parse(JSON.stringify(c)) as NutritionPlanContent;
  const oldItem = next.meals[mealIdx].items[itemIdx] as Record<string, unknown>;
  next.meals[mealIdx].items[itemIdx] = { ...oldItem, ...replacementItem } as NutritionPlanContent["meals"][number]["items"][number];
  return recomputeNutritionTotals(next);
}

/** Runner-side swap persistence: apply the gated replacement to the owning
 * plans row (fresh-fetch + delta + recompute). Best-effort — NEVER fails
 * the job; returns { materialized: false } for every skipped case. */
async function materializeSwapIntoPlan(
  payload: Record<string, unknown>,
  kind: "meal" | "item",
  replacement: Record<string, unknown> | null,
): Promise<{ materialized: boolean; plan_id?: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { materialized: false };
  if (!replacement || typeof replacement !== "object") return { materialized: false };
  const planId = String(payload?.planId ?? "");
  const clientId = String(payload?.clientId ?? "");
  if (!SWAP_UUID_RE.test(planId) || !SWAP_UUID_RE.test(clientId)) return { materialized: false };
  const mealIdx = Number(payload?.mealIdx);
  if (!Number.isInteger(mealIdx) || mealIdx < 0) return { materialized: false };

  // Fresh fetch — the coach may have saved other edits while the queue
  // processed; the swap delta rides on top of the LATEST committed state.
  const { data: plan, error } = await supabaseAdmin
    .from("plans")
    .select("id, client_id, type, content")
    .eq("id", planId)
    .maybeSingle();
  if (error || !plan) {
    console.warn(`[swap-durability] plan fetch failed (job stays done): ${error?.message ?? "no row"}`);
    return { materialized: false };
  }
  if (String(plan.client_id ?? "") !== clientId) {
    console.warn("[swap-durability] plan/client mismatch — materialization skipped");
    return { materialized: false };
  }
  if (String(plan.type ?? "") !== "meal") return { materialized: false };

  const next =
    kind === "meal"
      ? applyMealSwapToContent(plan.content, mealIdx, replacement)
      : applyItemSwapToContent(plan.content, mealIdx, Number(payload?.itemIdx), replacement);
  if (!next) {
    console.warn(`[swap-durability] content shape/index mismatch — materialization skipped (plan ${planId.slice(0, 8)})`);
    return { materialized: false };
  }

  const { error: updateError } = await supabaseAdmin
    .from("plans")
    .update({ content: next as unknown as PlanContent })
    .eq("id", planId);
  if (updateError) {
    console.warn(`[swap-durability] plans update failed (job stays done): ${updateError.message}`);
    return { materialized: false };
  }
  console.log(`::notice::[swap-durability] ${kind} swap materialized into plans#${planId.slice(0, 8)} (mealIdx ${mealIdx})`);
  return { materialized: true, plan_id: planId };
}

/* Shared quality knobs for heavy jobs (GHA sets AI_CHAIN_TOTAL_BUDGET_MS
 * = 480000 in process-ai-jobs.yml — generous per-model windows, strongest
 * models first).
 * PHASE 177 (2026-09-11, 14-day audit «الجودة القصوى»): HEAVY 70s→120s and
 * LIGHT 45s→70s — the old caller caps were the BINDING constraint (budget
 * ÷ maxModels allowed 160s/240s per model), and the strongest entries
 * (ultra-550b class) aborted at 70s 220× in the window. 120s × 3 = 360s
 * and 70s × 2 = 140s both stay well inside the 480s runner budget. */
const HEAVY = { timeoutMs: 120_000 as const, maxModels: 3 as const };
const LIGHT = { timeoutMs: 70_000 as const, maxModels: 2 as const };

/* ─────────────────── Slug + image enrichment helpers ───────────────────
 *
 * OWNER INCIDENT 2026-08-28i («خرج مسودة بدون صور و slug مكتوب فيه
 * post-202608281422 وغيره من مشاكل»): Arabic titles have NO latin core,
 * so articleSlugFromTitle fell back to the dated post-YYYYMMDDNNNN slug —
 * ugly, non-SEO and un-renameable-looking. And materialization saved
 * featured_image:"" with no body images at all.
 *
 * SEO-SLUG LAW: the MODEL now produces an English SEO slug inside the
 * JSON contract (3-6 lowercase words capturing the topic meaning —
 * Arabic titles are TRANSLATED to their latin meaning, not transliterated).
 * The sanitizeModelSlug net below enforces the M15 latin-only law, and the
 * dated articleSlugFromTitle fallback stays as the last-resort net.
 *
 * IMAGE BUNDLE LAW: the same JSON contract carries image_queries —
 * 3-5 ENGLISH photo-search phrases for concrete safe scenes (the photo
 * pipeline is language-independent; English queries hit Pexels far better
 * for AR posts — same choice the automated pipeline's imagePlan makes).
 * fetchFeaturedImage (Pexels-first, NSFW/immodest-screened) resolves them;
 * images[0] = featured cover, images[1..] = embedBodyImages at ## section
 * boundaries. Every step degrades gracefully — an image failure can NEVER
 * fail the article itself.
 */

/**
 * Enforce the M15 slug law on a model-proposed slug — MOVED to the ONE
 * SLUG MODULE (src/lib/slug.ts, 2026-08-28j). Re-exported here so the
 * canary imports keep working; do NOT add slug logic in this file.
 */
export { sanitizeModelSlug } from "@/lib/slug";

/**
 * Extract up to `limit` "## " section heading TEXTS from markdown —
 * used only as a LAST-RESORT image query fallback when the model skipped
 * the image_queries field. Markdown decorations are stripped.
 */
export function sectionSubjects(markdown: string, limit = 3): string[] {
  if (typeof markdown !== "string") return [];
  const heads: string[] = [];
  const re = /^##\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null && heads.length < limit) {
    const text = String(m[1] || "")
      .replace(/[#*_`\[\]()]/g, "")
      .trim();
    if (text.length >= 3) heads.push(text.slice(0, 120));
  }
  return heads;
}

/**
 * Resolve the article's image bundle through the SAFE photo pipeline.
 * queries[0] = COVER (featured_image + og:image), queries[1..] = body.
 * NEVER throws — any failure returns what was gathered so far (possibly
 * []) and the article lands without images exactly as before.
 */
async function enrichArticleImages(
  queries: string[],
  variationSeed: string,
): Promise<SourcedImage[]> {
  const safe = queries
    .map((q) => sanitizeImageQuery(q).query)
    .filter(Boolean)
    .slice(0, 5);
  if (safe.length === 0) return [];
  // PHASE 62 VARIETY: exclude the last 30 published featured images so
  // coach-generated drafts stop recycling the same cover photos.
  const excludeUrls = await getRecentFeaturedImageUrls(30);
  try {
    const settled = await Promise.allSettled(
      safe.map((q, i) =>
        fetchFeaturedImage(q, { variationKey: `${variationSeed}-${i}`, excludeUrls }),
      ),
    );
    return settled
      .filter((s): s is PromiseFulfilledResult<SourcedImage> => s.status === "fulfilled")
      .map((s) => s.value)
      .filter((v): v is SourcedImage => Boolean(v));
  } catch {
    return [];
  }
}

function pickClientContext(raw: unknown): ClientContext {
  const cc = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: typeof cc.name === "string" ? cc.name : "",
    nutrition: cc.nutrition || {},
    fitness: cc.fitness || {},
    recent_measurements: Array.isArray(cc.recent_measurements)
      ? (cc.recent_measurements as ClientContext["recent_measurements"])
      : [],
    recent_plan_names: Array.isArray(cc.recent_plan_names)
      ? (cc.recent_plan_names as unknown[]).filter((n) => typeof n === "string")
      : [],
  };
}

/* ─────────────────────────── Article tools ─────────────────────────── */

export type ArticleToolKey =
  // New spec set (owner directive #3)
  | "paraphrase"
  | "summarize_bullets"
  | "proofread"
  | "seo_pack"
  | "subheadings"
  // Legacy editor tools kept working through the same queue
  | "seo_title"
  | "meta_desc"
  | "faq"
  | "cta"
  | "image_prompt"
  | "social_facebook"
  | "social_instagram"
  | "social_x"
  | "social_linkedin";

/** Map old editor button ids → the canonical job tools. */
export const ARTICLE_TOOL_ALIASES: Record<string, ArticleToolKey> = {
  improve: "paraphrase",
  enhance: "paraphrase",
  summary: "summarize_bullets",
};

export function resolveArticleTool(keyRaw: string): ArticleToolKey {
  const k = String(keyRaw || "").trim();
  if ((ARTICLE_TOOL_ALIASES as Record<string, string>)[k]) {
    return ARTICLE_TOOL_ALIASES[k];
  }
  return k as ArticleToolKey;
}

type ToolOutput = {
  /** Main deliverable shown to the editor. */
  text: string;
  /** Optional machine-readable extras (LSI list, bullets array …). */
  data?: Record<string, unknown>;
  /** Optional change-notes section rendered under the result. */
  notes?: string;
  /** Model id that served the tool (kept for provenance). */
  sourceLabel?: string;
};

const MARKER_MAIN = "===CORRECTED===";
const MARKER_NOTES = "===NOTES===";

/**
 * Split sentinel-formatted free-text into main + notes deterministically.
 * Free models are unreliable at escaping large Arabic inside JSON, so the
 * transform tools use explicit text markers instead.
 */
function splitSentinel(text: string): ToolOutput {
  const raw = text.trim();
  if (raw.includes(MARKER_NOTES)) {
    const [main, ...rest] = raw.split(MARKER_NOTES);
    return {
      text: main.replace(MARKER_MAIN, "").trim(),
      notes: rest.join(MARKER_NOTES).trim(),
    };
  }
  return { text: raw.replace(MARKER_MAIN, "").trim() };
}

async function runArticleTool(payload: Record<string, unknown>): Promise<ToolOutput> {
  const tool = resolveArticleTool(String(payload.tool || ""));
  const content = String(payload.content || "");
  const title = String(payload.title || "");
  const keyword = String(payload.keyword || "");
  const category = String(payload.category || "");
  const isAr = payload.language !== "en";

  const articleContext = `${isAr ? "عنوان المقال" : "Article title"}: ${title || "-"}
${isAr ? "التصنيف" : "Category"}: ${category || "-"}
${isAr ? "الكلمة المفتاحية" : "Focus keyword"}: ${keyword || "-"}

${isAr ? "محتوى المقال" : "Article body"}:
${content.slice(0, isAr ? 12_000 : 14_000)}`;

  // PHASE 174 (admin-tools parity — the owner's «نفس منظومة المدونة» order):
  // the editor tools (paraphrase/proofread/improve/subheadings/…) rewrite
  // article text, so they MUST carry the SAME Pan-Arab MSA editorial law
  // as the blog pipeline's LANG_RULE (Phase 173). Without it, running a
  // transform on a legacy Egyptian-dialect article kept the dialect, and
  // an MSA draft could drift — these tools are also the natural lever
  // for the Arabic Legacy Content Cleanup. PHASE 175: the law text moved
  // to src/lib/blog-msa.ts (single source — imported, never forked) so
  // the legacy-cleanup runner scripts/blog-runner/legacy-ar-msa.mts
  // rides the exact same contract.
  const sys = isAr
    ? AR_MSA_EDITOR_LAW
    : "You are Alkemos's senior editor & SEO specialist. Follow output instructions literally.";

  // Sentinel instructions reused by the three big-text transforms.
  const sentinelRule = isAr
    ? `أعد النتيجة بهذا الشكل الحرفي (لا JSON ولا أسوار):
${MARKER_MAIN}
النص النهائي المحسّن كاملاً بصيغة Markdown
${MARKER_NOTES}
- تغيير مهم 1
- تغيير مهم 2`
    : `Reply in EXACTLY this literal format (no JSON, no fences):
${MARKER_MAIN}
full final improved Markdown text
${MARKER_NOTES}
- important change 1
- important change 2`;

  let prompt = "";
  switch (tool) {
    case "paraphrase":
      prompt = isAr
        ? `أعد صياغة نص المقال ليكون أوضح وأكثر جاذبية مع تغيير هيكل الجمل مع الحفاظ الكامل على المعنى والمعلومات العلمية.\n\n${articleContext}\n\n${sentinelRule}`
        : `Paraphrase the article for clarity and engagement while restructuring sentences but preserving full meaning.\n\n${articleContext}\n\n${sentinelRule}`;
      break;

    case "proofread":
      prompt = isAr
        ? `دقّق نص المقال لغوياً: صحّح الأخطاء الإملائية والنحوية وعلامات الترقيم وحسّن الأسلوب حيث يلزم، دون تغيير المعنى أو حذف محتوى.\n\n${articleContext}\n\n${sentinelRule}`
        : `Proofread the article: fix spelling/grammar/punctuation and polish style without changing meaning or cutting content.\n\n${articleContext}\n\n${sentinelRule}`;
      break;

    case "subheadings":
      prompt = isAr
        ? `أعد تنظيم النص بإضافة عناوين فرعية (##) مناسبة كل مكان يزيد عن فقرتين، بدون حذف أي محتوى.\n\n${articleContext}\n\n${sentinelRule}`
        : `Reorganize the text by adding fitting (##) subheadings wherever more than two paragraphs go by; do not remove any content.\n\n${articleContext}\n\n${sentinelRule}`;
      break;

    case "summarize_bullets": {
      prompt = isAr
        ? `أنشئ ملخصاً للمقال في 50-100 كلمة ثم قائمة نقاط رئيسية (bullet points).\n\n${articleContext}\n\nأعد بهذا الشكل الحرفي:\n${MARKER_MAIN}\n**الملخص:**\nفقرة الملخص (50-100 كلمة)\n\n**النقاط الرئيسية:**\n- نقطة\n- نقطة\n${MARKER_NOTES}\n- ملاحظات إن وجدت`
        : `Summarize in 50-100 words plus a bullet list of key takeaways.\n\n${articleContext}\n\nReply exactly:\n${MARKER_MAIN}\n**Summary:**\n50-100 word paragraph\n\n**Key points:**\n- point\n${MARKER_NOTES}\n- notes`;
      break;
    }

    case "seo_pack":
    case "seo_title":
    case "meta_desc": {
      prompt = isAr
        ? `حلّل المقال وأخرج حزمة تحسين SEO كاملة:\n\n${articleContext}\n\nأعد JSON فقط بالشكل:\n{
 "meta_description": "وصف ميتا جذاب 120-155 حرفاً يتضمن الكلمة المفتاحية",
 "lsi_keywords": ["8-12 كلمة مفتاحية فرعية LSI"],
 "title_variants": ["3 عناوين بديلة أقل من 60 حرفاً تتضمن الكلمة المفتاحية"],
 "subheading_suggestions": ["2-4 اقتراحات عناوين فرعية محسّنة"],
 "notes": "شرح موجز لأهم التحسينات المقترحة"
}`
        : `Produce a complete SEO pack for this article.\n\n${articleContext}\n\nReturn ONLY JSON:\n{ "meta_description": "120-155 chars with focus keyword", "lsi_keywords": ["8-12 LSI keywords"], "title_variants": ["3 alternative titles <60 chars"], "subheading_suggestions": ["2-4 improved H2 ideas"], "notes": "brief rationale" }`;
      break;
    }

    case "faq":
      prompt = isAr
        ? `ولّد 3-5 أسئلة وأجوبة شائعة مرتبطة مباشرة بمحتوى المقال بالعربية الفصحى.\n\n${articleContext}\n\nأعد JSON فقط: { "faq": [ { "question": "..", "answer": ".." } ] }`
        : `Generate 3-5 FAQ Q&As tied directly to the article.\n\n${articleContext}\n\nReturn ONLY JSON: { "faq": [ { "question": "..", "answer": ".." } ] }`;
      break;

    case "cta":
      // PHASE 174 (honesty parity with the Phase-173 Coach Card law): the
      // editor CTA tool suggests copy a coach may paste into an article —
      // it must only reference Alkemos's REAL products (coaching
      // membership / meal planner / free calculators / programs), never
      // the non-existent single "book a session" service the coach card
      // was corrected away from.
      prompt = isAr
        ? `اكتب 3 دعوات لاتخاذ إجراء (CTA) مقنعة خاصة بـ Alkemos بناءً على المقال. القاعدة: اذكر منتجات Alkemos الحقيقية فقط — عضوية التدريب الأونلاين الشهرية، أو مخطط الوجبات، أو الحاسبات المجانية (السعرات/الماكروز/مؤشر كتلة الجسم/نسبة الدهون/متتبع الماء)، أو برامج التدريب — وممنوع نهائيًا أي صياغة «احجز جلسة» أو «جلسة تدريب واحدة» (خدمة غير موجودة).\n\n${articleContext}\n\nأعد شكلاً حرفياً:\n${MARKER_MAIN}\n1. ...\n2. ...\n3. ...\n${MARKER_NOTES}\n- ملاحظات`
        : `Write 3 persuasive CTAs for Alkemos from this article. RULE: mention only Alkemos's REAL products — the monthly online-coaching membership, the meal planner, the free calculators (calories/macros/BMI/body-fat/water), or workout programs — NEVER a single "book a session" offer (that service does not exist).\n\n${articleContext}\n\nReply exactly:\n${MARKER_MAIN}\n1. ...\n2. ...\n3. ...\n${MARKER_NOTES}\n- notes`;
      break;

    case "image_prompt":
      prompt = `Write ONE detailed AI image-generation prompt in English for a professional cover image DIRECTLY representing THIS article's specific subject (never a generic gym scene):\nTitle: ${title || "Fitness"}\nCategory: ${category || "Fitness"}\nKeyword: ${keyword || content.slice(0, 120)}\nRequirements: cinematic, realistic lighting, no text/watermarks. PHASE 173 OWNER LAW (absolute): the image must NEVER contain women or girls — if any person appears, an adult MAN only; otherwise use non-human subjects (equipment, food, anatomy illustration, empty gym scene). Output ONLY the raw prompt string.`;
      break;

    default:
      throw new Error(`unknown article_tool: ${tool}`);
  }

  const needsJson =
    tool === "seo_pack" || tool === "seo_title" || tool === "meta_desc" || tool === "faq";
  // Social variants map to dedicated platform jobs instead.
  if (String(tool).startsWith("social_")) {
    throw new Error("social_* handled by social_post processor");
  }

  const { text, model } = await callFreeAIFallbackChain(
    prompt,
    {
      tag: `ai-job:${tool}`,
      systemPrompt: sys,
      temperature: tool === "proofread" ? 0.3 : 0.7,
      maxTokens:
        tool === "summarize_bullets" ? 1400 : tool === "seo_pack" ? 1600 : 4000,
      jsonMode: needsJson,
      ...(needsJson ? HEAVY : LIGHT),
    },
  );

  if (needsJson) {
    const parsed = parseJSON<Record<string, unknown>>(text);
    if (!parsed) throw new Error("فشل تحليل نتيجة الأداة (JSON غير صالح).");
    if (tool === "faq") {
      const faq = Array.isArray(parsed.faq) ? parsed.faq.slice(0, 6) : [];
      if (faq.length === 0) throw new Error("لم يتم توليد أسئلة صالحة.");
      return {
        text: faq.map((q) => `**${q.question}**\n${q.answer}`).join("\n\n"),
        data: { faq },
        sourceLabel: model,
      };
    }
    if (tool === "seo_title") {
      const t = String(parsed.title_variants?.[0] ?? parsed.meta_description ?? "").slice(0, 200);
      if (!t) throw new Error("لم يتم توليد عنوان صالح.");
      return { text: t, data: parsed, sourceLabel: model };
    }
    if (tool === "meta_desc") {
      const d = String(parsed.meta_description ?? "").replace(/^["'«»]+|["'«»]+$/g, "").slice(0, 300);
      if (!d) throw new Error("لم يتم توليد وصف صالح.");
      return { text: d, data: parsed, sourceLabel: model };
    }
    // seo_pack
    const meta = String(parsed.meta_description ?? "").slice(0, 300);
    if (!meta) throw new Error("لم يتم توليد حزمة SEO.");
    const pretty = [
      `**Meta Description:** ${meta}`,
      ``,
      `**LSI Keywords:** ${(Array.isArray(parsed.lsi_keywords) ? parsed.lsi_keywords : []).join(" • ")}`,
      ``,
      `**${isAr ? "عناوين بديلة" : "Title variants"}:**`,
      ...(Array.isArray(parsed.title_variants) ? parsed.title_variants : []).map((t: string) => `- ${t}`),
      ``,
      `**${isAr ? "اقتراحات عناوين فرعية" : "Subheading suggestions"}:**`,
      ...(Array.isArray(parsed.subheading_suggestions) ? parsed.subheading_suggestions : []).map((t: string) => `- ${t}`),
    ].join("\n");
    return {
      text: pretty,
      data: parsed,
      notes: String(parsed.notes || ""),
      sourceLabel: model,
    };
  }

  const out = splitSentinel(text);
  if (!out.text) throw new Error("نتيجة فارغة من النموذج.");
  return { ...out, sourceLabel: model };
}

/* ─────────────────────────── Social post ─────────────────────────── */

async function runSocialPost(payload: Record<string, unknown>) {
  const platform = String(payload.platform || "facebook") as SocialPlatform;
  const tone = String(payload.tone || "motivational") as SocialTone;
  return generateSocialPost({
    platform,
    tone,
    language: payload.language === "en" ? "en" : "ar",
    topic: payload.topic as string | undefined,
    content: payload.content as string | undefined,
    title: payload.title as string | undefined,
    articleUrl: payload.articleUrl as string | undefined,
  });
}

/* ─────────────────────────── Plans ─────────────────────────── */

/* ── PLAN DRAFT MATERIALIZATION LAW (Phase 79, owner «حفظ للخطط المولدة») ──
 * Same incident class as article_generate (2026-08-28d): the finished plan
 * used to live ONLY inside ai_jobs.result and the BROWSER was expected to
 * insert the `plans` row — a dead tab / closed laptop / other device meant
 * «ولّدت الخطة ومش لاقيها». The runner now inserts the DRAFT plans row
 * itself (service-role; RLS bypass is safe because the enqueue API already
 * gated ownership + active coaching subscription + quotas). Browsers see
 * result.materialized=true and skip their own insert — no doubles.
 * Browser-side fallback stays for jobs enqueued before this deploy.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function materializePlanDraftRow(
  payload: Record<string, unknown>,
  title: string,
  content: PlanContent | null,
  planType: "meal" | "workout",
): Promise<string | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const clientId = String(payload?.clientId ?? "");
  if (!UUID_RE.test(clientId)) return null; // no target client → browser fallback only
  const { data, error } = await supabaseAdmin
    .from("plans")
    .insert({
      client_id: clientId,
      type: planType,
      title,
      notes: "Generated by AI",
      file_url: null,
      content,
      status: "draft",
      is_current: false,
    })
    .select("id")
    .single();
  if (error) {
    // NEVER fail the job for a materialization hiccup — the result still
    // carries title+content so the recovery card can save it manually.
    console.error("[plan job] server-side draft materialization failed:", error.message);
    return null;
  }
  // DRAFT-HYGIENE 2026-10-25 (owner order P1-4: «أوقف إنشاء المسودات
  // المكررة»): the regeneration flow rides replacePlanId (sanitized
  // UUID) on the payload — the RUNNER now swaps the superseded draft out
  // itself, server-side, so dedupe no longer depends on the initiating
  // browser still being open on the right device. Guards: the old row is
  // deleted ONLY after the replacement draft EXISTS, and ONLY while it is
  // still an unapproved, never-activated draft (approved/current plans
  // are untouchable — the browser flow keeps its own guarded cleanup as
  // a second belt). Best-effort + logged, never job-fatal.
  const replacePlanId = String(payload?.replacePlanId ?? "");
  if (UUID_RE.test(replacePlanId) && data?.id && replacePlanId !== data.id) {
    try {
      const { data: old } = await supabaseAdmin
        .from("plans")
        .select("id, status, is_current")
        .eq("id", replacePlanId)
        .maybeSingle();
      if (old && old.status === "draft" && old.is_current !== true) {
        const { error: delErr } = await supabaseAdmin
          .from("plans")
          .delete()
          .eq("id", replacePlanId)
          .eq("status", "draft")
          .eq("is_current", false);
        if (delErr) {
          console.warn("[plan job] superseded draft cleanup failed:", delErr.message);
        } else {
          console.log(`[plan job] superseded draft removed: plans#${replacePlanId} → replaced by plans#${data.id}`);
        }
      }
    } catch (cleanupError) {
      console.warn(
        "[plan job] superseded draft cleanup error (best-effort):",
        cleanupError instanceof Error ? cleanupError.message : cleanupError,
      );
    }
  }
  return data?.id ?? null;
}

/**
 * PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 3): plan-pool
 * billing MOVED OUT of the processors to the runner (recordPlanPoolOnSuccess
 * in scripts/ai-jobs-runner/process.mts) — recorded AFTER finishJob lands
 * `done` (kills the finishJob-failure → requeue → re-run DOUBLE-BURN
 * window) and ROLE-AWARE via tier-limits.planPoolBillingForRequester:
 * b2b coach → client pool burns (owner decrees 2026-09-01/13, unchanged);
 * site coach / admin / unresolvable → NO client-pool burn (the measured
 * live defect: admin-requested jobs were burning client 87cd7ba6's pool).
 * The full policy contract is unit-pinned in plan-pool-billing.test.ts.
 */

async function runPlanNutrition(payload: Record<string, unknown>) {
  const ctx = pickClientContext(payload.clientContext);
  const overrides = (payload.overrides ?? {}) as {
    targetCalories?: number;
    macros?: { protein_g: number; carbs_g: number; fat_g: number };
    foods?: string[];
    mealsCount?: number;
    notes?: string;
    dietType?: string;
  };
  // EVO-4 (W4): anonymized platform knowledge (E1 aggregates + E2 exemplar)
  // steers the generation — fail-open to "" when the knowledge base is
  // empty or unreadable (generation never depends on learning).
  const { knowledgeBlock } = await loadEvoNutritionKnowledge();
  const res = await generateNutritionPlanAI(
    ctx,
    {
      targetCalories: overrides.targetCalories,
      macros: overrides.macros,
      foods: overrides.foods,
      mealsCount: overrides.mealsCount,
      notes: overrides.notes,
      // NOTIF→PLAN 2026-10-24 (owner order item 4): the coach's explicit
      // diet-type selection rides the sanitized payload whitelist.
      dietType: (DIET_TYPES as readonly string[]).includes(String(overrides.dietType))
        ? (overrides.dietType as DietType)
        : undefined,
    },
    knowledgeBlock,
  );
  const plan_id = await materializePlanDraftRow(payload, res.title, res.content, "meal");
  if (plan_id) console.log(`[plan_nutrition] draft materialized: plans#${plan_id}`);
  return {
    title: res.title,
    plan_type: "nutrition",
    content: res.content, // includes meals[].meal_alternatives (≤2 per meal)
    source: res.source,
    // Phase 79: the draft row already exists on the server — the browser
    // watcher/recovery card must NOT insert it again.
    materialized: Boolean(plan_id),
    ...(plan_id ? { plan_id } : {}),
  };
}

async function runPlanWorkout(payload: Record<string, unknown>) {
  const ctx = pickClientContext(payload.clientContext);
  const overrides = (payload.overrides ?? {}) as {
    mealsCount?: number;
    foods?: string[];
    notes?: string;
  };
  const res = await generateWorkoutPlanAI(ctx, {
    mealsCount: overrides.mealsCount, // legacy reuse → daysPerWeek
    foods: overrides.foods,
    notes: overrides.notes
      ? `${overrides.notes}${payload.durationWeeks ? ` — مدة البرنامج المستهدفة: ${payload.durationWeeks} ${weeksUnitAr(Number(payload.durationWeeks))}` : ""}`
      : undefined,
  });
  const plan_id = await materializePlanDraftRow(payload, res.title, res.content, "workout");
  if (plan_id) console.log(`[plan_workout] draft materialized: plans#${plan_id}`);
  return {
    title: res.title,
    plan_type: "workout",
    content: res.content,
    source: res.source,
    materialized: Boolean(plan_id),
    ...(plan_id ? { plan_id } : {}),
  };
}

async function runMealRegenerate(payload: Record<string, unknown>) {
  const ctx = payload.clientContext ? pickClientContext(payload.clientContext) : undefined;
  // EVO-4 (W4 E3): the swap-learning block (most-removed/most-accepted
  // foods, anonymized) steers what the model stops suggesting — fail-open.
  const { swapBlock } = await loadEvoNutritionKnowledge();
  const out = await regenerateMeal(
    (payload.meal || {}) as { name?: string; items?: Array<{ food: string; amount: string; calories: number }>; notes?: string },
    payload.targetCalories as number | undefined,
    ctx,
    payload.reason as string | undefined,
    Array.isArray(payload.avoid_names) ? (payload.avoid_names as string[]) : [],
    swapBlock,
    // PLAN-REGEN-CONSTRAINTS 2026-10-24: the owning plan's diet (strict
    // enum — sanitizeJobPayload whitelisted it) re-imposed on the swap.
    (DIET_TYPES as readonly string[]).includes(String(payload.dietType))
      ? (payload.dietType as DietType)
      : undefined,
  );
  // SWAP-DURABILITY 2026-10-25: persist the gated replacement into the
  // owning plan row server-side — the swap survives the coach closing the
  // tab mid-wait (the measured 2026-10-25 failure class). Best-effort.
  const mat = await materializeSwapIntoPlan(payload, "meal", out.meal as unknown as Record<string, unknown>);
  return {
    replacement: out.meal,
    suggestions: out.suggestions,
    source: out.source,
    ...(mat.materialized ? { materialized: true, plan_id: mat.plan_id } : {}),
  };
}

async function runExerciseRegenerate(payload: Record<string, unknown>) {
  const out = await substituteExercise({
    exercise: (payload.exercise || {}) as { name: string; sets?: number; reps?: string; rest?: string; focus?: string },
    reason: payload.reason as string | undefined,
    location: payload.location as string | undefined,
    clientContext: payload.clientContext ? pickClientContext(payload.clientContext) : undefined,
  });
  return out; // { replacement(+exerciseSlug/image), alternatives[3], libraryMatched, source }
}

/* Phase 79 (owner «الكوتشينج يستفيدوا من نفس الخصائص»): the two granular
 * regeneration tools that used to be admin-external-plans only are now
 * staff editing tools on the same GitHub Actions queue. */

async function runFoodItemRegenerate(payload: Record<string, unknown>) {
  const ctx = payload.clientContext ? pickClientContext(payload.clientContext) : undefined;
  const out = await regenerateFoodItem(
    (payload.item || {}) as { food: string; amount: string; calories: number; alternatives?: string },
    ctx,
    Array.isArray(payload.avoid_names) ? (payload.avoid_names as string[]) : [],
    payload.note as string | undefined,
    // PLAN-REGEN-CONSTRAINTS 2026-10-24: the owning plan's diet re-imposed
    // on the single-item replacement.
    (DIET_TYPES as readonly string[]).includes(String(payload.dietType))
      ? (payload.dietType as DietType)
      : undefined,
  );
  // SWAP-DURABILITY 2026-10-25: same law as the meal swap — the runner
  // persists the ±15% gated replacement into the owning plan row.
  const mat = await materializeSwapIntoPlan(payload, "item", out.item as unknown as Record<string, unknown>);
  return {
    replacement: out.item,
    source: out.source,
    ...(mat.materialized ? { materialized: true, plan_id: mat.plan_id } : {}),
  };
}

async function runDayRegenerate(payload: Record<string, unknown>) {
  const ctx = payload.clientContext ? pickClientContext(payload.clientContext) : undefined;
  const out = await regenerateWorkoutDay(
    (payload.day || {}) as { day: string; focus: string; exercises: Array<{ name: string; sets: number; reps: string; rest: string; notes: string }> },
    ctx,
    Array.isArray(payload.avoid_names) ? (payload.avoid_names as string[]) : [],
    payload.note as string | undefined,
  );
  return { replacement: out.day, source: out.source };
}

/* ─────────────────── Article generation (coach) ─────────────────── */

/**
 * DRAFT MATERIALIZATION LAW (2026-08-28d): a completed article_generate
 * result MUST exist as a blog_posts DRAFT row — never only inside
 * ai_jobs.result. Owner watched two SUCCESSFUL generations and still
 * reported «لم تولد المقال»: the finished article lived solely in the job
 * result, visible only if the live browser watcher caught the done event
 * (mobile tabs die, coaches navigate away). Materializing server-side
 * makes the draft appear in the articles list NO MATTER what the browser
 * does. Drafts stay is_published=false — the coach still reviews before
 * publishing (AI PROVENANCE preserved via source + the review flow).
 */
async function materializeArticleDraft(r: {
  title: string;
  markdown: string;
  excerpt: string;
  meta_title?: string;
  faq?: Array<{ question: string; answer: string }>;
  meta_description: string;
  tags: string[];
  language: "ar" | "en";
  category?: string;
  focus_keyword?: string;
  slug?: string;
  featured_image?: string;
  cover_alt?: string;
}): Promise<string | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const now = new Date().toISOString();
  const words = r.markdown.split(/\s+/).filter(Boolean).length;
  // SEO-SLUG LAW (2026-08-28i): model-produced English slug wins; the
  // dated post-YYYYMMDDNNNN fallback only fires when BOTH the model slug
  // AND the title's latin core are unusable (ONE-SLUG-LAW: resolveSlug).
  const slug = resolveSlug(r.slug, r.title);
  const row: Record<string, unknown> = {
    language: r.language,
    title: r.title,
    slug,
    excerpt: r.excerpt,
    content: r.markdown,
    meta_title: r.meta_title || r.title,
    meta_description: r.meta_description,
    // BUNDLE PARITY: BlogArticlePage renders this as the FAQ section —
    // generated drafts land WITH their FAQ set, not empty like before.
    faq_json: Array.isArray(r.faq) && r.faq.length > 0 ? r.faq : [],
    focus_keyword: r.focus_keyword || r.tags[0] || "",
    keywords: r.tags.slice(0, 8),
    category:
      r.category && VALID_CATEGORY_IDS.has(r.category) ? r.category : "nutrition",
    tags: r.tags,
    // IMAGE BUNDLE (2026-08-28i): the safe Pexels pipeline backfills the
    // cover BEFORE materialization — no more empty featured_image drafts.
    featured_image: r.featured_image || "",
    cover_alt: r.cover_alt || "",
    reading_time: Math.max(1, Math.round(words / 200)),
    // Phase SEO-GEO-4.1 (2026-09-08): author = Ahmed Zake (human founder),
    // not the brand "Alkemos". See p5-publish route for the full rationale.
    author: "Ahmed Zake",
    is_published: false, // NEVER auto-publish — coach reviews first
    published_at: null,
    created_at: now,
    updated_at: now,
    schema_json: {},
    source: "ai:article_generate",
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .insert([row as never]) // row carries legacy optional `source` — deleted on schema mismatch below
      .select("id")
      .single();
    if (!error) return data?.id ?? null;
    const msg = String(error?.message || "");
    if (/duplicate|unique|conflict/i.test(msg)) {
      // Same-title slug collision (rare) — suffix and retry.
      row.slug = `${row.slug}-${Date.now().toString(36)}`.slice(0, 90);
      continue;
    }
    if ("source" in row) {
      delete row.source; // legacy schema without the source column
      continue;
    }
    console.error("[article_generate] draft materialization failed:", msg);
    return null;
  }
  return null;
}

/**
 * INTERNAL-LINK CANDIDATES (bundle parity with the automated pipeline's
 * insertLinksIntoArticle): the automated pipeline weaves real internal
 * links; the coach generator must too. Returns recent PUBLISHED posts of
 * the same language as [slug, title] pairs for the prompt.
 * (Phase 171: the legacy reference target src/lib/blog-generate.ts was
 * deleted as dead code — this is the parity law, not a code dependency.)
 */
async function internalLinkCandidates(
  language: "ar" | "en",
  limit = 8,
): Promise<Array<{ slug: string; title: string }>> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, title")
    .eq("is_published", true)
    .eq("language", language)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data || [])
    .filter((p) => p.slug && p.title)
    .map((p) => ({ slug: String(p.slug), title: String(p.title) }));
}

/**
 * Full-article GENERATION from a topic — the queue-era replacement for the
 * Phase-15-deleted client-side generator (owner report 2026-08-28: coaches
 * had no generation entry at all, only a banner pointing at a dead button).
 *
 * TOPIC-AUTO (2026-08-28b): an empty/short topic is valid — pickSmartTopic()
 * (the automated blog pipeline's topic brain) chooses a fresh, non-duplicate
 * title in the requested language, so the generation system picks its own
 * subject when the coach doesn't supply one.
 *
 * Output contract with BlogEditorView prefill (sessionStorage hand-off):
 * { title, markdown, excerpt, meta_description, tags[], language, source }
 * + topic diagnostics: { topic, autoTopic, focus_keyword, topic_rationale, category }
 */
async function runArticleGenerate(payload: Record<string, unknown>) {
  let topic = String(payload.topic || "").trim();
  const isAr = payload.language !== "en";
  const tone = String(payload.tone || "").trim();
  const audience = String(payload.audience || "").trim();
  let category = String(payload.category || "").trim();
  const keywords = Array.isArray(payload.keywords)
    ? (payload.keywords as unknown[]).map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
    : [];

  // TOPIC-AUTO (2026-08-28b): when the coach leaves the topic empty, the
  // SAME smart topic system that powers the automated blog pipeline
  // (pickSmartTopic — AI pick with curated per-language fallbacks, rotation
  // across content pillars, duplicate-check against published posts) picks
  // the article's title. Owner directive: «مفروض يختار العنوان بنفس نظام
  // التوليد».
  let autoTopic = false;
  let topicRationale = "";
  let focusKeyword = "";
  if (topic.length < 5) {
    const pick = await pickSmartTopic(category || undefined, isAr ? "ar" : "en");
    if (!pick?.topic) {
      throw new Error("article_generate: empty topic and smart topic pick failed");
    }
    topic = pick.topic;
    focusKeyword = pick.focusKeyword || "";
    topicRationale = pick.rationale || "";
    if (!category && pick.category) category = pick.category;
    autoTopic = true;
    console.log(`[article_generate] auto-picked topic: "${topic}" (pillar: ${pick.category})`);
  }

  const sys = isAr
    ? "أنت كاتب محتوى رياضي خبير لموقع Alkemos (منصة لياقة وتغذية لكل العرب). تكتب بالعربية الفصحى الحديثة السهلة الواضحة لجميع القراء العرب (Pan-Arab Modern Standard Arabic) — بلا لهجة محلية وبلا تعبيرات عامية (عشان، مش، ازاي، بتاع...) وبلا ترجمة حرفية عن الإنجليزية، وبلا خلط كلمات إنجليزية/لاتينية سائبة داخل الجمل العربية (كل مصطلح بالعربية أو معرّب صوتيًا — الاستثناء الوحيد إشارة لاتينية بين قوسين بعد المصطلح العربي مثل «مصل اللبن (Whey)» أو أسماء العلامات مثل Alkemos)، بنحو وإملاء سليمين — وبنبرة تحفيزية عملية، وتلتزم حرفياً بتعليمات الإخراج JSON. تكتب بعمق وتفصيل — المقالات السطحية القصيرة مرفوضة."
    : "You are Alkemos's senior fitness & nutrition content writer (Egyptian fitness blog). Write in clear, practical English and follow the JSON output contract literally. Write with depth and detail — shallow short articles are rejected.";

  // ANTI-FORMULA OPENING (owner: «نفس العناوين الثابتة القديمة ومقال سيء»):
  // every generation draws a random structural archetype so consecutive
  // articles don't share the same formulaic skeleton.
  const ARCHETYPES_AR = [
    "افتتح بقصة قصيرة واقعية لشخص واجه نفس المشكلة ثم اربطها بالموضوع",
    "افتتح بسؤال محدد حقيقي يتساءل عنه القارئ فعلاً ثم أجب عليه بالتدريج",
    "افتتح برقم أو إحصائية مفاجئة مرتبطة بالموضوع (بأرقام معقولة دون اختراع مصادر)",
    "افتتح بخطأ شائع يفعله معظم الناس في هذا الموضوع بالتحديد ثم صحّحه",
    "افتتح بمقارنة سريعة (قبل/بعد) أو (خرافة/حقيقة) توضح الفائدة العملية",
  ];
  const ARCHETYPES_EN = [
    "Open with a short real-life scenario of someone facing this exact problem, then tie it to the topic",
    "Open with a specific genuine question readers actually ask, then answer it progressively",
    "Open with a surprising but reasonable number or fact related to the topic (no invented sources)",
    "Open with a common mistake most people make in this exact area, then correct it",
    "Open with a quick before/after or myth/reality contrast showing the practical benefit",
  ];
  const archetype = isAr
    ? ARCHETYPES_AR[Math.floor(Math.random() * ARCHETYPES_AR.length)]
    : ARCHETYPES_EN[Math.floor(Math.random() * ARCHETYPES_EN.length)];

  // BUNDLE PARITY: internal links (real published slugs) + FAQ — the same
  // elements the automated blog pipeline produces (owner: «ناقص عناصر
  // كتير»). Candidates are fetched BEFORE the call and offered to the
  // model as ready (anchor → markdown link) pairs.
  const linkCandidates = await internalLinkCandidates(isAr ? "ar" : "en");
  const internalLinksLine = linkCandidates.length
    ? isAr
      ? `روابط داخلية متاحة (استخدم 2-3 منها طبيعياً داخل النص بصيغة [النص](الرابط) حرفياً): ${linkCandidates.map((l) => `[خلفية ${l.title}](/ar/blog/${l.slug})`).join(" ، ")}`
      : `Available internal links (weave 2-3 naturally as literal [anchor](link) markdown): ${linkCandidates.map((l) => `[More on ${l.title}](/blog/${l.slug})`).join(", ")}`
    : "";

  const lines = [
    isAr
      ? `اكتب مقالاً كاملاً جاهزاً للنشر عن: «${topic}»`
      : `Write a complete, publication-ready article about: "${topic}"`,
    isAr ? `الهيكل الافتتاحي لهذا المقال تحديداً: ${archetype}.` : `Opening structure for THIS article: ${archetype}.`,
    // PHASE 172 (owner order — GEO answer-first + E-E-A-T without
    // fabrication + fact guard; same laws as the automated pipeline's
    // P2 so both article surfaces ship one quality bar):
    // AUDIT_REPORT §9-1.2: canonical blocks replace the paraphrases —
    // byte-exact same law text as the pipeline's P2 (a RAISE per the
    // quality-first law: the P2 wording is the stricter, fuller one).
    EDITORIAL_ANSWER_FIRST[isAr ? "ar" : "en"],
    EDITORIAL_EEAT[isAr ? "ar" : "en"],
    EDITORIAL_FACT_GUARD[isAr ? "ar" : "en"],
    internalLinksLine,
    isAr
      ? `أنشئ أيضاً قسم أسئلة شائعة: ${EDITORIAL_FAQ_COUNT_RANGE.min}-${EDITORIAL_FAQ_COUNT_RANGE.max} أسئلة حقيقية عن هذا الموضوع تحديدًا (نية بحث المقال نفسه — لا أسئلة عامة عن اللياقة) مع إجابات موجزة دقيقة (تعرض في قسم الأسئلة الشائعة بالصفحة).`
      : `Also produce an FAQ set: ${EDITORIAL_FAQ_COUNT_RANGE.min}-${EDITORIAL_FAQ_COUNT_RANGE.max} genuine questions about THIS topic specifically (the article's own search intent — not generic fitness questions) with concise accurate answers (rendered in the page's FAQ section).`,
    tone && (isAr ? `النبرة: ${tone}.` : `Tone: ${tone}.`),
    audience && (isAr ? `الجمهور المستهدف: ${audience}.` : `Target audience: ${audience}.`),
    category && (isAr ? `التصنيف: ${category}.` : `Category: ${category}.`),
    keywords.length &&
      (isAr
        ? `الكلمات المفتاحية التي يجب أن تظهر طبيعياً: ${keywords.join("، ")}.`
        : `Focus keywords to weave in naturally: ${keywords.join(", ")}.`),
    // PHASE 174 (admin-tools parity with the P4 Phase-173 law): the old
    // hard-requirements line here DEMANDED a closing marketing CTA
    // paragraph — the exact duplicate-closing-CTA class the owner
    // ordered removed (the article page already renders BlogMembershipCard
    // after the content). The coach-path generator now carries the same
    // ban as the pipeline's P4 instruction 10, so BOTH article surfaces
    // ship one quality bar.
    isAr
      ? "المتطلبات الصارمة: 1100-1400 كلمة (شرط إلزامي — المقالات الأقصر تُرفض وتُعاد الكتابة)، مقدمة غير نمطية (ممنوع البدء بـ«في عالم اللياقة» أو أي حشو عام)، 6-9 عناوين فرعية ## منظمة، أمثلة وأرقام عملية محددة داخل الأقسام، قسم «أخطاء شائعة»، قسم تطبيقي خطوة بخطوة قابل للتنفيذ فوراً، خاتمة تلخص جوهر المقال فقط — ممنوع إضافة أي فقرة ختامية تسويقية أو دعوة للاشتراك أو انضمام Alkemos في نهاية المقال (الموقع يعرض بطاقات الاشتراك بعد المقال تلقائياً). بدون جداول HTML وبدون صور وبدون صيغة LaTeX."
      : "Hard requirements: 1100-1400 words (mandatory — shorter drafts are rejected and rewritten), a non-generic hook (never open with filler like 'In the world of fitness…'), 6-9 organized ## subheadings, concrete examples and practical numbers inside sections, a common-mistakes section, an immediately actionable step-by-step section, and a conclusion that ONLY summarizes the article's substance — do NOT append any closing call-to-action, marketing outro, or \"join Alkemos\" pitch paragraph (the website already renders its CTA cards after the article). No HTML tables, no images, no LaTeX.",
    isAr
      ? "تدقيق إلزامي قبل التسليم: عدد الكلمات 1100+، الأقسام 6-9، كل قسم فيه مثال أو رقم عملي، قسم أخطاء شائعة + قسم خطوة بخطوة موجودان، و2-3 روابط داخلية من القائمة أعلاه مستخدمة فعلاً."
      : "Mandatory self-check before answering: 1100+ words, 6-9 sections, every section carries a concrete example or number, common-mistakes + step-by-step sections present, and 2-3 internal links from the list above actually used.",
    isAr
      ? "حقل slug إلزامي: 3-6 كلمات إنجليزية صغيرة مفصولة بشرطات (-) تُلخّص معنى الموضوع بالإنجليزية (ترجمة للمعنى وليس نقل لفظي) — مثال: best-home-workout-beginners. وحقل image_queries إلزامي: 4 عبارات بحث إنجليزية قصيرة (2-4 كلمات لكل عبارة) لمشاهد تصوير حقيقية آمنة ومحتشمة تمثل أقسام المقال (معدات، أكل، مشاهد تدريب عامة) — بلا أسماء أشخاص وبلا عبارات غير لائقة. قانون صارم (Phase 173): ممنوع تمامًا أي مشهد يضم نساء أو فتيات — إن لزم ظهور أشخاص فرجال بالغون فقط، وإلا فمشاهد بلا أشخاص (معدات، طعام، جيم فارغ)."
      : "The slug field is mandatory: 3-6 lowercase English words hyphen-separated summarizing the topic's meaning — e.g. best-home-workout-beginners. The image_queries field is mandatory: 4 short English photo-search phrases (2-4 words each) describing safe modest real photo scenes matching the article's sections (equipment, food, training scenes) — no personal names, nothing inappropriate. STRICT LAW (Phase 173): never any scene featuring women or girls — adult men only if people are needed, otherwise people-free scenes (equipment, food, empty gym).",
    isAr
      ? "أعد JSON فقط بالشكل الحرفي (بدون أسوار كود):"
      : "Return ONLY JSON in this exact shape (no code fences):",
    `{
 "title": "${isAr ? "عنوان جذاب أقل من 70 حرفاً" : "catchy title under 70 chars"}",
 "slug": "${isAr ? "seo-slug-إنجليزي-3-6-كلمات" : "english-seo-slug-3-6-words"}",
 "excerpt": "${isAr ? "ملخص تشويقي سطرين" : "two-line teaser"}",
 "meta_title": "${isAr ? "عنوان ميتا 50-60 حرفاً مختلف عن العنوان" : "50-60 char meta title (may differ from title)"}",
 "meta_description": "${isAr ? "وصف ميتا 120-155 حرفاً" : "120-155 char meta description"}",
 "tags": ["${isAr ? "5-8 وسوم قصيرة" : "5-8 short tags"}"],
 "image_queries": ["${isAr ? "4 عبارات بحث صور إنجليزية" : "4 english photo search phrases"}"],
 "faq": [{"question": "${isAr ? "سؤال حقيقي" : "genuine question"}", "answer": "${isAr ? "إجابة موجزة دقيقة" : "concise accurate answer"}"}],
 "markdown": "${isAr ? "المقال كاملاً (1100-1400 كلمة) بصيغة Markdown تبدأ بعنوان ## أول قسم (بدون تكرار العنوان الرئيسي)" : "full article (1100-1400 words) in Markdown starting with the first ## section (never repeat the main title)"}"
}`,
  ].filter(Boolean);

  const { text, model } = await callFreeAIFallbackChain(
    lines.join("\n\n"),
    {
      tag: "ai-job:article-generate",
      systemPrompt: sys,
      temperature: 0.7,
      // GROQ ELIGIBILITY LAW (2026-08-28c): the chain skips Groq when
      // prompt/4 + maxTokens + 800 > 7200 (Groq free TPM counts prompt +
      // max_tokens). 7000 reserved tokens LOCKED this job out of Groq →
      // OpenRouter-only → free-pool 429s + 60s aborts (observed: attempt 1
      // died, attempt 2 needed 138s). 5000 still covers the 800-1200-word
      // 6000 (2026-08-28e quality bump): est ≈ prompt(~175t) + 6000 + 800
      // ≈ 6975 < 7200 → STILL Groq-eligible, with headroom for the
      // mandatory 1100-1400-word contract incl. reasoning overhead.
      maxTokens: 6000,
      jsonMode: true,
      // PHASE 161.4 (2026-09-09, run 34352443142 forensics): heavy-article
      // reality check — the chain clamps per-model time to
      // AI_CHAIN_TOTAL_BUDGET_MS ÷ maxModels, so the old spread
      // (HEAVY 70s intent · maxModels 5 · 180000 budget) silently granted
      // 36s per model and EVERY model aborted before finishing a
      // 1100-1400-word JSON article. New contract with the workflow budget
      // 480000: timeoutMs 120s × maxModels 4 = exactly 480s — per-model
      // time in the proven full-article class (blog content runs 150s).
      // PHASE 177 (2026-09-11 audit): the ladder's gemma steps are purged,
      // so the 4 walked entries are now all live-verified (nemotron ultra +
      // super × 2 providers) instead of 2 nemotron + 2 dead gemma buckets.
      // Small/light jobs keep the (Phase-177 raised) HEAVY/LIGHT knobs.
      timeoutMs: 120_000 as const,
      maxModels: 4 as const,
    },
  );

  const parsed = parseJSON<Record<string, unknown>>(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("فشل تحليل نتيجة التوليد (JSON غير صالح).");
  }
  const title = String(parsed.title || "").slice(0, 200).trim();
  const markdown = String(parsed.markdown || "").slice(0, 60_000).trim();
  if (!title || markdown.length < 200) {
    throw new Error("النموذج لم يُرجع مقالاً كاملاً — حاول مرة أخرى.");
  }

  // QUALITY FLOOR (2026-08-28e, tightened 2026-08-28g; recalibrated
  // 2026-08-28h after run 33176102145: gpt-oss-120b hovers 728-880 words,
  // so the 800 floor was a coin-flip that burned the final attempt at 728
  // while rate limits ate attempts 1-2). Floor 750 + STRUCTURE floor
  // (≥ 5 "## " sections); the PROMPT demands 900+ so accepted drafts
  // stay deep while the floor tolerates honest model variance.
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const sectionCount = (markdown.match(/^##\s+/gm) || []).length;
  if (wordCount < 750) {
    throw new Error(
      `QUALITY FLOOR: draft too shallow (${wordCount} words < 750 required) - requeueing for a deeper rewrite`,
    );
  }
  if (sectionCount < 5) {
    throw new Error(
      `QUALITY FLOOR: draft under-sectioned (${sectionCount} "## " sections < 5 required) - requeueing`,
    );
  }
  const faqOut = Array.isArray(parsed.faq)
    ? (parsed.faq as unknown[])
        .map((f) => {
          const o = (f ?? {}) as Record<string, unknown>;
          return {
            question: String(o.question || "").trim().slice(0, 300),
            answer: String(o.answer || "").trim().slice(0, 1200),
          };
        })
        .filter((f) => f.question && f.answer)
        .slice(0, 8)
    : [];

  // SEO-SLUG + IMAGE BUNDLE (2026-08-28i): model-proposed latin slug and
  // English photo queries. Headings are the last-resort query fallback.
  // Everything here degrades gracefully — image failures NEVER fail the
  // article (it lands without images exactly like the pre-fix flow).
  const modelSlug = sanitizeModelSlug(String(parsed.slug ?? ""));
  const imageQueries: string[] = Array.isArray(parsed.image_queries)
    ? (parsed.image_queries as unknown[]).map((q) => String(q || "").trim()).filter(Boolean)
    : [];
  if (imageQueries.length < 2) {
    for (const h of sectionSubjects(markdown, 3)) {
      if (!imageQueries.some((q) => q.toLowerCase() === h.toLowerCase()))
        imageQueries.push(h);
    }
  }
  if (imageQueries.length === 0 && focusKeyword)
    imageQueries.push(focusKeyword);

  const images = await enrichArticleImages(
    imageQueries,
    modelSlug || articleSlugFromTitle(title) || `article-${Date.now()}`,
  );
  const finalMarkdown = embedBodyImages(markdown, images);
  console.log(
    `[article_generate] images: ${images.length} sourced (cover: ${images[0]?.url ? "yes" : "no"}), slug: ${modelSlug || "(fallback net)"}`,
  );

  console.log(`[article_generate] quality: ${wordCount} words, ${sectionCount} sections, ${faqOut.length} FAQs`);
  const tags = Array.isArray(parsed.tags)
    ? (parsed.tags as unknown[]).map((t) => String(t).trim()).filter(Boolean).slice(0, 10)
    : [];

  // DRAFT MATERIALIZATION (2026-08-28d): persist the finished article as a
  // blog_posts DRAFT before reporting done — the draft exists in the
  // articles list even if every browser watcher missed the completion.
  const post_id = await materializeArticleDraft({
    title,
    markdown: finalMarkdown,
    excerpt: String(parsed.excerpt || "").slice(0, 400),
    meta_title: String(parsed.meta_title || title).slice(0, 200),
    faq: faqOut,
    meta_description: String(parsed.meta_description || "").slice(0, 300),
    tags,
    language: isAr ? "ar" : "en",
    category: category || undefined,
    focus_keyword: focusKeyword || undefined,
    slug: modelSlug || undefined,
    featured_image: images[0]?.url || "",
    cover_alt: images[0]?.alt || "",
  });
  if (post_id) console.log(`[article_generate] draft materialized: blog_posts#${post_id}`);

  return {
    title,
    slug: resolveSlug(modelSlug, title),
    markdown: finalMarkdown,
    excerpt: String(parsed.excerpt || "").slice(0, 400),
    meta_title: String(parsed.meta_title || title).slice(0, 200),
    faq: faqOut,
    meta_description: String(parsed.meta_description || "").slice(0, 300),
    tags,
    language: isAr ? ("ar" as const) : ("en" as const),
    featured_image: images[0]?.url || "",
    cover_alt: images[0]?.alt || "",
    images_embedded: Math.max(0, images.length - 1),
    topic,
    autoTopic,
    focus_keyword: focusKeyword,
    topic_rationale: topicRationale,
    category: category || undefined,
    post_id,
    draft_saved: !!post_id,
    source: model,
  };
}

/* ─────────────────────────── Registry ─────────────────────────── */

export type ProcessorResult = Record<string, unknown>;

export const PROCESSORS: Record<
  string,
  (payload: Record<string, unknown>) => Promise<ProcessorResult>
> = {
  plan_nutrition: runPlanNutrition,
  plan_workout: runPlanWorkout,
  meal_regenerate: runMealRegenerate,
  exercise_regenerate: runExerciseRegenerate,
  food_item_regenerate: runFoodItemRegenerate,
  day_regenerate: runDayRegenerate,
  article_tool: async (p: Record<string, unknown>) => {
    const out = await runArticleTool(p);
    const r: ProcessorResult = { text: out.text, tool: resolveArticleTool(String(p.tool)) };
    if (out.data) r.data = out.data;
    if (out.notes) r.notes = out.notes;
    if (out.sourceLabel) r.source = out.sourceLabel;
    return r;
  },
  article_generate: runArticleGenerate,
  social_post: runSocialPost,
};
