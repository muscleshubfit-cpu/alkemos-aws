/**
 * blog-pairing.test.ts — Phase 157 bilingual pairing laws (22 tests).
 *
 * Every validation law of the pairing core is covered with INJECTED time
 * (deterministic, no fake timers): extractSharedBrief (6) ·
 * isAdoptablePairRow (6) · parsePairingJSON (8) · isValidAngleId (2).
 * Test literals derive from the documented Phase 157 spec (STATE/worklog).
 */
import { describe, it, expect } from "vitest";
import {
  extractSharedBrief,
  isAdoptablePairRow,
  parsePairingJSON,
  isValidAngleId,
  withCoachTopic,
  ADOPT_MAX_AGE_HOURS,
  JOIN_MAX_AGE_HOURS,
  type SharedBrief,
} from "@/lib/blog-pairing";

const NOW = new Date("2026-09-09T12:00:00.000Z");
const PAIR = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

const EN_TOPIC = "How many calories should you really eat to lose weight";
const AR_TOPIC = "كم سعرة تحتاج فعلاً يوميًا لخسارة الوزن بدون فقدان العضلات";
const AR_NEW = "أفضل توزيع للبروتين والسعرات على وجبات اليوم لحرق الدهون";

const VALID_BRIEF = {
  pairId: PAIR,
  topicEn: EN_TOPIC,
  topicAr: AR_TOPIC,
  angleId: "guide",
  sealedAt: "2026-09-09T10:00:00.000Z", // 2h before NOW
};

describe("extractSharedBrief", () => {
  it("accepts a fully valid sealed brief", () => {
    const brief = extractSharedBrief({ research0: {}, sharedBrief: VALID_BRIEF }, { now: NOW });
    expect(brief).not.toBeNull();
    expect(brief?.pairId).toBe(PAIR);
    expect(brief?.angleId).toBe("guide");
  });

  it("rejects a raw text bundle (double-encoded / garbage)", () => {
    expect(extractSharedBrief("not-an-object", { now: NOW })).toBeNull();
    expect(extractSharedBrief(JSON.stringify(VALID_BRIEF), { now: NOW })).toBeNull();
  });

  it("rejects a legacy V3 bundle (no sharedBrief at all)", () => {
    expect(extractSharedBrief({ research0: { topics: ["x"] } }, { now: NOW })).toBeNull();
    expect(extractSharedBrief(null, { now: NOW })).toBeNull();
  });

  it("rejects too-short topics (min 10 chars each side)", () => {
    expect(
      extractSharedBrief(
        { sharedBrief: { ...VALID_BRIEF, topicEn: "short" } },
        { now: NOW },
      ),
    ).toBeNull();
    expect(
      extractSharedBrief(
        { sharedBrief: { ...VALID_BRIEF, topicAr: "قصير" } },
        { now: NOW },
      ),
    ).toBeNull();
  });

  it("enforces the freshness window with injected time (adopt ≤72h — AUDIT §9-2.5 widened)", () => {
    const stale = { ...VALID_BRIEF, sealedAt: "2026-09-06T08:00:00.000Z" }; // 73h old
    expect(extractSharedBrief({ sharedBrief: stale }, { now: NOW })).toBeNull();
    const fresh = { ...VALID_BRIEF, sealedAt: "2026-09-06T14:00:00.000Z" }; // 71h old (2nd-day rescue)
    expect(extractSharedBrief({ sharedBrief: fresh }, { now: NOW })).not.toBeNull();
    const future = { ...VALID_BRIEF, sealedAt: "2026-09-09T13:00:00.000Z" }; // negative age
    expect(extractSharedBrief({ sharedBrief: future }, { now: NOW })).toBeNull();
    expect(ADOPT_MAX_AGE_HOURS).toBe(72);
    expect(JOIN_MAX_AGE_HOURS).toBe(48);
  });

  it("drops unknown angle ids (typo or retired angle)", () => {
    expect(
      extractSharedBrief(
        { sharedBrief: { ...VALID_BRIEF, angleId: "not-an-angle" } },
        { now: NOW },
      ),
    ).toBeNull();
  });
});

describe("isAdoptablePairRow", () => {
  const ROW = {
    id: "11111111-2222-4333-8444-555555555555",
    language: "en",
    status: "researched",
    pair_id: PAIR,
    created_at: "2026-09-09T08:00:00.000Z", // 4h before NOW
  };

  it("accepts a matching my-language researched recent pair row", () => {
    expect(isAdoptablePairRow(ROW, "en", { now: NOW })).toBe(true);
  });

  it("rejects a row of the OTHER language", () => {
    expect(isAdoptablePairRow(ROW, "ar", { now: NOW })).toBe(false);
  });

  it("rejects a row not in researched status (already outlined/published)", () => {
    expect(
      isAdoptablePairRow({ ...ROW, status: "outlined" }, "en", { now: NOW }),
    ).toBe(false);
  });

  it("rejects a row without a valid pair_id", () => {
    expect(
      isAdoptablePairRow({ ...ROW, pair_id: null }, "en", { now: NOW }),
    ).toBe(false);
    expect(
      isAdoptablePairRow({ ...ROW, pair_id: "not-a-uuid" }, "en", { now: NOW }),
    ).toBe(false);
  });

  it("rejects rows older than the freshness upper bound (≤72h)", () => {
    expect(
      isAdoptablePairRow(
        { ...ROW, created_at: "2026-09-06T08:00:00.000Z" }, // 73h
        "en",
        { now: NOW },
      ),
    ).toBe(false);
    // AUDIT §9-2.5: a 49h row (expired under the old 48h law) is now
    // adoptable — the second-day rescue window for failed language days.
    expect(
      isAdoptablePairRow(
        { ...ROW, created_at: "2026-09-07T11:00:00.000Z" }, // 49h
        "en",
        { now: NOW },
      ),
    ).toBe(true);
  });

  it("rejects malformed rows (null/garbage/array/missing id)", () => {
    expect(isAdoptablePairRow(null, "en", { now: NOW })).toBe(false);
    expect(isAdoptablePairRow("garbage", "en", { now: NOW })).toBe(false);
    expect(isAdoptablePairRow([ROW], "en", { now: NOW })).toBe(false);
    expect(isAdoptablePairRow({ ...ROW, id: "" }, "en", { now: NOW })).toBe(false);
  });
});

describe("parsePairingJSON", () => {
  const ctx = {
    enCandidates: [EN_TOPIC, "Best progressive overload guide for beginners"],
    arCandidates: [AR_TOPIC, "جدول تغذية لبناء العضلات للمبتدئين خطوة بخطوة"],
  };
  const OK = JSON.stringify({ topicEn: EN_TOPIC, topicAr: AR_TOPIC, angleId: "science" });

  it("accepts literal candidates from BOTH languages", () => {
    const c = parsePairingJSON(OK, ctx);
    expect(c).not.toBeNull();
    expect(c?.topicEn).toBe(EN_TOPIC);
    expect(c?.topicAr).toBe(AR_TOPIC);
  });

  it("matches literally after trim (model whitespace tolerated)", () => {
    const c = parsePairingJSON(
      JSON.stringify({ topicEn: `  ${EN_TOPIC} `, topicAr: ` ${AR_TOPIC}\n`, angleId: "science" }),
      ctx,
    );
    expect(c?.topicEn).toBe(EN_TOPIC);
    expect(c?.topicAr).toBe(AR_TOPIC);
  });

  it("accepts a NEW transplanted Arabic phrasing (no Latin letters)", () => {
    const c = parsePairingJSON(
      JSON.stringify({ topicEn: EN_TOPIC, topicAr: AR_NEW, angleId: "guide" }),
      ctx,
    );
    expect(c?.topicAr).toBe(AR_NEW);
  });

  it("rejects an English (Latin) topicAr — translation is banned", () => {
    expect(
      parsePairingJSON(
        JSON.stringify({ topicEn: EN_TOPIC, topicAr: "How to eat protein daily", angleId: "guide" }),
        ctx,
      ),
    ).toBeNull();
  });

  it("rejects too-short topics", () => {
    expect(
      parsePairingJSON(
        JSON.stringify({ topicEn: EN_TOPIC, topicAr: "قصير جدًا", angleId: "guide" }),
        ctx,
      ),
    ).toBeNull();
  });

  it("rejects topicEn outside the EN candidates (model may not invent)", () => {
    expect(
      parsePairingJSON(
        JSON.stringify({
          topicEn: "A brand new invented english topic that is long enough",
          topicAr: AR_TOPIC,
          angleId: "guide",
        }),
        ctx,
      ),
    ).toBeNull();
  });

  it("rejects an unknown angleId", () => {
    expect(
      parsePairingJSON(
        JSON.stringify({ topicEn: EN_TOPIC, topicAr: AR_TOPIC, angleId: "story" }),
        ctx,
      ),
    ).toBeNull();
  });

  it("rejects broken/garbage JSON", () => {
    expect(parsePairingJSON("{{{not json", ctx)).toBeNull();
    expect(parsePairingJSON("", ctx)).toBeNull();
  });
});

describe("isValidAngleId", () => {
  it("accepts a real ARTICLE_ANGLES id", () => {
    expect(isValidAngleId("guide")).toBe(true);
  });

  it("rejects unknown/non-string ids", () => {
    expect(isValidAngleId("not-an-angle")).toBe(false);
    expect(isValidAngleId(42)).toBe(false);
  });
});

describe("withCoachTopic (Phase 162 coach pipeline parity)", () => {
  const brief: SharedBrief = {
    pairId: PAIR,
    topicEn: EN_TOPIC,
    topicAr: AR_TOPIC,
    angleId: "guide",
    sealedAt: NOW.toISOString(),
  };
  const COACH_AR = "روتين تمارين الكتف الآمن لمرضى الكتف المبتدئين";
  const COACH_EN = "Shoulder-safe beginner workout routine at home";

  it("seals the coach topic into the AR side and keeps the EN twin", () => {
    const out = withCoachTopic(brief, "ar", COACH_AR);
    expect(out.topicAr).toBe(COACH_AR);
    expect(out.topicEn).toBe(EN_TOPIC);
  });

  it("seals the coach topic into the EN side and keeps the AR twin", () => {
    const out = withCoachTopic(brief, "en", COACH_EN);
    expect(out.topicEn).toBe(COACH_EN);
    expect(out.topicAr).toBe(AR_TOPIC);
  });

  it("keeps pairId, angleId and sealedAt untouched (the pair stays valid)", () => {
    const out = withCoachTopic(brief, "ar", COACH_AR);
    expect(out.pairId).toBe(PAIR);
    expect(out.angleId).toBe("guide");
    expect(out.sealedAt).toBe(brief.sealedAt);
    // The returned brief must still pass the full extraction law.
    expect(
      extractSharedBrief({ sharedBrief: out }, { now: NOW }),
    ).toEqual(out);
  });

  it("does not mutate the original brief (immutability)", () => {
    const snapshot = { ...brief };
    withCoachTopic(brief, "ar", COACH_AR);
    expect(brief).toEqual(snapshot);
    expect(brief.topicAr).toBe(AR_TOPIC);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * PHASE 5-E / stage هـ (owner order 2026-10-31 «نفّذ جميع المراحل
 * المتبقية» approving Phase-4 §12-6): the retry-budget raise + the
 * RESUME-PAIR entry point (runResumePairingSelection — «جعل مسار
 * الاستئناف يقرن», the measured 0/6 queue-health alert root).
 * ══════════════════════════════════════════════════════════════════════ */

describe("PHASE 5-E — the pairing retry budget (§10-هـ-2)", () => {
  it("PAIRING_MAX_ATTEMPTS is 3 (raised 2→3 — the Phase-1 §8-6(ب) recommendation, the P4 precedent)", async () => {
    const { PAIRING_MAX_ATTEMPTS } = await import("@/lib/blog-pairing");
    expect(PAIRING_MAX_ATTEMPTS).toBe(3);
  });
});

describe("PHASE 5-E — runResumePairingSelection (the constrained resume pair)", () => {
  // The chain is mocked at the module boundary: the resume-pair rides the
  // REAL runPairingSelection prompt + parsePairingJSON laws — only the
  // transport is substituted (the ai-provider canaries already pin the
  // chain contract separately).
  const EN_TOPIC_R = "creatine loading phase how much per day for muscle gain";
  const AR_TOPIC_R = "جرعة الكرياتين اليومية لمرحلة التحميل لبناء العضلات";

  const MY_RESEARCH = {
    keywords: [{ keyword: "irrelevant", searchVolume: "1" }],
    faqs: [{ question: "q?", answer: "a" }],
    topics: ["some other topic my research once listed"],
  };
  const OTHER_RESEARCH = {
    keywords: [],
    faqs: [],
    topics: ["other language research topics"],
  };

  async function withMockedChain(
    answer: string,
    fn: () => Promise<unknown>,
  ): Promise<unknown> {
    const { vi } = await import("vitest");
    const mod = await import("@/lib/ai-provider");
    const spy = vi.spyOn(mod, "callFreeAIFallbackChain").mockResolvedValue({
      text: answer,
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      provider: "cloudflare",
    });
    try {
      return await fn();
    } finally {
      spy.mockRestore();
    }
  }

  it("seals a brief whose BOTH topics are the two rows' own topics VERBATIM (the anti-blind law by construction) and generates a fresh pairId", async () => {
    const { runResumePairingSelection } = await import("@/lib/blog-pairing");
    const answer = JSON.stringify({
      topicEn: EN_TOPIC_R,
      topicAr: AR_TOPIC_R,
      angleId: "guide",
    });
    const brief = (await withMockedChain(answer, () =>
      runResumePairingSelection({
        myLang: "ar",
        myTopic: AR_TOPIC_R,
        myResearch: MY_RESEARCH,
        otherTopic: EN_TOPIC_R,
        otherResearch: OTHER_RESEARCH,
      }),
    )) as SharedBrief;

    expect(brief.topicAr).toBe(AR_TOPIC_R);
    expect(brief.topicEn).toBe(EN_TOPIC_R);
    expect(brief.angleId).toBe("guide");
    expect(brief.pairId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Date.parse(brief.sealedAt)).toBeGreaterThan(Date.now() - 60_000);
  });

  it("the constrained candidate sets REWRITE nothing: the model's answer is forced to echo both rows' topics or fail (a topic outside the single-candidate set is rejected → the caller degrades to plain resume)", async () => {
    const { runResumePairingSelection } = await import("@/lib/blog-pairing");
    // The model tries to "improve" the EN topic — parsePairingJSON must
    // reject it (topicEn ∉ the single EN candidate), so the whole call
    // throws after the retry budget (chain mocked to the same bad answer).
    const badAnswer = JSON.stringify({
      topicEn: "a rewritten topic the model invented",
      topicAr: AR_TOPIC_R,
      angleId: "guide",
    });
    await expect(
      withMockedChain(badAnswer, () =>
        runResumePairingSelection({
          myLang: "en",
          myTopic: EN_TOPIC_R,
          myResearch: MY_RESEARCH,
          otherTopic: AR_TOPIC_R,
          otherResearch: OTHER_RESEARCH,
        }),
      ),
    ).rejects.toThrow(/invalid JSON|all attempts failed/);
  });

  it("an angle OUTSIDE the closed ARTICLE_ANGLES set is rejected (the angle is the ONLY free pairing decision — and it stays law-bound)", async () => {
    const { runResumePairingSelection } = await import("@/lib/blog-pairing");
    const badAngle = JSON.stringify({
      topicEn: EN_TOPIC_R,
      topicAr: AR_TOPIC_R,
      angleId: "nonexistent-angle",
    });
    await expect(
      withMockedChain(badAngle, () =>
        runResumePairingSelection({
          myLang: "ar",
          myTopic: AR_TOPIC_R,
          myResearch: MY_RESEARCH,
          otherTopic: EN_TOPIC_R,
          otherResearch: OTHER_RESEARCH,
        }),
      ),
    ).rejects.toThrow(/invalid JSON|all attempts failed/);
  });
});
