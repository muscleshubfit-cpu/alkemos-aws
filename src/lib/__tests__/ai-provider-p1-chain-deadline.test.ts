import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * P1 canary — INF-2: the UNIFIED CHAIN DEADLINE. The old
 * "maxModels × effTimeout ≤ budget" clamp ignored the inner attempt
 * multipliers (key fallback × empty-retry), so the claimed wall-clock
 * budget was false and the chain could run several times past it. The
 * deadline is now checked before EVERY attempt and each attempt's
 * timeout is clamped to the remaining budget — the chain can never
 * materially outlive AI_CHAIN_TOTAL_BUDGET_MS.
 *
 * NOTE on the env dance: CHAIN_TOTAL_BUDGET_MS is a module-load constant,
 * so the budget env is set BEFORE the dynamic import (a static import
 * would hoist above the env line and freeze the default 52s).
 */

process.env.AI_CHAIN_TOTAL_BUDGET_MS = "400";
process.env.OPENROUTER_API_KEY = "sk-or-inf2-test";
delete process.env.OPENROUTER_API;
delete process.env.GROQ_API_KEY;
delete process.env.NVIDIA_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.CLOUDFLARE_AI_TOKEN;
delete process.env.AI_PROVIDER_COOLDOWN_MS;
delete process.env.CLOUDFLARE_ACCOUNT_ID;

const { callFreeAIFallbackChain } = await import("@/lib/ai-provider");

describe("INF-2 — the unified chain deadline", () => {
  const ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ENV };
    vi.unstubAllGlobals();
  });

  it("a slow provider cannot walk the chain past the wall-clock budget", async () => {
    // A fetch that NEVER answers: every attempt burns its full timeout —
    // only the deadline can stop the walk.
    const slow = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const t = setTimeout(
            () => reject(new Error("fetch should have been aborted first")),
            10_000,
          );
          init?.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );
    vi.stubGlobal("fetch", slow);

    const startedAt = Date.now();
    await expect(
      callFreeAIFallbackChain("ping", { tag: "test:inf2", maxModels: 3, timeoutMs: 60_000 }),
    ).rejects.toThrow();
    const elapsed = Date.now() - startedAt;

    // Budget 400ms: the deadline stops the walk long before the old
    // multiplier math (3 models × 2 keys × 2 attempts × 400ms+) could
    // finish. Generous CI jitter allowed — but nowhere near the past.
    expect(elapsed).toBeLessThan(2_500);
    expect(slow.mock.calls.length).toBeLessThanOrEqual(6);
  }, 15_000);
});
