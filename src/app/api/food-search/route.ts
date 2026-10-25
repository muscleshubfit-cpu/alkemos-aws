import { NextRequest, NextResponse } from "next/server";
import { FOODS } from "@/lib/foods";
import { searchQuerySchema } from "@/lib/validation/schemas";
// KETO-LAW 2026-10-25: the manual-edit drawer (التبديل اليدوي) ranks
// keto-safe rows first when the OWNING plan is keto (?diet=keto) — the
// same constraint law the generation/swap gates use, imported from the
// PURE gate module (zero imports — no bundle concern).
import { checkItemConstraints } from "@/lib/plan-ai-validation";

/**
 * GET /api/food-search?q=chicken+breast[&lang=ar|en][&limit=10][&offset=0]
 *
 * Unified food search combining:
 *   1. Our local food database (FOODS array — hand-curated + USDA import)
 *   2. Open Food Facts (for commercial products with images)
 *
 * Returns unified results with consistent format.
 * Open Food Facts results include product images.
 *
 * LANG PARAM (FOOD-ARABIZATION Phase 0, 2026-09-19): ?lang=ar returns the
 * local row's `nameAr` (real MSA Arabic for the curated 80 + the 481-slug
 * SEO_FOOD_BAND pilot) — anything else, INCLUDING the default (no param),
 * keeps the historical `nameEn` contract. Matching is UNCHANGED: it
 * already searches BOTH nameAr and nameEn (lines below), so Arabic queries
 * now reach the translated band. Pinned by food-search-lang.test.ts.
 * Consumers: meal-planner FoodSearchInput (lang from useI18n) +
 * CoachClientView auto-calc. Open Food Facts names are out of scope
 * (external product names, not our data).
 *
 * BUG HISTORY (Phase 99, 2026-09-02): commit 00d6dfa ("remove source
 * names") find-replaced the REAL domain world.openfoodfacts.org into the
 * nonexistent world.product-database.org — DNS fails instantly (HTTP 000)
 * and the external half of this search died SILENTLY. Restored 2026-09-02.
 *
 * FOOD-LIBRARY-COMPLETENESS 2026-10-25 (owner order item 7 — «تأكد من
 * إتاحة مكتبة الأطعمة الكاملة… وحدد سبب غياب الأصناف المعروفة»):
 * the measured gaps on the LIVE endpoint, all in the LOCAL half:
 *   (a) «ارز» (typed without hamza) returned 0 rows while «أرز أبيض»
 *       exists — raw substring matching with ZERO Arabic normalization;
 *   (b) «صدور دجاج» returned exactly 1 row (the exact-name one) while
 *       «صدر دجاج مشوي…» etc. never surface — substring requires the
 *       query as a CONTIGUOUS ordered substring of the name;
 *   (c) "chicken" surfaced 5 «Babyfood…» USDA rows in the top 10 —
 *       array-order ranking, no relevance model.
 * The fix (local half only, OFF untouched):
 *   - Arabic-aware normalization on BOTH sides (hamza/alef shapes, ya,
 *     ta-marbuta, diacritics, tatweel, punctuation, the definite article)
 *     — «ارز» now reaches «أرز أبيض (مطبوخ)»;
 *   - TOKEN matching: every query word must appear in the normalized
 *     name, in ANY order («دجاج صدور» reaches the same rows);
 *   - relevance ranking: exact > starts-with > all-tokens > substring,
 *     with noise rows (Babyfood/Infant formula) demoted, not hidden;
 *   - pagination: ?limit (1..30, default 10) + ?offset + totalLocal so
 *     the combobox can progressive-load the FULL library, page by page.
 */

type SearchResult = {
  name: string;
  source: "local" | "openfoodfacts";
  slug?: string;
  url?: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  image?: string;
  brand?: string;
  /** KETO-LAW 2026-10-25: present only under ?diet=keto — false = this row
   * breaches the keto limits at a reference 150g portion (the drawer
   * badges it «غير كيتو» and the ranking sinks it). */
  ketoOk?: boolean;
  /** PLAN-EDIT-2026-10-24 (owner order — coach plan-editor autocomplete):
   * the LOCAL row's default serving size (grams + Arabic/English label)
   * so the editor can prefill "150 جرام" on pick. Open Food Facts rows
   * carry no serving — consumers fall back to 100g. Additive + optional:
   * the historical contract is unchanged. */
  defaultGrams?: number;
  servingAr?: string;
  servingEn?: string;
};

/** Shape of an Open Food Facts product row that this endpoint consumes. */
type OffProduct = {
  product_name?: string | null;
  code?: string | null;
  brands?: string | null;
  image_front_small_url?: string | null;
  nutriments?: Record<string, number> | null;
};

/**
 * FOOD-LIBRARY-COMPLETENESS 2026-10-25 — the shared normalizer. Mirrors
 * plan-ai-validation's normFood law (kept LOCAL so this route never
 * imports the gate's bundle): lowercase Latin, strip Arabic diacritics +
 * tatweel, unify alef/ya/ta-marbuta shapes, drop punctuation, collapse
 * spaces, and remove the definite article so «العيش» meets «عيش».
 */
function normalizeFoodText(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bال(?=\S)/g, "");
}

/** Query tokens: normalized, stop-worded (single Arabic/English letters
 * and filler words carry no search signal), duplicates collapsed. */
function queryTokens(q: string): string[] {
  const norm = normalizeFoodText(q);
  const STOP = new Set(["و", "او", "أو", "من", "مع", "في", "and", "or", "the", "of", "with"]);
  return [...new Set(norm.split(" ").filter((w) => w.length >= 2 && !STOP.has(w)))];
}

/** Relevance score for one normalized name against the query tokens.
 * Higher wins: exact (100) > starts-with (80) > all tokens anywhere (60)
 * > contiguous substring on either raw field (40). Noise rows (baby food /
 * infant formula — never what a coach adds to a client plan) demote by
 * 100 points AFTER the band score, so they only surface when nothing
 * else matches. */
function scoreName(
  nameArNorm: string,
  nameEnNorm: string,
  tokens: string[],
  rawQ: string,
  rawAr: string,
  rawEn: string,
): number {
  if (tokens.length === 0) return 0;
  const allIn = (name: string) => tokens.every((t) => name.includes(t));
  const anyIn = (name: string) => tokens.some((t) => name.includes(t));
  const both = nameArNorm + " " + nameEnNorm;
  let score = 0;
  if (nameArNorm === tokens.join(" ") || nameEnNorm === tokens.join(" ")) score = 100;
  else if (nameArNorm.startsWith(tokens.join(" ")) || nameEnNorm.startsWith(tokens.join(" "))) score = 80;
  else if (allIn(nameArNorm) || allIn(nameEnNorm) || (allIn(both) && tokens.length > 1)) score = 60;
  else if (rawAr.includes(rawQ) || rawEn.includes(rawQ)) score = 40;
  else if (anyIn(both)) score = 25;
  else return 0;
  // Noise rows (baby food / infant formula — never what a coach adds to a
  // client plan) sink to the BOTTOM of the ranking, never hidden: the
  // library-completeness law keeps every real row reachable, and a literal
  // «babyfood» query still finds its rows.
  if (/babyfood|baby food|infant formula|رضيع|أطفال|اطفال/.test(nameEnNorm + " " + nameArNorm)) {
    score = Math.min(score, 5);
  }
  return score;
}

/** KETO-LAW 2026-10-25 — is this library row keto-safe? The gate's own
 * tables (dairy law + forbidden tokens + the item carb ceiling) evaluated
 * at a REFERENCE 150g portion: a row that would breach the keto limits at
 * a typical serving carries ketoOk:false and sinks in the ranking. The
 * row stays VISIBLE and pickable — the coach keeps full override freedom
 * (default demotion, never a hidden row: the library-completeness law). */
function rowKetoOk(nameA: string, nameB: string, carbsPer100g: number): boolean {
  const macros = { carbs_g: Math.round((carbsPer100g || 0) * 1.5) };
  return (
    checkItemConstraints(nameA, macros, { dietType: "keto" }) === null &&
    checkItemConstraints(nameB, macros, { dietType: "keto" }) === null
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  // FOOD-ARABIZATION Phase 0: explicit, deterministic language switch.
  // Default (absent/unknown value) = en = the historical contract.
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";

  // KETO-LAW 2026-10-25: ?diet=keto — the manual-edit drawer passes the
  // OWNING plan's diet so keto plans rank keto-safe rows first.
  const keto = searchParams.get("diet") === "keto";

  // FOOD-LIBRARY-COMPLETENESS: pagination params — bounded, default keeps
  // the historical 10-row page. totalLocal rides every response so the
  // combobox knows whether more library rows exist past the page.
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit")) || 10));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  // PHASE 141 / A-7 wave 1: bounded query (Zod). Hostile multi-KB
  // strings no longer flow into the outbound Open Food Facts URL.
  const qParsed = searchQuerySchema.safeParse(query.trim());
  if (!qParsed.success) {
    return NextResponse.json(
      { error: "Invalid query — max 100 characters" },
      { status: 400 },
    );
  }

  const q = qParsed.data.toLowerCase();
  const tokens = queryTokens(qParsed.data);

  // 1. Search local database — matching checks BOTH language fields with
  // Arabic-aware normalization + order-free token matching, then ranks by
  // relevance (the historical 10-row array-order slice is gone). Only the
  // returned `name` honors ?lang (unchanged contract).
  const scored: Array<{ f: (typeof FOODS)[number]; score: number }> = [];
  for (const f of FOODS) {
    const rawAr = f.nameAr.toLowerCase();
    const rawEn = f.nameEn.toLowerCase();
    let score = scoreName(
      normalizeFoodText(f.nameAr),
      normalizeFoodText(f.nameEn),
      tokens,
      q,
      rawAr,
      rawEn,
    );
    // KETO-LAW 2026-10-25: keto-unsafe rows sink BELOW every keto-safe match
    // (same demotion shape as the Babyfood noise floor — visible, ranked
    // last). ketoOk rides the row so the drawer badges it «غير كيتو».
    if (keto && !rowKetoOk(f.nameAr, f.nameEn, f.per100g?.carbs ?? 0)) {
      score = Math.min(score, 10);
    }
    if (score > 0) scored.push({ f, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const totalLocal = scored.length;
  const localResults: SearchResult[] = scored
    .slice(offset, offset + limit)
    .map(({ f }) => ({
      name: lang === "ar" ? f.nameAr : f.nameEn,
      source: "local" as const,
      slug: f.slug,
      url: `/foods/${f.slug}`,
      per100g: f.per100g,
      defaultGrams: f.defaultGrams,
      servingAr: f.defaultServingAr,
      servingEn: f.defaultServingEn,
      // KETO-LAW: present only under ?diet=keto (additive optional field —
      // the historical contract is unchanged for every other consumer).
      ...(keto
        ? { ketoOk: rowKetoOk(f.nameAr, f.nameEn, f.per100g?.carbs ?? 0) }
        : {}),
    }));

  // 2. Search Open Food Facts (if query is long enough) — first page only
  // (offset pages are a LOCAL-library concern; OFF rows would repeat).
  let offResults: SearchResult[] = [];
  if (q.length >= 3 && offset === 0) {
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(
        query,
      )}&page_size=10&fields=product_name,brands,nutriments,image_front_small_url,code`;

      // Open Food Facts API policy REQUIRES an identifying User-Agent —
      // the default undici UA gets blocked (503/403) by their bot shield.
      const offRes = await fetch(offUrl, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Alkemos/1.0 (https://alkemos.com; contact via site support)",
          Accept: "application/json",
        },
      });

      if (offRes.ok) {
        const offData = await offRes.json();
        const products: OffProduct[] = offData.products || [];

        offResults = products
          .filter((p) => {
            // Only include products with nutrition data
            const n = p.nutriments || {};
            return n["energy-kcal_100g"] || n["proteins_100g"];
          })
          .map((p) => {
            const n = p.nutriments || {};
            return {
              name: p.product_name || p.code || "Unknown",
              source: "openfoodfacts" as const,
              brand: p.brands || undefined,
              image: p.image_front_small_url || undefined,
              per100g: {
                calories: Math.round(n["energy-kcal_100g"] || 0),
                protein: Math.round((n["proteins_100g"] || 0) * 10) / 10,
                carbs: Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
                fat: Math.round((n["fat_100g"] || 0) * 10) / 10,
              },
            };
          })
          .slice(0, 10);
      }
    } catch (e) {
      console.error("[api/food-search] Open Food Facts failed:", e);
    }
  }

  // 3. Merge results — local first, then Open Food Facts
  const all = [...localResults, ...offResults];

  return NextResponse.json({
    results: all,
    count: all.length,
    localCount: localResults.length,
    offCount: offResults.length,
    totalLocal,
    // Progressive-loading contract: the NEXT page's query string the
    // consumer can issue verbatim (null when the library page is spent).
    nextOffset: offset + limit < totalLocal ? offset + limit : null,
  });
}
