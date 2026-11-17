import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import { resolveEffectiveChain } from "@/lib/ai-router";

/**
 * INF-7 / INF-19 — S5-1 estimation ↔ real-usage pairing canaries
 * (AI-OPERATIONAL-TEST-PLAN 2026-11-16, frame T5, owner order
 * «نفّذ البند التالي» 2026-11-18).
 *
 * The S5-1 live evidence pairs the guard's ESTIMATION line
 * (`payload ~Nt exceeds Groq 8k TPM window → …`) against the [ai-meter]
 * REAL-usage line of the same call's winning attempt. These canaries pin
 * the four contracts that pairing depends on, with the LIVE-MEASURED
 * payload classes of the T2/T3/T4/T5 windows (run 43759110897: plan AR
 * est 8698 → clamp 5502, real 5943; run 43875066747: review-ar est
 * 11810 → skip, real 12428; 43925398597: tavily-synth est 11726 →
 * skip, real 13243):
 *
 *   1. The winning attempt's [ai-meter] line carries the PROVIDER-REPORTED
 *      usage (tokens_in/out/total + cost_cents) and NOT the chars/4
 *      estimate — the exact evidence-line shape (INF-19 walk-level law).
 *   2. A winner whose provider reported NO usage keeps the chars/4
 *      fallback in tokens_est and prints no tokens_in — the honest-absent
 *      law (never a phantom usage block).
 *   3. MIRROR PARITY (plan-class AR, est ~8698): the engine clamps the
 *      groq wire max_tokens to 5502 AND the router's pure mirror
 *      (resolveEffectiveChain) plans the SAME clamp for the same inputs —
 *      the audit's dual reference (ai-provider.ts + ai-router.ts) cannot
 *      drift apart silently.
 *   4. MIRROR PARITY (review-class, est ~11810): BOTH surfaces drop groq
 *      for the same inputs — zero groq wire calls, zero groq entries in
 *      the resolved plan.
 *   5. THE AUDIT'S DEFAULT-MISMATCH ATOM, test-rooted: when the caller
 *      omits maxTokens, the guard's estimate budgets 2048 tokens
 *      (`payload ~7248t`) while the wire request asks max_tokens=4096 —
 *      the structural 1248-token under-count the audit flagged (INF-7).
 *      This is a REGISTERED GAP (gap-register INF-7-GAP): the assertion
 *      documents TODAY's contract so any silent alignment of either
 *      default fails here and forces a conscious decision.
 *
 * The chain's lead rotation (chainCallSeq) is module state shared across
 * tests — every assertion is ORDER-AGNOSTIC (groq is within the first
 * three walked entries of any rotation of the strongest chain; maxModels
 * is raised to 3 in the walk tests so the groq decision is always
 * exercised).
 */

const ENV_KEYS = [
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "GROQ_MAX_TOKENS_CLAMP",
  "AI_METER",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

type CapturedRequest = { url: string; body: Record<string, unknown> };

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

/**
 * stubFetch — capture every request. The `winner` provider answers 200
 * (optionally with a usage block); every other provider fails with a
 * plain 500 (non-quota → the chain walks through, exercising the real
 * entry order).
 */
function stubFetch(
  captured: CapturedRequest[],
  winner: "groq" | "openrouter",
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    captured.push({
      url,
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    const isWinner =
      winner === "groq"
        ? String(url).includes("api.groq.com")
        : String(url).includes("openrouter.ai");
    if (isWinner) {
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "INF7-CANARY-CONTENT" } }],
          ...(usage ? { usage } : {}),
        }),
      } as unknown as Response;
    }
    return {
      ok: false,
      status: 500,
      text: async () => "stub provider failure",
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
}

function groqRequests(captured: CapturedRequest[]) {
  return captured.filter((r) => r.url.includes("api.groq.com"));
}
function openrouterRequests(captured: CapturedRequest[]) {
  return captured.filter((r) => r.url.includes("openrouter.ai"));
}

const ROUTER_CTX_BASE = {
  configuredProviders: ["openrouter", "groq", "nvidia"] as const,
  callSeq: 1,
  chainTotalBudgetMs: 180_000,
  streaming: false,
  cfNeuronBarrierTripped: false,
  groqClampEnabled: true,
};

describe("INF-7/INF-19 — S5-1 estimation ↔ real-usage pairing canaries", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanEnv();
    process.env.OPENROUTER_API = "sk-or-key2";
    process.env.OPENROUTER_API_KEY = "sk-or-key1";
    process.env.GROQ_API_KEY = "gsk_test_key";
    process.env.NVIDIA_API_KEY = "nvapi-test_key";
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    cleanEnv();
  });

  it("the winning attempt's [ai-meter] line carries the REAL usage (tokens_in/out/total + cost) — and NOT the chars/4 estimate", async () => {
    const captured: CapturedRequest[] = [];
    // The live plan_nutrition numbers of run 43759110897 (qwen attempt):
    stubFetch(captured, "groq", {
      prompt_tokens: 3092,
      completion_tokens: 2851,
      total_tokens: 5943,
    });

    const res = await callFreeAIFallbackChain("inf7 small prompt", {
      tag: "inf7:usage",
      maxTokens: 1000,
      maxModels: 3,
    });
    expect(res.provider).toBe("groq");

    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    // The WINNING attempt's line (earlier failed attempts of the same call
    // print their own fail lines — the ok line is the evidence source).
    const meter = lines.find(
      (l) => l.includes("[ai-meter]") && l.includes("fn=inf7_usage") && l.includes("outcome=ok"),
    );
    expect(meter).toBeDefined();
    // The REAL provider-reported usage rides the line verbatim…
    expect(meter).toContain("provider=groq");
    expect(meter).toContain("model=openai_gpt-oss-120b");
    expect(meter).toContain("outcome=ok");
    expect(meter).toContain("tokens_in=3092");
    expect(meter).toContain("tokens_out=2851");
    expect(meter).toContain("tokens_total=5943");
    // …the free-tier price row prices it honestly at 0 cents…
    expect(meter).toContain("cost_cents=0");
    // …and the chars/4 estimate is NOT recorded alongside (INF-19 law:
    // exactly one token-metric family per attempt).
    expect(meter).toContain("tokens_est=-");
    expect(meter).not.toMatch(/tokens_est=\d/);
  });

  it("a winner whose provider reported NO usage keeps the chars/4 fallback in tokens_est and prints no tokens_in (honest-absent law)", async () => {
    const captured: CapturedRequest[] = [];
    stubFetch(captured, "groq"); // 200 + content, NO usage block

    const prompt = "inf7-no-usage-prompt";
    const res = await callFreeAIFallbackChain(prompt, {
      tag: "inf7:no-usage",
      maxTokens: 1000,
      maxModels: 3,
    });
    expect(res.provider).toBe("groq");

    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    const meter = lines.find((l) => l.includes("[ai-meter]") && l.includes("fn=inf7_no-usage"));
    expect(meter).toBeDefined();
    // No phantom usage block…
    expect(meter).not.toContain("tokens_in=");
    // …and the fallback estimate is exactly chars/4-in + chars/4-out.
    const expectedEst =
      Math.ceil(prompt.length / 4) + Math.ceil("INF7-CANARY-CONTENT".length / 4);
    expect(meter).toContain(`tokens_est=${expectedEst}`);
  });

  it("MIRROR PARITY (plan-class AR, est 8698): the engine clamps the groq wire to 5502 AND the router mirror plans the same clamp", async () => {
    const captured: CapturedRequest[] = [];
    stubFetch(captured, "groq");

    // Live class of run 43759110897: 3592 prompt chars → 898 est tokens;
    // est = 898 + 7000 + 800 = 8698 > 7200 → clamp window 5502 (≥ floor).
    const prompt = "خ".repeat(3592);
    const res = await callFreeAIFallbackChain(prompt, {
      tag: "inf7:plan-class",
      maxTokens: 7000,
      maxModels: 3,
    });
    expect(res.provider).toBe("groq");

    // ENGINE side: every groq wire request carries the clamped max_tokens.
    const gr = groqRequests(captured);
    expect(gr.length).toBeGreaterThanOrEqual(1);
    for (const r of gr) expect(r.body.max_tokens).toBe(5502);
    // Non-groq entries keep the caller's maxTokens byte-identically.
    for (const r of openrouterRequests(captured)) expect(r.body.max_tokens).toBe(7000);
    // The estimation line carries the decision's own number.
    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    expect(lines.some((l) => l.includes("payload ~8698t exceeds Groq 8k TPM window"))).toBe(true);
    expect(
      lines.some((l) =>
        l.includes("R3 clamp: groq entries kept with max_tokens 5502t (floor 3800)"),
      ),
    ).toBe(true);

    // ROUTER MIRROR side: the pure resolution plans the SAME clamp for the
    // SAME inputs (the audit's dual reference cannot drift apart).
    const plan = resolveEffectiveChain("plan:nutrition", {
      ...ROUTER_CTX_BASE,
      promptChars: 3592,
      maxTokens: 7000,
    });
    const groqEntries = plan.entries.filter((e) => e.provider === "groq");
    expect(groqEntries.length).toBeGreaterThanOrEqual(1);
    for (const e of groqEntries) expect(e.maxTokens).toBe(5502);
  });

  it("MIRROR PARITY (review-class, est 11810): BOTH surfaces drop groq for the same inputs — zero groq wire calls, zero groq entries", async () => {
    const captured: CapturedRequest[] = [];
    stubFetch(captured, "openrouter");

    // Live class of run 43875066747 (blog:review-ar): 18440 chars → 4610
    // est tokens; est = 4610 + 6400 + 800 = 11810 > 7200, window
    // 7200-4610-800 = 1790 < floor 3800 → groq DROPPED.
    const prompt = "A".repeat(18440);
    const res = await callFreeAIFallbackChain(prompt, {
      tag: "inf7:review-class",
      maxTokens: 6400,
      maxModels: 3,
    });
    expect(res.provider).toBe("openrouter");

    // ENGINE side: groq is never called.
    expect(groqRequests(captured).length).toBe(0);
    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    expect(
      lines.some((l) =>
        l.includes("payload ~11810t exceeds Groq 8k TPM window → openrouter/nvidia-only for this call"),
      ),
    ).toBe(true);

    // ROUTER MIRROR side: the resolved plan carries no groq entries.
    const plan = resolveEffectiveChain("blog:review", {
      ...ROUTER_CTX_BASE,
      promptChars: 18440,
      maxTokens: 6400,
    });
    expect(plan.entries.filter((e) => e.provider === "groq").length).toBe(0);
  });

  it("THE AUDIT'S DEFAULT-MISMATCH ATOM (registered gap INF-7-GAP): omitted maxTokens → the guard budgets 2048 (payload ~7248t) while the wire asks 4096", async () => {
    const captured: CapturedRequest[] = [];
    stubFetch(captured, "openrouter");

    // 17600 chars → 4400 est tokens; NO maxTokens passed:
    // guard est = 4400 + 2048 + 800 = 7248 > 7200 (window 2000 < 3800 → skip)
    // while the converter's wire request sends max_tokens 4096 (its own
    // default). The 1248-token spread IS the audit's structural
    // under-count — asserted HERE so it can never drift silently.
    const prompt = "A".repeat(17600);
    const res = await callFreeAIFallbackChain(prompt, {
      tag: "inf7:default",
      maxModels: 3,
    });
    expect(res.provider).toBe("openrouter");

    const lines = logSpy.mock.calls.map((c) => String(c[0]));
    expect(
      lines.some((l) =>
        l.includes("payload ~7248t exceeds Groq 8k TPM window → openrouter/nvidia-only for this call"),
      ),
    ).toBe(true);
    // The wire request carries the CONVERTER's default (4096) — not the
    // guard's budgeted 2048.
    const or = openrouterRequests(captured);
    expect(or.length).toBeGreaterThanOrEqual(1);
    for (const r of or) expect(r.body.max_tokens).toBe(4096);

    // The router mirror budgets the same 2048 default for the same call
    // (maxTokens omitted) — the mirror agrees with the engine's guard.
    const plan = resolveEffectiveChain("blog:review", {
      ...ROUTER_CTX_BASE,
      promptChars: 17600,
      // maxTokens deliberately omitted
    });
    expect(plan.entries.filter((e) => e.provider === "groq").length).toBe(0);
  });
});
