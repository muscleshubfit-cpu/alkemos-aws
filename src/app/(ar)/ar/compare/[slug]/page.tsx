import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { COMPARISONS, getComparisonBySlug } from "@/lib/comparisons";
import { getArticleSchema, getBreadcrumbSchema, getItemListSchema, jsonLd, stripTrailingBrandForArTemplate } from "@/lib/seo";
import { resolveAuthor } from "@/lib/authors";
import { EgpPriceText } from "@/components/egp/EgpTwin";

/**
 * /ar/compare/[slug] — Arabic mirror of /compare/[slug].
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) {
    return {
      title: "المقارنة غير موجودة — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/compare/${comparison.slug}`;
  return {
    // SEO-GEO-4: strip the trailing brand — the /ar template appends "— Alkemos".
    title: stripTrailingBrandForArTemplate(comparison.titleAr),
    description: comparison.descriptionAr,
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/compare/${comparison.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/compare/${comparison.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: comparison.titleAr,
      description: comparison.descriptionAr,
      siteName: "Alkemos",
      locale: "ar_EG",
      // SOCIAL-OG-3 (2026-09-30): STATIC per-comparison card — same fix as
      // the EN mirror (the generator's type=compare branch stays as the
      // legacy-URL fallback only).
      images: [{ url: `https://alkemos.com/images/og/og-home-ar.png?v=4`, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: comparison.titleAr,
      description: comparison.descriptionAr,
      images: [`https://alkemos.com/images/og/og-home-ar.png?v=4`],
    },
  };
}

export default async function ArabicComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) notFound();

  const url = `https://alkemos.com/ar/compare/${comparison.slug}`;
  const author = resolveAuthor(undefined);

  const articleSchema = getArticleSchema({
    title: comparison.titleAr,
    description: comparison.descriptionAr,
    slug: `ar/compare/${comparison.slug}`,
    // §12.40 (P2-14, audit finding #10): og:image ↔ JSON-LD image
    // consistency — same branded og-image URL the metadata declares
    // (?lang=ar variant; previously fell back to /logo.png).
    // §12.40 consistency — same static AR card the metadata declares
    // above (SOCIAL-OG-3).
    image: `https://alkemos.com/images/og/og-home-ar.png?v=4`,
    // W1-1 (E-03, audit 2026-10-02): REAL dates from the data module —
    // the old new Date().toISOString() fabricated all three on every
    // render ("modified + reviewed today" with each request). Now:
    // datePublished = the STABLE first-publish date (publishedAt, git
    // d238e96a) · dateModified + explicit lastReviewed = the dataAsOf
    // verification date — the exact claim the visible header already
    // makes («البيانات حتى … · راجعه أحمد زكي»).
    datePublished: comparison.publishedAt,
    dateModified: comparison.dataAsOf,
    lastReviewed: comparison.dataAsOf,
    authorProfile: author,
    // W1-1 (E-04, audit 2026-10-02): the Phase-318 pageUrl param — the
    // legacy /blog/ar/compare/… fallback produced a mainEntityOfPage URL
    // that does not exist.
    pageUrl: url,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "المقارنات", url: "/ar/compare" },
    { name: comparison.h1Ar, url: `/ar/compare/${comparison.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: `${comparison.h1Ar} — Alkemos`,
    description: comparison.descriptionAr,
    items: [
      { name: "Alkemos", url: "/ar" },
      { name: comparison.competitorNameAr, url: comparison.competitorUrl },
    ],
  });

  const winCount = comparison.rows.filter((r) => r.outcome === "win").length;
  const lossCount = comparison.rows.filter((r) => r.outcome === "loss").length;
  const tieCount = comparison.rows.filter((r) => r.outcome === "tie").length;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]" dir="rtl">
      <SiteHeader variant="landing" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="مسار التنقل">
          <Link href="/ar" className="hover:opacity-70">الرئيسية</Link>
          <span>/</span>
          <Link href="/ar/compare" className="hover:opacity-70">المقارنات</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">{comparison.h1Ar}</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {comparison.h1Ar}
          </h1>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            البيانات حتى {comparison.dataAsOf} · راجعه أحمد زكي
          </p>
          {/* إشارة الموقع الرسمي للمنافس (توجيه المالك 2026-09-14): رابط
              خارجي ظاهر واحد فقط لكل صفحة — الصفحة الرسمية للمنافس بعد
              التحقق منها (لا مراجعات ولا أدلة ولا Wikipedia ولا روابط
              عمولة). الرابط كان سابقًا داخل ItemList JSON-LD فقط؛ الآن له
              نقطة وصول مرئية مطابقة للنسخة الإنجليزية. */}
          <p className="mt-4 text-sm">
            <a
              href={comparison.competitorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              {comparison.competitorNameAr} — الموقع الرسمي{" "}
              <span aria-hidden="true">↗</span>
            </a>
          </p>
          <p className="mt-4 text-lg font-normal leading-relaxed text-[var(--muted-foreground)] md:text-xl">
            {comparison.introAr}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Alkemos يتفوّق: {winCount}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900/30 dark:text-red-400">
              {comparison.competitorName} يتفوّق: {lossCount}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
              تعادل: {tieCount}
            </span>
          </div>
        </header>

        <section className="mb-12" aria-label="جدول المقارنة">
        <div className="mb-10">
          <ShareButtons path={`/compare/${comparison.slug}`} title={comparison.h1Ar} />
        </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--edge)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--tint)]">
                <tr>
                  <th className="p-4 text-right font-semibold">الميزة</th>
                  <th className="p-4 text-right font-semibold text-[var(--muted-2)]">Alkemos</th>
                  <th className="p-4 text-right font-semibold">{comparison.competitorNameAr}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, i) => {
                  const alkemosBg = row.outcome === "win" ? "bg-green-50 dark:bg-green-950/20" : "";
                  const competitorBg = row.outcome === "loss" ? "bg-green-50 dark:bg-green-950/20" : "";
                  const alkemosIcon = row.outcome === "win" ? "✓" : row.outcome === "loss" ? "✗" : "=";
                  const competitorIcon = row.outcome === "loss" ? "✓" : row.outcome === "win" ? "✗" : "=";
                  return (
                    <tr key={i} className="border-t border-[var(--edge)]">
                      <td className="p-4 font-medium">{row.labelAr}</td>
                      <td className={`p-4 ${alkemosBg}`}>
                        <span className="ml-2 font-bold">{alkemosIcon}</span>
                        {/* EGP-DISPLAY (أمر المالك 2026-11-13): أرقام أسعار
                            Alkemos داخل خلايا المقارنة تكتسب توأمها بالجنيه
                            (صفوف local_prices عبر مطابقة المنتج)؛ أسعار
                            المنافس تبقى بالدولار وحده — تسعيرهم لا يخصنا. */}
                        <EgpPriceText text={row.alkemosValueAr} isAr />
                      </td>
                      <td className={`p-4 ${competitorBg}`}>
                        <span className="ml-2 font-bold">{competitorIcon}</span>
                        {row.competitorValueAr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12 marble-card p-8">
          <h2 className="text-2xl font-semibold tracking-tight">الحكم النهائي</h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
            {comparison.verdictAr}
          </p>
        </section>

        {comparison.bodyAr.map((section, i) => (
          <section key={i} className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
              {section.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="marble-card mt-16 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">جرّب Alkemos مجانًا</h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            مكتبة تمارين كاملة، قاعدة أطعمة، 8 أدوات مجانية، برامج تدريب، ووصول محدود لـ EVO AI — بدون بطاقة ائتمان.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/auth" className="btn-chrome px-6 py-2.5 text-sm">سجّل مجانًا</Link>
            <Link href="/ar/memberships" className="btn-outline px-6 py-2.5 text-sm">عرض الأسعار</Link>
            {/* Locale-leak fix (2026-09-15 audit): the AR page linked the EN
                /evo — now the AR mirror, matching the other AR surfaces. */}
            <Link href="/ar/evo" className="btn-outline px-6 py-2.5 text-sm">تعرّف على EVO</Link>
          </div>
          {/* Service access points (owner directive 2026-09-15 — comparison
              tables must surface the current Alkemos services with their
              correct LOCAL links). No EVO chat link here by law — the
              floating widget stays the only EVO-chat access point.
              P0 SEO audit (2026-09-30): the two tracking landing pages
              joined the service map — they are the natural next tap for
              readers comparing tracking apps. */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
            <Link href="/ar/tools" className="underline underline-offset-4 hover:opacity-80">الأدوات المجانية</Link>
            <Link href="/ar/workout-tracker" className="underline underline-offset-4 hover:opacity-80">متتبّع التمارين</Link>
            <Link href="/ar/macro-tracker" className="underline underline-offset-4 hover:opacity-80">متتبّع الماكروز</Link>
            <Link href="/ar/ai-meal-planner" className="underline underline-offset-4 hover:opacity-80">مخطط الوجبات الذكي</Link>
            <Link href="/ar/ai-workout-planner" className="underline underline-offset-4 hover:opacity-80">مخطط التمارين الذكي</Link>
            <Link href="/ar/exercises" className="underline underline-offset-4 hover:opacity-80">مكتبة التمارين</Link>
            <Link href="/ar/foods" className="underline underline-offset-4 hover:opacity-80">قاعدة الأطعمة</Link>
            <Link href="/ar/programs" className="underline underline-offset-4 hover:opacity-80">برامج التدريب</Link>
            <Link href="/ar/coaching" className="underline underline-offset-4 hover:opacity-80">التدريب الأونلاين</Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight mb-4">مقارنات أخرى</h2>
          <div className="flex flex-wrap gap-2">
            {COMPARISONS.filter((c) => c.slug !== comparison.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/ar/compare/${c.slug}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {c.h1Ar}
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Access-point fix (2026-09-14): slim copyright line replaced by the
          SHARED marble footer — this public page now carries the same
          persistent link grid as the homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}
