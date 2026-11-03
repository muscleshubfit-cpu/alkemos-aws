import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExerciseBySlug, getRelatedExercises } from "@/lib/exercises";
import { getExerciseImages } from "@/lib/exercise-images";
import { getExerciseEnrichment } from "@/lib/exercises-enrichment";
import {
  getMuscleHubByCategory,
  getEquipmentHubByEquipment,
  type HubLinkMini,
} from "@/lib/hub-collections";
import { getHowToSchema, getBreadcrumbSchema, getReviewedWebPageSchema, jsonLd } from "@/lib/seo";
import { CATEGORY_LABELS, EQUIPMENT_LABELS, LEVEL_LABELS } from "@/lib/exercises";
import ExerciseDetailClient from "./ExerciseDetailClient";

/**
 * Server component for exercise detail page.
 *
 * C22 fix: previously this was a "use client" component, so it could
 * not export generateMetadata. All 868 exercise pages shared the
 * same generic title from exercises/layout.tsx. Now the server
 * component generates per-page metadata + JSON-LD schemas, then
 * renders the client component for interactivity.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);

  if (!exercise) {
    return {
      title: "Exercise Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }

  // SEO title ceiling (comprehensive audit 2026-11-04): the site's
  // measured healthy range caps <title> at 75 chars. The always-on
  // "| Alkemos" suffix pushed 53 of 868 long-name exercises past it
  // (worst case 97). Three tiers keep EVERY page ≤75 without ever
  // editing the exercise's own name: short names keep the brand suffix
  // (blog-article titles carry none — dropping it is the site's own
  // convention), 30-39-char names drop just the suffix, and the 10
  // ultra-long names (43-50 chars) shorten the descriptor instead.
  const titleBase = `${exercise.nameEn} — Proper Form & Instructions`;
  const title =
    titleBase.length + 10 <= 75
      ? `${titleBase} | Alkemos`
      : titleBase.length <= 75
        ? titleBase
        : `${exercise.nameEn} — Form Guide`;
  // SEO-P2-10 (2026-10-01, SEO audit item 10): the long-name tail
  // (e.g. "Standing Dumbbell Straight-Arm Front Delt Raise Above Head")
  // pushed 2 of 868 pages to 163–166 chars. Shorter lead verb phrase
  // ("Learn proper form for") keeps EVERY page ≤160 while preserving the
  // four data fields (muscles / equipment / level).
  const description = `Learn proper form for ${exercise.nameEn}. Target muscles: ${exercise.primaryMuscles.join(", ")}. Equipment: ${EQUIPMENT_LABELS[exercise.equipment].en}. Level: ${LEVEL_LABELS[exercise.level].en}.`;
  const url = `https://alkemos.com/exercises/${exercise.slug}`;

  // SOCIAL-OG-EX (2026-09-22, owner report «المربع الأزرق يظهر بدل صورة
  // الصفحة»): cover-first share image — the exercise's REAL self-hosted
  // photo (start position, 0.webp), mirroring the blog SOCIAL-OG-248 law.
  // The static file is served in <100ms with immutable caching (no cold
  // function on the crawler path) and averages 16KB — inside every
  // messenger's fetch budget. Absolute URL: social crawlers (Facebook/
  // WhatsApp) never resolve relative og:image against metadataBase
  // reliably. The branded family card is the FALLBACK only for an
  // exercise without photos (imageKey empty) — never the default.
  const primaryPhoto = getExerciseImages(exercise.imageKey)[0];
  // SOCIAL-OG-2 (2026-09-28, «المربع الأزرق» follow-up): (a) `?v=3` cache-
  // bust on the share image URL — platforms (Facebook/WhatsApp) that
  // scraped the page during an earlier broken-OG era keep serving the
  // remembered broken thumbnail for up to 30 days; a fresh image URL
  // forces a fresh fetch at the next scrape. (b) width/height/type now
  // declared (640×427 webp — measured, matches the served file) so
  // crawlers accept the image without a second HEAD probe.
  const shareImage = primaryPhoto
    ? {
        url: `https://alkemos.com${primaryPhoto}?v=3`,
        width: 640,
        height: 427,
        type: "image/webp",
        alt: title,
      }
    : {
        url: "https://alkemos.com/images/og/og-exercises-en.png?v=3",
        width: 1200,
        height: 630,
        alt: "Alkemos Exercise Library",
      };

  return {
    title,
    description,
    alternates: {
      canonical: url,
      // hreflang pair (2026-09-01): reciprocal declaration with the AR
      // mirror /ar/exercises/[slug] (which declares the same pair).
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/exercises/${exercise.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Alkemos",
      locale: "en_US",
      // SOCIAL-OG-EX: real exercise photo (cover-first) — see shareImage
      // above for the full rationale. Fallback: branded family card.
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage.url],
    },
  };
}

export async function generateStaticParams() {
  // Pre-generate all 868 exercise slugs at build time for SSG
  const { EXERCISES } = await import("@/lib/exercises");
  return EXERCISES.map((ex) => ({ slug: ex.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug);

  // A-8 (Phase 141): real 404 instead of a 200 + noindex soft-404 —
  // protects crawl budget and cleans Search Console coverage reports.
  // (Blog detail pages already did this; the exercise page even
  // imported notFound without ever calling it.)
  if (!exercise) notFound();

  // Generate JSON-LD schemas server-side so they're in the initial HTML
  const exerciseSchema = exercise
    ? getHowToSchema({
        name: exercise.nameEn,
        description: `Exercise for ${exercise.primaryMuscles.join(", ")} with ${exercise.equipment}`,
        steps: exercise.instructionsEn,
        tool: [exercise.equipment],
      })
    : null;

  const breadcrumbSchema = exercise
    ? getBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Exercises", url: "/exercises" },
        { name: exercise.nameEn, url: `/exercises/${exercise.slug}` },
      ])
    : null;

  // Phase SEO-GEO-4.5 (§7.1 #6+#7): YMYL E-E-A-T — reviewedBy Person +
  // lastReviewed date on the 868-page instruction library. Additive WebPage
  // node; the HowTo node stays untouched (Google retired its rich results
  // in Sept 2023, but it stays for other engines' understanding).
  const reviewSchema = exercise
    ? getReviewedWebPageSchema({
        url: `https://alkemos.com/exercises/${exercise.slug}`,
        name: `${exercise.nameEn} — Proper Form & Instructions`,
      })
    : null;

  // Phase 155 (SEO-GEO-4.7, §7.1 #11): spoke→hub internal links — every
  // exercise page now links its muscle-group hub and equipment hub
  // (deterministic 1:1 field matches, computed server-side so the
  // server-only hub module stays out of the client bundle).
  const muscleHub = exercise ? getMuscleHubByCategory(exercise.category) : null;
  const equipmentHub = exercise ? getEquipmentHubByEquipment(exercise.equipment) : null;
  const hubLinks: {
    muscle: HubLinkMini | null;
    equipment: HubLinkMini | null;
  } | null = exercise
    ? {
        muscle: muscleHub
          ? { href: `/muscles/${muscleHub.slug}`, labelEn: muscleHub.h1En, labelAr: muscleHub.h1Ar }
          : null,
        equipment: equipmentHub
          ? { href: `/equipment/${equipmentHub.slug}`, labelEn: equipmentHub.h1En, labelAr: equipmentHub.h1Ar }
          : null,
      }
    : null;

  return (
    <>
      {exerciseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(exerciseSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
        />
      )}
      {reviewSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(reviewSchema) }}
        />
      )}
      <ExerciseDetailClient
        exercise={exercise ?? null}
        slug={slug}
        related={exercise ? getRelatedExercises(exercise) : []}
        hubLinks={hubLinks}
        enrichment={exercise ? getExerciseEnrichment(exercise.slug) ?? null : null}
      />
    </>
  );
}
