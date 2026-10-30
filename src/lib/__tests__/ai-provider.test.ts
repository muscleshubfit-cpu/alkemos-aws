import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  AI_PROVIDERS,
  INTERLEAVED_FAST_CHAIN,
  INTERLEAVED_STRONGEST_CHAIN,
  FREE_OPENROUTER_MODELS,
  callAI,
  getEnvConfig,
  getNvidiaKey,
  getOpenRouterKeys,
  maskKey,
  parseJSON,
} from "@/lib/ai-provider";

/**
 * Phase 161 — NVIDIA NIM joins the provider key bundle (owner directive
 * 2026-09-09 «تم اضافة مفتاح NVIDIA_API_KEY لاستخدامة مع باقة مفاتيح
 * مزودى ال Ai»). These tests pin the THIRD-PROVIDER contract:
 * registry entry, chain integrity (every entry resolvable, no fabrications),
 * key reader, env fall-through, and the three-way lead rotation inputs.
 */

const ENV_KEYS = [
  "AI_PROVIDER",
  "AI_MODEL",
  "AI_BASE_URL",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

describe("Phase 161.5 — parseJSON control-character hardening (live runs 34358207261/34361832706)", () => {
  it("parses article JSON whose markdown field contains RAW newlines (the exact live failure)", () => {
    // Soft json-mode models emit literal newlines inside string values.
    const raw = '{"title": "دليل التمرين", "markdown": "## مقدمة\nالنص الأول هنا\n\n## القسم الثاني\nالمزيد من النص"}';
    const parsed = parseJSON<Record<string, unknown>>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("دليل التمرين");
    expect(String(parsed?.markdown)).toContain("## القسم الثاني");
    expect(String(parsed?.markdown)).toContain("\n");
  });

  it("parses a TRUNCATED article JSON with raw newlines (string cut mid-sentence)", () => {
    const raw =
      '{"title": "Guide", "excerpt": "intro text", "markdown": "## Section\nfirst paragraph\n\n## Section Two\nthis sentence never finis';
    const parsed = parseJSON<Record<string, unknown>>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("Guide");
    expect(String(parsed?.markdown)).toContain("never finis");
  });

  it("escapes tabs and other control characters inside strings", () => {
    // Real tab, real newline, real U+0001 — all raw inside string values.
    const raw = '{"a": "x\ty", "b": "line\nbreak", "c": "ctl\u0001z"}';
    const parsed = parseJSON<Record<string, unknown>>(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.a).toBe("x\ty");
    expect(parsed?.b).toBe("line\nbreak");
    expect(parsed?.c).toBe("ctl\u0001z");
  });

  it("still respects REAL escaped sequences (backslash-n stays a newline, not literal n)", () => {
    const raw = '{"text": "first\\nsecond"}';
    const parsed = parseJSON<{ text: string }>(raw);
    expect(parsed?.text).toBe("first\nsecond");
  });

  it("regression: fenced JSON, prose wrapper, and trailing commas all still parse", () => {
    expect(parseJSON('```json\n{"a": 1,}\n```')).toEqual({ a: 1 });
    expect(parseJSON('Here is your result: {"b": [1, 2]} hope it helps!')).toEqual({ b: [1, 2] });
  });

  it("regression: invalid non-JSON garbage still returns null", () => {
    expect(parseJSON("")).toBeNull();
    expect(parseJSON("no braces here at all")).toBeNull();
  });

  it("full article_generate-shaped payload with raw newlines inside markdown + faq array parses end-to-end", () => {
    const payload = [
      '{"title": "كيف أبدأ بناء العضلات؟",',
      ' "slug": "muscle-building-guide",',
      ' "markdown": "## مقدمة\n\nابدأ بالأساسيات\n\n## البرنامج\n\nالتمرين الأول",',
      ' "excerpt": "دليل عملي",',
      ' "meta_description": "دليل كامل",',
      ' "tags": ["عضلات", "تمرين"],',
      ' "faq": [{"question": "كم مرة؟", "answer": "ثلاث مرات أسبوعيًا\nبدون إفراط"}],',
      ' "language": "ar"}',
    ].join("\n");
    const parsed = parseJSON<Record<string, unknown>>(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.slug).toBe("muscle-building-guide");
    const faq = parsed?.faq as Array<{ answer: string }>;
    expect(faq[0].answer).toContain("بدون إفراط");
  });
});

describe("Phase 161 — NVIDIA NIM provider contract", () => {
  beforeEach(() => cleanEnv());
  afterEach(() => cleanEnv());

  describe("registry", () => {
    it("nvidia entry: NIM baseUrl + NVIDIA_API_KEY env + nvapi- prefix", () => {
      expect(AI_PROVIDERS.nvidia).toBeDefined();
      expect(AI_PROVIDERS.nvidia.baseUrl).toBe("https://integrate.api.nvidia.com/v1");
      expect(AI_PROVIDERS.nvidia.envKey).toBe("NVIDIA_API_KEY");
      expect(AI_PROVIDERS.nvidia.keyPrefix).toBe("nvapi-");
      expect(AI_PROVIDERS.nvidia.defaultModel).toContain("/");
      expect(AI_PROVIDERS.nvidia.docsUrl).toContain("nvidia");
    });

    it("registry has exactly the five allowed providers (Phase 343 added gemini; Phase 5-C/stage ج 2026-10-31 added cloudflare)", () => {
      expect(Object.keys(AI_PROVIDERS).sort()).toEqual(["cloudflare", "gemini", "groq", "nvidia", "openrouter"]);
    });

    it("cloudflare entry (Phase 5-C — stage ج): account-scoped baseUrl + CLOUDFLARE_AI_TOKEN env + pairing role model", () => {
      expect(AI_PROVIDERS.cloudflare).toBeDefined();
      expect(AI_PROVIDERS.cloudflare.baseUrl).toBe("https://api.cloudflare.com/client/v4");
      expect(AI_PROVIDERS.cloudflare.envKey).toBe("CLOUDFLARE_AI_TOKEN");
      expect(AI_PROVIDERS.cloudflare.defaultModel).toBe("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
      expect(AI_PROVIDERS.cloudflare.docsUrl).toContain("cloudflare.com");
    });

    it("gemini entry: native generativelanguage baseUrl + GEMINI_API_KEY env + AIza prefix", () => {
      expect(AI_PROVIDERS.gemini).toBeDefined();
      expect(AI_PROVIDERS.gemini.baseUrl).toBe("https://generativelanguage.googleapis.com/v1beta");
      expect(AI_PROVIDERS.gemini.envKey).toBe("GEMINI_API_KEY");
      expect(AI_PROVIDERS.gemini.keyPrefix).toBe("AIza");
      expect(AI_PROVIDERS.gemini.defaultModel).toMatch(/^gemini-/);
    });
  });

  describe("chain integrity (strongest + fast)", () => {
    it("NVIDIA is present in the fast chain (speed tier)", () => {
      expect(INTERLEAVED_FAST_CHAIN.some((e) => e.provider === "nvidia")).toBe(true);
    });

    it("every chain entry names a registered provider and a non-empty model", () => {
      // The strongest chain is module-private; both exported surface + the
      // registry contract are verified through INTERLEAVED_FAST_CHAIN here
      // and through the lead-rotation semantics via getEnvConfig below.
      for (const entry of INTERLEAVED_FAST_CHAIN) {
        expect(AI_PROVIDERS[entry.provider]).toBeDefined();
        expect(entry.model.length).toBeGreaterThan(0);
      }
    });

    it("fast chain has no duplicate (provider, model) pairs", () => {
      const keys = INTERLEAVED_FAST_CHAIN.map((e) => `${e.provider}/${e.model}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  describe("getNvidiaKey", () => {
    it("reads NVIDIA_API_KEY", () => {
      process.env.NVIDIA_API_KEY = "nvapi-test-123";
      expect(getNvidiaKey()).toBe("nvapi-test-123");
    });

    it("empty when unset", () => {
      expect(getNvidiaKey()).toBe("");
    });
  });

  describe("getEnvConfig — three-provider fall-through", () => {
    it("AI_PROVIDER=nvidia resolves the NIM config with its default model", () => {
      process.env.AI_PROVIDER = "nvidia";
      process.env.NVIDIA_API_KEY = "nvapi-test-123";
      const cfg = getEnvConfig();
      expect(cfg?.provider).toBe("nvidia");
      expect(cfg?.baseUrl).toBe("https://integrate.api.nvidia.com/v1");
      expect(cfg?.model).toBe(AI_PROVIDERS.nvidia.defaultModel);
    });

    it("nvidia requested but key missing → falls through by priority (openrouter → groq)", () => {
      process.env.AI_PROVIDER = "nvidia";
      process.env.GROQ_API_KEY = "gsk_test";
      const cfg = getEnvConfig();
      expect(cfg?.provider).toBe("groq");
    });

    it("priority fall-through reaches nvidia when it is the ONLY configured provider", () => {
      process.env.NVIDIA_API_KEY = "nvapi-only";
      const cfg = getEnvConfig();
      expect(cfg?.provider).toBe("nvidia");
      expect(cfg?.apiKey).toBe("nvapi-only");
    });

    it("AI_MODEL env overrides the nvidia default", () => {
      process.env.AI_PROVIDER = "nvidia";
      process.env.NVIDIA_API_KEY = "nvapi-test-123";
      process.env.AI_MODEL = "deepseek-ai/deepseek-r1";
      const cfg = getEnvConfig();
      expect(cfg?.model).toBe("deepseek-ai/deepseek-r1");
    });

    it("no keys at all → null (caller throws honest error)", () => {
      expect(getEnvConfig()).toBeNull();
    });
  });

  describe("key readers stay intact (regression guard)", () => {
    it("OpenRouter dual-key pool dedupes aliases", () => {
      process.env.OPENROUTER_API = "sk-or-same";
      process.env.OPENROUTER_API_KEY = "sk-or-same";
      expect(getOpenRouterKeys()).toEqual(["sk-or-same"]);
    });

    it("maskKey shows nvapi prefix + last 4", () => {
      expect(maskKey("nvapi-abcdefgh1234")).toBe("nvap…1234");
    });
  });
});

describe("Phase 177 — dead-model purge (14-day live audit, owner order «الجودة القصوى»)", () => {
  // Measured per-attempt success over 470 GHA runs / 14 days:
  // gemma-4-31b 0.4% · gemma-4-26b 0% · lightning:free 0% — ~435 burned slots.
  const DEAD_IDS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
  ];

  describe("INTERLEAVED_STRONGEST_CHAIN (now exported for regression guarding)", () => {
    it("no dead entries survive (0-0.4% live success = dead weight)", () => {
      for (const entry of INTERLEAVED_STRONGEST_CHAIN) {
        expect(DEAD_IDS).not.toContain(entry.model);
      }
    });

    it("GEMINI-FIRST CANCELLED (Phase 5-A, owner order 2026-10-31 «إلغاء قانون Gemini-First نهائيًا، بما يشمل السلاسل الثقيلة») — gemini is the TAIL of the strongest chain; the pre-343 head is restored", () => {
      expect(INTERLEAVED_STRONGEST_CHAIN[0].provider).toBe("openrouter");
      expect(INTERLEAVED_STRONGEST_CHAIN[0].model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
      const last = INTERLEAVED_STRONGEST_CHAIN[INTERLEAVED_STRONGEST_CHAIN.length - 1];
      expect(last.provider).toBe("gemini");
      expect(last.model).toBe("gemini-3.5-flash");
      // ZERO forced priority anywhere: gemini appears exactly once, last.
      expect(INTERLEAVED_STRONGEST_CHAIN.filter((e) => e.provider === "gemini")).toHaveLength(1);
    });

    it("strongest-first law intact at the head — openrouter ultra-550b is slot 1 (the pre-343 order)", () => {
      expect(INTERLEAVED_STRONGEST_CHAIN[0].provider).toBe("openrouter");
      expect(INTERLEAVED_STRONGEST_CHAIN[0].model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
    });

    it("best live performer sits in slot 2 (groq/gpt-oss-120b, 85.3%)", () => {
      expect(INTERLEAVED_STRONGEST_CHAIN[1].provider).toBe("groq");
      expect(INTERLEAVED_STRONGEST_CHAIN[1].model).toBe("openai/gpt-oss-120b");
    });

    it("all four providers are represented (interleave + rotation inputs)", () => {
      const providers = new Set(INTERLEAVED_STRONGEST_CHAIN.map((e) => e.provider));
      expect(providers.has("gemini")).toBe(true);
      expect(providers.has("openrouter")).toBe(true);
      expect(providers.has("groq")).toBe(true);
      expect(providers.has("nvidia")).toBe(true);
    });

    it("no duplicate (provider, model) pairs", () => {
      const keys = INTERLEAVED_STRONGEST_CHAIN.map((e) => `${e.provider}/${e.model}`);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("every entry names a registered provider and a non-empty model", () => {
      for (const entry of INTERLEAVED_STRONGEST_CHAIN) {
        expect(AI_PROVIDERS[entry.provider]).toBeDefined();
        expect(entry.model.length).toBeGreaterThan(0);
      }
    });
  });

  describe("INTERLEAVED_FAST_CHAIN (EVO chat + eval speed tier)", () => {
    it("no dead entries survive", () => {
      for (const entry of INTERLEAVED_FAST_CHAIN) {
        expect(DEAD_IDS).not.toContain(entry.model);
      }
    });

    it("gpt-oss-120b outranks lightning-30b-a3b (85.3% vs 33.3% live)", () => {
      const idx120 = INTERLEAVED_FAST_CHAIN.findIndex((e) => e.model === "openai/gpt-oss-120b");
      const idxLightning = INTERLEAVED_FAST_CHAIN.findIndex(
        (e) => e.model === "nvidia/nemotron-3.5-lightning-30b-a3b",
      );
      expect(idx120).toBeGreaterThan(-1);
      expect(idxLightning).toBeGreaterThan(-1);
      expect(idx120).toBeLessThan(idxLightning);
    });

    it("GEMINI-FIRST CANCELLED (Phase 5-A) — gemini is the TAIL of the fast chain (EVO); the speed law head is restored", () => {
      expect(INTERLEAVED_FAST_CHAIN[0].provider).toBe("groq");
      expect(INTERLEAVED_FAST_CHAIN[0].model).toBe("openai/gpt-oss-20b");
      const last = INTERLEAVED_FAST_CHAIN[INTERLEAVED_FAST_CHAIN.length - 1];
      expect(last.provider).toBe("gemini");
      expect(last.model).toBe("gemini-3.5-flash");
      expect(INTERLEAVED_FAST_CHAIN.filter((e) => e.provider === "gemini")).toHaveLength(1);
    });

    it("speed law intact at the head — gpt-oss-20b (fastest TTFT) is slot 1", () => {
      expect(INTERLEAVED_FAST_CHAIN[0].model).toBe("openai/gpt-oss-20b");
      expect(INTERLEAVED_FAST_CHAIN[0].provider).toBe("groq");
    });
  });

  describe("FREE_OPENROUTER_MODELS (shared list — future wiring protection)", () => {
    it("purged of dead ids so nothing can resurrect them", () => {
      for (const model of FREE_OPENROUTER_MODELS) {
        expect(DEAD_IDS).not.toContain(model);
      }
    });
  });
});

describe("Phase 177 — Groq json-mode 400 guard (35 live json_validate_failed failures)", () => {
  type Captured = { url?: string; body?: Record<string, unknown> };

  function stubFetch(captured: Captured) {
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      captured.url = url;
      captured.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: "PONG" } }] }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("groq + jsonMode → response_format NOT sent (server-side validation 400s)", async () => {
    const captured: Captured = {};
    stubFetch(captured);
    await callAI(
      "Reply with JSON",
      { jsonMode: true, maxTokens: 10 },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(captured.url).toContain("api.groq.com");
    expect(captured.body?.response_format).toBeUndefined();
  });

  it("openrouter + jsonMode → response_format json_object IS sent", async () => {
    const captured: Captured = {};
    stubFetch(captured);
    await callAI(
      "Reply with JSON",
      { jsonMode: true, maxTokens: 10 },
      {
        provider: "openrouter",
        apiKey: "sk-or-test_key",
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        baseUrl: "https://openrouter.ai/api/v1",
      },
    );
    expect(captured.body?.response_format).toEqual({ type: "json_object" });
  });

  it("nvidia + jsonMode → response_format json_object IS sent", async () => {
    const captured: Captured = {};
    stubFetch(captured);
    await callAI(
      "Reply with JSON",
      { jsonMode: true, maxTokens: 10 },
      {
        provider: "nvidia",
        apiKey: "nvapi-test_key",
        model: "nvidia/nemotron-3-super-120b-a12b",
        baseUrl: "https://integrate.api.nvidia.com/v1",
      },
    );
    expect(captured.body?.response_format).toEqual({ type: "json_object" });
  });

  it("groq WITHOUT jsonMode → no response_format either (unchanged path)", async () => {
    const captured: Captured = {};
    stubFetch(captured);
    await callAI(
      "Reply plainly",
      { maxTokens: 10 },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(captured.body?.response_format).toBeUndefined();
  });
});
