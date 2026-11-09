/**
 * RECIPES-PIPELINE — the generation logic of the daily recipe pair
 * (HEALTHY-RECIPES-PLATFORM plan §6 — R0 idea / R1 structure / R3 authoring).
 *
 * LAWS:
 *  - Every AI call goes through dispatchAI("recipe:*") — the unified
 *    engine, no parallel motor, no new keys (owner §2 + plan §1-4/6).
 *  - The two language versions are authored INDEPENDENTLY: the AR prompt
 *    never contains EN prose and vice versa (never a translation).
 *  - AI proposes STRUCTURE only; every nutrition number is recomputed by
 *    recipes-nutrition.ts from nutrient_reference (R2 — pure code).
 *  - diets[] from the model are WIPED before storage (D-GATE-1): the
 *    rules engine re-derives them in R2.
 *  - Failures are honest: targeted repair ≤ 2 cycles, then held/failed
 *    with a readable reason. Nothing partial is ever published.
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { dispatchAI } from "./ai-router";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  RECIPE_CUISINES,
  RECIPE_GOALS,
  RECIPE_MEAL_TYPES,
  isRecipeCuisine,
  isRecipeGoal,
  isRecipeMealType,
  type RecipeCuisine,
  type RecipeGoal,
  type RecipeMealType,
} from "./recipes-shared";
import { findBlogIntentCollision } from "./intent-map";

/* ───────────────────────── R0 — the idea ───────────────────────── */

export type RecipeIdea = {
  ideaId: string;
  themeAr: string;
  themeEn: string;
  cuisine: RecipeCuisine;
  goal: RecipeGoal;
  mealType: RecipeMealType;
  brief: string;
  sealedAt: string;
};

const ideaSchema = z.object({
  themeAr: z.string().trim().min(6).max(120),
  themeEn: z.string().trim().min(6).max(120),
  brief: z.string().trim().min(20).max(500),
});

/** Deterministic rotation slot: least-recently-used cuisine × mealType
 *  over the last 14 published recipes (the coverage matrix, plan §6.2 R0). */
export async function pickIdeaSlot(): Promise<{ cuisine: RecipeCuisine; mealType: RecipeMealType }> {
  let recent: Array<{ cuisines: string[]; meal_types: string[] }> = [];
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("recipes")
      .select("cuisines, meal_types")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(14);
    recent = (data as never[]) ?? [];
  }
  const lastUseCuisine = new Map<string, number>();
  const lastUseMeal = new Map<string, number>();
  recent.forEach((row, i) => {
    for (const c of row.cuisines ?? []) if (!lastUseCuisine.has(c)) lastUseCuisine.set(c, i);
    for (const m of row.meal_types ?? []) if (!lastUseMeal.has(m)) lastUseMeal.set(m, i);
  });
  const neverUsed = 1e9;
  const cuisine = [...RECIPE_CUISINES].sort(
    (a, b) => (lastUseCuisine.get(a) ?? neverUsed) - (lastUseCuisine.get(b) ?? neverUsed),
  )[0];
  const mealType = [...RECIPE_MEAL_TYPES].sort(
    (a, b) => (lastUseMeal.get(a) ?? neverUsed) - (lastUseMeal.get(b) ?? neverUsed),
  )[0];
  return { cuisine, mealType };
}

/** The deterministic fallback idea bank (no AI — plan §6.2 R0 failure
 *  path). One entry per cuisine × meal family; safe, on-brand dishes. */
const FALLBACK_IDEAS: Record<string, Array<{ themeAr: string; themeEn: string; brief: string }>> = {
  egyptian: [
    { themeAr: "طاجن صدر دجاج بالفرن مع الخضار", themeEn: "Oven-baked chicken breast tagine with vegetables", brief: "صدور دجاج مشوية بالفرن مع كوسة وجزر وبصل في صلصة طماطم خفيفة — غداء عائلي مصري عالي البروتين." },
    { themeAr: "شوربة عدس بالليمون والكمون", themeEn: "Egyptian lentil soup with lemon and cumin", brief: "شوربة عدس أصفر كريمية بزيت الزيتون والكمون وعصير الليمون — إفطار شتوي مغذٍ غني بالألياف." },
    { themeAr: "فول بالبيض وزيت الزيتون", themeEn: "Ful medames with egg and olive oil", brief: "طبق فول مصري كلاسيكي مع بيضة مسلوقة وزيت زيتون وكمون — إفطار بروتين متوازن." },
    { themeAr: "محشي كوسة بالفرن باللحم المفروم", themeEn: "Oven-baked zucchini boats with lean ground beef", brief: "كوسة محشية بلحم بقري مفروم قليل الدهن وقلب من الأرز تُخبز بالفرن." },
  ],
  gulf: [
    { themeAr: "دجاج مشوي بخلطة بهارات خليجية", themeEn: "Grilled chicken with Gulf spice blend", brief: "صدور دجاج متبلة بالبهارات الخليجية والليمون تشوى مع أرز بني بالكمون." },
    { themeAr: "سمك هامور بالفرن بالبهارات", themeEn: "Oven-baked grouper with Arabian spices", brief: "شرائح هامور بالفرن مع الليمون والزعفران وخضار سوتيه — عشاء خليجي غني بالبروتين." },
    { themeAr: "شوربة شوفان خليجية بالدجاج", themeEn: "Gulf-style chicken and oats soup", brief: "شوربة دجاج بالشوفان والبهارات — وجبة ما قبل التمرين بطاقة متوازنة." },
  ],
  arab: [
    { themeAr: "تبولة البقوليات الكاملة", themeEn: "Levantine bulgur tabbouleh", brief: "تبولة بالبرغل والبقدونس والطماطم وزيت الزيتون — سلطة عربية غنية بالألياف." },
    { themeAr: "مشاوي مشكلة مع حمص بالطحينة", themeEn: "Mixed grill with hummus and tahini", brief: "أسياخ دجاج ولحم قليل الدهن مع حمص بالطحينة وسلطة." },
    { themeAr: "مجدرة العدس بالبرغل", themeEn: "Mujadara lentils and bulgur", brief: "مجدرة عدس وبرغل بالبصل المكرمل وزيت الزيتون — طبق نباتي اقتصادي." },
  ],
  mediterranean: [
    { themeAr: "سلمون مشوي مع سلطة يونانية", themeEn: "Grilled salmon with Greek salad", brief: "سلمون مشوي بزيت الزيتون والليمون مع سلطة يونانية بالخيار والطماطم والفيتا." },
    { themeAr: "صفيحة دجاج بالزعتر وزيت الزيتون", themeEn: "Chicken thighs with oregano and olive oil", brief: "أوراك دجاج بالفرن بالزعتر والليمون مع بطاطس مشوية." },
    { themeAr: "سلطة كينوا بالخضار والحمص", themeEn: "Quinoa salad with vegetables and chickpeas", brief: "سلطة كينوا باردة بالحمص والخضار الملونة وزيت الزيتون." },
  ],
  asian: [
    { themeAr: "ستير فراي دجاج بالخضار وصوص الصويا", themeEn: "Chicken stir-fry with vegetables and soy sauce", brief: "دجاج بالووك مع بروكلي وجزر وفلفل وصوص صويا خفيف فوق أرز بسمتي." },
    { themeAr: "شوربة دجاج بالزنجبيل والنعناع", themeEn: "Ginger chicken noodle soup", brief: "شوربة دجاج آسيوية بالزنجبيل والثوم مع خضار — عشاء خفيف دافئ." },
    { themeAr: "توفو مقلي بالكاجو والخضار", themeEn: "Tofu cashew stir-fry", brief: "توفو مقلي مع كاجو وخضار وصوص صويا — طبق نباتي عالي البروتين." },
  ],
  international: [
    { themeAr: "أومليت البيض بالسبانخ والفيتا", themeEn: "Spinach and feta omelette", brief: "أومليت ببيض كامل وبياض إضافي مع سبانخ وجبنة فيتا — إفطار بروتين عالي." },
    { themeAr: "سلطة دجاج سيزر بالزبادي", themeEn: "Yogurt caesar chicken salad", brief: "دجاج مشوي فوق خس روماني مع صوص زبادي خفيف وبارميزان." },
    { themeAr: "شوفان بين بروتين بالموز وزبدة الفول السوداني", themeEn: "Overnight protein oats with banana and peanut butter", brief: "شوفان ليلي بالزبادي اليوناني والموز وزبدة الفول السوداني." },
  ],
};

export async function generateRecipeIdea(): Promise<{ idea: RecipeIdea; source: string }> {
  const slot = await pickIdeaSlot();
  const prompt = [
    `Pick today's healthy recipe concept for Alkemos (fitness & nutrition platform, Egyptian/Arab audience).`,
    `REQUIRED slot: cuisine=${slot.cuisine}, mealType=${slot.mealType}.`,
    `Rules: a real dish that fits the cuisine AND the meal type; gym-friendly (visible protein source, honest macros);`,
    `themeAr = the dish name in Modern Standard Arabic; themeEn = the English name; brief = 1-2 sentences describing the dish and its fitness value (Arabic).`,
    `Respond with STRICT JSON only: {"themeAr":"...","themeEn":"...","brief":"..."}`,
  ].join("\n");

  try {
    const { text, provider, model } = await dispatchAI("recipe:idea", prompt, {
      systemPrompt: "You are a strict JSON API endpoint. Output ONE valid JSON object and nothing else.",
    });
    const parsed = parseJsonLoose(text);
    const idea = ideaSchema.parse(parsed);
    return {
      idea: sealIdea({ ...idea, cuisine: slot.cuisine, mealType: slot.mealType, goal: "maintenance" }),
      source: `${provider}:${model}`,
    };
  } catch {
    // Deterministic fallback (plan §6.2 R0 — بلا AI)
    const bank = FALLBACK_IDEAS[slot.cuisine] ?? FALLBACK_IDEAS.international;
    const pick = bank[Math.floor(Math.random() * bank.length)];
    return {
      idea: sealIdea({ ...pick, cuisine: slot.cuisine, mealType: slot.mealType, goal: "maintenance" }),
      source: "fallback:deterministic",
    };
  }
}

function sealIdea(base: {
  themeAr: string;
  themeEn: string;
  brief: string;
  cuisine: RecipeCuisine;
  mealType: RecipeMealType;
  goal: RecipeGoal;
}): RecipeIdea {
  return {
    ideaId: randomUUID(),
    themeAr: base.themeAr,
    themeEn: base.themeEn,
    cuisine: base.cuisine,
    goal: base.goal,
    mealType: base.mealType,
    brief: base.brief,
    sealedAt: new Date().toISOString(),
  };
}

/** R0 gate: theme must not duplicate recent recipes nor collide with a
 *  canonical search intent (Q-GATE-4/5 at idea time). */
export async function ideaPassesGuards(idea: RecipeIdea): Promise<string | null> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("recipes")
      .select("pair_slug")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(60);
    const themes = new Set(((data as Array<{ pair_slug: string }>) ?? []).map((r) => r.pair_slug));
    if (themes.has(pairSlugify(idea.themeEn))) {
      return `theme "${idea.themeEn}" duplicates a recent pair_slug — rerun r0-idea`;
    }
  }
  const collision = findBlogIntentCollision(idea.themeEn, idea.themeAr);
  if (collision) {
    return `idea collides with canonical intent "${collision.entry.cluster}" (${collision.entry.canonical}) — rerun r0-idea`;
  }
  return null;
}

/* ───────────────────────── R1 — the structure ───────────────────────── */

export type StructuredIngredient = {
  position: number;
  nameAr: string;
  nameEn: string;
  amountG: number;
  weightState: "raw" | "cooked";
  nutrientRefSlug: string;
  isOptional: boolean;
  noteAr?: string | null;
  noteEn?: string | null;
};

export type RecipeStructure = {
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  budgetTier: "low" | "medium" | "high";
  ingredients: StructuredIngredient[];
  stepsOutlineAr: string[];
  stepsOutlineEn: string[];
  cuisine: RecipeCuisine;
  mealType: RecipeMealType;
};

const structureSchema = z.object({
  servings: z.number().int().min(1).max(12),
  prepMinutes: z.number().int().min(0).max(600),
  cookMinutes: z.number().int().min(0).max(600),
  budgetTier: z.enum(["low", "medium", "high"]),
  ingredients: z
    .array(
      z.object({
        nameAr: z.string().trim().min(2).max(80),
        nameEn: z.string().trim().min(2).max(80),
        amountG: z.number().positive().max(5000),
        weightState: z.enum(["raw", "cooked"]),
        nutrientRefSlug: z.string().trim().min(2).max(80),
        isOptional: z.boolean().default(false),
      }),
    )
    .min(3)
    .max(25),
  stepsOutlineAr: z.array(z.string().trim().min(10).max(400)).min(3).max(15),
  stepsOutlineEn: z.array(z.string().trim().min(10).max(400)).min(3).max(15),
});

/** Load the reference catalog (slug + bilingual names + flags) for the R1
 *  prompt and grounding. */
export async function loadNutrientCatalog(): Promise<
  Array<{ slug: string; nameAr: string; nameEn: string; category: string }>
> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("nutrient_reference")
    .select("slug, name_ar, name_en, category")
    .order("slug");
  if (error || !data) return [];
  return (data as Array<Record<string, string>>).map((r) => ({
    slug: r.slug,
    nameAr: r.name_ar,
    nameEn: r.name_en,
    category: r.category,
  }));
}

export async function generateRecipeStructure(
  idea: RecipeIdea,
  catalog: Array<{ slug: string; nameAr: string; nameEn: string }>,
  repairFeedback?: string,
): Promise<{ structure: RecipeStructure; source: string }> {
  const catalogList = catalog.map((c) => `${c.slug} | ${c.nameEn} | ${c.nameAr}`).join("\n");
  const prompt = [
    `Design the recipe skeleton for: "${idea.themeEn}" / "${idea.themeAr}" (${idea.cuisine} cuisine, ${idea.mealType}).`,
    `Brief: ${idea.brief}`,
    ``,
    `HARD RULES:`,
    `1. Every ingredient MUST reference EXACTLY one slug from the CATALOG below (the nutrientRefSlug field) — no invented slugs.`,
    `2. Every ingredient MUST have amountG in GRAMS (a positive number) and weightState ("raw" or "cooked" — the state its grams are measured in).`,
    `3. Include the cooking fat/oil/sauce as a real ingredient (olive-oil/butter/ghee/tahini/...) when anything is cooked.`,
    `4. Season honestly: salt/spices in realistic grams (e.g. salt 2-4g).`,
    `5. servings 1-12, realistic prep/cook minutes. stepsOutlineAr/En: 3-15 short imperative steps each (skeleton, not prose).`,
    `6. Do NOT compute or output any nutrition numbers — the platform computes them from the reference data.`,
    ``,
    `CATALOG (slug | English | Arabic):`,
    catalogList,
    ...(repairFeedback ? [``, `REPAIR FEEDBACK from the previous attempt (fix these exactly):`, repairFeedback] : []),
    ``,
    `Respond with STRICT JSON only:`,
    `{"servings":N,"prepMinutes":N,"cookMinutes":N,"budgetTier":"low|medium|high",`,
    `"ingredients":[{"nameAr":"...","nameEn":"...","amountG":N,"weightState":"raw|cooked","nutrientRefSlug":"catalog-slug","isOptional":false}],`,
    `"stepsOutlineAr":["..."],"stepsOutlineEn":["..."]}`,
  ].join("\n");

  const { text, provider, model } = await dispatchAI("recipe:structure", prompt, {
    systemPrompt: "You are a strict JSON API endpoint. Output ONE valid JSON object and nothing else. Never invent catalog slugs.",
  });
  const parsed = structureSchema.parse(parseJsonLoose(text));

  const structure: RecipeStructure = {
    servings: parsed.servings,
    prepMinutes: parsed.prepMinutes,
    cookMinutes: parsed.cookMinutes,
    budgetTier: parsed.budgetTier,
    cuisine: idea.cuisine,
    mealType: idea.mealType,
    ingredients: parsed.ingredients.map((ing, i) => ({
      position: i + 1,
      nameAr: ing.nameAr,
      nameEn: ing.nameEn,
      amountG: ing.amountG,
      weightState: ing.weightState,
      nutrientRefSlug: ing.nutrientRefSlug,
      isOptional: ing.isOptional,
    })),
    stepsOutlineAr: parsed.stepsOutlineAr,
    stepsOutlineEn: parsed.stepsOutlineEn,
  };
  return { structure, source: `${provider}:${model}` };
}

/** Ground the structure: every ref slug must exist in the catalog. Returns
 *  the missing slugs (empty = grounded). */
export function groundStructure(
  structure: RecipeStructure,
  catalog: ReadonlySet<string>,
): string[] {
  const missing: string[] = [];
  for (const ing of structure.ingredients) {
    if (!catalog.has(ing.nutrientRefSlug)) missing.push(ing.nutrientRefSlug);
  }
  return missing;
}

/* ───────────────────────── R3 — the authoring ───────────────────────── */

export type AuthoredVersion = {
  language: "ar" | "en";
  title: string;
  excerpt: string;
  steps: Array<{ position: number; text: string }>;
  tips: string;
  storageInfo: string;
  substitutions: Array<{ from: string; to: string; note: string }>;
  metaTitle: string;
  metaDescription: string;
};

const authoredSchema = z.object({
  title: z.string().trim().min(5).max(110),
  excerpt: z.string().trim().min(40).max(400),
  steps: z.array(z.string().trim().min(15).max(700)).min(3).max(15),
  tips: z.string().trim().max(800).default(""),
  storageInfo: z.string().trim().max(500).default(""),
  substitutions: z
    .array(z.object({ from: z.string().trim().min(2), to: z.string().trim().min(2), note: z.string().trim().max(300) }))
    .max(6)
    .default([]),
  metaTitle: z.string().trim().min(5).max(90),
  metaDescription: z.string().trim().min(50).max(160),
});

export async function authorRecipeVersion(
  language: "ar" | "en",
  input: {
    themeAr: string;
    themeEn: string;
    cuisine: string;
    mealType: string;
    servings: number;
    prepMinutes: number;
    cookMinutes: number;
    ingredients: ReadonlyArray<{ nameAr: string; nameEn: string; amountG: number; weightState: string }>;
    stepsOutline: readonly string[];
    computedPerServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  },
): Promise<{ version: AuthoredVersion; source: string }> {
  const ar = language === "ar";
  const ingredientLines = input.ingredients
    .map((i) =>
      ar
        ? `- ${i.nameAr}: ${i.amountG} جم (${i.weightState === "raw" ? "نيئ" : "مطبوخ"})`
        : `- ${i.nameEn}: ${i.amountG} g (${i.weightState})`,
    )
    .join("\n");

  const prompt = ar
    ? [
        `اكتب النسخة العربية الأصلية لوصفة «${input.themeAr}» (${input.cuisine} — ${input.mealType}).`,
        ``,
        `الحقائق المشتركة الثابتة (لا تغيّرها أبدًا):`,
        `- الحصص: ${input.servings} · التحضير: ${input.prepMinutes} دقيقة · الطهي: ${input.cookMinutes} دقيقة`,
        `- المكونات بالأوزان:`,
        ingredientLines,
        `- القيم المحسوبة لكل حصة (اذكرها كما هي حرفيًا إن ذكرتها): ${input.computedPerServing.calories} سعرة · بروتين ${input.computedPerServing.protein} جم · كربوهيدرات ${input.computedPerServing.carbs} جم · دهون ${input.computedPerServing.fat} جم · ألياف ${input.computedPerServing.fiber} جم`,
        ``,
        `المطلوب: عربية فصحى حديثة رصينة (ممنوع العامية)، مقدمة تحريرية فريدة (لا ترجمة لأي نص آخر)،`,
        `خطوات مرقمة 3-15 خطوة عملية مفصلة، نصائح، معلومات تخزين، بدائل واقعية، عنوان جذاب،`,
        `metaTitle ≤ 70 حرفًا، metaDescription بين 50 و160 حرفًا.`,
        `مخطط الخطوات المقترح:`,
        input.stepsOutline.map((s, i) => `${i + 1}. ${s}`).join("\n"),
        ``,
        `أخرج JSON صارمًا فقط بالحقول:`,
        `{"title":"...","excerpt":"...","steps":["..."],"tips":"...","storageInfo":"...","substitutions":[{"from":"...","to":"...","note":"..."}],"metaTitle":"...","metaDescription":"..."}`,
      ].join("\n")
    : [
        `Write the original English version of the recipe "${input.themeEn}" (${input.cuisine} — ${input.mealType}).`,
        ``,
        `Fixed shared facts (NEVER change them):`,
        `- Servings: ${input.servings} · Prep: ${input.prepMinutes} min · Cook: ${input.cookMinutes} min`,
        `- Ingredients with weights:`,
        ingredientLines,
        `- Computed values per serving (quote verbatim if you mention them): ${input.computedPerServing.calories} kcal · protein ${input.computedPerServing.protein} g · carbs ${input.computedPerServing.carbs} g · fat ${input.computedPerServing.fat} g · fiber ${input.computedPerServing.fiber} g`,
        ``,
        `Deliver: a unique editorial voice (this is NOT a translation of any other text), an engaging excerpt,`,
        `3-15 numbered practical steps, tips, storage info, realistic substitutions, a compelling title,`,
        `metaTitle ≤ 60 chars, metaDescription between 50 and 160 chars.`,
        `Suggested steps outline:`,
        input.stepsOutline.map((s, i) => `${i + 1}. ${s}`).join("\n"),
        ``,
        `Respond with STRICT JSON only:`,
        `{"title":"...","excerpt":"...","steps":["..."],"tips":"...","storageInfo":"...","substitutions":[{"from":"...","to":"...","note":"..."}],"metaTitle":"...","metaDescription":"..."}`,
      ].join("\n");

  // NOTE (guard law, scripts/check-ai-router-guard.sh check 3): the two
  // authoring ids ride an INLINE conditional first argument — the guard's
  // token scan sees both literals. A variable indirection (const fn = …)
  // hides them and reads as dead registrations (the 24de79d1 CI lesson).
  const { text, provider, model } = await dispatchAI(
    ar ? "recipe:author-ar" : "recipe:author-en",
    prompt,
    {
      systemPrompt: ar
        ? "أنت واجهة JSON صارمة. أخرج كائن JSON واحدًا صحيحًا فقط بلا أي نص خارجه."
        : "You are a strict JSON API endpoint. Output ONE valid JSON object and nothing else.",
    },
  );
  const parsed = authoredSchema.parse(parseJsonLoose(text));

  const version: AuthoredVersion = {
    language,
    title: parsed.title,
    excerpt: parsed.excerpt,
    steps: parsed.steps.map((text, i) => ({ position: i + 1, text })),
    tips: parsed.tips,
    storageInfo: parsed.storageInfo,
    substitutions: parsed.substitutions,
    metaTitle: parsed.metaTitle,
    metaDescription: parsed.metaDescription,
  };
  return { version, source: `${provider}:${model}` };
}

/* ───────────── R5 advisory — the sampled narrative read ───────────── */
/* plan §6.1 row 5 / §6.2 R5: recipe:verify-narrative is an OPTIONAL,
 * SAMPLED cross-version consistency read. Advisory ONLY — it never
 * decides a number (the deterministic battery owns every numeric
 * verdict); at worst it holds the pair with a rerun-target exactly
 * like every other diagnostic. Fail-open: any provider/parse trouble
 * degrades to «no advisory», never blocks the deterministic verdict. */

export type NarrativeAdvisoryIssue = {
  severity: "high" | "low";
  language: "ar" | "en" | "both";
  field: string;
  problem: string;
};

export type NarrativeAdvisory = {
  consistent: boolean;
  issues: NarrativeAdvisoryIssue[];
};

const narrativeAdvisorySchema = z.object({
  consistent: z.boolean(),
  issues: z
    .array(
      z.object({
        severity: z.enum(["high", "low"]).catch("low"),
        language: z.enum(["ar", "en", "both"]).catch("both"),
        field: z.string().trim().max(60).catch(""),
        problem: z.string().trim().min(3).max(400),
      }),
    )
    .max(10)
    .default([]),
});

/** Deterministic 1-in-3 sample by scheduled day (days 1, 4, 7, … of the
 * month → ~10 pairs/month). No randomness — audits reproduce exactly
 * which days carried the advisory read. */
export function narrativeAdvisorySampled(scheduledFor: string): boolean {
  const day = Number((scheduledFor ?? "").slice(8, 10));
  return Number.isFinite(day) && day >= 1 && day <= 31 && day % 3 === 1;
}

/** Tolerant parse for the advisory payload (fail-open → null). */
export function parseNarrativeAdvisory(text: string): NarrativeAdvisory | null {
  try {
    return narrativeAdvisorySchema.parse(parseJsonLoose(text));
  } catch {
    return null;
  }
}

export async function verifyPairNarrative(input: {
  themeAr: string;
  themeEn: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: ReadonlyArray<{ nameAr: string; nameEn: string; amountG: number }>;
  perServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  versions: ReadonlyArray<{ language: "ar" | "en"; title: string; excerpt: string; steps: string[]; tips: string }>;
}): Promise<{ advisory: NarrativeAdvisory; source: string } | null> {
  const factLines = input.ingredients
    .map((i) => `- ${i.nameEn} / ${i.nameAr}: ${i.amountG} g`)
    .join("\n");
  const ar = input.versions.find((v) => v.language === "ar");
  const en = input.versions.find((v) => v.language === "en");
  if (!ar || !en) return null;

  const prompt = [
    `Cross-version consistency audit for the recipe pair "${input.themeEn}" / «${input.themeAr}».`,
    ``,
    `SHARED TRUTH (both versions must describe exactly this):`,
    `- Servings: ${input.servings} · Prep: ${input.prepMinutes} min · Cook: ${input.cookMinutes} min`,
    `- Ingredients (same grams in both):`,
    factLines,
    `- Computed per serving: ${input.perServing.calories} kcal · protein ${input.perServing.protein} g · carbs ${input.perServing.carbs} g · fat ${input.perServing.fat} g · fiber ${input.perServing.fiber} g`,
    ``,
    `ARABIC VERSION:`,
    `Title: ${ar.title}`,
    `Excerpt: ${ar.excerpt}`,
    `Steps: ${ar.steps.map((s, i) => `${i + 1}. ${s}`).join(" ")}`,
    `Tips: ${ar.tips}`,
    ``,
    `ENGLISH VERSION:`,
    `Title: ${en.title}`,
    `Excerpt: ${en.excerpt}`,
    `Steps: ${en.steps.map((s, i) => `${i + 1}. ${s}`).join(" ")}`,
    `Tips: ${en.tips}`,
    ``,
    `Flag ONLY material contradictions: a step, technique, ingredient emphasis, serving/storage`,
    `instruction, or preparation claim that differs between the two versions OR contradicts the`,
    `shared truth. IGNORE stylistic voice, length, and phrasing differences — the two versions are`,
    `independently authored originals, NOT translations, so different prose is CORRECT by design.`,
    `Do NOT evaluate nutrition numbers (deterministic gates own them).`,
    ``,
    `Respond with STRICT JSON only:`,
    `{"consistent":true|false,"issues":[{"severity":"high"|"low","language":"ar"|"en"|"both","field":"...","problem":"..."}]}`,
    `severity "high" = a reader would follow materially different instructions; "low" = minor drift.`,
  ].join("\n");

  try {
    const { text, provider, model } = await dispatchAI("recipe:verify-narrative", prompt, {
      systemPrompt:
        "You are a strict JSON consistency-audit endpoint. Output ONE valid JSON object and nothing else.",
    });
    const advisory = parseNarrativeAdvisory(text);
    if (!advisory) return null;
    return { advisory, source: `${provider}:${model}` };
  } catch {
    // Advisory fail-open (plan §6.1 row 5): provider trouble never blocks
    // the deterministic verdict.
    return null;
  }
}

/* ───────────────────────── small helpers ───────────────────────── */

/** Tolerant JSON parse (the PHASE 161.5 hardened pattern: strips code
 *  fences, finds the outermost braces). */
export function parseJsonLoose(text: string): unknown {
  let t = (text ?? "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first > 0 || last < t.length - 1) {
    if (first !== -1 && last > first) t = t.slice(first, last + 1);
  }
  return JSON.parse(t);
}

/** Latin slug builder (the blog slugifyAscii pattern — lowercase, ascii
 *  letters/digits/hyphens, collapsed). */
export function pairSlugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "recipe"
  );
}

/** Unique slug per language against the recipe_versions table. */
export async function uniqueRecipeSlug(base: string, language: "ar" | "en"): Promise<string> {
  const root = pairSlugify(base);
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return root;
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await supabaseAdmin
      .from("recipe_versions")
      .select("id")
      .eq("slug", candidate)
      .eq("language", language)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${randomUUID().slice(0, 6)}`;
}

/** Taxonomy zod guards for R1 outputs (cuisine/goal/mealType closed sets). */
export function normalizeTaxonomyValue(v: string): string | null {
  if (isRecipeCuisine(v) || isRecipeGoal(v) || isRecipeMealType(v)) return v;
  return null;
}
