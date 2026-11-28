import { z } from 'zod';

/**
 * Zod schemas forked from the source's src/lib/db/backup.ts (MIT) —
 * schema definitions ONLY, verbatim: the surrounding module belongs to
 * the source's offline sync stack (excluded from adoption by review
 * constraint 2 — no IndexedDB/OPFS/offline architecture). The fork's
 * csv-food-parser imports FoodItemSchema from here.
 */

export const MacroNutrientsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
});

export const MicronutrientsSchema = z
  .record(z.string(), z.number().optional())
  .default({});

export const FoodSourceSchema = z.enum([
  'staple',
  'usda',
  'off',
  'catalog',
  'fatsecret',
  'edamam',
  'nutritionix',
  'custom_barcode',
  'custom_food',
  'ai_scan',
  'quick_add',
  'recipe',
]);

export const FoodServingOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  unit: z.string(),
  grams: z.number(),
  defaultAmount: z.number().optional(),
});

export const FoodItemSchema = z.object({
  id: z.string(),
  barcode: z.string().nullable().optional(),
  source: z.enum([
    'staple',
    'usda',
    'off',
    'catalog',
    'fatsecret',
    'edamam',
    'nutritionix',
    'custom_barcode',
    'custom_food',
  ]),
  accuracyTier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  category: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  name: z.string(),
  brand: z.string().optional(),
  region: z.string().optional(),
  basis: z.enum(['per100g', 'per100ml', 'perServing']),
  servingSize: z.number(),
  servingUnit: z.string(),
  servingWeightGrams: z.number().optional(),
  servingOptions: z.array(FoodServingOptionSchema).optional(),
  nutrientsPerBasis: MacroNutrientsSchema,
  micronutrientsPerBasis: MicronutrientsSchema,
  updatedAt: z.number(),
});
