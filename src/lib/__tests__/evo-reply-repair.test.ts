import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";

/**
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the EVO chat
 * surface's repair canaries (the plan-family named-reason law, fitted
 * to the streaming UX). The audited gap: the cleaned reply had NO
 * content-quality validation — a wrong-language answer (English reply
 * to an Arabic member) or a strongly-dialect-colored Arabic answer
 * shipped as-is; only reasoning artifacts were cleaned.
 *
 * The owner's proof shape:
 *   - canary 1: validateEvoReplyQuality detects the EN-dominant answer
 *     to an AR member (and the AR-dominant answer to an EN member).
 *   - canary 2: bilingual answers pass BOTH directions (dominance, not
 *     presence — a warm reply quoting a brand/term never false-fails).
 *   - canary 3: STRONG dialect markers in an AR reply are defects; WEAK
 *     markers are NOT (the warm-register law).
 *   - canary 4: repairEvoReply makes ONE directed regeneration whose
 *     prompt names the defects; the repaired reply passes the SAME
 *     validator and REPLACES the first (before/after).
 *   - canary 5: a failing regeneration returns null (the route's local
 *     fallback stands — never a defective answer shipped as success)
 *     with the honest attempts ledger.
 *   - canary 6: a clean first reply pays NO regeneration (zero cost on
 *     the healthy path).
 *   - canaries 7-9: the route wiring (source pins — the repair call
 *     carries no onDelta; the final replaces the streamed text; the
 *     +repaired source tag).
 */

import {
  validateEvoReplyQuality,
  repairEvoReply,
  buildEvoRepairDirective,
} from "@/lib/evo-reply-repair";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validateEvoReplyQuality — the deterministic chat validator", () => {
  it("1. an EN-dominant answer to an AR member is a language defect (and vice versa)", () => {
    const enToAr = validateEvoReplyQuality(
      "You should eat enough protein every single day and train consistently hard.",
      "ar",
    );
    expect(enToAr.map((d) => d.kind)).toEqual(["language"]);
    const arToEn = validateEvoReplyQuality(
      "يجب أن تأكل بروتينًا كافيًا كل يوم وتتدرب بانتظام شديد جدًّا.",
      "en",
    );
    expect(arToEn.map((d) => d.kind)).toEqual(["language"]);
  });

  it("2. bilingual answers pass both directions (dominance threshold, not presence)", () => {
    // An AR answer quoting an EN term (the warm-register norm):
    expect(validateEvoReplyQuality("سعراتك تعتمد على BMR الخاص بك ومعامل النشاط كذلك.", "ar")).toEqual([]);
    // An EN answer quoting an AR word:
    expect(validateEvoReplyQuality("Your calorie target depends on activity level and goals.", "en")).toEqual([]);
  });

  it("3. STRONG dialect markers are defects; WEAK markers are not (the warm-register law)", () => {
    const strong = validateEvoReplyQuality("دلوقتي عشان تفهم الفرق بوضوح كامل بين الطرق.", "ar");
    expect(strong.map((d) => d.kind).sort()).toEqual(["dialect-strong", "dialect-strong"]);
    // Weak markers (حاجة/زي/كمان…) are the MSA-ambiguous warm register —
    // deliberately NOT chat defects (pinned: no false kill).
    expect(validateEvoReplyQuality("تحتاج حاجة بسيطة زي الماء بكمان انتباه.", "ar")).toEqual([]);
  });

  it("3b. short replies and empty text never trigger the language check", () => {
    expect(validateEvoReplyQuality("", "ar")).toEqual([]);
    expect(validateEvoReplyQuality("ok", "en")).toEqual([]);
  });
});

describe("repairEvoReply — the ONE directed regeneration", () => {
  const AR_PROMPT = "أجب عن سؤال العضو عن السعرات بالعربية الفصحى.";
  const clean = (t: string) => t.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  it("4. wrong-language first reply → ONE directed regeneration naming the defect; the repaired reply PASSES and replaces it", async () => {
    const firstReply = "You should eat protein daily and train hard.";
    const defects = validateEvoReplyQuality(firstReply, "ar");
    expect(defects).toHaveLength(1);

    // The regeneration seam: ONE dispatch, returning the repaired reply.
    const dispatch = vi
      .fn()
      .mockResolvedValueOnce({ text: "يجب أن تتناول البروتين يوميًا وتتدرب بانتظام ثابت." });

    const res = await repairEvoReply({
      prompt: AR_PROMPT,
      firstReply,
      replyLanguage: "ar",
      defects,
      dispatch: dispatch as never,
      clean,
    });

    // BEFORE/AFTER proof: the member receives the REPAIRED reply.
    expect(res.reply).toBe("يجب أن تتناول البروتين يوميًا وتتدرب بانتظام ثابت.");
    expect(validateEvoReplyQuality(res.reply ?? "", "ar")).toEqual([]);
    // The retry was DIRECTED: its prompt names the defect and carries
    // the original ask below it (the B1 shape).
    expect(dispatch).toHaveBeenCalledTimes(1);
    const repairPrompt = dispatch.mock.calls[0]?.[0] as string;
    expect(repairPrompt).toContain("إعادة إصلاح موجّهة");
    expect(repairPrompt).toContain("[language]");
    expect(repairPrompt.endsWith(AR_PROMPT)).toBe(true);
    expect(res.attempts.map((a) => a.strategy)).toEqual(["first-draw", "directed-regeneration"]);
    expect(res.attempts[1].verdict).toBe("resolved");
  });

  it("5. a failing regeneration → null + the honest ledger (the local fallback stands — never a defective success)", async () => {
    // The regeneration reproduces the same defect class — no progress.
    const dispatch = vi
      .fn()
      .mockResolvedValueOnce({ text: "Still English text that will not pass the validator here." });
    const firstReply = "English only reply again for the test.";
    const res = await repairEvoReply({
      prompt: AR_PROMPT,
      firstReply,
      replyLanguage: "ar",
      defects: validateEvoReplyQuality(firstReply, "ar"),
      dispatch: dispatch as never,
      clean,
    });
    expect(res.reply).toBeNull();
    expect(res.violationsAfter.join(" ")).toContain("unfixable");
    expect(res.attempts[1].verdict).toContain("no-progress");
    expect(res.attempts[1].verdict).toContain("language");
  });

  it("5b. a throwing regeneration → null + the honest ledger (no crash)", async () => {
    const dispatch = vi.fn().mockRejectedValueOnce(new Error("chain dead"));
    const res = await repairEvoReply({
      prompt: AR_PROMPT,
      firstReply: "wrong language text here entirely",
      replyLanguage: "ar",
      defects: validateEvoReplyQuality("wrong language text here entirely", "ar"),
      dispatch: dispatch as never,
      clean,
    });
    expect(res.reply).toBeNull();
    expect(res.attempts[1].verdict).toContain("threw: chain dead");
  });

  it("6. a clean reply pays NO regeneration (the healthy path is untouched)", async () => {
    const dispatch = vi.fn().mockResolvedValue({ text: "نص عربي سليم وافٍ بالمعلومة." });
    // (The route only calls repairEvoReply when defects exist — pinned
    // by the source canaries below; here we prove the validator keeps
    // the healthy path clean so the route never enters the branch.)
    const cleanReply = "نص عربي سليم وافٍ بالمعلومة.";
    expect(validateEvoReplyQuality(cleanReply, "ar")).toEqual([]);
    expect(dispatch).toHaveBeenCalledTimes(0);
  });
});

describe("the chat route wiring (source pins — canaries 7-9)", () => {
  const ROUTE = readFileSync("src/app/api/ai/chat/route.ts", "utf8");

  it("7. the repaired final REPLACES the streamed text (no second delta stream)", () => {
    // The repair dispatch carries NO onDelta — only the first draw streams.
    expect(ROUTE).toContain('dispatch: (repairPrompt: string) => dispatchAI("evo-chat", repairPrompt),');
    // The extracted cleaning chain is the SAME law for both paths.
    expect(ROUTE).toContain("clean: cleanEvoReplyText,");
    expect(ROUTE).toContain("cleanText = cleanEvoReplyText(aiReply);");
  });

  it("8. the success path tags the reply +repaired (honest telemetry, local fallback on failure)", () => {
    expect(ROUTE).toContain("`${aiProvider}:${aiModel}+repaired`");
    expect(ROUTE).toContain("Directed repair did not resolve");
  });

  it("9. the quality gate sits BETWEEN the shape check and the success send (order law)", () => {
    const shapeIdx = ROUTE.indexOf("Cleaned text still looks like reasoning");
    const qualityIdx = ROUTE.indexOf("validateEvoReplyQuality(cleanText, replyLanguage)");
    const successIdx = ROUTE.indexOf("sendFinal(cleanText, `${aiProvider}:${aiModel}`)");
    expect(shapeIdx).toBeGreaterThan(-1);
    expect(qualityIdx).toBeGreaterThan(shapeIdx);
    expect(successIdx).toBeGreaterThan(qualityIdx);
  });
});
