import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MembershipPromo } from "@/components/PageBottomPromo";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { listRecipeSummariesAll } from "@/lib/recipes-server";
import { dietHubCopy } from "@/lib/recipes-taxonomy";
import {
  CUISINE_LABELS,
  DIET_LABELS,
  GOAL_LABELS,
  MEAL_TYPE_LABELS,
  RECIPE_CUISINES,
  RECIPE_DIETS,
  RECIPE_GOALS,
  RECIPE_MEAL_TYPES,
  type RecipeLanguage,
} from "@/lib/recipes-shared";
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";

/**
 * RECIPES-TAXONOMY-HUB — the shared server component behind the four
 * hub families (plan §9.1):
 *   /recipes/cuisine/[slug] · /recipes/diet/[slug] ·
 *   /recipes/goal/[slug]  · /recipes/meal/[slug]
 * and their /ar/recipes/… mirrors.
 *
 * DIET hubs explain the RULE behind the listing (dietHubCopy — real
 * value, not auto-list fluff — plan §9.1). Every hub renders the same
 * verified RecipeCard grid + honest empty state until the daily pair
 * fills the family.
 *
 * SCHEMA: BreadcrumbList + ItemList (the foods-lists precedent — plain
 * text intro, no FAQPage fabrication).
 */

export type RecipesTaxonomyKind = "cuisine" | "diet" | "goal" | "meal";

const SITE_URL = "https://alkemos.com";

const KIND_SEGMENT: Record<RecipesTaxonomyKind, string> = {
  cuisine: "cuisine",
  diet: "diet",
  goal: "goal",
  meal: "meal",
};

const KIND_LABEL_EN: Record<RecipesTaxonomyKind, string> = {
  cuisine: "Cuisine",
  diet: "Diet",
  goal: "Goal",
  meal: "Meal",
};

const KIND_LABEL_AR: Record<RecipesTaxonomyKind, string> = {
  cuisine: "المطبخ",
  diet: "النظام الغذائي",
  goal: "الهدف",
  meal: "نوع الوجبة",
};

function validSlug(kind: RecipesTaxonomyKind, slug: string): string | null {
  switch (kind) {
    case "cuisine":
      return (RECIPE_CUISINES as readonly string[]).includes(slug) ? slug : null;
    case "diet":
      return (RECIPE_DIETS as readonly string[]).includes(slug) ? slug : null;
    case "goal":
      return (RECIPE_GOALS as readonly string[]).includes(slug) ? slug : null;
    case "meal":
      return (RECIPE_MEAL_TYPES as readonly string[]).includes(slug) ? slug : null;
  }
}

function axisLabel(kind: RecipesTaxonomyKind, slug: string, lang: RecipeLanguage): string {
  switch (kind) {
    case "cuisine":
      return lang === "ar" ? CUISINE_LABELS[slug as keyof typeof CUISINE_LABELS].ar : CUISINE_LABELS[slug as keyof typeof CUISINE_LABELS].en;
    case "diet":
      return lang === "ar" ? DIET_LABELS[slug as keyof typeof DIET_LABELS].ar : DIET_LABELS[slug as keyof typeof DIET_LABELS].en;
    case "goal":
      return lang === "ar" ? GOAL_LABELS[slug as keyof typeof GOAL_LABELS].ar : GOAL_LABELS[slug as keyof typeof GOAL_LABELS].en;
    case "meal":
      return lang === "ar" ? MEAL_TYPE_LABELS[slug as keyof typeof MEAL_TYPE_LABELS].ar : MEAL_TYPE_LABELS[slug as keyof typeof MEAL_TYPE_LABELS].en;
  }
}

function introCopy(
  kind: RecipesTaxonomyKind,
  slug: string,
  lang: RecipeLanguage,
): string {
  if (kind === "diet") return dietHubCopy(slug as Parameters<typeof dietHubCopy>[0])[lang];
  const isAr = lang === "ar";
  switch (kind) {
    case "cuisine":
      return isAr
        ? `وصفات ${axisLabel(kind, slug, lang)} الصحية — قيم غذائية محسوبة بالجرام لكل مكون، مع أوقات التحضير والطهي ونطاق سعرات واضح لكل حصة.`
        : `Healthy ${axisLabel(kind, slug, "en")} recipes — nutrition computed in grams for every ingredient, with prep and cook times and a clear per-serving calorie range.`;
    case "goal":
      return isAr
        ? `وصفات تخدم هدف «${axisLabel(kind, slug, "ar")}» — مختارة على أساس كثافة السعرات ونسبة البروتين لكل حصة، بمكونات متاحة وخطوات واضحة.`
        : `Recipes matched to the «${axisLabel(kind, slug, "en")}» goal — selected by calorie density and per-serving protein, with accessible ingredients and clear steps.`;
    case "meal":
      return isAr
        ? `وصفات ${axisLabel(kind, slug, "ar")} — من الإفطار إلى ما بعد التمرين، بقيم محسوبة لكل حصة لتناسب يومك التدريبي.`
        : `${axisLabel(kind, slug, "en")} recipes — from breakfast to post-workout, with computed per-serving values that fit your training day.`;
  }
}

export async function taxonomyMetadata(
  kind: RecipesTaxonomyKind,
  slug: string,
  lang: RecipeLanguage,
): Promise<Metadata> {
  if (!validSlug(kind, slug)) {
    return { title: "Not Found — Alkemos", robots: { index: false, follow: false } };
  }
  const isAr = lang === "ar";
  const segment = KIND_SEGMENT[kind];
  const url = `${SITE_URL}${isAr ? "/ar" : ""}/recipes/${segment}/${slug}`;
  const kindLabel = isAr ? KIND_LABEL_AR[kind] : KIND_LABEL_EN[kind];
  const label = axisLabel(kind, slug, lang);
  const title = isAr ? `وصفات ${label} — ${kindLabel} | Alkemos` : `${label} Recipes — ${kindLabel} | Alkemos`;
  const description = introCopy(kind, slug, lang).slice(0, 158);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/recipes/${segment}/${slug}`,
        ar: `${SITE_URL}/ar/recipes/${segment}/${slug}`,
        "x-default": `${SITE_URL}/recipes/${segment}/${slug}`,
      },
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Alkemos",
      locale: isAr ? "ar_EG" : "en_US",
      images: [
        {
          url: isAr ? "/images/og/og-home-ar.png?v=4" : "/images/og/og-home-en.png?v=4",
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export async function RecipesTaxonomyHub({
  kind,
  slug,
  lang,
}: {
  kind: RecipesTaxonomyKind;
  slug: string;
  lang: RecipeLanguage;
}) {
  if (!validSlug(kind, slug)) notFound();
  const isAr = lang === "ar";
  const base = isAr ? "/ar/recipes" : "/recipes";
  const segment = KIND_SEGMENT[kind];

  const filters =
    kind === "cuisine"
      ? { cuisine: slug as never }
      : kind === "diet"
        ? { diet: slug as never }
        : kind === "goal"
          ? { goal: slug as never }
          : { meal: slug as never };
  const items = await listRecipeSummariesAll(lang, filters);

  const kindLabel = isAr ? KIND_LABEL_AR[kind] : KIND_LABEL_EN[kind];
  const label = axisLabel(kind, slug, lang);
  const pageTitle = isAr ? `وصفات ${label}` : `${label} Recipes`;
  const intro = introCopy(kind, slug, lang);
  const pagePath = `${isAr ? "/ar" : ""}/recipes/${segment}/${slug}`;

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: isAr ? "الرئيسية" : "Home", url: isAr ? "/ar" : "/" },
    { name: isAr ? "الوصفات الصحية" : "Healthy Recipes", url: isAr ? "/ar/recipes" : "/recipes" },
    { name: pageTitle, url: pagePath },
  ]);

  const itemListSchema = getItemListSchema({
    name: pageTitle,
    description: intro.slice(0, 200),
    items: items.map((r) => ({
      name: r.title,
      url: `${base}/${r.slug}`,
    })),
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      {items.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
        />
      ) : null}
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-[var(--muted-foreground)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={isAr ? "/ar" : "/"} className="hover:underline">
                {isAr ? "الرئيسية" : "Home"}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href={base} className="hover:underline">
                {isAr ? "الوصفات الصحية" : "Healthy Recipes"}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-[var(--text)]">
              {pageTitle}
            </li>
          </ol>
        </nav>

        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            {kindLabel}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{pageTitle}</h1>
          {intro ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
              {intro}
            </p>
          ) : null}
        </header>

        {items.length === 0 ? (
          <div className="mt-12 marble-card p-12 text-center">
            <h2 className="text-lg font-semibold">
              {isAr ? "لم تُنشر وصفات في هذا التصنيف بعد" : "No recipes in this category yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
              {isAr
                ? "ينشر خط الإنتاج اليومي زوج وصفات جديدًا (عربي + إنجليزي)، ويتوزع على المطابخ والأنظمة والأهداف تلقائيًا — عُد قريبًا."
                : "The daily pipeline publishes one new verified pair a day and distributes it across cuisines, diets and goals automatically — check back soon."}
            </p>
            <Link
              href={base}
              className="mt-6 inline-block rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
            >
              {isAr ? "كل الوصفات" : "All recipes"}
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} lang={lang} priority={i < 4} />
            ))}
          </div>
        )}

        <MembershipPromo isAr={isAr} />
      </main>

      <SiteFooter />
    </div>
  );
}
