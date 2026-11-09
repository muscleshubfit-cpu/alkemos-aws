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
import { STEPS_MIN, STEPS_MAX } from "@/lib/recipes-quality-gates";

/**
 * /ar/recipes/methodology — المرآة العربية لصفحة المنهجية.
 *
 * تأليف عربي مستقل (قانون المرآة التحريرية — ليست ترجمة حرفية):
 * المصادر وقواعد الحساب والبوابات وتراخيص الصور والإفصاح الصادق
 * عن منهجية التوليد (قرار ق3). العتبات الرقمية مستوردة من وحدات
 * المحرك الحقيقية — الصفحة لا يمكن أن تختلف عن الكود.
 */

const SITE_URL = "https://alkemos.com";
const URL = `${SITE_URL}/ar/recipes/methodology`;
const PUBLISHED = "2026-11-10";

export const revalidate = 604800; // 7 أيام — مرجع بطيء التغير

export const metadata: Metadata = {
  title: "منهجية الوصفات — المصادر والحسابات وحقوق الصور",
  description:
    "كيف تُنتج وصفات Alkemos وتُتحقق: قيم غذائية محسوبة بالجرام لكل مكون من مرجع موثق، بوابات تحقق حتمية، أزواج ثنائية اللغة تنشر ذريًا، وتراخيص صور الأسواق موثقة.",
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
    title: "منهجية الوصفات | Alkemos",
    description:
      "قيم غذائية محسوبة بالجرام من مرجع موثق — المصادر والبوابات والتراخيص.",
    siteName: "Alkemos",
    locale: "ar_EG",
    images: [
      { url: "/images/og/og-home-ar.png?v=4", width: 1200, height: 630 },
    ],
  },
};

const FAQ = [
  {
    q: "هل القيم الغذائية في وصفات Alkemos مولدة بالذكاء الاصطناعي؟",
    a: "لا. طبقة الذكاء الاصطناعي تقترح بنية الوصفة (المكونات والأوزان بالجرام والخطوات)، لكن كل قيمة غذائية تُحسب ببرنامج حتمي من مرجع موثق لكل 100 جرام. فحص اتساق إلزامي بمعاملات السعرات (4/4/9 للبروتين والكربوهيدرات والدهون) يجب أن يمر على كل وصفة، وأي رقم غذائي يرد في نص الوصفة يجب أن يطابق القيمة المحسوبة.",
  },
  {
    q: "ماذا يحدث عندما لا تتوفر بيانات مرجعية لأحد المكونات؟",
    a: "تُحجز الوصفة ولا تُنشر. لا نقدّر ولا نختلق قيمًا — إذا افتقد مكون أساسي صفًا مرجعيًا (أو كان وزنه مجهولًا) تفشل البوابة الغذائية بسبب مقروء وتعود الوصفة لمرحلة البنية.",
  },
  {
    q: "لماذا تعرض بعض الوصفات الدهون المشبعة والصوديوم وأخرى لا تعرضهاما؟",
    a: "الدهون المشبعة والصوديوم حقلا إثراء اختياريان. ننشرهما فقط عند توفر قيمة مرجعية موثوقة للمكون؛ وعند التغطية الجزئية نترك الحقل فارغًا بدل اختلاقه. القيم السبع الإلزامية — المكونات بأوزانها بالجرام والسعرات والبروتين والكربوهيدرات والدهون والألياف وعدد الحصص ووزنها — موجودة دائمًا.",
  },
  {
    q: "هل يمكنني استخدام صور الوصفات تجاريًا؟",
    a: "الصور مصدرها أسواق Pexels وUnsplash وPixabay بتراخيصها التي تجيز الاستخدام التجاري بلا إسناد. لا تدّعي Alkemos ملكية الصور، وكل صفحة وصفة توثق مصدرها.",
  },
];

export default function RecipesMethodologyPageAr() {
  const articleSchema = getArticleSchema({
    title: stripTrailingBrandForArTemplate("منهجية الوصفات — Alkemos"),
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
          منهجية الوصفات — المصادر والحسابات وحقوق الصور
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
          كل وصفة على Alkemos زوج ثنائي اللغة (نسخة عربية ونسخة إنجليزية تُؤلَّف كلٌّ منهما
          استقلالًا — ليست ترجمة) ينتجها خط نشر يومي آلي، وكل قيمة غذائية فيها تُحسب
          ببرنامج حتمي من مرجع موثق. هذه الصفحة تشرح الطريقة بالتفصيل.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">١. المرجع الغذائي</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            تُخزَّن قيم كل مكون لكل 100 جرام في جدول مرجعي مخصص
            (<code>nutrient_reference</code>). المصدر الأساسي بيانات وزارة الزراعة
            الأمريكية المنشورة (USDA FoodData Central) للمكونات المتاحة فيها، مع مدخلات
            منسقة من جداول التركيب المصرية والعربية للمكونات الإقليمية (الملوخية،
            الفريك، اللبنة، السمنة، دبس التمر، الزعتر…) حيث لا توجد بيانات USDA. كل صف
            يوثق اسم مصدره وإصداره، والصفوف بلا معرف منشور مثبت تُوسَم «منسقة» ولا
            يُختلق لها معرف. الدهون المشبعة والصوديوم يُسجلان فقط عند توفر قيمة منشورة
            موثوقة — حقلا إثراء اختياريان بالتصميم.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">٢. كيف تُحسب القيم</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            لكل مكون يضرب المحرك قيم المرجع لكل 100 جرام في الوزن المصرَّح بالجرام
            (الكمية ÷ 100)، ثم يجمع الوصفة ويقسم على عدد الحصص. زيوت الطهي والصلصات
            والعسل والإضافات تُدرج مكونات كاملة بمراجعها — وصفة تحتاج دهن طهي وتغفل عنه
            تُرفض في بوابة البنية. كل مكون يصرّح بحالة وزنه (نيئ أو مطبوخ) والحساب يجري
            على الوزن المُدخل بحالته، والمرجع يحمل معامل تحويل النيئ للمطبوخ حيث ينطبق.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            ثم يجب أن يمر فحص اتساق السعرات: لا يجوز أن تختلف السعرات المحسوبة عن
            القيمة المشتقة من معاملات 4/4/9 (بروتين وكربوهيدرات ودهون) بأكثر من
            الأكبر بين {Math.round(CALORIE_CONSISTENCY_PCT * 100)}٪ أو{" "}
            {CALORIE_CONSISTENCY_ABS_KCAL} سعرة، للوصفة وللحصة معًا.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">٣. بوابات التحقق</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            لا تنشر أي وصفة قبل اجتياز بطارية حتمية: كل مكون له صف مرجعي ووزن موجب
            بالجرام؛ اتساق السعرات قائم؛ الأرقام المكتوبة في النص تطابق المحسوب؛ توجد
            نسختا لغة بالضبط؛ النسختان تتشاركان الصورة الواحدة على سجل الزوج؛ كل وسم
            نظام غذائي مشتق بمحرك قواعد من المكونات والماكروز (الذكاء الاصطناعي لا
            يحدد الأنظمة أبدًا)؛ النص العربي يجتاز فحص الفصحى وتلوث اللاتينية؛
            العناوين تلتزم بحدود الطول؛ الخطوات بين {STEPS_MIN.toLocaleString("ar-EG")}{" "}
            و{STEPS_MAX.toLocaleString("ar-EG")}؛ والوصفة لا تكرر منشورة سابقة. أي بوابة
            فاشلة تحجز الوصفة بسبب مقروء — ولا تنشر نسخة مكسورة أو منفردة أبدًا.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">٤. الزوج الثنائي الذري</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            تُكتب النسختان العربية والإنجليزية استقلالًا من البنية نفسها (المكونات
            والأوزان وهيكل الخطوات) — إحداهما ليست ترجمة للأخرى. تتشاركان سجلًا واحدًا
            للحقائق (المكونات والأوزان والحصص والصورة والقيم المحسوبة)، والنشر يجري في
            معاملة قاعدة بيانات واحدة: إما أن تظهر النسختان معًا أو لا تظهر أي منهما.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">٥. الإفصاح عن الذكاء الاصطناعي</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            يستخدم خط النشر اليومي نماذج لغوية لصياغة الفكرة والبنية والنسختين
            المكتوبتين. الذكاء الاصطناعي لا يحدد الأرقام الغذائية ولا تصنيفات الأنظمة
            ولا قرار النشر. تحمل كل وصفة حالة التحقق الآلي الصادقة على الصفحة، اتساقًا
            مع إرشادات محركات البحث بشأن المحتوى المولد آليًا.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">٦. تراخيص الصور</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            صور الوصفات مصدرها أسواق Pexels وUnsplash وPixabay، وتراخيصها تجيز
            الاستخدام التجاري بلا إسناد. يُبنى استعلام البحث من اسم الطبق ومكوناته
            الرئيسية (لا من عبارة عامة)، وتُصفَّى النتائج بنوع الطبق قبل الاختيار.
            ملف الصورة نفسه يُعرض للنسختين العربية والإنجليزية. يبقى الحق لل مصوري
            الصور؛ ولا تدّعي Alkemos ملكية الصور.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">٧. أسئلة شائعة</h2>
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
