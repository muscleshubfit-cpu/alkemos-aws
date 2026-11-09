import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Clock, Flame, Printer, Share2 } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  RecipeServingsScaler,
  type ScalerNutrition,
} from "@/components/recipes/RecipeServingsScaler";
import { RecipeFavoriteButton } from "@/components/recipes/RecipeFavoriteButton";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { PrintButtonClient } from "@/components/recipes/PrintButtonClient";
import { buildShareLinks } from "@/lib/share-links";
import { listRelatedRecipes } from "@/lib/recipes-server";
import type { RecipeDetail, RecipeLanguage } from "@/lib/recipes-shared";
import { DIET_LABELS, CUISINE_LABELS, MEAL_TYPE_LABELS } from "@/lib/recipes-shared";

/**
 * RECIPE-DETAIL-VIEW — the full recipe page (HEALTHY-RECIPES-PLATFORM
 * plan §9.2 — every owner §10 requirement rendered).
 *
 * Server component: the hero shows the ONE shared image (the master
 * record's image_url — same file for both languages by construction),
 * the ingredients/weights/steps come from the shared pair truth, and
 * the ONLY client island is the servings scaler (which recomputes
 * everything from the passed ingredient data — no network).
 *
 * Print CSS (@media print): ingredients + steps only, images/ads/chrome
 * hidden — the owner's «طباعة» requirement.
 */
export async function RecipeDetailView({
  detail,
  lang,
  favorited = false,
  pageUrl,
}: {
  detail: RecipeDetail;
  lang: RecipeLanguage;
  favorited?: boolean;
  pageUrl: string;
}) {
  const isAr = lang === "ar";
  const related = await listRelatedRecipes(detail, lang, 3);
  const totalMinutes = detail.prepMinutes + detail.cookMinutes;

  const share = buildShareLinks({
    url: pageUrl,
    shareText: isAr ? detail.title : detail.title,
    fbQuote: detail.excerpt.slice(0, 120),
    platforms: ["whatsapp", "facebook", "x", "telegram"],
  });

  const basePerServing: ScalerNutrition = {
    calories: detail.caloriesPerServing,
    protein: detail.proteinPerServing,
    carbs: detail.carbsPerServing,
    fat: detail.fatPerServing,
    fiber: detail.fiberPerServing,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-[var(--muted-foreground)] print:hidden">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={isAr ? "/ar" : "/"} className="hover:underline">
                {isAr ? "الرئيسية" : "Home"}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href={isAr ? "/ar/recipes" : "/recipes"} className="hover:underline">
                {isAr ? "الوصفات الصحية" : "Healthy Recipes"}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-medium text-[var(--text)]">
              {detail.title}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header>
          <div className="flex flex-wrap gap-2 print:hidden">
            {detail.cuisines.map((c) => (
              <Link
                key={c}
                href={`${isAr ? "/ar/recipes" : "/recipes"}/cuisine/${c}`}
                className="rounded-full bg-[var(--tint)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--text)]"
              >
                {isAr ? CUISINE_LABELS[c].ar : CUISINE_LABELS[c].en}
              </Link>
            ))}
            {detail.diets.map((d) => (
              <Link
                key={d}
                href={`${isAr ? "/ar/recipes" : "/recipes"}/diet/${d}`}
                className="rounded-full bg-[var(--tint)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--text)]"
              >
                {isAr ? DIET_LABELS[d].ar : DIET_LABELS[d].en}
              </Link>
            ))}
            {detail.mealTypes.map((m) => (
              <span
                key={m}
                className="rounded-full bg-[var(--tint)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
              >
                {isAr ? MEAL_TYPE_LABELS[m].ar : MEAL_TYPE_LABELS[m].en}
              </span>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl" data-speakable="headline">
            {detail.title}
          </h1>
          <p className="mt-3 text-base text-[var(--muted-foreground)]" data-speakable="summary">
            {detail.excerpt}
          </p>

          {/* facts strip */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)] print:hidden">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {isAr
                ? `${totalMinutes.toLocaleString("ar-EG")} دقيقة (تحضير ${detail.prepMinutes} + طهي ${detail.cookMinutes})`
                : `${totalMinutes} min (prep ${detail.prepMinutes} + cook ${detail.cookMinutes})`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame className="h-4 w-4" aria-hidden="true" />
              {isAr
                ? `${detail.caloriesPerServing.toLocaleString("ar-EG")} سعرة/حصة`
                : `${detail.caloriesPerServing} kcal/serving`}
            </span>
            <span>
              {isAr
                ? `${detail.servings.toLocaleString("ar-EG")} حصص · وزن الحصة ≈ ${detail.servingWeightG.toLocaleString("ar-EG")} جم`
                : `${detail.servings} servings · serving ≈ ${detail.servingWeightG} g`}
            </span>
          </div>

          {/* actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden">
            <RecipeFavoriteButton recipeId={detail.id} initialFavorited={favorited} lang={lang} />
            <PrintButton lang={lang} />
            <ShareRow links={share} lang={lang} />
          </div>
        </header>

        {/* the ONE shared image */}
        {detail.imageUrl ? (
          <figure className="mt-8 overflow-hidden rounded-2xl border border-[var(--edge)]">
            <div className="relative aspect-[16/9] w-full bg-[var(--tint)]">
              <ImageWithFallback
                src={detail.imageUrl}
                alt={detail.imageAlt ?? detail.title}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
                loading="eager"
              />
            </div>
            <figcaption className="bg-[var(--tint)] px-4 py-2 text-xs text-[var(--muted-foreground)] print:hidden">
              {isAr
                ? "الصورة نفسها تُعرض في النسختين العربية والإنجليزية (اشتراط التطابق)."
                : "The same image serves both the Arabic and English versions (the pairing law)."}
            </figcaption>
          </figure>
        ) : null}

        {/* ingredients + scaler + nutrition table */}
        <section className="mt-10">
          <RecipeServingsScaler
            baseServings={detail.servings}
            ingredients={detail.ingredients}
            basePerServing={basePerServing}
            lang={lang}
          />

          {/* optional enrichment values (owner §2 — never fabricated) */}
          {detail.satFatPerServing !== null || detail.sodiumPerServing !== null ? (
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              {isAr ? "قيم إضافية لكل حصة:" : "Additional per-serving values:"}{" "}
              {detail.satFatPerServing !== null
                ? isAr
                  ? `دهون مشبعة ${detail.satFatPerServing} جم`
                  : `saturated fat ${detail.satFatPerServing} g`
                : null}
              {detail.satFatPerServing !== null && detail.sodiumPerServing !== null ? " · " : ""}
              {detail.sodiumPerServing !== null
                ? isAr
                  ? `صوديوم ${detail.sodiumPerServing} مجم`
                  : `sodium ${detail.sodiumPerServing} mg`
                : null}
              {" — "}
              {isAr
                ? "تُدرج فقط عند توفر بيانات مرجعية موثوقة."
                : "listed only where reliable reference data exists."}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-[var(--muted-foreground)] print:hidden">
            {isAr ? "القيم المحسوبة من:" : "Values computed from:"}{" "}
            <strong>{detail.nutritionSourceLabel}</strong>
            {" — "}
            <Link
              href={isAr ? "/ar/recipes/methodology" : "/recipes/methodology"}
              className="underline underline-offset-4"
            >
              {isAr ? "المنهجية" : "methodology"}
            </Link>
          </p>
        </section>

        {/* steps */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold print:text-base">
            {isAr ? "طريقة التحضير" : "Preparation"}
          </h2>
          <ol className="mt-3 space-y-3">
            {detail.steps.map((s) => (
              <li key={s.position} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--text)] text-xs font-bold text-[var(--bg)] print:border print:border-black">
                  {isAr ? s.position.toLocaleString("ar-EG") : s.position}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* tips / storage / substitutions */}
        {detail.tips ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold print:text-base">{isAr ? "نصائح" : "Tips"}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
              {detail.tips}
            </p>
          </section>
        ) : null}

        {detail.storageInfo ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold print:text-base">
              {isAr ? "التخزين" : "Storage"}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
              {detail.storageInfo}
            </p>
          </section>
        ) : null}

        {detail.substitutions.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold print:text-base">
              {isAr ? "بدائل وأثرها" : "Substitutions & their impact"}
            </h2>
            <ul className="mt-2 space-y-2">
              {detail.substitutions.map((s, i) => (
                <li
                  key={`${s.from}-${i}`}
                  className="rounded-lg bg-[var(--tint)] px-4 py-2.5 text-sm print:bg-white"
                >
                  <strong>{s.from}</strong> → <strong>{s.to}</strong>
                  {s.note ? <span className="text-[var(--muted-foreground)]"> — {s.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* FAQ (real questions only — the NO-FORCED-FILLER law) */}
        {detail.faq && detail.faq.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold print:text-base">
              {isAr ? "أسئلة شائعة" : "FAQ"}
            </h2>
            <div className="mt-2 divide-y divide-[var(--edge)] rounded-xl border border-[var(--edge)]">
              {detail.faq.map((f, i) => (
                <details key={i} className="group px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    {f.question}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {/* honest methodology disclosure (ق3 — auto_verified) */}
        <section className="mt-10 rounded-xl border border-[var(--edge)] bg-[var(--tint)] p-4 text-xs leading-relaxed text-[var(--muted-foreground)] print:hidden">
          {isAr ? (
            <>
              <strong>منهجية الإنتاج والتحقق:</strong> يُنتج خط النشر اليومي هذه الوصفة كزوج
              ثنائي اللغة (نسخة عربية ونسخة إنجليزية مستقلتان من التأليف — ليست ترجمة)، وتُحسب
              كل قيمة غذائية برمجيًا من مرجع مغذيات موثق ({detail.nutritionSourceLabel}) بعد
              اجتياز بوابات تحقق حتمية (اتساق السعرات، مطابقة الأوزان، السلامة اللغوية).
              الحالة: {detail.verificationStatus === "passed" ? "متحققة آليًا" : detail.verificationStatus}.
            </>
          ) : (
            <>
              <strong>Production & verification methodology:</strong> the daily pipeline produces
              this recipe as a bilingual pair (independently authored Arabic and English versions —
              never a translation), and every nutrition value is computed programmatically from a
              verified nutrient reference ({detail.nutritionSourceLabel}) after passing
              deterministic gates (calorie consistency, weight integrity, language quality).
              Status: {detail.verificationStatus === "passed" ? "auto-verified" : detail.verificationStatus}.
            </>
          )}
        </section>

        {/* related recipes */}
        {related.length > 0 ? (
          <section className="mt-10 print:hidden">
            <h2 className="text-lg font-semibold">{isAr ? "وصفات ذات صلة" : "Related recipes"}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <RecipeCard key={r.id} recipe={r} lang={lang} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}

/* ─── print + share controls (inline server-rendered UI) ─── */
function PrintButton({ lang }: { lang: "en" | "ar" }) {
  return <PrintButtonClient lang={lang} isAr={lang === "ar"} />;
}

function ShareRow({
  links,
  lang,
}: {
  links: Array<{ platform: string; name: string; color: string; href: string }>;
  lang: "en" | "ar";
}) {
  const isAr = lang === "ar";
  return (
    <span className="inline-flex items-center gap-1 print:hidden">
      <Share2 className="mx-1 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
      {links.map((l) => (
        <a
          key={l.platform}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          className="rounded-full bg-[var(--tint)] px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--card)]"
        >
          {l.name}
        </a>
      ))}
      <span className="sr-only">{isAr ? "مشاركة الوصفة" : "Share this recipe"}</span>
    </span>
  );
}
