/**
 * blog-review-workflow.test.ts — AUDIT_REPORT §9-المرحلة 2, item 1
 * (2026-09-29 · migration 0097): the OWNER REVIEW WORKFLOW's honesty
 * laws, pinned end-to-end:
 *
 *   1. seo.ts getArticleSchema — reviewedBy/lastReviewed are emitted
 *      ONLY from a REAL review (null review → both OMITTED; undefined =
 *      the legacy owner-curated surfaces keep the /about policy).
 *   2. The article template + server pages source pins — the honest
 *      «AI-generated · medical review pending» byline, the honest
 *      «Updated» label, the lastReviewedAt prop threading.
 *   3. P5 publishes review_status='pending' + last_reviewed_at=null
 *      (source pin) — the review NEVER happens automatically.
 *   4. The admin review route: admin-gated, flips the row, honest 404.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth-server", () => ({
  authRequired: true,
  requireAdmin: vi.fn(async () => null), // admin session OK by default
}));
vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: vi.fn() },
}));

import { getArticleSchema } from "@/lib/seo";
import { POST as reviewRoute } from "@/app/api/admin/blog/review/route";
import { requireAdmin } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf-8");

const BASE = {
  title: "Test article",
  description: "desc",
  slug: "test-article",
  datePublished: "2026-09-01",
  dateModified: "2026-09-10",
};

describe("getArticleSchema — the honest review law (0097)", () => {
  it("OMITS reviewedBy + lastReviewed when the review is explicitly null (pending)", () => {
    const schema = getArticleSchema({ ...BASE, lastReviewed: null });
    expect(schema).not.toHaveProperty("reviewedBy");
    expect(schema).not.toHaveProperty("lastReviewed");
    expect(schema).toHaveProperty("author");
    expect(schema.dateModified).toBe("2026-09-10");
  });

  it("emits BOTH from a REAL review timestamp", () => {
    const schema = getArticleSchema({ ...BASE, lastReviewed: "2026-09-20" });
    expect(schema.lastReviewed).toBe("2026-09-20");
    expect(schema.reviewedBy).toHaveProperty("@type", "Person");
  });

  it("keeps the legacy behavior when lastReviewed is not passed (owner-curated surfaces)", () => {
    const schema = getArticleSchema({ ...BASE });
    expect(schema.lastReviewed).toBe("2026-09-10"); // = dateModified (legacy law)
    expect(schema.reviewedBy).toHaveProperty("@type", "Person");
  });
});

describe("template + page source pins (the honest byline)", () => {
  const PAGE = "src/components/blog/BlogArticlePage.tsx";
  const EN_PAGE = "src/app/(en)/blog/[slug]/page.tsx";
  const AR_PAGE = "src/app/(ar)/ar/blog/[slug]/page.tsx";

  it("carries the honest pending-review byline wording (EN + AR)", () => {
    const src = read(PAGE);
    expect(src).toContain("AI-generated · medical review pending");
    expect(src).toContain("مولّد بالذكاء الاصطناعي · بانتظار المراجعة الطبية");
    expect(src).toContain("lastReviewedAt");
  });

  it("labels updated_at honestly as Updated (not Last reviewed) when no review exists", () => {
    const src = read(PAGE);
    // the "Last reviewed" row renders ONLY from the real lastReviewedAt:
    expect(src).toContain("{lastReviewedAt && (");
    // the fallback row for un-reviewed posts says Updated/آخر تحديث:
    expect(src).toContain("!lastReviewedAt && updatedAt");
    expect(src).toContain('isAr ? "آخر تحديث" : "Updated"');
  });

  it("both mirrors thread the REAL review state into the schema + page", () => {
    for (const p of [EN_PAGE, AR_PAGE]) {
      const src = read(p);
      expect(src).toContain("lastReviewed: og.lastReviewedAt");
      expect(src).toContain("lastReviewedAt={og.lastReviewedAt");
    }
  });

  it("the honest review law is documented once in seo.ts", () => {
    const src = read("src/lib/seo.ts");
    expect(src).toContain("HONEST REVIEW LAW");
    expect(src).toContain("...(realReview ? { lastReviewed: realReview } : {})");
    expect(src).toContain("...(realReview ? { reviewedBy: reviewerPerson } : {})");
  });
});

describe("P5 source pins — the review NEVER happens automatically", () => {
  it("publishes the honest pending state (review_status + last_reviewed_at)", () => {
    const src = read("src/app/api/cron/blog/p5-publish/route.ts");
    expect(src).toContain('review_status: "pending"');
    expect(src).toContain("last_reviewed_at: null");
    expect(src).toContain("NEVER automatic");
  });

  it("runs the link-verify gate before the quality battery (§9-2.2)", () => {
    const src = read("src/app/api/cron/blog/p5-publish/route.ts");
    const verifyPos = src.indexOf("const linkVerify = await verifyBodyLinks(");
    const batteryPos = src.indexOf("runP5QualityGates({");
    expect(verifyPos).toBeGreaterThan(-1);
    expect(batteryPos).toBeGreaterThan(verifyPos);
    // the battery + latin gate + stored content all read the VERIFIED md —
    // BLOG-DIVERSITY-ENGINE (2026-11-13): after link verification, the
    // deterministic title-prefix anchor completion may refine anchors
    // (gateMd), and the battery + latin gate + stored content all read
    // THAT same body (no content drift between gate and publish):
    expect(src).toContain("bodyMd: gateMd");
    expect(src).toContain("embedBodyImages(gateMd, images)");
    expect(src).toContain("completeTitlePrefixAnchors(verifiedMd, recentPosts)");
  });
});

describe("POST /api/admin/blog/review — the owner-review action", () => {
  const req = (body: unknown) =>
    new NextRequest("http://localhost/api/admin/blog/review", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  /** Build the supabase.from("blog_posts").update().eq().select().single()
   * chain with a fixed resolved value ({data, error}). */
  const chainMock = (resolved: { data: unknown; error: unknown }) => {
    const update = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => resolved),
        })),
      })),
    }));
    (supabaseAdmin!.from as ReturnType<typeof vi.fn>).mockReturnValue({ update });
    return update;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flips the row to reviewed + stamps the REAL review date", async () => {
    const update = chainMock({
      data: {
        id: "11111111-2222-4333-8444-555555555555",
        title: "T",
        review_status: "reviewed",
        last_reviewed_at: "2026-09-29T12:00:00.000Z",
      },
      error: null,
    });

    const res = await reviewRoute(req({ post_id: "11111111-2222-4333-8444-555555555555" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.post.review_status).toBe("reviewed");
    // the payload carries EXACTLY the two 0097 columns (narrow action):
    const payload = (update as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0];
    expect(payload).toHaveProperty("review_status", "reviewed");
    expect(payload).toHaveProperty("last_reviewed_at");
    expect(Object.keys(payload as Record<string, unknown>)).toHaveLength(2);
  });

  it("rejects a non-admin session (admin-gated surface)", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 }),
    );
    const res = await reviewRoute(req({ post_id: "11111111-2222-4333-8444-555555555555" }));
    expect(res.status).toBe(403);
  });

  it("rejects a missing/empty post_id honestly", async () => {
    const res = await reviewRoute(req({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("post_id");
  });

  it("answers an honest 404 when the row does not exist", async () => {
    chainMock({ data: null, error: null });
    const res = await reviewRoute(
      req({ post_id: "11111111-2222-4333-8444-555555555555" }),
    );
    expect(res.status).toBe(404);
  });

  it("surfaces a DB error honestly (500 + message)", async () => {
    chainMock({ data: null, error: { message: "boom" } });
    const res = await reviewRoute(req({ post_id: "11111111-2222-4333-8444-555555555555" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("boom");
  });
});
