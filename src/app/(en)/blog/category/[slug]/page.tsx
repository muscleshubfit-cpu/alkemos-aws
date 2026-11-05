import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";
import { listPublishedPostsByCategory, normalizeCategory } from "@/lib/blog-server";
import { BLOG_CATEGORY_CONTENT } from "@/lib/blog-category-content";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

const SITE_URL = "https://alkemos.com";

/**
 * /blog/category/[slug] — the EN crawlable blog-category page (P2-11,
 * §12.36). Ten static category ids × 2 languages = 20 indexable hub
 * pages with unique intros, full hreflang pairs, and a server-rendered
 * article-link graph (the old chips were client-state buttons).
 */

export const revalidate = 300; // same cadence as the blog list/article pages

export function generateStaticParams() {
  return Object.keys(BLOG_CATEGORY_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoryId = normalizeCategory(slug);
  if (!BLOG_CATEGORY_CONTENT[categoryId] || slug !== categoryId) notFound();
  const content = BLOG_CATEGORY_CONTENT[categoryId];
  return {
    title: `${content.titleEn} | Alkemos Blog`,
    description: content.introEn.slice(0, 158),
    alternates: {
      canonical: `/blog/category/${categoryId}`,
      languages: {
        en: `${SITE_URL}/blog/category/${categoryId}`,
        ar: `${SITE_URL}/ar/blog/category/${categoryId}`,
        "x-default": `${SITE_URL}/blog/category/${categoryId}`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/blog/category/${categoryId}`,
      title: `${content.titleEn} | Alkemos Blog`,
      description: content.introEn.slice(0, 158),
      siteName: "Alkemos",
      // P3-10 (Phase 217, deep-audit م9): og:locale symmetry — the AR twin
      // declares ar_EG; this EN block replaces the root's, so it must
      // state its own locale.
      locale: "en_US",
      // PHASE 187 (deep-audit P0-2): og:image for the blog-category
      // surface — static branded family card (design mirrors
      // /api/og-image) + the twitter card that was missing entirely.
      images: [
        {
          url: "/images/og/og-home-en.png?v=4",
          width: 1200,
          height: 630,
          alt: "Alkemos Fitness & Nutrition Articles",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.titleEn} | Alkemos Blog`,
      description: content.introEn.slice(0, 158),
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryId = normalizeCategory(slug);
  if (!BLOG_CATEGORY_CONTENT[categoryId] || slug !== categoryId) notFound();

  const posts = await listPublishedPostsByCategory("en", categoryId);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: BLOG_CATEGORY_CONTENT[categoryId].titleEn, url: `/blog/category/${categoryId}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <BlogCategoryPage lang="en" categoryId={categoryId} posts={posts} />
    </>
  );
}
