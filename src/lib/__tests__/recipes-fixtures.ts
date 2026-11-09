/**
 * RECIPES TEST FIXTURES — shared deterministic reference rows and
 * ingredient lists for the HEALTHY-RECIPES-PLATFORM canaries
 * (plan §12.1). Pure data, no DB — the golden-constant law.
 *
 * The per-100g numbers are deliberately round so hand-computed
 * expectations stay exact (the engine's rounding then has nothing
 * to hide behind).
 */
import type { NutrientRefRow, IngredientInput } from "@/lib/recipes-nutrition";

export const REF_ROWS: NutrientRefRow[] = [
  {
    slug: "chicken-breast",
    category: "poultry",
    per100g: { calories: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6, fiber_g: 0, sat_fat_g: 0.6, sodium_mg: 45 },
    fdc_id: "05064",
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["meat", "poultry", "animal"],
  },
  {
    slug: "white-rice",
    category: "grain",
    per100g: { calories: 360, protein_g: 7, carbs_g: 79, fat_g: 0.6, fiber_g: 1.4, sat_fat_g: 0.2, sodium_mg: 1 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["grain"],
  },
  {
    slug: "olive-oil",
    category: "oil",
    per100g: { calories: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, sat_fat_g: 13.8, sodium_mg: 2 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["plant", "oil"],
  },
  {
    slug: "tomato",
    category: "vegetable",
    per100g: { calories: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, sat_fat_g: 0.1, sodium_mg: 5 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["plant", "vegetable"],
  },
  {
    slug: "cucumber",
    category: "vegetable",
    per100g: { calories: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, sat_fat_g: 0, sodium_mg: 2 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["plant", "vegetable"],
  },
  {
    slug: "lentils",
    category: "legume",
    per100g: { calories: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, fiber_g: 7.9, sodium_mg: 2 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["legume", "plant"],
  },
  {
    slug: "salmon",
    category: "fish",
    per100g: { calories: 208, protein_g: 20, carbs_g: 0, fat_g: 13, fiber_g: 0, sat_fat_g: 3.1, sodium_mg: 59 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["fish", "animal"],
  },
  {
    slug: "egg-whole",
    category: "egg",
    per100g: { calories: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5, fiber_g: 0, sat_fat_g: 3.1, sodium_mg: 142 },
    fdc_id: "01123",
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["egg", "animal"],
  },
  {
    slug: "greek-yogurt",
    category: "dairy",
    per100g: { calories: 59, protein_g: 10.2, carbs_g: 3.6, fat_g: 0.4, fiber_g: 0, sat_fat_g: 0.1, sodium_mg: 36 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["dairy", "animal"],
  },
  {
    slug: "almonds",
    category: "nut",
    per100g: { calories: 579, protein_g: 21.2, carbs_g: 21.6, fat_g: 49.9, fiber_g: 12.5, sodium_mg: 1 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["nut", "plant"],
  },
  {
    // A reference row WITHOUT the optional enrichment fields (owner §2:
    // sodium/sat-fat optional — the honest-null law).
    slug: "molokhia",
    category: "vegetable",
    per100g: { calories: 60, protein_g: 4.6, carbs_g: 5.4, fat_g: 0.4, fiber_g: 3.2 },
    source_name: "Egyptian/Arab composition tables (curated)",
    source_version: "curated-seed-2026-11",
    flags: ["plant", "vegetable"],
  },
  {
    slug: "wheat-bulgur",
    category: "grain",
    per100g: { calories: 342, protein_g: 12.3, carbs_g: 75.9, fat_g: 1.3, fiber_g: 18.3, sodium_mg: 17 },
    source_name: "USDA FDC",
    source_version: "SR-Legacy-curated-2026-11",
    flags: ["grain", "gluten"],
  },
];

export const REFS = new Map(REF_ROWS.map((r) => [r.slug, r]));

/** A minimal clean pair: grilled chicken + rice + olive oil + salad. */
export function cleanIngredients(): IngredientInput[] {
  return [
    { position: 1, amount_g: 300, weight_state: "raw", name_ar: "صدور دجاج", name_en: "Chicken breast", nutrient_ref_slug: "chicken-breast" },
    { position: 2, amount_g: 200, weight_state: "raw", name_ar: "أرز أبيض", name_en: "White rice", nutrient_ref_slug: "white-rice" },
    { position: 3, amount_g: 15, weight_state: "raw", name_ar: "زيت زيتون", name_en: "Olive oil", nutrient_ref_slug: "olive-oil" },
    { position: 4, amount_g: 150, weight_state: "raw", name_ar: "طماطم", name_en: "Tomato", nutrient_ref_slug: "tomato" },
  ];
}

/** Hand-computed golden totals for cleanIngredients() at 3 servings:
 *  chicken 300g: 360 kcal · 67.5P · 0C · 7.8F
 *  rice 200g:    720 kcal · 14P · 158C · 1.2F
 *  oil 15g:      132.6 kcal · 0P · 0C · 15F
 *  tomato 150g:  27 kcal · 1.35P · 5.85C · 0.3F
 *  TOTAL: 1239.6 kcal · 82.85P · 163.85C · 24.3F (≈ by 4/4/9: 1213.9)
 */
export const CLEAN_GOLDEN = {
  calories: 1240, // Math.round(1239.6)
  protein_g: 82.85,
  carbs_g: 163.85,
  fat_g: 24.3,
  servings: 3,
};
