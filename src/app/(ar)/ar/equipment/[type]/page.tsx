import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  EQUIPMENT_HUBS,
  getEquipmentHubBySlug,
  getExercisesForEquipmentHub,
} from "@/lib/hub-collections";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/lib/exercises";
import { getHubDepth } from "@/lib/hub-depth";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HubGuideSection, HubFaqSection } from "@/components/hubs/HubDepth";
import {
  HUB_INITIAL_EXERCISES,
  localizedMuscleList,
  type HubExerciseCard,
} from "@/components/hubs/hub-exercises-shared";
import { ShowMoreExercises } from "@/components/hubs/ShowMoreExercises";
import { getItemListSchema, getBreadcrumbSchema, jsonLd, stripTrailingBrandForArTemplate } from "@/lib/seo";

/**
 * /ar/equipment/[type] — Arabic mirror of /equipment/[type].
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return EQUIPMENT_HUBS.map((h) => ({ type: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const hub = getEquipmentHubBySlug(type);
  if (!hub) {
    return {
      title: "المعدات غير موجودة — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/equipment/${hub.slug}`;
  return {
    // SEO-GEO-4: strip the trailing brand — the /ar template appends "— Alkemos".
    title: stripTrailingBrandForArTemplate(hub.titleAr),
    description: hub.descriptionAr,
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/equipment/${hub.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/equipment/${hub.slug}`,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: hub.titleAr,
      description: hub.descriptionAr,
      siteName: "Alkemos",
      locale: "ar_EG",
      // Phase 216 (P2-1 discovery beyond the audit list — the AR twin of
      // a WIRED EN surface, live-verified serving no og:image + a
      // "summary" card): the home card is pinned + the card upgraded to
      // summary_large_image, mirroring the EN equipment hubs.
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
}

export default async function ArabicEquipmentHubPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const hub = getEquipmentHubBySlug(type);
  if (!hub) notFound();

  const exercises = getExercisesForEquipmentHub(hub);
  // Phase 216 (P2-3 — deep-audit confirmed-9): أول HUB_INITIAL_EXERCISES
  // بطاقة تُرندر من الخادم والباقي عبر جزيرة العميل — نفس قانون النسخة
  // الإنجليزية (كل تمرين يبقى متاحًا وItemList يبقى بحد الـ50).
  const visibleExercises = exercises.slice(0, HUB_INITIAL_EXERCISES);
  const moreExercises: HubExerciseCard[] = exercises
    .slice(HUB_INITIAL_EXERCISES)
    .map((ex) => {
      const catLabel = CATEGORY_LABELS[ex.category];
      const lvlLabel = LEVEL_LABELS[ex.level];
      return {
        href: `/ar/exercises/${ex.slug}`,
        name: ex.nameAr,
        chip: catLabel.ar,
        levelLabel: lvlLabel.ar,
        levelColor: lvlLabel.color,
        muscles: localizedMuscleList(ex.primaryMuscles, "ar"),
      };
    });
  // Phase SEO-GEO-5.2: §6.3 template items 4+5 — depth content for every
  // populated equipment hub (none is exempt — empty library family).
  const depth = getHubDepth("equipment", hub.slug);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "التمارين", url: "/ar/exercises" },
    { name: hub.h1Ar, url: `/ar/equipment/${hub.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: `${hub.h1Ar} — Alkemos`,
    description: hub.descriptionAr,
    items: exercises.slice(0, 50).map((e) => ({
      name: e.nameAr,
      url: `/ar/exercises/${e.slug}`,
    })),
  });

  return (
    <>
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />

      <nav className="mb-4 text-sm text-muted-foreground" aria-label="مسار التنقل">
        <Link href="/ar" className="hover:underline">الرئيسية</Link>
        <span className="mx-2">/</span>
        <Link href="/ar/exercises" className="hover:underline">التمارين</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{hub.h1Ar}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{hub.h1Ar}</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {hub.introAr}
        </p>
      </header>

      <div className="mb-8">
        <ShareButtons path={`/equipment/${hub.slug}`} title={hub.h1Ar} />
      </div>

      {depth && <HubGuideSection depth={depth} lang="ar" title="دليل التدريب" />}

      <section aria-label="كل التمارين" className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">كل التمارين</h2>
          <span className="text-sm text-muted-foreground">{exercises.length} تمرين</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleExercises.map((ex) => {
            const catLabel = CATEGORY_LABELS[ex.category];
            const lvlLabel = LEVEL_LABELS[ex.level];
            return (
              <li key={ex.slug}>
                <Link
                  href={`/ar/exercises/${ex.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                >
                  <div className="font-semibold text-foreground">{ex.nameAr}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {catLabel.ar}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-white"
                      style={{ background: lvlLabel.color }}
                    >
                      {lvlLabel.ar}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    العضلات الأساسية: {ex.primaryMuscles.join("، ")}
                  </div>
                </Link>
              </li>
            );
          })}
          <ShowMoreExercises cards={moreExercises} lang="ar" />
        </ul>
      </section>

      <section aria-label="حسب المجموعة العضلية" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          {hub.h1Ar} حسب المجموعة العضلية
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => {
            const count = exercises.filter((e) => e.category === key).length;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                href={`/ar/muscles/${key}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {lbl.ar} <span className="text-muted-foreground">({count})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="معدات أخرى" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">معدات أخرى</h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
            <Link
              key={h.slug}
              href={`/ar/equipment/${h.slug}`}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
            >
              {h.h1Ar}
            </Link>
          ))}
        </div>
      </section>

      {depth && <HubFaqSection depth={depth} lang="ar" title="أسئلة شائعة" />}

      <section aria-label="برامج التمارين" className="rounded-lg bg-muted/50 p-6">
        <h2 className="text-xl font-semibold mb-3">برامج التمارين</h2>
        <p className="text-sm text-muted-foreground mb-4">
          برامج تدريب جاهزة تناسب هذه المعدات — من المبتدئ إلى المتقدم.
        </p>
        <Link
          href="/ar/programs"
          className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          تصفّح كل البرامج
        </Link>
      </section>
      </main>


        {/* Access-point fix (2026-09-14): shared marble footer — this
            public page now carries the same persistent link grid as the
            homepage (SiteFooter component). */}
      <SiteFooter />
    </>
  );
}
