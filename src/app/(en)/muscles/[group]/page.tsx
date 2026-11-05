import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MUSCLE_HUBS,
  getMuscleHubBySlug,
  getExercisesForMuscleHub,
} from "@/lib/hub-collections";
import { CATEGORY_LABELS, EQUIPMENT_LABELS, LEVEL_LABELS } from "@/lib/exercises";
import { getHubDepth } from "@/lib/hub-depth";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HubGuideSection, HubFaqSection } from "@/components/hubs/HubDepth";
import {
  HUB_INITIAL_EXERCISES,
  type HubExerciseCard,
} from "@/components/hubs/hub-exercises-shared";
import { ShowMoreExercises } from "@/components/hubs/ShowMoreExercises";
import { getItemListSchema, getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /muscles/[group] — Muscle-group hub page (EN).
 *
 * SEO/GEO master plan Phase SEO-GEO-1 (2026-09-08): every major muscle group
 * gets a dedicated hub page that aggregates its exercises, ships an ItemList
 * schema so AI answer engines can parse the collection, and links internally
 * to every individual exercise detail page (boosting their crawl depth).
 *
 * Bilingual mirror: /ar/muscles/[group]. Each page declares reciprocal
 * hreflang so Google indexes the pair correctly.
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return MUSCLE_HUBS.map((h) => ({ group: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group } = await params;
  const hub = getMuscleHubBySlug(group);
  if (!hub) {
    return {
      title: "Muscle Group Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/muscles/${hub.slug}`;
  return {
    title: hub.titleEn,
    description: hub.descriptionEn,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/muscles/${hub.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: hub.titleEn,
      description: hub.descriptionEn,
      siteName: "Alkemos",
      locale: "en_US",
      // PHASE 187 (deep-audit P0-2): og:image for the muscle-hub surface —
      // static branded family card (design mirrors /api/og-image).
      images: [
        {
          url: "/images/og/og-home-en.png?v=4",
          width: 1200,
          height: 630,
          alt: "Alkemos Muscle Group Guides",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: hub.titleEn,
      description: hub.descriptionEn,
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function MuscleHubPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const hub = getMuscleHubBySlug(group);
  if (!hub) notFound();

  const exercises = getExercisesForMuscleHub(hub);
  // Phase 216 (P2-3 — deep-audit confirmed-9): render the first
  // HUB_INITIAL_EXERCISES cards server-side; the rest ride a compact
  // client island revealed on click (every exercise stays reachable,
  // the ItemList schema keeps its top-50 slice).
  const visibleExercises = exercises.slice(0, HUB_INITIAL_EXERCISES);
  const moreExercises: HubExerciseCard[] = exercises
    .slice(HUB_INITIAL_EXERCISES)
    .map((ex) => {
      const eqLabel = EQUIPMENT_LABELS[ex.equipment];
      const lvlLabel = LEVEL_LABELS[ex.level];
      return {
        href: `/exercises/${ex.slug}`,
        name: ex.nameEn,
        chip: eqLabel.en,
        levelLabel: lvlLabel.en,
        levelColor: lvlLabel.color,
        muscles: ex.primaryMuscles.join(", "),
      };
    });
  const label = CATEGORY_LABELS[hub.category];
  // Phase SEO-GEO-5.2: §6.3 template items 4+5 (guide + FAQ) — depth
  // content exists for every populated muscle hub (cardio is exempt).
  const depth = getHubDepth("muscle", hub.slug);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Exercises", url: "/exercises" },
    { name: `${label.en} Exercises`, url: `/muscles/${hub.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: `${label.en} Exercises — Alkemos`,
    description: hub.descriptionEn,
    items: exercises.slice(0, 50).map((e) => ({
      name: e.nameEn,
      url: `/exercises/${e.slug}`,
    })),
  });

  return (
    <>
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />

      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/exercises" className="hover:underline">Exercises</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{label.en}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{hub.h1En}</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {hub.introEn}
        </p>
      </header>

      <div className="mb-8">
        <ShareButtons path={`/muscles/${group}`} title={hub.h1En} />
      </div>

      {depth && <HubGuideSection depth={depth} lang="en" title="Training Guide" />}

      <section aria-label={`All ${label.en} exercises`} className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">
            All {label.en} Exercises
          </h2>
          <span className="text-sm text-muted-foreground">
            {exercises.length} exercises
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleExercises.map((ex) => {
            const eqLabel = EQUIPMENT_LABELS[ex.equipment];
            const lvlLabel = LEVEL_LABELS[ex.level];
            return (
              <li key={ex.slug}>
                <Link
                  href={`/exercises/${ex.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                >
                  <div className="font-semibold text-foreground">{ex.nameEn}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {eqLabel.en}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-white"
                      style={{ background: lvlLabel.color }}
                    >
                      {lvlLabel.en}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Primary: {ex.primaryMuscles.join(", ")}
                  </div>
                </Link>
              </li>
            );
          })}
          <ShowMoreExercises cards={moreExercises} lang="en" />
        </ul>
      </section>

      <section aria-label="Browse by equipment" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          {label.en} Exercises by Equipment
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EQUIPMENT_LABELS).map(([key, lbl]) => {
            const count = exercises.filter((e) => e.equipment === key).length;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                href={`/equipment/${key}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {lbl.en} <span className="text-muted-foreground">({count})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Related muscle groups" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          Other Muscle Groups
        </h2>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
            <Link
              key={h.slug}
              href={`/muscles/${h.slug}`}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
            >
              {CATEGORY_LABELS[h.category].en}
            </Link>
          ))}
        </div>
      </section>

      {depth && <HubFaqSection depth={depth} lang="en" title="Frequently Asked Questions" />}

      <section aria-label="Free fitness tools" className="rounded-lg bg-muted/50 p-6">
        <h2 className="text-xl font-semibold mb-3">Free Fitness Calculators</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Plan your training with our free tools: calorie needs, BMI, macros, body fat,
          and water intake.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/tools/calorie-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">Calorie Calculator</Link>
          <Link href="/tools/macro-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">Macro Calculator</Link>
          <Link href="/tools/bmi-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">BMI Calculator</Link>
          <Link href="/tools/body-fat-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">Body Fat Calculator</Link>
          {/* Intent-map audit (2026-09-14, item 9): the training family is
              one network — Exercises ↔ Muscles ↔ Equipment ↔ Programs. */}
          <Link href="/programs" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">Ready Workout Programs</Link>
        </div>
      </section>
      </main>


        {/* Access-point fix (2026-09-14): shared marble footer — this
            public page now carries the same persistent link grid as the
            homepage (SiteFooter component). */}
      <SiteFooter />
    </>
  );
}
