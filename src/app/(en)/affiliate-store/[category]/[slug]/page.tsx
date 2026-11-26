import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AmazonBuyButton } from "@/components/affiliate-store/AmazonBuyButton";
import { AffiliateStoreProductCard, AffiliateStorePriceLine } from "@/components/affiliate-store/AffiliateStoreProductCard";
import { AffiliateStoreProductImage } from "@/components/affiliate-store/AffiliateStoreProductImage";
import { AffiliateStoreViewEvent } from "@/components/affiliate-store/AffiliateStoreViewEvent";
import { AffiliateStoreImpressionBeacon } from "@/components/affiliate-store/AffiliateStoreImpressionBeacon";
import {
  getAffiliateStoreProductBySlug,
  listRelatedAffiliateStoreProducts,
  listAffiliateStoreSitemapEntries,
} from "@/lib/affiliate-store-server";
import { resolveAmazonBuyLink, AFFILIATE_STORE_BUY_CTA_LABEL } from "@/lib/affiliate-store-link";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /affiliate-store/[category]/[slug] — the product page (EN only; the
 * compare-page pattern lifted to a professional product detail page).
 *
 * PHASE 527 redesign («صفحات تفاصيل منتجات احترافية تشمل الصورة
 * والوصف والمواصفات ومعلومات الشراء»):
 *  - Two-column masthead: the LARGE real product photo + the buy column
 *    (brand, title, editorial score, the price line, the purchase unit).
 *  - The purchase unit: the link built HERE from the ASIN + env tag
 *    (resolveAmazonBuyLink — never stored) with its attached م-1
 *    disclosure; NO ASIN → no buy unit (527-G2 makes ASIN required, so
 *    this is the last line of defense).
 *  - NO invented prices: API price when present, otherwise the button
 *    says exactly what it does — "See price on Amazon".
 *  - Specs summary (brand, category, updated) + the editorial content.
 *  - Related picks from the same main category.
 *  - editorial_rating renders ONLY as the labeled internal "Alkemos
 *    Editorial Score" (never an Amazon rating — clause (t)).
 *  - The category segment must match the product's leaf category
 *    (global slug + category pair check → 404 otherwise).
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { products } = await listAffiliateStoreSitemapEntries();
  return products
    .filter((p) => p.categorySlug)
    .map((p) => ({ category: p.categorySlug, slug: p.slug }));
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
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.title }]
        : [{ url: "/images/og/og-home-en.png?v=4", width: 1200, height: 630, alt: "Alkemos" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} — Alkemos Affiliate Store`,
      description: product.summary,
      images: product.imageUrl ? [product.imageUrl] : ["/images/og/og-home-en.png?v=4"],
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
      {/* 529: the product-detail impression (the page IS the product card) */}
      <AffiliateStoreImpressionBeacon productIds={[product.id]} surfaceType="product" surfaceKey={product.slug} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 md:py-14">
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

        {/* ── The product masthead: photo + buy column ───────────────── */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* The photo column */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--edge)] bg-[var(--card)] p-6">
            <AffiliateStoreProductImage
              imageUrl={product.imageUrl}
              imageAlt={product.title}
              categoryName={product.categoryName}
              fill
              eager
              className="object-contain"
            />
            {product.isFeatured && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-[var(--text)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bg)] shadow-sm">
                Featured
              </span>
            )}
          </div>

          {/* The buy column */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                {product.brand}
              </p>
            )}
            <h1 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {product.title}
            </h1>
            {product.editorialRating !== null && (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Alkemos Editorial Score:{" "}
                <span className="font-semibold text-[var(--text)]">
                  {product.editorialRating.toFixed(1)}/10
                </span>
              </p>
            )}
            <p className="mt-4 text-base leading-relaxed">{product.summary}</p>

            {/* The price line — API price when trusted, the honest CTA text otherwise */}
            <div className="mt-6 rounded-xl border border-[var(--edge)] bg-[var(--card)] p-5">
              <AffiliateStorePriceLine priceUsd={product.priceUsd} className="text-lg" />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {product.priceUsd !== null
                  ? "Price as last served by our product data source."
                  : "We never guess a price — open Amazon for the live one."}
              </p>

              {/* THE PURCHASE UNIT — the link built from ASIN + env tag at
                  render; the م-1 OA disclosure renders attached INSIDE the unit. */}
              <div className="mt-4">
                {buy ? (
                  <AmazonBuyButton
                    buyUrl={buy.url}
                    productId={product.id}
                    surfaceType="product"
                    surfaceKey={product.slug}
                    ctaLabel={AFFILIATE_STORE_BUY_CTA_LABEL}
                    variant="large"
                  />
                ) : (
                  <p className="rounded-lg border border-[var(--edge)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]">
                    The purchase link for this pick is being finalized — check back shortly.
                  </p>
                )}
              </div>
            </div>

            {/* Specs summary */}
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Category</dt>
                <dd className="mt-0.5">
                  <Link href={`/affiliate-store/${product.categorySlug}`} className="underline-offset-4 hover:underline">
                    {product.categoryName}
                  </Link>
                </dd>
              </div>
              {product.mainCategoryName && product.mainCategorySlug && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Department</dt>
                  <dd className="mt-0.5">
                    <Link href={`/affiliate-store/${product.mainCategorySlug}`} className="underline-offset-4 hover:underline">
                      {product.mainCategoryName}
                    </Link>
                  </dd>
                </div>
              )}
              {product.brand && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Brand</dt>
                  <dd className="mt-0.5">{product.brand}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Reviewed</dt>
                <dd className="mt-0.5">{new Date(product.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* ── The editorial content ──────────────────────────────────── */}
        <article className="mt-12 space-y-4 border-t border-[var(--edge)] pt-8 text-base leading-relaxed">
          <h2 className="text-xl font-semibold tracking-tight">Why we picked it</h2>
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

        {/* ── Related picks ──────────────────────────────────────────── */}
        {related.length > 0 && (
          <section aria-labelledby="related-picks" className="mt-12">
            <h2 id="related-picks" className="mb-4 text-xl font-semibold tracking-tight">
              Related picks
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
