import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { resolveAuthor } from "@/lib/authors";
import { FOODS } from "@/lib/foods";
import { CATEGORY_LABELS, FOODS_COUNT } from "@/lib/foods-shared";
import {
  FOODS_CITATION_FORMATS,
  FOODS_METHODOLOGY_CHAIN_LINKS,
  FOODS_METHODOLOGY_FAQ_EN,
  FOODS_METHODOLOGY_META as META,
  FOODS_METHODOLOGY_PATH as PATH,
  FOODS_METHODOLOGY_PATH_AR as PATH_AR,
  FOODS_METHODOLOGY_PUBLISHED as PUBLISHED,
  FOODS_METHODOLOGY_SECTIONS,
  foodsMethodologyStats,
} from "@/lib/foods-methodology";
import {
  getArticleSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  getOrganizationSchema,
  jsonLd,
} from "@/lib/seo";

/**
 * /foods/methodology — the P1-8 "documented reference" page (EN).
 *
 * Phase 318 (owner order 2026-10-01 «ابدأ تنفيذ البند التالى»): the audit's
 * P1 item 8 — «سلعنة قاعدة الأطعمة كمرجع موثق يستحق الروابط». A nutrition
 * reference earns citations by documenting itself: sources, conventions,
 * the Arabic layer, limits, and the citation format.
 *
 * ROUTE NOTE: static segment beats the dynamic /foods/[slug] — this page
 * owns /foods/methodology; getFoodBySlug("methodology") is never reached.
 *
 * NUMBER LAW: every count is computed at render from the shipped FOODS
 * array (foodsMethodologyStats) — the page cannot drift from the data.
 *
 * ISR mirrors the food-detail family (frozen reference data, 7-day window).
 *
 * Schema: Article (pageUrl-pinned @id) + Breadcrumb + FAQ + a standalone
 * Dataset node (machine-readable description of the reference — no
 * license field: the repo LICENSE is proprietary, terms are linked in the
 * visible copy instead).
 *
 * Arabic mirror at /ar/foods/methodology. og card: foods family
 * (og-image-coverage law: this surface is wired to og-foods-en).
 */

const OG_IMAGE = "/images/og/og-home-en.png?v=4";
const URL = `https://alkemos.com${PATH}`;

export const revalidate = 604800; // 7 days — same window as /foods/[slug]

export const metadata: Metadata = {
  title: META.titleEn,
  description: META.descriptionEn,
  alternates: {
    canonical: URL,
    languages: {
      en: URL,
      ar: `https://alkemos.com${PATH_AR}`,
      "x-default": URL,
    },
  },
  openGraph: {
    type: "article",
    url: URL,
    title: META.titleEn,
    description: META.descriptionEn,
    siteName: "Alkemos",
    locale: "en_US",
    // og-coverage law (Phase 187 + 318): exact-string family-card wiring.
    images: [{ url: "/images/og/og-home-en.png?v=4", width: 1200, height: 630, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: META.titleEn,
    description: META.descriptionEn,
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default function FoodsMethodologyPage() {
  // Render-time stats from the shipped data — the number law (see header).
  const stats = foodsMethodologyStats(FOODS, Object.keys(CATEGORY_LABELS).length);
  const slots: Record<string, string> = {
    total: stats.total.toLocaleString("en-US"),
    curated: stats.curated.toLocaleString("en-US"),
    longTail: stats.longTail.toLocaleString("en-US"),
    arabized: stats.arabized.toLocaleString("en-US"),
    categories: String(stats.categories),
  };
  const fill = (s: string) => s.replace(/\{(total|curated|longTail|arabized|categories)\}/g, (_, k) => slots[k as string]);

  const author = resolveAuthor(undefined);

  const articleSchema = getArticleSchema({
    title: META.titleEn,
    description: META.descriptionEn,
    slug: "foods/methodology",
    image: OG_IMAGE,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    authorProfile: author,
    pageUrl: URL,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Foods", url: "/foods" },
    { name: "Methodology", url: PATH },
  ]);

  const faqSchema = getFAQSchema(FOODS_METHODOLOGY_FAQ_EN);

  // Standalone Dataset node — the machine-readable face of the reference.
  // Deliberately WITHOUT license (repo LICENSE is proprietary; the visible
  // copy links /terms) — an unclaimed field beats a wrong claim.
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Alkemos Food Database",
    description: `Per-100g nutrition reference for ${stats.total.toLocaleString("en-US")} foods: calories, protein, carbohydrate, and fat, with gram-anchored default servings and a bilingual Arabic layer. Sources, conventions, limits, and citation format documented at ${URL}.`,
    url: URL,
    creator: getOrganizationSchema("en"),
    variableMeasured: [
      "calories per 100 g",
      "protein per 100 g",
      "carbohydrate per 100 g",
      "fat per 100 g",
    ],
    isAccessibleForFree: true,
    inLanguage: ["en", "ar"],
    keywords: ["food database", "nutrition data", "macros per 100g", "قاعدة بيانات الأطعمة"],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetSchema) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/foods" className="hover:opacity-70">Foods</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">Methodology</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
            {META.h1En}
          </h1>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Reference documentation · Published {PUBLISHED} · {stats.total.toLocaleString("en-US")} foods · Reviewed by Ahmed Zake
          </p>
          <p className="mt-6 text-lg font-normal leading-relaxed text-[var(--muted-foreground)] md:text-xl">
            {META.introEn}
          </p>
          <div className="mt-6">
            <ShareButtons path="/foods/methodology" title={META.h1En} />
          </div>
        </header>

        {/* Live-count strip — computed at render, not copied from docs */}
        <div className="marble-card mb-12 grid grid-cols-2 gap-4 p-6 sm:grid-cols-4" aria-label="Live database counts">
          {[
            { label: "Foods (total)", value: stats.total.toLocaleString("en-US") },
            { label: "Curated core", value: stats.curated.toLocaleString("en-US") },
            { label: "Arabic-named", value: stats.arabized.toLocaleString("en-US") },
            { label: "Reference long tail", value: stats.longTail.toLocaleString("en-US") },
          ].map((cell) => (
            <div key={cell.label} className="text-center">
              <p className="text-2xl font-semibold tracking-tight">{cell.value}</p>
              <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">{cell.label}</p>
            </div>
          ))}
        </div>

        <nav className="marble-card mb-12 p-6" aria-label="Contents">
          <p className="text-sm font-semibold tracking-tight">Contents</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {FOODS_METHODOLOGY_SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                  {i + 1}. {s.headingEn}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                {FOODS_METHODOLOGY_SECTIONS.length + 1}. Frequently asked questions
              </a>
            </li>
          </ol>
        </nav>

        {FOODS_METHODOLOGY_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {section.headingEn}
            </h2>
            <div className="mt-4 space-y-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
              {section.paragraphsEn.map((p, j) => (
                <p key={j}>{fill(p)}</p>
              ))}
            </div>

            {/* Citation formats — reference material rendered as a distinct
                copyable block (data, not prose; see FOODS_CITATION_FORMATS). */}
            {section.id === "cite" && (
              <div className="mt-6 space-y-3" aria-label="Citation formats">
                {[
                  { label: "Whole database (English)", value: fill(FOODS_CITATION_FORMATS.databaseEn) },
                  { label: "A single food (English)", value: fill(FOODS_CITATION_FORMATS.singleFoodEn) },
                  { label: "Whole database (Arabic)", value: fill(FOODS_CITATION_FORMATS.databaseAr), rtl: true },
                ].map((fmt) => (
                  <div key={fmt.label} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">{fmt.label}</p>
                    <p dir={fmt.rtl ? "rtl" : undefined} className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--text)] select-all">
                      {fmt.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        <section id="faq" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-4">
            {FOODS_METHODOLOGY_FAQ_EN.map((f) => (
              <div key={f.q} className="marble-card p-6">
                <h3 className="text-base font-semibold tracking-tight">{f.q}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The reference's own chain */}
        <section className="marble-card mb-12 p-8" aria-label="Data surfaces">
          <h2 className="text-2xl font-semibold tracking-tight">Use the data</h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            Browse the rows, see the arithmetic in action, and check the accuracy guide
            that explains how to use per-100g values in practice.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {FOODS_METHODOLOGY_CHAIN_LINKS.map((l) => (
              <Link
                key={l.hrefEn}
                href={l.hrefEn}
                className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {l.labelEn}
              </Link>
            ))}
          </div>
        </section>

        <section className="marble-card mt-4 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Cite it, link it</h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            The {FOODS_COUNT.toLocaleString("en-US")}-food reference is free to browse in English and
            Arabic — cite the page you use with the format above.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/foods" className="btn-chrome px-6 py-2.5 text-sm">Browse the database</Link>
            <Link href="/guides/macro-tracking-accuracy" className="btn-outline px-6 py-2.5 text-sm">Read the accuracy guide</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
