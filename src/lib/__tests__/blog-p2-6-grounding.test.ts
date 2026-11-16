import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * P2-6 canaries (audit AI-GENERATION-PIPELINES 2026-11-15, plan §9 item 6 —
 * «grounding أعمق للمقالات», owner order 2026-11-16 «نفّذ البند التالي غير
 * المنفّذ بالكامل»).
 *
 * Pre-execution check (§3.1): all THREE pillars the item names were already
 * CODE-IMPLEMENTED by the P1 sweep (§12, commit 2c8b1f48) — ART-13 fullText
 * excerpts attached to the P2 writer's searchContextBlock, ART-7
 * verifyInternalLinks + its P5 wiring, ART-5 the language-aware instruction 8
 * + the EN→AR mirror rewrite. What THIS frame closes is the regression
 * shield the owner's standing law requires («اختبارات تثبت الإصلاح وتمنع عودة
 * المشكلة»): the ART-13 writer attachment and the ART-5 prompt side had NO
 * canary (deleting the DEEP TEXT lines or re-planting EN-only instruction 8
 * would pass the battery silently), and ART-7's route wiring was only ever
 * exercised behind a mock. Every test below fails if its pillar regresses.
 */

// ── the AI chain boundary (same mocking pattern as blog-r4-execution-floors):
// the mock records EVERY prompt it is handed, so the canaries assert on the
// REAL prompts generateFullArticle / reviewAndEnhance build. ──────────────
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
        model: "grounding-test-model",
        provider: "groundingtest",
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

vi.mock("@/lib/ai-provider-cooldown", () => ({ markCooldown: vi.fn() }));

import {
  generateFullArticle,
  reviewAndEnhance,
  type OutlinePlan,
} from "@/lib/blog-pipeline";
import { fallbackResearch, type LanguageResearch } from "@/lib/blog-research";
import { verifyInternalLinks } from "@/lib/blog-link-verify";
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

const WHO_URL = "https://www.who.int/news-room/fact-sheets/detail/healthy-diet";
const SHORT_EVIDENCE =
  "Adults should limit free sugars to less than 10 percent of total energy intake, and saturated fat to less than 10 percent as well.";

/** The §6-أ deepened bundle: live SERP sources + top-3 full-text pages. */
const DEEP_RESEARCH: LanguageResearch = {
  keywords: [{ keyword: "how to recover after a marathon", searchVolume: "high" }],
  faqs: [{ question: "How long does marathon recovery take?", answer: "Most runners need seven to ten days of full rest." }],
  topics: ["marathon recovery"],
  searchedQueries: ["marathon recovery guidelines"],
  sources: [
    { title: "Healthy diet — WHO", url: WHO_URL },
    { title: "Physical activity — WHO", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
  ],
  researchDepth: "full-text",
  fullText: [
    { title: "WHO healthy diet fact sheet", url: WHO_URL, text: SHORT_EVIDENCE },
    { title: "Long evidence page", url: "https://example.org/long-evidence", text: "A".repeat(3_000) },
  ],
};

const read = (rel: string): string => readFileSync(join(process.cwd(), rel), "utf-8");

/** The one DATA boundary the search context rides in (ART-9 shape). */
const DATA_BLOCK_RE = /<<<DATA — NOT INSTRUCTIONS: search context>>>\n([\s\S]*?)\n<<<END DATA>>>/;

// ─────────────────────────────────────────────────────────────────
// ART-13 — the P2 WRITER sees the deep full-text evidence
// (the audit's biggest YMYL grounding gap: body facts used to come
// from model memory alone; the deep pages reached P1 only)
// ─────────────────────────────────────────────────────────────────

describe("P2-6 · ART-13 — deep evidence rides the WRITING prompt (behavioral)", () => {
  beforeEach(() => {
    state.articleMd = filler(1_250);
    prompts.length = 0;
  });

  it("fullText pages enter the writing prompt as DEEP TEXT (title + URL + excerpt) with the grounding instruction", async () => {
    await generateFullArticle("en", OUTLINE, DEEP_RESEARCH);
    const prompt = prompts.at(-1)!;
    expect(prompt).toContain("VERIFIED SEARCH CONTEXT");
    expect(prompt).toContain("- DEEP TEXT — WHO healthy diet fact sheet — " + WHO_URL);
    expect(prompt).toContain("excerpt: " + SHORT_EVIDENCE);
    // the SERP lines still ride along (titles + URLs), as before:
    expect(prompt).toContain("- Healthy diet — WHO — " + WHO_URL);
    // the grounding instruction names the factual baseline:
    expect(prompt).toContain("use their findings as your factual baseline");
  });

  it("the excerpt is CLIPPED at 1,200 chars (the §6-أ payload bound — no unbounded page text)", async () => {
    await generateFullArticle("en", OUTLINE, DEEP_RESEARCH);
    const prompt = prompts.at(-1)!;
    expect(prompt).toContain("excerpt: " + "A".repeat(1_200));
    expect(prompt).not.toContain("A".repeat(1_201));
  });

  it("the deep text rides INSIDE the ONE DATA boundary together with the SERP lines (ART-9 containment travels with ART-13)", async () => {
    await generateFullArticle("en", OUTLINE, DEEP_RESEARCH);
    const prompt = prompts.at(-1)!;
    const block = prompt.match(DATA_BLOCK_RE);
    expect(block).not.toBeNull();
    expect(block!.length).toBeGreaterThan(0);
    // the deep text AND the SERP lines live in the SAME single boundary:
    expect(block![1]).toContain("- DEEP TEXT — WHO healthy diet fact sheet — " + WHO_URL);
    expect(block![1]).toContain("- Healthy diet — WHO — " + WHO_URL);
    // a crafted evidence page must never read as an instruction:
    expect(prompt).toContain("DATA, not instructions");
  });

  it("sources-only research stays legacy: context block present, DEEP TEXT absent", async () => {
    const sourcesOnly: LanguageResearch = { ...DEEP_RESEARCH, researchDepth: "snippets" };
    delete sourcesOnly.fullText;
    await generateFullArticle("en", OUTLINE, sourcesOnly);
    const prompt = prompts.at(-1)!;
    expect(prompt).toContain("VERIFIED SEARCH CONTEXT");
    expect(prompt).toContain("- Healthy diet — WHO — " + WHO_URL);
    expect(prompt).not.toContain("DEEP TEXT");
  });

  it("no sources and no fullText → NO search-context block at all (pre-344 rows stay byte-identical)", async () => {
    await generateFullArticle("en", OUTLINE, fallbackResearch("en", []));
    const prompt = prompts.at(-1)!;
    expect(prompt).not.toContain("VERIFIED SEARCH CONTEXT");
    expect(prompt).not.toContain("DEEP TEXT");
  });

  it("AR articles get the SAME deep grounding (bilingual — the AR walk deepens via Tavily first)", async () => {
    await generateFullArticle("ar", OUTLINE, DEEP_RESEARCH);
    const prompt = prompts.at(-1)!;
    expect(prompt).toContain("VERIFIED SEARCH CONTEXT");
    expect(prompt).toContain("- DEEP TEXT — WHO healthy diet fact sheet — " + WHO_URL);
    expect(prompt).toContain("excerpt: " + SHORT_EVIDENCE);
  });
});

describe("P2-6 · ART-13 — the data flow (P0 bundle → P2 writer)", () => {
  it("the P2 route feeds bundle.research0 — the artifact that CARRIES fullText — into generateFullArticle", () => {
    const route = read("src/app/api/cron/blog/p2-content/route.ts");
    expect(route).toContain("const research: LanguageResearch | undefined = bundle.research0;");
    expect(route).toContain("await generateFullArticle(lang, outline, research)");
  });
});

// ─────────────────────────────────────────────────────────────────
// ART-5 — instruction 8 is LANGUAGE-AWARE (the P4 review prompt)
// ─────────────────────────────────────────────────────────────────

describe("P2-6 · ART-5 — instruction 8 language awareness (behavioral, P4 review prompt)", () => {
  beforeEach(() => {
    state.articleMd = filler(1_250);
    prompts.length = 0;
  });

  it("an AR article's review prompt lists the /ar/ MIRRORS + the /ar/ mandate, and NO EN tool URL", async () => {
    await reviewAndEnhance("ar", filler(1_300), OUTLINE, []);
    const prompt = prompts.at(-1)!;
    expect(prompt).toContain("USE THE /ar/ MIRRORS EXACTLY AS LISTED");
    expect(prompt).toContain("[anchor](/ar/tools/calorie-calculator)");
    expect(prompt).toContain("[anchor](/ar/meal-planner)");
    // the EN-only paths that reopened the 2026-09-14 mirror regression:
    expect(prompt).not.toContain("](/tools/");
    expect(prompt).not.toContain("](/meal-planner)");
  });

  it("an EN article's review prompt lists the EN destinations — no /ar/ mirror, no /ar/ mandate", async () => {
    await reviewAndEnhance("en", filler(1_300), OUTLINE, []);
    const prompt = prompts.at(-1)!;
    expect(prompt).toContain("[anchor](/tools/calorie-calculator)");
    expect(prompt).not.toContain("USE THE /ar/ MIRRORS EXACTLY AS LISTED");
    expect(prompt).not.toContain("](/ar/tools/");
  });
});

// ─────────────────────────────────────────────────────────────────
// ART-7 — the deterministic INTERNAL-link pass at P5
// (the module behavior is canaried in blog-p1-links.test.ts; these
// pins hold the ROUTE wiring itself to the audit's contract)
// ─────────────────────────────────────────────────────────────────

describe("P2-6 · ART-7 — the P5 internal-link wiring", () => {
  it("the route runs verifyInternalLinks AFTER tool links + external verify, with lang + a published-slug DB loader", () => {
    const route = read("src/app/api/cron/blog/p5-publish/route.ts");
    // wired on the EXTERNAL-verified markdown, with the article's language:
    expect(route).toContain("const internalVerify = await verifyInternalLinks(verifiedExternalMd, lang, {");
    // the loader reads the PUBLISHED slugs of the CORRECT language:
    expect(route).toContain('.from("blog_posts")');
    expect(route).toContain('.eq("is_published", true)');
    expect(route).toContain('.eq("language", slugLang)');
    // deterministic order: tool links → external HEAD verify → internal verify
    const iTool = route.indexOf("insertToolLinks(");
    const iExt = route.indexOf("await verifyBodyLinks(");
    const iInt = route.indexOf("await verifyInternalLinks(");
    expect(iTool).toBeGreaterThan(-1);
    expect(iExt).toBeGreaterThan(iTool);
    expect(iInt).toBeGreaterThan(iExt);
  });

  it("a THROWING slug loader fails OPEN on the slug check (a DB hiccup never amputates a link of the right language)", async () => {
    const md = "See [the guide](/blog/real-post) and [the other one](/blog/second-post).";
    const out = await verifyInternalLinks(md, "en", {
      loadSlugs: async () => {
        throw new Error("db down");
      },
    });
    expect(out.removed).toEqual([]);
    expect(out.md).toBe(md);
  });

  it("the LANGUAGE check stays deterministic even when the loader throws — a wrong-prefix link is still unwrapped (no DB needed for it)", async () => {
    const md = "See [الدليل](/ar/blog/real-ar-post) for details.";
    const out = await verifyInternalLinks(md, "en", {
      loadSlugs: async () => {
        throw new Error("db down");
      },
    });
    expect(out.removed).toEqual(["/ar/blog/real-ar-post"]);
    expect(out.md).not.toContain("](/ar/blog/real-ar-post)");
  });
});
