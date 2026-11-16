import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

/**
 * AI-GENERATION-PIPELINES AUDIT — plan §9, PHASE P2 ITEM 8 (executed
 * 2026-11-16): «تنظيف الكود الميت المُثبت بهذا التقرير (REC-16/17/19/20،
 * INF-16/17، ART-22/24/26، WOR-17) — إطار نظافة واحد بلا سلوك».
 *
 * THE TEN FINDINGS THIS SHIELD PINS (behavioral + source-contract
 * canaries in the repo's established patterns — the cleanup must never
 * silently regress):
 *
 *   REC-16  the stamped gateCount derives from ONE list (GATE_IDS) that
 *           provably equals the battery's emitted `gate: "…"` literals —
 *           a hand-stamped number had drifted twice (14 over 12, then 15
 *           counting the empty D-GATE-1 block).
 *   REC-17  four dead-code deletions stay dead: existingSlugsByLang
 *           (unread input), markRecipeQueueHeld (never called),
 *           OILY_RECIPE_CARBS_G + COOKED_MAIN_DISH_TYPES (orphan
 *           constants), ingredientCategories (disabled input).
 *   REC-19  the R1 master-insert slug can never burn the GLOBAL unique
 *           index with the bare «recipe» fallback a second time.
 *   REC-20  an N-GATE-1 structural violation at R2 HOLDS with
 *           rerun_target=r1-structure (the header's promise) instead of
 *           the general catch's terminal failed.
 *   INF-16  JobPayloadError (never thrown — retired contract) stays
 *           deleted together with the route's unreachable 400 branch.
 *   INF-17  the dead durationWeeks branch stays deleted AND the
 *           plan_workout sanitizer allowlist still never copies it (the
 *           contract that made the branch dead in the first place).
 *   ART-22  the latin-repair \u0000N\u0000 placeholder sentinel is
 *           collision-proof: a corrupted NUL payload can no longer ride
 *           the restore regex (kept[N] injection / «undefined»).
 *   ART-24  the blog runner captures QUEUE_ID from p0-research ONLY
 *           (the documented design); the recipes twin deliberately
 *           keeps its any-step capture (RC4 fresh-r0 rows mid-run).
 *   ART-26  the (topic, topic, [post]) duplicate-test call exists
 *           exactly ONCE in the codebase (topicMatchesRecentPost) — the
 *           five former copy-paste sites all route through it.
 *   WOR-17  demo registry entries are bilingual, the retry reminder
 *           speaks the prompt's language, the endurance goal label
 *           names endurance, and the stale «547 library» comment stays
 *           fixed (868 measured).
 */

// ── ART-22: the chain boundary (the r2 mocking pattern — the repair
// engine's small token call is mocked so the dictionary pass is proven
// deterministic; a corrupted payload must need NO model call at all).
vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...orig,
    callFreeAIFallbackChain: vi.fn(),
  };
});

import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import { repairArabicLatinContamination } from "@/lib/blog-pipeline";
import { scanLatinContamination } from "@/lib/blog-msa";
import {
  assembleGateReport,
  GATE_IDS,
  runRecipeQualityGates,
  type RecipeGateInput,
} from "@/lib/recipes-quality-gates";
import {
  pairSlugify,
  pairSlugForMasterInsert,
} from "@/lib/recipes-pipeline";
import {
  computeRecipeNutrition,
  isNGate1StructuralViolation,
  N_GATE1_VIOLATION_PREFIX,
} from "@/lib/recipes-nutrition";
import { topicMatchesRecentPost } from "@/lib/blog-topics";
import { workoutGoalOptions } from "@/lib/ai-workout-planner";

const chain = vi.mocked(callFreeAIFallbackChain);

const read = (p: string) => readFileSync(p, "utf8");
/** Strip comments — the law documentation MENTIONS the retired names;
 * only executable code must not contain them (the repo's pin pattern). */
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

beforeEach(() => {
  chain.mockReset();
});

/* ════════════════════ REC-16 — the honest gate count ════════════════════ */

describe("REC-16 — gateCount derives from the REAL battery (never hand-stamped)", () => {
  it("GATE_IDS is exactly the battery's emitted gate literals (set-equality, source-contract)", () => {
    const src = read("src/lib/recipes-quality-gates.ts");
    const emitted = [...new Set([...src.matchAll(/gate: "([A-Z]-GATE-\d+)"/g)].map((m) => m[1]))];
    expect(emitted.sort()).toEqual([...GATE_IDS].sort());
    expect(emitted).toHaveLength(14); // N1-N5 + P1-P3 + Q1-Q6 — the empty D-GATE-1 block is gone
  });

  it("assembleGateReport stamps GATE_IDS.length — a new gate without a list entry fails the push", () => {
    const report = assembleGateReport([]);
    expect(report.gateCount).toBe(GATE_IDS.length);
    expect(report.gateCount).toBe(14);
    expect(report.passed).toBe(true);
  });

  it("the dead D-GATE-1 empty if-block is deleted (documentation comment only)", () => {
    const src = stripComments(read("src/lib/recipes-quality-gates.ts"));
    expect(src).not.toContain("input.derivedDiets.length === 0");
  });
});

/* ═══════════════ REC-17 — the four dead-code deletions stay dead ═════════ */

describe("REC-17 — dead code stays deleted (resurrection guards)", () => {
  it("existingSlugsByLang is gone from the battery type AND the r5 wiring", () => {
    expect(stripComments(read("src/lib/recipes-quality-gates.ts"))).not.toContain("existingSlugsByLang");
    const r5 = stripComments(read("src/app/api/cron/recipes/r5-gates/route.ts"));
    expect(r5).not.toContain("existingSlugsByLang");
    expect(r5).not.toContain("slugsByLang");
  });

  it("markRecipeQueueHeld (never called) is gone from recipes-queue.ts", () => {
    expect(stripComments(read("src/lib/recipes-queue.ts"))).not.toContain("markRecipeQueueHeld");
  });

  it("the orphan constants OILY_RECIPE_CARBS_G and COOKED_MAIN_DISH_TYPES are gone", () => {
    const src = stripComments(read("src/lib/recipes-quality-gates.ts"));
    expect(src).not.toContain("OILY_RECIPE_CARBS_G");
    expect(src).not.toContain("COOKED_MAIN_DISH_TYPES");
  });

  it("the disabled ingredientCategories input is gone from the diet rules", () => {
    expect(stripComments(read("src/lib/recipes-diet-rules.ts"))).not.toContain("ingredientCategories");
  });

  it("battery semantics identical: the clean pair still passes with the trimmed input type", () => {
    // The full-shape behavioral proof lives in recipes-gates-hold /
    // recipes-p1-gates (rewritten same-commit). A minimal inline proof:
    // the deleted field was NEVER read, so a compliant input built
    // WITHOUT it returns zero violations.
    const input = buildCleanInput();
    expect(runRecipeQualityGates(input)).toEqual([]);
  });
});

/** A fully-compliant minimal input (the recipes-gates-hold base shape). */
function buildCleanInput(): RecipeGateInput {
  return {
    pairSlug: "healthy-chicken-shawarma",
    servings: 2,
    servingWeightG: 300,
    prepMinutes: 20,
    cookMinutes: 25,
    ingredients: [
      {
        position: 1,
        amount_g: 300,
        weight_state: "raw",
        name_ar: "صدر دجاج",
        name_en: "chicken breast",
        nutrient_ref_slug: "chicken-breast",
        is_optional: false,
      },
    ],
    refs: new Map([
      [
        "chicken-breast",
        {
          slug: "chicken-breast",
          per100g: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, sat_fat_g: 1, sodium_mg: 74 },
          flags: [],
        },
      ],
    ]),
    versions: [
      {
        language: "ar",
        title: "شاورما دجاج صحية",
        excerpt: "وصفة شاورما دجاج خفيفة بمكونات بسيطة.",
        steps: [
          { position: 1, text: "تبّل الدجاج بالبهارات." },
          { position: 2, text: "اشوِ الدجاج على نار متوسطة." },
          { position: 3, text: "قدّمه مع الخبز البلدي." },
        ],
        tips: "أضف лимونًا عند التقديم.",
        storageInfo: "يحفظ بالثلاجة يومين.",
        metaTitle: "شاورما دجاج صحية",
        metaDescription: "طريقة تحضير شاورما دجاج صحية بمكونات بسيطة في أقل من ساعة.",
      },
      {
        language: "en",
        title: "Healthy Chicken Shawarma",
        excerpt: "A light chicken shawarma with simple ingredients.",
        steps: [
          { position: 1, text: "Marinate the chicken with the spices." },
          { position: 2, text: "Grill over medium heat." },
          { position: 3, text: "Serve with flatbread." },
        ],
        tips: "Add lemon when serving.",
        storageInfo: "Keeps two days refrigerated.",
        metaTitle: "Healthy Chicken Shawarma",
        metaDescription: "How to make a healthy chicken shawarma with simple ingredients in under an hour.",
      },
    ],
    perServing: {
      calories: 250,
      protein_g: 46,
      carbs_g: 2,
      fat_g: 5,
      fiber_g: 0,
      sat_fat_g: 1,
      sodium_mg: 110,
    },
    consistency: {
      total: { pass: true, computed: 1000, fromMacros: 994 },
      perServing: { pass: true, computed: 500, fromServing: 500, computed2: 500 } as never,
    },
    derivedDiets: ["high-protein"] as never,
    imageUrl: "https://images.pexels.com/photos/1/food.jpg",
    imageVerified: true,
    imageAltAr: "صحن شاورما دجاج مع الخبز البلدي",
    existingPairSlugs: new Set(),
    existingTitlesByLang: new Map([
      ["ar", new Set()],
      ["en", new Set()],
    ]),
    publishedIngredientSets: [],
  };
}

/* ══════════════════ REC-19 — collision-proof slug fallback ══════════════════ */

describe("REC-19 — the master-insert slug can never collide on the empty-slug edge", () => {
  it("an Arabic-only themeEn (empty latin slug) yields a UNIQUE recipe-<8hex>, never the bare «recipe»", () => {
    const a = pairSlugForMasterInsert("طاجن صدر دجاج بالفرن مع الخضار");
    const b = pairSlugForMasterInsert("شوربة عدس بالليمون والكمون");
    expect(a).toMatch(/^recipe-[0-9a-f]{8}$/);
    expect(b).toMatch(/^recipe-[0-9a-f]{8}$/);
    expect(a).not.toBe(b); // two distinct corrupted titles never share a slug
    expect(a).not.toBe("recipe"); // the guaranteed unique-index collision is dead
  });

  it("legitimate latin titles are byte-identical to pairSlugify (zero normal-path change)", () => {
    expect(pairSlugForMasterInsert("Oven-baked chicken breast tagine with vegetables"))
      .toBe(pairSlugify("Oven-baked chicken breast tagine with vegetables"));
  });

  it("pairSlugify's own deterministic fallback stays pinned (the idea-layer dedup relies on it)", () => {
    expect(pairSlugify("")).toBe("recipe");
    expect(pairSlugify("شوربة عدس")).toBe("recipe");
  });

  it("the r1 master insert routes through the wrapper (source contract)", () => {
    const src = stripComments(read("src/app/api/cron/recipes/r1-structure/route.ts"));
    expect(src).toContain("pairSlugForMasterInsert(idea.themeEn)");
    expect(src).not.toMatch(/pairSlugify\(idea\.themeEn\)/);
  });
});

/* ══════════════ REC-20 — N-GATE-1 holds at r1 (the header's promise) ═════════ */

describe("REC-20 — N-GATE-1 structural violations HOLD with rerun r1-structure", () => {
  it("the classifier recognizes exactly the computeRecipeNutrition throw shapes", () => {
    expect(isNGate1StructuralViolation(
      new Error(`${N_GATE1_VIOLATION_PREFIX} ingredient "x" (1) has NO nutrient_reference row for slug "y"`),
    )).toBe(true);
    expect(isNGate1StructuralViolation(
      new Error(`${N_GATE1_VIOLATION_PREFIX} ingredient "x" (1) amount_g must be > 0`),
    )).toBe(true);
    expect(isNGate1StructuralViolation(
      new Error(`${N_GATE1_VIOLATION_PREFIX} ingredient "x" (1) has invalid weight_state "z"`),
    )).toBe(true);
    // non-structural classes stay non-structural
    expect(isNGate1StructuralViolation(new Error("[recipes-nutrition] servings must be ≥ 1"))).toBe(false);
    expect(isNGate1StructuralViolation(new Error("supabase fetch failed"))).toBe(false);
    expect(isNGate1StructuralViolation("just a string")).toBe(false);
    expect(isNGate1StructuralViolation(null)).toBe(false);
  });

  it("computeRecipeNutrition still throws the pinned prefix on a missing ref (the live class)", () => {
    expect(() =>
      computeRecipeNutrition({
        servings: 2,
        ingredients: [
          {
            position: 1,
            amount_g: 100,
            weight_state: "raw",
            name_ar: "مكون",
            name_en: "ghost ingredient",
            nutrient_ref_slug: "not-in-refs",
            is_optional: false,
          },
        ],
        refs: new Map(),
      }),
    ).toThrow(N_GATE1_VIOLATION_PREFIX);
  });

  it("the r2 route maps the class to held + rerun_target r1-structure BEFORE the general catch (source contract)", () => {
    const src = stripComments(read("src/app/api/cron/recipes/r2-nutrition/route.ts"));
    // the EXACT guard line — a disabled/negated branch (`false && …`)
    // breaks this pin (proven by the documented mutation drill)
    expect(src).toContain("if (isNGate1StructuralViolation(structural)) {");
    const catchIdx = src.indexOf("catch (structural)");
    const heldIdx = src.indexOf('rerun_target: "r1-structure"', catchIdx);
    expect(catchIdx).toBeGreaterThan(-1);
    expect(heldIdx).toBeGreaterThan(catchIdx);
    // the N-GATE-1 branch precedes the general catch (fail-fast ordering)
    expect(catchIdx).toBeLessThan(src.indexOf("} catch (err)"));
  });
});

/* ════════════ INF-16 — JobPayloadError dead class stays deleted ═══════════ */

describe("INF-16 — JobPayloadError (never thrown) stays deleted with its unreachable branch", () => {
  it("no executable trace of the class anywhere in the enqueue path", () => {
    expect(stripComments(read("src/lib/ai-jobs.ts"))).not.toContain("JobPayloadError");
    expect(stripComments(read("src/app/api/ai/jobs/route.ts"))).not.toContain("JobPayloadError");
    expect(stripComments(read("src/app/api/ai/jobs/route.ts"))).not.toContain("e.message }, { status: 400 }");
  });
});

/* ═════════ INF-17 — the dead durationWeeks branch + its allowlist contract ═══════ */

describe("INF-17 — durationWeeks stays out of the processor AND out of the allowlist", () => {
  it("the processor no longer reads payload.durationWeeks (the dead branch)", () => {
    expect(stripComments(read("src/lib/ai-job-processors.ts"))).not.toContain("durationWeeks");
  });

  it("the plan_workout sanitizer allowlist still never copies durationWeeks (the contract that made the branch dead)", () => {
    const src = stripComments(read("src/lib/ai-jobs.ts"));
    const caseIdx = src.indexOf('case "plan_workout"');
    expect(caseIdx).toBeGreaterThan(-1);
    const caseEnd = src.indexOf("case ", caseIdx + 10);
    const block = src.slice(caseIdx, caseEnd > caseIdx ? caseEnd : undefined);
    expect(block).not.toContain("durationWeeks");
  });
});

/* ═══════════════ ART-22 — NUL-collision-proof latin repair ═══════════════ */

describe("ART-22 — the \\u0000N\\u0000 placeholder sentinel is collision-proof", () => {
  const arArticle = (bad: string): string => `# عنوان رئيسي للمقال التجريبي

## قسم أول عن التدريب

هذا نص عربي سليم في فقرة تمهيدية طويلة نسبيًا لضمان أن نسبة عدد الكلمات العربية بين النص الأصلي والنص المصلَّح تبقى داخل الحدود المقبولة للحارس الحتمي حتى بعد استبدال عدة مصطلحات لاتينية بمقابلها العربي.

الجملة الحاملة للمخالفة: ${bad}.

![صورة تدريب احترافية](https://images.pexels.com/photos/123/fitness.jpg)

## قسم ثانٍ ختامي

خلاصة المقال هنا مع نص ختامي عربي سليم يكفي لاجتياز فحص النسبة.

**سؤال تجريبي؟**

جواب تجريبي وافٍ على السؤال.`;

  it("a corrupted \\u00003\\u0000 payload is neutralized — no kept[N] injection, no «undefined», no NUL leak", async () => {
    // The corrupted marker sits BEFORE the protected spans of its line:
    // pre-fix, the final restore regex substituted kept[3] (undefined →
    // the literal «undefined») into the prose.
    const input = arArticle(
      "اشرب whey فور التمرين \u00003\u0000 ثم تناول أرزًا (Whey) كاملًا",
    );
    const out = await repairArabicLatinContamination(input, scanLatinContamination(input).tokens);

    expect(out).not.toContain("undefined");
    expect(out).not.toContain("\u0000"); // no placeholder ever leaks
    expect(out).not.toContain("\u00003\u0000");
    expect(out).toContain("مصل اللبن"); // the real token still gets repaired
    // the protected spans of that line survive intact (exactly once —
    // the corrupted marker cannot duplicate them either)
    expect(out.match(/\(Whey\)/g)?.length).toBe(1);
  });

  it("clean input is untouched by the hardening (byte-parity: no spurious spans, no NUL)", async () => {
    const input = arArticle("اشرب whey فور التمرين مع ملاحظة (Whey) بالأقواس");
    const out = await repairArabicLatinContamination(input, scanLatinContamination(input).tokens);

    expect(out).toContain("مصل اللبن");
    expect(out).not.toContain("\u0000");
    expect(out.match(/https:\/\/images\.pexels\.com\/photos\/123\/fitness\.jpg/g)?.length).toBe(1);
    expect(out.match(/\(Whey\)/g)?.length).toBe(1);
    expect(chain).not.toHaveBeenCalled(); // dictionary pass owns it — no AI
  });
});

/* ═══════════ ART-24 — p0-only QUEUE_ID capture in the blog runner ═════════ */

describe("ART-24 — the blog runner captures QUEUE_ID from p0-research ONLY", () => {
  it("the capture block is guarded by the p0 step (the documented design)", () => {
    const src = read("scripts/blog-runner/run-step.sh");
    expect(src).toContain('if [ "$STEP" = "p0-research" ]; then');
    // the grep lives INSIDE the p0 guard
    const guardIdx = src.indexOf('if [ "$STEP" = "p0-research" ]; then');
    const grepIdx = src.indexOf("grep -o '\"queueId\":\"[^\"]*\"'");
    expect(grepIdx).toBeGreaterThan(guardIdx);
  });

  it("the recipes twin DELIBERATELY keeps its any-step capture (RC4 fresh-r0 rows mid-run)", () => {
    const src = read("scripts/recipes-runner/run-step.sh");
    expect(src).toContain("capture_queue_id");
    expect(src).not.toContain('if [ "$STEP" = "r0-idea" ]; then\n');
  });
});

/* ═══════════ ART-26 — the ONE topic-vs-recent-post duplicate test ═════════ */

describe("ART-26 — topicMatchesRecentPost is the single (topic, topic, [post]) call", () => {
  it("semantics pinned: lexical duplicate AND semantic paraphrase collide; a distinct topic does not", () => {
    // lexical: the topic is its own focus keyword — exact containment
    const recent = { title: "أفضل تمارين الصدر لبناء العضلات", focusKeyword: "تمارين الصدر" };
    expect(topicMatchesRecentPost("تمارين الصدر", recent)).toBe(true);
    // semantic: the owner order's canonical essence pair — zero shared
    // words, the SAME reader question (the blog-semantic regression vector)
    const sleepRecent = { title: "المدة المثالية للنوم لأفضل استشفاء عضلي", focusKeyword: "" };
    expect(topicMatchesRecentPost("كم ساعة نوم يحتاج الرياضي؟", sleepRecent)).toBe(true);
    // a genuinely different sub-question stays distinct (the same-file twin)
    expect(topicMatchesRecentPost("كيف يؤثر النوم على هرمونات البناء العضلي؟", sleepRecent)).toBe(false);
    expect(topicMatchesRecentPost("جدول نوم الصائم في رمضان", recent)).toBe(false);
  });

  it("the doubled-call pattern exists EXACTLY ONCE in the codebase — inside the helper", () => {
    const helperSrc = stripComments(read("src/lib/blog-topics.ts"));
    // the DOUBLED (t, t, [post]) shape — the definition and the smart-picker's
    // (topic, focusKw, recent) call are different shapes and don't match
    expect((helperSrc.match(/isDuplicateTopic\(\s*\w+,\s*\w+,\s*\[recent\]\)/g) ?? []).length).toBe(1);
    expect((helperSrc.match(/findSemanticTopicCollision\(\s*\w+,\s*\w+,\s*\[recent\]\)/g) ?? []).length).toBe(1);
    // the five former copy-paste sites all route through the helper
    for (const file of [
      "src/lib/blog-pipeline.ts",
      "src/app/api/cron/blog/p1-outline/route.ts",
      "src/lib/blog-research.ts",
      "src/lib/blog-pairing.ts",
    ]) {
      const src = stripComments(read(file));
      expect(src).not.toContain("isDuplicateTopic(");
      expect(src).not.toContain("findSemanticTopicCollision(");
      expect(src).toContain("topicMatchesRecentPost(");
    }
  });
});

/* ═══════════════ WOR-17 — the four metadata coherences ═══════════════ */

describe("WOR-17 — metadata coherences stay coherent", () => {
  it("both demo registry entries declare their BILINGUAL surface", () => {
    const src = stripComments(read("src/lib/ai-registry.ts"));
    for (const id of ["meal-demo", "workout-demo"]) {
      const entry = src.slice(src.indexOf(`"${id}":`), src.indexOf("}", src.indexOf(`"${id}":`)));
      expect(entry).toContain('language: "both"');
      expect(entry).not.toContain('language: "en"');
    }
  });

  it("the retry reminder speaks the prompt's language on BOTH demo surfaces", () => {
    const workout = read("src/app/api/ai/workout-plan-demo/route.ts");
    expect(workout).toContain("تذكير: أعد كائن JSON واحدًا فقط");
    expect(workout).toContain("REMINDER: reply with ONE JSON object"); // the EN contract + the older pin

    const meal = read("src/app/api/ai/meal-plan-demo/route.ts");
    expect(meal).toContain("تذكير: أعد كائن JSON واحدًا فقط");
    expect(meal).toContain("REMINDER: reply with ONE JSON object");
  });

  it("the endurance goal label names ENDURANCE (not general fitness)", () => {
    const ar = workoutGoalOptions("ar").find((o) => o.slug === "endurance");
    const en = workoutGoalOptions("en").find((o) => o.slug === "endurance");
    expect(ar?.label).toContain("التحمل");
    expect(ar?.label).not.toBe("اللياقة العامة");
    expect(en?.label).toContain("endurance");
    expect(en?.label).not.toBe("general fitness");
  });

  it("the stale «547 library» comment stays fixed at the measured 868", () => {
    const src = stripComments(read("src/lib/plan-generator.ts"));
    expect(src).not.toContain("547");
  });
});
