import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AffiliateStoreCategoryIcon, AffiliateStoreCategoryImage, AffiliateStoreProductGrid } from "@/components/affiliate-store/AffiliateStoreProductCard";
import { AffiliateStoreProductImage } from "@/components/affiliate-store/AffiliateStoreProductImage";
import { AffiliateStoreViewEvent } from "@/components/affiliate-store/AffiliateStoreViewEvent";
import { ShortDisclosureLine } from "@/components/affiliate-store/disclosure";
import { getAffiliateStoreCategoryPage, listAffiliateStoreSitemapEntries, listPublicAffiliateStoreMainCategories } from "@/lib/affiliate-store-server";
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";

/**
 * /affiliate-store/[category] — a MAIN category renders its FULL product
 * grid (527: mains show every shelf-qualified product in the subtree,
 * not empty section headers) plus its subcategory chips; a LEAF category
 * renders its product grid.
 * EN only — no Arabic mirror, self-canonical, ISR 3600.
 *
 * The thin-page law: a main below 3 published products 404s; a leaf with
 * zero published products 404s (governing law §1.4 — never a thin page).
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { categories } = await listAffiliateStoreSitemapEntries();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const page = await getAffiliateStoreCategoryPage(category);
  if (!page) {
    return {
      title: "Category Not Found — Alkemos Store",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/affiliate-store/${page.category.slug}`;
  return {
    title: `${page.category.name} — Alkemos Affiliate Store`,
    description:
      page.category.description ??
      `${page.category.name} picks, editorially reviewed by Alkemos and linked to Amazon.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${page.category.name} — Alkemos Affiliate Store`,
      description: page.category.description ?? undefined,
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
      title: `${page.category.name} — Alkemos Affiliate Store`,
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function AffiliateStoreCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [page, mains] = await Promise.all([
    getAffiliateStoreCategoryPage(category),
    listPublicAffiliateStoreMainCategories(),
  ]);
  if (!page) notFound();

  const { category: cat, sections, products } = page;
  const itemList = getItemListSchema({
    name: `${cat.name} — Alkemos Affiliate Store`,
    description: cat.description ?? `${cat.name} picks, editorially reviewed by Alkemos.`,
    items: products.map((p) => ({
      name: p.title,
      url: `https://alkemos.com/affiliate-store/${p.categorySlug}/${p.slug}`,
    })),
  });
  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "https://alkemos.com" },
    { name: "Store", url: "https://alkemos.com/affiliate-store" },
    { name: cat.name, url: `https://alkemos.com/affiliate-store/${cat.slug}` },
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <AffiliateStoreViewEvent event="affiliate_store_view" surface="category" slug={cat.slug} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 md:py-14">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/affiliate-store" className="hover:opacity-70">Store</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">{cat.name}</span>
        </nav>

        {/* ── The category masthead — REAL PRODUCT PHOTO (0119) with the
              carved icon as the identity mark ─────────────────────────── */}
        <header className="mb-6 flex items-start gap-4">
          {cat.imageUrl && (
            <span className="relative hidden h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-[var(--edge)] bg-[var(--muted)]/40 sm:block">
              <AffiliateStoreProductImage
                imageUrl={cat.imageUrl}
                imageAlt={cat.name}
                categoryName={cat.name}
                fill
                className="object-cover"
              />
            </span>
          )}
          <span className="hidden shrink-0 sm:block">
            <AffiliateStoreCategoryIcon iconKey={cat.iconKey} name={cat.name} size={72} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
              {cat.name}
            </h1>
            {cat.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
                {cat.description}
              </p>
            )}
          </div>
        </header>

        {/* د-2 — the short disclosure line near the category's
            recommendation links (§3.4-7). */}
        <ShortDisclosureLine className="mb-6" />

        {/* ── Subcategory chips (a MAIN's shelf navigation) ─────────── */}
        {sections.length > 0 && (
          <nav aria-label="Subcategories" className="mb-8 flex flex-wrap gap-2">
            {sections.map((section) => (
              <Link
                key={section.category.id}
                href={`/affiliate-store/${section.category.slug}`}
                className="rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-1.5 text-xs font-medium transition-shadow hover:shadow-md"
              >
                {section.category.name}
                <span className="ms-1.5 text-[var(--muted-foreground)]">
                  ({section.products.length})
                </span>
              </Link>
            ))}
          </nav>
        )}

        {/* ── THE FULL GRID (527: mains show their whole subtree —
              never again empty section headings) ───────────────────── */}
        <AffiliateStoreProductGrid products={products} />

        {/* ── The other categories rail (store navigation) ──────────── */}
        {mains.length > 1 && (
          <section aria-labelledby="other-categories" className="mt-12 border-t border-[var(--edge)] pt-8">
            <h2 id="other-categories" className="mb-4 text-lg font-semibold tracking-tight">
              Continue browsing
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mains
                .filter((m) => m.slug !== cat.slug)
                .map((main) => (
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
                    <span className="flex items-center justify-between gap-2 p-3">
                      <span className="text-sm font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
                        {main.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]">
                        {main.publishedCount}
                      </span>
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
