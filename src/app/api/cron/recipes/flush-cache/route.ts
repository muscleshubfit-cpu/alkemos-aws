import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { revalidateRecipeCaches } from "@/lib/recipes-server";
import { purgeCloudflareEdgeUrls } from "@/lib/edge-purge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * RECIPES PIPELINE · live cache flush (plan §6.2 R6's ISR arm — the
 * BLOG-CONTENT-CACHE-REFRESH 2026-10-21 precedent applied to recipes).
 *
 * WHY THIS EXISTS (the first live publish, 2026-11-10): R6 runs inside
 * the GitHub Actions runner process — its revalidateTag/revalidatePath
 * calls mutate THAT process's caches, not the production Next.js
 * server's, so the listings (explorer / sitemap / RSS / home sample)
 * kept serving the pre-publish empty render until the hourly TTL
 * healed them. The blog solved the identical 2026-10-21 incident with
 * a LIVE server-side endpoint; this is the recipes twin: the runner
 * calls THIS route on the origin (Bearer CRON_SECRET — same secret,
 * staged on the server), and the invalidation runs INSIDE the live
 * server where the ISR/data caches actually live.
 *
 * Layers flushed (the blog's three-layer law):
 *   1. Data cache — revalidateRecipeCaches() → the recipes-* tags
 *      (unstable_cache: recipes-list / recipes-detail / recipes-slugs).
 *   2. ISR pages/routes — revalidatePath for the listing surfaces and,
 *      when a recipeId is given, the pair's two detail pages + og-image.
 *   3. Cloudflare edge — purgeCloudflareEdgeUrls for the same absolute
 *      URLs (env-gated; absent vars degrade to an honest reported skip —
 *      the edge then self-heals within its TTL).
 *
 * GET /api/cron/recipes/flush-cache[?recipeId=<uuid>]
 *   recipeId (optional): target the pair's own surfaces in addition to
 *   the listing surfaces. Absent → listings only.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipeId = new URL(request.url).searchParams.get("recipeId")?.trim() || null;
  const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://alkemos.com").replace(/\/$/, "");

  // ── The pair's own surfaces (when targeted) ─────────────────────────
  let pairSlug: string | null = null;
  if (recipeId && isSupabaseAdminConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("recipes")
      .select("pair_slug")
      .eq("id", recipeId)
      .maybeSingle();
    pairSlug = (data as { pair_slug?: string } | null)?.pair_slug ?? null;
  }

  // ── 1) Data cache tags (runs inside the live request scope here) ───
  await revalidateRecipeCaches();

  // ── 2) ISR surfaces ─────────────────────────────────────────────────
  const listingPaths = [
    "/recipes",
    "/ar/recipes",
    "/sitemap-recipes.xml",
    "/recipes/rss.xml",
    "/ar/recipes/rss.xml",
    "/",
    "/ar",
  ];
  const pairPaths = pairSlug
    ? [
        `/recipes/${pairSlug}`,
        `/ar/recipes/${pairSlug}`,
        `/api/og-image/${pairSlug}?type=recipe&lang=en`,
        `/api/og-image/${pairSlug}?type=recipe&lang=ar`,
      ]
    : [];
  const flushedPaths: string[] = [];
  for (const p of [...listingPaths, ...pairPaths]) {
    try {
      revalidatePath(p);
      flushedPaths.push(p);
    } catch {
      /* a path that is not currently cached is not an error */
    }
  }

  // ── 3) Cloudflare edge (env-gated, honest skip) ────────────────────
  const edgeUrls = [...listingPaths, ...pairPaths].map((p) => `${siteUrl}${p}`);
  const edge = await purgeCloudflareEdgeUrls(edgeUrls);

  return NextResponse.json({
    ok: true,
    step: "flush-cache",
    recipeId,
    pairSlug,
    tagsFlushed: ["recipes-list", "recipes-detail", "recipes-slugs"],
    pathsFlushed: flushedPaths.length,
    edgePurge: edge.attempted
      ? { attempted: true, ok: edge.ok, urls: edge.urls.length, error: edge.error ?? null }
      : { attempted: false, reason: "not configured — edge self-heals within its TTL" },
  });
}
