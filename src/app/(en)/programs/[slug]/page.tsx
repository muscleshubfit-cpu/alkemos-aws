import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProgramBySlug } from "@/lib/workout-programs";
import { getExerciseMinisBySlugs } from "@/lib/exercises";
import { getBreadcrumbSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import ProgramDetailClient from "./ProgramDetailClient";

/**
 * Server component for program detail page.
 *
 * C22 fix: previously a "use client" component — could not export
 * generateMetadata. All program pages shared the same generic title
 * from programs/layout.tsx. Now generates per-page metadata +
 * JSON-LD Breadcrumb schema server-side.
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
      title: "Program Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  const title = `${program.nameEn} — Workout Program | Alkemos`;
  // Content-strategy v1: raw enum values ("home-equipment", "fat-loss")
  // leaked into the SERP snippet — map through the canonical label maps.
  // SEO-P2-10 (2026-10-01, SEO audit item 10): the trailing goal/location
  // clause pushed every page to 183–220 chars (SERP truncation). The
  // schedule/goal/location facts already live in descriptionEn itself, the
  // title, the H1 and the page body — name+description now lands at
  // 121–151 chars for all seven programs (≤160 law).
  const description = `${program.nameEn}: ${program.descriptionEn}`;
  const url = `https://alkemos.com/programs/${program.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      // HREFLANG RECIPROCITY FIX (Phase 140 audit): the AR mirror
      // /ar/programs/[slug] has declared the full cluster since it was
      // built, but THIS side never reciprocated — a one-sided declaration
      // Google ignores. Same real-translation pattern as exercises/[slug]
      // and foods/[slug] (both reciprocal, both verified live).
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/programs/${program.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      // SOCIAL-OG-2 (2026-09-28): dims were declared 1200×630 while the
      // served file is a 768×768 square — platforms validating declared
      // vs fetched dims can reject the preview (blue/blank card). Now:
      // measured dims + explicit webp type + ?v=3 cache-bust so the
      // stale broken thumbnails cached at FB/WhatsApp are re-fetched.
      images: [{ url: `${program.image}?v=3`, width: 768, height: 768, type: "image/webp" }],
      siteName: "Alkemos",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${program.image}?v=3`],
    },
  };
}

export async function generateStaticParams() {
  // Pre-generate all program slugs at build time (small dataset — ~7 programs)
  const { WORKOUT_PROGRAMS } = await import("@/lib/workout-programs");
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
        { name: "Home", url: "/" },
        { name: "Programs", url: "/programs" },
        { name: program.nameEn, url: `/programs/${program.slug}` },
      ])
    : null;

  // PRIORITY-PAGES-2 (2026-10-19, audit §D-2): the per-program FAQ array
  // (workout-programs.ts) as FAQPage JSON-LD — same single-source pattern
  // as the evo/coaching layouts (EVO_FAQ, coaching-faq). English-first on
  // the EN canonical so this URL's questions are quoted in English.
  const faqSchema =
    program?.faq && program.faq.length > 0
      ? getFAQSchema(program.faq.map((f) => ({ q: f.q.en, a: f.a.en })))
      : null;

  // Resolve the program's exercise slugs into mini records server-side
  // (bundle law 2026-09-05) so ProgramDetailClient needs no data import.
  const exerciseIndex = program
    ? getExerciseMinisBySlugs(
        program.days.flatMap((d) => d.exercises.map((ex) => ex.exerciseSlug)),
      )
    : {};

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
        exerciseIndex={exerciseIndex}
      />
    </>
  );
}
