"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useNav } from "@/hooks/use-nav";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSenseAd } from "@/components/AdSenseAd";
import { OtherTools } from "@/components/OtherTools";
import { RecipeSuggestStrip } from "@/components/recipes/RecipeSuggestStrip";
import { ShareButtons } from "@/components/ShareButtons";
import { ReviewInviteCard } from "@/components/ReviewInviteCard";
import { ShoppingListCard } from "@/components/ShoppingListCard";
import { ToolReferenceContent } from "@/components/ToolReferenceContent";
import { MEAL_PLANNER_CONTENT } from "@/lib/content/meal-planner";
import { LeadCaptureCard } from "@/components/LeadCaptureCard";
import {
  Plus,
  Trash2,
  Search,
  Loader2,
  Bookmark,
  Check,
  Download,
  X,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { getLimits, type MembershipTier } from "@/lib/memberships";

// Content-strategy terminology law: bare Latin tier slugs never appear
// inside Arabic sentences — map to the canonical AR tier names.
const TIER_NAME_AR: Record<MembershipTier, string> = {
  free: "مجاني",
  premium: "بريميوم",
  pro: "برو",
  coaching: "التدريب الأونلاين",
};

// ===== Types =====

type Per100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealItem = {
  id: string;
  name: string;
  source: "local" | "openfoodfacts";
  grams: number;
  per100g: Per100g;
};

type Meal = {
  id: string;
  name: string;
  items: MealItem[];
};

type SearchResult = {
  name: string;
  source: "local" | "openfoodfacts";
  per100g: Per100g;
};

// ===== Helpers =====

const newId = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const computeMacros = (item: MealItem) => {
  const factor = (item.grams || 0) / 100;
  return {
    calories: Math.round(item.per100g.calories * factor),
    protein: Math.round(item.per100g.protein * factor),
    carbs: Math.round(item.per100g.carbs * factor),
    fat: Math.round(item.per100g.fat * factor),
  };
};

const MEAL_NAME_PRESETS_AR = ["الفطور", "الغداء", "العشاء", "سناك", "قبل التمرين", "بعد التمرين"];
const MEAL_NAME_PRESETS_EN = ["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"];

// ===== Main Component =====

export default function MealPlannerPage() {
  const { lang } = useI18n();
  const { profile } = useAuth();
  const { navigate } = useNav();
  const isAr = lang === "ar";

  // Resolve tier + limits
  const [tier, setTier] = useState<MembershipTier>("free");
  const limits = getLimits(tier);
  const maxMeals = limits.mealPlannerMaxMeals;
  const maxSaved = limits.mealPlannerMaxSaved;

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "client") {
      setTier("coaching");
      return;
    }
    // PHASE 182: public tool page — the data layer (→ @supabase/ssr) is
    // imported on demand; the effect only runs when a profile exists.
    import("@/lib/data")
      .then(({ getSubscriptionForClient }) => getSubscriptionForClient(profile.id))
      .then((sub: { tier?: string | null } | null) => {
      if (sub?.tier && ["free", "premium", "pro", "coaching"].includes(sub.tier)) {
        setTier(sub.tier as MembershipTier);
      }
    });
  }, [profile]);

  // M43 fix: persist meal planner draft to localStorage so it survives refreshes.
  const DRAFT_KEY = "mhe:meal-planner-draft";

  // Meals state — start with 1 empty meal OR restore from localStorage
  const [meals, setMeals] = useState<Meal[]>(() => {
    if (typeof window === "undefined") {
      return [{ id: newId(), name: isAr ? "الفطار" : "Breakfast", items: [] }];
    }
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.meals && Array.isArray(parsed.meals) && parsed.meals.length > 0) {
          return parsed.meals;
        }
      }
    } catch {}
    return [{ id: newId(), name: isAr ? "الفطار" : "Breakfast", items: [] }];
  });
  const [planTitle, setPlanTitle] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.planTitle) return parsed.planTitle;
      }
    } catch {}
    return "";
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Debounced save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ meals, planTitle }));
      } catch {}
    }, 500);
    return () => clearTimeout(timeout);
  }, [meals, planTitle]);

  // Add a new meal (respect maxMeals limit)
  const addMeal = () => {
    if (maxMeals !== null && meals.length >= maxMeals) {
      toast.error(
        isAr
          ? `الحد الأقصى لحسابك ${maxMeals} وجبات`
          : `Max ${maxMeals} meals for your tier`,
      );
      return;
    }
    const idx = meals.length;
    const preset = (isAr ? MEAL_NAME_PRESETS_AR : MEAL_NAME_PRESETS_EN)[idx] ||
      (isAr ? `وجبة ${idx + 1}` : `Meal ${idx + 1}`);
    setMeals([...meals, { id: newId(), name: preset, items: [] }]);
  };

  const removeMeal = (mealId: string) => {
    setMeals(meals.filter((m) => m.id !== mealId));
  };

  const renameMeal = (mealId: string, name: string) => {
    setMeals(meals.map((m) => (m.id === mealId ? { ...m, name } : m)));
  };

  const addItemToMeal = (mealId: string, item: MealItem) => {
    setMeals(
      meals.map((m) =>
        m.id === mealId ? { ...m, items: [...m.items, item] } : m,
      ),
    );
  };

  const removeItemFromMeal = (mealId: string, itemId: string) => {
    setMeals(
      meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.filter((i) => i.id !== itemId) }
          : m,
      ),
    );
  };

  const updateItemGrams = (mealId: string, itemId: string, grams: number) => {
    setMeals(
      meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: m.items.map((i) =>
                i.id === itemId ? { ...i, grams } : i,
              ),
            }
          : m,
      ),
    );
  };

  // ===== Totals =====
  const mealTotals = meals.map((m) => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const item of m.items) {
      const mac = computeMacros(item);
      calories += mac.calories;
      protein += mac.protein;
      carbs += mac.carbs;
      fat += mac.fat;
    }
    return { calories, protein, carbs, fat };
  });

  const grandTotal = mealTotals.reduce(
    (acc, t) => ({
      calories: acc.calories + t.calories,
      protein: acc.protein + t.protein,
      carbs: acc.carbs + t.carbs,
      fat: acc.fat + t.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  // ===== Save =====
  const handleSave = async () => {
    if (!profile) {
      toast.error(isAr ? "سجّل الدخول للحفظ" : "Log in to save");
      navigate("auth", { mode: "login" });
      return;
    }
    // Must have at least 1 meal with 1 item
    const hasItems = meals.some((m) => m.items.length > 0);
    if (!hasItems) {
      toast.error(isAr ? "أضف صنفًا غذائيًا واحدًا على الأقل" : "Add at least one food");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tools/save-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planTitle || (isAr ? "خطة وجبات" : "Meal Plan"),
          plan_data: {
            meals: meals
              .filter((m) => m.items.length > 0)
              .map((m) => ({
                name: m.name,
                items: m.items.map((i) => ({
                  name: i.name,
                  source: i.source,
                  grams: i.grams,
                  per100g: i.per100g,
                })),
              })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Limit reached") {
          toast.error(
            isAr
              ? `وصلت حد الحفظ (${data.limit}). طوّر باقتك للمزيد.`
              : `Save limit reached (${data.limit}). Upgrade for more.`,
          );
        } else if (data.error === "Too many meals") {
          toast.error(
            isAr
              ? `الحد الأقصى لحسابك ${data.limit} وجبات`
              : `Max ${data.limit} meals for your tier`,
          );
        } else {
          toast.error(data.error || (isAr ? "فشل الحفظ" : "Failed to save"));
        }
        return;
      }
      setSaved(true);
      toast.success(isAr ? "تم حفظ الجدول ✅" : "Plan saved ✅");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : (isAr ? "فشل الحفظ" : "Failed to save"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadJson = () => {
    // PHASE 69 — GATE: JSON export is a PREMIUM+ feature (mealPlannerExport)
    // and the refund policy counts exports as paid usage. The ungated button
    // contradicted both. Free users get the upgrade prompt instead.
    if (!limits.mealPlannerExport) {
      toast.error(
        isAr
          ? "التصدير متاح مع باقات بريميوم وبرو وما فوق — طوّر باقتك للمتابعة."
          : "Export is available on Premium and Pro — upgrade to continue.",
      );
      navigate("memberships");
      return;
    }
    const exportData = {
      tool: "meal-planner",
      title: planTitle || (isAr ? "خطة وجبات" : "Meal Plan"),
      date: new Date().toISOString(),
      totals: grandTotal,
      meals: meals.filter((m) => m.items.length > 0),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meal-plan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? "تم التحميل" : "Downloaded");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "مخطط الوجبات" : "Meal Planner"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "ابنِ وجباتك من قاعدة بيانات 8,830+ صنف غذائي وتابع الماكروز لكل وجبة والإجمالي."
              : "Build your meals from 8,830+ foods and see per-meal + total macros."}
          </p>
          {/* HEALTHY-RECIPES-PLATFORM (plan §9.4): «استبدل هذا الطبق
              بوصفة جاهزة» — ready recipes beside the builder; honest
              empty until the pipeline publishes (zero regression). */}
          <div className="mt-6 text-start">
            <RecipeSuggestStrip
              lang={lang}
              maxCalories={700}
              title={isAr ? "أو استبدل طبقك بوصفة جاهزة محسوبة" : "Or swap the dish for a ready computed recipe"}
            />
          </div>
          {/* Tier badge */}
          <div className="seal-chip mt-4 inline-flex items-center gap-2">
            <Utensils className="h-3.5 w-3.5 text-[var(--muted-2)]" />
            {isAr ? "عضويتك" : "Your plan"}: <span className="font-semibold">{isAr ? TIER_NAME_AR[tier] : tier}</span>
            {" · "}
            {maxMeals === null
              ? isAr ? "وجبات غير محدودة" : "unlimited meals"
              : isAr ? `${maxMeals} وجبات كحد أقصى` : `max ${maxMeals} meals`}
            {" · "}
            {maxSaved === null
              ? isAr ? "حفظ غير محدود" : "unlimited saves"
              : isAr ? `${maxSaved} حفظ` : `${maxSaved} saves`}
          </div>
        </div>

        {/* Plan title + actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            placeholder={isAr ? "اسم الجدول (اختياري)" : "Plan name (optional)"}
            className="flex-1 min-w-[200px] rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
          />
          <button
            onClick={addMeal}
            disabled={maxMeals !== null && meals.length >= maxMeals}
            className="btn-chrome inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isAr ? "وجبة جديدة" : "Add meal"}
          </button>
        </div>

        {/* Meals list */}
        <div className="mt-6 space-y-4">
          {meals.map((meal, idx) => (
            <MealCard
              key={meal.id}
              meal={meal}
              index={idx}
              totals={mealTotals[idx]}
              isAr={isAr}
              onRename={(name) => renameMeal(meal.id, name)}
              onRemove={() => removeMeal(meal.id)}
              canRemove={meals.length > 1}
              onAddItem={(item) => addItemToMeal(meal.id, item)}
              onRemoveItem={(itemId) => removeItemFromMeal(meal.id, itemId)}
              onUpdateGrams={(itemId, g) => updateItemGrams(meal.id, itemId, g)}
            />
          ))}
        </div>

        {/* Grand total */}
        <div className="mt-8 rounded-[var(--radius-chrome)] bg-black p-6 text-white md:p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              {isAr ? "الإجمالي الكلي" : "Grand Total"}
            </h3>
            <span className="text-xs font-normal text-gray-400">
              {meals.length} {isAr ? "وجبة" : "meals"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={isAr ? "سعرات" : "Calories"} value={grandTotal.calories} unit={isAr ? "سعرة" : "kcal"} color="#ff9500" big />
            <Stat label={isAr ? "بروتين" : "Protein"} value={grandTotal.protein} unit={isAr ? "جم" : "g"} color="#34c759" big />
            <Stat label={isAr ? "كربوهيدرات" : "Carbs"} value={grandTotal.carbs} unit={isAr ? "جم" : "g"} color="#0071e3" big />
            <Stat label={isAr ? "دهون" : "Fat"} value={grandTotal.fat} unit={isAr ? "جم" : "g"} color="#8b5cf6" big />
          </div>
        </div>

        {/* Shopping list — §12.30: the tool that fulfills the written
            grocery-list promise, derived live from the plan above. */}
        <ShoppingListCard meals={meals} />

        {/* Save + Download */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="btn-chrome inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {saved
              ? isAr ? "تم الحفظ" : "Saved"
              : isAr ? "حفظ الجدول" : "Save plan"}
          </button>
          <button
            onClick={handleDownloadJson}
            className="btn-outline inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Download className="h-4 w-4" />
            {isAr ? "تحميل JSON" : "JSON"}
          </button>
        </div>

        {/* Lead Capture — Phase 72: email the plan totals (owner request) */}
        <div className="mt-6">
          <LeadCaptureCard
            toolSlug="meal-planner"
            resultSummary={
              isAr
                ? `خطتي: ${meals.length} وجبات · ${grandTotal.calories} سعرة · بروتين ${grandTotal.protein} جم · كربوهيدرات ${grandTotal.carbs} جم · دهون ${grandTotal.fat} جم`
                : `My plan: ${meals.length} meals · ${grandTotal.calories} kcal · protein ${grandTotal.protein}g · carbs ${grandTotal.carbs}g · fat ${grandTotal.fat}g`
            }
            resultJson={{
              meals: meals.length,
              calories: grandTotal.calories,
              protein: grandTotal.protein,
              carbs: grandTotal.carbs,
              fat: grandTotal.fat,
            }}
          />
        </div>

        {/* Share */}
        <div className="marble-card mt-6 p-4">
          <ShareButtons
            path="/meal-planner"
            title={
              isAr
                ? `مخطط وجباتي | ${grandTotal.calories} سعرة | Alkemos`
                : `My meal plan | ${grandTotal.calories} kcal | Alkemos`
            }
          />
        </div>

        {/* Review invite (SEO-GEO-6.3 §12.22 + §12.24) — always-on slim strip below the generated plan, never blocks it */}
        <ReviewInviteCard />

        {/* AdSense */}
        <AdSenseAd format="auto" />
        <OtherTools current="meal-planner" />

        {/* §12.33: ready-made plans cross-link — the diet-plan library is
            one click from the builder (§12.27 owner directive «لا يوجد رابط
            واضح للمستخدم ولا ذكر فى اى قسم» · §12.33 move to the libraries
            under the owner's name). */}
        <div className="marble-card mt-8 p-5 md:p-6">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "تبحث عن خطة جاهزة بدل البناء بنفسك؟" : "Prefer a ready-made plan?"}
          </h3>
          <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "مكتبة الخطط الغذائية الجاهزة: ٢٤ خطة يوم كاملة (٦ مستويات سعرات × ٤ أنظمة) بالغرامات والسعرات لكل صنف — اختر رقمك وابدأ اليوم، ثم خصّصها هنا بالغرامات."
              : "The Diet Plan Library: 24 complete daily plans (6 calorie levels × 4 systems) with grams and calories per item — pick your number, start today, then fine-tune it here."}
          </p>
          <a
            href={isAr ? "/ar/diet-plan" : "/diet-plan"}
            className="btn-chrome mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            {isAr ? "تصفّح مكتبة الخطط الجاهزة" : "Browse the Diet Plan Library"}
            <span aria-hidden="true">›</span>
          </a>
        </div>

        {/* Deep reference content — Phase SEO-GEO-6.5 (§12.19 P1-6):
            calculator.net-standard deep content, bilingual, standalone per
            tool (owner law «كل أداة صفحة مستقلة») — replaces legacy block */}
        <ToolReferenceContent content={MEAL_PLANNER_CONTENT} />
      </main>

        {/* Access-point fix (2026-09-14): shared marble footer — this
            public page now carries the same persistent link grid as the
            homepage (SiteFooter component). */}
        <SiteFooter />
    </div>
  );
}

// ===== MealCard =====

function MealCard({
  meal,
  index,
  totals,
  isAr,
  onRename,
  onRemove,
  canRemove,
  onAddItem,
  onRemoveItem,
  onUpdateGrams,
}: {
  meal: Meal;
  index: number;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  isAr: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  onAddItem: (item: MealItem) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateGrams: (itemId: string, grams: number) => void;
}) {
  return (
    // Phase 154 — marble-card--unclipped: overflow:hidden clipped the food
    // search dropdown to the card bounds (271/288px invisible on live mobile).
    // The dropdown (absolute z-20) now escapes over the following cards.
    <div className="marble-card marble-card--unclipped p-5 md:p-6">
      {/* Meal header */}
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)] text-sm font-semibold text-[var(--text)]">
          {index + 1}
        </div>
        <input
          value={meal.name}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 min-w-0 rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2 text-sm font-medium outline-none focus:border-[var(--chrome-edge)]"
          placeholder={isAr ? "اسم الوجبة" : "Meal name"}
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#ff3b30] transition-colors hover:bg-[#ff3b30]/5"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="mt-4 space-y-2">
        {meal.items.length === 0 ? (
          <p className="text-center py-6 text-sm text-[var(--muted-foreground)]">
            {isAr ? "لا توجد أطعمة بعد — ابحث وأضف" : "No foods yet — search and add"}
          </p>
        ) : (
          meal.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              isAr={isAr}
              onRemove={() => onRemoveItem(item.id)}
              onUpdateGrams={(g) => onUpdateGrams(item.id, g)}
            />
          ))
        )}
      </div>

      {/* Add food search */}
      <FoodSearchInput isAr={isAr} onPick={(item) => onAddItem(item)} />

      {/* Meal totals */}
      {meal.items.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-[var(--edge)] bg-[var(--card)] p-3">
          <MiniStat label={isAr ? "سعرات" : "Cal"} value={totals.calories} unit={isAr ? "سعرة" : "kcal"} color="#ff9500" />
          <MiniStat label={isAr ? "بروتين" : "Pro"} value={totals.protein} unit={isAr ? "جم" : "g"} color="#34c759" />
          <MiniStat label={isAr ? "كربوهيدرات" : "Carb"} value={totals.carbs} unit={isAr ? "جم" : "g"} color="#0071e3" />
          <MiniStat label={isAr ? "دهون" : "Fat"} value={totals.fat} unit={isAr ? "جم" : "g"} color="#8b5cf6" />
        </div>
      )}
    </div>
  );
}

// ===== ItemRow =====

function ItemRow({
  item,
  isAr,
  onRemove,
  onUpdateGrams,
}: {
  item: MealItem;
  isAr: boolean;
  onRemove: () => void;
  onUpdateGrams: (grams: number) => void;
}) {
  const mac = computeMacros(item);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--edge)] bg-[var(--card)] p-3">
      {/* Name */}
      <div className="flex-1 min-w-[140px]">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {item.source === "local"
            ? isAr ? "محلي" : "Local"
            : isAr ? "منتج" : "Product"}
          {" · "}
          {isAr ? `${item.per100g.calories} سعرة / 100 جم` : `${item.per100g.calories} kcal / 100g`}
        </p>
      </div>
      {/* Grams input */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={item.grams || ""}
          onChange={(e) => onUpdateGrams(Math.max(0, parseFloat(e.target.value) || 0))}
          placeholder="100"
          className="w-20 rounded-full border border-[var(--edge)] bg-[var(--tint)] px-3 py-1.5 text-sm font-medium text-center outline-none focus:border-[var(--chrome-edge)]"
          dir="ltr"
        />
        <span className="text-xs text-[var(--muted-foreground)]">{isAr ? "جم" : "g"}</span>
      </div>
      {/* Computed macros */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="rounded-full bg-[#ff9500]/10 px-2 py-0.5 font-medium text-[#ff9500]">
          {isAr ? `${mac.calories} سعرة` : `${mac.calories} kcal`}
        </span>
        <span className="rounded-full border border-[var(--edge)] bg-[var(--tint)] px-2 py-0.5 font-semibold text-[var(--text)]">
          P{mac.protein}
        </span>
        <span className="rounded-full border border-[var(--edge)] bg-[var(--tint)] px-2 py-0.5 font-medium text-[var(--muted-2)]">
          C{mac.carbs}
        </span>
        <span className="rounded-full bg-[#8b5cf6]/10 px-2 py-0.5 font-medium text-[#8b5cf6]">
          F{mac.fat}
        </span>
      </div>
      {/* Remove */}
      <button
        onClick={onRemove}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#ff3b30] transition-colors hover:bg-[#ff3b30]/5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ===== FoodSearchInput =====

function FoodSearchInput({
  isAr,
  onPick,
}: {
  isAr: boolean;
  onPick: (item: MealItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      // B-03 ownership rule: an aborted/superseded request never touches
      // loading — so the surface itself must drop the spinner when the
      // query empties (there is no successor query to own it).
      setLoading(false);
      return;
    }
    setLoading(true);
    // B-03 (W1-4c): every query owns its OWN AbortController — the
    // cleanup below aborts the superseded query's in-flight request,
    // so a slow stale response ("chick" resolving after "chicken") can
    // never land its older results over the newer ones. EN and AR are
    // the same file (the /ar mirror re-exports this page).
    const controller = new AbortController();
    const { signal } = controller;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/food-search?q=${encodeURIComponent(query.trim())}&lang=${isAr ? "ar" : "en"}`,
          { signal },
        );
        if (res.ok) {
          const data = await res.json();
          // Late-body belt: if this query was superseded while the body
          // was being read, drop it — the newer query owns the surface.
          if (signal.aborted) return;
          setResults(data.results || []);
          setOpen(true);
        }
      } catch {
        // silent — includes the AbortError of a superseded query.
      } finally {
        // An aborted query hands loading to its successor — clearing it
        // here would kill the newer query's spinner mid-flight.
        if (!signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // Cancel THIS query's in-flight request — the cleanup fires on
      // every keystroke that changes the query, and on unmount.
      controller.abort();
    };
  }, [query]);

  const pick = (r: SearchResult) => {
    onPick({
      id: newId(),
      name: r.name,
      source: r.source,
      grams: 100,
      per100g: r.per100g,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative mt-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={isAr ? "بحث عن صنف غذائي..." : "Search food..."}
          className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] ps-10 pe-4 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
        />
        {loading && (
          <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--muted-foreground)]" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-2xl border border-[var(--edge)] bg-[var(--card)] shadow-xl">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => pick(r)}
              className="flex w-full items-center justify-between gap-2 border-b border-[var(--edge)] px-4 py-2.5 text-start transition-colors last:border-b-0 hover:bg-[var(--tint)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {r.source === "local"
                    ? isAr ? "محلي" : "Local"
                    : isAr ? "منتج" : "Product"}
                  {" · "}
                  {r.per100g.calories} {isAr ? "سعرة" : "kcal"} · P{r.per100g.protein} C{r.per100g.carbs} F{r.per100g.fat}
                </p>
              </div>
              <Plus className="h-4 w-4 shrink-0 text-[var(--muted-2)]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Stat components =====

function Stat({
  label,
  value,
  unit,
  color,
  big,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  big?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`${big ? "text-2xl md:text-3xl" : "text-xl"} font-semibold tracking-tight`}
        style={{ color }}
      >
        {value}
        <span className="ms-1 text-xs font-normal text-gray-400">{unit}</span>
      </p>
      <p className="mt-1 text-xs font-normal text-gray-400">{label}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold" style={{ color }}>
        {value}
        <span className="ms-0.5 text-[10px] font-normal text-[var(--muted-foreground)]">{unit}</span>
      </p>
      <p className="text-[10px] font-normal text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
