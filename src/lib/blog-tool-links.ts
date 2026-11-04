/**
 * src/lib/blog-tool-links.ts — AUTOMATIC FREE-TOOL INTERNAL LINKING
 * (owner SEO directive, 2026-09-01).
 *
 * OWNER REQUEST: «يقوم السكريبت عند صياغة المقال بوضع روابط ذكية تحيل
 * القارئ إلى الأدوات المجانية المناسبة داخل موقعنا (مثل حاسبة السعرات،
 * الماكروز، مخطط الوجبات)».
 *
 * WHY DETERMINISTIC (not model-generated):
 *   The P4 review model already *may* add tool links, but free models
 *   comply inconsistently and occasionally invent URLs. This module is
 *   the GUARANTEE layer: pure regex + first-occurrence wrapping, no AI
 *   call, no network, idempotent (safe to run twice), language-aware
 *   (EN + AR trigger phrases) and spam-safe (max 3 links per article,
 *   one per tool, never inside an existing markdown link).
 *
 * TARGETS — every URL below is a real, indexable site route:
 *   /ai-meal-planner · /ai-workout-planner · /evo · /coaching ·
 *   /tools/calorie-calculator · /tools/macro-calculator ·
 *   /tools/body-fat-calculator · /tools/bmi-calculator ·
 *   /tools/water-tracker · /meal-planner · /programs · /exercises · /foods
 * (The tool pages render in Arabic for Arabic readers via the site's
 *  language detection — same URL space the AR homepage already uses.)
 *
 * ORDER LAW (2026-09-14 intent-map audit): most-specific-first. The AI
 * planner / EVO / coaching rules sit ABOVE the generic hubs so «مخطط
 * الوجبات بالذكاء الاصطناعي» links the AI planner — not the manual one —
 * and AI-coach mentions reach /evo, the single primary AI-coach page
 * (audit item 8: Blog → EVO/Coaching leg of the internal-linking net).
 */

export type ToolLinkRule = {
  /** Short id for logs / queue notes. */
  id: string;
  /** Site-internal destination (real route — verified against src/app). */
  url: string;
  /**
   * Arabic mirror destination for AR articles (access-point fix,
   * 2026-09-14): the tool pages render Arabic ONLY on their /ar/* URLs
   * (I18nProvider is URL-first), so an AR article linking /tools/…
   * dragged Arabic readers onto EN-rendering pages. Every target below
   * has a real /ar mirror. The EVO rule deliberately has urlAr === url —
   * owner directive 2026-09-14: no changes to /evo paths.
   */
  urlAr?: string;
  /** EN trigger patterns (word-boundary safe). */
  patternsEn: RegExp[];
  /** AR trigger patterns (plain substring — \b is meaningless for Arabic). */
  patternsAr: RegExp[];
};

/** Ordered most-specific-first; hub pages (programs/exercises/foods) last. */
const TOOL_RULES: ToolLinkRule[] = [
  {
    id: "ai-meal-planner",
    url: "/ai-meal-planner",
    urlAr: "/ar/ai-meal-planner",
    patternsEn: [/\bAI meal (?:planner|plan generator)\b/i, /\bmeal plan generator\b/i],
    patternsAr: [/مخطط الوجبات بالذكاء الاصطناعي/, /توليد خطة غذائية بالذكاء/],
  },
  {
    id: "ai-workout-planner",
    url: "/ai-workout-planner",
    urlAr: "/ar/ai-workout-planner",
    patternsEn: [/\bAI workout (?:planner|generator)\b/i, /\bworkout plan generator\b/i],
    patternsAr: [/مخطط التمارين بالذكاء الاصطناعي/, /توليد برنامج تمارين بالذكاء/],
  },
  {
    id: "evo-ai-coach",
    url: "/evo",
    // NO urlAr override — owner directive 2026-09-14: /evo paths stay
    // exactly as they are (the floating widget is the primary access).
    patternsEn: [/\bAI (?:fitness )?coache?s?\b/i, /\bAI personal trainer\b/i, /\bEVO\b/],
    patternsAr: [/مدرب اللياقة بالذكاء الاصطناعي/, /المدرب الذكي/, /كوتش ذكي/],
  },
  {
    id: "online-coaching",
    url: "/coaching",
    urlAr: "/ar/coaching",
    patternsEn: [/\bonline (?:fitness|nutrition) coaching\b/i, /\b(?:human|personal) coach(?:es)?\b/i],
    patternsAr: [/كوتشينج اونلاين/, /مدرب بشري/, /مدرب خاص/, /مدربين معتمدين/],
  },
  {
    id: "meal-planner",
    url: "/meal-planner",
    urlAr: "/ar/meal-planner",
    patternsEn: [/\bmeal plan(s|ning)?\b/i, /\bmeal prep\b/i, /\bmeal ideas?\b/i],
    patternsAr: [/خطة وجبات/, /خط[ةة] غذائي[ةة]?/, /خط[ةة] أكل/, /نظام غذائي/, /مخطط الوجبات/, /وجباتك/],
  },
  {
    id: "calorie-calculator",
    url: "/tools/calorie-calculator",
    urlAr: "/ar/tools/calorie-calculator",
    patternsEn: [/\bcalorie(s)?\b/i, /\bcaloric (deficit|surplus|intake)\b/i, /\bkcal\b/i],
    patternsAr: [/سعرات/, /كالوري/, /سعر حراري/, /السعرات الحرارية/],
  },
  {
    id: "macro-calculator",
    url: "/tools/macro-calculator",
    urlAr: "/ar/tools/macro-calculator",
    patternsEn: [/\bmacros?\b/i, /\bmacronutrients?\b/i, /\bprotein intake\b/i],
    patternsAr: [/ماكروز/, /ماكرو/, /البروتين والكارب/, /بروتينك/, /احتياجك من البروتين/],
  },
  {
    id: "body-fat-calculator",
    url: "/tools/body-fat-calculator",
    urlAr: "/ar/tools/body-fat-calculator",
    patternsEn: [/\bbody fat\b/i, /\bbody-fat\b/i, /\bfat percentage\b/i],
    patternsAr: [/نسبة الدهون/, /دهون الجسم/, /الدهون تحت الجلد/, /قياس الدهون/],
  },
  {
    id: "bmi-calculator",
    url: "/tools/bmi-calculator",
    urlAr: "/ar/tools/bmi-calculator",
    patternsEn: [/\bBMI\b/, /\bbody mass index\b/i],
    patternsAr: [/كتلة الجسم/, /مؤشر كتلة/, /بي إم آي/],
  },
  {
    id: "water-tracker",
    url: "/tools/water-tracker",
    urlAr: "/ar/tools/water-tracker",
    patternsEn: [/\bwater intake\b/i, /\bhydration\b/i, /\bdrink(ing)? water\b/i, /\bdaily water\b/i],
    patternsAr: [/شرب الماء/, /الترطيب/, /ترطيب الجسم/, /كوب ماء/, /لتر من الماء/],
  },
  {
    id: "programs-hub",
    url: "/programs",
    urlAr: "/ar/programs",
    patternsEn: [/\bworkout program\b/i, /\btraining program\b/i, /\btraining split\b/i, /\bworkout plan\b/i],
    patternsAr: [/برنامج تدريبي/, /برامج تدريب/, /الجدول التدريبي/, /برنامج تمارين/],
  },
  {
    id: "exercises-hub",
    url: "/exercises",
    urlAr: "/ar/exercises",
    patternsEn: [/\bexercises?\b/i],
    patternsAr: [/التمارين/, /التمرين/, /تمارين/],
  },
  {
    id: "foods-hub",
    url: "/foods",
    urlAr: "/ar/foods",
    patternsEn: [/\bfood database\b/i, /\bhigh[- ]protein foods?\b/i, /\bnutrition facts\b/i],
    patternsAr: [/قاعدة بيانات الأكلات/, /الأكلات/, /الأطعمة/],
  },
];

/** Hard anti-spam cap: at most 3 tool links per article. */
const MAX_LINKS = 3;

export type InsertedToolLink = { tool: string; url: string; anchor: string };

/**
 * Markdown-link architecture guard: split a line on EXISTING markdown
 * links/images and only allow insertion inside the plain-text fragments.
 * `![alt](url)` images and `[anchor](url)` links are captured and skipped.
 */
const MD_LINK_SPLIT = /(!?\[[^\]]*\]\([^)]*\))/g;

/** Lines that must never receive inline links. */
const SKIP_LINE = /^(#{1,6}\s|>|\||\s*[-*_]{3,}\s*$|!\[)/;

/**
 * CONTENT-AUDIT P0-2 root fix (2026-09-28, live evidence: 18 AR articles
 * rendered mid-word link splits such as «سعرات</a>ك» and «تمارين</a>ك» — the
 * Arabic trigger patterns are plain substrings, so /سعرات/ happily matched
 * INSIDE «سعراتك» and wrapped only the fragment, splitting the visible
 * word at render time). A character class for "word continuation": Arabic
 * letters (incl. tatweel/kashida), Arabic-Indic digits, Latin letters and
 * digits. \b is meaningless for Arabic, so the boundary is enforced at the
 * wrap site below — for every language. DELIBERATELY AFTER-EDGE ONLY: a
 * letter glued BEFORE the match (e.g. the definite article in «السعرات»)
 * still shapes as a whole word across the inline anchor in every browser
 * (established live behavior, never flagged by the audit) — only a letter
 * AFTER the closing paren visibly breaks the word.
 */
const WORD_CHAR = /[0-9A-Za-z\u0621-\u064A\u0660-\u0669\u0671-\u06D3]/;

/**
 * Wrap the FIRST plain-text occurrence of each tool's trigger phrase with
 * a markdown link to that tool — deterministic, idempotent, capped.
 *
 * @param md        Article markdown (EN or AR).
 * @param lang      Which trigger dictionary to use.
 * @returns         The (possibly) updated markdown + what was inserted,
 *                  so callers can log/annotate the queue row.
 */
export function insertToolLinks(
  md: string,
  lang: "en" | "ar",
): { md: string; inserted: InsertedToolLink[] } {
  if (!md || md.length < 40) return { md, inserted: [] };

  let result = md;
  const inserted: InsertedToolLink[] = [];

  for (const rule of TOOL_RULES) {
    if (inserted.length >= MAX_LINKS) break;

    // Locale-aware destination (access-point fix, 2026-09-14): AR articles
    // link the /ar mirrors so Arabic readers land on Arabic-rendering URLs.
    const target = lang === "ar" ? rule.urlAr ?? rule.url : rule.url;

    // IDEMPOTENCE: this tool is already linked somewhere in the article
    // (model-added in P4, or a previous run of this function) → skip.
    // Check BOTH the EN and the AR destination so a mixed-language edit
    // never double-links the same tool.
    if (result.includes(`](${rule.url})`) || result.includes(`](${target})`)) continue;

    const patterns = lang === "ar" ? rule.patternsAr : rule.patternsEn;
    const wrapped = tryWrapFirstOccurrence(result, patterns, target);
    if (wrapped) {
      result = wrapped.text;
      inserted.push({ tool: rule.id, url: target, anchor: wrapped.anchor });
    }
  }

  if (inserted.length > 0) {
    console.log(
      `[blog-tool-links] inserted ${inserted.length} tool link(s): ` +
        inserted.map((l) => `${l.tool}→${l.url}`).join(", "),
    );
  }
  return { md: result, inserted };
}

/**
 * Scan the document line by line; inside each safe line, scan only the
 * plain-text fragments (not existing markdown links). Return the updated
 * document + the anchor that was wrapped, or null if no safe match.
 */
function tryWrapFirstOccurrence(
  text: string,
  patterns: RegExp[],
  url: string,
): { text: string; anchor: string } | null {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || SKIP_LINE.test(line)) continue;

    const fragments = line.split(MD_LINK_SPLIT);
    for (let f = 0; f < fragments.length; f++) {
      // Existing markdown links/images land on odd indices after the
      // capturing split — never touch those.
      if (f % 2 === 1) continue;
      const fragment = fragments[f];
      if (!fragment) continue;

      for (const pattern of patterns) {
        const m = pattern.exec(fragment);
        if (!m || typeof m.index !== "number") continue;
        const anchor = m[0];
        // Sanity: never wrap a whitespace-only or 1-char anchor.
        if (!anchor || anchor.trim().length < 2) continue;

        // WORD-SPLIT GUARD (content-audit P0-2 root fix, 2026-09-28): a
        // match with a word character glued to its END is a MID-WORD
        // FRAGMENT — wrapping it would split the visible word at render
        // time (`سعرات</a>ك`). Skip this match; the rule keeps trying later
        // fragments, lines, and alternative patterns, so a clean mention
        // still links. (Start-edge letters are deliberately allowed — see
        // the WORD_CHAR note.)
        const after = fragment[m.index + anchor.length] ?? "";
        if (WORD_CHAR.test(after)) continue;

        fragments[f] =
          fragment.slice(0, m.index) +
          `[${anchor}](${url})` +
          fragment.slice(m.index + anchor.length);

        lines[i] = fragments.join("");
        return { text: lines.join("\n"), anchor };
      }
    }
  }
  return null;
}
