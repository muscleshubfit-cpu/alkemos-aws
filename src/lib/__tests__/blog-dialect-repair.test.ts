import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the ARABIC DIALECT
 * repair pass canaries. THE LIVE REFERENCE CASE (canary 1) is the
 * scheduled AR run 43875066747 on c286e06e (plus 8 of the last 13 AR
 * runs before 2026-11-16): the review model kept «حاجة»×1, the only
 * repair pass was the Latin-token repairer (scope: Latin ONLY), so
 * validateMsaConversion's `weak markers did not improve (1 → 1)`
 * clause demanded an improvement NO tool could produce, the ×3 blind
 * retry reproduced the identical marker, and the row failed honestly.
 *
 * These canaries prove the OWNER'S acceptance criteria on the exact
 * failure class:
 *   - «العيب القابل للإصلاح يجب أن يُصلح فعليًا قبل اجتياز الجودة»
 *   - «إثبات الإصلاح من خلال مقارنة المحتوى قبل الإصلاح وبعده»
 *   - «إثبات أن المحتوى النهائي اجتاز مراجعة الجودة»
 *   - «تغطية حالات الفشل المتكرر وعدم التحسن» (honest unfixable)
 */

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...orig,
    callFreeAIFallbackChain: vi.fn(),
  };
});

import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import {
  repairArabicDialectContamination,
  AR_DIALECT_REPAIR_DICTIONARY,
  translateDialectTokens,
} from "@/lib/blog-pipeline";
import {
  scanArabicDialect,
  scanLatinContamination,
  validateMsaConversion,
  validateDialectRepair,
  AR_DIALECT_STRONG_MARKERS,
  AR_DIALECT_WEAK_MARKERS,
} from "@/lib/blog-msa";

const chain = vi.mocked(callFreeAIFallbackChain);

/** A realistic AR article fixture with images/links/gloss/code fence. */
const arArticle = (bad: string): string => `# عنوان رئيسي للمقال التجريبي

## قسم أول عن التدريب

هذا نص عربي سليم في فقرة تمهيدية طويلة نسبيًا لضمان أن نسبة عدد الكلمات العربية بين النص الأصلي والنص المصلَّح تبقى داخل الحدود المقبولة للحارس الحتمي حتى بعد استبدال عدة مصطلحات عامية بمقابلها الفصيح.

الجملة الحاملة للمخالفة: ${bad}.

![صورة تدريب احترافية](https://images.pexels.com/photos/123/fitness.jpg)

رابط داخلي: [دليل التغذية الشامل](/ar/blog/nutrition-guide) ورابط خارجي: [إرشادات منظمة الصحة](https://www.who.int/news/item/1)

## قسم ثانٍ عن المكملات

معلومة عن مصل اللبن (Whey) مع إشارة لاتينية بين قوسين كمثال مقبول.

\`\`\`
code block with leucine and bmr content stays untouched
\`\`\`

## قسم ثالث ختامي

خلاصة المقال هنا مع نص ختامي عربي سليم يكفي لاجتياز فحص النسبة.

**سؤال تجريبي؟**

جواب تجريبي وافٍ على السؤال.`;

beforeEach(() => {
  chain.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("THE LIVE REFERENCE CASE — run 43875066747 («حاجة»×1 + Latin)", () => {
  it("1. the exact live failure class: «حاجة» is REPAIRED deterministically, the gate that killed the run PASSES", async () => {
    // The live shape: a WEAK dialect marker AND Latin tokens — the
    // Latin repair's validator demands weak improvement (1 → 1 fails).
    const input = arArticle("تحتاج حاجة واحدة تساعدك مع whey iso و bmr أيضًا");

    // BEFORE (the owner's demanded proof): the defect exists.
    const beforeScan = scanArabicDialect(input);
    expect(beforeScan.weak).toBeGreaterThanOrEqual(1);
    expect(scanLatinContamination(input).count).toBeGreaterThanOrEqual(2);

    // THE REPAIR: dialect first (dictionary covers حاجة — ZERO AI calls).
    const { out } = await repairArabicDialectContamination(input);
    expect(chain).not.toHaveBeenCalled(); // deterministic-only for حاجة

    // AFTER (the owner's demanded proof): content CHANGED, defect GONE.
    expect(out).not.toBe(input);
    expect(out).toContain("شيء");
    expect(out).not.toContain("حاجة");
    const afterScan = scanArabicDialect(out);
    expect(afterScan.strong).toBe(0);
    expect(afterScan.weak).toBe(0);

    // The dialect-scoped gate passes on the repaired text.
    const dialectCheck = validateDialectRepair(input, out);
    expect(dialectCheck.violations).toEqual([]);
    expect(dialectCheck.ok).toBe(true);

    // And the FULL MSA conversion gate — the exact clause that killed
    // the live run — now judges a genuinely improved text (Latin still
    // present for the Latin pass to fix, as in the live run's flow).
    const latinRemaining = scanLatinContamination(out);
    expect(latinRemaining.count).toBeGreaterThanOrEqual(2); // latin pass territory
    const msaOnDialectOnly = validateMsaConversion(input, out, { ctaLinkTolerance: false });
    // strong=0, weak strictly improved (1→0), ratio in bounds, preserved
    // family — the weak-improvement clause is satisfied honestly.
    expect(msaOnDialectOnly.violations.join(" | ")).not.toContain("weak markers did not improve");
  });

  it("2. the pre-2026-11-16 dead-end reproduced as a regression guard: WITHOUT the dialect repair the live gate fails (1 → 1)", () => {
    // Pin the live clause against the unrepaired text: the Latin
    // repair's output (byte-identical to its input for Arabic words)
    // would still fail — proving canary 1 fixed a REAL dead-end, not a
    // hypothetical one.
    const input = arArticle("تحتاج حاجة واحدة تساعدك");
    const fakeLatinOutput = input.replace(/whey|iso|bmr/g, "مقابل"); // Latin fixed, حاجة kept
    const check = validateMsaConversion(input, fakeLatinOutput, { ctaLinkTolerance: false });
    expect(check.ok).toBe(false);
    expect(check.violations.join(" | ")).toContain("weak markers did not improve");
  });
});

describe("repairArabicDialectContamination — dictionary & AI passes", () => {
  it("3. strong-marker class repaired deterministically (دلوقتي dictionary + عايز via the AI pass with context)", async () => {
    const input = arArticle("دلوقتي عايز تبدأ أسرع");
    chain.mockResolvedValueOnce({
      text: JSON.stringify({ "دلوقتي": "الآن", "عايز": "تريد" }),
      model: "test-model",
      provider: "test-provider",
    } as never);

    const { out } = await repairArabicDialectContamination(input);

    // Payload canary: the model saw the MARKERS + their sentence
    // context ONLY — never the article body.
    const callArg = chain.mock.calls[0]?.[0] ?? "";
    expect(callArg).toContain("دلوقتي");
    expect(callArg).toContain("سياقها");
    expect(callArg).not.toContain("قسم أول عن التدريب");

    // Before/after: content changed, markers gone, links preserved.
    expect(out).toContain("الآن");
    expect(scanArabicDialect(out).strong).toBe(0);
    expect(validateDialectRepair(input, out).ok).toBe(true);
  });

  it("4. unknown-marker junk AI response → per-value rejection → the HONEST unfixable record (never success)", async () => {
    const input = arArticle("عشان تفهم الفرق بسرعة");
    // The measured junk class: the model answers English words.
    chain.mockResolvedValueOnce({
      text: JSON.stringify({ "عشان": "we need to replace" }),
      model: "test-model",
      provider: "test-provider",
    } as never);
    await expect(repairArabicDialectContamination(input)).rejects.toThrow(
      /quality-repair unfixable/,
    );
  });

  it("5. AI returns a dialect value → rejected (a repair must not plant a new defect)", async () => {
    const input = arArticle("عشان تفهم الفرق بسرعة");
    chain.mockResolvedValueOnce({
      text: JSON.stringify({ "عشان": "عشان كده" }),
      model: "test-model",
      provider: "test-provider",
    } as never);
    await expect(repairArabicDialectContamination(input)).rejects.toThrow(
      /quality-repair unfixable/,
    );
  });

  it("6. clean input → byte-identical output, zero AI calls", async () => {
    const input = arArticle("نص سليم تمامًا بالفصحى الحديثة");
    const { out } = await repairArabicDialectContamination(input);
    expect(out).toBe(input);
    expect(chain).not.toHaveBeenCalled();
  });

  it("7. preservation family: URLs/images/link-targets/code fences byte-untouched; anchors repaired in place", async () => {
    const input = arArticle("دلوقتي تحتاج [رابط حاجة مفيدة](/ar/blog/nutrition-guide) للقراءة");
    const { out } = await repairArabicDialectContamination(input);
    expect(out).toContain("https://images.pexels.com/photos/123/fitness.jpg");
    expect(out).toContain("(/ar/blog/nutrition-guide)");
    expect(out).toContain("[رابط شيء مفيدة](/ar/blog/nutrition-guide)");
    expect(out).toContain("code block with leucine and bmr content stays untouched");
    expect(out).toContain("(Whey)");
  });

  it("8. mixed dialect+latin: dialect pass does NOT fix (nor introduce) Latin — the Latin pass owns it", async () => {
    const input = arArticle("دلوقتي نستخدم whey و bmr");
    const { out } = await repairArabicDialectContamination(input);
    expect(scanLatinContamination(out).count).toBe(scanLatinContamination(input).count);
    expect(out).toContain("whey");
    expect(scanArabicDialect(out).strong).toBe(0);
  });
});

describe("AR_DIALECT_REPAIR_DICTIONARY — structural canaries", () => {
  it("9. every key is a real scanner marker (the repair only touches what the detector counts)", () => {
    const markerSet = new Set([...AR_DIALECT_STRONG_MARKERS, ...AR_DIALECT_WEAK_MARKERS]);
    for (const key of Object.keys(AR_DIALECT_REPAIR_DICTIONARY)) {
      expect(markerSet.has(key), `dictionary key "${key}" is not a scanner marker`).toBe(true);
    }
  });

  it("10. every value is pure MSA — zero dialect markers, zero Latin, no markdown", () => {
    for (const [key, value] of Object.entries(AR_DIALECT_REPAIR_DICTIONARY)) {
      const scan = scanArabicDialect(value);
      expect(scan.strong, `value "${value}" (for "${key}") carries a strong marker`).toBe(0);
      expect(scan.weak, `value "${value}" (for "${key}") carries a weak marker`).toBe(0);
      expect(scanLatinContamination(value).count, `value "${value}" carries Latin`).toBe(0);
      expect(value).not.toMatch(/[A-Za-z]/);
    }
  });

  it("11. THE reference entry exists: حاجة → شيء (and حاجات → أشياء)", () => {
    expect(AR_DIALECT_REPAIR_DICTIONARY["حاجة"]).toBe("شيء");
    expect(AR_DIALECT_REPAIR_DICTIONARY["حاجات"]).toBe("أشياء");
  });

  it("12. no context-dependent marker in the dictionary (those need the AI pass — wrong single-token swaps trade dialect for grammar defects)", () => {
    const ambiguous = ["عشان", "علشان", "مش", "بتاع", "بتاعت", "بعدين", "خلاص", "تمام", "ينفع", "عايز", "عايزة", "عايزين"];
    for (const m of ambiguous) {
      expect(AR_DIALECT_REPAIR_DICTIONARY[m], `ambiguous marker "${m}" must go to the AI pass`).toBeUndefined();
    }
  });
});

describe("validateDialectRepair — the dialect-scoped pre-write gate", () => {
  it("13. the live clause shape: weak 1 → 1 fails with the exact wording style", () => {
    const before = "نص فيه حاجة واحدة مفيدة للجسم كله بشكل عام.";
    const check = validateDialectRepair(before, before);
    expect(check.ok).toBe(false);
    expect(check.violations.join(" | ")).toContain("weak markers did not improve (1 → 1");
  });

  it("14. no NEW latin: the dialect pass may not introduce Latin tokens", () => {
    const before = "نص فيه حاجة واحدة فقط بدون أي توكن لاتيني إطلاقًا هنا.";
    const after = "نص فيه شيء واحد فقط مع whey زائد لا غير.";
    const check = validateDialectRepair(before, after);
    expect(check.ok).toBe(false);
    expect(check.violations.join(" | ")).toContain("latin contamination grew");
  });

  it("15. preservation family: lost link / changed heading count veto the repair", () => {
    const before = `## عنوان أول\n\nنص فيه حاجة ورابط [دليل](/ar/blog/a).\n\n## عنوان ثانٍ\n\nنص ختامي وافٍ لاجتياز فحص النسبة.`;
    const lostLink = before.replace("حاجة", "شيء").replace("[دليل](/ar/blog/a)", "دليل");
    expect(validateDialectRepair(before, lostLink).ok).toBe(false);
    expect(validateDialectRepair(before, lostLink).violations.join(" | ")).toContain("link URLs not preserved");
    const lostHeading = before.replace("حاجة", "شيء").replace("## عنوان ثانٍ\n\n", "");
    expect(validateDialectRepair(before, lostHeading).ok).toBe(false);
  });

  it("16. 0→0 clean pass (a clean chunk must not fail)", () => {
    const clean = "نص عربي نظيف تمامًا بالفصحى الحديثة السهلة الواضحة.";
    expect(validateDialectRepair(clean, clean).ok).toBe(true);
  });
});

describe("translateDialectTokens — the context-aware AI pass", () => {
  it("17. per-value acceptance: junk English values rejected, valid MSA accepted, unknown keys ignored", async () => {
    chain.mockResolvedValueOnce({
      text: JSON.stringify({
        "عشان": "كي",
        "مش": "not at all in English words",
        "unrequested": "شيء",
      }),
      model: "m",
      provider: "p",
    } as never);
    const { map } = await translateDialectTokens([
      { token: "عشان", context: "عشان تفهم الفرق" },
      { token: "مش", context: "مش رايح" },
    ]);
    expect(map.get("عشان")).toBe("كي");
    expect(map.has("مش")).toBe(false);
    expect(map.has("unrequested")).toBe(false);
  });
});
