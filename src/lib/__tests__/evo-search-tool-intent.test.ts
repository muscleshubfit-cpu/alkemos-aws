import { describe, it, expect } from "vitest";
import { searchPlatform } from "@/lib/evo-search";

/**
 * GAP-20 (S4-6 live measurement 2026-11-17): tool anchors rendered ONLY
 * on the literal tool-name phrasing — scoreMatch's ≥50%-of-query-words
 * rule collapsed to ZERO on the common natural request shapes (intent
 * verbs + attached clitics + «ال» prefixes never appear inside the short
 * keyword texts). The measured zeros:
 *
 *   «عايز أحسب احتياجي اليومي من السعرات»  → 0   (no anchor)
 *   «إحسبلي سعراتي ومؤشر كتلة جسمي»        → 0   (no anchor)
 *   «إحسبلي سعراتي»                        → 0   (no anchor)
 *   «أعرض علي حاسبة السعرات»               → 0.75 (anchor renders)
 *
 * The fix adds a tool-INTENT layer (verbs × domain nouns + strong
 * phrases, fired at 0.7 — below the literal name match, above the 0.3
 * anchor threshold in /api/ai/chat). These canaries pin the natural
 * phrasings firing, the literal behavior unchanged, and the precision
 * guard (plan-creation / food-lookup / exercise asks never anchor a
 * calculator).
 */

const toolOf = (results: ReturnType<typeof searchPlatform>, slug: string) =>
  results.find((r) => r.type === "tool" && r.slug === slug);
/** The anchor threshold /api/ai/chat applies to platform results. */
const ANCHOR_THRESHOLD = 0.3;

describe("GAP-20 — natural-phrasing tool anchors fire", () => {
  it("«عايز أحسب احتياجي اليومي من السعرات» anchors the calorie calculator", () => {
    const results = searchPlatform("عايز أحسب احتياجي اليومي من السعرات");
    const cal = toolOf(results, "calorie-calculator");
    expect(cal).toBeDefined();
    expect(cal!.relevance).toBeGreaterThanOrEqual(ANCHOR_THRESHOLD);
  });

  it("«إحسبلي سعراتي» anchors the calorie calculator (clitic form)", () => {
    const results = searchPlatform("إحسبلي سعراتي");
    const cal = toolOf(results, "calorie-calculator");
    expect(cal).toBeDefined();
    expect(cal!.relevance).toBeGreaterThanOrEqual(ANCHOR_THRESHOLD);
  });

  it("«إحسبلي سعراتي ومؤشر كتلة جسمي» anchors BOTH calculators", () => {
    const results = searchPlatform("إحسبلي سعراتي ومؤشر كتلة جسمي");
    expect(toolOf(results, "calorie-calculator")).toBeDefined();
    expect(toolOf(results, "bmi-calculator")).toBeDefined();
  });

  it("English natural phrasings anchor too", () => {
    const cal = toolOf(searchPlatform("calculate my calories"), "calorie-calculator");
    expect(cal).toBeDefined();
    const bmi = toolOf(searchPlatform("what is my ideal weight"), "bmi-calculator");
    expect(bmi).toBeDefined();
  });

  it("the other calculators anchor on their natural asks", () => {
    const macro = toolOf(searchPlatform("وزّع لي السعرات على الماكروز"), "macro-calculator");
    expect(macro).toBeDefined();
    const bf = toolOf(searchPlatform("احسب نسبة الدهون في جسمي"), "body-fat-calculator");
    expect(bf).toBeDefined();
  });

  it("the daily-needs strong phrase fires with NO calculate verb («احتياجي اليومي»)", () => {
    const cal = toolOf(searchPlatform("عايز أعرف احتياجي اليومي"), "calorie-calculator");
    expect(cal).toBeDefined();
  });
});

describe("GAP-20 — existing behavior is untouched (unification, no regressions)", () => {
  it("the literal name phrasing still anchors and still OUTRANKS the intent shape", () => {
    const literal = toolOf(searchPlatform("أعرض علي حاسبة السعرات"), "calorie-calculator");
    expect(literal).toBeDefined();
    expect(literal!.relevance).toBeGreaterThanOrEqual(0.75); // the measured live score class
    const intent = toolOf(searchPlatform("إحسبلي سعراتي"), "calorie-calculator");
    expect(intent!.relevance).toBeLessThan(literal!.relevance);
  });

  it("a bare tool name with no request shape does not fire the intent layer twice or shift", () => {
    // The keyword path is untouched: «حاسبة السعرات الحرارية» keeps its
    // historical name-match relevance (≥ the intent layer's 0.7).
    const cal = toolOf(searchPlatform("حاسبة السعرات الحرارية"), "calorie-calculator");
    expect(cal).toBeDefined();
    expect(cal!.relevance).toBeGreaterThanOrEqual(0.7);
  });
});

describe("GAP-20 — precision guard (no false calculator anchors)", () => {
  it("plan-creation asks («اعمللي خطة أكل 2000 سعرة») anchor NO calculator", () => {
    const results = searchPlatform("اعمللي خطة أكل 2000 سعرة");
    expect(toolOf(results, "calorie-calculator")).toBeUndefined();
    expect(toolOf(results, "macro-calculator")).toBeUndefined();
  });

  it("food-lookup asks («كم سعرة في التفاحة؟») anchor NO calculator (the food page serves them)", () => {
    const results = searchPlatform("كم سعرة في التفاحة؟");
    expect(toolOf(results, "calorie-calculator")).toBeUndefined();
  });

  it("exercise asks («إزاي أعمل بنش بريس؟») anchor NO calculator", () => {
    const results = searchPlatform("إزاي أعمل بنش بريس؟");
    expect(results.some((r) => r.type === "tool")).toBe(false);
  });

  it("a bare noun with no intent verb («السعرات في الأرز») anchors NO calculator", () => {
    const results = searchPlatform("السعرات في الأرز");
    expect(toolOf(results, "calorie-calculator")).toBeUndefined();
  });
});
