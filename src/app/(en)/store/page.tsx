import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StoreCategoryIcon, ProductCard } from "@/components/store/ProductCard";
import { StoreViewEvent } from "@/components/store/StoreViewEvent";
import { ShortDisclosureLine } from "@/components/store/disclosure";
import {
  listFeaturedStoreProducts,
  listPublicMainCategories,
} from "@/lib/store-server";

/**
 * /store — the Alkemos Product Store hub (EN ONLY — governing law §0:
 * no /ar/store, no hreflang pair, self-canonical).
 *
 * ALKEMOS-STORE-PHASE1 §1.3 (owner order 2026-11-26): SSG/ISR
 * (revalidate 3600) inside (en); the category grid shows ONLY the
 * publicly listable mains (the thin-page law: active + ≥3 published
 * products in the subtree — before the owner publishes the founding
 * batch this grid is honestly empty); the featured rail carries the
 * featured published products (cards link to product pages; the
 * purchase unit + its م-1 disclosure live on the product page).
 */

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata(): Promise<Metadata> {
  const url = "https://alkemos.com/store";
  return {
    title: "Alkemos Product Store — Fitness & Nutrition Gear We Recommend",
    description:
      "Curated fitness and nutrition products for your training and meal-prep routine: strength equipment, home gym gear, kitchen tools, wearables, and more — reviewed by Alkemos, linked to Amazon.",
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: "Alkemos Product Store",
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
      title: "Alkemos Product Store",
      description:
        "Curated fitness and nutrition gear — reviewed by Alkemos, linked to Amazon.",
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function StoreHubPage() {
  const [mains, featured] = await Promise.all([
    listPublicMainCategories(),
    listFeaturedStoreProducts(8),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <StoreViewEvent event="store_view" surface="store" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 md:py-16">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Alkemos Product Store
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
            The gear we actually recommend for the programs, tools, and recipes on
            Alkemos: strength equipment, home-gym machines, kitchen and meal-prep
            tools, measurement devices, wearables, and recovery gear — every pick
            is editorially reviewed and links straight to Amazon.
          </p>
        </header>

        <section aria-labelledby="store-categories">
          <h2 id="store-categories" className="mb-4 text-2xl font-semibold tracking-tight">
            Shop by category
          </h2>
          {mains.length === 0 ? (
            <p className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
              The store&apos;s founding batch is being reviewed — categories appear
              here as soon as their products go live.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mains.map((main) => (
                <Link
                  key={main.id}
                  href={`/store/${main.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
                >
                  <span className="shrink-0">
                    <StoreCategoryIcon iconKey={main.iconKey} name={main.name} size={56} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
                      {main.name}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                      {main.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {featured.length > 0 && (
          <section aria-labelledby="store-featured" className="mt-12">
            <h2 id="store-featured" className="mb-4 text-2xl font-semibold tracking-tight">
              Featured picks
            </h2>
            {/* د-2 — the short disclosure near the first recommendation links */}
            <ShortDisclosureLine className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* م-3 — the permanent footer line renders via SiteFooter on /store* */}
      </main>

      <SiteFooter />
    </div>
  );
}
