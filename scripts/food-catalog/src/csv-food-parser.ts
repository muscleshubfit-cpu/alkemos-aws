import { FoodItemSchema } from './backup-schemas';
import { enrichServingOptions } from './portion-enrichment';
import type {
  FoodItem,
  FoodServingOption,
  Micronutrients,
  NutritionBasis,
} from './types';

export interface ParseFoodOptions {
  defaultRegion?: string;
  defaultSource?: FoodItem['source'];
}

export interface ParseFoodResult {
  items: FoodItem[];
  errors: string[];
}

const VALID_SOURCES = new Set<FoodItem['source']>([
  'staple',
  'usda',
  'off',
  'catalog',
  'fatsecret',
  'edamam',
  'nutritionix',
  'custom_barcode',
  'custom_food',
]);

const MICRO_COLUMN_MAP: Record<string, keyof Micronutrients> = {
  sodiummg: 'sodiumMg',
  sugarg: 'sugarG',
  saturatedfatg: 'saturatedFatG',
  cholesterolmg: 'cholesterolMg',
  potassiummg: 'potassiumMg',
  calciummg: 'calciumMg',
  ironmg: 'ironMg',
};

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function slugifyId(name: string, brand?: string): string {
  const base = [brand, name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return base || 'food';
}

function parseBasis(raw: unknown): NutritionBasis | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const normalized = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'per100g' || normalized === '100g') return 'per100g';
  if (normalized === 'per100ml' || normalized === '100ml') return 'per100ml';
  if (normalized === 'perserving' || normalized === 'serving') return 'perServing';
  return null;
}

function parseNonNegativeNumber(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? raw : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }
  return null;
}

function parsePositiveNumber(raw: unknown): number | null {
  const n = parseNonNegativeNumber(raw);
  return n !== null && n > 0 ? n : null;
}

function isMetricOrImperialUnit(unit: string): boolean {
  const lower = unit.trim().toLowerCase();
  return lower === 'g' || lower === 'ml' || lower === 'oz' || lower === 'fl oz';
}

function buildInitialServingOptions(
  basis: NutritionBasis,
  servingSize: number,
  servingUnit: string,
  servingWeightGrams?: number,
  existingOptions?: FoodServingOption[]
): FoodServingOption[] | undefined {
  if (Array.isArray(existingOptions) && existingOptions.length > 0) {
    return existingOptions;
  }
  const unitClean = servingUnit.trim();
  if (
    unitClean &&
    !isMetricOrImperialUnit(unitClean) &&
    typeof servingWeightGrams === 'number' &&
    Number.isFinite(servingWeightGrams) &&
    servingWeightGrams > 0
  ) {
    const baseUnit = basis === 'per100ml' ? 'ml' : 'g';
    const divisor = servingSize > 0 ? servingSize : 1;
    const gramsPerUnit = round2(servingWeightGrams / divisor);
    if (gramsPerUnit > 0) {
      return [
        {
          id: unitClean.toLowerCase(),
          label: `${unitClean} (${gramsPerUnit}${baseUnit})`,
          unit: unitClean,
          grams: gramsPerUnit,
          defaultAmount: servingSize > 0 ? servingSize : 1,
        },
      ];
    }
  }
  return undefined;
}

/**
 * RFC-4180 CSV parser supporting quoted fields, embedded commas/newlines,
 * escaped double quotes (""), and CRLF/LF line endings.
 */
function parseRfc4180Rows(text: string): Array<{ rowNumber: number; fields: string[] }> {
  const cleanText = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const rows: Array<{ rowNumber: number; fields: string[] }> = [];

  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let currentRowNumber = 1;
  let rowStartLine = 1;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleanText[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === '\n') currentRowNumber++;
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field.length === 0) {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      fields.push(field);
      field = '';
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && cleanText[i + 1] === '\n') {
        i++;
      }
      fields.push(field);
      if (fields.some((f) => f.trim().length > 0)) {
        rows.push({ rowNumber: rowStartLine, fields });
      }
      fields = [];
      field = '';
      currentRowNumber++;
      rowStartLine = currentRowNumber;
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || fields.length > 0) {
    fields.push(field);
    if (fields.some((f) => f.trim().length > 0)) {
      rows.push({ rowNumber: rowStartLine, fields });
    }
  }

  return rows;
}

export function parseFoodCsv(
  csvText: string,
  options?: ParseFoodOptions
): ParseFoodResult {
  const items: FoodItem[] = [];
  const errors: string[] = [];

  if (!csvText || !csvText.trim()) {
    return { items, errors: ['CSV input is empty'] };
  }

  const parsedRows = parseRfc4180Rows(csvText);
  if (parsedRows.length === 0) {
    return { items, errors: ['CSV input contains no rows'] };
  }

  const headerRow = parsedRows[0].fields;
  const colIndex = new Map<string, number>();
  headerRow.forEach((rawHeader, idx) => {
    const key = normalizeHeaderKey(rawHeader);
    if (key && !colIndex.has(key)) {
      colIndex.set(key, idx);
    }
  });

  const requiredCols = ['name', 'calories', 'protein', 'carbs', 'fat'];
  const missingCols = requiredCols.filter((col) => !colIndex.has(col));
  if (missingCols.length > 0) {
    return {
      items,
      errors: [`Row 1: missing required column(s): ${missingCols.join(', ')}`],
    };
  }

  const defaultSource: FoodItem['source'] =
    options?.defaultSource && VALID_SOURCES.has(options.defaultSource)
      ? options.defaultSource
      : 'custom_food';
  const defaultRegion = options?.defaultRegion?.trim() || undefined;
  const usedIds = new Set<string>();
  const now = Date.now();

  const getCell = (fields: string[], key: string): string => {
    const idx = colIndex.get(key);
    if (idx === undefined || idx >= fields.length) return '';
    return fields[idx].trim();
  };

  for (let r = 1; r < parsedRows.length; r++) {
    const { rowNumber, fields } = parsedRows[r];
    const name = getCell(fields, 'name');
    if (!name) {
      errors.push(`Row ${rowNumber}: missing required "name"`);
      continue;
    }

    const calories = parseNonNegativeNumber(getCell(fields, 'calories'));
    const protein = parseNonNegativeNumber(getCell(fields, 'protein'));
    const carbs = parseNonNegativeNumber(getCell(fields, 'carbs'));
    const fat = parseNonNegativeNumber(getCell(fields, 'fat'));

    const badMacros: string[] = [];
    if (calories === null) badMacros.push('calories');
    if (protein === null) badMacros.push('protein');
    if (carbs === null) badMacros.push('carbs');
    if (fat === null) badMacros.push('fat');

    if (badMacros.length > 0) {
      errors.push(
        `Row ${rowNumber}: invalid or negative required macro(s): ${badMacros.join(', ')}`
      );
      continue;
    }

    const fiberRaw = getCell(fields, 'fiber');
    let fiber = 0;
    if (fiberRaw !== '') {
      const parsedFiber = parseNonNegativeNumber(fiberRaw);
      if (parsedFiber === null) {
        errors.push(`Row ${rowNumber}: invalid or negative "fiber"`);
        continue;
      }
      fiber = parsedFiber;
    }

    const basisRaw = getCell(fields, 'basis');
    let basis: NutritionBasis = 'per100g';
    if (basisRaw !== '') {
      const parsedBasis = parseBasis(basisRaw);
      if (!parsedBasis) {
        errors.push(
          `Row ${rowNumber}: invalid "basis" ("${basisRaw}"); expected per100g, per100ml, or perServing`
        );
        continue;
      }
      basis = parsedBasis;
    }

    const servingUnitRaw = getCell(fields, 'servingunit');
    const servingUnit =
      servingUnitRaw || (basis === 'per100ml' ? 'ml' : basis === 'perServing' ? 'serving' : 'g');

    const servingSizeRaw = getCell(fields, 'servingsize');
    const servingSize =
      servingSizeRaw !== ''
        ? parsePositiveNumber(servingSizeRaw)
        : basis === 'perServing'
          ? 1
          : 100;
    if (servingSize === null) {
      errors.push(`Row ${rowNumber}: invalid "servingSize"`);
      continue;
    }

    const servingWeightRaw = getCell(fields, 'servingweightgrams');
    let servingWeightGrams: number | undefined;
    if (servingWeightRaw !== '') {
      const parsedWeight = parsePositiveNumber(servingWeightRaw);
      if (parsedWeight === null) {
        errors.push(`Row ${rowNumber}: invalid "servingWeightGrams"`);
        continue;
      }
      servingWeightGrams = parsedWeight;
    }

    const brand = getCell(fields, 'brand') || undefined;
    const region = getCell(fields, 'region') || defaultRegion;
    const category = getCell(fields, 'category') || undefined;
    const barcode = getCell(fields, 'barcode') || undefined;

    const aliasesRaw = getCell(fields, 'aliases');
    const aliases = aliasesRaw
      ? aliasesRaw
          .split(/[;|]/)
          .map((a) => a.trim())
          .filter(Boolean)
      : undefined;

    const micronutrientsPerBasis: Micronutrients = {};
    for (const [colKey, microKey] of Object.entries(MICRO_COLUMN_MAP)) {
      const rawVal = getCell(fields, colKey);
      if (rawVal !== '') {
        const parsedMicro = parseNonNegativeNumber(rawVal);
        if (parsedMicro !== null) {
          micronutrientsPerBasis[microKey] = parsedMicro;
        }
      }
    }

    const rawId = getCell(fields, 'id');
    let id = rawId || `csv:${slugifyId(name, brand)}`;
    if (usedIds.has(id)) {
      let suffix = 2;
      while (usedIds.has(`${id}-${suffix}`)) suffix++;
      id = `${id}-${suffix}`;
    }
    usedIds.add(id);

    const initialOptions = buildInitialServingOptions(
      basis,
      servingSize,
      servingUnit,
      servingWeightGrams
    );
    const servingOptions = enrichServingOptions({
      name,
      category,
      basis,
      existingOptions: initialOptions,
      servingWeightGrams,
    });

    const candidate: FoodItem = {
      id,
      source: defaultSource,
      name,
      ...(brand ? { brand } : {}),
      ...(region ? { region } : {}),
      ...(category ? { category } : {}),
      ...(barcode ? { barcode } : {}),
      ...(aliases && aliases.length > 0 ? { aliases } : {}),
      basis,
      servingSize,
      servingUnit,
      ...(servingWeightGrams !== undefined ? { servingWeightGrams } : {}),
      servingOptions,
      nutrientsPerBasis: {
        calories: calories!,
        protein: protein!,
        carbs: carbs!,
        fat: fat!,
        fiber,
      },
      micronutrientsPerBasis,
      updatedAt: now,
    };

    const validated = FoodItemSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(
        `Row ${rowNumber}: schema validation failed (${validated.error.issues[0]?.message ?? 'invalid item'})`
      );
      continue;
    }

    items.push(validated.data);
  }

  return { items, errors };
}

export function parseFoodJson(
  jsonText: string,
  options?: ParseFoodOptions
): ParseFoodResult {
  const items: FoodItem[] = [];
  const errors: string[] = [];

  if (!jsonText || !jsonText.trim()) {
    return { items, errors: ['JSON input is empty'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return {
      items,
      errors: [`Invalid JSON: ${err instanceof Error ? err.message : 'parse error'}`],
    };
  }

  let rawList: unknown[];
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.foods)) {
      rawList = obj.foods;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    } else {
      return {
        items,
        errors: ['JSON root must be an array or an object with a "foods" or "items" array'],
      };
    }
  } else {
    return {
      items,
      errors: ['JSON root must be an array or an object with a "foods" or "items" array'],
    };
  }

  const defaultSource: FoodItem['source'] =
    options?.defaultSource && VALID_SOURCES.has(options.defaultSource)
      ? options.defaultSource
      : 'custom_food';
  const defaultRegion = options?.defaultRegion?.trim() || undefined;
  const usedIds = new Set<string>();
  const now = Date.now();

  for (let i = 0; i < rawList.length; i++) {
    const entry = rawList[i];
    const label = `Item ${i + 1}`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${label}: expected a food object`);
      continue;
    }

    const rec = entry as Record<string, unknown>;
    const name = typeof rec.name === 'string' ? rec.name.trim() : '';
    if (!name) {
      errors.push(`${label}: missing required "name"`);
      continue;
    }

    const nutrientObj =
      rec.nutrientsPerBasis &&
      typeof rec.nutrientsPerBasis === 'object' &&
      !Array.isArray(rec.nutrientsPerBasis)
        ? (rec.nutrientsPerBasis as Record<string, unknown>)
        : rec;

    const calories = parseNonNegativeNumber(nutrientObj.calories);
    const protein = parseNonNegativeNumber(nutrientObj.protein);
    const carbs = parseNonNegativeNumber(nutrientObj.carbs);
    const fat = parseNonNegativeNumber(nutrientObj.fat);

    const badMacros: string[] = [];
    if (calories === null) badMacros.push('calories');
    if (protein === null) badMacros.push('protein');
    if (carbs === null) badMacros.push('carbs');
    if (fat === null) badMacros.push('fat');

    if (badMacros.length > 0) {
      errors.push(
        `${label}: invalid or negative required macro(s): ${badMacros.join(', ')}`
      );
      continue;
    }

    const fiber =
      nutrientObj.fiber !== undefined && nutrientObj.fiber !== null && nutrientObj.fiber !== ''
        ? parseNonNegativeNumber(nutrientObj.fiber)
        : 0;
    if (fiber === null) {
      errors.push(`${label}: invalid or negative "fiber"`);
      continue;
    }

    const basis: NutritionBasis =
      rec.basis !== undefined ? (parseBasis(rec.basis) ?? 'per100g') : 'per100g';
    if (rec.basis !== undefined && parseBasis(rec.basis) === null) {
      errors.push(`${label}: invalid "basis"`);
      continue;
    }

    const servingUnit =
      typeof rec.servingUnit === 'string' && rec.servingUnit.trim()
        ? rec.servingUnit.trim()
        : basis === 'per100ml'
          ? 'ml'
          : basis === 'perServing'
            ? 'serving'
            : 'g';

    const servingSize =
      rec.servingSize !== undefined
        ? parsePositiveNumber(rec.servingSize)
        : basis === 'perServing'
          ? 1
          : 100;
    if (servingSize === null) {
      errors.push(`${label}: invalid "servingSize"`);
      continue;
    }

    const servingWeightGrams =
      rec.servingWeightGrams !== undefined
        ? (parsePositiveNumber(rec.servingWeightGrams) ?? undefined)
        : undefined;

    const brand = typeof rec.brand === 'string' && rec.brand.trim() ? rec.brand.trim() : undefined;
    const region =
      typeof rec.region === 'string' && rec.region.trim() ? rec.region.trim() : defaultRegion;
    const category =
      typeof rec.category === 'string' && rec.category.trim() ? rec.category.trim() : undefined;
    const barcode =
      typeof rec.barcode === 'string' && rec.barcode.trim()
        ? rec.barcode.trim()
        : rec.barcode === null
          ? null
          : undefined;

    const source: FoodItem['source'] =
      typeof rec.source === 'string' && VALID_SOURCES.has(rec.source as FoodItem['source'])
        ? (rec.source as FoodItem['source'])
        : defaultSource;

    const accuracyTier =
      rec.accuracyTier === 1 ||
      rec.accuracyTier === 2 ||
      rec.accuracyTier === 3 ||
      rec.accuracyTier === 4
        ? rec.accuracyTier
        : undefined;

    const aliases = Array.isArray(rec.aliases)
      ? rec.aliases
          .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
          .map((a) => a.trim())
      : undefined;

    const micronutrientsPerBasis: Micronutrients = {};
    if (
      rec.micronutrientsPerBasis &&
      typeof rec.micronutrientsPerBasis === 'object' &&
      !Array.isArray(rec.micronutrientsPerBasis)
    ) {
      for (const [k, v] of Object.entries(rec.micronutrientsPerBasis as Record<string, unknown>)) {
        const parsedVal = parseNonNegativeNumber(v);
        if (parsedVal !== null) {
          micronutrientsPerBasis[k] = parsedVal;
        }
      }
    }

    const rawId = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : '';
    let id = rawId || `json:${slugifyId(name, brand)}`;
    if (usedIds.has(id)) {
      let suffix = 2;
      while (usedIds.has(`${id}-${suffix}`)) suffix++;
      id = `${id}-${suffix}`;
    }
    usedIds.add(id);

    const existingOptions = Array.isArray(rec.servingOptions)
      ? (rec.servingOptions as FoodServingOption[])
      : undefined;

    const initialOptions = buildInitialServingOptions(
      basis,
      servingSize,
      servingUnit,
      servingWeightGrams,
      existingOptions
    );
    const servingOptions = enrichServingOptions({
      name,
      category,
      basis,
      existingOptions: initialOptions,
      servingWeightGrams,
    });

    const updatedAt =
      typeof rec.updatedAt === 'number' && Number.isFinite(rec.updatedAt) ? rec.updatedAt : now;

    const candidate: FoodItem = {
      id,
      source,
      name,
      ...(accuracyTier !== undefined ? { accuracyTier } : {}),
      ...(brand ? { brand } : {}),
      ...(region ? { region } : {}),
      ...(category ? { category } : {}),
      ...(barcode !== undefined ? { barcode } : {}),
      ...(aliases && aliases.length > 0 ? { aliases } : {}),
      basis,
      servingSize,
      servingUnit,
      ...(servingWeightGrams !== undefined ? { servingWeightGrams } : {}),
      servingOptions,
      nutrientsPerBasis: {
        calories: calories!,
        protein: protein!,
        carbs: carbs!,
        fat: fat!,
        fiber,
      },
      micronutrientsPerBasis,
      updatedAt,
    };

    const validated = FoodItemSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(
        `${label}: schema validation failed (${validated.error.issues[0]?.message ?? 'invalid item'})`
      );
      continue;
    }

    items.push(validated.data);
  }

  return { items, errors };
}
