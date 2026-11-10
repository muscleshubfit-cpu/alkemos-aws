import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getArticleSchema, getBreadcrumbSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import { CALORIE_CONSISTENCY_ABS_KCAL, CALORIE_CONSISTENCY_PCT } from "@/lib/recipes-nutrition";

/**
 * /recipes/methodology — the recipes section's reader-facing reference
 * (the /foods/methodology precedent): where the nutrition values come
 * from, how each per-serving number is calculated, why the optional
 * values sometimes appear and sometimes don't, and how the photos are
 * licensed.
 *
 * EDITORIAL-SURFACE DECISION (owner order 2026-11-10 «editorial review»):
 * internal implementation details (the production line, the gates, the
 * pair structure) stay fully documented INSIDE the repo
 * (docs/healthy-recipes-platform/) and never surface to visitors — this
 * page is pure editorial copy. The numeric thresholds printed here are
 * still imported from the real engine modules so the page cannot drift
 * from the code.
 *
 * Arabic mirror at /ar/recipes/methodology (editorially independent).
 */

const SITE_URL = "https://alkemos.com";
const URL = `${SITE_URL}/recipes/methodology`;
const PUBLISHED = "2026-11-10";

export const revalidate = 604800; // 7 days — a slowly-moving reference

export const metadata: Metadata = {
  title: "Recipe Nutrition Methodology — Sources, Calculation & Licensing | Alkemos",
  description:
    "How Alkemos recipe nutrition works: per-ingredient gram weights from published references (USDA FoodData Central at the core), clear per-serving calculation, a calorie-consistency check, and documented image licensing.",
  alternates: {
    canonical: URL,
    languages: {
      en: URL,
      ar: `${SITE_URL}/ar/recipes/methodology`,
      "x-default": URL,
    },
  },
  openGraph: {
    type: "article",
    url: URL,
    title: "Recipe Nutrition Methodology | Alkemos",
    description:
      "Per-serving nutrition from published references — sources, calculation, and image licensing.",
    siteName: "Alkemos",
    locale: "en_US",
    images: [
      { url: "/images/og/og-home-en.png?v=4", width: 1200, height: 630 },
    ],
  },
};

const FAQ = [
  {
    q: "Can I rely on the nutrition values in my daily tracking?",
    a: "Yes, for everyday guidance. The values are per serving, calculated from the ingredient weights listed in each recipe and based on published references (USDA data at the core, with Arab composition tables for regional ingredients). They remain estimates — ingredient sizes and cooking methods vary from kitchen to kitchen — so if you follow a very precise protocol, treat them as a trustworthy starting point rather than a lab measurement.",
  },
  {
    q: "What happens when an ingredient has no reliable reference data?",
    a: "We never publish an invented number. A value appears only when a reliable published reference exists for it — which is why our recipes are built from ingredients with available nutrition data, and why rarer values are simply left out of the table rather than guessed.",
  },
  {
    q: "Why do some recipes show saturated fat and sodium while others do not?",
    a: "Saturated fat and sodium are optional extras: a recipe shows them only when reliable reference data covers its ingredients (or most of them). When coverage is partial we prefer to leave the field empty rather than fabricate a figure — the core values (ingredients with gram weights, calories, protein, carbs, fat, fiber, and servings with their weight) are always present.",
  },
  {
    q: "Can I use the recipe images?",
    a: "The images come from Pexels, Unsplash, and Pixabay under their respective licenses, which permit commercial use without attribution. The photographers keep their rights, and Alkemos claims no ownership of any photo — the marketplace licenses themselves are the reference if you want to use an image.",
  },
];

export default function RecipesMethodologyPage() {
  const articleSchema = getArticleSchema({
    title: "Recipe Nutrition Methodology — Alkemos",
    description: metadata.description as string,
    slug: "methodology",
    pageUrl: URL,
    datePublished: PUBLISHED,
    lastReviewed: null,
  });
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Healthy Recipes", url: "/recipes" },
    { name: "Methodology", url: "/recipes/methodology" },
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(getFAQSchema(FAQ)) }} />

      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-[var(--muted-foreground)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/recipes" className="hover:underline">Healthy Recipes</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-[var(--text)]">Methodology</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Recipe nutrition methodology — sources, calculation, and licensing
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
          Every Alkemos recipe is built from ingredients weighed in grams, with per-serving
          nutrition drawn from published references. This page explains where the numbers
          come from, how they are calculated, and why they deserve your trust — in detail.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. The nutrition reference</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            We lean on the USDA FoodData Central (FDC) published data for the ingredients
            it covers, supplemented by Egyptian and Arab composition tables for regional
            ingredients (molokhia, freekeh, labneh, ghee, date molasses, zaatar…) where
            US data does not exist. Every reference value is documented with its source
            name and version, and values without a reliable published source are recorded
            as curated rather than attributed to a source that never published them.
            Saturated fat and sodium are included only where a reliable published datum
            exists.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">2. How the per-serving values are calculated</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            The math is refreshingly direct: for each ingredient, the per-100 g reference
            values are multiplied by the declared gram weight (amount ÷ 100); the recipe
            is then summed and divided by the number of servings. Cooking oils, sauces,
            honey, and other additions are listed as full ingredients with their weights
            and counted in the calculation — cooking fat is never overlooked. Each
            ingredient declares its weight state (raw or cooked), and the calculation
            uses the weight as entered in that state.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            A simple but strict consistency check follows: the computed calories may not
            differ from the value implied by the well-known energy factors (4 kcal per
            gram of protein and carbs, 9 per gram of fat) by more than the greater of{" "}
            {Math.round(CALORIE_CONSISTENCY_PCT * 100)}% or{" "}
            {CALORIE_CONSISTENCY_ABS_KCAL} kcal, both per recipe and per serving — a
            calculation that misses its own ingredients by that much signals an error to
            fix, not a number to publish.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">3. The optional values — and why they are sometimes absent</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            The core seven — ingredients with gram weights, calories, protein, carbs,
            fat, fiber, and servings with their weight — are present in every recipe.
            Saturated fat and sodium are optional extras that a recipe shows only when
            reliable reference data covers its ingredients (or most of them); when
            coverage is partial we prefer to leave the field empty over fabricating a
            figure. Transparency beats a complete-looking table.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">4. Substitutions and their impact</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Many recipes suggest substitutions, and every substitution changes the
            nutrition to a degree that depends on the swap: trading yogurt for cream
            raises fat and calories; trading white rice for whole-grain basmati shifts
            carbs and fiber. The values shown on each recipe are calculated for the
            original ingredients at the weights listed — if you use a substitution,
            treat the values as a starting point and adjust for the swap.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">5. Image licensing</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Recipe photos come from the Pexels, Unsplash, and Pixabay marketplaces, whose
            licenses permit commercial use without attribution. We choose photos that
            match the dish and its main ingredients, and the photographers keep their
            rights — Alkemos claims no ownership of any photo shown.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">6. Frequently asked questions</h2>
          <div className="mt-3 divide-y divide-[var(--edge)] rounded-xl border border-[var(--edge)]">
            {FAQ.map((f) => (
              <details key={f.q} className="px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-10 text-sm text-[var(--muted-foreground)]">
          <Link href="/recipes" className="underline underline-offset-4">
            Browse the recipes library
          </Link>
          {" · "}
          <Link href="/foods/methodology" className="underline underline-offset-4">
            Food database methodology
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
