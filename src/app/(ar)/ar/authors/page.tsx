import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AUTHORS } from "@/lib/authors";
import { getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /ar/authors — Arabic mirror of /authors (author index).
 *
 * SEO/GEO audit fix (2026-09-28): mirrors the EN index — the author
 * profile pages' breadcrumb («الكُتّاب») needed a real hub instead of a
 * self-link/404, and the hreflang pair needs both sides to exist.
 * Data-driven from src/lib/authors.ts (AUTHORS registry).
 */

const SITE_URL = "https://alkemos.com";

export const metadata: Metadata = {
  // The /ar layout template appends «— Alkemos» exactly once.
  title: "الكُتّاب والمراجعون",
  description:
    "الكُتّاب والمراجعون خلف محتوى Alkemos: مدربون وأخصائيو تغذية معتمدون يكتبون ويراجعون كل تمرين وصفحة طعام ومقال على المنصة.",
  alternates: {
    canonical: `${SITE_URL}/ar/authors`,
    languages: {
      en: `${SITE_URL}/authors`,
      ar: `${SITE_URL}/ar/authors`,
      "x-default": `${SITE_URL}/authors`,
    },
  },
  openGraph: {
    title: "الكُتّاب والمراجعون | Alkemos",
    description:
      "مدربون وأخصائيو تغذية معتمدون يكتبون ويراجعون كل تمرين وصفحة طعام ومقال على Alkemos.",
    url: `${SITE_URL}/ar/authors`,
    type: "website",
    siteName: "Alkemos",
    locale: "ar_EG",
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — منصة اللياقة والتغذية الذكية المتكاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default function ArabicAuthorsIndexPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الكُتّاب", url: "/ar/authors" },
  ]);

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]"
      dir="rtl"
    >
      <SiteHeader variant="landing" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6 md:py-24">
        <nav
          className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
          aria-label="مسار التنقل"
        >
          <Link href="/ar" className="hover:opacity-70">الرئيسية</Link>
          <span>/</span>
          <span className="text-[var(--text)]">الكُتّاب</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          الكُتّاب والمراجعون
        </h1>
        <p className="mt-4 max-w-2xl text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
          {/* CONTENT-AUDIT P1-3 (2026-09-28, audit §1.5): «يكتبه» ادعاء غير
              قابل للدفاع — المكتبة مستوردة ومنسّقة والمدونة آلية بمراجعة
              تحريرية. الادعاء الأصدق: المراجعة والإشراف. */}
          كل تمرين وصفحة طعام وبرنامج ومقال على Alkemos يراجعه ويشرف عليه
          متخصصون حقيقيون. تعرّف على الأشخاص خلف المحتوى — خبرتهم وشهاداتهم
          والمعايير التي يراجعون عليها.
        </p>

        <div className="mt-6">
          <ShareButtons path="/authors" title="الكُتّاب والمراجعون — Alkemos" />
        </div>

        <ul className="mt-12 space-y-6">
          {AUTHORS.map((author) => (
            <li key={author.slug}>
              <Link
                href={`/ar/authors/${author.slug}`}
                className="marble-card flex flex-col gap-6 p-6 transition-opacity hover:opacity-90 sm:flex-row sm:items-center"
              >
                {author.avatarUrl && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--edge)] bg-[var(--tint)]">
                    <Image
                      src={author.avatarUrl}
                      alt={author.nameAr}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {author.nameAr}
                  </h2>
                  <p className="mt-1 text-sm font-normal text-[var(--muted-2)]">
                    {author.jobTitleAr}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                    {author.bioAr}
                  </p>
                  <p className="mt-3 text-sm font-medium text-[var(--text)]">
                    عرض الملف الشخصي ←
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
