import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { resolveAuthor } from "@/lib/authors";
import { getArticleSchema, getBreadcrumbSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import {
  MACRO_ACCURACY_CHAIN_LINKS,
  MACRO_ACCURACY_GUIDE_FAQ_EN,
  MACRO_ACCURACY_GUIDE_META as META,
  MACRO_ACCURACY_GUIDE_PATH as PATH,
  MACRO_ACCURACY_GUIDE_PATH_AR as PATH_AR,
  MACRO_ACCURACY_GUIDE_PUBLISHED as PUBLISHED,
  MACRO_ACCURACY_GUIDE_SECTIONS as SECTIONS,
} from "@/lib/macro-accuracy-guide";

/**
 * /guides/macro-tracking-accuracy — the P1-8 content chain's pillar guide
 * (EN canonical). Phase 318 (owner order 2026-10-01 «ابدأ تنفيذ البند
 * التالى»): the approved audit's P1 item 8 — «سلسلة محتوى «دقة تتبع
 * الماكروز» وسلعنة قاعدة الأطعمة كمرجع موثق يستحق الروابط».
 *
 * This page is the chain HUB: it interlinks the guide content → the food
 * database → the /foods/methodology documented reference → the macro
 * tools → the Cronometer comparison (MACRO_ACCURACY_CHAIN_LINKS — the
 * wiring asserted by macro-accuracy-chain.test.ts).
 *
 * SEO wiring mirrors the /compare/[slug] convention: Article + Breadcrumb
 * + FAQ (FAQPage kept for non-Google semantic value per seo.ts law) +
 * canonical/hreflang pair + static macro-tracker family og card
 * (og-image-coverage law: this surface is wired to og-macro-tracker-en).
 *
 * Arabic mirror at /ar/guides/macro-tracking-accuracy.
 */

const OG_IMAGE = "/images/og/og-home-en.png?v=4";
const URL = `https://alkemos.com${PATH}`;

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

export default function MacroAccuracyGuidePage() {
  const author = resolveAuthor(undefined);

  // Phase 318: pageUrl pins mainEntityOfPage @id to THIS page (the legacy
  // default would build /blog/... — see getArticleSchema's pageUrl note).
  const articleSchema = getArticleSchema({
    title: META.titleEn,
    description: META.descriptionEn,
    slug: `guides/${PATH.split("/").pop()}`,
    image: OG_IMAGE,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    authorProfile: author,
    pageUrl: URL,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Macro Tracking Accuracy", url: PATH },
  ]);

  const faqSchema = getFAQSchema(MACRO_ACCURACY_GUIDE_FAQ_EN);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="Breadcrumb">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">Macro Tracking Accuracy</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
            {META.h1En}
          </h1>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Guide · Published {PUBLISHED} · Reviewed by Ahmed Zake
          </p>
          <p className="mt-6 text-lg font-normal leading-relaxed text-[var(--muted-foreground)] md:text-xl">
            {META.introEn}
          </p>
          <div className="mt-6">
            <ShareButtons path="/guides/macro-tracking-accuracy" title={META.h1En} />
          </div>
        </header>

        {/* Table of contents — the guide-template law (master plan §6.3) */}
        <nav className="marble-card mb-12 p-6" aria-label="Contents">
          <p className="text-sm font-semibold tracking-tight">Contents</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                  {i + 1}. {s.headingEn}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                {SECTIONS.length + 1}. Frequently asked questions
              </a>
            </li>
          </ol>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {section.headingEn}
            </h2>
            <div className="mt-4 space-y-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
              {section.paragraphsEn.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        {/* FAQ — visible text (GEO) + FAQPage JSON-LD above */}
        <section id="faq" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-4">
            {MACRO_ACCURACY_GUIDE_FAQ_EN.map((f) => (
              <div key={f.q} className="marble-card p-6">
                <h3 className="text-base font-semibold tracking-tight">{f.q}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The P1-8 chain — this guide's cross-link network (asserted by
            macro-accuracy-chain.test.ts). */}
        <section className="marble-card mb-12 p-8" aria-label="The accuracy chain">
          <h2 className="text-2xl font-semibold tracking-tight">The accuracy chain</h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            Every claim above is carried by a surface you can check: the documented food
            database, its methodology page, the tools that compute from it, and the
            platform comparison.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {MACRO_ACCURACY_CHAIN_LINKS.map((l) => (
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

        {/* CTA — honest scope, same convention as the macro-tracker landing */}
        <section className="marble-card mt-4 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Plan with the same numbers</h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            The macro calculator, the 8,830-food database, and the meal planner with live
            totals — all free, no credit card required.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/tools/macro-calculator" className="btn-chrome px-6 py-2.5 text-sm">Calculate your macros</Link>
            <Link href="/meal-planner" className="btn-outline px-6 py-2.5 text-sm">Open the meal planner</Link>
            <Link href="/foods/methodology" className="btn-outline px-6 py-2.5 text-sm">Read the data methodology</Link>
          </div>
        </section>
      </main>

      {/* Access-point law (2026-09-14): shared marble footer on every public page. */}
      <SiteFooter />
    </div>
  );
}
