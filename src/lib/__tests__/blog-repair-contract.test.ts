import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * R1 REPAIR CONTRACT — behavioral route-level proof (Execution-Path
 * Audit §8.2 A1+A4, 2026-09-29). The map itself is unit-pinned in
 * blog-repair-target.test.ts; THESE tests invoke the real route
 * handlers with controlled queue rows (the Phase-1 battery test
 * pattern) and prove the CONTRACT END-TO-END:
 *
 *   P5 word-floor failure   → 500 body carries rerunTarget:"p2-content"
 *   P5 battery failure      → 500 body carries rerunTarget:"p4-review"
 *   P5 infra failure        → 500 body has NO rerunTarget (legacy shape)
 *   P2 on a draft without ?force=1 → resumed (idempotent, no regen)
 *   P2 with ?force=1 on a failed row → REGENERATES over the draft
 *         (research0/outline preserved, only bundle.content replaced)
 */

vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/blog-server", () => ({ normalizeCategory: vi.fn((c: string) => c || "training") }));
vi.mock("@/lib/blog-link-verify", () => ({
  verifyBodyLinks: vi.fn(async (md: string) => ({
    checked: [],
    dead: [],
    unverified: [],
    skipped: [],
    md,
  })),
}));

vi.mock("@/lib/blog-queue", () => ({
  getQueueIdParam: vi.fn(),
  fetchQueueItem: vi.fn(),
  validateQueueStatus: vi.fn(),
  requireRowLang: vi.fn(),
  updateQueueItem: vi.fn(async () => null),
  markQueueItemFailed: vi.fn(async () => null),
  findRecentPairRows: vi.fn(async () => []),
  countAutomatedPublishedToday: vi.fn(async () => 0),
  countAutomatedPublishedThisWeek: vi.fn(async () => 0),
  BLOG_WEEKLY_QUOTA_PER_LANG: 2,
  bundleMarksCoachRequest: vi.fn(() => false),
  stampQueueRowRepairDirective: vi.fn(async () => undefined),
}));
vi.mock("@/lib/blog-topics", () => ({
  getRecentPostsByLanguage: vi.fn(async () => []),
}));

// generateFullArticle is the ONLY blog-pipeline seam the p2 tests need
// controlled; everything else (countWords, splitFaqSection, …) stays
// real so the behavioral surface is the production code.
vi.mock("@/lib/blog-pipeline", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/blog-pipeline")>();
  return {
    ...orig,
    generateFullArticle: vi.fn(async () => ({
      markdown: "## Regenerated Section One\n\nRegenerated article body for the repair contract test.",
      wordCount: 1600,
      source: "test-chain-model",
    })),
  };
});

// Supabase admin mock — insert error is togglable for the infra case.
let INSERT_FAILS = false;
vi.mock("@/lib/supabase/admin", () => {
  const result = (data: unknown) => ({ data, error: null });
  const builder = () => ({
    select: () => builder(),
    eq: () => builder(),
    ilike: () => builder(),
    order: () => builder(),
    limit: () => result([]),
    maybeSingle: async () => result(null),
    single: async () => result({ id: "post-123", slug: "x" }),
  });
  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: {
      from: vi.fn((table: string) =>
        table === "blog_posts"
          ? {
              ...builder(),
              insert: () => ({
                select: () => ({
                  single: async () =>
                    INSERT_FAILS
                      ? { data: null, error: { message: "relation blog_posts does not exist" } }
                      : result({ id: "post-123", slug: "x" }),
                }),
              }),
              update: () => builder(),
            }
          : builder(),
      ),
    },
  };
});

import { GET as p5Publish } from "@/app/api/cron/blog/p5-publish/route";
import { GET as p2Content } from "@/app/api/cron/blog/p2-content/route";
import * as blogQueue from "@/lib/blog-queue";
import { generateFullArticle } from "@/lib/blog-pipeline";

const P5_ROW = "r1-repair-contract-p5-row";
const P2_ROW = "r1-repair-contract-p2-row";

/** ≥1300 words, 5 H2s, grammatical anchors + one authority link — but
 * NO FAQ section (FAQ count 0 → battery G3 failure). This is the LIVE
 * 38f230fb shape from the audit (§3.3): the battery failure that
 * killed a complete 1369-word article. */
function longDraftWithoutFaq(): string {
  const filler = "Home training builds strength when you follow a sensible plan and recover well. ".repeat(90);
  return [
    "## Why Training at Home Works",
    filler,
    "Start with [the complete guide](/blog/a) for the fundamentals.",
    "## Equipment You Actually Need",
    filler,
    "## The Weekly Training Split",
    filler,
    "## Nutrition That Supports Growth",
    "General guidance from [WHO healthy diets](https://www.who.int/news-room/fact-sheets/healthy-diet) supports a balanced approach.",
    filler,
    "## Tracking Your Progress",
    filler,
  ].join("\n");
}

function p5Row(markdown: string) {
  return {
    id: P5_ROW,
    language: "en" as const,
    status: "reviewed",
    topic: "home muscle building",
    focus_keyword: "build muscle at home",
    category: "training",
    article_bundle: JSON.stringify({
      outline: {
        title: "How to Build Muscle at Home: The Complete Guide",
        slugBase: "build-muscle-home-complete-guide",
        metaDescription: "How to build muscle at home with a weekly plan, nutrition and tracking.",
        lsiKeywords: [],
      },
      review: { markdown },
      images: [],
    }),
  };
}

function p2Row() {
  return {
    id: P2_ROW,
    language: "en" as const,
    status: "failed",
    topic: "home muscle building",
    focus_keyword: "build muscle at home",
    category: "training",
    article_bundle: JSON.stringify({
      research0: { keywords: ["build muscle"], faqs: [] },
      outline: {
        title: "How to Build Muscle at Home: The Complete Guide",
        slugBase: "build-muscle-home-complete-guide",
        metaDescription: "…",
        lsiKeywords: [],
      },
      content: { markdown: "## Short draft\n\nToo short — this failed P5's word floor.", words: 12, source: "old-model" },
      images: [{ url: "https://images.example/x.jpg", alt: "x", credit: "x" }],
      review: { markdown: "## Short draft (reviewed)\n\nStill short." },
    }),
  };
}

function req(url: string): NextRequest {
  return { url } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  INSERT_FAILS = false;
  (blogQueue.getQueueIdParam as ReturnType<typeof vi.fn>).mockImplementation(
    (r: { url: string }) => new URL(r.url).searchParams.get("queueId"),
  );
  (blogQueue.validateQueueStatus as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (blogQueue.requireRowLang as ReturnType<typeof vi.fn>).mockImplementation(
    (qi: { language: string }) => qi.language,
  );
  (blogQueue.countAutomatedPublishedToday as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (blogQueue.bundleMarksCoachRequest as ReturnType<typeof vi.fn>).mockReturnValue(false);
});

describe("R1 A1 — P5 500 body carries the machine-readable rerunTarget", () => {
  it("word-floor failure → rerunTarget 'p2-content' (live 419/1077-word class)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row("## Short\n\nOnly forty words long and it must fail the floor gate here."),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string };
    expect(body.error).toContain("article too short");
    expect(body.rerunTarget).toBe("p2-content");
    // markFailed semantics unchanged — the row is still failed honestly.
    expect(blogQueue.markQueueItemFailed).toHaveBeenCalledTimes(1);
  });

  it("battery failure (FAQ count 0, the live 38f230fb shape) → rerunTarget 'p4-review'", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(longDraftWithoutFaq()),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string };
    expect(body.error).toContain("quality-gate battery failed");
    expect(body.error).toContain("FAQ count 0");
    expect(body.rerunTarget).toBe("p4-review");
  });

  it("infra failure (post insert) → NO rerunTarget (legacy body, not a repair contract)", async () => {
    INSERT_FAILS = true;
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(longDraftWithoutFaq().replace("## Tracking Your Progress", "## Tracking Your Progress") + "\n" + [
        "## Frequently Asked Questions",
        "**How many days a week should I build muscle at home?**",
        "Answer for home muscle days.",
        "**Can I build muscle at home without equipment?**",
        "Answer for equipment.",
        "**How long until I see results building muscle at home?**",
        "Answer for results.",
        "**Is home training enough to build muscle?**",
        "Answer for sufficiency.",
      ].join("\n")),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string; rerunTarget?: string };
    expect(body.error).toContain("Post insert");
    expect(body.rerunTarget).toBeUndefined();
  });
});

describe("R5 — the repair directive is STAMPED for observability (queue-health counter source)", () => {
  it("word-floor directive → stampQueueRowRepairDirective(row, 'p2-content', the row's bundle)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row("## Short\n\nOnly forty words long and it must fail the floor gate here."),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    expect(blogQueue.stampQueueRowRepairDirective).toHaveBeenCalledTimes(1);
    const call = (blogQueue.stampQueueRowRepairDirective as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe(P5_ROW);
    expect(call?.[1]).toBe("p2-content");
    // the stamp receives the row's CURRENT bundle (no extra DB read)
    expect(call?.[2]).toBe(p5Row("## Short\n\nOnly forty words long and it must fail the floor gate here.").article_bundle);
  });

  it("infra failure (no rerunTarget) → NO stamp (legacy behavior untouched)", async () => {
    INSERT_FAILS = true;
    // a draft that PASSES every deterministic gate (length + battery) so
    // the run reaches the post INSERT and fails THERE — the infra class
    // that maps to no rerunTarget (same shape as the R1 infra case).
    const faqBlock = [
      "## Frequently Asked Questions",
      "**How many days a week should I build muscle at home?**",
      "Answer for home muscle days.",
      "**Can I build muscle at home without equipment?**",
      "Answer for equipment.",
      "**How long until I see results building muscle at home?**",
      "Answer for results.",
      "**Is home training enough to build muscle?**",
      "Answer for sufficiency.",
    ].join("\n");
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p5Row(`${longDraftWithoutFaq()}\n${faqBlock}`),
      error: null,
    });
    const res = await p5Publish(req(`http://localhost:3000/api/cron/blog/p5-publish?queueId=${P5_ROW}`));
    expect(res.status).toBe(500);
    expect(blogQueue.stampQueueRowRepairDirective).not.toHaveBeenCalled();
  });

  it("the stamp SURVIVES the p2-force repair chain (queue-health can count it at publish)", async () => {
    // a failed row carrying the directive stamp enters the R1 chain:
    // p2-force regenerates over the draft and MUST spread the stamp
    // through to the persisted bundle — that survival is what makes
    // «published after repair» measurable in /api/ai/queue-health.
    const stampedRow = p2Row();
    const stampedBundle = JSON.parse(stampedRow.article_bundle as string);
    stampedBundle.repairLoop = { directives: 1, lastTarget: "p2-content", lastAt: "2026-09-30T10:00:00.000Z" };
    stampedRow.article_bundle = JSON.stringify(stampedBundle);
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: stampedRow,
      error: null,
    });
    const res = await p2Content(req(`http://localhost:3000/api/cron/blog/p2-content?queueId=${P2_ROW}&force=1`));
    expect(res.status).toBe(200);
    const calls = (blogQueue.updateQueueItem as ReturnType<typeof vi.fn>).mock.calls;
    const upd = calls[1];
    const persisted = JSON.parse(upd?.[1]?.article_bundle as string);
    expect(persisted.repairLoop).toEqual({
      directives: 1,
      lastTarget: "p2-content",
      lastAt: "2026-09-30T10:00:00.000Z",
    });
    // and the regeneration itself still replaced only the content
    expect(persisted.content.source).toBe("test-chain-model");
  });
});

describe("R1 A4 — p2-content ?force=1 regenerates over the draft", () => {
  it("without force: an existing draft is RESUMED (idempotent, no regeneration)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p2Row(),
      error: null,
    });
    const res = await p2Content(req(`http://localhost:3000/api/cron/blog/p2-content?queueId=${P2_ROW}`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; resumed?: boolean };
    expect(body.ok).toBe(true);
    expect(body.resumed).toBe(true);
    expect(generateFullArticle).not.toHaveBeenCalled();
  });

  it("with force=1 on the failed row: content REGENERATED, bundle artifacts preserved", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: p2Row(),
      error: null,
    });
    const res = await p2Content(req(`http://localhost:3000/api/cron/blog/p2-content?queueId=${P2_ROW}&force=1`));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; resumed?: boolean; regenerated?: boolean; words?: number };
    expect(body.ok).toBe(true);
    expect(body.regenerated).toBe(true);
    expect(body.resumed).toBeUndefined();
    expect(generateFullArticle).toHaveBeenCalledTimes(1);

    // status advances writing → written; the FINAL persisted bundle
    // keeps research0/outline/images and REPLACES only content.
    const calls = (blogQueue.updateQueueItem as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0]?.[1]?.status).toBe("writing");
    const upd = calls[1];
    expect(upd?.[1]?.status).toBe("written");
    const persisted = JSON.parse(upd?.[1]?.article_bundle as string);
    expect(persisted.research0).toEqual({ keywords: ["build muscle"], faqs: [] });
    expect(persisted.outline.slugBase).toBe("build-muscle-home-complete-guide");
    expect(persisted.images).toHaveLength(1);
    expect(persisted.content.source).toBe("test-chain-model");
    expect(persisted.content.markdown).toContain("Regenerated article body");
    // the stale P4 review of the OLD draft does not survive as content…
    expect(persisted.review.markdown).toBe("## Short draft (reviewed)\n\nStill short.");
  });
});
