import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * B1 REPAIR-DIRECTIVE + P4 LENGTH-PRESERVATION CONTRACT
 * (Execution-Path Audit §8.2 B1 — owner order 2026-10-01).
 *
 * Live failure classes this frame is built on (GHA runs 75-82 +
 * blog_generation_queue rows):
 *   • P4 SHRANK complete drafts below the execution floor (live-measured
 *     1217→671 / 1113 / 1133 words in run 36855101483 alone) — the review
 *     prompt carried a 1500-2500 "target" but no never-shorter-than-the-
 *     draft obligation, so deletion instructions (1/4/5) won over length.
 *   • P5 battery failures re-ran P4 with the IDENTICAL prompt on the
 *     IDENTICAL draft and reproduced the IDENTICAL violations three
 *     times ("FAQ count 3 outside the 4-7 range" + the same Arabic
 *     anchors in runs 78/81/82) — the repair loop had no way to tell
 *     the model WHICH gates rejected it.
 *
 * Owner constraints pinned here (quality-first law):
 *   • the length contract and the directive BOTH carry explicit
 *     anti-filler / anti-padding / no-invented-claims clauses;
 *   • the directive is ONE-SHOT repair guidance — absent on every
 *     normal run, the review prompt is the plain prompt (plus the
 *     always-on length contract) byte-for-byte;
 *   • no gate, floor, or editorial rule changes anywhere (R4 canaries
 *     still hold in blog-r4-execution-floors.test.ts).
 */

// ── the AI chain boundary (the r4 mocking pattern): the payload the
// "model" returns is steered per test through __state.articleMd; the
// PROMPT the chain received is captured for assertion.
vi.mock("@/lib/ai-provider", () => {
  const state = { articleMd: "" };
  const prompts: string[] = [];
  return {
    __state: state,
    __prompts: prompts,
    callFreeAIFallbackChain: vi.fn(async (prompt: string) => {
      prompts.push(prompt);
      return {
        text: JSON.stringify({ articleMd: state.articleMd }),
        model: "b1-test-model",
        provider: "b1test",
      };
    }),
    parseJSON: vi.fn(<T,>(text: string): T | null => {
      try {
        return JSON.parse(text) as T;
      } catch {
        return null;
      }
    }),
  };
});

import { reviewAndEnhance, countWords, type OutlinePlan } from "@/lib/blog-pipeline";
import * as aiProvider from "@/lib/ai-provider";

const state = (aiProvider as unknown as { __state: { articleMd: string } }).__state;
const prompts = (aiProvider as unknown as { __prompts: string[] }).__prompts;

/** A markdown-free filler of EXACTLY n words (countWords basis). */
const filler = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`).join(" ");

const OUTLINE: OutlinePlan = {
  title: "How to Recover After a Marathon",
  subtitle: "a complete recovery guide",
  metaDescription: "Recovery steps for the two weeks after a marathon.",
  slugBase: "marathon-recovery",
  sections: ["Why recovery matters", "The first 48 hours", "Week one", "Week two", "Returning to training"],
  lsiKeywords: ["marathon recovery"],
  imagePlan: [],
};

const read = (rel: string): string => readFileSync(join(process.cwd(), rel), "utf-8");

// The repair directive block starts with REPAIR RETRY and ends with the
// anti-gaming sentence — one occurrence per prompt when present.
const DIRECTIVE_RE = /REPAIR RETRY[\s\S]*?games it\.\n/;

beforeEach(() => {
  state.articleMd = "";
  prompts.length = 0;
});

// ─────────────────────────────────────────────────────────────────
// 1 · LENGTH-PRESERVATION CONTRACT — always on, quality-first wording
// ─────────────────────────────────────────────────────────────────

describe("B1 · P4 length-preservation contract (always-on prompt clause)", () => {
  it("states the draft's MEASURED word count and the never-shorter obligation", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, []);
    const p = prompts[0];
    expect(p).toContain("LENGTH CONTRACT: the draft below is ~1217 words.");
    expect(p).toContain("MUST be AT LEAST ~1217 words — NEVER shorter than the draft");
    // the count is DERIVED (a different draft reports its own count)
    prompts.length = 0;
    await reviewAndEnhance("en", filler(950), OUTLINE, []);
    expect(prompts[0]).toContain("~950 words");
  });

  it("anti-filler guardrails are pinned (quality-first owner law)", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, []);
    const p = prompts[0];
    // deletions are offset by DEPTH, never by padding…
    expect(p).toContain("OFFSET every deletion by deepening what remains");
    // …and manufacturing length with filler is explicitly forbidden
    expect(p).toContain("NEVER manufacture length with filler, repeated advice, motivational padding, or off-topic sections");
    // no invented evidence while deepening (FACT GUARD stays king)
    expect(p).toContain("NO invented statistics, studies, or citations");
    // keep-as-is beats padding (the honest floor of the contract)
    expect(p).toContain("if you cannot honestly deepen a point, keep it as-is rather than pad it");
  });

  it("the contract rides BOTH languages (no EN/AR fork)", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("ar", filler(1217), OUTLINE, []);
    expect(prompts[0]).toContain("LENGTH CONTRACT: the draft below is ~1217 words.");
  });

  it("the legacy TARGET LENGTH line survives untouched beside the new contract", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, []);
    expect(prompts[0]).toContain(
      "TARGET LENGTH: 1500-2500 words (expand thin sections if needed; NEVER pad with filler to reach the length — depth, not repetition).",
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// 2 · B1 REPAIR DIRECTIVE — present ONLY on directed repair runs
// ─────────────────────────────────────────────────────────────────

describe("B1 · repair directive injection (one-shot, repair runs only)", () => {
  it("a normal run carries NO directive (the prompt is the plain review prompt)", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, []);
    expect(prompts[0]).not.toMatch(DIRECTIVE_RE);
    expect(prompts[0]).not.toContain("REPAIR RETRY");
  });

  it("a directed run embeds the violations VERBATIM in the directive block", async () => {
    state.articleMd = filler(1300);
    // the LIVE 09-30/10-01 AR failure shape (queue row 2026-09-30T23:45):
    const diag =
      'quality-gate battery failed — FAQ count 3 outside the 4-7 range | 4 ungrammatical keyword-list anchor(s): "إرشادات الرقم التسلسلي الدولي عن توقيت المغذيات والتضخيم", "إجمالي الإنفاق اليومي للطاقة الخاص بك"';
    await reviewAndEnhance("ar", filler(1217), OUTLINE, [], diag);
    const p = prompts[0];
    expect(p).toMatch(DIRECTIVE_RE);
    expect(p).toContain("REJECTED by the publish quality gates");
    expect(p).toContain(diag); // Arabic + quotes + em-dash survive verbatim
    // the cause-fixing mandate names the live gate classes
    expect(p).toContain("FAQ count: add a genuinely on-topic question this article already answers");
    expect(p).toContain("ungrammatical anchor: rewrite the anchor as a natural grammatical phrase");
  });

  it("the directive is PURELY ADDITIVE: stripping it restores the normal prompt byte-for-byte", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, []);
    const plain = prompts[0];
    prompts.length = 0;
    await reviewAndEnhance("en", filler(1217), OUTLINE, [], "quality-gate battery failed — FAQ count 0 outside the 4-7 range");
    const directed = prompts[0];
    expect(directed.replace(DIRECTIVE_RE, "")).toBe(plain);
  });

  it("the standing editorial laws ride BOTH modes (no-law-fork on directed runs)", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, [], "quality-gate battery failed — FAQ count 0 outside the 4-7 range");
    const p = prompts[0];
    expect(p).toContain("4-7 questions serving THIS article's search intent");
    expect(p).toContain("DO ALL OF THE FOLLOWING:");
    expect(p).toContain("Return STRICT JSON only:");
  });

  it("SANITIZE — newlines/control chars collapse (single prompt line, no whitespace injection)", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, [], "line one\nline two\ttabbed\r\nline three");
    const p = prompts[0];
    expect(p).toContain("line one line two tabbed line three");
    expect(p).not.toContain("line one\nline two");
  });

  it("SANITIZE — over-long diagnostics cap at 1500 chars", async () => {
    state.articleMd = filler(1300);
    const diag = "x".repeat(1600);
    await reviewAndEnhance("en", filler(1217), OUTLINE, [], diag);
    const p = prompts[0];
    expect(p).toContain("x".repeat(1500));
    expect(p).not.toContain("x".repeat(1501));
  });

  it("SANITIZE — empty/whitespace diagnostics behave as ABSENT (no directive block)", async () => {
    state.articleMd = filler(1300);
    await reviewAndEnhance("en", filler(1217), OUTLINE, [], "   ");
    expect(prompts[0]).not.toContain("REPAIR RETRY");
  });

  it("directed run does NOT change the chain call shape (maxModels/timeout/maxTokens untouched)", async () => {
    state.articleMd = filler(1300);
    const chain = (aiProvider as unknown as {
      callFreeAIFallbackChain: ReturnType<typeof vi.fn>;
    }).callFreeAIFallbackChain;
    await reviewAndEnhance("en", filler(1217), OUTLINE, [], "quality-gate battery failed — FAQ count 0");
    const opts = chain.mock.calls[0]?.[1] as Record<string, unknown>;
    // timeoutMs 110s → 150s (BLOG-PROVIDER-FAILOVER 2026-10-16, live run
    // 38851515578: every non-gemini review entry aborted at the 110s cap on
    // the ~11.8k review payload; the workflow budget funds 600s/4=150s).
    expect(opts).toEqual({
      tag: "blog:review-en",
      temperature: 0.4,
      maxTokens: 6_400,
      jsonMode: false,
      timeoutMs: 150_000,
      maxModels: 4,
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 3 · the execution floor applies to B1 outputs too (gate truth).
//     FLOOR-LOWERING UPDATE (owner order 2026-10-02, Phase 323):
//     BLOG_EXECUTION_WORD_FLOOR 1200→1000 · P5_WORD_FLOOR 1300→1000.
//     The B1 behavior under test (directed outputs judged by the SAME
//     floor — no diagnostic leniency) is unchanged; only the values
//     moved. The 1133-word fixture (which now PASSES the 1000 floor)
//     was replaced by the other live run-82 shrink value, 671.
// ─────────────────────────────────────────────────────────────────

describe("B1 · directed outputs judged by the same floor (byte-truth canaries)", () => {
  it("the P4 code floor applies to undirected runs with the R4 message shape (prompt contract ≠ code gate)", async () => {
    state.articleMd = filler(752);
    await expect(reviewAndEnhance("en", filler(1217), OUTLINE, [])).rejects.toThrow(
      /P4 en: review output too short from b1test:b1-test-model \(752 words < 1000-word execution floor — the draft was longer; the review shrank it\)/,
    );
  });

  it("a directed repair output is judged by the SAME floor (no diagnostic leniency)", async () => {
    state.articleMd = filler(671);
    await expect(
      reviewAndEnhance("ar", filler(1217), OUTLINE, [], "quality-gate battery failed — FAQ count 3 outside the 4-7 range"),
    ).rejects.toThrow("671 words < 1000-word execution floor");
  });

  it("source truth: the floors ride their named constants at the owner-ordered 1000 (Phase 323)", () => {
    expect(read("src/lib/blog-pipeline.ts")).toContain("export const BLOG_EXECUTION_WORD_FLOOR = 1000");
    expect(read("src/app/api/cron/blog/p5-publish/route.ts")).toContain("const P5_WORD_FLOOR = 1000");
  });
});

// ─────────────────────────────────────────────────────────────────
// 4 · the LOOP wiring — source canaries (mechanics proven live by
//     scripts/blog-runner/run-step-loop-test.sh sc10-sc12)
// ─────────────────────────────────────────────────────────────────

describe("B1 · loop wiring source canaries", () => {
  it("run-step.mts re-emits the diagnostics as base64 and rides them on p4-review", () => {
    const runner = read("scripts/blog-runner/run-step.mts");
    expect(runner).toContain('RERUN_DIAGNOSTICS_B64=');
    expect(runner).toContain('url.searchParams.set("repairDiagnostics", process.env.P4_REPAIR_DIAGNOSTICS)');
  });

  it("run-step.sh greps the b64 line, decodes it, and threads it to the p4-review child", () => {
    const sh = read("scripts/blog-runner/run-step.sh");
    expect(sh).toContain("RERUN_DIAGNOSTICS_B64=");
    expect(sh).toContain('P4_REPAIR_DIAGNOSTICS="$REPAIR_DIAG"');
    // never exported to GITHUB_ENV — one-shot per repair cycle by design
    expect(sh).not.toContain("P4_REPAIR_DIAGNOSTICS >> \"$GITHUB_ENV\"");
  });

  it("the p5 route emits repairDiagnostics for p4-review targets (strip prefix + rerun tail)", () => {
    const route = read("src/app/api/cron/blog/p5-publish/route.ts");
    expect(route).toContain('rerunTarget === "p4-review"');
    expect(route).toContain("repairDiagnostics");
  });
});

