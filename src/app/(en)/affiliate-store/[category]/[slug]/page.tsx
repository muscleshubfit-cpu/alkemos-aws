import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AmazonBuyButton } from "@/components/affiliate-store/AmazonBuyButton";
import { AffiliateStoreProductCard } from "@/components/affiliate-store/AffiliateStoreProductCard";
import { AffiliateStoreCategoryIcon } from "@/components/affiliate-store/AffiliateStoreProductCard";
import { AffiliateStoreViewEvent } from "@/components/affiliate-store/AffiliateStoreViewEvent";
import {
  getAffiliateStoreProductBySlug,
  listRelatedAffiliateStoreProducts,
  listAffiliateStoreSitemapEntries,
} from "@/lib/affiliate-store-server";
import { resolveAmazonBuyLink, AFFILIATE_STORE_BUY_CTA_LABEL } from "@/lib/affiliate-store-link";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /affiliate-store/[category]/[slug] — the product page (EN only; the compare-page
 * pattern: header + editorial content + specs + the purchase unit with
 * its attached م-1 disclosure + related + share).
 *
 * COMPLIANCE SHAPE:
 *  - The purchase link is built HERE from the ASIN + env tag
 *    (resolveAmazonBuyLink — never stored); no ASIN → no buy unit.
 *  - NO price, NO Amazon rating, NO Amazon copy (pre-API laws).
 *  - editorial_rating renders ONLY as the labeled internal
 *    "Alkemos Editorial Score" (never an Amazon rating — clause (t)).
 *  - The category segment must match the product's leaf category
 *    (global slug + category pair check → 404 otherwise).
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { products } = await listAffiliateStoreSitemapEntries();
  return products.map((p) => ({ category: p.categorySlug, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getAffiliateStoreProductBySlug(slug);
  if (!product || product.categorySlug !== category) {
    return {
      title: "Product Not Found — Alkemos Store",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/affiliate-store/${product.categorySlug}/${product.slug}`;
  return {
    title: `${product.title} — Alkemos Affiliate Store`,
    description: product.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${product.title} — Alkemos Affiliate Store`,
      description: product.summary,
      siteName: "Alkemos",
      locale: "en_US",
      images: [
        {
          url: "/images/og/og-home-en.png?v=4",
          width: 1200,
          height: 630,
          alt: "Alkemos — The Smart Fitness & Nutrition Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — Alkemos Affiliate Store`,
      description: product.summary,
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function AffiliateStoreProductPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const product = await getAffiliateStoreProductBySlug(slug);
  if (!product || product.categorySlug !== category) notFound();

  const related = await listRelatedAffiliateStoreProducts(slug, category, 4);
  const buy = resolveAmazonBuyLink(product.asin);
  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "https://alkemos.com" },
    { name: "Store", url: "https://alkemos.com/affiliate-store" },
    { name: product.categoryName, url: `https://alkemos.com/affiliate-store/${product.categorySlug}` },
    { name: product.title, url: `https://alkemos.com/affiliate-store/${product.categorySlug}/${product.slug}` },
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <AffiliateStoreViewEvent event="affiliate_store_product_view" surface="product" slug={product.slug} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/affiliate-store" className="hover:opacity-70">Store</Link>
          <span>/</span>
          <Link href={`/affiliate-store/${product.categorySlug}`} className="hover:opacity-70">
            {product.categoryName}
          </Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">{product.title}</span>
        </nav>

        <header className="mb-8 flex items-start gap-4">
          <span className="shrink-0">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- owned/licensed
              <img
                src={product.imageUrl}
                alt={product.title}
                width={96}
                height={96}
                className="rounded-xl object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <AffiliateStoreCategoryIcon
                iconKey={product.categoryIconKey}
                name={product.categoryName}
                size={96}
              />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {product.title}
            </h1>
            {product.brand && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{product.brand}</p>
            )}
            {product.editorialRating !== null && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Alkemos Editorial Score: {product.editorialRating.toFixed(1)}/10
              </p>
            )}
          </div>
        </header>

        {/* THE PURCHASE UNIT — the link built from ASIN + env tag at render;
            the م-1 OA disclosure renders attached INSIDE the unit. */}
        <div className="mb-10">
          {buy ? (
            <AmazonBuyButton
              buyUrl={buy.url}
              productId={product.id}
              surfaceType="product"
              surfaceKey={product.slug}
              ctaLabel={AFFILIATE_STORE_BUY_CTA_LABEL}
            />
          ) : (
            <p className="rounded-lg border border-[var(--edge)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
              The purchase link for this pick is being finalized — check back shortly.
            </p>
          )}
        </div>

        <article className="space-y-4 text-base leading-relaxed">
          <p className="font-medium">{product.summary}</p>
          {product.content
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </article>

        <div className="mt-10 border-t border-[var(--edge)] pt-6">
          <ShareButtons
            title={product.title}
            path={`/affiliate-store/${product.categorySlug}/${product.slug}`}
          />
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-picks" className="mt-12">
            <h2 id="related-picks" className="mb-4 text-xl font-semibold tracking-tight">
              Related picks
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((p) => (
                <AffiliateStoreProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
