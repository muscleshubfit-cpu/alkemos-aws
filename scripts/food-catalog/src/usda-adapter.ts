import type {
  FoodItem,
  FoodServingOption,
  Micronutrients,
  MacroNutrients,
} from './types';
import { parseHouseholdServingText } from './scaling';

export interface UsdaNutrientEntry {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
  amount?: number;
  nutrient?: {
    id?: number;
    number?: string;
    name?: string;
    unitName?: string;
  };
}

export interface UsdaFoodMeasure {
  disseminationText?: string;
  gramWeight?: number;
  measureUnitAbbreviation?: string;
  measureUnitName?: string;
}

export interface UsdaFoodPortion {
  portionDescription?: string;
  gramWeight?: number;
  amount?: number;
  modifier?: string;
  measureUnit?: {
    name?: string;
    abbreviation?: string;
  };
}

export interface UsdaFoodPayload {
  fdcId?: number;
  id?: number;
  description?: string;
  name?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodMeasures?: UsdaFoodMeasure[];
  foodPortions?: UsdaFoodPortion[];
  foodNutrients?: UsdaNutrientEntry[];
  [key: string]: unknown;
}

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

function extractUsdaServingOptions(raw: UsdaFoodPayload): {
  servingWeightGrams?: number;
  servingOptions?: FoodServingOption[];
} {
  const unitUpper = (raw.servingSizeUnit || '').trim().toLowerCase();
  const baseUnit = unitUpper === 'ml' ? 'ml' : 'g';
  const countable: FoodServingOption[] = [];
  const seenUnits = new Set<string>();

  const pushOption = (unit: string, perUnitGrams: number) => {
    if (!unit || unit === 'g' || unit === 'ml' || perUnitGrams <= 0 || seenUnits.has(unit)) {
      return;
    }
    const gramsRounded = round2(perUnitGrams);
    if (gramsRounded <= 0) return;
    seenUnits.add(unit);
    countable.push({
      id: unit,
      label: `${unit} (${gramsRounded}${baseUnit})`,
      unit,
      grams: gramsRounded,
      defaultAmount: 1,
    });
  };

  if (
    typeof raw.servingSize === 'number' &&
    Number.isFinite(raw.servingSize) &&
    raw.servingSize > 0 &&
    (unitUpper === 'g' || unitUpper === 'grm' || unitUpper === 'ml')
  ) {
    const parsedHousehold = raw.householdServingFullText
      ? parseHouseholdServingText(raw.householdServingFullText)
      : null;
    if (parsedHousehold) {
      pushOption(parsedHousehold.unit, raw.servingSize / parsedHousehold.count);
    } else if (raw.dataType === 'Branded' && round2(raw.servingSize) !== 100) {
      pushOption('serving', raw.servingSize);
    }
  }

  if (Array.isArray(raw.foodPortions)) {
    for (const portion of raw.foodPortions) {
      const gramWeight = portion?.gramWeight;
      if (typeof gramWeight !== 'number' || !Number.isFinite(gramWeight) || gramWeight <= 0) {
        continue;
      }
      const desc =
        portion.portionDescription ||
        `${portion.amount ?? 1} ${portion.measureUnit?.name || portion.modifier || portion.measureUnit?.abbreviation || ''}`;
      const parsed = parseHouseholdServingText(desc);
      if (parsed) {
        pushOption(parsed.unit, gramWeight / parsed.count);
      }
    }
  }

  if (Array.isArray(raw.foodMeasures)) {
    for (const measure of raw.foodMeasures) {
      const gramWeight = measure?.gramWeight;
      if (typeof gramWeight !== 'number' || !Number.isFinite(gramWeight) || gramWeight <= 0) {
        continue;
      }
      const text = measure.disseminationText || measure.measureUnitName || '';
      const parsed = parseHouseholdServingText(text);
      if (parsed) {
        pushOption(parsed.unit, gramWeight / parsed.count);
      }
    }
  }

  if (countable.length === 0) {
    return {};
  }

  return {
    servingWeightGrams: countable[0].grams,
    servingOptions: [
      ...countable,
      {
        id: baseUnit,
        label: baseUnit,
        unit: baseUnit,
        grams: 1,
        defaultAmount: 100,
      },
    ],
  };
}

function extractNutrient(entry: UsdaNutrientEntry): {
  id?: number;
  number?: string;
  name: string;
  unit: string;
  value: number;
} {
  const number =
    typeof entry.nutrient?.number === 'string' && entry.nutrient.number.trim()
      ? entry.nutrient.number.trim()
      : typeof entry.nutrientNumber === 'string' && entry.nutrientNumber.trim()
        ? entry.nutrientNumber.trim()
        : undefined;

  const id =
    typeof entry.nutrient?.id === 'number'
      ? entry.nutrient.id
      : typeof entry.nutrientId === 'number'
        ? entry.nutrientId
        : undefined;

  const name = entry.nutrient?.name || entry.nutrientName || '';
  const unit = entry.nutrient?.unitName || entry.unitName || '';
  const rawValue =
    typeof entry.amount === 'number'
      ? entry.amount
      : typeof entry.value === 'number'
        ? entry.value
        : 0;

  const value = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
  return { id, number, name, unit, value };
}

/**
 * Normalizes USDA FoodData Central item (both /foods/search and /food/{id} shapes)
 * into openCalory's canonical FoodItem model with basis 'per100g'.
 */
export function mapUsdaFoodToFoodItem(
  raw: UsdaFoodPayload,
  sourceOverride?: 'staple' | 'usda'
): FoodItem {
  const fdcId = raw.fdcId ?? raw.id ?? 0;
  const source = sourceOverride ?? 'usda';
  const id = `${source}:${fdcId}`;
  const name = (raw.description || raw.name || 'Unknown Food').trim();
  const brand = raw.brandOwner || raw.brandName || undefined;

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;

  const micros: Micronutrients = {};
  const nutrientsList = Array.isArray(raw.foodNutrients) ? raw.foodNutrients : [];

  for (const entry of nutrientsList) {
    const { id: nutId, number: nutNum, unit, value } = extractNutrient(entry);
    if (!nutId && !nutNum) continue;

    // Reject Energy in kJ (1062) to prevent energy corruption
    if (nutId === 1062 || nutNum === '268' || unit.toLowerCase() === 'kj') {
      continue;
    }

    if (nutId === 1008 || nutNum === '208') {
      calories = value;
    } else if (nutId === 1003 || nutNum === '203') {
      protein = value;
    } else if (nutId === 1004 || nutNum === '204') {
      fat = value;
    } else if (nutId === 1005 || nutNum === '205') {
      carbs = value;
    } else if (nutId === 1079 || nutNum === '291') {
      fiber = value;
    } else if (nutId === 1093 || nutNum === '307') {
      micros.sodiumMg = round2(value);
    } else if (nutId === 1092 || nutNum === '306') {
      micros.potassiumMg = round2(value);
    } else if (nutId === 1087 || nutNum === '301') {
      micros.calciumMg = round2(value);
    } else if (nutId === 1089 || nutNum === '303') {
      micros.ironMg = round2(value);
    } else if (nutId === 1090 || nutNum === '304') {
      micros.magnesiumMg = round2(value);
    } else if (nutId === 1095 || nutNum === '309') {
      micros.zincMg = round2(value);
    } else if (nutId === 1106 || nutNum === '320') {
      micros.vitaminAMcg = round2(value);
    } else if (nutId === 1162 || nutNum === '401') {
      micros.vitaminCMg = round2(value);
    } else if (nutId === 1114 || nutNum === '328') {
      micros.vitaminDMcg = round2(value);
    } else if (nutId === 1175 || nutNum === '415') {
      micros.vitaminB6Mg = round2(value);
    } else if (nutId === 1178 || nutNum === '418') {
      micros.vitaminB12Mcg = round2(value);
    } else if (nutId === 1177 || nutNum === '417') {
      micros.folateMcg = round2(value);
    } else if (
      nutId === 2000 ||
      nutId === 1063 ||
      nutNum === '269' ||
      nutNum === '269.3'
    ) {
      if (micros.sugarG === undefined || value > 0) {
        micros.sugarG = round2(value);
      }
    } else if (nutId === 1235 || nutNum === '539') {
      micros.addedSugarG = round2(value);
    } else if (nutId === 1258 || nutNum === '606') {
      micros.saturatedFatG = round2(value);
    } else if (nutId === 1253 || nutNum === '601') {
      micros.cholesterolMg = round2(value);
    } else if (nutId === 1057 || nutNum === '262') {
      micros.caffeineMg = round2(value);
    } else if (nutId === 1018 || nutNum === '221') {
      micros.alcoholG = round2(value);
    }
  }

  const nutrientsPerBasis: MacroNutrients = {
    calories: round2(calories),
    protein: round2(protein),
    carbs: round2(carbs),
    fat: round2(fat),
    fiber: round2(fiber),
  };

  const { servingWeightGrams, servingOptions } = extractUsdaServingOptions(raw);

  return {
    id,
    source,
    name,
    brand,
    basis: 'per100g',
    servingSize: 100,
    servingUnit: 'g',
    ...(servingWeightGrams ? { servingWeightGrams } : {}),
    ...(servingOptions ? { servingOptions } : {}),
    nutrientsPerBasis,
    micronutrientsPerBasis: micros,
    updatedAt: Date.now(),
  };
}

/**
 * Searches USDA FoodData Central via the Next.js API proxy route.
 */
export async function searchUsdaFoods(
  query: string,
  options?: { signal?: AbortSignal; includeBranded?: boolean }
): Promise<FoodItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let url = `/api/usda/foods/search?query=${encodeURIComponent(trimmed)}`;
  if (options?.includeBranded) {
    url += `&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS),Branded')}`;
  }
  const res = await fetch(url, { signal: options?.signal });
  if (!res.ok) {
    throw new Error(`USDA search request failed with status ${res.status}`);
  }

  const data = await res.json();
  const rawFoods: UsdaFoodPayload[] = Array.isArray(data.foods) ? data.foods : [];
  return rawFoods.map((f) => mapUsdaFoodToFoodItem(f, 'usda'));
}

