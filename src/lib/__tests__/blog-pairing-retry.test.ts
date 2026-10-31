/**
 * blog-pairing-retry.test.ts — AUDIT_REPORT §9-المرحلة 2, item 5
 * (2026-09-29): the pairing-call RETRY law.
 *
 * The live diagnosis measured only 2 complete pairs in the whole pair
 * era — the ONE-SHOT pairing call on the failing free chain was the
 * binding constraint (not the windows: both complete pairs were
 * consumed 0.0h apart, zero stale researched rows existed). The fix:
 * runPairingSelection retries the whole chain (fresh provider-lead
 * rotation per attempt, deeper model walk) while keeping EVERY
 * parse/validation law unchanged — a wrong pair stays worse than no
 * pair. These tests pin the retry semantics with a mocked chain.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the AI provider chain — the transport layer under test is the
// RETRY logic, not any real model.
vi.mock("@/lib/ai-provider", () => ({
  callFreeAIFallbackChain: vi.fn(),
  parseJSON: (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  },
}));

import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import {
  runPairingSelection,
  PAIRING_MAX_ATTEMPTS,
  ADOPT_MAX_AGE_HOURS,
  JOIN_MAX_AGE_HOURS,
} from "@/lib/blog-pairing";

const EN_TOPICS = ["how to build muscle at home safely"];
const AR_TOPICS = ["كيف أبني العضلات في المنزل بأمان"];

const research = (topics: string[]) => ({
  language: "en" as const,
  topics,
  keywords: [],
  faqs: [],
  category: "training",
});

const VALID_JSON = JSON.stringify({
  topicEn: EN_TOPICS[0],
  topicAr: AR_TOPICS[0],
  angleId: "guide",
});

const chain = callFreeAIFallbackChain as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runPairingSelection — the retry law (AUDIT §9-2.5)", () => {
  it("succeeds on the first attempt without retrying", async () => {
    chain.mockResolvedValueOnce({
      text: VALID_JSON,
      model: "m1",
      provider: "openrouter",
    });
    const res = await runPairingSelection(research(EN_TOPICS), research(AR_TOPICS));
    expect(res.topicEn).toBe(EN_TOPICS[0]);
    expect(res.source).toBe("openrouter:m1");
    expect(chain).toHaveBeenCalledTimes(1);
  });

  it("retries the WHOLE chain after a chain FAILURE (the measured root cause) and succeeds", async () => {
    chain
      .mockRejectedValueOnce(new Error("all models failed (429)"))
      .mockResolvedValueOnce({
        text: VALID_JSON,
        model: "m2",
        provider: "groq",
      });
    const res = await runPairingSelection(research(EN_TOPICS), research(AR_TOPICS));
    expect(res.source).toBe("groq:m2");
    expect(chain).toHaveBeenCalledTimes(2);
  });

  it("retries after an INVALID payload (valid transport, bad JSON)", async () => {
    chain
      .mockResolvedValueOnce({ text: "not json at all", model: "m1", provider: "openrouter" })
      .mockResolvedValueOnce({
        text: VALID_JSON,
        model: "m2",
        provider: "nvidia",
      });
    const res = await runPairingSelection(research(EN_TOPICS), research(AR_TOPICS));
    expect(res.topicAr).toBe(AR_TOPICS[0]);
    expect(chain).toHaveBeenCalledTimes(2);
  });

  it("throws after PAIRING_MAX_ATTEMPTS chain failures (degrades to legacy — never pairs blindly)", async () => {
    chain.mockRejectedValue(new Error("down"));
    await expect(
      runPairingSelection(research(EN_TOPICS), research(AR_TOPICS)),
    ).rejects.toThrow(/down/);
    expect(chain).toHaveBeenCalledTimes(PAIRING_MAX_ATTEMPTS);
  });

  it("keeps the validation laws strict: a rewritten EN topic NEVER passes, even on retry", async () => {
    const rewritten = JSON.stringify({
      topicEn: "a completely different rewritten title",
      topicAr: AR_TOPICS[0],
      angleId: "guide",
    });
    chain.mockResolvedValue({ text: rewritten, model: "m", provider: "openrouter" });
    await expect(
      runPairingSelection(research(EN_TOPICS), research(AR_TOPICS)),
    ).rejects.toThrow(/invalid JSON/);
    expect(chain).toHaveBeenCalledTimes(PAIRING_MAX_ATTEMPTS);
  });

  it("walks a deeper chain per attempt (maxModels 4 — the light-call deep-walk fix, deepened 3→4 by Phase 5-E/§10-هـ-2)", async () => {
    chain.mockResolvedValueOnce({ text: VALID_JSON, model: "m", provider: "openrouter" });
    await runPairingSelection(research(EN_TOPICS), research(AR_TOPICS));
    const opts = chain.mock.calls[0][1];
    expect(opts.maxModels).toBe(4);
  });
});

describe("the widened windows (resilience for failed language days)", () => {
  it("carries the widened freshness law (adopt 72h · join 48h · attempts 3 — Phase 5-E/§10-هـ-2 raised 2→3)", () => {
    expect(ADOPT_MAX_AGE_HOURS).toBe(72);
    expect(JOIN_MAX_AGE_HOURS).toBe(48);
    expect(PAIRING_MAX_ATTEMPTS).toBe(3);
  });
});
