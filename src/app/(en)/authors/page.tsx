import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AUTHORS } from "@/lib/authors";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /authors — Author index (EN).
 *
 * SEO/GEO audit fix (2026-09-28): the author PROFILE pages' visible
 * breadcrumb and BreadcrumbList JSON-LD pointed at /authors, which did
 * not exist (404) — a broken internal link on the exact entity pages
 * (@id anchors for every Article.author / Organization.founder Person).
 * This data-driven index gives that breadcrumb a real target and gives
 * crawlers/AI engines a hub that lists every human behind the content.
 *
 * Data source: src/lib/authors.ts (AUTHORS registry) — new authors
 * appear here automatically.
 */

export const metadata: Metadata = {
  title: "Authors & Reviewers | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 164 → 132 chars — the
    // ≤160 SERP-truncation law now holds (certified-professional proof kept).
    "The authors and reviewers behind Alkemos: certified fitness and nutrition professionals who write and review every page and article.",
  alternates: {
    canonical: "/authors",
    languages: {
      en: "https://alkemos.com/authors",
      ar: "https://alkemos.com/ar/authors",
      "x-default": "https://alkemos.com/authors",
    },
  },
  openGraph: {
    title: "Authors & Reviewers | Alkemos",
    description:
      "The certified fitness and nutrition professionals who write and review every exercise, food page, and article on Alkemos.",
    url: "https://alkemos.com/authors",
    type: "website",
    siteName: "Alkemos",
    locale: "en_US",
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default function AuthorsIndexPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Authors", url: "/authors" },
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6 md:py-24">
        <nav
          className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Authors</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Authors &amp; Reviewers
        </h1>
        <p className="mt-4 max-w-2xl text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
          {/* CONTENT-AUDIT P1-3 (2026-09-28, audit §1.5): "written by" was not
              defensible — library data is imported and curated, blog posts are
              AI-generated through an editorial pipeline. The honest, stronger
              E-E-A-T claim: reviewed and curated by real professionals. */}
          Every exercise, food page, program, and article on Alkemos is
          reviewed and curated by real professionals. Meet the people behind
          the content — their experience, credentials, and the standards they
          review against.
        </p>

        <div className="mt-6">
          <ShareButtons path="/authors" title="Authors & Reviewers — Alkemos" />
        </div>

        <ul className="mt-12 space-y-6">
          {AUTHORS.map((author) => (
            <li key={author.slug}>
              <Link
                href={`/authors/${author.slug}`}
                className="marble-card flex flex-col gap-6 p-6 transition-opacity hover:opacity-90 sm:flex-row sm:items-center"
              >
                {author.avatarUrl && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--edge)] bg-[var(--tint)]">
                    <Image
                      src={author.avatarUrl}
                      alt={author.nameEn}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {author.nameEn}
                  </h2>
                  <p className="mt-1 text-sm font-normal text-[var(--muted-2)]">
                    {author.jobTitleEn}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                    {author.bioEn}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[var(--text)]">
                    View profile →
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </div>
  );
}
