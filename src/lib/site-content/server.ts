/**
 * SITE-CONTENT/SERVER — the server-side override fetch (SITE-CONTENT-281).
 *
 * PATTERN (the blog precedent, exactly): a fresh anon-key client per
 * call (no cookies, no session), wrapped in unstable_cache with a
 * 300 s revalidate — the SAME freshness window the blog article pages
 * use (ISR revalidate = 300). The public routes that consume this
 * (homepage EN/AR + about/privacy/terms/faq EN/AR) export
 * `revalidate = 300` so the page re-render and the data cache expire
 * together: an admin save is live within ~5 minutes WITHOUT any
 * deploy — and never costs a git commit or a CI run.
 *
 * NEVER import this from a client component (server data path only);
 * never let a public page import the Supabase browser client to read
 * overrides (Phase-182/224 bundle law).
 */

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { SiteCopyMap } from "./core";

type SiteContentRow = {
  key: string;
  value_en: unknown;
  value_ar: unknown;
};

const SITE_CONTENT_CACHE_KEY = ["site-content-overrides"];

/** CACHE-POLICY-AUDIT 2026-10-22: the tag that opens on-demand
 * invalidation for this cache entry — revalidateSiteContent()
 * (src/lib/site-content/revalidate.ts) fires it after every admin
 * save/reset, so an edit is live on the next render instead of after
 * the 300s TTL (and the CF edge copy is purged in the same action). */
export const SITE_CONTENT_CACHE_TAG = "site-content";

const fetchSiteContentUncached = async (): Promise<SiteCopyMap> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return {};

  try {
    // Anon key + RLS public-read policy (migration 0094) — no session,
    // no service role. The table holds public marketing copy only.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("site_content")
      .select("key, value_en, value_ar");
    if (error || !data) return {};
    const map: SiteCopyMap = {};
    for (const row of (data as SiteContentRow[]) ?? []) {
      map[row.key] = { en: row.value_en ?? undefined, ar: row.value_ar ?? undefined };
    }
    return map;
  } catch {
    // Fail-open to the code defaults — the site renders exactly as it
    // does today whenever the overrides can't be read.
    return {};
  }
};

/**
 * Cached override map (5-minute revalidate). One cache entry serves
 * every public route in the same render window. Carries the
 * SITE_CONTENT_CACHE_TAG since 2026-10-22 — the admin save paths
 * invalidate it on demand (the blog precedent); the 300s TTL stays the
 * safety net, and the Cloudflare edge copy (edge_ttl=43200 — measured
 * live 2026-10-22) is purged by the same revalidate action.
 */
export const fetchSiteContentOverrides = unstable_cache(
  fetchSiteContentUncached,
  SITE_CONTENT_CACHE_KEY,
  { revalidate: 300, tags: [SITE_CONTENT_CACHE_TAG] },
);
