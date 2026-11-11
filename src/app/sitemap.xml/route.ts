import { createClient } from "@supabase/supabase-js";
import {
  buildSitemapIndex,
  xmlResponse,
  siteUrl,
  type SitemapIndexEntry,
} from "@/lib/sitemap-xml";
import { familyLastmod } from "@/lib/sitemap-lastmod";
import { blogIndexLastmod } from "@/lib/blog-sitemap";

/**
 * GET /sitemap.xml — Sitemap INDEX (audit C2, 2026-09-05).
 *
 * Replaces the old 9.3MB / 19,498-URL monolith with an index pointing
 * at topic-specific children. robots.txt already points here — nothing
 * external changes.
 *
 * HISTORY of this file's <lastmod> behavior:
 *
 * Phase SEO-GEO-1.1 (2026-09-08) — the index wrote lastmod = TODAY on
 * every child entry daily. The motivation was measured and real at the
 * time: GSC/Bing reported "Couldn't fetch" on freshly deployed children
 * (GSC's fetch cache lag), and a bumped lastmod forced a same-day
 * re-fetch. That hack is documented as P-3 in SEO-COLLAPSE-AUDIT
 * 2026-10-18 §2 and stayed deferred (decision D-4) awaiting
 * post-recovery stabilization.
 *
 * P-3/D-4 EXECUTED (2026-11-05, owner order «نفّذ الإصلاح التقني إذا
 * ثبت») — the deferral premise is void with new evidence: GSC measured
 * 29 impressions/28 days across 2026-10-08→11-04 (no recovery window
 * to protect), and Google's documented trust model makes the daily
 * fabricated date self-defeating — Search Central: <lastmod> helps
 * schedule crawling ONLY while dates look consistently accurate;
 * unreliable dates get ignored wholesale. With no Google-side push
 * channel available to this deployment (IndexNow does not cover
 * Google; the URL Inspection API needs an owner-granted read-write
 * scope), the sitemap lastmod is the one programmatic recrawl signal
 * the site controls — so it now carries TRUTHFUL dates:
 *
 *   - the five static families → the central per-family anchors
 *     (src/lib/sitemap-lastmod.ts — the SAME anchors their child
 *     sitemaps already emit, so index and children can never drift);
 *   - sitemap-blog.xml → the greatest real published_at|updated_at
 *     across published rows (blogIndexLastmod — no fallback-to-now);
 *   - when no truthful date is available (Supabase unreachable, no
 *     rows) the entry is simply emitted WITHOUT <lastmod> — absence is
 *     honest, a fabricated date is not.
 */

export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();
  const entries: SitemapIndexEntry[] = [
    { loc: `${base}/sitemap-pages.xml`, lastModified: familyLastmod("pages") },
    // SEO-RECOVERY SPLIT (2026-11-11): the commercial surface child —
    // same URLs that rode sitemap-pages until now (exact partition);
    // split out so GSC's per-sitemap report tracks the revenue
    // surface's recovery as one readable number (audit 13 §3 + report
    // 11 §11 recovery dashboard).
    { loc: `${base}/sitemap-commercial.xml`, lastModified: familyLastmod("commercial") },
    {
      loc: `${base}/sitemap-collections.xml`,
      lastModified: familyLastmod("collections"),
    },
    {
      loc: `${base}/sitemap-comparisons.xml`,
      lastModified: familyLastmod("comparisons"),
    },
    {
      loc: `${base}/sitemap-exercises.xml`,
      lastModified: familyLastmod("exercises"),
    },
    { loc: `${base}/sitemap-foods.xml`, lastModified: familyLastmod("foods") },
    // HEALTHY-RECIPES-PLATFORM (2026-11-10): the recipes child — dynamic
    // truthful lastmod (the same law as the blog child: max real
    // published_at/updated_at from the table, or NO date at all).
    { loc: `${base}/sitemap-recipes.xml`, ...(await recipesEntryLastmod()) },
    { loc: `${base}/sitemap-blog.xml`, ...(await blogEntryLastmod()) },
  ];
  return xmlResponse(buildSitemapIndex(entries));
}

/**
 * The blog child's index lastmod — a real max(published_at, updated_at)
 * from the same table the child sitemap reads, or NO date at all.
 * Fail-soft by design (mirrors the child route's error posture): an
 * unreachable Supabase must never 500 the index to a crawler.
 */
async function recipesEntryLastmod(): Promise<{ lastModified?: Date }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return {};
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase
      .from("recipes")
      .select("published_at, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(200);
    const stamps = (data ?? [])
      .map((r: { published_at?: string | null; updated_at?: string | null }) =>
        new Date(r.updated_at ?? r.published_at ?? 0).getTime(),
      )
      .filter((t: number) => Number.isFinite(t) && t > 0);
    if (stamps.length === 0) return {};
    return { lastModified: new Date(Math.max(...stamps)) };
  } catch {
    return {};
  }
}

async function blogEntryLastmod(): Promise<{ lastModified?: Date }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return {};
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("published_at, updated_at")
      .eq("is_published", true);
    const max = blogIndexLastmod(posts);
    return max ? { lastModified: max } : {};
  } catch {
    // Supabase unreachable → no lastmod for the blog child (honest
    // absence — never a fabricated date, never a 500).
    return {};
  }
}
