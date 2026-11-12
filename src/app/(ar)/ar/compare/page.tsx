import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISONS } from "@/lib/comparisons";
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";

/**
 * /ar/compare — Comparison index page (AR).
 *
 * SEO-GEO-4 (2026-09-08): Arabic mirror of /compare — lists every
 * bilingual comparison from COMPARISONS with reciprocal hreflang.
 */
export const metadata: Metadata = {
  // No brand suffix — the /ar layout template appends exactly one "— Alkemos".
  title: "Alkemos مقابل المنافسين — مقارنات صادقة بالأرقام",
  description:
    // P0 SEO audit (2026-09-30): Cronometer joined the comparison set.
    "مقارنات تفصيلية بين Alkemos و MyFitnessPal و Freeletics و ExRx.net و Cronometer: الميزات والأسعار وعمق المحتوى والمدرب الذكي واللغات — مع حكم صريح لكل مقارنة.",
  alternates: {
    canonical: "https://alkemos.com/ar/compare",
    languages: {
      en: "https://alkemos.com/compare",
      ar: "https://alkemos.com/ar/compare",
      "x-default": "https://alkemos.com/compare",
    },
  },
  openGraph: {
    title: "Alkemos مقابل المنافسين — مقارنات صادقة | Alkemos",
    description:
      "جداول الميزات والأسعار وعمق المحتوى: Alkemos مقابل MyFitnessPal و Freeletics و ExRx.net و Cronometer.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/compare",
    // Phase 216 (P2-1 — deep-audit confirmed-7): the openGraph block had
    // no images (replace-not-inherit) and the twitter card was "summary"
    // (which ignores images) — pin the home card + upgrade to
    // summary_large_image so the 1200×630 asset actually shows.
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "منصة Alkemos الرياضية الشاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default function ArabicCompareIndexPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "المقارنات", url: "/ar/compare" },
  ]);
  const itemListSchema = getItemListSchema({
    name: "مقارنات منصة Alkemos — Alkemos",
    description:
      "كل مقارنات Alkemos مع المنافسين: الميزات والأسعار وعمق المحتوى والمدرب الذكي واللغات.",
    items: COMPARISONS.map((c) => ({
      name: c.titleAr,
      url: `/ar/compare/${c.slug}`,
    })),
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]" dir="rtl">
      <SiteHeader variant="landing" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />
      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <nav className="mb-4 text-sm text-muted-foreground" aria-label="مسار التنقل">
          <Link href="/ar" className="hover:underline">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">المقارنات</span>
        </nav>

        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Alkemos مقابل المنافسين
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            مقارنات صادقة بندًا بند — الأسعار، عمق المحتوى، التدريب بالذكاء
            الاصطناعي، ودعم اللغات. البيانات موثقة من الصفحات العلنية
            للمنافسين.
          </p>
        </header>

        <div className="mt-10 space-y-4">
        <div className="mt-6 flex justify-center">
          <ShareButtons path="/compare" title="Alkemos مقابل المنافسين — Alkemos" />
        </div>

          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/ar/compare/${c.slug}`}
              className="marble-card group flex items-center justify-between gap-4 p-6 transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                  {c.h1Ar}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm font-normal text-[var(--muted-foreground)]">
                  {c.introAr}
                </p>
              </div>
              <span className="chrome-text shrink-0 text-2xl font-semibold" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
          English version:{" "}
          <Link href="/compare" className="underline hover:text-[var(--text)]">
            Comparisons
          </Link>
        </p>
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}