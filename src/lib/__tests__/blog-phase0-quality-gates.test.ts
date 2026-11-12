import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextRequest } from "next/server";

/**
 * AUDIT_REPORT.md §9 Phase 0 (2026-09-29) — quick-win quality gates,
 * pinned by the repo's read-the-source canary pattern:
 *
 *   0.1 TEMPLATE TRUTH: the false sources-citation byline and the visible
 *       keyword chips (`#tag` spans rendering raw LSI keywords) are GONE
 *       from the article template (audit F2/F7: both measured on 97/97
 *       published pages).
 *   0.2 GEO: FAQPage JSON-LD is emitted SERVER-SIDE from faq_json on BOTH
 *       language mirrors (audit F5: 0/97 while the data sat in the DB on
 *       every article — the biggest low-cost GEO gap in the system).
 *   0.3 LENGTH GATE: P5 refuses to PUBLISH a draft under the 1000-word
 *       floor (lowered from 1300 by owner order 2026-10-02, Phase 323),
 *       failing honestly BEFORE the quota/dup guards (audit F3/C1:
 *       no publish-layer length gate existed; median 1,202 words, six
 *       sub-800-word articles shipped). The behavioral block below
 *       INVOKES the route handler and proves both directions: a short
 *       draft is BLOCKED (marked failed, never inserted), an adequate
 *       draft passes the floor and reaches the next guard.
 *   0.4 DOC TRUTH: AGENTS.md and the SEO master plan carry the REAL
 *       pipeline numbers (audit C6/F8: the law file described the fallback
 *       spec as the standard, plus stale «6 articles/day» and «maxModels 5»).
 *
 * Phase 0.5 (og:image → /api/og-image generator) was DEFERRED by
 * owner-order conflict — documented in blog-server.ts (the shareImage
 * field doc) and the PHASE0-QUALITY-2026-09-29 worklog entry; the live
 * cover-first law stays pinned by og-image-coverage.test.ts +
 * low-fixes-p2-14.test.ts, untouched here.
 */

// ── Behavioral mocks for the P5 route invocation (0.3) ─────────────────
// The route's REAL pure helpers (blog-pipeline countWords/splitFaq,
// blog-msa, blog-images, blog-tool-links, slug) stay REAL — only the
// boundaries (cron auth, Supabase admin, the queue module, blog-server)
// are mocked. supabaseAdmin.from THROWS: reaching it means the flow went
// deeper than these tests intend (loud ordering canary).
vi.mock("@/lib/cron-auth", () => ({ verifyCronAuth: vi.fn(() => true) }));
vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn(() => {
      throw new Error("supabaseAdmin.from must not be reached in these tests");
    }),
  },
}));
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

import { GET as p5Publish } from "@/app/api/cron/blog/p5-publish/route";
import * as blogQueue from "@/lib/blog-queue";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf-8");

const ARTICLE_PAGE = "src/components/blog/BlogArticlePage.tsx";
const BLOG_EN = "src/app/(en)/blog/[slug]/page.tsx";
const BLOG_AR = "src/app/(ar)/ar/blog/[slug]/page.tsx";
const P5_ROUTE = "src/app/api/cron/blog/p5-publish/route.ts";
const AGENTS = "AGENTS.md";
const SEO_PLAN = "docs/SEO-GEO-MASTER-PLAN.md";

describe("AUDIT_REPORT §9-0.1 — template truth (false claims + chips removed)", () => {
  it("the article template no longer renders the false sources-citation byline", () => {
    const src = read(ARTICLE_PAGE);
    expect(src).not.toContain("Sources cited in article");
    expect(src).not.toContain("تحقق من المصادر المنشورة");
  });

  it("the article template no longer renders visible keyword chips", () => {
    const src = read(ARTICLE_PAGE);
    expect(src).not.toContain("#{tag}");
    expect(src).not.toContain("post.tags.map");
  });
});

describe("AUDIT_REPORT §9-0.2 — FAQPage JSON-LD from faq_json (GEO)", () => {
  it.each([[BLOG_EN, "EN"], [BLOG_AR, "AR"]])(
    "%s mirror emits FAQPage server-side from faq_json",
    (page: string) => {
      const src = read(page);
      // single-source schema builder (seo.ts law) — no local fork
      expect(src).toContain("getFAQSchema");
      // built from the post's own faq_json (no forced filler)
      expect(src).toContain("fullPost.faq_json");
      expect(src).toContain("f.question");
      expect(src).toContain("f.answer");
      // server-rendered JSON-LD emission (crawler-visible without JS)
      expect(src).toContain("jsonLd(faqPageSchema)");
      expect(src).toContain("type=\"application/ld+json\"");
    },
  );

  it("the schema builder stays the seo.ts single source (@type FAQPage)", () => {
    const seo = read("src/lib/seo.ts");
    expect(seo).toContain('"FAQPage"');
  });
});

describe("AUDIT_REPORT §9-0.3 — P5 publish-layer length gate", () => {
  it("carries the 1000-word floor as a named constant (owner order 2026-10-02)", () => {
    const src = read(P5_ROUTE);
    expect(src).toContain("const P5_WORD_FLOOR = 1000");
  });

  it("measures the reviewed markdown (reading_time + audit-baseline basis)", () => {
    const src = read(P5_ROUTE);
    expect(src).toContain("countWords(review.markdown)");
  });

  it("fails honestly with the rerun diagnostic", () => {
    const src = read(P5_ROUTE);
    expect(src).toContain("article too short");
    expect(src).toContain("rerun p2-content");
  });

  it("runs BEFORE the quota/duplicate guards (fail fast, no wasted DB work)", () => {
    const src = read(P5_ROUTE);
    const gatePos = src.indexOf("article too short");
    const quotaPos = src.indexOf("DAILY QUOTA GUARD");
    // the CALL site (await …), not the function definition at the top
    const dupPos = src.indexOf("await titleAlreadyExists(title, lang)");
    expect(gatePos).toBeGreaterThan(0);
    expect(quotaPos).toBeGreaterThan(gatePos);
    expect(dupPos).toBeGreaterThan(gatePos);
  });
});

describe("AUDIT_REPORT §9-0.4 — doc truth (real pipeline numbers)", () => {
  it("AGENTS.md carries the MAIN pipeline spec, not the fallback's", () => {
    const src = read(AGENTS);
    expect(src).toContain("1500-2500 words");
    expect(src).toContain("P5 publish floor ≥1000 words");
    expect(src).toContain("5-7 H2 sections");
    // the pre-correction line form must never return verbatim
    expect(src).not.toContain("ANTI-FORMULA:** ASK = 1100-1400");
  });

  it("AGENTS.md no longer claims a nonexistent maxModels 5 call shape", () => {
    const src = read(AGENTS);
    expect(src).not.toContain("try maxModels 5");
    // R3 (CHAIN-EXPANSION, 2026-09-29) split the P1/P2 line: P2 walks 3 entries
    // (480s chain budget funds the third; Groq re-admitted via the per-entry clamp)
    expect(src).toContain("P1 `maxModels: 2`");
    expect(src).toContain("P2 `maxModels: 3`");
    expect(src).toContain("P4 `maxModels: 4`");
  });

  it("the SEO master plan states the real cadence (1/day/language, Phase 119)", () => {
    const src = read(SEO_PLAN);
    expect(src).toContain("1 مقالة/يوم/لغة");
    // the pre-correction live claims must never return verbatim
    expect(src).not.toContain("منشورًا، 6 مقالات/يوم");
    expect(src).not.toContain("6 مقالات/يوم = 2,190");
  });
});

// ── 0.3 BEHAVIORAL: the route handler itself ─────────────────────────────
// Both directions of the length floor, by invoking GET with controlled
// queue rows (the audit's demand: the gate must BLOCK the weak instead of
// passing them — and must not false-block the adequate).

const QUEUE_ID = "phase0-length-gate-test-row";

function makeShortRow(words: number) {
  const markdown = `${"filler ".repeat(words)}\n\n## FAQ\n\n**q?** a.`;
  return {
    id: QUEUE_ID,
    language: "en" as const,
    status: "reviewed",
    topic: "Gate behavior test",
    focus_keyword: "gate test",
    category: "training",
    article_bundle: JSON.stringify({
      outline: {
        title: "Gate Behavior Test Article",
        slugBase: "gate-behavior-test",
        metaDescription: "Behavioral verification of the P5 length floor.",
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

describe("AUDIT_REPORT §9-0.3 — P5 length gate BEHAVIOR (route invoked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const row = makeShortRow(800);
    (blogQueue.getQueueIdParam as ReturnType<typeof vi.fn>).mockImplementation(
      (req: { url: string }) => new URL(req.url).searchParams.get("queueId"),
    );
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: row,
      error: null,
    });
    (blogQueue.validateQueueStatus as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (blogQueue.requireRowLang as ReturnType<typeof vi.fn>).mockImplementation(
      (qi: { language: string }) => qi.language,
    );
  });

  it("BLOCKS a weak 800-word draft: 500 + row marked failed, never inserted", async () => {
    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toContain("article too short");
    expect(body.error).toContain("words < 1000-word floor");
    expect(blogQueue.markQueueItemFailed).toHaveBeenCalledTimes(1);
    const [failedId, failedMsg] = (blogQueue.markQueueItemFailed as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, string];
    expect(failedId).toBe(QUEUE_ID);
    expect(failedMsg).toContain("p5: article too short");
    expect(failedMsg).toContain("rerun p2-content");
    // the diagnostic carries the measurement — ops can see WHY it failed
    expect(failedMsg).toMatch(/\d+ words < 1000/);
  });

  it("PASSES an adequate 1500-word draft on to the next guard (no false block)", async () => {
    (blogQueue.fetchQueueItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: makeShortRow(1500),
      error: null,
    });
    // quota already met → the route must reach the QUOTA guard and skip
    // there — proving the draft cleared the length floor unharmed.
    (blogQueue.countAutomatedPublishedToday as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await p5Publish(makeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { skipped?: boolean; reason?: string };
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("daily-quota-met");
    expect(blogQueue.markQueueItemFailed).not.toHaveBeenCalled();
  });
});
