import { notFound } from "next/navigation";
import { BlogArticlePage } from "@/components/blog/BlogArticlePage";
import { fetchBlogForOG, fetchBlogPostFull, fetchPublishedBlogSlugPools, buildBlogHreflang } from "@/lib/blog-server";
import { sanitizeBlogContent } from "@/lib/blog-content-sanitize";
import { insertToolLinks } from "@/lib/blog-tool-links";
import { getArticleSchema, getBreadcrumbSchema, getFAQSchema, getSpeakableSchema, jsonLd } from "@/lib/seo";
import { resolveAuthor } from "@/lib/authors";
import type { Metadata } from "next";

// #10 fix: ISR — 1 hour revalidate
// VERCEL-USAGE-9 (2026-10-09): 300s → 3600s + generateStaticParams —
// mirrors the EN fix: without gSP the route stayed ƒ (per-request SSR)
// and the revalidate export never engaged. See the EN mirror for the
// full rationale.
export const revalidate = 3600; // 1 hour — post-remediation freshness window
export const runtime = "nodejs";

// VERCEL-USAGE-9 (2026-10-09): prerender every published AR post at
// build time (same law as the EN mirror — dynamicParams stays true so
// newly published posts render on demand and ISR-cache from then on).
export async function generateStaticParams() {
  const pools = await fetchPublishedBlogSlugPools();
  return Array.from(pools.ar).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const og = await fetchBlogForOG(slug, "ar");
  if (!og) {
    return {
      title: "المقال غير موجود — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  return {
    // PHASE 189 (SEO-GEO-10, deep-audit P1-1): `absolute` — THIS is the
    // actual P1-1 fix. Forensics (Supabase read + live HTML) proved the
    // stored meta_titles were CLEAN (60-67 chars, no suffix) and the
    // entire " — Alkemos" suffix in <title> came from the /ar layout
    // template ("%s — Alkemos" — 11 chars), pushing 5 titles to 71-77
    // against the 70-char AR budget (all 36 AR articles carried it).
    // Article titles opt OUT of the template: og.title is the clamped
    // stored value (fetchBlogForOG → blog-meta-title.ts). The template
    // stays for short-title surfaces (tools/hubs/about) where it fits.
    title: {
      absolute: og.title,
    },
    description: og.description,
    alternates: {
      canonical: og.articleUrl,
      // Phase SEO-GEO-6.5 (§12.19 P0-4): hreflang restored with REAL
      // pairing (linked_post_id twins) — see the EN mirror for the full
      // rationale. Single source: buildBlogHreflang() in blog-server.ts.
      languages: buildBlogHreflang(og),
    },
    openGraph: {
      type: "article",
      url: og.articleUrl,
      title: og.title,
      description: og.description,
      // SOCIAL-OG (2026-09-22, owner order «اجعل النشر يستخدم صورة المقال»):
      // share the article's REAL featured photo (og.shareImage) — see the
      // EN mirror for the full rationale (cold generator latency →
      // blue-box cards on WhatsApp/Facebook; generator = photo-less
      // fallback only, inside blog-server).
      images: [{ url: og.shareImage, width: 1200, height: 630, alt: og.title }],
      siteName: "Alkemos",
      locale: "ar_EG",
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

  const og = await fetchBlogForOG(slug, "ar");

  // M29 fix: return proper 404 when the post doesn't exist.
  if (!og) {
    notFound();
  }

  // Phase SEO-GEO-4 (2026-09-08): real DB dates — see EN mirror for the rationale.
  const publishedAt = og.publishedAt || new Date().toISOString();
  const updatedAt = og.updatedAt || publishedAt;

  const articleSchema = og
    ? getArticleSchema({
        title: og.title,
        description: og.description,
        slug,
        // §12.40 (P2-14, audit finding #10): og:image ↔ JSON-LD image
        // consistency — the SAME og.shareImage (real featured photo,
        // cover-first) that openGraph/twitter declare above. See the
        // EN mirror (/blog/[slug]/page.tsx) for the full rationale.
        image: og.shareImage,
        datePublished: publishedAt,
        dateModified: updatedAt,
        // Phase SEO-GEO-2 (2026-09-08): resolved author Person — see
        // the EN mirror (/blog/[slug]/page.tsx) for the full rationale.
        authorProfile: resolveAuthor(og.author),
        // AUDIT_REPORT §9-المرحلة 2, item 1 (0097): the REAL review
        // state — null (review pending) omits lastReviewed + reviewedBy
        // from the schema entirely (honest E-E-A-T); a timestamp is
        // emitted only when a human actually reviewed. See EN mirror.
        lastReviewed: og.lastReviewedAt,
      })
    : null;

  // Phase SEO-GEO-4 (2026-09-08): Speakable schema — see EN mirror.
  const speakableSchema = og
    ? getSpeakableSchema({
        url: og.articleUrl,
        headlineSelector: '[data-speakable="headline"]',
        summarySelector: '[data-speakable="summary"]',
      })
    : null;

  const breadcrumbSchema = og
    ? getBreadcrumbSchema([
        // P3-9 (deep-audit confirmed 15, Phase 217): AR breadcrumbs must
        // point at the AR home — "/" was an EN leak in a copy-paste pair.
        { name: "الرئيسية", url: "/ar" },
        { name: "المدونة", url: "/ar/blog" },
        { name: og.title, url: `/ar/blog/${slug}` },
      ])
    : null;

  // M28 fix: fetch the full post server-side so the article body is in
  // the initial HTML (visible to Googlebot without executing JS).
  // Phase 155 (SEO-GEO-4.7, §7.1 #11): same render-time tool-link
  // injection as the EN mirror (AR trigger dictionary, idempotent).
  // Phase 156 (SEO-GEO-4.8, §7.1 #15): the AR legacy corpus carries 85
  // /blog/-prefixed links to AR-only articles (live 404s) + 3 raw HTML
  // anchors + 3 CJK tokens — all fixed deterministically here, pools
  // guard so a real cross-language target is never broken.
  const [fetchedPost, slugPools] = await Promise.all([
    fetchBlogPostFull(slug, "ar"),
    fetchPublishedBlogSlugPools(),
  ]);
  // PHASE 178 (2026-09-12 live incident): a failed full-content fetch must
  // NEVER render a 200 empty shell — Cloudflare cached a transient DB-hiccup
  // render as a 200 page carrying ONLY the cookie banner. Same law as the
  // EN mirror (M29): fail honestly as 404; ISR self-heals on revalidate.
  if (!fetchedPost) {
    notFound();
  }
  const fullPost = {
    ...fetchedPost,
    content: insertToolLinks(sanitizeBlogContent(fetchedPost.content, "ar", slugPools), "ar").md,
  };

  // AUDIT_REPORT §9-0.2 (2026-09-29) — FAQPage JSON-LD from faq_json — see
  // the EN mirror (/blog/[slug]/page.tsx) for the full rationale (GEO for
  // AI answer engines · no-forced-filler · raw stored questions).
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
      <BlogArticlePage lang="ar" slug={slug} initialPost={fullPost} publishedAt={publishedAt} updatedAt={updatedAt} lastReviewedAt={og.lastReviewedAt ?? undefined} />
    </>
  );
}
