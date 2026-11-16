import { describe, it, expect, vi } from "vitest";

/**
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the shared engine's
 * canaries. The owner's governing law for every one of these:
 * «لا يجوز اعتبار إعادة المحاولة دون تغيير فعلي للمحتوى إصلاحًا» and
 * «عند تعذر الإصلاح بعد المحاولات المدروسة، تسجيل العيب والإجراءات
 * التي جُربت وسبب تعذر المعالجة بوضوح، مع عدم تسجيل الحالة كنجاح».
 *
 * Proven here, per the acceptance criteria:
 *   1. clean input → resolved, byte-identical, zero strategies run
 *   2. progress law: a cycle only counts when content CHANGED and the
 *      blocking defect count STRICTLY decreased
 *   3. no-op guard: a repairer returning the identical text is excluded
 *      (escalation), never repeated
 *   4. new-defect veto: finalValidate violations veto the cycle
 *   5. not-enough-progress veto: changed content with no strict
 *      improvement is excluded (escalation)
 *   6. escalation order: deterministic → AI (verified by call order)
 *   7. exhaustion → UnfixableDefectError carrying the HONEST ledger
 *      (defects + every strategy + why each failed) — never success
 *   8. a throwing repairer is a no-progress cycle (escalation, no crash)
 *   9. resolved output genuinely passes the assessment (before/after)
 */

import {
  runTargetedRepairLoop,
  type RepairStrategy,
} from "@/lib/quality-repair/repair-loop";
import {
  buildUnfixableReason,
  ledgerSummary,
  UnfixableDefectError,
} from "@/lib/quality-repair/repair-ledger";
import {
  dialectDefectsFromScan,
  latinDefectsFromScan,
  languageDefect,
  summarizeDefects,
  type QualityDefect,
  type QualityDefectKind,
} from "@/lib/quality-repair/defect-report";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";

/** A tiny defect world: markers "AAA" (2 blocking) + "BBB" (1). */
const mkDefects = (n: number, kind: QualityDefectKind = "dialect-strong"): QualityDefect[] =>
  Array.from({ length: n }, (_, i) => ({
    kind,
    location: `marker-${i}`,
    cause: "cause",
    fixInstruction: "fix",
  }));

describe("quality-repair engine — the owner's progress law", () => {
  it("1. clean input resolves with zero cycles and a byte-identical output", async () => {
    const applied: string[] = [];
    const res = await runTargetedRepairLoop({
      input: "clean content",
      assess: () => [],
      strategies: [
        {
          name: "s1",
          applies: () => true,
          apply: async () => {
            applied.push("s1");
            return "should never run";
          },
        },
      ],
    });
    expect(res.output).toBe("clean content");
    expect(applied).toEqual([]);
    expect(res.ledger.resolved).toBe(true);
    expect(res.ledger.cycles).toEqual([]);
  });

  it("2. a cycle counts ONLY when the content changed AND defects strictly decreased", async () => {
    const calls: string[] = [];
    const res = await runTargetedRepairLoop({
      input: "defective-A",
      assess: (t) => (t === "defective-A" ? mkDefects(2) : mkDefects(0)),
      strategies: [
        {
          name: "fixer",
          applies: () => true,
          apply: async (input) => {
            calls.push(input);
            return "repaired-content";
          },
        },
      ],
    });
    expect(calls).toEqual(["defective-A"]); // ran exactly once
    expect(res.output).toBe("repaired-content");
    expect(res.ledger.cycles).toHaveLength(1);
    expect(res.ledger.cycles[0].verdict).toBe("resolved");
    expect(res.ledger.cycles[0].outputChanged).toBe(true);
    expect(res.ledger.cycles[0].defectsBefore).toBe(2);
    expect(res.ledger.cycles[0].defectsAfter).toBe(0);
  });

  it("3. no-op guard: a repairer returning the identical text is excluded, never repeated", async () => {
    const callCount = { n: 0 };
    const res = await runTargetedRepairLoop({
      input: "defective",
      assess: () => mkDefects(1),
      strategies: [
        {
          name: "identity-repairer",
          applies: () => true,
          apply: async (input) => {
            callCount.n++;
            return input; // the banned no-op "repair"
          },
        },
      ],
      maxCycles: 3,
    }).catch((e: unknown) => e);
    expect(callCount.n).toBe(1); // NEVER repeated
    expect(res).toBeInstanceOf(UnfixableDefectError);
    const ledger = (res as UnfixableDefectError).ledger;
    expect(ledger.cycles[0].verdict).toBe("no-progress");
    expect(ledger.cycles[0].note).toContain("دون تغيير فعلي");
  });

  it("4. new-defect veto: finalValidate violations veto the cycle and escalate", async () => {
    const order: string[] = [];
    let vetoedOnce = false;
    const res = await runTargetedRepairLoop({
      input: "defective",
      assess: (t) => (t === "defective" ? mkDefects(1) : mkDefects(0)),
      strategies: [
        {
          name: "dangerous-fixer",
          applies: () => true,
          apply: async () => {
            order.push("dangerous");
            return "output-with-new-defects";
          },
        },
        {
          name: "safe-fixer",
          applies: () => true,
          apply: async () => {
            order.push("safe");
            return "clean-output";
          },
        },
      ],
      finalValidate: (candidate) => {
        if (candidate === "output-with-new-defects" && !vetoedOnce) {
          vetoedOnce = true;
          return ["arabic word-count ratio out of bounds: 0.10 (100 → 10)"];
        }
        return [];
      },
    });
    expect(order).toEqual(["dangerous", "safe"]); // escalation happened
    expect(res.output).toBe("clean-output");
    expect(res.ledger.cycles[0].verdict).toBe("no-progress");
    expect(res.ledger.cycles[0].note).toContain("عيوبًا جديدة");
    expect(res.ledger.cycles[1].verdict).toBe("resolved");
  });

  it("5. changed content with NO strict improvement is no-progress (escalation)", async () => {
    const order: string[] = [];
    await runTargetedRepairLoop({
      input: "defective",
      assess: () => mkDefects(2), // never improves
      strategies: [
        {
          name: "cosmetic-fixer",
          applies: () => true,
          apply: async () => {
            order.push("cosmetic");
            return "different-but-still-defective";
          },
        },
        {
          name: "never-reached",
          applies: () => true,
          apply: async () => "x",
        },
      ],
    }).catch((e: unknown) => e);
    // cosmetic ran ONCE (excluded after no-progress); the loop then
    // exhausted the remaining strategy identically — honest error.
    expect(order).toEqual(["cosmetic"]);
  });

  it("6. escalation order: deterministic strategy runs before the AI one", async () => {
    const order: string[] = [];
    // Mirrors the real dialect pass: the dictionary covers only SOME
    // markers — after it runs, its `applies` is false and the loop
    // escalates to the AI strategy for the remainder.
    let dictRan = false;
    await runTargetedRepairLoop({
      input: "defective",
      assess: (t) => (t === "defective" ? mkDefects(2) : t === "still-defective" ? mkDefects(1) : []),
      strategies: [
        {
          name: "deterministic-dictionary",
          applies: () => !dictRan,
          apply: async () => {
            dictRan = true;
            order.push("dict");
            return "still-defective";
          },
        },
        {
          name: "ai-tokens",
          applies: () => true,
          apply: async () => {
            order.push("ai");
            return "clean";
          },
        },
      ],
    });
    expect(order).toEqual(["dict", "ai"]);
  });

  it("7. exhaustion → UnfixableDefectError with the honest ledger (defects + strategies + why)", async () => {
    const err = (await runTargetedRepairLoop({
      input: "defective",
      assess: () => mkDefects(2),
      strategies: [
        {
          name: "deterministic-dictionary",
          applies: () => true,
          apply: async (input) => input, // no-op
        },
      ],
      maxCycles: 3,
    }).catch((e: unknown) => e)) as UnfixableDefectError;
    expect(err).toBeInstanceOf(UnfixableDefectError);
    const reason = err.ledger.unfixableReason ?? "";
    expect(reason).toContain("تعذّر الإصلاح");
    expect(reason).toContain("deterministic-dictionary");
    expect(reason).toContain("فشل صادق");
    expect(err.message).toContain("quality-repair unfixable");
    // The remaining defects ride the ledger (the operator sees WHAT
    // could not be fixed, not just that something failed).
    expect(err.ledger.remainingDefects).toHaveLength(2);
  });

  it("8. a throwing repairer is a no-progress cycle (honest note, no crash)", async () => {
    const err = (await runTargetedRepairLoop({
      input: "defective",
      assess: () => mkDefects(1),
      strategies: [
        {
          name: "ai-junk",
          applies: () => true,
          apply: async () => {
            throw new Error("degenerate payload");
          },
        },
      ],
    }).catch((e: unknown) => e)) as UnfixableDefectError;
    expect(err).toBeInstanceOf(UnfixableDefectError);
    expect(err.ledger.cycles[0].note).toContain("degenerate payload");
  });

  it("9. the resolved output genuinely passes the assessment (before/after proof)", async () => {
    // Real scanner: «حاجة»×1 + «دلوقتي»×1 in (standalone, word-boundary
    // counted), MSA out.
    const before = "تحتاج حاجة واحدة. دلوقتي ستبدأ التمرين بمرونة عالية.";
    const after = "تحتاج شيئًا واحدًا. الآن ستبدأ التمرين بمرونة عالية.";
    expect(dialectDefectsFromScan(scanArabicDialect(before))).toHaveLength(2);
    expect(dialectDefectsFromScan(scanArabicDialect(after))).toHaveLength(0);
    const res = await runTargetedRepairLoop({
      input: before,
      assess: (t) => dialectDefectsFromScan(scanArabicDialect(t)),
      strategies: [
        {
          name: "swapper",
          applies: () => true,
          apply: async () => after,
        },
      ],
    });
    expect(res.ledger.resolved).toBe(true);
    expect(scanArabicDialect(res.output).weak + scanArabicDialect(res.output).strong).toBe(0);
  });
});

describe("defect-report extractors — the reviewer's structured output", () => {
  it("dialect scan → defects carry location (marker×count), cause, and an actionable fix", () => {
    // Word-boundary law: every marker here is STANDALONE (glued forms
    // like «وبرضه» are NOT counted by the scanner — pinned by blog-msa).
    const defects = dialectDefectsFromScan(scanArabicDialect("دلوقتي عايز حاجة. برضه كده."));
    const locations = defects.map((d) => d.location).sort();
    expect(locations).toEqual(["برضه×1", "حاجة×1", "دلوقتي×1", "عايز×1", "كده×1"]);
    for (const d of defects) {
      expect(d.kind).toMatch(/^dialect-(strong|weak)$/);
      expect(d.cause.length).toBeGreaterThan(5);
      expect(d.fixInstruction).toContain("استبدل");
      expect(d.fixInstruction).toContain(d.location.split("×")[0]);
    }
  });

  it("latin scan → per-token defects (the Phase-176 class)", () => {
    const defects = latinDefectsFromScan(scanLatinContamination("معلومة عن whey و creatine معًا"));
    const tokens = defects.map((d) => d.location).sort();
    expect(tokens).toEqual(["creatine", "whey"]);
    expect(defetsKind(defects)).toEqual(["latin-token", "latin-token"]);
  });

  it("language defect names the mismatch and the required language", () => {
    const d = languageDefect("en-dominant", "ar");
    expect(d.kind).toBe("language");
    expect(d.fixInstruction).toContain("العربية الفصحى");
    const en = languageDefect("ar-dominant", "en");
    expect(en.fixInstruction).toContain("clear English");
  });

  it("summarizeDefects renders one prompt-ready directive line", () => {
    const line = summarizeDefects([
      { kind: "dialect-weak", location: "حاجة×1", cause: "c", fixInstruction: "fix it" },
    ]);
    expect(line).toContain("[dialect-weak] حاجة×1 — fix it");
    expect(summarizeDefects([])).toBe("");
  });
});

function defetsKind<T extends { kind: string }>(arr: T[]): string[] {
  return arr.map((a) => a.kind);
}

describe("repair-ledger — the honest record (owner criterion #9)", () => {
  it("buildUnfixableReason names the defect, every strategy, and the honest verdict", () => {
    const reason = buildUnfixableReason({
      cycles: [
        { strategy: "deterministic-dictionary", targeted: "dialect-strong", outputChanged: false, defectsBefore: 2, defectsAfter: 2, verdict: "no-progress", note: "الإصلاح أعاد النص نفسه" },
        { strategy: "ai-tokens", targeted: "dialect-strong", outputChanged: true, defectsBefore: 2, defectsAfter: 2, verdict: "no-progress", note: "لم يُعد مقابلًا مقبولًا" },
      ],
      remainingDefects: [
        { kind: "dialect-strong", location: "عشان×1", cause: "c", fixInstruction: "f" },
      ],
    });
    expect(reason).toContain("2 دورة");
    expect(reason).toContain("عشان×1");
    expect(reason).toContain("deterministic-dictionary: no-progress");
    expect(reason).toContain("ai-tokens: no-progress");
    expect(reason).toContain("لا يُسجَّل نجاح");
  });

  it("ledgerSummary is compact and states resolved/unresolved first", () => {
    const s = ledgerSummary({
      cycles: [
        { strategy: "dict", targeted: "x", outputChanged: true, defectsBefore: 2, defectsAfter: 0, verdict: "resolved" },
      ],
      resolved: true,
      remainingDefects: [],
    });
    expect(s).toContain("resolved");
    expect(s).toContain("dict=resolved");
  });

  it("UnfixableDefectError carries the ledger instance", () => {
    const ledger = {
      cycles: [],
      resolved: false,
      remainingDefects: [{ kind: "content", location: "x", cause: "c", fixInstruction: "f" as const }],
    };
    const e = new UnfixableDefectError("boom", ledger as never);
    expect(e.ledger).toBe(ledger);
    expect(e.name).toBe("UnfixableDefectError");
  });
});
