"use client";

import { useI18n } from "@/lib/i18n";
import { EngravedIcon } from "@/components/ThemeImg";

// Phase 132 (owner feedback: «باقي الموقع إعادة التنسيق ليتبع هوية الصفحة
// الرئيسية»): engraved icon pairs replace the emoji tiles (zero-emoji law)
// and the tile colors go neutral (Marble & Chrome identity).

// §12.33 (owner directive «انقل خطط غذائيه جاهزة الى المكتبات باسم مكتبة
// الخطط الغذاييه الجاهزه»): the bottom-of-page nav is now TWO clusters —
// the tools, then the content libraries (exercises / foods / the
// ready-made diet-plans library under the owner's name).
const ALL_TOOLS = [
  { slug: "calorie-calculator", nameAr: "حاسبة السعرات الحرارية", nameEn: "Calorie Calculator", icon: "calories" },
  { slug: "bmi-calculator", nameAr: "حاسبة مؤشر كتلة الجسم", nameEn: "BMI Calculator", icon: "bmi" },
  { slug: "macro-calculator", nameAr: "حاسبة الماكروز", nameEn: "Macro Calculator", icon: "macros" },
  { slug: "body-fat-calculator", nameAr: "حاسبة نسبة الدهون", nameEn: "Body Fat Calculator", icon: "bodyfat" },
  // meal-planner + water-tracker are top-level routes (/meal-planner, /tools/water-tracker),
  // so we mark them with an absolute path prefix.
  { slug: "/meal-planner", nameAr: "مخطط الوجبات", nameEn: "Meal Planner", icon: "mealplanner" },
  // §12.28: the AI meal-planner trial joins the bottom-of-page tool nav.
  { slug: "/ai-meal-planner", nameAr: "مخطط الوجبات بالذكاء الاصطناعي", nameEn: "AI Meal Planner", icon: "evo" },
  { slug: "water-tracker", nameAr: "متتبع شرب الماء", nameEn: "Water Tracker", icon: "hydration" },
  // §12.32: the AI workout-planner trial joins the bottom-of-page tool nav.
  { slug: "/ai-workout-planner", nameAr: "مخطط التمارين بالذكاء الاصطناعي", nameEn: "AI Workout Planner", icon: "dumbbell" },
];

// The content libraries cluster (DELIVERY 0050 + §12.33).
const LIBRARIES = [
  { slug: "/exercises", nameAr: "مكتبة التمارين", nameEn: "Exercise Library", icon: "dumbbell" },
  { slug: "/foods", nameAr: "مكتبة الأطعمة", nameEn: "Food Library", icon: "protein" },
  // HEALTHY-RECIPES-PLATFORM (2026-11-10, plan §9.3): the recipes library
  // joins the cluster.
  { slug: "/recipes", nameAr: "الوصفات الصحية", nameEn: "Healthy Recipes", icon: "protein" },
  // §12.33: moved from the tools list into the libraries, renamed per the
  // owner's directive.
  { slug: "/diet-plan", nameAr: "مكتبة الخطط الغذائية الجاهزة", nameEn: "Diet Plan Library", icon: "fruits" },
];

/**
 * OtherTools — shows navigation buttons to all other tools, then the
 * content libraries. Place at the bottom of each tool's result page.
 *
 * Props:
 *   current: the slug of the current tool (to exclude it from the list)
 *
 * Note: `current` may be either a relative slug like "calorie-calculator"
 * OR an absolute path like "/meal-planner" — we match both forms so the
 * current tool is correctly excluded.
 */
export function OtherTools({ current }: { current: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  // Normalize "current" — handle both relative slugs and absolute paths
  const normalizedCurrent = current.startsWith("/") ? current.replace(/^\//, "") : current;
  const others = ALL_TOOLS.filter((t) => t.slug !== normalizedCurrent);
  const libraries = LIBRARIES.filter((t) => t.slug !== normalizedCurrent);

  // SEO-GEO-4 (2026-09-08): every tool now has an Arabic mirror — link to
  // /ar/tools/* (and prefix absolute slugs with /ar) when the page renders
  // in Arabic, so AR crawlers/visitors never bounce back to EN URLs.
  const toolHref = (slug: string) => {
    if (slug.startsWith("/")) return isAr ? `/ar${slug}` : slug;
    return isAr ? `/ar/tools/${slug}` : `/tools/${slug}`;
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold tracking-tight">
        {isAr ? "أدوات أخرى" : "Other Tools"}
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {others.map((tool) => (
          <a
            key={tool.slug}
            href={toolHref(tool.slug)}
            className="marble-card flex items-center gap-3 p-4 transition-opacity hover:opacity-90"
          >
            <EngravedIcon
              name={tool.icon}
              alt=""
              size={40}
              className="h-10 w-10 shrink-0"
            />
            <span className="text-sm font-medium">
              {isAr ? tool.nameAr : tool.nameEn}
            </span>
          </a>
        ))}
        <a
          href={isAr ? "/ar/tools" : "/tools"}
          className="flex items-center gap-3 rounded-2xl bg-black p-4 text-white transition-opacity hover:opacity-90"
          style={{ boxShadow: "0 0 0 2px #C9CED3, var(--shadow)" }}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lg rtl:rotate-180">
            ←
          </span>
          <span className="text-sm font-medium text-white">
            {isAr ? "كل الأدوات" : "All Tools"}
          </span>
        </a>
      </div>

      {/* §12.33: the libraries cluster — its own labeled section so the
          classification is visible, not just implied by order. */}
      <h3 className="mt-8 text-lg font-semibold tracking-tight">
        {isAr ? "المكتبات" : "Libraries"}
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {libraries.map((lib) => (
          <a
            key={lib.slug}
            href={toolHref(lib.slug)}
            className="marble-card flex items-center gap-3 p-4 transition-opacity hover:opacity-90"
          >
            <EngravedIcon
              name={lib.icon}
              alt=""
              size={40}
              className="h-10 w-10 shrink-0"
            />
            <span className="text-sm font-medium">
              {isAr ? lib.nameAr : lib.nameEn}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
