/**
 * EDGE-PURGE — the shared Cloudflare edge purge (CACHE-POLICY-AUDIT
 * 2026-10-22, owner order «تدقيق شامل لسياسات الكاش»).
 *
 * THE MEASURED LAYER (read live from the zone via the CF API on
 * 2026-10-22, zone `alkemos.com`): the «alkemos-public-html-cache»
 * cache rule serves public HTML from the edge with edge_ttl **43200s
 * (12h)** — NOT the 3600s the pre-audit code comments assumed (the
 * rule's own description records the raises: 3600 → 14400 (T-3) →
 * 43200 (T-3b VERCEL-USAGE-4, the Fluid CPU overage guard). The og-image
 * rule caches 86400s. With TTLs that long, TTL-based "self-healing"
 * is measured in HALF DAYS — which is why every owner write path now
 * purges the affected URLs on demand instead.
 *
 * Extracted verbatim from blog-cache-revalidate.ts (BLOG-CACHE-REFRESH
 * 2026-10-21) so blog + site-content + coach-landing share ONE purge
 * implementation — no fork (the repo's single-source law).
 *
 * Env-gated on the documented shared/.env production pair
 * (CLOUDFLARE_ZONE_ID + CLOUDFLARE_PURGE_TOKEN); absent vars degrade to
 * an honest reported skip — the edge then self-heals within its TTL.
 * NEVER throws: a cache purge must never fail the DB write that
 * already succeeded behind it.
 */

export type EdgePurgeOutcome = {
  attempted: boolean;
  ok: boolean;
  urls: string[];
  error?: string;
};

/** Purge specific FULL URLs (with query strings when they carry them)
 * from the Cloudflare edge. Fail-soft by contract. */
export async function purgeCloudflareEdgeUrls(
  urls: string[],
): Promise<EdgePurgeOutcome> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_PURGE_TOKEN;
  if (!zoneId || !token) {
    return {
      attempted: false,
      ok: false,
      urls,
      error:
        "CLOUDFLARE_ZONE_ID/CLOUDFLARE_PURGE_TOKEN not configured — the edge keeps serving the old copy until its edge TTL expires (public HTML ≤12h / og-image ≤24h); see docs/CACHE-POLICY-AUDIT-2026-10-22.md",
    };
  }
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) {
      return {
        attempted: true,
        ok: false,
        urls,
        error: `Cloudflare purge HTTP ${res.status}`,
      };
    }
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean }
      | null;
    if (!json?.success) {
      return {
        attempted: true,
        ok: false,
        urls,
        error: "Cloudflare purge endpoint answered without success=true",
      };
    }
    return { attempted: true, ok: true, urls };
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      urls,
      error: e instanceof Error ? e.message : "edge purge threw (non-Error)",
    };
  }
}
