import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreCategoryIcon, ProductGrid } from "@/components/store/ProductCard";
import { StoreViewEvent } from "@/components/store/StoreViewEvent";
import { ShortDisclosureLine } from "@/components/store/disclosure";
import { getStoreCategoryPage, listStoreSitemapEntries } from "@/lib/store-server";
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";

/**
 * /store/[category] — a MAIN category renders its subcategory SECTIONS
 * (the ratified §6-ب URL law); a LEAF category renders its product grid.
 * EN only — no Arabic mirror, self-canonical, ISR 3600.
 *
 * The thin-page law: a main below 3 published products 404s; a leaf with
 * zero published products 404s (governing law §1.4 — never a thin page).
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { categories } = await listStoreSitemapEntries();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const page = await getStoreCategoryPage(category);
  if (!page) {
    return {
      title: "Category Not Found — Alkemos Store",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/store/${page.category.slug}`;
  return {
    title: `${page.category.name} — Alkemos Product Store`,
    description:
      page.category.description ??
      `${page.category.name} picks, editorially reviewed by Alkemos and linked to Amazon.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${page.category.name} — Alkemos Product Store`,
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
      title: `${page.category.name} — Alkemos Product Store`,
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function StoreCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const page = await getStoreCategoryPage(category);
  if (!page) notFound();

  const { category: cat, sections, products } = page;
  const itemList = getItemListSchema({
    name: `${cat.name} — Alkemos Product Store`,
    description: cat.description ?? `${cat.name} picks, editorially reviewed by Alkemos.`,
    items: products
      .concat(sections.flatMap((s) => s.products))
      .map((p) => ({
        name: p.title,
        url: `https://alkemos.com/store/${p.categorySlug}/${p.slug}`,
      })),
  });
  const breadcrumb = getBreadcrumbSchema([
    { name: "Home", url: "https://alkemos.com" },
    { name: "Store", url: "https://alkemos.com/store" },
    { name: cat.name, url: `https://alkemos.com/store/${cat.slug}` },
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <StoreViewEvent event="store_view" surface="category" slug={cat.slug} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/store" className="hover:opacity-70">Store</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">{cat.name}</span>
        </nav>

        <header className="mb-10 flex items-start gap-4">
          <span className="shrink-0">
            <StoreCategoryIcon iconKey={cat.iconKey} name={cat.name} size={72} />
          </span>
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
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
            recommendation links (§3.4-7: every store page carries an
            English disclosure component; the buy units carry م-1). */}
        <ShortDisclosureLine className="mb-6" />

        {sections.length > 0 ? (
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.category.id} aria-labelledby={`sec-${section.category.slug}`}>
                <h2 id={`sec-${section.category.slug}`} className="mb-4 text-xl font-semibold tracking-tight">
                  <Link
                    href={`/store/${section.category.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {section.category.name}
                  </Link>
                </h2>
                <ProductGrid products={section.products} />
              </section>
            ))}
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
