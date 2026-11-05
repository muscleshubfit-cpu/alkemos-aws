import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FOOD_COLLECTIONS,
  getFoodCollectionBySlug,
  getFoodsForCollection,
} from "@/lib/hub-collections";
import { listsForCollection } from "@/lib/food-nutrient-lists";
import { CATEGORY_LABELS, TAG_LABELS, calculateNutrition } from "@/lib/foods-shared";
import { getHubDepth } from "@/lib/hub-depth";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HubGuideSection, HubFaqSection } from "@/components/hubs/HubDepth";
import { getItemListSchema, getBreadcrumbSchema, jsonLd, stripTrailingBrandForArTemplate } from "@/lib/seo";

/**
 * /ar/collections/[slug] — Arabic mirror of /collections/[slug].
 *
 * Targets Arabic queries like:
 *   "أطعمة عالية البروتين", "أكلات قليلة الكارب", "أطعمة كيتو",
 *   "أكلات للتخسيس", "مصادر بروتين نباتي"
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return FOOD_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getFoodCollectionBySlug(slug);
  if (!collection) {
    return {
      title: "المجموعة غير موجودة — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/collections/${collection.slug}`;
  return {
    // SEO-GEO-4: strip the trailing brand — the /ar template appends "— Alkemos".
    title: stripTrailingBrandForArTemplate(collection.titleAr),
    description: collection.descriptionAr,
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/collections/${collection.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/collections/${collection.slug}`,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: collection.titleAr,
      description: collection.descriptionAr,
      siteName: "Alkemos",
      locale: "ar_EG",
      // PHASE 187 (deep-audit P0-2): og:image for the AR collection
      // surface — static branded family card (design mirrors
      // /api/og-image).
      images: [
        {
          url: "/images/og/og-home-ar.png?v=4",
          width: 1200,
          height: 630,
          alt: "مجموعات أطعمة مختارة من Alkemos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: collection.titleAr,
      description: collection.descriptionAr,
      images: ["/images/og/og-home-ar.png?v=4"],
    },
  };
}

export default async function ArabicFoodCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getFoodCollectionBySlug(slug);
  if (!collection) notFound();

  const foods = getFoodsForCollection(collection);
  // Phase SEO-GEO-5.2: §6.3 template items 4+5 — depth content covers all
  // ten food collections (no empty collections in this family).
  const depth = getHubDepth("collection", collection.slug);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الأطعمة", url: "/ar/foods" },
    { name: collection.h1Ar, url: `/ar/collections/${collection.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: `${collection.h1Ar} — Alkemos`,
    description: collection.descriptionAr,
    items: foods.map((f) => ({
      name: f.nameAr,
      url: `/ar/foods/${f.slug}`,
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
        <Link href="/ar/foods" className="hover:underline">الأطعمة</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{collection.h1Ar}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{collection.h1Ar}</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {collection.introAr}
        </p>
      </header>

      <div className="mb-8">
        <ShareButtons path={`/collections/${collection.slug}`} title={collection.h1Ar} />
      </div>

      {depth && <HubGuideSection depth={depth} lang="ar" title="دليل التغذية" />}

      <section aria-label="قائمة الأطعمة" className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">كل {collection.h1Ar}</h2>
          <span className="text-sm text-muted-foreground">{foods.length} صنف غذائي</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => {
            const perServing = calculateNutrition(food, food.defaultGrams);
            const catLabel = CATEGORY_LABELS[food.category];
            return (
              <li key={food.slug}>
                <Link
                  href={`/ar/foods/${food.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                >
                  <div className="font-semibold text-foreground">{food.nameAr}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {catLabel.emoji} {catLabel.ar} · الحصة الافتراضية: {food.defaultServingAr} ({food.defaultGrams} جم)
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-muted-foreground">سعرات</div>
                      <div className="font-semibold">{food.per100g.calories}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">ب</div>
                      <div className="font-semibold">{food.per100g.protein}ج</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">ك</div>
                      <div className="font-semibold">{food.per100g.carbs}ج</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">د</div>
                      <div className="font-semibold">{food.per100g.fat}ج</div>
                    </div>
                  </div>
                  {perServing && (
                    <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                      لكل حصة: {perServing.calories} سعرة · {perServing.protein} جم بروتين
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="حسب الفئة" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">تصفّح حسب الفئة</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => {
            const count = foods.filter((f) => f.category === key).length;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                href={`/ar/foods?cat=${key}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {lbl.emoji} {lbl.ar} <span className="text-muted-foreground">({count})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="مجموعات أخرى" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">مجموعات أطعمة أخرى</h2>
        <div className="flex flex-wrap gap-2">
          {FOOD_COLLECTIONS.filter((c) => c.slug !== collection.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/ar/collections/${c.slug}`}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
            >
              {c.h1Ar}
            </Link>
          ))}
        </div>
      </section>

      {/* SEO-GROWTH المرحلة 2 (2026-11-06): تعميق المجموعات — §4.3 —
          كل مركز يربط إلى قوائمه المرتبة بالمغذيات (روابط متبادلة مع
          عائلة /foods/lists/*؛ لا يظهر القسم إلا إن كان للمركز قوائم). */}
      {listsForCollection(collection.slug).length > 0 && (
        <section aria-label="قوائم مرتبة من قاعدة البيانات" className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">قوائم مرتبة من قاعدة بياناتنا</h2>
          <p className="text-sm text-muted-foreground mb-4">
            نفس الأطعمة مرتبة بالأرقام — ترتيب حقيقي محسوب من القاعدة كاملة، لا قوائم مختارة يدويًا.
          </p>
          <div className="flex flex-wrap gap-2">
            {listsForCollection(collection.slug).map((l) => (
              <Link
                key={l.slug}
                href={`/ar/foods/lists/${l.slug}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {l.h1Ar}
              </Link>
            ))}
          </div>
        </section>
      )}

      {depth && <HubFaqSection depth={depth} lang="ar" title="أسئلة شائعة" />}

      <section aria-label="خطّط تغذيتك" className="rounded-lg bg-muted/50 p-6">
        <h2 className="text-xl font-semibold mb-3">خطّط تغذيتك</h2>
        <p className="text-sm text-muted-foreground mb-4">
          احسب احتياجك اليومي من السعرات والماكروز، ثم خطّط وجباتك من هذه المجموعة.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/ar/tools/calorie-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">حاسبة السعرات</Link>
          <Link href="/ar/tools/macro-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">حاسبة الماكروز</Link>
          <Link href="/ar/meal-planner" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">مخطّط الوجبات بالذكاء الاصطناعي</Link>
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
