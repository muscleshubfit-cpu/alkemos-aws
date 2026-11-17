import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * INF-3 canary (AI-OPERATIONAL-TEST-PLAN §2-أ, T5/S5-2) — the
 * CLASS-AWARE cooldown SCOPE at the chain-walk level. The registry unit
 * (ai-provider-cooldown) and the scope matrix (ai-provider-p1-cooldown-
 * scope) pin the registry's own laws; INF-1's walk file pins the
 * PROVIDER-scope exhaustion atom live-measured on 2026-11-16/17. This
 * file pins the INF-3 atoms the live record has NOT yet practiced on
 * post-fix code (zero natural 404 across every AI-carrying run since
 * 2c8b1f48 — the S5-2 observation post), so the fixed scope law can
 * never regress silently while the extended window waits for a natural
 * gone-class event:
 *
 *   1. A GONE failure (404 dead model) cools ONLY the model-scoped
 *      entry `chain:provider:model` — the provider itself stays live
 *      and its SIBLING entry gets a real call in the very same walk
 *      and serves. This is the direct anti-regression for the measured
 *      incident that motivated the fix (run 39632881785, 2026-10-21:
 *      ONE dead id — nvidia/nemotron-3-super-120b-a12b answering 404
 *      «Function …: Not found for account» — froze chain:nvidia AND its
 *      OpenRouter twin froze chain:openrouter, killing the remaining
 *      P4 attempts for 30 minutes). Pre-fix the mark landed on the
 *      provider scope; a regression to that shape fails canary 1.
 *   2. The model-scoped cooldown is reported HONESTLY: the aggregate
 *      error carries the scope key `chain:groq:openai/gpt-oss-20b`
 *      verbatim, the class-prefixed reason («gone: …»), and the
 *      «entries skipped, no call made» clause — never pretending the
 *      skipped model answered.
 *   3. TWO DISTINGUISHED SCOPES in one live process (the plan's
 *      «نطاقان مميزان بالسجل» success criterion): a gone 404 on one
 *      model + a TPD 429 on its sibling leave BOTH scopes in the
 *      registry with their distinct classes (gone → model scope,
 *      quota → provider scope), and once the provider scope exists
 *      every entry of the provider is skipped with zero new calls.
 *   4. A model-scoped skip consumes NO attempt budget (the INF-1
 *      budget law extended to the model scope): with maxModels=2 the
 *      free skip of the dead model leaves budget for the sibling's
 *      real 429 AND the next provider — the job still crosses.
 *
 * The 404 body is the live-measured dead-model shape (status-embedded
 * classifier input: the walk surfaces «AI API error 404 from groq: …»),
 * and the TPD 429 body is the exact live Groq daily-exhaustion payload
 * (run 43944757410 — org id scrubbed; the class regexes never read it).
 */

process.env.AI_CHAIN_TOTAL_BUDGET_MS = "60000";
process.env.GROQ_API_KEY = "gsk_inf3_canary";
process.env.NVIDIA_API_KEY = "nvapi_inf3_canary";
delete process.env.OPENROUTER_API;
delete process.env.OPENROUTER_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.CLOUDFLARE_AI_TOKEN;
delete process.env.CLOUDFLARE_ACCOUNT_ID;
delete process.env.AI_COOLDOWN_STATE_FILE;
// The exact value the process-ai-jobs worker runs with (workflow env
// AI_PROVIDER_COOLDOWN_MS=1800000, printed live by runs 44167270580 and
// 44176916328).
process.env.AI_PROVIDER_COOLDOWN_MS = "1800000";

const { callFreeAIFallbackChain } = await import("@/lib/ai-provider");
const {
  __resetCooldownForTests,
  cooldownState,
} = await import("@/lib/ai-provider-cooldown");

/** A dead-model 404 body — the live-measured gone-class shape (the run
 *  39632881785 / 38847288514 signatures: model/function not found). */
const GONE_404_BODY = JSON.stringify({
  error: {
    message:
      "The model `openai/gpt-oss-20b` does not exist or is not accessible",
    type: "invalid_request_error",
    code: "model_not_found",
  },
});

/** The MEASURED live Groq daily-exhaustion body (run 43944757410 —
 *  quota class ⇒ PROVIDER scope, the INF-1 atom). */
const TPD_429_BODY = JSON.stringify({
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_inf3_canary` service tier `on_demand` on tokens per day (TPD): Limit 200000, Used 197239, Requested 4576. Please try again in 13m4.079999999s. Need more tokens? Upgrade to Dev Tier Today at https://console.groq.com/settings/billing",
    type: "tokens",
    code: "rate_limit_exceeded",
  },
});

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const GROQ_20B = "openai/gpt-oss-20b";
const GROQ_120B = "openai/gpt-oss-120b";

type FetchMock = ReturnType<typeof vi.fn>;

/** One canned HTTP answer for a model slot. */
type SlotResponse = { status: number; body: string };

/** A slot is either ONE repeating answer or a PER-CALL sequence (the
 *  last entry repeats once the sequence is exhausted) — canaries that
 *  need "call A succeeds via the sibling, call B fails live" drive the
 *  same slot through different answers per walk. */
type Slot = SlotResponse | SlotResponse[];

function slotAnswer(slot: Slot | undefined, callNo: number): SlotResponse {
  const ok: SlotResponse = { status: 200, body: "" };
  if (!slot) return ok;
  if (Array.isArray(slot)) return slot[Math.min(callNo - 1, slot.length - 1)];
  return slot;
}

/** URL+model dispatching fetch: each groq model slot answers its own
 *  (status, body) sequence; a 200 slot answers a real completion.
 *  Per-model call counters are readable via the returned getters — the
 *  walk's skip-vs-call behavior is the law under test. */
function stubGoneScopeFetch(opts: {
  groq20b: Slot;
  groq120b?: Slot;
  nvidia?: Slot;
}): {
  fetch: FetchMock;
  groq20bCalls: () => number;
  groq120bCalls: () => number;
  nvidiaCalls: () => number;
} {
  const calls = { groq20b: 0, groq120b: 0, nvidia: 0 };
  const completion = (text: string) => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          finish_reason: "stop",
          message: { content: text },
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
    }),
    text: async () => "",
  });
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    const respond = (r: SlotResponse) => ({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => JSON.parse(r.body),
      text: async () => r.body,
    });
    if (u === GROQ_URL) {
      const model =
        typeof init?.body === "string"
          ? (JSON.parse(init.body).model as string)
          : "";
      if (model === GROQ_20B) {
        calls.groq20b += 1;
        const r = slotAnswer(opts.groq20b, calls.groq20b);
        return r.status === 200
          ? completion("INF-3 canary: healthy sibling answered")
          : respond(r);
      }
      if (model === GROQ_120B) {
        calls.groq120b += 1;
        const r = slotAnswer(opts.groq120b, calls.groq120b);
        return r.status === 200
          ? completion("INF-3 canary: healthy sibling answered")
          : respond(r);
      }
      throw new Error(`unexpected groq model in INF-3 canary: ${model}`);
    }
    if (u === NVIDIA_URL) {
      calls.nvidia += 1;
      const r = slotAnswer(opts.nvidia, calls.nvidia);
      return r.status === 200
        ? completion("INF-3 canary: next provider answered")
        : respond(r);
    }
    throw new Error(`unexpected fetch URL in INF-3 canary: ${u}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetch: fetchMock,
    groq20bCalls: () => calls.groq20b,
    groq120bCalls: () => calls.groq120b,
    nvidiaCalls: () => calls.nvidia,
  };
}

const FAST = { chain: "fast" as const, tag: "test:inf3" };

describe("INF-3 — class-aware cooldown scope at the chain walk (S5-2: gone ⇒ model, quota ⇒ provider)", () => {
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

  it("a 404 gone cools ONLY the model — the provider's sibling entry still gets a real call and serves (anti-run-39632881785)", async () => {
    // Fast chain order: groq-20b (lead), groq-120b, nvidia, gemini.
    const { groq20bCalls, groq120bCalls, nvidiaCalls } = stubGoneScopeFetch({
      groq20b: { status: 404, body: GONE_404_BODY },
    });

    const a = await callFreeAIFallbackChain("INF-3 call A", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    // The dead model was asked exactly ONCE (the honest 404) and its
    // SIBLING on the SAME provider answered in the very same walk —
    // pre-2c8b1f48 this call failed over to nvidia (or died) because
    // the 404 froze chain:groq wholesale.
    expect(a.provider).toBe("groq");
    expect(a.model).toBe(GROQ_120B);
    expect(a.text).toContain("healthy sibling answered");
    expect(groq20bCalls()).toBe(1);
    expect(groq120bCalls()).toBe(1);
    expect(nvidiaCalls()).toBe(0);

    // The INF-3 law itself: the mark landed on the MODEL scope only.
    const cdModel = cooldownState(`chain:groq:${GROQ_20B}`);
    expect(cdModel).not.toBeNull();
    expect(cdModel!.until).toBeGreaterThan(Date.now() + 29 * 60_000);
    expect(cdModel!.reason).toMatch(/^gone: groq\/openai\/gpt-oss-20b: AI API error 404/);
    // …and the PROVIDER scope is untouched — the healthy sibling stays
    // walkable for the whole window (this is the exact assertion the
    // pre-fix code fails).
    expect(cooldownState("chain:groq")).toBeNull();

    // Second walk in the same window: the dead model is skipped for
    // free (no second 404 call) and the sibling serves again.
    const b = await callFreeAIFallbackChain("INF-3 call B", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    expect(b.provider).toBe("groq");
    expect(b.model).toBe(GROQ_120B);
    expect(groq20bCalls()).toBe(1); // skipped, not re-asked
    expect(groq120bCalls()).toBe(2); // the sibling kept serving
    expect(nvidiaCalls()).toBe(0);
  });

  it("the model-scoped cooldown is reported HONESTLY — scope key + gone class + «entries skipped, no call made»", async () => {
    const fail500 = {
      status: 500,
      body: JSON.stringify({ error: { message: "internal canary failure" } }),
    };
    const { groq20bCalls, groq120bCalls } = stubGoneScopeFetch({
      groq20b: { status: 404, body: GONE_404_BODY },
      // Call A: the healthy sibling answers 200; call B: it fails live.
      groq120b: [{ status: 200, body: "" }, fail500],
      nvidia: fail500,
    });

    // Call A marks the model scope (404) and succeeds via the sibling.
    const a = await callFreeAIFallbackChain("INF-3 honest call A", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    expect(a.model).toBe(GROQ_120B);

    // Call B: the dead model is skipped, the sibling and nvidia fail
    // live → total failure whose aggregate must NAME the model-scoped
    // cooldown honestly (the 39632881785 aggregate named only provider
    // scopes; the fixed walk names the model scope verbatim).
    let msg = "";
    try {
      await callFreeAIFallbackChain("INF-3 honest call B", {
        ...FAST,
        maxModels: 3,
        timeoutMs: 5_000,
      });
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    expect(msg).toMatch(/All AI providers failed/);
    // The scope key VERBATIM (class + scope — the INF-3 evidence line):
    expect(msg).toMatch(/Active quota-cooldowns: chain:groq:openai\/gpt-oss-20b until /);
    // The per-entry honest skip: class-prefixed reason + no-call clause.
    expect(msg).toMatch(
      /groq\/openai\/gpt-oss-20b: quota-cooldown until .+ \(gone: groq\/openai\/gpt-oss-20b: AI API error 404 from groq/,
    );
    expect(msg).toMatch(/— entries skipped, no call made/);
    // The dead model was asked exactly ONCE across both calls (the real
    // 404); every later slot was an honest skip, not a burned call.
    expect(groq20bCalls()).toBe(1);
    expect(groq120bCalls()).toBe(2);
  });

  it("gone and quota leave TWO DISTINGUISHED SCOPES — model scope for the 404, provider scope for the 429 (the plan's «نطاقان مميزان»)", async () => {
    const { groq20bCalls, groq120bCalls, nvidiaCalls } = stubGoneScopeFetch({
      groq20b: { status: 404, body: GONE_404_BODY },
      groq120b: { status: 429, body: TPD_429_BODY },
    });

    // Call A: 404 on the lead model → model-scoped gone mark; the
    // sibling burns the REAL 429 → provider-scoped quota mark; nvidia
    // crosses the call.
    const a = await callFreeAIFallbackChain("INF-3 scopes call A", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    expect(a.provider).toBe("nvidia");
    expect(groq20bCalls()).toBe(1);
    expect(groq120bCalls()).toBe(1);

    // The registry now holds BOTH scopes with their distinct classes —
    // the exact live-log shape INF-3's success criterion demands.
    const cdModel = cooldownState(`chain:groq:${GROQ_20B}`);
    const cdProvider = cooldownState("chain:groq");
    expect(cdModel).not.toBeNull();
    expect(cdModel!.reason).toMatch(/^gone: /);
    expect(cdProvider).not.toBeNull();
    expect(cdProvider!.reason).toMatch(/^quota: groq\/openai\/gpt-oss-120b: AI API error 429/);

    // Call B (both windows live): EVERY groq entry is skipped — the
    // provider scope dominates (cdProvider ?? cdModel per entry) — and
    // the healthy next provider takes the slot with zero groq calls.
    const b = await callFreeAIFallbackChain("INF-3 scopes call B", {
      ...FAST,
      maxModels: 3,
      timeoutMs: 5_000,
    });
    expect(b.provider).toBe("nvidia");
    expect(groq20bCalls()).toBe(1); // no new call — model scope skip
    expect(groq120bCalls()).toBe(1); // no new call — provider scope skip
    expect(nvidiaCalls()).toBe(2);
  });

  it("a model-scoped skip consumes NO attempt budget — maxModels=2 still reaches nvidia after the dead model and the sibling's real 429", async () => {
    const { groq20bCalls, groq120bCalls, nvidiaCalls } = stubGoneScopeFetch({
      groq20b: { status: 404, body: GONE_404_BODY },
      // Call A: the sibling answers 200 (budget 2); call B: the REAL 429.
      groq120b: [{ status: 200, body: "" }, { status: 429, body: TPD_429_BODY }],
    });

    // Call A establishes the model-scoped gone mark (20b 404 → budget 1,
    // sibling 200 → budget 2).
    const a = await callFreeAIFallbackChain("INF-3 budget call A", {
      ...FAST,
      maxModels: 2,
      timeoutMs: 5_000,
    });
    expect(a.model).toBe(GROQ_120B);

    // Call B with the SAME tight budget: the dead 20b is skipped for
    // FREE (if a model-scope skip ever consumed budget, the sibling's
    // real 429 would exhaust maxModels=2 and nvidia — the last live
    // entry — would be unreachable: the call would fail).
    const b = await callFreeAIFallbackChain("INF-3 budget call B", {
      ...FAST,
      maxModels: 2,
      timeoutMs: 5_000,
    });
    expect(b.provider).toBe("nvidia");
    expect(groq20bCalls()).toBe(1); // only the honest 404, ever
    expect(groq120bCalls()).toBe(2); // real 429 in call B
    expect(nvidiaCalls()).toBe(1);
  });
});
