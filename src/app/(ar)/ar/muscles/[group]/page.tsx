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
  localizedMuscleList,
  type HubExerciseCard,
} from "@/components/hubs/hub-exercises-shared";
import { ShowMoreExercises } from "@/components/hubs/ShowMoreExercises";
import { getItemListSchema, getBreadcrumbSchema, jsonLd, stripTrailingBrandForArTemplate } from "@/lib/seo";

/**
 * /ar/muscles/[group] — Arabic mirror of /muscles/[group].
 *
 * SEO/GEO master plan Phase SEO-GEO-1 (2026-09-08): the Arabic muscle-group
 * hub. Targets Arabic long-tail queries like "تمارين الصدر" and
 * "تمارين البطن للمبتدئين" — keywords with substantial volume and
 * negligible organic competition.
 *
 * hreflang pair is reciprocal with the EN mirror.
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
      title: "المجموعة العضلية غير موجودة — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/muscles/${hub.slug}`;
  return {
    // SEO-GEO-4: strip the trailing brand — the /ar template appends "— Alkemos".
    title: stripTrailingBrandForArTemplate(hub.titleAr),
    description: hub.descriptionAr,
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/muscles/${hub.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/muscles/${hub.slug}`,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: hub.titleAr,
      description: hub.descriptionAr,
      siteName: "Alkemos",
      locale: "ar_EG",
      // PHASE 187 (deep-audit P0-2): og:image for the AR muscle-hub
      // surface — static branded family card (design mirrors
      // /api/og-image).
      images: [
        {
          url: "/images/og/og-home-ar.png?v=4",
          width: 1200,
          height: 630,
          alt: "أدلة مجموعات العضلات من Alkemos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: hub.titleAr,
      description: hub.descriptionAr,
      images: ["/images/og/og-home-ar.png?v=4"],
    },
  };
}

export default async function ArabicMuscleHubPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const hub = getMuscleHubBySlug(group);
  if (!hub) notFound();

  const exercises = getExercisesForMuscleHub(hub);
  // Phase 216 (P2-3 — deep-audit confirmed-9): أول HUB_INITIAL_EXERCISES
  // بطاقة تُرندر من الخادم والباقي عبر جزيرة العميل — نفس قانون النسخة
  // الإنجليزية (كل تمرين يبقى متاحًا وItemList يبقى بحد الـ50).
  const visibleExercises = exercises.slice(0, HUB_INITIAL_EXERCISES);
  const moreExercises: HubExerciseCard[] = exercises
    .slice(HUB_INITIAL_EXERCISES)
    .map((ex) => {
      const eqLabel = EQUIPMENT_LABELS[ex.equipment];
      const lvlLabel = LEVEL_LABELS[ex.level];
      return {
        href: `/ar/exercises/${ex.slug}`,
        name: ex.nameAr,
        chip: eqLabel.ar,
        levelLabel: lvlLabel.ar,
        levelColor: lvlLabel.color,
        muscles: localizedMuscleList(ex.primaryMuscles, "ar"),
      };
    });
  const label = CATEGORY_LABELS[hub.category];
  // Phase SEO-GEO-5.2: §6.3 template items 4+5 — depth content for every
  // populated muscle hub (cardio is exempt — empty library family).
  const depth = getHubDepth("muscle", hub.slug);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "التمارين", url: "/ar/exercises" },
    { name: `تمارين ${label.ar}`, url: `/ar/muscles/${hub.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: `تمارين ${label.ar} — Alkemos`,
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
        <span className="text-foreground font-medium">{label.ar}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{hub.h1Ar}</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {hub.introAr}
        </p>
      </header>

      <div className="mb-8">
        <ShareButtons path={`/muscles/${group}`} title={hub.h1Ar} />
      </div>

      {depth && <HubGuideSection depth={depth} lang="ar" title="دليل التدريب" />}

      <section aria-label={`جميع تمارين ${label.ar}`} className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">
            جميع تمارين {label.ar}
          </h2>
          <span className="text-sm text-muted-foreground">
            {exercises.length} تمرين
          </span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleExercises.map((ex) => {
            const eqLabel = EQUIPMENT_LABELS[ex.equipment];
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
                      {eqLabel.ar}
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

      <section aria-label="حسب المعدات" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          تمارين {label.ar} حسب المعدات
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EQUIPMENT_LABELS).map(([key, lbl]) => {
            const count = exercises.filter((e) => e.equipment === key).length;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                href={`/ar/equipment/${key}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {lbl.ar} <span className="text-muted-foreground">({count})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="مجموعات عضلية أخرى" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          مجموعات عضلية أخرى
        </h2>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
            <Link
              key={h.slug}
              href={`/ar/muscles/${h.slug}`}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
            >
              {CATEGORY_LABELS[h.category].ar}
            </Link>
          ))}
        </div>
      </section>

      {depth && <HubFaqSection depth={depth} lang="ar" title="أسئلة شائعة" />}

      <section aria-label="حاسبات مجانية" className="rounded-lg bg-muted/50 p-6">
        <h2 className="text-xl font-semibold mb-3">حاسبات اللياقة المجانية</h2>
        <p className="text-sm text-muted-foreground mb-4">
          خطّط تدريبك بأدواتنا المجانية: السعرات، BMI، الماكروز، نسبة الدهون، والماء.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/ar/tools/calorie-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">حاسبة السعرات</Link>
          <Link href="/ar/tools/macro-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">حاسبة الماكروز</Link>
          <Link href="/ar/tools/bmi-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">حاسبة BMI</Link>
          <Link href="/ar/tools/body-fat-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">حاسبة نسبة الدهون</Link>
          {/* تدقيق خريطة النوايا (2026-09-14، بند 9): عائلة التدريب شبكة واحدة —
              تمارين ↔ عضلات ↔ معدات ↔ برامج. */}
          <Link href="/ar/programs" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">برامج تدريب جاهزة</Link>
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
