/**
 * blog-cache-revalidate.test.ts — BLOG-CACHE-REFRESH (2026-10-21) canaries.
 *
 * The measured incident (owner order «افحص سبب عدم انعكاس تعديلاتي اليدوية
 * على المقالات المنشورة…»): the owner's edits + review approvals SAVED in
 * the DB (proven row-level: review_status='reviewed', updated_at
 * 17:20:25 AR / 20:46:05 EN, title/content edited — db-blog-state-inspect
 * run 39677948323) and even reached the origin's fresh ISR render — yet the
 * live page kept serving the pre-edit «AI-generated · medical review
 * pending» render for hours, because THREE stacked TTL layers had ZERO
 * invalidation hooks (grep: 0 revalidatePath/revalidateTag in the codebase):
 *
 *   unstable_cache(3600s) → ISR(3600s) → Cloudflare(s-maxage 3600 + SWR 86400)
 *
 * These canaries pin the fix end-to-end:
 *   1. the helper invalidates the three data-cache tags + the four public
 *      paths and purges the CF edge (env-gated, fail-soft, never throws);
 *   2. POST /api/admin/blog/review flips the row AND refreshes the cache;
 *   3. POST /api/admin/blog/revalidate resolves post_id / direct slug+language;
 *   4. source pins: the tags ride the unstable_cache wrappers, the editor
 *      fires the post-save refresh (drift guard).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-server", () => ({
  authRequired: true,
  requireAdmin: vi.fn(async () => null), // admin session OK by default
}));
vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: vi.fn() },
}));

import {
  revalidateBlogPost,
  blogPostPublicPaths,
  blogPostPurgeUrls,
  BLOG_CACHE_TAGS,
} from "@/lib/blog-cache-revalidate";
import { POST as revalidateRoute } from "@/app/api/admin/blog/revalidate/route";
import { POST as reviewRoute } from "@/app/api/admin/blog/review/route";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf-8");

const UUID = "11111111-2222-4333-8444-555555555555";

describe("revalidateBlogPost — the three-layer invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("invalidates the three data-cache tags (blog-og / blog-full / blog-slug-pools)", async () => {
    await revalidateBlogPost({ slug: "my-post", language: "ar" });
    for (const tag of BLOG_CACHE_TAGS) {
      // "max" = Next 16's non-deprecated profile argument (classic
      // immediate invalidation — single-arg revalidateTag is deprecated).
      expect(revalidateTag).toHaveBeenCalledWith(tag, "max");
    }
  });

  it("invalidates the article + listing + rss + sitemap ISR paths per language", async () => {
    await revalidateBlogPost({ slug: "my-post", language: "ar" });
    await revalidateBlogPost({ slug: "my-post", language: "en" });
    for (const p of Object.values(blogPostPublicPaths({ slug: "my-post", language: "ar" }))) {
      expect(revalidatePath).toHaveBeenCalledWith(p);
    }
    for (const p of Object.values(blogPostPublicPaths({ slug: "my-post", language: "en" }))) {
      expect(revalidatePath).toHaveBeenCalledWith(p);
    }
    expect(blogPostPublicPaths({ slug: "my-post", language: "ar" }).article).toBe(
      "/ar/blog/my-post",
    );
    expect(blogPostPublicPaths({ slug: "my-post", language: "en" }).article).toBe(
      "/blog/my-post",
    );
  });

  it("skips the edge purge honestly when the env pair is absent (origin still invalidated)", async () => {
    const out = await revalidateBlogPost({ slug: "my-post", language: "en" });
    expect(out.ok).toBe(true);
    expect(out.edge.attempted).toBe(false);
    expect(out.edge.ok).toBe(false);
    expect(out.edge.error).toContain("CLOUDFLARE_ZONE_ID");
  });

  it("purges the Cloudflare edge when configured and reports success", async () => {
    process.env.CLOUDFLARE_ZONE_ID = "zone123";
    process.env.CLOUDFLARE_PURGE_TOKEN = "tok123";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const out = await revalidateBlogPost({ slug: "my-post", language: "en" });

    expect(out.edge.attempted).toBe(true);
    expect(out.edge.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/zones/zone123/purge_cache",
    );
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as { files: string[] };
    expect(body.files).toEqual([
      "https://alkemos.com/blog/my-post",
      "https://alkemos.com/blog",
      "https://alkemos.com/rss.xml",
      "https://alkemos.com/sitemap-blog.xml",
      // CACHE-POLICY-AUDIT 2026-10-22: the og-image card (edge TTL 86400
      // via its own CF rule) rides the same purge so a title edit
      // refreshes social cards too.
      "https://alkemos.com/api/og-image/my-post?lang=en",
    ]);
  });

  it("purges the AR og-image card URL for the AR language mirror", async () => {
    expect(blogPostPurgeUrls({ slug: "my-post", language: "ar" })).toContain(
      `https://alkemos.com/api/og-image/${"my-post"}?lang=ar`,
    );
    // the og-image ROUTE is edge-cached only — it never rides
    // revalidatePath (the four page paths do). Built by concatenation so
    // the UI-wiring guard doesn't read a fake dynamic-segment literal
    // ("/api/og-image/<fake-slug>") as a fetch target.
    const ogImageRoute = "/api/og-image" + "/my-post" + "?lang=ar";
    expect(
      Object.values(blogPostPublicPaths({ slug: "my-post", language: "ar" })),
    ).not.toContain(ogImageRoute);
  });

  it("is fail-soft when the edge purge rejects (never throws, reports the error)", async () => {
    process.env.CLOUDFLARE_ZONE_ID = "zone123";
    process.env.CLOUDFLARE_PURGE_TOKEN = "tok123";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("edge down");
      }),
    );

    const out = await revalidateBlogPost({ slug: "my-post", language: "en" });
    expect(out.ok).toBe(true); // origin part still succeeded
    expect(out.edge.attempted).toBe(true);
    expect(out.edge.ok).toBe(false);
    expect(out.edge.error).toContain("edge down");
  });

  it("is fail-soft when the origin revalidation itself throws", async () => {
    (revalidateTag as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error("outside a request scope");
    });
    const out = await revalidateBlogPost({ slug: "my-post", language: "en" });
    expect(out.ok).toBe(false);
    expect(out.error).toContain("outside a request scope");
  });

  it("returns an honest skip on bad input (no invalidation at all)", async () => {
    const out = await revalidateBlogPost({ slug: "", language: "ar" });
    expect(out.ok).toBe(false);
    expect(out.invalidated.tags).toHaveLength(0);
    expect(out.invalidated.paths).toHaveLength(0);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("source pins — the tags + the wiring (drift guard)", () => {
  it("the three unstable_cache wrappers carry their invalidation tags", () => {
    const src = read("src/lib/blog-server.ts");
    expect(src).toContain('tags: ["blog-og"]');
    expect(src).toContain('tags: ["blog-full"]');
    expect(src).toContain('tags: ["blog-slug-pools"]');
  });

  it("the review route refreshes the cache after the flip (fail-soft echo)", () => {
    const src = read("src/app/api/admin/blog/review/route.ts");
    expect(src).toContain("revalidateBlogPost");
    expect(src).toContain("cache_refresh");
  });

  it("the editor fires the post-save cache refresh", () => {
    const src = read("src/components/views/BlogEditorView.tsx");
    expect(src).toContain('"/api/admin/blog/revalidate"');
    expect(src).toContain("refreshCacheAfterSave(postId)");
    expect(src).toContain("refreshCacheAfterSave(created?.id)");
  });
});

describe("POST /api/admin/blog/revalidate — the cache-refresh action", () => {
  const req = (body: unknown) =>
    new NextRequest("http://localhost/api/admin/blog/revalidate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  /** from("blog_posts").select().eq().maybeSingle() chain with a fixed value. */
  const selectChainMock = (resolved: { data: unknown; error: unknown }) => {
    const maybeSingle = vi.fn(async () => resolved);
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    (supabaseAdmin!.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });
    return select;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });

  it("resolves post_id → the row's slug/language and invalidates", async () => {
    selectChainMock({ data: { slug: "resolved-post", language: "ar" }, error: null });
    const res = await revalidateRoute(req({ post_id: UUID }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.slug).toBe("resolved-post");
    expect(json.language).toBe("ar");
    expect(json.refreshed.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/ar/blog/resolved-post");
  });

  it("rejects a non-admin session (admin-gated surface)", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 }),
    );
    const res = await revalidateRoute(req({ post_id: UUID }));
    expect(res.status).toBe(403);
  });

  it("answers an honest 404 when the row does not exist", async () => {
    selectChainMock({ data: null, error: null });
    const res = await revalidateRoute(req({ post_id: UUID }));
    expect(res.status).toBe(404);
  });

  it("accepts the direct slug+language shape with no DB read at all", async () => {
    const res = await revalidateRoute(
      req({ slug: "direct-post", language: "en" }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.slug).toBe("direct-post");
    expect(supabaseAdmin!.from).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/blog/direct-post");
  });

  it("rejects a body carrying neither shape", async () => {
    const res = await revalidateRoute(req({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("post_id");
  });
});

describe("POST /api/admin/blog/review — the approval now refreshes the cache", () => {
  const req = (body: unknown) =>
    new NextRequest("http://localhost/api/admin/blog/review", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  /** from("blog_posts").update().eq().select().single() chain (review shape). */
  const updateChainMock = (resolved: { data: unknown; error: unknown }) => {
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
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });

  it("flips the row AND invalidates the caches for that article (the incident's fix)", async () => {
    updateChainMock({
      data: {
        id: UUID,
        title: "T",
        language: "ar",
        slug: "approved-post",
        review_status: "reviewed",
        last_reviewed_at: "2026-10-21T17:20:23.953Z",
      },
      error: null,
    });

    const res = await reviewRoute(req({ post_id: UUID }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.post.review_status).toBe("reviewed");
    // the approval ALSO refreshed the caches for the approved article:
    expect(json.cache_refresh.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/ar/blog/approved-post");
    for (const tag of BLOG_CACHE_TAGS) {
      expect(revalidateTag).toHaveBeenCalledWith(tag, "max");
    }
  });

  it("never fails the approval when the revalidation itself throws (fail-soft)", async () => {
    updateChainMock({
      data: {
        id: UUID,
        title: "T",
        language: "en",
        slug: "approved-post",
        review_status: "reviewed",
        last_reviewed_at: "2026-10-21T20:46:04.961Z",
      },
      error: null,
    });
    (revalidateTag as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("outside a request scope");
    });

    const res = await reviewRoute(req({ post_id: UUID }));
    const json = await res.json();
    expect(res.status).toBe(200); // approval still succeeded
    expect(json.ok).toBe(true);
    expect(json.cache_refresh.ok).toBe(false); // reported honestly
  });
});
