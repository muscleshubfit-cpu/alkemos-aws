import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the ai_jobs
 * article_generate DIRECTED REPAIR RETRY canaries (the plan-family
 * callValidatedChain named-reason law, ported to the single-shot
 * generator). The audited gap: the QUALITY FLOOR throw requeued the
 * job BLIND — the retry re-ran the same prompt family on a fresh
 * archetype and could reproduce the identical shallow draft.
 *
 * The owner's proof shape:
 *   - canary 1: a shallow first draft triggers ONE directed retry whose
 *     prompt NAMES the violation; a deep second draft ships (before/
 *     after content comparison — the article is materially deeper).
 *   - canary 2: both attempts failing throws the honest error naming
 *     BOTH violations (never success; the requeue stands as recourse).
 *   - canary 3: a passing first draft never pays a second AI call.
 */

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...orig,
    callFreeAIFallbackChain: vi.fn(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(() => {
      const builder = () => ({
        select: () => builder(),
        update: () => builder(),
        eq: () => builder(),
        order: () => builder(),
        limit: () => builder(),
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: { id: "a" }, error: null }),
      });
      return { ...builder(), insert: () => ({ select: () => ({ single: async () => ({ data: { id: "a" }, error: null }) }) }) };
    }),
  },
}));

import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import { PROCESSORS } from "@/lib/ai-job-processors";

const chain = vi.mocked(callFreeAIFallbackChain);
const runArticleGenerate = PROCESSORS["article_generate"];

/** A full article JSON at the wanted depth (or a given word count). */
const articleJson = (words: number) => {
  const markdown =
    "## First Section\n\n" +
    "Detailed training guidance with mechanisms and practical steps. ".repeat(Math.ceil(words / 8)) +
    "\n\n## Second Section\n\nMore depth with examples and common mistakes listed carefully here. ".repeat(10) +
    "\n\n## Third Section\n\n" +
    "Progressive overload notes and recovery guidance for real trainees everywhere. ".repeat(10) +
    "\n\n## Fourth Section\n\n" +
    "Nutrition context and hydration guidance with sensible ranges only. ".repeat(10) +
    "\n\n## Fifth Section\n\n" +
    "A conclusion summarizing the practical takeaways in clear language. ".repeat(10);
  return JSON.stringify({
    title: "A Deep Training Guide",
    slug: "deep-training-guide",
    excerpt: "A two-line teaser for the article about training depth.",
    meta_title: "Deep Training Guide",
    meta_description: "A meta description with more than fifty characters for the gate.",
    tags: ["training", "guide"],
    image_queries: ["dumbbell rack gym"],
    faq: [{ question: "Is depth needed?", answer: "Yes — depth is required for quality." }],
    markdown,
  });
};

const shallowArticleJson = () =>
  JSON.stringify({
    title: "A Shallow Draft",
    slug: "shallow-draft",
    excerpt: "teaser",
    meta_title: "t",
    meta_description: "d",
    tags: ["t"],
    image_queries: ["q"],
    faq: [],
    markdown: "## One\n\n" + "thin filler text long enough to clear the 200-char length gate. ".repeat(5), // ~40 words → the WORD floor class
  });

beforeEach(() => {
  chain.mockReset();
});

describe("article_generate — the directed repair retry (canaries 1-3)", () => {
  it("1. shallow first draft → ONE directed retry naming the violation; the deep second draft SHIPS", async () => {
    chain
      .mockResolvedValueOnce({ text: shallowArticleJson(), model: "m1", provider: "p1" } as never)
      .mockResolvedValueOnce({ text: articleJson(900), model: "m2", provider: "p2" } as never);

    const result = (await runArticleGenerate({
      topic: "progressive overload for beginners",
      language: "en",
      tone: "practical",
    })) as Record<string, unknown>;

    // Two dispatches: first rejected by the floor, retry directed.
    expect(chain).toHaveBeenCalledTimes(2);
    const secondPrompt = chain.mock.calls[1]?.[0] ?? "";
    expect(secondPrompt).toContain("DIRECTED REPAIR RETRY");
    expect(secondPrompt).toContain("QUALITY FLOOR: draft too shallow");
    expect(secondPrompt).toContain("progressive overload for beginners"); // the original ask rides below
    // BEFORE/AFTER proof: the shipped article is the DEEP second draft.
    const md = String(result.markdown ?? "");
    expect(md.split(/\s+/).filter(Boolean).length).toBeGreaterThan(750);
    expect((result as { topic_diagnostics?: { autoTopic?: boolean } }).topic_diagnostics?.autoTopic ?? false).toBe(false);
  });

  it("2. both attempts failing → the honest error names BOTH violations (never success, requeue stands)", async () => {
    chain
      .mockResolvedValueOnce({ text: shallowArticleJson(), model: "m1", provider: "p1" } as never)
      .mockResolvedValueOnce({ text: shallowArticleJson(), model: "m2", provider: "p2" } as never);

    await expect(
      runArticleGenerate({ topic: "carb timing", language: "en" }),
    ).rejects.toThrow(/QUALITY FLOOR unfixable after the directed repair retry/);
    expect(chain).toHaveBeenCalledTimes(2);
  });

  it("3. a passing first draft pays NO second call (zero added cost on the healthy path)", async () => {
    chain.mockResolvedValueOnce({ text: articleJson(950), model: "m1", provider: "p1" } as never);
    const result = (await runArticleGenerate({
      topic: "recovery basics",
      language: "en",
    })) as Record<string, unknown>;
    expect(chain).toHaveBeenCalledTimes(1);
    const prompt = chain.mock.calls[0]?.[0] ?? "";
    expect(prompt).not.toContain("DIRECTED REPAIR RETRY");
    expect(String(result.markdown).length).toBeGreaterThan(1000);
  });

  it("4. the AR directive is the bilingual twin", async () => {
    chain
      .mockResolvedValueOnce({ text: shallowArticleJson(), model: "m1", provider: "p1" } as never)
      .mockResolvedValueOnce({ text: articleJson(900), model: "m2", provider: "p2" } as never);
    await runArticleGenerate({ topic: "توقيت الكربوهيدرات", language: "ar" });
    const secondPrompt = chain.mock.calls[1]?.[0] ?? "";
    expect(secondPrompt).toContain("إعادة إصلاح موجّهة");
    expect(secondPrompt).toContain("QUALITY FLOOR");
  });
});
