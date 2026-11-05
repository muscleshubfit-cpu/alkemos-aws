import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { resolveAuthor } from "@/lib/authors";
import { getArticleSchema, getBreadcrumbSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import {
  MACRO_ACCURACY_CHAIN_LINKS,
  MACRO_ACCURACY_GUIDE_FAQ_AR,
  MACRO_ACCURACY_GUIDE_META as META,
  MACRO_ACCURACY_GUIDE_PATH as PATH_EN,
  MACRO_ACCURACY_GUIDE_PATH_AR as PATH,
  MACRO_ACCURACY_GUIDE_PUBLISHED as PUBLISHED,
  MACRO_ACCURACY_GUIDE_SECTIONS as SECTIONS,
} from "@/lib/macro-accuracy-guide";

/**
 * /ar/guides/macro-tracking-accuracy — المرآيا العربية لدليل دقة تتبع
 * الماكروز (P1-8 · فريم 318). سلسلة المحتوى نفسها بالعربية الفصحى
 * (قانون MSA: اللاتيني فقط داخل أقواس الإشارة أو أسماء العلامات).
 *
 * المرايا الإنجليزية: /guides/macro-tracking-accuracy (canonical EN).
 * بطاقة og الثابتة لعائلة متتبع الماكروز: og-macro-tracker-ar.
 */

const OG_IMAGE = "/images/og/og-home-ar.png?v=4";
const URL = `https://alkemos.com${PATH}`;

export const metadata: Metadata = {
  // قالب العنوان العربي يضيف «— Alkemos» تلقائيًا (لا يُكرَّر هنا).
  title: META.titleAr,
  description: META.descriptionAr,
  alternates: {
    canonical: URL,
    languages: {
      en: `https://alkemos.com${PATH_EN}`,
      ar: URL,
      "x-default": `https://alkemos.com${PATH_EN}`,
    },
  },
  openGraph: {
    type: "article",
    url: URL,
    title: META.titleAr,
    description: META.descriptionAr,
    siteName: "Alkemos",
    locale: "ar_EG",
    // قانون تغطية البطاقات (فريم 187 + 318): تضمين حرفي لبطاقة العائلة.
    images: [{ url: "/images/og/og-home-ar.png?v=4", width: 1200, height: 630, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: META.titleAr,
    description: META.descriptionAr,
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default function MacroAccuracyGuideArPage() {
  const author = resolveAuthor(undefined);

  // فريم 318: pageUrl يثبّت mainEntityOfPage @id على هذه الصفحة (الافتراضي
  // القديم يبني /blog/... — انظر ملاحظة pageUrl في getArticleSchema).
  const articleSchema = getArticleSchema({
    title: META.titleAr,
    description: META.descriptionAr,
    slug: `guides/${PATH.split("/").pop()}`,
    image: OG_IMAGE,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    authorProfile: author,
    pageUrl: URL,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "دقة تتبع الماكروز", url: PATH },
  ]);

  const faqSchema = getFAQSchema(MACRO_ACCURACY_GUIDE_FAQ_AR);

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="مسار التنقل">
          <Link href="/ar" className="hover:opacity-70">الرئيسية</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">دقة تتبع الماكروز</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
            {META.h1Ar}
          </h1>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            دليل · نُشر {PUBLISHED} · راجعه أحمد زكي
          </p>
          <p className="mt-6 text-lg font-normal leading-relaxed text-[var(--muted-foreground)] md:text-xl">
            {META.introAr}
          </p>
          <div className="mt-6">
            <ShareButtons path="/ar/guides/macro-tracking-accuracy" title={META.h1Ar} />
          </div>
        </header>

        {/* فهرس المحتويات — قانون قالب الدليل (خطة الماجل §6.3) */}
        <nav className="marble-card mb-12 p-6" aria-label="المحتويات">
          <p className="text-sm font-semibold tracking-tight">المحتويات</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                  {i + 1}. {s.headingAr}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                {SECTIONS.length + 1}. الأسئلة الشائعة
              </a>
            </li>
          </ol>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {section.headingAr}
            </h2>
            <div className="mt-4 space-y-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
              {section.paragraphsAr.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        {/* الأسئلة الشائعة — نص ظاهر (GEO) + FAQPage أعلاه */}
        <section id="faq" className="mb-12 scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            الأسئلة الشائعة
          </h2>
          <div className="mt-6 space-y-4">
            {MACRO_ACCURACY_GUIDE_FAQ_AR.map((f) => (
              <div key={f.q} className="marble-card p-6">
                <h3 className="text-base font-semibold tracking-tight">{f.q}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* سلسلة P1-8 — شبكة الروابط المتبادلة لهذا الدليل (مثبتة
            باختبار macro-accuracy-chain.test.ts). */}
        <section className="marble-card mb-12 p-8" aria-label="سلسلة الدقة">
          <h2 className="text-2xl font-semibold tracking-tight">سلسلة الدقة</h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            كل ادعاء أعلاه يحمله سطح يمكنك التحقق منه: قاعدة الأطعمة الموثقة، وصفحة
            منهجيتها، والأدوات التي تحسب منها، ومقارنة المنصات.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {MACRO_ACCURACY_CHAIN_LINKS.map((l) => (
              <Link
                key={l.hrefAr}
                href={l.hrefAr}
                className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {l.labelAr}
              </Link>
            ))}
          </div>
        </section>

        {/* دعوة الختام — نطاق صادق بنفس أعراف صفحة متتبع الماكروز */}
        <section className="marble-card mt-4 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">خطّط بنفس الأرقام</h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            حاسبة الماكروز وقاعدة الأطعمة بـ8,830+ صنفًا ومخطط الوجبات بمجاميعه
            الحيّة — كلها مجانية، بلا بطاقة ائتمان.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/ar/tools/macro-calculator" className="btn-chrome px-6 py-2.5 text-sm">احسب ماكروزك</Link>
            <Link href="/ar/meal-planner" className="btn-outline px-6 py-2.5 text-sm">افتح مخطط الوجبات</Link>
            <Link href="/ar/foods/methodology" className="btn-outline px-6 py-2.5 text-sm">اقرأ منهجية البيانات</Link>
          </div>
        </section>
      </main>

      {/* قانون نقاط الوصول (2026-09-14): التذييل الرخامي المشترك على كل
          صفحة عامة. */}
      <SiteFooter />
    </div>
  );
}
