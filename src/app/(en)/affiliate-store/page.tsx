import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AffiliateStoreCategoryImage, AffiliateStoreProductGrid } from "@/components/affiliate-store/AffiliateStoreProductCard";
import { AffiliateStoreViewEvent } from "@/components/affiliate-store/AffiliateStoreViewEvent";
import { AffiliateStoreImpressionBeacon } from "@/components/affiliate-store/AffiliateStoreImpressionBeacon";
import { ShortDisclosureLine } from "@/components/affiliate-store/disclosure";
import {
  AFFILIATE_STORE_SORT_KEYS,
  listFeaturedAffiliateStoreProducts,
  listPublicAffiliateStoreMainCategories,
  listPublicAffiliateStoreBrands,
  queryAffiliateStoreProducts,
  type AffiliateStoreSortKey,
} from "@/lib/affiliate-store-server";

/**
 * /affiliate-store — the Alkemos Affiliate Store hub (EN ONLY — governing
 * law §0: no /ar/store, no hreflang pair, self-canonical).
 *
 * PHASE 527 (owner order 2026-11-27 «إعادة تصميم المتجر بالكامل» —
 * «أريد متجرًا تجاريًا حقيقيًا بمستوى متاجر التجزئة الاحترافية»):
 * a real storefront, not a suggestion rail:
 *   - a commercial masthead: store name, one-line value proposition,
 *     the affiliate disclosure up front;
 *   - SEARCH across titles, brands, and summaries (the q param);
 *   - CATEGORY TILES with their carved visuals + descriptions (the
 *     visible category navigation the owner ordered);
 *   - FILTERS: category + brand selects, and a SORT control (Featured,
 *     Newest, Top rated, Price — price sorts apply when API prices
 *     exist; with none, they keep the honest fallback order);
 *   - THE FULL PRODUCT GRID: every published, shelf-qualified product
 *     (image + ASIN + published — the 527-G2 shelf gate), vertical
 *     cards with large photos, brand, title, price line ("See price on
 *     Amazon" until a trusted API price exists), Featured badge, and a
 *     clear View Product CTA.
 *
 * SSG/ISR (revalidate 3600) inside (en); filtered views render
 * dynamically per searchParams (Next caches them by full URL).
 */

export const revalidate = 3600;
export const dynamicParams = true;

const SORT_OPTIONS: Array<{ key: AffiliateStoreSortKey; label: string }> = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "rating", label: "Top rated" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "title", label: "Name A–Z" },
];

export async function generateMetadata(): Promise<Metadata> {
  const url = "https://alkemos.com/affiliate-store";
  return {
    title: "Alkemos Affiliate Store — Fitness & Nutrition Gear We Recommend",
    description:
      "Shop curated fitness and nutrition products: supplements, healthy food, sports nutrition, strength and cardio equipment, workout accessories, recovery gear, fitness tech and training books — reviewed by Alkemos, linked to Amazon.",
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: "Alkemos Affiliate Store",
      description:
        "Curated fitness and nutrition gear — reviewed by Alkemos, linked to Amazon.",
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
      title: "Alkemos Affiliate Store",
      description:
        "Curated fitness and nutrition gear — reviewed by Alkemos, linked to Amazon.",
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

function clampSort(value: string | undefined): AffiliateStoreSortKey {
  return AFFILIATE_STORE_SORT_KEYS.includes(value as AffiliateStoreSortKey)
    ? (value as AffiliateStoreSortKey)
    : "featured";
}

export default async function AffiliateStoreHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const category = typeof params.category === "string" ? params.category.slice(0, 80) : "";
  const brand = typeof params.brand === "string" ? params.brand.slice(0, 80) : "";
  const sort = clampSort(typeof params.sort === "string" ? params.sort : undefined);

  const [mains, brands, products, featured] = await Promise.all([
    listPublicAffiliateStoreMainCategories(),
    listPublicAffiliateStoreBrands(),
    queryAffiliateStoreProducts({ q, category, brand, sort }),
    q || category || brand ? Promise.resolve([]) : listFeaturedAffiliateStoreProducts(4),
  ]);

  const isFiltered = Boolean(q || category || brand);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <AffiliateStoreViewEvent event="affiliate_store_view" surface="store" />
      {/* 529: the aggregated impression beacon (products actually seen) */}
      <AffiliateStoreImpressionBeacon productIds={products.map((p) => p.id)} surfaceType="store" surfaceKey="" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 md:py-14">
        {/* ── The commercial masthead ─────────────────────────────── */}
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Alkemos Store
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl">
            Fitness &amp; nutrition gear, picked by coaches
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
            Supplements, healthy food and sports nutrition, strength and cardio equipment, workout
            accessories, recovery gear, fitness tech and training media — every pick is
            editorially reviewed by the Alkemos team and links straight to Amazon.
          </p>
          {/* د-2 — the short disclosure near the top of the shopping surface */}
          <ShortDisclosureLine className="mt-3" />
        </header>

        {/* ── Search + filters + sort (GET form → shareable URLs) ──── */}
        <form
          className="mb-8 grid gap-3 rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4 md:grid-cols-[1fr_auto_auto_auto]"
          role="search"
          aria-label="Store search and filters"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products, brands…"
            aria-label="Search products"
            className="w-full rounded-lg border border-[var(--edge)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--text)]/20"
          />
          <select
            name="category"
            defaultValue={category}
            aria-label="Filter by category"
            className="rounded-lg border border-[var(--edge)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--text)]/20"
          >
            <option value="">All categories</option>
            {mains.map((main) => (
              <option key={main.slug} value={main.slug}>
                {main.name}
              </option>
            ))}
          </select>
          <select
            name="brand"
            defaultValue={brand}
            aria-label="Filter by brand"
            className="rounded-lg border border-[var(--edge)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--text)]/20"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              name="sort"
              defaultValue={sort}
              aria-label="Sort products"
              className="w-full rounded-lg border border-[var(--edge)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--text)]/20 md:w-auto"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[var(--text)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] transition-opacity hover:opacity-85"
            >
              Go
            </button>
          </div>
        </form>

        {/* ── Category tiles — REAL PRODUCT PHOTOS (0119: owner order
              «استبدل جميع أيقونات Shop by Category بصور منتجات حقيقية») ── */}
        {!isFiltered && mains.length > 0 && (
          <section aria-labelledby="store-categories" className="mb-10">
            <h2 id="store-categories" className="mb-4 text-xl font-semibold tracking-tight">
              Shop by category
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mains.map((main) => (
                <Link
                  key={main.id}
                  href={`/affiliate-store/${main.slug}`}
                  className="group overflow-hidden rounded-xl border border-[var(--edge)] bg-[var(--card)] transition-shadow hover:shadow-md"
                >
                  <AffiliateStoreCategoryImage
                    imageUrl={main.imageUrl}
                    iconKey={main.iconKey}
                    name={main.name}
                  />
                  <span className="block p-3.5 pb-4">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">
                        {main.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
                        {main.publishedCount}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-[var(--muted-foreground)] line-clamp-2">
                      {main.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── The product grid ────────────────────────────────────── */}
        <section aria-labelledby="store-products">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="store-products" className="text-xl font-semibold tracking-tight">
              {isFiltered ? "Results" : "All products"}
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
          </div>
          {products.length === 0 ? (
            <p className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
              {isFiltered
                ? "No products match this search — try a different keyword or clear the filters."
                : "The store's founding batch is being prepared — products appear here as soon as they are saved."}
            </p>
          ) : (
            <AffiliateStoreProductGrid products={products} />
          )}
          {isFiltered && (
            <div className="mt-6">
              <Link
                href="/affiliate-store"
                className="text-sm font-medium underline underline-offset-4 hover:opacity-70"
              >
                ← Clear search &amp; filters
              </Link>
            </div>
          )}
        </section>

        {/* م-3 — the permanent footer line renders via SiteFooter on /store* */}
      </main>

      <SiteFooter />
    </div>
  );
}
