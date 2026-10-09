import { notFound } from "next/navigation";
import { BlogArticlePage } from "@/components/blog/BlogArticlePage";
import { fetchBlogForOG, fetchBlogPostFull, fetchPublishedBlogSlugPools, buildBlogHreflang } from "@/lib/blog-server";
import { sanitizeBlogContent } from "@/lib/blog-content-sanitize";
import { insertToolLinks } from "@/lib/blog-tool-links";
import { getArticleSchema, getBreadcrumbSchema, getFAQSchema, getSpeakableSchema, jsonLd } from "@/lib/seo";
import { resolveAuthor } from "@/lib/authors";
import type { Metadata } from "next";

// #10 fix: use ISR instead of force-dynamic — blog posts change rarely,
// so a 1-hour revalidate cache reduces Vercel function invocations
// significantly while keeping content fresh.
// VERCEL-USAGE-9 (2026-10-09): 300s → 3600s. The route measured ƒ
// (dynamic, per-request invocation) despite this export — in Next 16 a
// dynamic route without generateStaticParams renders on demand and the
// revalidate alone never engages the ISR cache. The gSP below turns it
// into ● (ISR) so every published post is served from the CDN.
export const revalidate = 3600; // 1 hour — post-remediation freshness window
export const runtime = "nodejs";

// VERCEL-USAGE-9 (2026-10-09): prerender every published EN post at
// build time. Posts published after a build still render on demand
// (dynamicParams defaults to true) and ISR-cache from then on — the
// pipeline's same-day articles never wait for the next deployment.
export async function generateStaticParams() {
  const pools = await fetchPublishedBlogSlugPools();
  return Array.from(pools.en).map((slug) => ({ slug }));
}

/**
 * Server-side metadata generation — puts OG tags in <head> where Facebook,
 * LinkedIn, X, and WhatsApp can find them.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const og = await fetchBlogForOG(slug, "en");
  if (!og) {
    return {
      title: "Article Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  return {
    // PHASE 189 (SEO-GEO-10, deep-audit P1-1): `absolute` — article titles
    // are exempt from any parent layout title template. The EN mirror has
    // no template today (so this is a no-op now), but it locks the law for
    // the AR mirror where the /ar layout template appends " — Alkemos"
    // (11 chars), which pushed 5 clean stored titles (60-67 chars) over
    // the 70-char AR SERP budget. og.title is already clamped by
    // fetchBlogForOG (blog-meta-title.ts law).
    title: {
      absolute: og.title,
    },
    description: og.description,
    alternates: {
      canonical: og.articleUrl,
      // Phase SEO-GEO-6.5 (§12.19 P0-4): hreflang restored with REAL
      // pairing. The C1 removal (2026-09-07) was correct when zero pairs
      // existed and every declared counterpart 404'd — since then the
      // Phase-157/158 `linked_post_id` pairing supplies true twins: paired
      // posts emit the full en/ar/x-default set, unpaired posts declare
      // self + x-default only (never a dangling URL). Single source:
      // buildBlogHreflang() in blog-server.ts (shared with the AR mirror).
      languages: buildBlogHreflang(og),
    },
    openGraph: {
      type: "article",
      url: og.articleUrl,
      title: og.title,
      description: og.description,
      // SOCIAL-OG (2026-09-22, owner order «اجعل النشر يستخدم صورة المقال»):
      // share the article's REAL featured photo (og.shareImage — Pexels
      // 1200×630 jpeg crop served by Pexels' fast CDN) instead of the
      // branded generator card. Root cause of the blue-box share cards:
      // the generator's cold render (1.7–5.2s live) exceeds the
      // WhatsApp/Facebook crawler fetch budget. The generator stays the
      // fallback inside blog-server for photo-less articles only.
      // og:image / twitter:image / Article JSON-LD all read the SAME
      // og.shareImage (§12.40 consistency — single source in blog-server).
      images: [{ url: og.shareImage, width: 1200, height: 630, alt: og.title }],
      siteName: "Alkemos",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: og.title,
      description: og.description,
      images: [og.shareImage],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch blog data for Article schema
  const og = await fetchBlogForOG(slug, "en");

  // M29 fix: return proper 404 (not soft-404 HTTP 200) when the post
  // doesn't exist. This triggers Next.js's not-found page with status 404,
  // preventing Google from indexing invalid blog URLs as soft-404s.
  if (!og) {
    notFound();
  }

  // Phase SEO-GEO-4 (2026-09-08): pass real DB published_at + updated_at
  // to the Article schema so dateModified + lastReviewed reflect actual
  // edit history. Was: new Date().toISOString() at request time → every
  // crawl looked "freshly edited" which devalues the freshness signal.
  const publishedAt = og.publishedAt || new Date().toISOString();
  const updatedAt = og.updatedAt || publishedAt;

  const articleSchema = og
    ? getArticleSchema({
        title: og.title,
        description: og.description,
        slug,
        // §12.40 (P2-14, audit finding #10): og:image ↔ JSON-LD image
        // consistency — the Article schema carries the SAME og.shareImage
        // (the article's real featured photo, cover-first) that
        // generateMetadata declares for og:image/twitter:image. The real
        // photo IS a faithful representation of the article and is what
        // social platforms and Google Discover see on every share.
        image: og.shareImage,
        datePublished: publishedAt,
        dateModified: updatedAt,
        // Phase SEO-GEO-2 (2026-09-08): pass the resolved author Profile
        // so the Article schema's `author` Person matches the byline shown
        // in the UI. The DB `author` column historically stored 'Alkemos'
        // or 'MuscleHub' — resolveAuthor normalizes all of those to the
        // canonical Ahmed Zake Person (the de-facto author of every post).
        authorProfile: resolveAuthor(og.author),
        // AUDIT_REPORT §9-المرحلة 2, item 1 (0097): the REAL review
        // state — null (review pending) omits lastReviewed + reviewedBy
        // from the schema entirely (honest E-E-A-T, audit C2/F2: the
        // claims were printed on 97/97 articles while P5 publishes with
        // zero human review); a timestamp is emitted only when a human
        // actually reviewed the article.
        lastReviewed: og.lastReviewedAt,
      })
    : null;

  // Phase SEO-GEO-4 (2026-09-08): Speakable schema marks the H1 + excerpt
  // as voice-readable for Siri / Google Assistant / Alexa. The matching
  // `data-speakable` attributes are added in BlogArticlePage.tsx.
  const speakableSchema = og
    ? getSpeakableSchema({
        url: og.articleUrl,
        headlineSelector: '[data-speakable="headline"]',
        summarySelector: '[data-speakable="summary"]',
      })
    : null;

  const breadcrumbSchema = og
    ? getBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: og.title, url: `/blog/${slug}` },
      ])
    : null;

  // M28 fix: fetch the full post server-side so the article body is in
  // the initial HTML (visible to Googlebot without executing JS).
  // Phase 155 (SEO-GEO-4.7, §7.1 #11): legacy articles generated before
  // the tool-link guarantee layer existed (pre-2026-09-01) get the same
  // deterministic insertToolLinks treatment at render time. The function
  // is idempotent (skips already-linked tools, caps at 3, never touches
  // headings/existing markdown links), so pipeline-generated articles
  // pass through unchanged.
  // Phase 156 (SEO-GEO-4.8, §7.1 #15): sanitizeBlogContent runs FIRST
  // (audit-driven: wrong cross-language prefixes → 404, raw HTML anchors
  // killed by the XSS escape, known CJK corruption) — then tool links
  // are injected into the now-clean markdown. Both are idempotent.
  const [fetchedPost, slugPools] = await Promise.all([
    fetchBlogPostFull(slug, "en"),
    fetchPublishedBlogSlugPools(),
  ]);
  // PHASE 178 (2026-09-12 live incident): a failed full-content fetch must
  // NEVER render a 200 empty shell — Cloudflare cached a transient DB-hiccup
  // render as a 200 page carrying ONLY the cookie banner (74 words, 0 H1,
  // URL present in the sitemap). Same law as M29: fail honestly as 404; the
  // 5-min ISR revalidate self-heals the page on the next request.
  if (!fetchedPost) {
    notFound();
  }
  const fullPost = {
    ...fetchedPost,
    content: insertToolLinks(sanitizeBlogContent(fetchedPost.content, "en", slugPools), "en").md,
  };

  // AUDIT_REPORT §9-0.2 (2026-09-29) — FAQPage JSON-LD from faq_json: the
  // FAQ cards' data becomes machine-readable for AI answer engines (GEO).
  // Audit F5 measured 0/97 articles with FAQPage schema while the data sat
  // ready in the DB on every article. Google retired FAQ rich results
  // (seo.ts law, May 2026) — this is emitted for AI-engine semantic value
  // only (the coaching/for-coaches precedent). NO-FORCED-FILLER: an article
  // with no faq_json emits nothing. Server-rendered = crawler-visible
  // without JS. Raw stored questions (the displayFaqQuestion polish is
  // presentation-only capitalization).
  const faqPageSchema =
    fullPost.faq_json && fullPost.faq_json.length > 0
      ? getFAQSchema(
          fullPost.faq_json.map((f) => ({ q: f.question, a: f.answer })),
        )
      : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
        />
      )}
      {speakableSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(speakableSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
        />
      )}
      {faqPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqPageSchema) }}
        />
      )}
      <BlogArticlePage lang="en" slug={slug} initialPost={fullPost} publishedAt={publishedAt} updatedAt={updatedAt} lastReviewedAt={og.lastReviewedAt ?? undefined} />
    </>
  );
}
