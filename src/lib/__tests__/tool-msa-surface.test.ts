import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
import { TOOL_LATIN_ALLOWLIST, TOOL_ACRONYMS } from "@/lib/tool-msa";
import { FAQS_AR } from "@/lib/faq-content";

/**
 * P2-10 (§12.19 item 10 — owner order «ابدأ p2 البند ١٠»): the tool-page
 * surface and the main FAQ ride the SAME MSA law as the blog (175/176) —
 * dialect markers AND Latin contamination — with the tool-context
 * allowlist documented in src/lib/tool-msa.ts (eponyms, technical
 * acronyms, payment brands; tier names are Arabic-only).
 *
 * What is scanned (and how): a comment-aware, string-aware tokenizer
 * extracts ONLY user-visible copy — string literals that contain Arabic
 * (JSX expressions, attributes, metadata) plus bare Arabic JSX text.
 * Comments are stripped, so law TEXTS quoting dialect examples can never
 * false-positive. EN-only literals are skipped (a Latin token matters
 * only inside Arabic copy). Template interpolations ${...} are code, not
 * copy, and are removed before the Latin scan.
 *
 * The manifest covers:
 *   - the ten bilingual tool pages (their /ar mirrors re-export them)
 *   - the tool-page chrome components (OtherTools, lead capture, save,
 *     share, shopping list, review invite, reference renderer)
 *   - the AR tool metadata layouts + the AR FAQ page (SERP-visible copy)
 *   - the main FAQ data (FAQS_AR)
 *
 * NOT here by design: the homepage newsletter (fixed in passing in
 * §12.41 but out of item-10 scope) and the §12.25 reference modules
 * (guarded by the Latin case added to tool-reference-content.test.ts).
 */

const TOOL_SURFACE_FILES = [
  // — the ten bilingual tool pages (EN root; /ar mirrors re-export) —
  "src/app/(en)/tools/page.tsx",
  "src/app/(en)/tools/bmi-calculator/page.tsx",
  "src/app/(en)/tools/body-fat-calculator/page.tsx",
  "src/app/(en)/tools/calorie-calculator/page.tsx",
  "src/app/(en)/tools/macro-calculator/page.tsx",
  "src/app/(en)/tools/water-tracker/page.tsx",
  "src/app/(en)/meal-planner/page.tsx",
  "src/app/(en)/ai-meal-planner/page.tsx",
  "src/app/(en)/ai-workout-planner/page.tsx",
  // — tool-page chrome (renders on the tool pages) —
  "src/components/OtherTools.tsx",
  "src/components/ShoppingListCard.tsx",
  "src/components/LeadCaptureCard.tsx",
  "src/components/SaveResultButton.tsx",
  "src/components/ShareButtons.tsx",
  "src/components/ToolReferenceContent.tsx",
  // Report 15 §5-B1 (owner order 2026-11-12): the guide strip + its pair
  // data render on every tool page — same surface, same MSA law.
  "src/components/ToolArticleLinks.tsx",
  "src/lib/tool-article-links.ts",
  "src/lib/review-invite.ts",
  // — AR tool metadata (SERP-visible titles/descriptions/keywords) —
  "src/app/(ar)/ar/tools/layout.tsx",
  "src/app/(ar)/ar/tools/bmi-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/body-fat-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/calorie-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/macro-calculator/layout.tsx",
  "src/app/(ar)/ar/tools/water-tracker/layout.tsx",
  "src/app/(ar)/ar/meal-planner/layout.tsx",
  "src/app/(ar)/ar/ai-meal-planner/layout.tsx",
  "src/app/(ar)/ar/ai-workout-planner/layout.tsx",
  "src/app/(ar)/ar/faq/page.tsx",
  // — the main FAQ data —
  "src/lib/faq-content.ts",
  // PHASE 204 (owner order 2026-09-15 — internal-pages MSA/terminology
  // cleanup): the tools-hub data source renders on /tools — dialect and
  // Latin law now cover the source itself, not just the hub page.
  "src/lib/tools-shared.ts",
] as const;

const AR_RUN = /[\u0600-\u06FF]/;

interface SurfaceCopy {
  /** String-literal inner texts containing Arabic (user-visible copy). */
  arLiterals: string[];
  /** Comment-stripped source + literal contents — dialect scan input. */
  dialectText: string;
}

/**
 * Tokenize TS/TSX: strip // and /* comments, capture string literals
 * ("…", '…', `…`), keep the remaining code/JSX text. The concatenation of
 * code text + literal contents is the complete visible-copy corpus; the
 * Arabic-containing literals alone feed the Latin scanner.
 */
function extractCopy(src: string): SurfaceCopy {
  let out = "";
  const literals: string[] = [];
  let buf = "";
  let inString: '"' | "'" | "`" | null = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const next = i + 1 < src.length ? src[i + 1] : "";
    if (inString) {
      if (c === "\\") {
        buf += c + next;
        i++;
        continue;
      }
      if (c === inString) {
        if (buf) literals.push(buf);
        buf = "";
        inString = null;
        out += " ";
        continue;
      }
      buf += c;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += " ";
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i++;
      out += " ";
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inString = c;
      continue;
    }
    out += c;
  }
  const arLiterals = literals.filter((l) => AR_RUN.test(l));
  return { arLiterals, dialectText: out + "\n" + literals.join("\n") };
}

function loadSurface(rel: string): SurfaceCopy {
  return extractCopy(readFileSync(rel, "utf8"));
}

/** Inverted gloss = a TRANSLATABLE acronym (has an Arabic equivalent)
 * leading with Latin while the Arabic translation sits in the paren:
 * «BMR (معدل الأيض)». Brands/eponyms are exempt — an Arabic appositive
 * paren after PayPal is legitimate prose, not a gloss inversion. */
const INVERTED_GLOSS_RE = new RegExp(
  `\\b(?:${TOOL_ACRONYMS.join("|")})\\s*\\([^)]*[\\u0600-\\u06FF][^)]*\\)`,
  "i",
);

describe("tool-page + main-FAQ MSA surface (P2-10 §12.41)", () => {
  it.each(TOOL_SURFACE_FILES)(
    "dialect law 175: %s — zero STRONG markers, fewer than 5 weak",
    (rel) => {
      const { dialectText } = loadSurface(rel);
      const scan = scanArabicDialect(dialectText);
      expect(
        scan.strong,
        `strong dialect markers: ${JSON.stringify(scan.strongHits)}`,
      ).toBe(0);
      expect(
        scan.weak,
        `weak dialect markers: ${JSON.stringify(scan.weakHits)}`,
      ).toBeLessThan(5);
    },
  );

  it.each(TOOL_SURFACE_FILES)(
    "latin law 176: %s — no bare Latin in Arabic copy beyond the tool allowlist",
    (rel) => {
      const { arLiterals } = loadSurface(rel);
      const latinText = arLiterals
        .map((l) => l.replace(/\$\{[^}]*\}/g, " "))
        .join("\n");
      const scan = scanLatinContamination(latinText, TOOL_LATIN_ALLOWLIST);
      expect(
        scan.count,
        `bare Latin tokens: ${JSON.stringify(scan.tokens)} — rewrite Arabic-first or gloss in parentheses (src/lib/tool-msa.ts documents the classes)`,
      ).toBe(0);
    },
  );

  it.each(TOOL_SURFACE_FILES)(
    "gloss direction: %s — Arabic leads, the Latin acronym glosses in parentheses (never the reverse)",
    (rel) => {
      const { arLiterals } = loadSurface(rel);
      const offenders = arLiterals.filter((l) => INVERTED_GLOSS_RE.test(l));
      expect(
        offenders,
        "inverted gloss(es): «Latin (شرح عربي)» — swap to «العربية (Latin)»",
      ).toEqual([]);
    },
  );

  it("tier names: FAQS_AR uses the Arabic tier names — never bare Premium/Pro/Coaching", () => {
    const corpus = FAQS_AR.map((f) => `${f.q} ${f.a}`).join("\n");
    for (const bare of ["Premium", "Pro", "Coaching"]) {
      expect(
        corpus.includes(bare),
        `bare tier name «${bare}» — the Arabic UI names are بريميوم/برو/التدريب الأونلاين (src/lib/memberships.ts nameAr)`,
      ).toBe(false);
    }
  });

  it("CANARY: the §12.41 gloss-direction fixes stay fixed", () => {
    const caloriePage = readFileSync(
      "src/app/(en)/tools/calorie-calculator/page.tsx",
      "utf8",
    );
    expect(caloriePage).toContain('"معدل الأيض الأساسي (BMR)"');
    expect(caloriePage).toContain('"الاحتياج اليومي (TDEE)"');
    const faq = readFileSync("src/lib/faq-content.ts", "utf8");
    // Phase 203 (owner-approved security rewrite 2026-09-15): the data
    // answer is simple MSA now — no acronym gloss needed (the database-
    // level access wording replaced the old RLS-gloss sentence).
    expect(faq).toContain(
      "الوصول إلى بياناتك محكوم على مستوى قاعدة البيانات نفسها",
    );
    expect(faq).toContain("تطبيق ويب تقدمي (PWA)");
    const calorieLayout = readFileSync(
      "src/app/(ar)/ar/tools/calorie-calculator/layout.tsx",
      "utf8",
    );
    expect(calorieLayout).toContain("(Mifflin-St Jeor)");
    const bodyFatLayout = readFileSync(
      "src/app/(ar)/ar/tools/body-fat-calculator/layout.tsx",
      "utf8",
    );
    expect(bodyFatLayout).toContain("(U.S. Navy)");
    expect(bodyFatLayout).not.toContain("حاسبة Body Fat");
  });

  it("CANARY: the «مفيش» empty-state regression never returns to the tool surface", () => {
    for (const rel of TOOL_SURFACE_FILES) {
      const { arLiterals } = loadSurface(rel);
      expect(
        arLiterals.some((l) => l.includes("مفيش")),
        `${rel} regressed to the مفيش dialect form`,
      ).toBe(false);
    }
  });

  // PHASE 204 (owner order 2026-09-15 — تنظيف وتوحيد النصوص في الصفحات
  // الداخلية): the «كارب» colloquial abbreviation and the «اعرف هل»
  // construction were retired from the tool surface — the homepage already
  // reads «كربوهيدرات» / «اعرف إن كان» (Phase 203) and the internal tool
  // surfaces now match it. Both classes stay dead, and the BMI hub entry
  // keeps the approved phrasing.
  it("CANARY Phase 204: «كارب» and «اعرف هل» stay dead on the tool surface", () => {
    const KARB_FILES = [
      "src/app/(en)/tools/macro-calculator/page.tsx",
      "src/app/(en)/tools/calorie-calculator/page.tsx",
      "src/app/(en)/meal-planner/page.tsx",
      "src/app/(ar)/ar/diet-plan/page.tsx",
      "src/app/(ar)/ar/tools/macro-calculator/layout.tsx",
      "src/app/(ar)/ar/tools/calorie-calculator/layout.tsx",
      "src/app/(ar)/ar/tools/bmi-calculator/layout.tsx",
      "src/app/(ar)/ar/meal-planner/layout.tsx",
      "src/app/(ar)/ar/foods/[slug]/page.tsx",
      "src/app/(en)/foods/[slug]/FoodDetailClient.tsx",
      "src/lib/tools-shared.ts",
      "src/lib/foods-shared.ts",
      "src/components/foods/FoodsFilters.tsx",
      "src/lib/content/macro-calculator.ts",
      "src/lib/tool-schema.ts",
      "src/lib/content/calorie-calculator.ts",
      "src/lib/content/meal-planner.ts",
    ];
    for (const rel of KARB_FILES) {
      const src = readFileSync(rel, "utf8");
      expect(
        src.includes("كارب"),
        `${rel}: the «كارب» abbreviation returned — the unified term is «كربوهيدرات»`,
      ).toBe(false);
    }
    const KNOW_FILES = [
      "src/app/(en)/tools/bmi-calculator/page.tsx",
      "src/app/(ar)/ar/tools/bmi-calculator/layout.tsx",
      "src/lib/tools-shared.ts",
    ];
    for (const rel of KNOW_FILES) {
      const src = readFileSync(rel, "utf8");
      expect(
        src.includes("اعرف هل"),
        `${rel}: the «اعرف هل» construction returned — the approved form is «اعرف إن كان»`,
      ).toBe(false);
    }
    // The unified terminology is present (grows-with-data phrases):
    const toolsShared = readFileSync("src/lib/tools-shared.ts", "utf8");
    expect(toolsShared).toContain("اعرف إن كان وزنك ضمن المعدل الصحي");
    expect(toolsShared).toContain("وكربوهيدرات ودهون");
  });

  it("CANARY: the tokenizer really strips comments — a dialect word in a comment is never flagged", () => {
    const probe = extractCopy(
      '// law note: «عشان» و«كده» quoted here as banned examples\nconst s = "نص فصيح سليم";\n',
    );
    expect(scanArabicDialect(probe.dialectText).strong).toBe(0);
    expect(probe.arLiterals).toEqual(["نص فصيح سليم"]);
  });

  it("CANARY: the tokenizer catches a regression — dialect in a literal fails the same probe", () => {
    const probe = extractCopy('const s = "نص فيه كده عايز";\n');
    const scan = scanArabicDialect(probe.dialectText);
    expect(scan.strong).toBeGreaterThan(0);
  });
});
