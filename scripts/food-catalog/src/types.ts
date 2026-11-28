export type NutritionBasis = 'per100g' | 'per100ml' | 'perServing';

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Micronutrients {
  sodiumMg?: number;
  potassiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  magnesiumMg?: number;
  zincMg?: number;
  vitaminAMcg?: number;
  vitaminCMg?: number;
  vitaminDMcg?: number;
  vitaminB6Mg?: number;
  vitaminB12Mcg?: number;
  folateMcg?: number;
  sugarG?: number;
  addedSugarG?: number;
  saturatedFatG?: number;
  cholesterolMg?: number;
  caffeineMg?: number;
  alcoholG?: number;
  [key: string]: number | undefined;
}

export type FoodSource =
  | 'staple'
  | 'usda'
  | 'off'
  | 'catalog'
  | 'fatsecret'
  | 'edamam'
  | 'nutritionix'
  | 'custom_barcode'
  | 'custom_food'
  | 'ai_scan'
  | 'quick_add'
  | 'recipe';

export interface FoodLogEntry {
  id: string;
  date: string;
  mealSlot?: string;
  foodId: string;
  name: string;
  source: FoodSource;
  amount: number;
  unit: string;
  nutritionSnapshot: MacroNutrients & { micros: Micronutrients };
  note?: string;
  createdAt: number;
}

export interface FoodServingOption {
  id: string;
  label: string;          // e.g. "pc (136g)", "pack (80g)", "cup (158g)", "g"
  unit: string;           // e.g. "pc", "pack", "cup", "slice", "serving", "g", "ml"
  grams: number;          // gram weight of 1 unit (or 1 for 'g'/'ml')
  defaultAmount?: number; // e.g. 1 for 'pc', 100 for 'g'
}

export interface FoodItem {
  id: string;
  barcode?: string | null;
  source:
    | 'staple'
    | 'usda'
    | 'off'
    | 'catalog'
    | 'fatsecret'
    | 'edamam'
    | 'nutritionix'
    | 'custom_barcode'
    | 'custom_food';
  accuracyTier?: 1 | 2 | 3 | 4;
  category?: string;
  aliases?: string[];
  name: string;
  brand?: string;
  region?: string;
  basis: NutritionBasis;
  servingSize: number;
  servingUnit: string;
  servingWeightGrams?: number;
  servingOptions?: FoodServingOption[];
  nutrientsPerBasis: MacroNutrients;
  micronutrientsPerBasis: Micronutrients;
  updatedAt: number;
}

export interface CustomRecipeIngredient {
  foodId: string;
  name: string;
  amount: number;
  unit: string;
  nutritionSnapshot: MacroNutrients & { micros: Micronutrients };
  gramWeight?: number;
  gramsPerUnit?: number;
  servingSize?: number;
  baseBasis?: NutritionBasis;
  baseNutrients?: MacroNutrients;
  baseMicros?: Micronutrients;
}

export interface CustomRecipe {
  id: string;
  name: string;
  ingredients: CustomRecipeIngredient[];
  basis: 'per100g' | 'perServing';
  totalGrams: number;
  cookedWeightGrams?: number | null;
  nutrientsPerBasis: MacroNutrients;
  micronutrientsPerBasis: Micronutrients;
  defaultServings: number;
  createdAt: number;
}

export interface WeightLogEntry {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
  source: 'manual' | 'apple_health';
  recordedAt: string;
  createdAt: number;
  updatedAt: number;
}

export interface PinnedFood {
  id: string;
  kind: 'food' | 'recipe';
  refId: string;
  pinnedAt: number;
}

export type SyncTableName =
  | 'foodLogs'
  | 'foodsCache'
  | 'customRecipes'
  | 'userGoals'
  | 'weightLogs'
  | 'pinnedFoods';

export interface SyncTombstone {
  id: string;
  tableName: SyncTableName;
  recordId: string;
  deletedAt: number;
}

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DailyMacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface MealSlotConfig {
  id: string;
  name: string;
  weightPct: number;
}

export interface UserProfile {
  sex: 'male' | 'female';
  age: number;
  weightKg: number;
  heightCm: number;
  activityMultiplier: number;
  goalDeltaKcal: number;
  proteinPerKg: number;
}

export interface UserGoals {
  id: 'active';
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  micronutrientTargets: Record<string, number>;
  mealSlots?: MealSlotConfig[];
  targetMode?: 'calculator' | 'custom';
  goalDeltaKcal?: number;
  weeklyCyclingEnabled?: boolean;
  weeklySchedule?: Record<WeekdayKey, DailyMacroTargets>;
  weightUnit?: 'kg' | 'lb';
  lastCheckInAt?: number;
  lastCheckInDismissedAt?: number;
  profile?: UserProfile;
  updatedAt: number;
}
