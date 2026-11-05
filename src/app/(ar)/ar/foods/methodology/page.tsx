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
  FOODS_METHODOLOGY_FAQ_AR,
  FOODS_METHODOLOGY_META as META,
  FOODS_METHODOLOGY_PATH as PATH_EN,
  FOODS_METHODOLOGY_PATH_AR as PATH,
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
 * /ar/foods/methodology — المرآيا العربية لصفحة «قاعدة أطعمة Alkemos —
 * المنهجية والمصادر» (P1-8 · فريم 318). نسخة فصحى من المرجع الموثق:
 * المصادر والأعراف والطبقة العربية والحدود وصيغة الاستشهاد.
 *
 * الأرقام تُحسب عند العرض من مصفوفة FOODS المُشغّلة (قانون الأرقام) —
 * الصفحة لا تستطيع الانحراف عن البيانات. المرآيا الإنجليزية:
 * /foods/methodology (canonical EN). بطاقة og لعائلة الأطعمة:
 * og-foods-ar (قانون تغطية البطاقات).
 */

const OG_IMAGE = "/images/og/og-home-ar.png?v=4";
const URL = `https://alkemos.com${PATH}`;

export const revalidate = 604800; // 7 أيام — نفس نافذة /ar/foods/[slug]

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

const AR_NUM = (n: number) => n.toLocaleString("en-US");

export default function FoodsMethodologyArPage() {
  // أرقام لحظية من البيانات المُشغّلة — قانون الأرقام (انظر الترويسة).
  const stats = foodsMethodologyStats(FOODS, Object.keys(CATEGORY_LABELS).length);
  const slots: Record<string, string> = {
    total: AR_NUM(stats.total),
    curated: AR_NUM(stats.curated),
    longTail: AR_NUM(stats.longTail),
    arabized: AR_NUM(stats.arabized),
    categories: String(stats.categories),
  };
  const fill = (s: string) => s.replace(/\{(total|curated|longTail|arabized|categories)\}/g, (_, k) => slots[k as string]);

  const author = resolveAuthor(undefined);

  const articleSchema = getArticleSchema({
    title: META.titleAr,
    description: META.descriptionAr,
    slug: "foods/methodology",
    image: OG_IMAGE,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    authorProfile: author,
    pageUrl: URL,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الأطعمة", url: "/ar/foods" },
    { name: "المنهجية", url: PATH },
  ]);

  const faqSchema = getFAQSchema(FOODS_METHODOLOGY_FAQ_AR);

  // عقدة Dataset مستقلة — الوجه الآلي للمرجع. بلا حقل license بتعمد
  // (رخصة الريبو مملوكة؛ الشروط مربوطة في النص المرئي بدل ادعاء خاطئ).
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "قاعدة أطعمة Alkemos",
    description: `مرجع غذائي لكل 100 جرام يضم ${AR_NUM(stats.total)} صنفًا: السعرات والبروتين والكربوهيدرات والدهون، بحصص افتراضية مثبتة بالجرام وطبقة عربية ثنائية اللغة. المصادر والأعراف والحدود وصيغة الاستشهاد موثقة على ${URL}.`,
    url: URL,
    creator: getOrganizationSchema("ar"),
    variableMeasured: [
      "calories per 100 g",
      "protein per 100 g",
      "carbohydrate per 100 g",
      "fat per 100 g",
    ],
    isAccessibleForFree: true,
    inLanguage: ["ar", "en"],
    keywords: ["قاعدة بيانات الأطعمة", "food database", "nutrition data", "macros per 100g"],
  };

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetSchema) }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 md:py-20">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-foreground)]" aria-label="مسار التنقل">
          <Link href="/ar" className="hover:opacity-70">الرئيسية</Link>
          <span>/</span>
          <Link href="/ar/foods" className="hover:opacity-70">الأطعمة</Link>
          <span>/</span>
          <span className="truncate text-[var(--text)]">المنهجية</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl">
            {META.h1Ar}
          </h1>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            توثيق مرجعي · نُشر {PUBLISHED} · {AR_NUM(stats.total)} صنفًا · راجعه أحمد زكي
          </p>
          <p className="mt-6 text-lg font-normal leading-relaxed text-[var(--muted-foreground)] md:text-xl">
            {META.introAr}
          </p>
          <div className="mt-6">
            <ShareButtons path="/ar/foods/methodology" title={META.h1Ar} />
          </div>
        </header>

        {/* شريط الأعداد الحية — محسوب عند العرض لا منسوخ من مستند */}
        <div className="marble-card mb-12 grid grid-cols-2 gap-4 p-6 sm:grid-cols-4" aria-label="أعداد القاعدة الحية">
          {[
            { label: "الأصناف (الإجمالي)", value: AR_NUM(stats.total) },
            { label: "النواة المنتقاة", value: AR_NUM(stats.curated) },
            { label: "بأسماء عربية", value: AR_NUM(stats.arabized) },
            { label: "الذيل المرجعي", value: AR_NUM(stats.longTail) },
          ].map((cell) => (
            <div key={cell.label} className="text-center">
              <p className="text-2xl font-semibold tracking-tight">{cell.value}</p>
              <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">{cell.label}</p>
            </div>
          ))}
        </div>

        <nav className="marble-card mb-12 p-6" aria-label="المحتويات">
          <p className="text-sm font-semibold tracking-tight">المحتويات</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {FOODS_METHODOLOGY_SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                  {i + 1}. {s.headingAr}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className="text-[var(--muted-foreground)] underline underline-offset-4 hover:opacity-80">
                {FOODS_METHODOLOGY_SECTIONS.length + 1}. الأسئلة الشائعة
              </a>
            </li>
          </ol>
        </nav>

        {FOODS_METHODOLOGY_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {section.headingAr}
            </h2>
            <div className="mt-4 space-y-4 text-base font-normal leading-relaxed text-[var(--muted-2)] md:text-lg">
              {section.paragraphsAr.map((p, j) => (
                <p key={j}>{fill(p)}</p>
              ))}
            </div>

            {/* صيغ الاستشهاد — مادة مرجعية تُعرض ككتلة قابلة للنسخ
                (بيانات لا نثرًا؛ انظر FOODS_CITATION_FORMATS). */}
            {section.id === "cite" && (
              <div className="mt-6 space-y-3" aria-label="صيغ الاستشهاد">
                {[
                  { label: "القاعدة كاملة (إنجليزي)", value: fill(FOODS_CITATION_FORMATS.databaseEn) },
                  { label: "صنف واحد (إنجليزي)", value: fill(FOODS_CITATION_FORMATS.singleFoodEn) },
                  { label: "القاعدة كاملة (عربي)", value: fill(FOODS_CITATION_FORMATS.databaseAr), rtl: true },
                ].map((fmt) => (
                  <div key={fmt.label} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">{fmt.label}</p>
                    <p dir={fmt.rtl ? "rtl" : "ltr"} className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--text)] select-all">
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
            الأسئلة الشائعة
          </h2>
          <div className="mt-6 space-y-4">
            {FOODS_METHODOLOGY_FAQ_AR.map((f) => (
              <div key={f.q} className="marble-card p-6">
                <h3 className="text-base font-semibold tracking-tight">{f.q}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* سلسلة المرجع نفسها */}
        <section className="marble-card mb-12 p-8" aria-label="أسطح البيانات">
          <h2 className="text-2xl font-semibold tracking-tight">استخدم البيانات</h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            تصفّح الصفوف، وشاهد الحساب حيًا، وارجع إلى دليل الدقة الذي يشرح كيف تستخدم
            قيم كل 100 جرام عمليًا.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {FOODS_METHODOLOGY_CHAIN_LINKS.map((l) => (
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

        <section className="marble-card mt-4 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">استشهد به واربطه</h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            المرجع بـ{AR_NUM(FOODS_COUNT)} صنفًا متاح للتصفح مجانًا بالعربية والإنجليزية —
            استشهد بالصفحة التي تستخدمها بالصيغة أعلاه.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/ar/foods" className="btn-chrome px-6 py-2.5 text-sm">تصفّح القاعدة</Link>
            <Link href="/ar/guides/macro-tracking-accuracy" className="btn-outline px-6 py-2.5 text-sm">اقرأ دليل الدقة</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
