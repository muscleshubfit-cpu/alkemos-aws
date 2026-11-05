import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCategoryPage } from "@/components/blog/BlogCategoryPage";
import { listPublishedPostsByCategory, normalizeCategory } from "@/lib/blog-server";
import { BLOG_CATEGORY_CONTENT } from "@/lib/blog-category-content";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

const SITE_URL = "https://alkemos.com";

/**
 * /ar/blog/category/[slug] — the AR mirror of the crawlable
 * blog-category page (P2-11, §12.36). Independent Arabic post lists
 * (not translations), unique Arabic intros (MSA), reciprocal hreflang
 * with the EN page.
 *
 * AR TITLE LAW (eadb3e7 / 935fc4c): the /ar layout template appends the
 * brand — the title here carries NO brand of its own.
 */

export const revalidate = 300; // same cadence as the EN category page

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
    title: content.titleAr,
    description: content.introAr.slice(0, 158),
    alternates: {
      canonical: `/ar/blog/category/${categoryId}`,
      languages: {
        en: `${SITE_URL}/blog/category/${categoryId}`,
        ar: `${SITE_URL}/ar/blog/category/${categoryId}`,
        "x-default": `${SITE_URL}/blog/category/${categoryId}`,
      },
    },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ar/blog/category/${categoryId}`,
      title: content.titleAr,
      description: content.introAr.slice(0, 158),
      siteName: "Alkemos",
      locale: "ar_EG",
      // PHASE 187 (deep-audit P0-2): og:image for the AR blog-category
      // surface — static branded family card (design mirrors
      // /api/og-image) + the twitter card that was missing entirely.
      images: [
        {
          url: "/images/og/og-home-ar.png?v=4",
          width: 1200,
          height: 630,
          alt: "مقالات اللياقة والتغذية من Alkemos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.titleAr,
      description: content.introAr.slice(0, 158),
      images: ["/images/og/og-home-ar.png?v=4"],
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

  const posts = await listPublishedPostsByCategory("ar", categoryId);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "المدونة", url: "/ar/blog" },
    { name: BLOG_CATEGORY_CONTENT[categoryId].titleAr, url: `/ar/blog/category/${categoryId}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <BlogCategoryPage lang="ar" categoryId={categoryId} posts={posts} />
    </>
  );
}
