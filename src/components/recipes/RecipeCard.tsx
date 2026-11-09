import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import type { RecipeSummary } from "@/lib/recipes-shared";
import { DIET_LABELS, CUISINE_LABELS } from "@/lib/recipes-shared";

/**
 * RECIPE-CARD — one bilingual recipe card (server component).
 *
 * The marble-card + ImageWithFallback foods/blog card pattern. Facts
 * shown are the COMPUTED per-serving values (never model output — the
 * recipes-nutrition law), and the diet/cuisine badges are the closed
 * taxonomy labels from recipes-shared.
 */
export function RecipeCard({
  recipe,
  lang,
  priority = false,
}: {
  recipe: RecipeSummary;
  lang: "en" | "ar";
  priority?: boolean;
}) {
  const isAr = lang === "ar";
  const href = isAr ? `/ar/recipes/${recipe.slug}` : `/recipes/${recipe.slug}`;
  const totalMin = recipe.prepMinutes + recipe.cookMinutes;
  const cuisine = recipe.cuisines[0];
  const diet = recipe.diets[0];

  return (
    <Link href={href} className="card-hover group marble-card block overflow-hidden">
      {recipe.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--tint)]">
          <ImageWithFallback
            src={recipe.imageUrl}
            alt={recipe.imageAlt ?? recipe.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            {...(priority ? { priority: true } : {})}
          />
        </div>
      ) : null}

      <div className="p-3">
        {/* taxonomy line */}
        <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
          {cuisine ? (isAr ? CUISINE_LABELS[cuisine].ar : CUISINE_LABELS[cuisine].en) : ""}
          {cuisine && diet ? " · " : ""}
          {diet ? (isAr ? DIET_LABELS[diet].ar : DIET_LABELS[diet].en) : ""}
        </span>

        <h3 className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight">{recipe.title}</h3>

        {/* computed per-serving facts (kcal blue · protein green · carbs orange · fat red) */}
        <div className="mt-2 grid grid-cols-2 gap-1">
          <div className="rounded bg-white px-1.5 py-1 text-center">
            <p className="text-xs font-semibold leading-tight text-[#0071e3]">
              {recipe.caloriesPerServing.toLocaleString(isAr ? "ar-EG" : "en-US")}
            </p>
            <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">
              {isAr ? "سعرة/حصة" : "kcal/serving"}
            </p>
          </div>
          <div className="rounded bg-white px-1.5 py-1 text-center">
            <p className="text-xs font-semibold leading-tight text-[#34c759]">
              {isAr ? `${recipe.proteinPerServing} جم` : `${recipe.proteinPerServing}g`}
            </p>
            <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">
              {isAr ? "بروتين" : "Protein"}
            </p>
          </div>
          <div className="rounded bg-white px-1.5 py-1 text-center">
            <p className="text-xs font-semibold leading-tight text-[#ff9500]">
              {isAr ? `${recipe.carbsPerServing} جم` : `${recipe.carbsPerServing}g`}
            </p>
            <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">
              {isAr ? "كربوهيدرات" : "Carbs"}
            </p>
          </div>
          <div className="rounded bg-white px-1.5 py-1 text-center">
            <p className="text-xs font-semibold leading-tight text-[#ff3b30]">
              {isAr ? `${recipe.fatPerServing} جم` : `${recipe.fatPerServing}g`}
            </p>
            <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">
              {isAr ? "دهون" : "Fat"}
            </p>
          </div>
        </div>

        {/* time + servings line */}
        <p className="mt-2 text-[11px] font-normal text-[var(--muted-foreground)]">
          ⏱ {totalMin} {isAr ? "دقيقة" : "min"} ·{" "}
          {isAr
            ? recipe.servings === 1
              ? "حصة واحدة"
              : `${recipe.servings} حصص`
            : recipe.servings === 1
              ? "1 serving"
              : `${recipe.servings} servings`}
        </p>
      </div>
    </Link>
  );
}
