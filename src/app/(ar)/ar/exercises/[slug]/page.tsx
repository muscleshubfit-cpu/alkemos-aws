import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExerciseBySlug, getRelatedExercises, EXERCISES, EQUIPMENT_LABELS, LEVEL_LABELS } from "@/lib/exercises";
import { MUSCLE_LABELS } from "@/lib/exercises-shared";
import { getExerciseImages } from "@/lib/exercise-images";
import { getExerciseEnrichment } from "@/lib/exercises-enrichment";
import {
  getMuscleHubByCategory,
  getEquipmentHubByEquipment,
  type HubLinkMini,
} from "@/lib/hub-collections";
import { getHowToSchema, getBreadcrumbSchema, getReviewedWebPageSchema, jsonLd } from "@/lib/seo";
import ExerciseDetailClient from "@/app/(en)/exercises/[slug]/ExerciseDetailClient";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /exercises/[slug] — SEO 404 FIX (2026-09-01).
 *
 * Previously /ar/exercises/<slug> returned a hard 404 while the Arabic
 * listing page (and the EN mirror) linked into it. This server component
 * resolves the SAME bilingual library row (src/lib/exercises.ts, 868
 * exercises with native nameAr/instructionsAr/tipsAr fields — the same
 * data layer that powers the EN pages; no separate Supabase fetch is
 * needed) and renders it fully in Arabic.
 *
 * Own Arabic metadata: canonical /ar/exercises/[slug] + hreflang pair +
 * og:locale ar_EG — the exact pattern of /ar/programs/[slug].
 * generateStaticParams pre-builds all 868 Arabic pages (SSG parity with
 * the EN route) so crawlers always get instant 200s.
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
      title: "التمرين غير موجود",
      robots: { index: false, follow: false },
    };
  }

  // NOTE: no "| Alkemos" suffix — the /ar layout title template appends
  // the brand automatically (avoids "— Alkemos — Alkemos").
  // PHASE SEO-GEO-7 (2026-09-13): nameAr is now a real Arabic name
  // (transliterated movements per law 176 — سكوات/كيرل/بنش برس… — plus
  // translated equipment/positions) and muscles render through
  // MUSCLE_LABELS — zero Latin inside the Arabic meta description.
  const title = `${exercise.nameAr} — طريقة الأداء الصحيحة والخطوات`;
  const description = `تعلّم كيف تؤدي تمرين ${exercise.nameAr} بأداء صحيح. العضلات المستهدفة: ${exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]?.ar ?? m).join("، ")}. المعدات: ${EQUIPMENT_LABELS[exercise.equipment].ar}. المستوى: ${LEVEL_LABELS[exercise.level].ar}.`;
  const url = `${SITE_URL}/ar/exercises/${exercise.slug}`;

  // SOCIAL-OG-EX (2026-09-22, owner report «المربع الأزرق يظهر بدل صورة
  // الصفحة»): cover-first share image — the exercise's REAL self-hosted
  // photo (start position, 0.webp), mirroring the blog SOCIAL-OG-248 law
  // and the EN mirror. Static file <100ms + ~16KB average = inside every
  // crawler/messenger fetch budget; absolute URL because Facebook/
  // WhatsApp do not resolve relative og:image reliably. The branded
  // family card is the FALLBACK only (no photos) — never the default.
  const primaryPhoto = getExerciseImages(exercise.imageKey)[0];
  // SOCIAL-OG-2 (2026-09-28, «المربع الأزرق» follow-up): cache-bust (now v=4, SOCIAL-OG-4)
  // (fresh image URL at the next platform scrape — stale FB/WhatsApp
  // caches keep the old broken thumbnail up to 30 days) + measured
  // 640×427 webp dims/type declared for one-shot crawler acceptance.
  const shareImage = primaryPhoto
    ? {
        url: `${SITE_URL}${primaryPhoto}?v=4`,
        width: 640,
        height: 427,
        type: "image/webp",
        alt: title,
      }
    : {
        url: `${SITE_URL}/images/og/og-home-ar.png?v=4`,
        width: 1200,
        height: 630,
        alt: "مكتبة تمارين Alkemos",
      };

  return {
    title,
    description,
    alternates: {
      canonical: `/ar/exercises/${exercise.slug}`,
      languages: {
        en: `${SITE_URL}/exercises/${exercise.slug}`,
        ar: url,
        "x-default": `${SITE_URL}/exercises/${exercise.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Alkemos",
      locale: "ar_EG",
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
  // SSG parity with /exercises/[slug]: pre-build all 868 Arabic pages.
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

  // JSON-LD in ARABIC — HowTo steps from instructionsAr + Arabic breadcrumb.
  const exerciseSchema = exercise
    ? getHowToSchema({
        name: exercise.nameAr,
        description: `تمرين للعضلات ${exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]?.ar ?? m).join("، ")} باستخدام ${EQUIPMENT_LABELS[exercise.equipment].ar}`,
        steps: exercise.instructionsAr,
        tool: [exercise.equipment],
      })
    : null;

  const breadcrumbSchema = exercise
    ? getBreadcrumbSchema([
        { name: "الرئيسية", url: "/ar" },
        { name: "التمارين", url: "/ar/exercises" },
        { name: exercise.nameAr, url: `/ar/exercises/${exercise.slug}` },
      ])
    : null;

  // Phase SEO-GEO-4.5 (§7.1 #6+#7): YMYL E-E-A-T — same review node as the
  // EN mirror, with the ARABIC page URL so the AR page earns its own signal.
  const reviewSchema = exercise
    ? getReviewedWebPageSchema({
        url: `https://alkemos.com/ar/exercises/${exercise.slug}`,
        name: `${exercise.nameAr} — الأداء الصحيح والتعليمات`,
      })
    : null;

  // Phase 155 (SEO-GEO-4.7, §7.1 #11): spoke→hub internal links — same
  // resolvers as the EN mirror (locale-free hrefs; the client prefixes
  // /ar so the links stay inside the Arabic URL space).
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
        lang="ar"
      />
    </>
  );
}
