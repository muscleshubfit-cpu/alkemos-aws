import type { FoodServingOption, NutritionBasis } from './types';
import type { UsdaFoodPayload, UsdaFoodPortion } from './usda-adapter';
import { parseHouseholdServingText } from './scaling';

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

const PLACEHOLDER_UNIT_NAMES = new Set([
  '',
  'undetermined',
  'none',
  'racc',
  'quantity not specified',
  'n/a',
]);

const SUPPORTED_PORTION_UNITS = new Set([
  'small',
  'medium',
  'large',
  'extra large',
  'cup',
  'tbsp',
  'tsp',
  'bowl',
  'pc',
  'piece',
  'slice',
  'fillet',
  'breast',
  'thigh',
  'link',
  'patty',
  'scoop',
  'pack',
  'sachet',
  'can',
  'bottle',
  'serving',
  'stick',
  'bar',
  'order',
  'clove',
  'stalk',
  'leaf',
  'bunch',
  'head',
  'strip',
  'wedge',
  'sheet',
  'container',
  'jar',
  'box',
  'bag',
  'tub',
  'mug',
  'glass',
]);

function isPlaceholder(text: string | undefined): boolean {
  const normalized = (text || '').trim().toLowerCase();
  return !normalized || PLACEHOLDER_UNIT_NAMES.has(normalized);
}

function buildOption(
  unit: string,
  grams: number,
  baseUnit: 'g' | 'ml',
  defaultAmount = 1
): FoodServingOption {
  const gramsRounded = round2(grams);
  return {
    id: unit,
    label: `${unit} (${gramsRounded}${baseUnit})`,
    unit,
    grams: gramsRounded,
    defaultAmount,
  };
}

function parsePortionCandidate(
  portion: UsdaFoodPortion
): { count: number; unit: string } | null {
  const amount =
    typeof portion.amount === 'number' && Number.isFinite(portion.amount) && portion.amount > 0
      ? portion.amount
      : 1;

  const candidates: string[] = [];

  if (!isPlaceholder(portion.portionDescription)) {
    candidates.push(portion.portionDescription!.trim());
  }

  const unitName = !isPlaceholder(portion.measureUnit?.name)
    ? portion.measureUnit!.name!.trim()
    : '';
  const unitAbbr = !isPlaceholder(portion.measureUnit?.abbreviation)
    ? portion.measureUnit!.abbreviation!.trim()
    : '';
  const modifier = !isPlaceholder(portion.modifier) ? portion.modifier!.trim() : '';

  if (unitName) {
    candidates.push(`${amount} ${unitName}`);
  }
  if (modifier) {
    candidates.push(`${amount} ${modifier}`);
  }
  if (unitAbbr) {
    candidates.push(`${amount} ${unitAbbr}`);
  }

  for (const text of candidates) {
    const parsed = parseHouseholdServingText(text);
    if (parsed && SUPPORTED_PORTION_UNITS.has(parsed.unit)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Extracts all valid household, volume, countable, and size-qualifier portions from
 * USDA FoodData Central payloads (`foodPortions`, `foodMeasures`, and `servingSize`/`householdServingFullText`).
 */
export function extractUsdaPortions(raw: UsdaFoodPayload): FoodServingOption[] {
  const unitLower = (raw.servingSizeUnit || '').trim().toLowerCase();
  const baseUnit: 'g' | 'ml' = unitLower === 'ml' ? 'ml' : 'g';

  const options: FoodServingOption[] = [];
  const seenIds = new Set<string>();
  const seenUnitWeights = new Set<string>();

  const pushPortion = (unit: string, perUnitGrams: number) => {
    if (
      !unit ||
      unit === 'g' ||
      unit === 'ml' ||
      !SUPPORTED_PORTION_UNITS.has(unit) ||
      !Number.isFinite(perUnitGrams) ||
      perUnitGrams <= 0
    ) {
      return;
    }
    const gramsRounded = round2(perUnitGrams);
    if (gramsRounded <= 0) return;

    const weightKey = `${unit}:${gramsRounded}`;
    if (seenIds.has(unit) || seenUnitWeights.has(weightKey)) {
      return;
    }

    seenIds.add(unit);
    seenUnitWeights.add(weightKey);
    options.push(buildOption(unit, gramsRounded, baseUnit, 1));
  };

  if (
    typeof raw.servingSize === 'number' &&
    Number.isFinite(raw.servingSize) &&
    raw.servingSize > 0 &&
    (unitLower === 'g' || unitLower === 'grm' || unitLower === 'ml')
  ) {
    const parsedHousehold = raw.householdServingFullText
      ? parseHouseholdServingText(raw.householdServingFullText)
      : null;
    if (parsedHousehold && SUPPORTED_PORTION_UNITS.has(parsedHousehold.unit)) {
      pushPortion(parsedHousehold.unit, raw.servingSize / parsedHousehold.count);
    } else if (raw.dataType === 'Branded' && round2(raw.servingSize) !== 100) {
      pushPortion('serving', raw.servingSize);
    }
  }

  if (Array.isArray(raw.foodPortions)) {
    for (const portion of raw.foodPortions) {
      const gramWeight = portion?.gramWeight;
      if (typeof gramWeight !== 'number' || !Number.isFinite(gramWeight) || gramWeight <= 0) {
        continue;
      }
      const parsed = parsePortionCandidate(portion);
      if (parsed) {
        pushPortion(parsed.unit, gramWeight / parsed.count);
      }
    }
  }

  if (Array.isArray(raw.foodMeasures)) {
    for (const measure of raw.foodMeasures) {
      const gramWeight = measure?.gramWeight;
      if (typeof gramWeight !== 'number' || !Number.isFinite(gramWeight) || gramWeight <= 0) {
        continue;
      }
      const candidates = [measure.disseminationText, measure.measureUnitName].filter(
        (t): t is string => !isPlaceholder(t)
      );
      for (const text of candidates) {
        const parsed = parseHouseholdServingText(text);
        if (parsed && SUPPORTED_PORTION_UNITS.has(parsed.unit)) {
          pushPortion(parsed.unit, gramWeight / parsed.count);
          break;
        }
      }
    }
  }

  return options;
}

interface FallbackPortionRule {
  pattern: RegExp;
  exclude?: RegExp;
  options: (baseUnit: 'g' | 'ml') => FoodServingOption[];
}

const FALLBACK_PORTION_RULES: FallbackPortionRule[] = [
  // Egg white / yolk specific before whole egg
  {
    pattern: /\begg\s*white(s)?\b/i,
    options: (u) => [buildOption('large', 33, u), buildOption('cup', 243, u)],
  },
  {
    pattern: /\begg\s*yolk(s)?\b/i,
    options: (u) => [buildOption('large', 17, u)],
  },
  // Whole eggs (raw, boiled, fried, scrambled, poached, etc.)
  {
    pattern: /\begg(s)?\b/i,
    exclude: /\b(noodle|eggplant|roll|tart|pie|salad|sandwich|mcmuffin|powder|substitute)\b/i,
    options: (u) => [
      buildOption('large', 50, u),
      buildOption('medium', 44, u),
      buildOption('pc', 50, u),
    ],
  },
  // Dry/uncooked rice
  {
    pattern: /\brice\b.*\b(dry|uncooked|raw)\b|\b(dry|uncooked|raw)\b.*\brice\b/i,
    exclude: /\b(cake|cracker|noodle|milk|vinegar|syrup|bran|flour|paper|wine)\b/i,
    options: (u) => [buildOption('cup', 185, u)],
  },
  // Cooked rice (white, short-grain, Japanese, sushi, brown, jasmine, basmati)
  {
    pattern: /\brice\b/i,
    exclude: /\b(cake|cracker|noodle|milk|vinegar|syrup|bran|flour|paper|wine|dry|uncooked|raw)\b/i,
    options: (u) => [buildOption('cup', 158, u), buildOption('bowl', 200, u)],
  },
  // Cooked oatmeal
  {
    pattern: /\boat(s|meal)?\b.*\b(cooked|prepared)\b|\b(cooked|prepared)\b.*\boat(s|meal)?\b/i,
    options: (u) => [buildOption('cup', 234, u), buildOption('bowl', 250, u)],
  },
  // Dry oats / oatmeal
  {
    pattern: /\boat(s|meal)?\b/i,
    exclude: /\b(milk|bread|cookie|bar|bran)\b/i,
    options: (u) => [buildOption('cup', 80, u), buildOption('tbsp', 5, u)],
  },
  // Nut butters (before generic butter)
  {
    pattern: /\b(peanut|almond|cashew|sunflower|nut)\s+butter\b/i,
    options: (u) => [buildOption('tbsp', 16, u), buildOption('tsp', 5.3, u)],
  },
  // Oils
  {
    pattern: /\boil\b/i,
    exclude: /\b(boiled|broiled|fish|tuna|sardine|packed in oil|in oil)\b/i,
    options: (u) =>
      u === 'ml'
        ? [buildOption('tbsp', 15, 'ml'), buildOption('tsp', 5, 'ml')]
        : [buildOption('tbsp', 14, 'g'), buildOption('tsp', 4.7, 'g')],
  },
  // Butter / margarine / ghee
  {
    pattern: /\b(butter|margarine|ghee)\b/i,
    exclude: /\b(buttermilk|butterscotch|cookie|croissant|chicken|squash)\b/i,
    options: (u) => [buildOption('tbsp', 14, u), buildOption('tsp', 4.7, u)],
  },
  // Honey / syrup
  {
    pattern: /\b(honey|syrup)\b/i,
    exclude: /\b(honeydew|cereal|granola|mustard)\b/i,
    options: (u) => [buildOption('tbsp', 21, u), buildOption('tsp', 7, u)],
  },
  // Sauces, dressings, condiments
  {
    pattern: /\b(sauce|dressing|ketchup|mayo|mayonnaise|mustard|vinegar|salsa|pesto|gravy)\b/i,
    options: (u) =>
      u === 'ml'
        ? [buildOption('tbsp', 15, 'ml'), buildOption('tsp', 5, 'ml')]
        : [buildOption('tbsp', 15, 'g'), buildOption('tsp', 5, 'g')],
  },
  // Fruits
  {
    pattern: /\bapple(s)?\b/i,
    exclude: /\b(juice|cider|sauce|pie|vinegar|butter|pineapple)\b/i,
    options: (u) => [
      buildOption('medium', 182, u),
      buildOption('large', 223, u),
      buildOption('small', 149, u),
    ],
  },
  {
    pattern: /\bbanana(s)?\b/i,
    exclude: /\b(bread|chip|chips|pudding|cake|smoothie|milk|powder)\b/i,
    options: (u) => [
      buildOption('medium', 118, u),
      buildOption('large', 136, u),
      buildOption('small', 101, u),
    ],
  },
  {
    pattern: /\borange(s)?\b/i,
    exclude: /\b(juice|soda|marmalade|chicken|peel|zest)\b/i,
    options: (u) => [buildOption('medium', 131, u), buildOption('large', 184, u)],
  },
  {
    pattern: /\bmango(es)?\b/i,
    exclude: /\b(juice|shake|smoothie|dried|jam)\b/i,
    options: (u) => [buildOption('medium', 207, u), buildOption('cup', 165, u)],
  },
  {
    pattern: /\bavocado(s)?\b/i,
    exclude: /\boil\b/i,
    options: (u) => [buildOption('medium', 150, u), buildOption('pc', 150, u)],
  },
  {
    pattern: /\b(strawberr|blueberr|raspberr|blackberr|grape)(y|ies|s)?\b/i,
    exclude: /\b(jam|jelly|juice|yogurt|syrup)\b/i,
    options: (u) => [buildOption('cup', 150, u)],
  },
  // Vegetables
  {
    pattern: /\b(sweet potato|potato)(es)?\b/i,
    exclude: /\b(chip|chips|fries|salad|soup|starch|flour|mashed)\b/i,
    options: (u) => [buildOption('medium', 150, u), buildOption('large', 213, u)],
  },
  {
    pattern: /\btomato(es)?\b/i,
    exclude: /\b(sauce|paste|soup|juice|ketchup|puree)\b/i,
    options: (u) => [buildOption('medium', 123, u), buildOption('slice', 20, u)],
  },
  {
    pattern: /\bonion(s)?\b/i,
    exclude: /\b(powder|ring|rings|soup|dip)\b/i,
    options: (u) => [buildOption('medium', 110, u), buildOption('cup', 160, u)],
  },
  {
    pattern: /\bcarrot(s)?\b/i,
    exclude: /\b(cake|juice|soup)\b/i,
    options: (u) => [buildOption('medium', 61, u), buildOption('cup', 128, u)],
  },
  {
    pattern: /\b(spinach|lettuce|arugula|kale)\b/i,
    options: (u) => [buildOption('cup', 30, u)],
  },
  {
    pattern: /\b(broccoli|cauliflower|cabbage|green bean|asparagus|zucchini|cucumber)\b/i,
    options: (u) => [buildOption('cup', 90, u)],
  },
  {
    pattern: /\bgarlic\b/i,
    exclude: /\b(bread|powder|salt|sauce|butter)\b/i,
    options: (u) => [buildOption('clove', 3, u)],
  },
  // Breads & baked goods
  {
    pattern: /\b(bread|toast)\b/i,
    exclude: /\b(crumb|crumbs|pudding|stick|sticks|gingerbread)\b/i,
    options: (u) => [buildOption('slice', 28, u)],
  },
  {
    pattern: /\b(tortilla|wrap|pita)\b/i,
    exclude: /\bchip(s)?\b/i,
    options: (u) => [buildOption('pc', 45, u)],
  },
  // Meats, poultry & fish
  {
    pattern: /\bchicken\b.*\bbreast\b|\bbreast\b.*\bchicken\b/i,
    options: (u) => [buildOption('breast', 174, u)],
  },
  {
    pattern: /\bchicken\b.*\bthigh\b|\bthigh\b.*\bchicken\b/i,
    options: (u) => [buildOption('thigh', 116, u)],
  },
  {
    pattern: /\b(salmon|tilapia|cod|halibut|trout|mackerel|bangus|milkfish|fish)\b/i,
    exclude: /\b(sauce|oil|cake|stick|sticks|ball|balls|cracker)\b/i,
    options: (u) => [buildOption('fillet', 154, u)],
  },
  {
    pattern: /\b(patty|patties|burger)\b/i,
    options: (u) => [buildOption('patty', 113, u)],
  },
  {
    pattern: /\b(sausage|hotdog|hot dog|frankfurter|longganisa)\b/i,
    options: (u) => [buildOption('link', 45, u)],
  },
  {
    pattern: /\bbacon\b/i,
    options: (u) => [buildOption('slice', 8, u)],
  },
  // Dairy & liquids
  {
    pattern: /\b(milk|juice|coffee|tea|soda|cola|water|broth|stock|smoothie|shake|beverage|drink)\b/i,
    exclude: /\b(milk chocolate|milkfish|milk powder|tea biscuit|coffee cake)\b/i,
    options: (u) =>
      u === 'ml' ? [buildOption('cup', 240, 'ml')] : [buildOption('cup', 244, 'g')],
  },
  {
    pattern: /\b(yogurt|yoghurt|cottage cheese)\b/i,
    options: (u) => [buildOption('cup', 245, u), buildOption('tbsp', 15, u)],
  },
  {
    pattern: /\bcheese\b/i,
    exclude: /\b(cheesecake|cheeseburger|cottage cheese|cream cheese|mac and cheese)\b/i,
    options: (u) => [buildOption('slice', 28, u), buildOption('cup', 113, u)],
  },
  {
    pattern: /\bcream cheese\b/i,
    options: (u) => [buildOption('tbsp', 14.5, u)],
  },
  // Powders & pantry staples
  {
    pattern: /\b(whey|protein powder|casein|collagen)\b/i,
    options: (u) => [buildOption('scoop', 30, u)],
  },
  {
    pattern: /\bflour\b/i,
    options: (u) => [buildOption('cup', 120, u), buildOption('tbsp', 8, u)],
  },
  {
    pattern: /\bsugar\b/i,
    exclude: /\b(free|sugar snap|cookie|donut)\b/i,
    options: (u) => [buildOption('tbsp', 12.5, u), buildOption('tsp', 4.2, u)],
  },
];

function isMetricOrImperialUnit(unit: string): boolean {
  const lower = (unit || '').trim().toLowerCase();
  return lower === 'g' || lower === 'ml' || lower === 'oz' || lower === 'fl oz';
}

/**
 * Enriches a food's serving options by:
 * 1. Preserving valid existing options,
 * 2. Adding deterministic category/food-state fallback household units when missing,
 * 3. Always appending base metric (`g`/`ml`) and imperial (`oz`/`fl oz`) options, deduped by `id`.
 */
export function enrichServingOptions(input: {
  name: string;
  category?: string;
  basis: NutritionBasis;
  existingOptions?: FoodServingOption[];
  servingWeightGrams?: number;
}): FoodServingOption[] {
  const isLiquid = input.basis === 'per100ml';
  const baseUnit: 'g' | 'ml' = isLiquid ? 'ml' : 'g';

  const household: FoodServingOption[] = [];
  const seenIds = new Set<string>();

  const pushHousehold = (opt: FoodServingOption) => {
    if (!opt || !opt.id || !opt.unit) return;
    if (isMetricOrImperialUnit(opt.unit)) return;
    if (typeof opt.grams !== 'number' || !Number.isFinite(opt.grams) || opt.grams <= 0) {
      return;
    }
    if (seenIds.has(opt.id)) return;
    seenIds.add(opt.id);
    household.push({ ...opt });
  };

  if (Array.isArray(input.existingOptions)) {
    for (const opt of input.existingOptions) {
      pushHousehold(opt);
    }
  }

  const searchable = `${input.name || ''} ${input.category || ''}`.trim();
  const hadExistingHousehold = household.length > 0;

  if (!hadExistingHousehold) {
    for (const rule of FALLBACK_PORTION_RULES) {
      if (rule.pattern.test(searchable) && (!rule.exclude || !rule.exclude.test(searchable))) {
        for (const opt of rule.options(baseUnit)) {
          pushHousehold(opt);
        }
        break;
      }
    }
  }

  if (
    household.length === 0 &&
    typeof input.servingWeightGrams === 'number' &&
    Number.isFinite(input.servingWeightGrams) &&
    input.servingWeightGrams > 0 &&
    (input.basis === 'perServing' || round2(input.servingWeightGrams) !== 100)
  ) {
    pushHousehold(buildOption('serving', input.servingWeightGrams, baseUnit, 1));
  }

  const metricOption: FoodServingOption = {
    id: baseUnit,
    label: baseUnit,
    unit: baseUnit,
    grams: 1,
    defaultAmount: 100,
  };

  const imperialOption: FoodServingOption = isLiquid
    ? {
        id: 'fl oz',
        label: 'fl oz',
        unit: 'fl oz',
        grams: 29.57,
        defaultAmount: 1,
      }
    : {
        id: 'oz',
        label: 'oz',
        unit: 'oz',
        grams: 28.35,
        defaultAmount: 1,
      };

  const result: FoodServingOption[] = [...household];
  if (!seenIds.has(metricOption.id)) {
    seenIds.add(metricOption.id);
    result.push(metricOption);
  }
  if (!seenIds.has(imperialOption.id)) {
    seenIds.add(imperialOption.id);
    result.push(imperialOption);
  }

  return result;
}
