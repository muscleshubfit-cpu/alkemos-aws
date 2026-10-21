/**
 * coach-landing-revalidate.test.ts — CACHE-POLICY-AUDIT (2026-10-22)
 * canaries for the coach-landing half of the owner order «تدقيق شامل
 * لسياسات الكاش… وإبطال صحيح وفوري بعد تعديل المحتوى».
 *
 * THE MEASURED GAP: the public coach landing mirrors
 * (/coaches/[slug] + /ar/coaches/[slug]) ride ISR revalidate=86400 with
 * ZERO invalidation hooks, while the Cloudflare
 * «alkemos-public-html-cache» rule holds the HTML for edge_ttl=43200
 * (measured live 2026-10-22). A coach save (→ review pending per 0046)
 * or the admin's approve/reject flip kept serving the OLD public render
 * for up to ~12-36h — including pages that were re-hidden (a review-law
 * leak, not just staleness).
 *
 * These canaries pin the fix end-to-end:
 *   1. the helper invalidates both language mirrors + purges the CF
 *      edge (env-gated, fail-soft, never throws, bad slug skips);
 *   2. the coach's own save (PUT /api/coach/landing) refreshes after
 *      the write and echoes cache_refresh (source pin);
 *   3. the admin review flip (PATCH /api/admin/coach-pages) refreshes
 *      and echoes cache_refresh (source pin);
 *   4. POST /api/admin/coach-pages/revalidate is admin-gated, zod-gated
 *      and echoes the outcome (the manual lever).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({
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
  revalidateCoachLanding,
  coachLandingPublicPaths,
} from "@/lib/coach-landing-revalidate";
import { POST as revalidateRoute } from "@/app/api/admin/coach-pages/revalidate/route";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf-8");

describe("revalidateCoachLanding — the mirror invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("invalidates BOTH language mirrors for the slug", async () => {
    expect(coachLandingPublicPaths("john-steel")).toEqual({
      en: "/coaches/john-steel",
      ar: "/ar/coaches/john-steel",
    });
    await revalidateCoachLanding("john-steel");
    expect(revalidatePath).toHaveBeenCalledWith("/coaches/john-steel");
    expect(revalidatePath).toHaveBeenCalledWith("/ar/coaches/john-steel");
  });

  it("skips the edge purge honestly when the env pair is absent (origin still invalidated)", async () => {
    const out = await revalidateCoachLanding("john-steel");
    expect(out.ok).toBe(true);
    expect(out.edge.attempted).toBe(false);
    expect(out.edge.error).toContain("CLOUDFLARE_ZONE_ID");
  });

  it("purges both mirror URLs when configured", async () => {
    process.env.CLOUDFLARE_ZONE_ID = "zone123";
    process.env.CLOUDFLARE_PURGE_TOKEN = "tok123";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const out = await revalidateCoachLanding("john-steel");

    expect(out.edge.attempted).toBe(true);
    expect(out.edge.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/zones/zone123/purge_cache",
    );
    const body = JSON.parse(String(init.body)) as { files: string[] };
    expect(body.files).toEqual([
      "https://alkemos.com/coaches/john-steel",
      "https://alkemos.com/ar/coaches/john-steel",
    ]);
  });

  it("is fail-soft when the edge purge rejects (never throws)", async () => {
    process.env.CLOUDFLARE_ZONE_ID = "zone123";
    process.env.CLOUDFLARE_PURGE_TOKEN = "tok123";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("edge down");
      }),
    );
    const out = await revalidateCoachLanding("john-steel");
    expect(out.ok).toBe(true);
    expect(out.edge.ok).toBe(false);
    expect(out.edge.error).toContain("edge down");
  });

  it("is fail-soft when the origin revalidation itself throws", async () => {
    (revalidatePath as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error("outside a request scope");
    });
    const out = await revalidateCoachLanding("john-steel");
    expect(out.ok).toBe(false);
    expect(out.error).toContain("outside a request scope");
  });

  it("returns an honest skip on a bad slug (nothing invalidated)", async () => {
    for (const bad of ["", "  ", "Bad Slug!", "x", "../etc"]) {
      const out = await revalidateCoachLanding(bad);
      expect(out.ok).toBe(false);
      expect(out.invalidated.paths).toHaveLength(0);
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("normalizes case and whitespace before the slug check", async () => {
    const out = await revalidateCoachLanding("  John-Steel  ");
    expect(out.ok).toBe(true);
    expect(out.slug).toBe("john-steel");
  });
});

describe("source pins — the write-path wiring (drift guard)", () => {
  it("the coach's own save (PUT /api/coach/landing) refreshes after the write", () => {
    const src = read("src/app/api/coach/landing/route.ts");
    expect(src).toContain("revalidateCoachLanding");
    expect(src).toContain("cache_refresh: cacheRefresh");
  });

  it("the admin review flip (PATCH /api/admin/coach-pages) refreshes after the flip", () => {
    const src = read("src/app/api/admin/coach-pages/route.ts");
    expect(src).toContain("revalidateCoachLanding");
    expect(src).toContain("cache_refresh: cacheRefresh");
  });
});

describe("POST /api/admin/coach-pages/revalidate — the manual lever", () => {
  const req = (body: unknown) =>
    new NextRequest("http://localhost/api/admin/coach-pages/revalidate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CLOUDFLARE_PURGE_TOKEN;
  });

  it("invalidates both mirrors and echoes the outcome", async () => {
    const res = await revalidateRoute(req({ slug: "john-steel" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.slug).toBe("john-steel");
    expect(json.refreshed.ok).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/coaches/john-steel");
    expect(revalidatePath).toHaveBeenCalledWith("/ar/coaches/john-steel");
  });

  it("rejects a non-admin session (admin-gated surface)", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 }),
    );
    const res = await revalidateRoute(req({ slug: "john-steel" }));
    expect(res.status).toBe(403);
  });

  it("rejects a body without a slug (zod gate)", async () => {
    const res = await revalidateRoute(req({}));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed slug (zod gate)", async () => {
    const res = await revalidateRoute(req({ slug: "Bad Slug!" }));
    expect(res.status).toBe(400);
  });

  it("answers an honest 400 on invalid JSON body", async () => {
    const res = await revalidateRoute(
      new NextRequest("http://localhost/api/admin/coach-pages/revalidate", {
        method: "POST",
        body: "definitely-not-json{",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });
});
