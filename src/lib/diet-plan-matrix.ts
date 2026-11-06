/**
 * Diet Plan Matrix — Phase SEO-GEO-6.6 (§12.19 P1-8, owner directive
 * 2026-09-12: «ممتاذ نفذ البند ٦ ثم ٨ بالتتابع»).
 *
 * The programmatic Arabic diet-plan matrix: /ar/diet-plan/{level}/{system}
 * — 6 calorie levels × 4 systems = 24 standalone leaf pages + 1 hub,
 * eatthismuch-style (the uncontested Arabic surface per the §12.19 audit:
 * no Arabic meal-plan matrix exists at this quality bar).
 *
 * LAWS (guarded in src/lib/__tests__/diet-plan-matrix.test.ts):
 *   - QUALITY FLOOR (§12.19 DO-NOT "لا آلاف الصفحات الهزيلة"): every
 *     cell carries a UNIQUE intro (level-paragraph + system-paragraph +
 *     computed numbers), a fully computed day plan whose calories close
 *     to within ±10 kcal of the level, a macro table, and the embedded
 *     free-planner CTA (the meal planner works without registration —
 *     free tier: 3 meals with live totals).
 *   - MACROS MATCH THE SITE: splits mirror the macro calculator presets
 *     (balanced 30/40/30 · high-protein 45/35/20 · keto 25/5/70);
 *     vegetarian 25/50/25 is documented here as the site's matrix-only
 *     preset.
 *   - MSA Arabic on the AR surface (blog dialect scanner runs in the tests);
 *     natural-English prose on the EN surface — NOT literal translations
 *     (the §12.19 «لا ترجمة مباشرة» law, applied in both directions).
 *   - NO fabricated ratings, NO FAQPage schema — BreadcrumbList only.
 *   - §12.27 (owner directive «بند ٨ تم تنفيذ عربى فقط مطلوب انجليزى»):
 *     the matrix is now BILINGUAL — /diet-plan/{level}/{system} (EN) +
 *     /ar/diet-plan/{level}/{system} (AR) as full hreflang pairs; one
 *     engine, one solve, identical printed numbers on both surfaces.
 */

export interface MacroSplit {
  /** percent of calories */
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  /** per 100 g */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MatrixMealItem {
  food: string;
  grams: number;
}

export interface MatrixMeal {
  name: string;
  /** The item adjusted to close the calorie gap (must exist in items). */
  flex?: string;
  items: MatrixMealItem[];
}

export interface SolvedItem extends MatrixMealItem {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SolvedMeal {
  name: string;
  items: SolvedItem[];
  kcal: number;
}

export interface SolvedDay {
  meals: SolvedMeal[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietSystem {
  slug: string;
  nameAr: string;
  /**
   * Definite Arabic form (CONTENT-AUDIT P0-4, 2026-09-28, audit §1.10):
   * «النظام متوازن» (definite noun + indefinite adjective) is broken
   * Arabic; templates that qualify the DEFINITE system now use this form
   * («عن النظام المتوازن…»), while card TITLES use the indefinite
   * nameAr («نظام متوازن»). One field, both grammatical cases covered.
   */
  nameArDef: string;
  /** §12.27: the EN matrix surface (owner directive «بند ٨ تم تنفيذ عربى
   * فقط مطلوب انجليزى» — EN cells live at /diet-plan/{level}/{system}). */
  nameEn: string;
  split: MacroSplit;
  /** Item used to close the calorie gap (high-kcal, easy to adjust). */
  meals: MatrixMeal[];
}

export const DIET_LEVELS = [1200, 1500, 1800, 2000, 2500, 3000] as const;
export type DietLevel = (typeof DIET_LEVELS)[number];

/** Per-100 g values (USDA-rounded, plain preparation). */
const FOODS: Record<string, FoodItem> = {
  "بيض مسلوق": { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  "بياض بيض مسلوق": { kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  "خبز بلدي": { kcal: 275, protein: 9, carbs: 55, fat: 1.5 },
  "خبز أسمر": { kcal: 247, protein: 13, carbs: 41, fat: 3.4 },
  "جبنة قريش": { kcal: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  "جبن تشيدر": { kcal: 402, protein: 25, carbs: 1.3, fat: 33 },
  "خيار": { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  "طماطم": { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  "صدر دجاج مشوي": { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  "أرز أبيض مطبوخ": { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "سلطة خضراء": { kcal: 20, protein: 1, carbs: 4, fat: 0.2 },
  "زيت زيتون": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  "سمك بلطي مشوي": { kcal: 128, protein: 26, carbs: 0, fat: 2.7 },
  "سلمون مطبوخ": { kcal: 208, protein: 20, carbs: 0, fat: 13 },
  "بطاطس مشوية": { kcal: 93, protein: 2.5, carbs: 21, fat: 0.1 },
  "خضار مشكلة مطبوخة": { kcal: 55, protein: 2.5, carbs: 9, fat: 0.5 },
  "زبادي يوناني خالي الدسم": { kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  "موز": { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  "تفاح": { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  "لوز": { kcal: 579, protein: 21, carbs: 22, fat: 50 },
  "جوز": { kcal: 654, protein: 15, carbs: 14, fat: 65 },
  "لحم بقري قليل الدهن مطبوخ": { kcal: 250, protein: 26, carbs: 0, fat: 15 },
  "تونة معلبة بالماء": { kcal: 116, protein: 26, carbs: 0, fat: 1 },
  "زبدة": { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  "أفوكادو": { kcal: 160, protein: 2, carbs: 9, fat: 15 },
  "بروكلي مطبوخ": { kcal: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  "سبانخ مطبوخة": { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  "فول مدمس": { kcal: 110, protein: 7.6, carbs: 19, fat: 0.5 },
  "عدس مطبوخ": { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  "حمص مطبوخ": { kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  "توفو متماسك": { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  "شوفان جاف": { kcal: 389, protein: 17, carbs: 66, fat: 7 },
  "لبن كامل الدسم": { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
};

/** EN display names for the meal slots (§12.27 — bilingual-by-construction). */
export const MEAL_NAME_EN: Record<string, string> = {
  "الفطور": "Breakfast",
  "الغداء": "Lunch",
  "العشاء": "Dinner",
  "وجبة خفيفة": "Snack",
};

/**
 * EN display names for the food keys (§12.27). The engine keeps the Arabic
 * food keys as the single identity (one solve, one set of numbers — EN/AR
 * pages MUST print identical arithmetic); this map is the display layer for
 * the EN surface. Guarded: every FOODS key must have an EN name.
 */
export const FOOD_NAMES_EN: Record<string, string> = {
  "بيض مسلوق": "Boiled eggs",
  "بياض بيض مسلوق": "Boiled egg whites",
  "خبز بلدي": "Baladi (pita) bread",
  "خبز أسمر": "Whole-wheat bread",
  "جبنة قريش": "Cottage cheese",
  "جبن تشيدر": "Cheddar cheese",
  "خيار": "Cucumber",
  "طماطم": "Tomato",
  "صدر دجاج مشوي": "Grilled chicken breast",
  "أرز أبيض مطبوخ": "Cooked white rice",
  "سلطة خضراء": "Green salad",
  "زيت زيتون": "Olive oil",
  "سمك بلطي مشوي": "Grilled tilapia",
  "سلمون مطبوخ": "Cooked salmon",
  "بطاطس مشوية": "Baked potato",
  "خضار مشكلة مطبوخة": "Cooked mixed vegetables",
  "زبادي يوناني خالي الدسم": "Fat-free Greek yogurt",
  "موز": "Banana",
  "تفاح": "Apple",
  "لوز": "Almonds",
  "جوز": "Walnuts",
  "لحم بقري قليل الدهن مطبوخ": "Cooked lean beef",
  "تونة معلبة بالماء": "Canned tuna in water",
  "زبدة": "Butter",
  "أفوكادو": "Avocado",
  "بروكلي مطبوخ": "Cooked broccoli",
  "سبانخ مطبوخة": "Cooked spinach",
  "فول مدمس": "Fava beans (ful medames)",
  "عدس مطبوخ": "Cooked lentils",
  "حمص مطبوخ": "Cooked chickpeas",
  "توفو متماسك": "Firm tofu",
  "شوفان جاف": "Dry oats",
  "لبن كامل الدسم": "Whole milk",
};

export const DIET_SYSTEMS: DietSystem[] = [
  {
    slug: "balanced",
    nameAr: "متوازن",
    nameArDef: "المتوازن",
    nameEn: "Balanced",
    split: { protein: 30, carbs: 40, fat: 30 },
    meals: [
      {
        name: "الفطور",
        flex: "خبز بلدي",
        items: [
          { food: "بيض مسلوق", grams: 150 },
          { food: "خبز بلدي", grams: 40 },
          { food: "جبنة قريش", grams: 100 },
          { food: "خيار", grams: 100 },
          { food: "زيت زيتون", grams: 5 },
        ],
      },
      {
        name: "الغداء",
        flex: "أرز أبيض مطبوخ",
        items: [
          { food: "صدر دجاج مشوي", grams: 180 },
          { food: "أرز أبيض مطبوخ", grams: 200 },
          { food: "سلطة خضراء", grams: 200 },
          { food: "زيت زيتون", grams: 10 },
        ],
      },
      {
        name: "العشاء",
        flex: "خضار مشكلة مطبوخة",
        items: [
          { food: "سمك بلطي مشوي", grams: 200 },
          { food: "بطاطس مشوية", grams: 200 },
          { food: "خضار مشكلة مطبوخة", grams: 200 },
          { food: "زيت زيتون", grams: 7 },
        ],
      },
      {
        name: "وجبة خفيفة",
        flex: "زبادي يوناني خالي الدسم",
        items: [
          { food: "زبادي يوناني خالي الدسم", grams: 200 },
          { food: "تفاح", grams: 150 },
        ],
      },
    ],
  },
  {
    slug: "high-protein",
    nameAr: "عالي البروتين",
    nameArDef: "العالي البروتين",
    nameEn: "High-Protein",
    split: { protein: 45, carbs: 35, fat: 20 },
    meals: [
      {
        name: "الفطور",
        flex: "خبز أسمر",
        items: [
          { food: "بيض مسلوق", grams: 200 },
          { food: "بياض بيض مسلوق", grams: 100 },
          { food: "خبز أسمر", grams: 30 },
          { food: "جبنة قريش", grams: 100 },
          { food: "خيار", grams: 100 },
        ],
      },
      {
        name: "الغداء",
        flex: "بطاطس مشوية",
        items: [
          { food: "صدر دجاج مشوي", grams: 250 },
          { food: "بطاطس مشوية", grams: 200 },
          { food: "سلطة خضراء", grams: 150 },
          { food: "زيت زيتون", grams: 8 },
        ],
      },
      {
        name: "العشاء",
        flex: "لحم بقري قليل الدهن مطبوخ",
        items: [
          { food: "لحم بقري قليل الدهن مطبوخ", grams: 150 },
          { food: "تونة معلبة بالماء", grams: 100 },
          { food: "خضار مشكلة مطبوخة", grams: 200 },
          { food: "زيت زيتون", grams: 5 },
        ],
      },
      {
        name: "وجبة خفيفة",
        flex: "زبادي يوناني خالي الدسم",
        items: [
          { food: "زبادي يوناني خالي الدسم", grams: 200 },
          { food: "لوز", grams: 15 },
        ],
      },
    ],
  },
  {
    slug: "keto",
    nameAr: "كيتو",
    nameArDef: "الكيتوني",
    nameEn: "Keto",
    split: { protein: 25, carbs: 5, fat: 70 },
    meals: [
      {
        name: "الفطور",
        flex: "زبدة",
        items: [
          { food: "بيض مسلوق", grams: 200 },
          { food: "زبدة", grams: 15 },
          { food: "جبن تشيدر", grams: 40 },
          { food: "أفوكادو", grams: 100 },
        ],
      },
      {
        name: "الغداء",
        flex: "زيت زيتون",
        items: [
          { food: "صدر دجاج مشوي", grams: 200 },
          { food: "بروكلي مطبوخ", grams: 200 },
          { food: "سلطة خضراء", grams: 150 },
          { food: "زيت زيتون", grams: 20 },
        ],
      },
      {
        name: "العشاء",
        flex: "زبدة",
        items: [
          { food: "سلمون مطبوخ", grams: 200 },
          { food: "سبانخ مطبوخة", grams: 200 },
          { food: "زبدة", grams: 12 },
        ],
      },
      {
        name: "وجبة خفيفة",
        flex: "جوز",
        items: [
          { food: "جوز", grams: 20 },
          { food: "جبن تشيدر", grams: 30 },
        ],
      },
    ],
  },
  {
    slug: "vegetarian",
    nameAr: "نباتي",
    nameArDef: "النباتي",
    nameEn: "Vegetarian",
    split: { protein: 25, carbs: 50, fat: 25 },
    meals: [
      {
        name: "الفطور",
        flex: "خبز بلدي",
        items: [
          { food: "فول مدمس", grams: 200 },
          { food: "خبز بلدي", grams: 60 },
          { food: "زيت زيتون", grams: 8 },
          { food: "طماطم", grams: 100 },
        ],
      },
      {
        name: "الغداء",
        flex: "أرز أبيض مطبوخ",
        items: [
          { food: "عدس مطبوخ", grams: 250 },
          { food: "أرز أبيض مطبوخ", grams: 200 },
          { food: "خضار مشكلة مطبوخة", grams: 200 },
          { food: "زيت زيتون", grams: 8 },
        ],
      },
      {
        name: "العشاء",
        flex: "خضار مشكلة مطبوخة",
        items: [
          { food: "توفو متماسك", grams: 250 },
          { food: "حمص مطبوخ", grams: 100 },
          { food: "خضار مشكلة مطبوخة", grams: 250 },
          { food: "زيت زيتون", grams: 10 },
        ],
      },
      {
        name: "وجبة خفيفة",
        flex: "زبادي يوناني خالي الدسم",
        items: [
          { food: "زبادي يوناني خالي الدسم", grams: 200 },
          { food: "شوفان جاف", grams: 25 },
          { food: "تفاح", grams: 150 },
        ],
      },
    ],
  },
];

export function getDietSystem(slug: string): DietSystem | undefined {
  return DIET_SYSTEMS.find((s) => s.slug === slug);
}

export function isDietLevel(level: string): boolean {
  const n = Number(level);
  return String(n) === level && (DIET_LEVELS as readonly number[]).includes(n);
}

// Keto meals swap the flex items for fat-dense closers.

function itemMacros(item: MatrixMealItem): SolvedItem {
  const f = FOODS[item.food];
  if (!f) throw new Error(`diet-plan-matrix: unknown food ${item.food}`);
  const factor = item.grams / 100;
  return {
    ...item,
    kcal: Math.round(f.kcal * factor),
    protein: Math.round(f.protein * factor),
    carbs: Math.round(f.carbs * factor),
    fat: Math.round(f.fat * factor),
  };
}

/** Integer-kcal total of a meal as it will be displayed. */
function mealKcalInt(meal: MatrixMeal): number {
  return meal.items.reduce(
    (s, i) => s + Math.round((FOODS[i.food].kcal * i.grams) / 100),
    0,
  );
}

/**
 * Scale the system's base day to the requested calorie level and close
 * the residual gap through each meal's flex item, iterating on INTEGER
 * displayed totals so the printed numbers close to within ±10 kcal of
 * the level (test-pinned). Deterministic — same inputs, same page.
 */
export function solveDayPlan(level: DietLevel, system: DietSystem): SolvedDay {
  const baseKcal = system.meals.reduce(
    (sum, m) =>
      sum +
      m.items.reduce((s, i) => s + (FOODS[i.food].kcal * i.grams) / 100, 0),
    0,
  );
  const factor = level / baseKcal;

  // Pass 1: scale every item, rounding grams to 5.
  const meals: MatrixMeal[] = system.meals.map((m) => ({
    name: m.name,
    flex: m.flex,
    items: m.items.map((i) => ({
      food: i.food,
      grams: Math.max(5, Math.round((i.grams * factor) / 5) * 5),
    })),
  }));

  // Pass 2: iterative closure on integer totals via the flex items.
  for (let iter = 0; iter < 8; iter++) {
    const totals = meals.map(mealKcalInt);
    const total = totals.reduce((a, b) => a + b, 0);
    const gap = level - total;
    if (Math.abs(gap) <= 4) break;
    // Fallback flex: first item (data always defines one, this is armor).
    const flexPerMeal = meals.map((m) => {
      const f = m.items.find((i) => i.food === (m.flex ?? m.items[0].food));
      return f;
    });
    // The densest flex item absorbs the whole gap this iteration —
    // dense items converge fastest with the least gram noise.
    let bestIdx = -1;
    let bestDensity = -1;
    flexPerMeal.forEach((f, idx) => {
      if (!f) return;
      const density = FOODS[f.food].kcal;
      if (density > bestDensity) {
        bestDensity = density;
        bestIdx = idx;
      }
    });
    const f = flexPerMeal[bestIdx];
    if (!f) break;
    const kcalPerG = FOODS[f.food].kcal / 100;
    const deltaG = gap / kcalPerG;
    // Keep the flex item meaningful: never below 3 g, never absurd.
    f.grams = Math.max(3, Math.round(f.grams + deltaG));
  }

  // Solve into final numbers.
  const solved: SolvedMeal[] = meals.map((m) => ({
    name: m.name,
    items: m.items.map(itemMacros),
    kcal: 0,
  }));
  const day: SolvedDay = { meals: solved, kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of day.meals) {
    meal.kcal = meal.items.reduce((s, i) => s + i.kcal, 0);
    day.kcal += meal.kcal;
    for (const i of meal.items) {
      day.protein += i.protein;
      day.carbs += i.carbs;
      day.fat += i.fat;
    }
  }
  return day;
}

/** Macro targets in grams for a level under a system's split. */
export function macroTargets(
  level: DietLevel,
  system: DietSystem,
): { protein: number; carbs: number; fat: number } {
  return {
    protein: Math.round((level * system.split.protein) / 100 / 4),
    carbs: Math.round((level * system.split.carbs) / 100 / 4),
    fat: Math.round((level * system.split.fat) / 100 / 9),
  };
}


/** Long-form guidance per level (shared section text on every leaf). */
export const LEVEL_GUIDANCE: Record<DietLevel, string> = {
    1200:
      "خطة الـ1200 سعرة هي الأدنى في المصفوفة، وتُعد عجزًا حقيقيًا لا ينبغي أن يبدأ إلا لمن وزنه قليل أو نشاطه شبه معدوم؛ فبهذا المستوى تتضاءل هوامش الخطأ وتصبح كل حصة بروتين وكل غرام ألياف ضرورة لا رفاهية. إن كنت تفكر في هذا المستوى بجرأة فالأصدق أن تمر على حاسبة السعرات أولًا لتتأكد أنه فعلًا رقمك، وأن تراجع مختصًا إن كان لديك أي وضع صحي — فالأمان هنا أهم من السرعة.",
    1500:
      "خطة الـ1500 سعرة هي منطقة العمل الكلاسيكية لخسارة الدهون عند معظم النساء والرجال الأخف وزنًا: عجز معتدل يحترم العضلة ويترك مساحة لوجبات تشبه وجبات حياة حقيقية. عند هذا المستوى يظل البروتين هو سقف الحماية، وتبقى الألياف والخضروات الوفيرة هي الفارق بين يومٍ يمر بهدوء ويومٍ ينتهي بلقمة غير محسوبة بعد الغروب.",
    1800:
      "خطة الـ1800 سعرة هي المستوى الوسط الأكثر أمانًا في المصفوفة: خسارة هادئة للكثير من الرجال، وتثبيت مريح لكثير من النساء النشيطات، ونقطة انطلاق متوازنة لمن يريد تعلم البناء الغذائي قبل التخصيص العميق. عند هذا الرقم تتسع الميزانية لتنوع كافٍ يجعل الالتزام أسهل بمراحل من الحميات القاسية.",
    2000:
      "خطة الـ2000 سعرة هي المستوى المرجعي للمصفوفة كلها — الرقم الذي عليه بُنيت الوجبات الأساسية قبل التحجيم لأعلى وأدنى. لكثير من البالغين متوسطي النشاط هو رقم تثبيت شبه مثالي: طاقة كاملة للتفكير والتدريب، ومساحة اجتماعية معقولة، وإجماليات سهلة القراءة على أي ملصق طعام.",
    2500:
      "خطة الـ2500 سعرة تدخل أرض البالغين النشيطين: من يتدرب أربع مرات أو أكثر أسبوعيًا، أو يعمل عملًا بدنيًا، أو يسعى لزيادة عضلية محسوبة دون تخمة السعرات. عند هذا المستوى تتحول الكربوهيدرات من مصدر قلق إلى وقود مقصود حول التدريب، ويصبح توزيع الوجبات عبر اليوم أداة أداء لا مجرد تنظيم شهية.",
    3000:
      "خطة الـ3000 سعرة هي أرض البناء: عجزٌ معكوس لمن ينوي اكتساب وزن عضلي بإيقاع منضبط، أو حرارة تثبيت لرياضي حجم تدريبه كبير جدًا. المشكلة الحقيقية هنا ليست المنع بل الحجم — ثلاثة آلاف سعرة من طعام نظيف تعني مواجهة الامتلاء، ولهذا تُبنى الخطة على كثافة سعرية ذكية لا على إغراق الوجبات بالدهون العشوائية.",
};

/** Long-form guidance per system (shared section text on every leaf). */
export const SYSTEM_GUIDANCE: Record<string, string> = {
    balanced:
      "النظام المتوازن (30% بروتين · 40% كربوهيدرات · 30% دهون) هو الافتراضي الذي يوصي به لمن لا يعرف من أين يبدأ: توزيع لا يحارب أي مغذٍّ، يدعم التدريب المختلط، ويترك لكل وجبة بنية مألوفة — مصدر بروتين، ونشوية، وخضار، ودهن طهي. إن كانت هذه أول خطة منظمة لك فابدأ هنا، ثم خصّص لاحقًا حين تعرف كيف يستجيب جسمك.",
    "high-protein":
      "النظام عالي البروتين (45% من السعرات) صُمم لمرحلة الخسارة أو لمن يضع بناء العضلة في صدارة أولوياته: البروتين العالي يحرس العضلة في نقص الطاقة، ويشبع أكثر لكل سعرة، ويكلف الجسم سعرات إضافية في هضمه. إن كنت ستقف طويلًا عند هذا المستوى فراقب التنوع داخل مصادر البروتين كي لا تتحول الخطة إلى مملة قاتلة.",
    keto:
      "النظام الكيتوني (25% بروتين · 5% كربوهيدرات · 70% دهون) هو الأكثر تطلبًا للالتزام في المصفوفة: يقيّد الكربوهيدرات إلى الحد الذي ينقل الأيض إلى الكيتونات، فيدفع الجسم أسابيع تكيف معروفة قبل أن يستقر الشعور. اختره لأن حياتك الغذائية تعمل أفضل داخله — لا لأنه «يحرق أسرع»؛ فتوازن الطاقة ما يزال يحكم الجميع.",
    vegetarian:
      "النظام النباتي (25% بروتين · 50% كربوهيدرات · 25% دهون) يبني يومه على البقول والحبوب ومنتجات الألبان والبيض — تكامل البقول مع الحبوب يغطي الأحماض الأمينية الأساسية كما تفعل وجبة الفول بالخبز منذ أجيال. الرقم الذي يستحق الانتباه هنا هو الحديد وفيتامين B12 لمن يتبع النباتية طويلًا، والحل عملي: تقييم دوري بتحليل دم.",
};

/** Unique-per-cell intro: level paragraph + system paragraph + numbers. */
export function buildCellIntro(
  level: DietLevel,
  system: DietSystem,
  targets: ReturnType<typeof macroTargets>,
): string[] {
  const numbersPara =
    `على ${level} سعرة يوميًا، توزيع هذا النظام يعني: بروتين نحو ${targets.protein} غرامًا ` +
    `(${Math.round((level * system.split.protein) / 100)} سعرة)، وكربوهيدرات نحو ${targets.carbs} غرامًا ` +
    `(${Math.round((level * system.split.carbs) / 100)} سعرة)، ودهونًا نحو ${targets.fat} غرامًا ` +
    `(${Math.round((level * system.split.fat) / 100)} سعرة) — والخطة أدناه مبنيّة بالغرامات لتقترب من هذه الأهداف من طعام حقيقي.`;
  return [LEVEL_GUIDANCE[level], SYSTEM_GUIDANCE[system.slug], numbersPara];
}

/** Unique title/description per cell — NO brand (the /ar layout
 * template appends exactly one " — Alkemos"; eadb3e7 anti-double-brand
 * law). Raw title + template suffix must stay ≤70 chars. */
export function buildCellMetadata(
  level: DietLevel,
  system: DietSystem,
): { title: string; description: string } {
  const title = `نظام ${level} سعرة ${system.nameAr} — خطة يوم كامل بالغرامات`;
  const description = `خطة غذائية عربية جاهزة بنظام ${system.nameAr} على ${level} سعرة يوميًا: فطور وغداء وعشاء ووجبة خفيفة بالغرامات والسعرات، مع توزيع الماكروز وخطوة تخصيصها مجانًا.`;
  return { title, description };
}

/* ══════════════════════ §12.27 — THE EN MATRIX SURFACE ══════════════════════
 * Owner directive (2026-09-12): «بند ٨ تم تنفيذ عربى فقط مطلوب انجليزى» —
 * the EN cells close the strongrfastr chokepoint per the §12.19 plan
 * («النسخة EN لاحقًا لسد عنق strongrfastr»). One engine, one solve: the EN
 * pages print the SAME numbers as their AR twins (bilingual-by-construction
 * parity, like tool-reference.ts) — only the display layer switches.
 * ══════════════════════════════════════════════════════════════════════════ */

/** Long-form guidance per level — EN (distinct prose, not a translation). */
export const LEVEL_GUIDANCE_EN: Record<DietLevel, string> = {
  1200:
    "A 1200-calorie plan is the lowest rung of this matrix, and it is a genuine deficit that should only be started by someone who is very light or almost sedentary; at this level the margin for error shrinks until every protein serving and every gram of fiber becomes a necessity rather than a luxury. If you are considering this level boldly, the honest move is to run the calorie calculator first and confirm it is truly your number — and to review it with a professional if you carry any medical condition, because here safety outranks speed.",
  1500:
    "The 1500-calorie plan is the classic working zone for fat loss among most women and lighter men: a moderate deficit that respects muscle and still leaves room for meals that resemble an actual life. At this level protein remains the protective ceiling, and generous fiber and vegetables remain the difference between a day that passes quietly and one that ends with an uncounted bite after sunset.",
  1800:
    "The 1800-calorie plan is the safest middle level in the matrix: gentle loss for many men, comfortable maintenance for many active women, and a balanced starting point for anyone who wants to learn nutritional structure before diving into deep customization. At this number the budget widens enough for real variety — which makes adherence dramatically easier than any crash diet.",
  2000:
    "The 2000-calorie plan is the reference level of the whole matrix — the number the base meals were built on before being scaled up and down. For many moderately active adults it is a near-perfect maintenance figure: full energy for thinking and training, reasonable social room, and daily totals that read easily off any food label.",
  2500:
    "The 2500-calorie plan enters the land of active adults: anyone training four or more times a week, working a physical job, or pursuing measured muscle gain without a calorie flood. At this level carbohydrates stop being a source of anxiety and become deliberate fuel placed around training, and distributing meals across the day turns into a performance tool rather than mere appetite management.",
  3000:
    "The 3000-calorie plan is building ground: an inverted deficit for anyone intending to gain muscular weight at a disciplined pace, or maintenance heat for an athlete whose training volume is simply very large. The real problem here is not restriction but volume — three thousand calories of clean food means facing fullness, which is why this plan is built on smart calorie density rather than on drowning meals in random fats.",
};

/** Long-form guidance per system — EN (distinct prose, not a translation). */
export const SYSTEM_GUIDANCE_EN: Record<string, string> = {
  balanced:
    "The balanced system (30% protein · 40% carbs · 30% fat) is the default recommended for anyone who does not know where to start: a split that fights no nutrient, supports mixed training, and leaves every meal with a familiar structure — a protein source, a starch, vegetables, and a cooking fat. If this is your first organized plan, start here and customize later, once you know how your body actually responds.",
  "high-protein":
    "The high-protein system (45% of calories from protein) is designed for the fat-loss phase or for anyone who puts muscle building at the top of their priorities: high protein guards muscle in an energy deficit, satiates more per calorie, and costs the body extra calories just to digest. If you plan to stand at this level for a long time, watch variety inside your protein sources so the plan never turns deadly boring.",
  keto:
    "The ketogenic system (25% protein · 5% carbs · 70% fat) is the most demanding on adherence in the whole matrix: it restricts carbohydrates to the point that shifts metabolism onto ketones, pushing the body through well-known adaptation weeks before the feeling settles. Choose it because your food life genuinely works better inside it — not because it supposedly burns faster; energy balance still governs everyone.",
  vegetarian:
    "The vegetarian system (25% protein · 50% carbs · 25% fat) builds its day on legumes, grains, dairy, and eggs — the legume-plus-grain pairing covers the essential amino acids the same way fava beans with bread have done for generations. The numbers that deserve attention here are iron and vitamin B12 for long-term vegetarians, and the practical answer is a periodic assessment with a blood test.",
};

/** Unique-per-cell intro — EN: level paragraph + system paragraph + numbers. */
export function buildCellIntroEn(
  level: DietLevel,
  system: DietSystem,
  targets: ReturnType<typeof macroTargets>,
): string[] {
  const numbersPara =
    `At ${level} calories per day, this system's split means roughly ${targets.protein} g of protein ` +
    `(${Math.round((level * system.split.protein) / 100)} calories), around ${targets.carbs} g of carbs ` +
    `(${Math.round((level * system.split.carbs) / 100)} calories), and about ${targets.fat} g of fat ` +
    `(${Math.round((level * system.split.fat) / 100)} calories) — and the plan below is built in grams to approach these targets from real food.`;
  return [LEVEL_GUIDANCE_EN[level], SYSTEM_GUIDANCE_EN[system.slug], numbersPara];
}

/**
 * Unique title/description per cell — EN. The EN root layout has NO title
 * template, so the brand is written explicitly and the TOTAL must stay
 * ≤60 chars (the repo's EN SERP title budget — clampMetaTitle law).
 */
export function buildCellMetadataEn(
  level: DietLevel,
  system: DietSystem,
): { title: string; description: string } {
  const title = `${level} Calorie ${system.nameEn} Meal Plan in Grams | Alkemos`;
  const description = `A ready ${system.nameEn.toLowerCase()} day plan at ${level} calories: breakfast, lunch, dinner, and a snack in grams and calories, with a macro table and a free customization step.`;
  return { title, description };
}
