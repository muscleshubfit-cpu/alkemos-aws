import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * AUDIT_REPORT.md §9-المرحلة 1, item 4 (2026-09-29) — the expanded P5
 * quality battery, proven BEHAVIORALLY by invoking the route handler
 * with controlled queue rows (the Phase-0 length-gate test pattern,
 * extended to G2-G6):
 *
 *   BLOCKED: a draft under any gate (sections / FAQ range / authority
 *   link / quoted query stuffing / raw keyword-list anchor) → 500 +
 *   the row marked failed with the gate diagnostic — never inserted.
 *
 *   PUBLISHED: a fully compliant draft passes the WHOLE battery and
 *   completes the publish (post row inserted, queue row published) —
 *   proving the battery never false-blocks a good article.
 */

vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/blog-server", () => ({ normalizeCategory: vi.fn((c: string) => c || "training") }));
// AUDIT §9-2.2: the link-verify gate is a BOUNDARY (network) — unit
// behavior lives in blog-link-verify.test.ts; here it is a no-op
// pass-through so the behavioral P5 tests never touch the network.
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
  // R5 (Execution-Path Audit §10 Phase R5): the repair-directive stamp
  // the P5 route now calls on every deterministic gate failure.
  stampQueueRowRepairDirective: vi.fn(async () => undefined),
}));
vi.mock("@/lib/blog-topics", () => ({
  // The anchor-grammar whitelist: two real-looking published titles.
  getRecentPostsByLanguage: vi.fn(async () => [
    { title: "How to Build Muscle at Home: The Complete Guide", focusKeyword: "", category: "", slug: "a" },
    { title: "The Beginner Guide to Progressive Overload", focusKeyword: "", category: "", slug: "b" },
  ]),
}));

// Chainable Supabase admin mock: terminal methods return result
// objects ({data, error}); chainable ones return the builder — the
// exact shapes the route's three blog_posts queries produce.
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
              insert: () => ({ select: () => ({ single: async () => result({ id: "post-123", slug: "x" }) }) }),
              update: () => builder(),
            }
          : builder(),
      ),
    },
  };
});

import { GET as p5Publish } from "@/app/api/cron/blog/p5-publish/route";
import * as blogQueue from "@/lib/blog-queue";

const QUEUE_ID = "phase1-quality-gates-test-row";

/** A compliant section skeleton (5 H2s + grammatical anchors + one
 * authority link). `words` filler pads the word count past the floor. */
function sections(words: number, extra = ""): string {
  const filler = `Home training builds strength when you follow a sensible plan and recover well. `.repeat(
    Math.max(1, Math.ceil(words / 16)),
  );
  return [
    `## Why Training at Home Works`,
    filler,
    `Start with [the complete guide](/blog/a) for the fundamentals.`,
    extra,
    `## Equipment You Actually Need`,
    filler,
    `## The Weekly Training Split`,
    filler,
    `## Nutrition That Supports Growth`,
    `General guidance from [WHO healthy diets](https://www.who.int/news-room/fact-sheets/healthy-diet) supports a balanced approach.`,
    filler,
    `## Tracking Your Progress`,
    filler,
    `## Conclusion`,
    filler,
  ].join("\n");
}

function faqSection(qs: string[]): string {
  return ["## Frequently Asked Questions", ...qs.map((q) => `**${q}**\n\nAnswer paragraph for ${q}.`)].join("\n\n");
}

/** Every FAQ question shares ≥2 meaningful words with the title hint
 * (build/muscle/home) so the relevance filter keeps them. */
const GOOD_FAQS = [
  "How many days a week should I build muscle at home?",
  "Can I build muscle at home without equipment?",
  "How long until I see results building muscle at home?",
  "Is home training enough to build muscle?",
];

function makeRow(markdown: string) {
  return {
    id: QUEUE_ID,
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

function makeRequest(): NextRequest {
  return {
    url: `http://localhost:3000/api/cron/blog/p5-publish?queueId=${QUEUE_ID}`,
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  (blogQueue.getQueueIdParam as ReturnType<typeof vi.fn>).mockImplementation(
    (req: { url: string }) => new URL(req.url).searchParams.get("queueId"),
  );
  (blogQueue.validateQueueStatus as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (blogQueue.requireRowLang as ReturnType<typeof vi.fn>).mockImplementation(
    (qi: { language: string }) => qi.language,
  );
  (blogQueue.countAutomatedPublishedToday as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (blogQueue.bundleMarksCoachRequest as ReturnType<typeof vi.fn>).mockReturnValue(false);
});

async function setRow(markdown: string) {
  (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: makeRow(markdown),
    error: null,
  });
}

async function failMsg(): Promise<string> {
  const m = (blogQueue.markQueueItemFailed as ReturnType<typeof vi.fn>).mock
    .calls[0] as [string, string];
  return m?.[1] ?? "";
}

describe("AUDIT §9-1.4 — P5 quality battery BLOCKS the deficient", () => {
  it("blocks an under-sectioned draft (4 H2s < 5 floor)", async () => {
    // 6 H2s minus two headings → 4 survive the FAQ lift
    const underSectioned = sections(1400)
      .replace("## Tracking Your Progress", "Tracking progress")
      .replace("## Conclusion", "Conclusion");
    await setRow([underSectioned, faqSection(GOOD_FAQS)].join("\n\n"));
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("quality-gate battery failed");
    expect(body.error).toContain("H2 sections");
    expect(await failMsg()).toContain("rerun p4-review");
  });

  it("blocks a zero-authority-link draft (YMYL E-E-A-T floor)", async () => {
    const noAuth = sections(1400).replace(
      "General guidance from [WHO healthy diets](https://www.who.int/news-room/fact-sheets/healthy-diet) supports a balanced approach.",
      "General guidance supports a balanced approach without any external link.",
    );
    await setRow([noAuth, faqSection(GOOD_FAQS)].join("\n\n"));
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("no external authority link");
  });

  it("blocks a draft with only 2 relevant FAQs (< 4 floor)", async () => {
    await setRow([sections(1400), faqSection(GOOD_FAQS.slice(0, 2))].join("\n\n"));
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("FAQ count 2 outside the 4-7 range");
  });

  it("blocks the §C4 quoted-search-phrase stuffing pattern", async () => {
    const stuffed =
      sections(1400) +
      '\n\nYour daily target for "how many calories should i eat to lose weight" matters too.';
    await setRow([stuffed, faqSection(GOOD_FAQS)].join("\n\n"));
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("quoted search phrase");
    // NOTE: the deterministic tool-link pass may wrap a word inside the
    // pasted query with a calculator link ("how many [calories](…) …") —
    // the gate runs on the FINAL body and still catches the shape, so
    // the assertion matches the stable tail of the phrase.
    expect(body.error).toContain("should i eat to lose weight");
  });

  it("blocks a raw keyword-list anchor (anchor grammar law)", async () => {
    const stuffed =
      sections(1400) +
      "\n\nSee also [training adjustments menstrual cycle female lifters](/blog/c).";
    await setRow([stuffed, faqSection(GOOD_FAQS)].join("\n\n"));
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("ungrammatical keyword-list anchor");
    expect(blogQueue.markQueueItemFailed).toHaveBeenCalledTimes(1);
  });
});

describe("AUDIT §9-1.4 — the battery never false-blocks the compliant", () => {
  it("PUBLISHES a fully compliant draft end-to-end (200, post inserted, queue published)", async () => {
    await setRow([sections(1450), faqSection(GOOD_FAQS)].join("\n\n"));
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok?: boolean;
      postId?: string;
      faqLifted?: number;
      toolLinksInserted?: number;
    };
    expect(body.ok).toBe(true);
    expect(body.postId).toBe("post-123");
    expect(body.faqLifted).toBe(4);
    expect(blogQueue.markQueueItemFailed).not.toHaveBeenCalled();
    const upd = (blogQueue.updateQueueItem as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(upd?.[1]?.status).toBe("published");
  });
});
