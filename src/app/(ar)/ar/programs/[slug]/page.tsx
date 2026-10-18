import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProgramBySlug, WORKOUT_PROGRAMS } from "@/lib/workout-programs";
import { getExerciseMinisBySlugs } from "@/lib/exercises";
import { getBreadcrumbSchema, getFAQSchema, jsonLd, stripTrailingBrandForArTemplate } from "@/lib/seo";
import ProgramDetailClient from "@/app/(en)/programs/[slug]/ProgramDetailClient";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /programs/[slug].
 *
 * Own Arabic metadata (canonical /ar/programs/[slug] + hreflang pair) and
 * renders the SAME ProgramDetailClient with lang="ar" forced — identical
 * training content, forced Arabic, RTL via src/app/ar/layout.tsx.
 * Same pattern as the /ar/blog/[slug] mirror.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    return {
      title: "البرنامج غير موجود — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  // SEO-GEO-4: strip the trailing brand — the /ar template appends "— Alkemos".
  const title = stripTrailingBrandForArTemplate(`${program.nameAr} — برنامج تدريب | Alkemos`);
  const ogTitle = `${program.nameAr} — برنامج تدريب | Alkemos`;
  // SEO-P2-10 (2026-10-01, SEO audit item 10): the trailing level/location
  // clause pushed every page to 187–217 chars (SERP truncation). The
  // level/location facts already live in descriptionAr, the title, the H1
  // and the page body — name+description now lands at 119–155 chars for
  // all seven programs (≤160 law).
  const description = `${program.nameAr}: ${program.descriptionAr}`;
  const url = `${SITE_URL}/ar/programs/${program.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/ar/programs/${program.slug}`,
      languages: {
        en: `${SITE_URL}/programs/${program.slug}`,
        ar: url,
        "x-default": `${SITE_URL}/programs/${program.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: ogTitle,
      description,
      // SOCIAL-OG-2 (2026-09-28): dims were declared 1200×630 while the
      // served file is a 768×768 square (declared≠fetched can make
      // platforms reject the preview). Measured dims + webp type + ?v=3
      // cache-bust for stale platform thumbnail caches.
      images: [{ url: `${program.image}?v=3`, width: 768, height: 768, type: "image/webp" }],
      siteName: "Alkemos",
      locale: "ar_EG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${program.image}?v=3`],
    },
  };
}

export function generateStaticParams() {
  return WORKOUT_PROGRAMS.map((p) => ({ slug: p.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  // A-8 (Phase 141): real 404 instead of a 200 + noindex soft-404 —
  // protects crawl budget and cleans Search Console coverage reports.
  // (Blog detail pages already did this; the exercise page even
  // imported notFound without ever calling it.)
  if (!program) notFound();

  const breadcrumbSchema = program
    ? getBreadcrumbSchema([
        // P3-9 (deep-audit confirmed 15, Phase 217): full AR breadcrumb —
        // "Home" + "/" were EN leftovers on an Arabic page (copy-paste).
        { name: "الرئيسية", url: "/ar" },
        { name: "برامج التدريب", url: "/ar/programs" },
        { name: program.nameAr, url: `/ar/programs/${program.slug}` },
      ])
    : null;

  // PRIORITY-PAGES-2 (2026-10-19, audit §D-2): the per-program FAQ array
  // as FAQPage JSON-LD — Arabic-first on the AR mirror (the same
  // single-source pattern as the evo AR layout's EVO_FAQ.ar).
  const faqSchema =
    program?.faq && program.faq.length > 0
      ? getFAQSchema(program.faq.map((f) => ({ q: f.q.ar, a: f.a.ar })))
      : null;

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
        />
      )}
      <ProgramDetailClient
        program={program ?? null}
        exerciseIndex={
          program
            ? getExerciseMinisBySlugs(
                program.days.flatMap((d) => d.exercises.map((ex) => ex.exerciseSlug)),
              )
            : {}
        }
        lang="ar"
      />
    </>
  );
}
