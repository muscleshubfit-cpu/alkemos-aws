import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Phase 344 — P0 REAL-search law (owner order 2026-10-06 «نفّذ إصلاح P0
 * بحيث يستخدم بحثًا خارجيًا حقيقيًا [Google Search grounding] وتدخل نتائج
 * البحث الفعلية في عملية توليد المقال، مع إزالة الاعتماد على محاكاة البحث
 * أو الـ curated fallback كبديل للبحث الحقيقي»). Source-pinning canary in
 * the blog-topic-dedup / blog-editorial-rules style: the behavioral URL/
 * body/evidence contract is pinned in ai-provider-gemini.test.ts; this file
 * pins the PIPELINE wiring — the research step rides the grounded call,
 * the curated/LLM-simulation substitution paths are GONE at runtime, and
 * the live evidence flows into P1/P2 prompts.
 */

const libDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const researchSrc = readFileSync(join(libDir, "blog-research.ts"), "utf8");
const pipelineSrc = readFileSync(join(libDir, "blog-pipeline.ts"), "utf8");
const providerSrc = readFileSync(join(libDir, "ai-provider.ts"), "utf8");

describe("Phase 344 — P0 uses the REAL grounded search (no simulation, no substitute)", () => {
  // BLOG-PROVIDER-FAILOVER 2026-10-16 (owner order «افحص دعم البحث
  // المُسنَد لدى كل مزوّد»): the premise evolved from gemini-only to the
  // cross-provider REAL-search walk (gemini googleSearch → openrouter web
  // plugin → groq compound; NVIDIA honestly excluded). The REAL-search law
  // itself is UNTOUCHED — every arm must return live-search evidence.
  it("blog-research rides callGroundedSearch (cross-provider real-search failover)", () => {
    expect(researchSrc).toContain('import { callGroundedSearch, parseJSON } from "./ai-provider"');
    expect(researchSrc).toContain("await callGroundedSearch(prompt, {");
    expect(researchSrc).toContain('tag: "blog:research"');
    expect(researchSrc).toContain("USE YOUR GOOGLE SEARCH TOOL");
  });

  it("the pre-343 chain call is gone from the research step (an LLM-memory answer is not research)", () => {
    expect(researchSrc).not.toContain("callFreeAIFallbackChain");
    expect(researchSrc).not.toContain("use your training knowledge");
  });

  it("NO curated-fallback substitution at runtime — a failed/ungrounded attempt THROWS honestly", () => {
    // The retired runtime path (verbatim pre-344 return):
    expect(researchSrc).not.toContain(
      'return { data: fallbackResearch(lang, recentTitles), source: "curated-fallback" };',
    );
    // The honest-failure rethrow is present:
    expect(researchSrc).toContain("console.error(`[blog-research] P0 ${lang} grounded search failed:");
    expect(researchSrc).toContain("throw e;");
  });

  it("the grounding evidence is attached from groundingMetadata (authoritative — never model-fabricated)", () => {
    expect(researchSrc).toContain("data.searchedQueries = grounding.searchQueries;");
    expect(researchSrc).toContain("data.sources = grounding.sources;");
  });

  it("fallbackResearch survives as a TEST FIXTURE ONLY (blog-*-tests import it)", () => {
    expect(researchSrc).toContain("export function fallbackResearch");
    // …and the fixture law is documented in the source:
    expect(researchSrc).toContain("TEST FIXTURE ONLY");
  });

  it("the research artifact carries the new evidence fields (legacy rows stay optional)", () => {
    expect(researchSrc).toContain("searchedQueries?: string[];");
    expect(researchSrc).toContain("sources?: ResearchSource[];");
    expect(researchSrc).toContain("export type ResearchSource = { title: string; url: string };");
  });
});

describe("Phase 344 — the live search results enter article generation (P1 + P2)", () => {
  it("P1: researchDigest carries LIVE SEARCH QUERIES + TOP LIVE SEARCH RESULTS (empty for legacy rows)", () => {
    expect(pipelineSrc).toContain("LIVE SEARCH QUERIES (real Google Search this research ran)");
    expect(pipelineSrc).toContain("TOP LIVE SEARCH RESULTS (real pages the research grounded on");
  });

  it("P2: the writing prompt gains VERIFIED SEARCH CONTEXT from the grounded sources", () => {
    expect(pipelineSrc).toContain("VERIFIED SEARCH CONTEXT");
    expect(pipelineSrc).toContain("${searchContextBlock}");
  });

  it("the FACT GUARD citation law is untouched (owner scope: feed results, not rewrite citations)", () => {
    expect(pipelineSrc).toContain("the citation law above is unchanged");
  });
});

describe("Phase 344 — the grounded call lives in the native adapter (no consumer-side fetch)", () => {
  it("tools:[{googleSearch:{}}] is built inside geminiBuildBody (ai-provider.ts alone)", () => {
    expect(providerSrc).toContain("...(options.googleSearch ? { tools: [{ googleSearch: {} }] } : {}),");
    expect(providerSrc).toContain("export async function callGeminiGroundedSearch(");
  });

  it("the ungrounded-200 honest gate + the JSON-mode suppression are both present", () => {
    expect(providerSrc).toContain("HONEST GROUNDING GATE");
    expect(providerSrc).toContain("no Google-Search grounding evidence");
    expect(providerSrc).toContain("if (options.jsonMode && !options.googleSearch) {");
  });
});

describe("Phase 344 — default gemini model switched 3.8-flash → 3.5-flash (chains + registry)", () => {
  it("the registry default is 3.5-flash and no 3.8-flash default remains in the live code", () => {
    expect(providerSrc).toContain('defaultModel: "gemini-3.5-flash"');
    expect(providerSrc).not.toContain('defaultModel: "gemini-3.8-flash"');
    expect(providerSrc).not.toContain('model: "gemini-3.8-flash"');
    expect(providerSrc).not.toContain('"gemini-3.8-flash" leads');
  });

  it("GEMINI-FIRST law intact — gemini still LEADS both chains (now on 3.5-flash)", () => {
    // Both chain gemini entries (strongest + fast) are 3.5-flash — the
    // behavioral chain-lead pins live in ai-provider.test.ts ([0].model).
    const switched = providerSrc.match(
      /\{ provider: "gemini", model: "gemini-3\.5-flash" \}/g,
    );
    expect(switched?.length).toBe(2);
    expect(providerSrc).not.toContain('{ provider: "gemini", model: "gemini-3.8-flash" }');
  });
});
