/**
 * ENQUEUE JOB-ID CONTRACT CANARY (2026-10-27, all-accounts audit round).
 *
 * Live-measured production defect this pins: POST /api/ai/jobs responds
 * `{ jobId, etaMinutes, runnerDispatched, message }` (camelCase), but
 * enqueueAiJobClient read `data.id` — returning undefined. Every
 * localStorage watcher registry (mhe:pending-swaps · pending-plan-jobs ·
 * pending-article-job) then stored id-less entries, polled
 * `?id=undefined` (400 Bad id) and NEVER applied the finished job —
 * the member saw a permanent «جاري التبديل» badge plus a false timeout
 * toast. The fix reads `jobId ?? id`; this canary freezes the contract
 * so a future response-shape change fails CI instead of production.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { enqueueAiJobClient } from "../ai-jobs-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(body: Record<string, unknown>, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      status,
      json: async () => body,
    })),
  );
}

describe("enqueueAiJobClient — returns the POSTed job id (jobId contract)", () => {
  it("reads the canonical camelCase `jobId` field (the live API shape)", async () => {
    stubFetch({ jobId: "b6845dc1-7fe1-4e3c-a52b-f43223b594c3", etaMinutes: 3 });
    const id = await enqueueAiJobClient("exercise_regenerate", { planId: "x" });
    expect(id).toBe("b6845dc1-7fe1-4e3c-a52b-f43223b594c3");
  });

  it("still accepts a snake-era `id` field as the belt-and-suspenders fallback", async () => {
    stubFetch({ id: "legacy-shape-uuid" });
    const id = await enqueueAiJobClient("meal_regenerate", { planId: "y" });
    expect(id).toBe("legacy-shape-uuid");
  });

  it("prefers jobId when BOTH fields are present (no ambiguity)", async () => {
    stubFetch({ jobId: "canonical", id: "fallback" });
    const id = await enqueueAiJobClient("article_generate", { topic: "t" });
    expect(id).toBe("canonical");
  });

  it("surfaces the server error message on rejection (429 tier-limit passthrough)", async () => {
    stubFetch({ error: "weekly swaps exhausted" }, false, 429);
    await expect(
      enqueueAiJobClient("exercise_regenerate", {}),
    ).rejects.toThrow("weekly swaps exhausted");
  });
});
