import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * INF-1 canary (AI-OPERATIONAL-TEST-PLAN §2-أ, T5/S5-2) — the provider
 * EXHAUSTION circuit breaker AT THE CHAIN-WALK LEVEL. The registry unit
 * laws and the INF-3 scope matrix are covered by ai-provider-cooldown
 * and ai-provider-p1-cooldown-scope; this file pins the OPERATIONAL
 * atoms the live worker proved on 2026-11-16/17 (runs 43944757410 ·
 * 43943421512 · 43926112257 · 44078904052), so the behavior can never
 * regress silently:
 *
 *   1. A TPD/daily 429 (the exact live Groq exhaustion signature) marks
 *      the PROVIDER scope chain:groq — and from that moment the chain
 *      skips every groq entry WITHOUT a network call ("المدخل الميت لا
 *      يُعاد مشيه خلال 30د") — the skip consumes NO maxModels attempt
 *      budget, so the next healthy provider takes the slot and the job
 *      crosses (no 3-attempt ceiling because of the dead entry).
 *   2. A per-minute TPM 429 (seconds-scale hint, the run-44078904052
 *      signature) is TRANSIENT — the provider is NOT frozen, its next
 *      entries still get real calls in the same walk.
 *   3. When everything else fails too, the aggregate error reports the
 *      cooldown honestly ("Active quota-cooldowns: chain:groq until …")
 *      — never pretends the skipped scope answered.
 *
 * NOTE on the env dance: AI_CHAIN_TOTAL_BUDGET_MS is a module-load
 * constant (set BEFORE the dynamic import); the cooldown registry reads
 * its env at call time. The FAST chain is used on purpose — it never
 * rotates the lead (groq-first by design), so the walk order is
 * deterministic test-to-test regardless of the module's chainCallSeq.
 */

process.env.AI_CHAIN_TOTAL_BUDGET_MS = "60000";
process.env.GROQ_API_KEY = "gsk_inf1_canary";
process.env.NVIDIA_API_KEY = "nvapi_inf1_canary";
delete process.env.OPENROUTER_API;
delete process.env.OPENROUTER_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.CLOUDFLARE_AI_TOKEN;
delete process.env.CLOUDFLARE_ACCOUNT_ID;
delete process.env.AI_COOLDOWN_STATE_FILE;
// INF-1 env — the exact value the process-ai-jobs worker runs with
// (workflow env AI_PROVIDER_COOLDOWN_MS=1800000, printed by live runs).
process.env.AI_PROVIDER_COOLDOWN_MS = "1800000";

const { callFreeAIFallbackChain } = await import("@/lib/ai-provider");
const {
  __resetCooldownForTests,
  cooldownState,
} = await import("@/lib/ai-provider-cooldown");

/** The MEASURED live Groq daily-exhaustion body (run 43944757410,
 * 19:59:22Z — org id scrubbed; the class regexes never read it). */
const TPD_429_BODY = JSON.stringify({
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_inf1_canary` service tier `on_demand` on tokens per day (TPD): Limit 200000, Used 197239, Requested 4576. Please try again in 13m4.079999999s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing",
    type: "tokens",
    code: "rate_limit_exceeded",
  },
});

/** The MEASURED live per-minute body (run 44078904052, 12:00:35Z —
 *  seconds-scale hint ⇒ transient class, must NEVER freeze). */
const TPM_429_BODY = JSON.stringify({
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_inf1_canary` service tier `on_demand` on tokens per minute (TPM): Limit 8000, Used 4785, Requested 3396. Please try again in 1.3575s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing",
    type: "tokens",
    code: "rate_limit_exceeded",
  },
});

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

type FetchMock = ReturnType<typeof vi.fn>;

/** Build a URL-dispatching fetch: groq answers `groqBody` (any status),
 *  nvidia answers 200 with a real completion. Call counts per URL are
 *  readable via the returned counters. */
function stubChainFetch(opts: {
  groqStatus: number;
  groqBody: string;
  nvidiaStatus?: number;
  nvidiaBody?: string;
}): { fetch: FetchMock; groqCalls: () => number; nvidiaCalls: () => number } {
  const calls = { groq: 0, nvidia: 0 };
  const fetchMock = vi.fn(async (url: string | URL) => {
    const u = String(url);
    const json = (body: unknown) => ({
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
    if (u === GROQ_URL) {
      calls.groq += 1;
      return {
        ok: opts.groqStatus >= 200 && opts.groqStatus < 300,
        status: opts.groqStatus,
        json: async () => JSON.parse(opts.groqBody),
        text: async () => opts.groqBody,
      };
    }
    if (u === NVIDIA_URL) {
      calls.nvidia += 1;
      if ((opts.nvidiaStatus ?? 200) !== 200) {
        return {
          ok: false,
          status: opts.nvidiaStatus ?? 200,
          json: async () => JSON.parse(opts.nvidiaBody ?? "{}"),
          text: async () => opts.nvidiaBody ?? "{}",
        };
      }
      return json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: "INF-1 canary: served by the next healthy provider" },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
      });
    }
    throw new Error(`unexpected fetch URL in INF-1 canary: ${u}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetch: fetchMock, groqCalls: () => calls.groq, nvidiaCalls: () => calls.nvidia };
}

const FAST = { chain: "fast" as const, tag: "test:inf1" };

describe("INF-1 — provider-exhaustion cooldown at the chain walk (S5-2 live-measured laws)", () => {
  const ENV = { ...process.env };

  beforeEach(() => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "1800000";
    delete process.env.AI_PROVIDER_COOLDOWN;
    delete process.env.AI_COOLDOWN_STATE_FILE;
    __resetCooldownForTests({ deleteFile: true });
  });

  afterEach(() => {
    process.env = { ...ENV };
    vi.unstubAllGlobals();
    __resetCooldownForTests({ deleteFile: true });
  });

  it("a TPD 429 cools the PROVIDER — later walks skip every groq entry with ZERO network calls while the next provider serves", async () => {
    // ── Call A: the exhaustion happens live (groq-20b lead → 429) ──
    const { groqCalls, nvidiaCalls } = stubChainFetch({
      groqStatus: 429,
      groqBody: TPD_429_BODY,
    });

    const a = await callFreeAIFallbackChain("INF-1 call A", {
      ...FAST,
      maxModels: 4,
      timeoutMs: 5_000,
    });
    // The dead provider was asked exactly ONCE (the honest 429), the
    // provider scope was marked for the 30-min window…
    expect(a.provider).toBe("nvidia");
    expect(a.text).toContain("INF-1 canary");
    expect(groqCalls()).toBe(1);
    const cd = cooldownState("chain:groq");
    expect(cd).not.toBeNull();
    expect(cd!.until).toBeGreaterThan(Date.now() + 29 * 60_000);
    expect(cd!.reason).toMatch(/^quota: groq\//);
    // …and the walk had already skipped the remaining groq entry within
    // the SAME call (nvidia answered, so the second groq slot was not
    // burned on a known-dead provider).

    // ── Call B (same process, window still live): the dead entry is
    //    NOT re-walked — groq fetch count must stay EXACTLY where it
    //    was, and the call still succeeds via the next provider. ──
    const b = await callFreeAIFallbackChain("INF-1 call B", {
      ...FAST,
      maxModels: 4,
      timeoutMs: 5_000,
    });
    expect(b.provider).toBe("nvidia");
    expect(groqCalls()).toBe(1); // ← the law: no re-walk within 30 min
    expect(nvidiaCalls()).toBe(2); // the healthy provider took both slots
  });

  it("a cooldown skip consumes NO attempt budget — nvidia is reached even when dead groq entries sit ahead of it", async () => {
    // Fast chain order: groq-20b, groq-120b, nvidia-lightning, gemini.
    // With maxModels=2: groq-20b burns the real 429 (budget 1), groq-120b
    // must be SKIPPED for free (provider cooled), leaving budget 2 for
    // nvidia. If a skip ever consumed budget, nvidia would be unreachable
    // and this call would fail — that is exactly the regression this
    // canary exists to prevent (the pre-0f446fb8 walk re-asked dead
    // providers until jobs hit the 3-attempt ceiling).
    const { groqCalls } = stubChainFetch({
      groqStatus: 429,
      groqBody: TPD_429_BODY,
    });

    const r = await callFreeAIFallbackChain("INF-1 budget law", {
      ...FAST,
      maxModels: 2,
      timeoutMs: 5_000,
    });
    expect(r.provider).toBe("nvidia");
    expect(groqCalls()).toBe(1); // only the lead entry was really asked
  });

  it("a per-minute TPM 429 is TRANSIENT — the provider is NOT frozen and its next entry still gets a real call", async () => {
    const { groqCalls } = stubChainFetch({
      groqStatus: 429,
      groqBody: TPM_429_BODY,
    });

    const a = await callFreeAIFallbackChain("INF-1 per-minute call A", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    expect(a.provider).toBe("nvidia");
    // BOTH groq entries were genuinely walked — a 1.36-second TPM hiccup
    // must not evict the provider for 30 minutes (the live run-44078904052
    // law: groq kept serving the very next call).
    expect(groqCalls()).toBe(2);
    expect(cooldownState("chain:groq")).toBeNull();

    // And the next call still reaches groq (no stale freeze).
    const b = await callFreeAIFallbackChain("INF-1 per-minute call B", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    expect(b.provider).toBe("nvidia");
    expect(groqCalls()).toBe(4);
    expect(cooldownState("chain:groq")).toBeNull();
  });

  it("when every live provider fails anyway, the aggregate error reports the cooldown HONESTLY (the run-43926112257 signature)", async () => {
    const { groqCalls, nvidiaCalls } = stubChainFetch({
      groqStatus: 429,
      groqBody: TPD_429_BODY,
      nvidiaStatus: 500,
      nvidiaBody: JSON.stringify({ error: { message: "internal canary failure" } }),
    });

    const call = () =>
      callFreeAIFallbackChain("INF-1 honest failure", {
        ...FAST,
        maxModels: 4,
        timeoutMs: 5_000,
      });

    // First call: the real 429 lands, the provider is cooled, nvidia
    // fails live → total failure with the honest cooldown preamble.
    await expect(call()).rejects.toThrow(/All AI providers failed/);
    // Second call in the same window: every groq entry is skipped
    // (no call made) and the failure repeats honestly.
    let secondMsg = "";
    try {
      await call();
    } catch (e) {
      secondMsg = e instanceof Error ? e.message : String(e);
    }
    // The honest preamble: the skipped scope is NAMED, never pretended
    // to have answered (the exact live lines of run 43926112257).
    expect(secondMsg).toMatch(
      /groq: quota-cooldown until .+ — entries skipped, no call made/,
    );
    expect(secondMsg).toMatch(/Active quota-cooldowns: chain:groq until /);
    expect(secondMsg).toMatch(/nvidia\/nvidia\/nemotron-3\.5-lightning-30b-a3b: /);
    // groq was asked exactly ONCE across both calls (the real 429) —
    // every later groq slot was an honest skip, not a burned call.
    expect(groqCalls()).toBe(1);
    expect(nvidiaCalls()).toBe(2);
  });
});
