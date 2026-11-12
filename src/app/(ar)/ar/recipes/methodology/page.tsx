import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  getArticleSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  jsonLd,
  stripTrailingBrandForArTemplate,
} from "@/lib/seo";
import { CALORIE_CONSISTENCY_ABS_KCAL, CALORIE_CONSISTENCY_PCT } from "@/lib/recipes-nutrition";

/**
 * /ar/recipes/methodology — المرآة العربية لصفحة منهجية القيم الغذائية.
 *
 * تأليف عربي مستقل (قانون المرآة التحريرية — ليست ترجمة حرفية). الصفحة
 * تشرح للقارئ ما يهمه فعلًا: من أين تأتي القيم الغذائية، وكيف تُحسب لكل
 * حصة، ولماذا تظهر بعض القيم الاختيارية أحيانًا وتغيب أحيانًا، وما
 * حقوق الصور المستخدمة.
 *
 * قرار السطح التحريري (أمر المالك 2026-11-10 «مراجعة تحريرية»): تفاصيل
 * التنفيذ الداخلي (خط الإنتاج، البوابات، بنية الأزواج) تظل موثقة بالكامل
 * داخل المستودع (docs/healthy-recipes-platform/) ولا تظهر في واجهة
 * الزائر — هذه الصفحة تحريرية صرفة. العتبات الرقمية المستوردة من
 * وحدات المحرك الحقيقية تبقى (الصفحة لا تختلف عن الكود).
 */

const SITE_URL = "https://alkemos.com";
const URL = `${SITE_URL}/ar/recipes/methodology`;
const PUBLISHED = "2026-11-10";

export const revalidate = 604800; // 7 أيام — مرجع بطيء التغير

export const metadata: Metadata = {
  title: "منهجية القيم الغذائية — المصادر والحساب وحقوق الصور",
  description:
    "كيف تُحسب القيم الغذائية في وصفات Alkemos: قيم لكل مكون بالجرام من مراجع منشورة (USDA FoodData Central أساسًا)، حساب واضح لكل حصة، فحص اتساق السعرات، وتراخيص صور موثقة.",
  alternates: {
    canonical: URL,
    languages: {
      en: `${SITE_URL}/recipes/methodology`,
      ar: URL,
      "x-default": `${SITE_URL}/recipes/methodology`,
    },
  },
  openGraph: {
    type: "article",
    url: URL,
    title: "منهجية القيم الغذائية | Alkemos",
    description:
      "قيم غذائية لكل حصة مبنية على مراجع منشورة — المصادر وطريقة الحساب وحقوق الصور.",
    siteName: "Alkemos",
    locale: "ar_EG",
    images: [
      { url: "/images/og/og-home-ar.png?v=4", width: 1200, height: 630 },
    ],
  },
};

const FAQ = [
  {
    q: "هل أستطيع الاعتماد على القيم الغذائية في حساباتي اليومية؟",
    a: "نعم، للاسترشاد اليومي. القيم محسوبة لكل حصة من أوزان المكونات المذكورة في كل وصفة، ومبنية على مراجع منشورة (وزارة الزراعة الأمريكية أساسًا مع جداول عربية للمكونات الإقليمية). تبقى القيم تقديرية بحكم اختلاف أحجام المكونات وطريقة الطهي من مطبخ لمطبخ — إن كنت تتبع نظامًا دقيقًا جدًا فاعتبرها نقطة انطلاق موثوقة لا قياسًا مخبريًا.",
  },
  {
    q: "ماذا لو لم تتوفر بيانات موثوقة لأحد المكونات؟",
    a: "لا نُدرج قيمة مختلقة أبدًا. القيمة تُنشر فقط عند توفر مرجع منشور موثوق لها، ولهذا تختار وصفاتنا مكونات لها بيانات غذائية متاحة، أما القيم النادرة فتُترك خارج الجدول بدل تخمينها.",
  },
  {
    q: "لماذا تعرض بعض الوصفات الدهون المشبعة والصوديوم وأخرى لا تعرضهما؟",
    a: "الدهون المشبعة والصوديوم قيمتان إضافيتان اختياريتان: نعرضهما فقط عند توفر قيمة مرجعية موثوقة لكل مكونات الوصفة أو معظمها، وعند التغطية الجزئية نتركهما فارغتين بدل اختلاق رقم. القيم الأساسية — المكونات بأوزانها بالجرام والسعرات والبروتين والكربوهيدرات والدهون والألياف وعدد الحصص ووزنها — موجودة في كل وصفة دائمًا.",
  },
  {
    q: "هل يمكنني استخدام صور الوصفات؟",
    a: "الصور مصدرها أسواق Pexels و Unsplash و Pixabay بتراخيصها التي تجيز الاستخدام التجاري بلا إسناد. حقوق التصوير تبقى لمصوريها، وAlkemos لا تدّعي ملكية أي صورة — إن أردت استخدام صورة ما فتراخيص الأسواق نفسها هي المرجع.",
  },
];

export default function RecipesMethodologyPageAr() {
  const articleSchema = getArticleSchema({
    title: stripTrailingBrandForArTemplate("منهجية القيم الغذائية — Alkemos"),
    description: metadata.description as string,
    slug: "methodology",
    pageUrl: URL,
    datePublished: PUBLISHED,
    lastReviewed: null,
  });
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الوصفات الصحية", url: "/ar/recipes" },
    { name: "المنهجية", url: "/ar/recipes/methodology" },
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
            <li><Link href="/ar" className="hover:underline">الرئيسية</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/ar/recipes" className="hover:underline">الوصفات الصحية</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-[var(--text)]">المنهجية</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          منهجية القيم الغذائية — المصادر والحساب وحقوق الصور
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
          كل وصفة على Alkemos مبنية على مكونات موزونة بالجرام وقيم غذائية لكل حصة من
          مراجع منشورة. هذه الصفحة تشرح من أين تأتي الأرقام، وكيف تُحسب، وما الذي
          يجعلها جديرة بالثقة — بالتفصيل.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. المرجع الغذائي</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            نستند إلى بيانات وزارة الزراعة الأمريكية المنشورة (USDA FoodData Central)
            للمكونات المتاحة فيها، مع جداول التركيب المصرية والعربية للمكونات
            الإقليمية (الملوخية، الفريك، اللبنة، السمنة، دبس التمر، الزعتر…) حيث لا
            توجد بيانات أمريكية. كل قيمة مرجعية موثقة باسم مصدرها وإصداره، والقيم
            التي لا يتوفر لها مرجع منشور موثوق تُسجل بوصفها منسقة لا ننسبها لمصدر
            لم تصدر عنه. الدهون المشبعة والصوديوم تُدرجان فقط عند توفر قيمة منشورة
            موثوقة.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">2. كيف تُحسب القيم لكل حصة</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            الحساب مباشر وبسيط: لكل مكون تُضرب قيمه المرجعية لكل 100 جرام
            في وزنه المصرَّح بالجرام (الكمية ÷ 100)، ثم تُجمع قيم الوصفة كلها وتُقسم
            على عدد الحصص. زيوت الطهي والصلصات والعسل والإضافات تُدرج مكونات كاملة
            بأوزانها وتُحسب ضمن الحساب — لا نغفل دهن الطهي أبدًا. وكل مكون يُذكر
            بحالة وزنه (نيئ أو مطبوخ) والحساب يجري على الوزن المُدخل بحالته.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            وبعد الحساب يجري فحص اتساق بسيط لكن صارم: لا يجوز أن تختلف السعرات
            المحسوبة عن القيمة المشتقة من معاملات الطاقة المعروفة (4 سعرات لكل جرام
            بروتين وكربوهيدرات و9 لكل جرام دهون) بأكثر من الأكبر بين{" "}
            {Math.round(CALORIE_CONSISTENCY_PCT * 100)}٪ أو{" "}
            {CALORIE_CONSISTENCY_ABS_KCAL} سعرة، للوصفة وللحصة معًا — فالحساب الذي
            يخالف مكوناته بهذا الحد يعني خطأ ما يجب تصحيحه لا نشره.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">3. القيم الاختيارية ولماذا تغيب أحيانًا</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            السبعة الأساسية — المكونات بأوزانها بالجرام، والسعرات، والبروتين،
            والكربوهيدرات، والدهون، والألياف، وعدد الحصص ووزنها — موجودة في كل وصفة.
            أما الدهون المشبعة والصوديوم فقيمتان إضافيتان تعرضهما الوصفة فقط عند
            توفر بيانات مرجعية موثوقة تغطي مكوناتها أو معظمها؛ وعند التغطية
            الجزئية نفضّل ترك الحقل فارغًا على اختلاق رقم — الشفافية أهم من اكتمال
            الجدول.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">4. البدائل وأثرها على القيم</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            كثير من الوصفات تقترح بدائل لمكوناتها، وكل بديل يغيّر القيم الغذائية
            بدرجة تختلف حسب البديل نفسه: استبدال اللبن الزبادي بالقشدة مثلًا يرفع
            الدهون والسعرات، واستبدال الأرز الأبيض بالأرز البسمتي كامل الحبة يغيّر
            الكربوهيدرات والألياف. القيم المعروضة في كل وصفة تحسب على المكونات
            الأصلية بأوزانها المذكورة — فإذا استخدمت بديلًا فاعتبر القيم نقطة
            انطلاق وعدّلها بحسب البديل.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">5. حقوق الصور</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            صور الوصفات مصدرها أسواق Pexels و Unsplash و Pixabay، وتراخيصها تجيز
            الاستخدام التجاري بلا إسناد. نختار الصور لتطابق الطبق ومكوناته
            الرئيسية، وتبقى حقوق التصوير كاملة لمصوريها — وAlkemos لا تدّعي ملكية
            أي صورة من الصور المعروضة.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">6. أسئلة شائعة</h2>
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
          <Link href="/ar/recipes" className="underline underline-offset-4">
            تصفح مكتبة الوصفات
          </Link>
          {" · "}
          <Link href="/ar/foods/methodology" className="underline underline-offset-4">
            منهجية قاعدة الأطعمة
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
