import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * WEEKLY CADENCE (owner order 2026-11-13 «4 مقالات إجمالًا أسبوعيًا:
 * 2 عربية و2 إنجليزية») — the p5-publish WEEKLY QUOTA GUARD, route-level
 * proof (the Phase-171 daily-quota suite's mock pattern, extended).
 *
 * The guard's contract, pinned here:
 *   • An AUTOMATED row refuses to publish a THIRD automated article of
 *     its language in the same ISO week → honest skip
 *     (status skipped_weekly_quota, reason weekly-quota-met, ok:true —
 *     the queue row stays inspectable, exactly like the daily guard).
 *   • The DAILY guard still fires FIRST (one-article/day/lang law).
 *   • The SECOND article of the week publishes normally (the healthy
 *     weekly schedule itself: 2 slots per language per week).
 *   • COACH-marked rows (Phase 162 owner-override law) are EXEMPT —
 *     the owner-requested article publishes even at the weekly cap.
 *   • DB unavailable (countAutomatedPublishedThisWeek → null) → the
 *     guard degrades OPEN (never blocks publishing on an infra hiccup).
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
  getRecentPostsByLanguage: vi.fn(async () => [
    { title: "How to Build Muscle at Home: The Complete Guide", focusKeyword: "", category: "", slug: "a" },
    { title: "The Beginner Guide to Progressive Overload", focusKeyword: "", category: "", slug: "b" },
  ]),
}));

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

const QUEUE_ID = "weekly-quota-test-row";

/** The canonical COMPLIANT draft (blog-phase1-quality-gates.test.ts):
 *  ≥1000 words, 5+ H2s, 4 relevant FAQs, one live authority link. */
function compliantDraft(): string {
  const filler = `Home training builds strength when you follow a sensible plan and recover well. `.repeat(92);
  const faq = [
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
    faq,
  ].join("\n");
}

function makeRow(bundleOverride?: Record<string, unknown>) {
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
      review: { markdown: compliantDraft() },
      images: [],
      ...bundleOverride,
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
    (r: { url: string }) => new URL(r.url).searchParams.get("queueId"),
  );
  (blogQueue.validateQueueStatus as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (blogQueue.requireRowLang as ReturnType<typeof vi.fn>).mockImplementation(
    (qi: { language: string }) => qi.language,
  );
  (blogQueue.countAutomatedPublishedToday as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (blogQueue.countAutomatedPublishedThisWeek as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (blogQueue.bundleMarksCoachRequest as ReturnType<typeof vi.fn>).mockReturnValue(false);
  (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: makeRow(),
    error: null,
  });
});

describe("WEEKLY CADENCE · P5 weekly quota guard (max 2 automated/language/ISO week)", () => {
  it("THE CAP: a third automated article of the week is refused — skipped_weekly_quota, no insert", async () => {
    (blogQueue.countAutomatedPublishedThisWeek as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok?: boolean;
      skipped?: boolean;
      reason?: string;
      alreadyPublishedThisWeek?: number;
    };
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("weekly-quota-met");
    expect(body.alreadyPublishedThisWeek).toBe(2);
    // The row is marked honestly (inspectable in the queue) — with the
    // weekly law named in the error message.
    const upd = (blogQueue.updateQueueItem as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(upd?.[1]?.status).toBe("skipped_weekly_quota");
    expect(String(upd?.[1]?.error_message)).toContain("weekly-quota-en");
    expect(String(upd?.[1]?.error_message)).toContain("max 2/language/week");
    // NOTHING touched blog_posts (the guard precedes every blog_posts
    // query — title dedup, slug, insert).
    const admin = await import("@/lib/supabase/admin");
    expect(admin.supabaseAdmin?.from).not.toHaveBeenCalled();
    expect(blogQueue.markQueueItemFailed).not.toHaveBeenCalled();
  });

  it("THE DAILY GUARD STILL FIRES FIRST (one-article/day/lang — Phase 171 law intact)", async () => {
    (blogQueue.countAutomatedPublishedToday as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (blogQueue.countAutomatedPublishedThisWeek as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const res = await p5Publish(makeRequest());
    const body = (await res.json()) as { reason?: string };
    expect(body.reason).toBe("daily-quota-met");
    const upd = (blogQueue.updateQueueItem as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(upd?.[1]?.status).toBe("skipped_daily_quota");
  });

  it("THE SECOND ARTICLE OF THE WEEK PUBLISHES (the healthy 2-slots/week schedule)", async () => {
    (blogQueue.countAutomatedPublishedThisWeek as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; postId?: string };
    expect(body.ok).toBe(true);
    expect(body.postId).toBe("post-123");
    const upd = (blogQueue.updateQueueItem as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(upd?.[1]?.status).toBe("published");
  });

  it("COACH ROWS ARE EXEMPT (Phase 162 owner-override law — the weekly cap never blocks owner requests)", async () => {
    (blogQueue.countAutomatedPublishedThisWeek as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (blogQueue.bundleMarksCoachRequest as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; postId?: string };
    expect(body.ok).toBe(true);
    expect(body.postId).toBe("post-123");
  });

  it("DB UNAVAILABLE → the weekly guard degrades OPEN (never blocks on an infra hiccup)", async () => {
    (blogQueue.countAutomatedPublishedThisWeek as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; postId?: string };
    expect(body.ok).toBe(true);
    expect(body.postId).toBe("post-123");
  });
});
