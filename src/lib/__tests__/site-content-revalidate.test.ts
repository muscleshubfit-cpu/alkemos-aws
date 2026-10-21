/**
 * site-content-revalidate.test.ts — CACHE-POLICY-AUDIT (2026-10-22)
 * canaries for the site-content half of the owner order «تدقيق شامل
 * لسياسات الكاش… وإبطال صحيح وفوري بعد تعديل المحتوى».
 *
 * THE MEASURED GAP: the /admin/site-content editor writes override rows
 * DIRECTLY from the browser (no server write route to hook), while the
 * consuming pages (home/about/faq/terms/privacy × EN/AR) ride
 * unstable_cache(300) → ISR(300) → Cloudflare edge(edge_ttl **43200**,
 * measured live 2026-10-22 — the code comments' 3600 was stale twice
 * over). An admin edit was therefore live on the origin within ~5 min
 * but kept serving the PRE-EDIT edge copy for up to 12h — the same
 * incident class BLOG-CACHE-REFRESH (2026-10-21) closed for blog_posts.
 *
 * These canaries pin the fix end-to-end:
 *   1. the wrapper carries the invalidation tag (source pin);
 *   2. the helper invalidates the tag + all ten consuming pages and
 *      purges the CF edge (env-gated, fail-soft, never throws);
 *   3. POST /api/admin/site-content/revalidate is admin-gated and
 *      echoes the outcome;
 *   4. the admin editor fires the post-save refresh (drift guard).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  // site-content/server.ts imports unstable_cache — a passthrough keeps
  // the module importable without pulling Next's real runtime in.
  unstable_cache: <T,>(fn: T) => fn,
}));

vi.mock("@/lib/auth-server", () => ({
  authRequired: true,
  requireAdmin: vi.fn(async () => null), // admin session OK by default
}));

import {
  revalidateSiteContent,
  SITE_CONTENT_PAGE_PATHS,
} from "@/lib/site-content/revalidate";
import { POST as revalidateRoute } from "@/app/api/admin/site-content/revalidate/route";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";
import { SITE_CONTENT_CACHE_TAG } from "@/lib/site-content/server";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf-8");

describe("revalidateSiteContent — the three-layer invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("invalidates the site-content data-cache tag with the max profile", async () => {
    await revalidateSiteContent();
    // "max" = Next 16's non-deprecated profile argument (classic
    // immediate invalidation — single-arg revalidateTag is deprecated).
    expect(revalidateTag).toHaveBeenCalledWith(SITE_CONTENT_CACHE_TAG, "max");
  });

  it("invalidates every consuming page (home/about/faq/terms/privacy × EN/AR)", async () => {
    expect(SITE_CONTENT_PAGE_PATHS).toEqual([
      "/",
      "/ar",
      "/about",
      "/ar/about",
      "/faq",
      "/ar/faq",
      "/terms",
      "/ar/terms",
      "/privacy",
      "/ar/privacy",
    ]);
    await revalidateSiteContent();
    for (const p of SITE_CONTENT_PAGE_PATHS) {
      expect(revalidatePath).toHaveBeenCalledWith(p);
    }
  });

  it("skips the edge purge honestly when the env pair is absent (origin still invalidated)", async () => {
    const out = await revalidateSiteContent();
    expect(out.ok).toBe(true);
    expect(out.edge.attempted).toBe(false);
    expect(out.edge.ok).toBe(false);
    expect(out.edge.error).toContain("CLOUDFLARE_ZONE_ID");
  });

  it("purges the Cloudflare edge for all ten URLs when configured", async () => {
    process.env.CLOUDFLARE_ZONE_ID = "zone123";
    process.env.CLOUDFLARE_PURGE_TOKEN = "tok123";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const out = await revalidateSiteContent();

    expect(out.edge.attempted).toBe(true);
    expect(out.edge.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/zones/zone123/purge_cache",
    );
    const body = JSON.parse(String(init.body)) as { files: string[] };
    expect(body.files).toEqual(
      SITE_CONTENT_PAGE_PATHS.map((p) => `https://alkemos.com${p}`),
    );
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

    const out = await revalidateSiteContent();
    expect(out.ok).toBe(true); // origin part still succeeded
    expect(out.edge.attempted).toBe(true);
    expect(out.edge.ok).toBe(false);
    expect(out.edge.error).toContain("edge down");
  });

  it("is fail-soft when the origin revalidation itself throws", async () => {
    (revalidateTag as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error("outside a request scope");
    });
    const out = await revalidateSiteContent();
    expect(out.ok).toBe(false);
    expect(out.error).toContain("outside a request scope");
  });
});

describe("source pins — the tag + the wiring (drift guard)", () => {
  it("the unstable_cache wrapper carries the site-content tag", () => {
    const src = read("src/lib/site-content/server.ts");
    expect(src).toContain('tags: [SITE_CONTENT_CACHE_TAG]');
    expect(src).toContain('export const SITE_CONTENT_CACHE_TAG = "site-content"');
  });

  it("the admin editor fires the post-save cache refresh (save + reset)", () => {
    const src = read("src/components/views/AdminSiteContentView.tsx");
    expect(src).toContain('"/api/admin/site-content/revalidate"');
    expect(src).toContain("if (failures === 0) refreshCacheAfterSave();");
    // the reset path refreshes too — restoring defaults is also an edit
    expect(src).toMatch(/adminResetSiteContent\(keys\)[\s\S]{0,200}refreshCacheAfterSave\(\)/);
  });
});

describe("POST /api/admin/site-content/revalidate — the cache-refresh action", () => {
  const req = () =>
    new NextRequest("http://localhost/api/admin/site-content/revalidate", {
      method: "POST",
    });

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });

  it("invalidates and echoes the outcome for an admin session", async () => {
    const res = await revalidateRoute(req());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.refreshed.ok).toBe(true);
    expect(json.refreshed.invalidated.tag).toBe("site-content");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/ar/privacy");
  });

  it("rejects a non-admin session (admin-gated surface)", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 }),
    );
    const res = await revalidateRoute(req());
    expect(res.status).toBe(403);
  });

  it("tolerates a stray body (drained defensively, never a 500)", async () => {
    const res = await revalidateRoute(
      new NextRequest("http://localhost/api/admin/site-content/revalidate", {
        method: "POST",
        body: JSON.stringify({ anything: true }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
