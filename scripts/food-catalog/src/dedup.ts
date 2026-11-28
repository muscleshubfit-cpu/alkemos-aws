import type { FoodItem, FoodServingOption, MacroNutrients } from './types';
import type { CatalogFoodInput } from './catalog-schema';
import { buildCanonicalFoodKey } from './name-normalizer';

export interface DedupeCompileResult {
  foods: CatalogFoodInput[];
  legacyAliases: Map<string, string>;
}

const GENERIC_BRANDS = new Set(['', 'generic', 'unbranded', 'none', 'usda', 'n a']);

const RAW_PREP_TOKENS = new Set(['raw', 'uncooked', 'dry']);
const DRIED_PREP_TOKENS = new Set(['dried', 'dehydrated']);
const COOKED_PREP_TOKENS = new Set([
  'cooked',
  'boiled',
  'hard-boiled',
  'soft-boiled',
  'fried',
  'pan-fried',
  'deep-fried',
  'scrambled',
  'poached',
  'steamed',
  'roasted',
  'baked',
  'grilled',
  'broiled',
  'braised',
  'stewed',
  'smoked',
  'canned',
]);

const PASS_C_NOISE_TOKENS = new Set([
  'raw',
  'uncooked',
  'cooked',
  'fresh',
  'prepared',
  'unprepared',
  'grade',
  'a',
  'aa',
  'b',
  'large',
  'medium',
  'small',
  'extra',
  'jumbo',
  'whole',
  'regular',
  'commercial',
  'all',
  'variety',
  'broiler',
  'fryer',
  'meat',
  'only',
  'separable',
  'lean',
  'nf',
  'ns',
  'as',
  'to',
  'or',
  'and',
  'with',
  'in',
  'of',
  'the',
]);

const FOOD_GROUP_PATTERNS: Array<{ group: string; pattern: RegExp }> = [
  { group: 'egg', pattern: /\begg(s)?\b/i },
  { group: 'dairy', pattern: /\b(dairy|milk|cheese|yogurt|yoghurt|cream|butter)\b/i },
  { group: 'poultry', pattern: /\b(poultry|chicken|turkey|duck)\b/i },
  { group: 'meat', pattern: /\b(beef|pork|lamb|veal|meat|sausage|bacon|ham)\b/i },
  { group: 'seafood', pattern: /\b(fish|seafood|finfish|shellfish|shrimp|salmon|tuna)\b/i },
  { group: 'grain', pattern: /\b(grain|cereal|rice|pasta|bread|baked|oat|wheat|noodle|flour)\b/i },
  { group: 'fruit', pattern: /\b(fruit|berry|berries|citrus|apple|banana|mango)\b/i },
  { group: 'vegetable', pattern: /\b(vegetable|veggie|produce|greens|potato|salad)\b/i },
  { group: 'legume', pattern: /\b(legume|bean|lentil|pea|soy|tofu|chickpea)\b/i },
  { group: 'nut_seed', pattern: /\b(nut|seed|almond|peanut|walnut|cashew)\b/i },
  { group: 'fat_oil', pattern: /\b(fat|oil|shortening|lard|margarine)\b/i },
  { group: 'beverage', pattern: /\b(beverage|drink|juice|soda|coffee|tea|water|alcohol)\b/i },
  { group: 'sweet', pattern: /\b(sweet|candy|chocolate|dessert|snack|cookie|cake|sugar)\b/i },
  { group: 'condiment', pattern: /\b(sauce|soup|gravy|spice|herb|condiment|dressing)\b/i },
];

type PrepGroup = 'raw' | 'cooked' | 'dried' | 'unspecified';

interface PrepState {
  group: PrepGroup;
  specific: string | null;
}

/**
 * Normalizes a barcode string:
 * - Strips whitespace and non-digit characters.
 * - Returns null if empty, < 8 digits, or > 14 digits.
 * - Normalizes 12-digit UPC-A to 13-digit leading-zero EAN-13 (`0${digits}`).
 */
export function normalizeBarcode(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, '');
  if (digits.length < 8 || digits.length > 14) {
    return null;
  }
  if (digits.length === 12) {
    return `0${digits}`;
  }
  return digits;
}

function isCustomFood(item: Pick<FoodItem, 'source'>): boolean {
  return item.source === 'custom_food' || item.source === 'custom_barcode';
}

function inferAccuracyTier(source: FoodItem['source']): 1 | 2 | 3 | 4 {
  switch (source) {
    case 'staple':
    case 'usda':
      return 1;
    case 'catalog':
      return 2;
    case 'fatsecret':
    case 'edamam':
    case 'nutritionix':
      return 3;
    case 'off':
    default:
      return 4;
  }
}

function getAccuracyTier(item: Pick<FoodItem, 'accuracyTier' | 'source'>): 1 | 2 | 3 | 4 {
  if (
    item.accuracyTier === 1 ||
    item.accuracyTier === 2 ||
    item.accuracyTier === 3 ||
    item.accuracyTier === 4
  ) {
    return item.accuracyTier;
  }
  return inferAccuracyTier(item.source);
}

function normalizeBrand(brand?: string): string {
  if (!brand) return '';
  const cleaned = brand
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return GENERIC_BRANDS.has(cleaned) ? '' : cleaned;
}

function extractPrepState(name: string): PrepState {
  const lower = (name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const words = lower.match(/[a-z]+(?:-[a-z]+)*/g) ?? [];
  let hasRaw = false;
  let hasDried = false;
  let cookedSpecific: string | null = null;
  let hasCooked = false;

  for (const word of words) {
    if (DRIED_PREP_TOKENS.has(word)) {
      hasDried = true;
    } else if (COOKED_PREP_TOKENS.has(word)) {
      hasCooked = true;
      if (word !== 'cooked' && !cookedSpecific) {
        cookedSpecific = word;
      }
    } else if (RAW_PREP_TOKENS.has(word)) {
      hasRaw = true;
    }
  }

  if (hasDried) return { group: 'dried', specific: 'dried' };
  if (hasCooked && !hasRaw) return { group: 'cooked', specific: cookedSpecific };
  if (hasRaw && !hasCooked) return { group: 'raw', specific: 'raw' };
  if (hasCooked && hasRaw) return { group: 'cooked', specific: cookedSpecific };
  return { group: 'unspecified', specific: null };
}

function arePrepStatesCompatible(a: PrepState, b: PrepState): boolean {
  if (a.group === b.group) {
    if (
      a.group === 'cooked' &&
      a.specific &&
      b.specific &&
      a.specific !== b.specific
    ) {
      return false;
    }
    return true;
  }
  if (a.group === 'unspecified' || b.group === 'unspecified') {
    if (a.group === 'dried' || b.group === 'dried') {
      return false;
    }
    return true;
  }
  return false;
}

function extractFoodGroups(category?: string): Set<string> {
  const groups = new Set<string>();
  if (!category || !category.trim()) return groups;
  for (const entry of FOOD_GROUP_PATTERNS) {
    if (entry.pattern.test(category)) {
      groups.add(entry.group);
    }
  }
  return groups;
}

function areFoodGroupSetsCompatible(groupsA: Set<string>, groupsB: Set<string>): boolean {
  if (groupsA.size === 0 || groupsB.size === 0) return true;
  for (const g of groupsA) {
    if (groupsB.has(g)) return true;
  }
  return false;
}

function areFoodGroupsCompatible(catA?: string, catB?: string): boolean {
  return areFoodGroupSetsCompatible(extractFoodGroups(catA), extractFoodGroups(catB));
}

function extractCoreTokens(name: string, brand?: string): Set<string> {
  const canonical = buildCanonicalFoodKey(name, brand);
  const allTokens = canonical.split(' ').filter(Boolean);
  const filtered = allTokens.filter((token) => !PASS_C_NOISE_TOKENS.has(token));
  return new Set(filtered.length > 0 ? filtered : allTokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const token of smaller) {
    if (larger.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function toComparableMacros(
  item: Pick<FoodItem, 'basis' | 'servingWeightGrams' | 'nutrientsPerBasis'>
): { kind: 'per100' | 'perServing'; macros: MacroNutrients } {
  const m = item.nutrientsPerBasis;
  if (item.basis === 'per100g' || item.basis === 'per100ml') {
    return { kind: 'per100', macros: m };
  }
  if (
    typeof item.servingWeightGrams === 'number' &&
    Number.isFinite(item.servingWeightGrams) &&
    item.servingWeightGrams > 0
  ) {
    const scale = 100 / item.servingWeightGrams;
    return {
      kind: 'per100',
      macros: {
        calories: m.calories * scale,
        protein: m.protein * scale,
        carbs: m.carbs * scale,
        fat: m.fat * scale,
        fiber: m.fiber * scale,
      },
    };
  }
  return { kind: 'perServing', macros: m };
}

function withinTolerance(a: number, b: number, absTol: number, pctTol: number): boolean {
  const diff = Math.abs(a - b);
  const base = Math.max(Math.abs(a), Math.abs(b));
  const limit = Math.max(absTol, base * pctTol);
  return diff <= limit;
}

function areMacrosSimilar(
  a: Pick<FoodItem, 'basis' | 'servingWeightGrams' | 'nutrientsPerBasis'>,
  b: Pick<FoodItem, 'basis' | 'servingWeightGrams' | 'nutrientsPerBasis'>
): boolean {
  const compA = toComparableMacros(a);
  const compB = toComparableMacros(b);
  if (compA.kind !== compB.kind) return false;

  return (
    withinTolerance(compA.macros.calories, compB.macros.calories, 20, 0.12) &&
    withinTolerance(compA.macros.protein, compB.macros.protein, 3, 0.2) &&
    withinTolerance(compA.macros.carbs, compB.macros.carbs, 3, 0.2) &&
    withinTolerance(compA.macros.fat, compB.macros.fat, 3, 0.2)
  );
}

function countMicronutrients(item: Pick<FoodItem, 'micronutrientsPerBasis'>): number {
  const micros = item.micronutrientsPerBasis;
  if (!micros || typeof micros !== 'object') return 0;
  let count = 0;
  for (const val of Object.values(micros)) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      count++;
    }
  }
  return count;
}

function isValidServingOption(opt: FoodServingOption | undefined | null): opt is FoodServingOption {
  return Boolean(
    opt &&
      typeof opt.id === 'string' &&
      opt.id.trim().length > 0 &&
      typeof opt.unit === 'string' &&
      opt.unit.trim().length > 0 &&
      typeof opt.grams === 'number' &&
      Number.isFinite(opt.grams) &&
      opt.grams > 0
  );
}

function countValidServingOptions(item: Pick<FoodItem, 'servingOptions'>): number {
  if (!Array.isArray(item.servingOptions)) return 0;
  let count = 0;
  for (const opt of item.servingOptions) {
    if (isValidServingOption(opt)) count++;
  }
  return count;
}

function compareCandidatePriority(
  a: Pick<FoodItem, 'id' | 'source' | 'accuracyTier' | 'micronutrientsPerBasis' | 'servingOptions' | 'name'>,
  b: Pick<FoodItem, 'id' | 'source' | 'accuracyTier' | 'micronutrientsPerBasis' | 'servingOptions' | 'name'>,
  preferredCanonicalId?: string
): number {
  const tierDiff = getAccuracyTier(a) - getAccuracyTier(b);
  if (tierDiff !== 0) return tierDiff;

  const microDiff = countMicronutrients(b) - countMicronutrients(a);
  if (microDiff !== 0) return microDiff;

  const servingDiff = countValidServingOptions(b) - countValidServingOptions(a);
  if (servingDiff !== 0) return servingDiff;

  if (preferredCanonicalId) {
    const aIsCanon = a.id === preferredCanonicalId ? 0 : 1;
    const bIsCanon = b.id === preferredCanonicalId ? 0 : 1;
    if (aIsCanon !== bIsCanon) return aIsCanon - bIsCanon;
  }

  const nameLenDiff = (a.name || '').trim().length - (b.name || '').trim().length;
  if (nameLenDiff !== 0) return nameLenDiff;

  return 0;
}

function getMetricImperialBucket(unit: string): 'household' | 'metric' | 'imperial' {
  const lower = unit.trim().toLowerCase();
  if (lower === 'g' || lower === 'ml') return 'metric';
  if (lower === 'oz' || lower === 'fl oz') return 'imperial';
  return 'household';
}

function mergeServingOptions(
  winnerOptions?: FoodServingOption[],
  ...loserOptionsLists: Array<FoodServingOption[] | undefined>
): FoodServingOption[] | undefined {
  const household: FoodServingOption[] = [];
  const metric: FoodServingOption[] = [];
  const imperial: FoodServingOption[] = [];
  const seenIds = new Set<string>();
  const seenUnits = new Set<string>();

  const addOptions = (list?: FoodServingOption[]) => {
    if (!Array.isArray(list)) return;
    for (const opt of list) {
      if (!isValidServingOption(opt)) continue;
      const idKey = opt.id.trim().toLowerCase();
      const unitKey = opt.unit.trim().toLowerCase();
      if (seenIds.has(idKey) || seenUnits.has(unitKey)) continue;
      seenIds.add(idKey);
      seenUnits.add(unitKey);

      const copy = { ...opt };
      const bucket = getMetricImperialBucket(opt.unit);
      if (bucket === 'metric') {
        metric.push(copy);
      } else if (bucket === 'imperial') {
        imperial.push(copy);
      } else {
        household.push(copy);
      }
    }
  };

  addOptions(winnerOptions);
  for (const list of loserOptionsLists) {
    addOptions(list);
  }

  const merged = [...household, ...metric, ...imperial];
  return merged.length > 0 ? merged : undefined;
}

function mergeAliases(
  winnerName: string,
  winnerAliases: string[] | undefined,
  losers: Array<Pick<FoodItem, 'name' | 'aliases'>>
): string[] | undefined {
  const result: string[] = [];
  const seen = new Set<string>();
  const winnerNameLower = (winnerName || '').trim().toLowerCase();

  const pushAlias = (candidate?: string) => {
    const trimmed = (candidate || '').trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === winnerNameLower || seen.has(lower)) return;
    seen.add(lower);
    result.push(trimmed);
  };

  if (Array.isArray(winnerAliases)) {
    for (const alias of winnerAliases) {
      pushAlias(alias);
    }
  }

  for (const loser of losers) {
    pushAlias(loser.name);
    if (Array.isArray(loser.aliases)) {
      for (const alias of loser.aliases) {
        pushAlias(alias);
      }
    }
  }

  return result.length > 0 ? result : undefined;
}

interface CompileCluster {
  firstIndex: number;
  members: Array<{ item: CatalogFoodInput; index: number }>;
  rep: CatalogFoodInput;
  barcode: string | null;
  canonicalKey: string;
  brand: string;
  prepState: PrepState;
  foodGroups: Set<string>;
  coreTokens: Set<string>;
}

function pickBestMember(
  members: Array<{ item: CatalogFoodInput; index: number }>
): { item: CatalogFoodInput; index: number } {
  let best = members[0];
  for (let i = 1; i < members.length; i++) {
    const cmp = compareCandidatePriority(members[i].item, best.item);
    if (cmp < 0 || (cmp === 0 && members[i].index < best.index)) {
      best = members[i];
    }
  }
  return best;
}

function createCompileCluster(item: CatalogFoodInput, index: number): CompileCluster {
  return {
    firstIndex: index,
    members: [{ item, index }],
    rep: item,
    barcode: normalizeBarcode(item.barcode),
    canonicalKey: buildCanonicalFoodKey(item.name, item.brand),
    brand: normalizeBrand(item.brand),
    prepState: extractPrepState(item.name),
    foodGroups: extractFoodGroups(item.category),
    coreTokens: extractCoreTokens(item.name, item.brand),
  };
}

function mergeCompileClusters(target: CompileCluster, source: CompileCluster): void {
  target.firstIndex = Math.min(target.firstIndex, source.firstIndex);
  for (const m of source.members) {
    target.members.push(m);
  }
  const best = pickBestMember(target.members);
  target.rep = best.item;
  if (!target.barcode && source.barcode) {
    target.barcode = source.barcode;
  }
  target.canonicalKey = buildCanonicalFoodKey(target.rep.name, target.rep.brand);
  target.brand = normalizeBrand(target.rep.brand);
  target.prepState = extractPrepState(target.rep.name);
  target.foodGroups = extractFoodGroups(target.rep.category);
  target.coreTokens = extractCoreTokens(target.rep.name, target.rep.brand);
}

function canMergeCompileClusters(a: CompileCluster, b: CompileCluster): boolean {
  const aCustom = isCustomFood(a.rep);
  const bCustom = isCustomFood(b.rep);
  if (aCustom !== bCustom && a.brand !== b.brand) {
    return false;
  }
  if (aCustom && bCustom && a.rep.id !== b.rep.id) {
    return false;
  }
  return true;
}

/**
 * Compile-time cross-source deduplication & accuracy merger:
 * - Pass A: Exact normalized barcode match (UPC-A 12-digit -> EAN-13 13-digit).
 * - Pass B: Exact buildCanonicalFoodKey(name, brand) match (preserving raw vs cooked prep state).
 * - Pass C: Token-set Jaccard (>= 0.75) + macro-profile similarity for unbranded/same-brand items
 *   within compatible food group & prep state.
 */
export function deduplicateCatalogRecords(inputs: CatalogFoodInput[]): DedupeCompileResult {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return { foods: [], legacyAliases: new Map() };
  }

  // Pass A: Exact ID or normalized barcode match
  const passAClusters: CompileCluster[] = [];
  const byId = new Map<string, CompileCluster>();
  const byBarcode = new Map<string, CompileCluster[]>();

  for (let i = 0; i < inputs.length; i++) {
    const cluster = createCompileCluster(inputs[i], i);
    const idMatch = byId.get(cluster.rep.id);
    if (idMatch) {
      mergeCompileClusters(idMatch, cluster);
      if (idMatch.barcode) {
        const list = byBarcode.get(idMatch.barcode);
        if (!list) {
          byBarcode.set(idMatch.barcode, [idMatch]);
        } else if (!list.includes(idMatch)) {
          list.push(idMatch);
        }
      }
      continue;
    }

    if (cluster.barcode) {
      const existingList = byBarcode.get(cluster.barcode);
      const match = existingList?.find((c) => canMergeCompileClusters(c, cluster));
      if (match) {
        mergeCompileClusters(match, cluster);
        byId.set(cluster.rep.id, match);
        continue;
      }
      if (existingList) {
        existingList.push(cluster);
      } else {
        byBarcode.set(cluster.barcode, [cluster]);
      }
    }
    byId.set(cluster.rep.id, cluster);
    passAClusters.push(cluster);
  }

  // Pass B: Exact buildCanonicalFoodKey(name, brand) + prep state group
  const passBClusters: CompileCluster[] = [];
  const byCanonicalKey = new Map<string, CompileCluster[]>();

  for (const cluster of passAClusters) {
    if (cluster.canonicalKey) {
      const key = `${cluster.canonicalKey}\0${cluster.prepState.group}`;
      const existingList = byCanonicalKey.get(key);
      const match = existingList?.find(
        (c) =>
          canMergeCompileClusters(c, cluster) &&
          arePrepStatesCompatible(c.prepState, cluster.prepState)
      );
      if (match) {
        mergeCompileClusters(match, cluster);
        continue;
      }
      if (existingList) {
        existingList.push(cluster);
      } else {
        byCanonicalKey.set(key, [cluster]);
      }
    }
    passBClusters.push(cluster);
  }

  // Pass C: Token-set Jaccard (>= 0.75) + macro-profile similarity
  const passCClusters: CompileCluster[] = [];
  const tokenBuckets = new Map<string, number[]>();

  const indexClusterTokens = (clusterIdx: number, cluster: CompileCluster) => {
    for (const token of cluster.coreTokens) {
      const bucketKey = `${cluster.brand}\0${token}`;
      const bucket = tokenBuckets.get(bucketKey);
      if (bucket) {
        if (bucket[bucket.length - 1] !== clusterIdx) {
          bucket.push(clusterIdx);
        }
      } else {
        tokenBuckets.set(bucketKey, [clusterIdx]);
      }
    }
  };

  for (const cluster of passBClusters) {
    const tokenCount = cluster.coreTokens.size;
    // Exact prefix filter for Jaccard >= 0.75: at most floor(0.25 * |A|) tokens of A
    // can be absent from any matching B, so checking the (floor(0.25 * |A|) + 1)
    // smallest buckets guarantees 100% recall while avoiding giant stop-token buckets.
    const prefixLen = Math.floor(0.25 * tokenCount) + 1;
    const tokenBucketList: Array<number[] | undefined> = [];
    for (const token of cluster.coreTokens) {
      tokenBucketList.push(tokenBuckets.get(`${cluster.brand}\0${token}`));
    }
    if (tokenBucketList.length > prefixLen) {
      tokenBucketList.sort((a, b) => (a ? a.length : 0) - (b ? b.length : 0));
    }

    const candidateIndices = new Set<number>();
    const limit = Math.min(prefixLen, tokenBucketList.length);
    for (let t = 0; t < limit; t++) {
      const bucket = tokenBucketList[t];
      if (!bucket) continue;
      for (let b = 0; b < bucket.length; b++) {
        candidateIndices.add(bucket[b]);
      }
    }

    let matchedIdx = -1;
    for (const idx of candidateIndices) {
      const target = passCClusters[idx];
      const minSize = Math.min(target.coreTokens.size, tokenCount);
      const maxSize = Math.max(target.coreTokens.size, tokenCount);
      if (maxSize === 0 || minSize / maxSize < 0.75) continue;
      if (target.brand !== cluster.brand) continue;
      if (!canMergeCompileClusters(target, cluster)) continue;
      if (!arePrepStatesCompatible(target.prepState, cluster.prepState)) continue;
      if (!areFoodGroupSetsCompatible(target.foodGroups, cluster.foodGroups)) continue;

      if (jaccardSimilarity(target.coreTokens, cluster.coreTokens) < 0.75) continue;
      if (!areMacrosSimilar(target.rep, cluster.rep)) continue;

      matchedIdx = idx;
      break;
    }

    if (matchedIdx !== -1) {
      const target = passCClusters[matchedIdx];
      mergeCompileClusters(target, cluster);
      indexClusterTokens(matchedIdx, target);
    } else {
      const newIdx = passCClusters.length;
      passCClusters.push(cluster);
      indexClusterTokens(newIdx, cluster);
    }
  }

  // Sort final clusters by earliest original input index for deterministic output
  passCClusters.sort((a, b) => a.firstIndex - b.firstIndex);

  const foods: CatalogFoodInput[] = [];
  const legacyAliases = new Map<string, string>();

  for (const cluster of passCClusters) {
    const sortedMembers = [...cluster.members].sort((a, b) => {
      const cmp = compareCandidatePriority(a.item, b.item);
      return cmp !== 0 ? cmp : a.index - b.index;
    });

    const winner = sortedMembers[0].item;
    const losers = sortedMembers.slice(1).map((m) => m.item);

    const mergedServingOptions = mergeServingOptions(
      winner.servingOptions,
      ...losers.map((l) => l.servingOptions)
    );
    const mergedAliases = mergeAliases(winner.name, winner.aliases, losers);

    const legacyIdSet = new Set<string>();
    const addLegacyId = (id?: string) => {
      const trimmed = (id || '').trim();
      if (!trimmed || trimmed === winner.id) return;
      legacyIdSet.add(trimmed);
      legacyAliases.set(trimmed, winner.id);
    };

    if (Array.isArray(winner.legacyIds)) {
      for (const lid of winner.legacyIds) addLegacyId(lid);
    }
    for (const loser of losers) {
      addLegacyId(loser.id);
      if (Array.isArray(loser.legacyIds)) {
        for (const lid of loser.legacyIds) addLegacyId(lid);
      }
    }

    const mergedBarcode = winner.barcode ?? cluster.barcode ?? null;
    const mergedLegacyIds = legacyIdSet.size > 0 ? Array.from(legacyIdSet) : undefined;

    const mergedFood: CatalogFoodInput = {
      ...winner,
      barcode: mergedBarcode,
      ...(mergedServingOptions ? { servingOptions: mergedServingOptions } : {}),
      ...(mergedAliases ? { aliases: mergedAliases } : {}),
      ...(mergedLegacyIds ? { legacyIds: mergedLegacyIds } : {}),
    };

    foods.push(mergedFood);
  }

  return { foods, legacyAliases };
}

interface SearchSlot {
  item: FoodItem;
  canonicalId: string;
  barcode: string | null;
  canonicalKey: string;
  brand: string;
  prepState: PrepState;
  coreKey: string;
  tier: 1 | 2 | 3 | 4;
  isCustom: boolean;
}

function buildCoreKey(name: string, brand?: string): string {
  const tokens = Array.from(extractCoreTokens(name, brand));
  tokens.sort();
  return tokens.join(' ');
}

function pushSlotIndex(map: Map<string, number[]>, key: string, idx: number): void {
  if (!key) return;
  const list = map.get(key);
  if (list) {
    if (!list.includes(idx)) list.push(idx);
  } else {
    map.set(key, [idx]);
  }
}

function canCollapseSearchItems(
  existing: SearchSlot,
  incoming: SearchSlot,
  matchKind: 'id' | 'barcode' | 'canonicalKey' | 'unbrandedCore'
): boolean {
  // Exact same ID always collapses
  if (existing.item.id === incoming.item.id) {
    return true;
  }

  // Custom food protection: never drop custom_food/custom_barcode when colliding with a different brand
  if (existing.isCustom !== incoming.isCustom && existing.brand !== incoming.brand) {
    return false;
  }
  if (existing.isCustom && incoming.isCustom) {
    return false;
  }

  if (matchKind === 'id' || matchKind === 'barcode') {
    return true;
  }

  if (!arePrepStatesCompatible(existing.prepState, incoming.prepState)) {
    return false;
  }

  if (matchKind === 'canonicalKey') {
    return true;
  }

  // unbrandedCore: unbranded live crowdsourced item colliding with Tier 1/2 compiled whole food
  if (existing.brand !== '' || incoming.brand !== '') {
    return false;
  }
  const hasTier12 = existing.tier <= 2 || incoming.tier <= 2;
  const hasCrowdsourced = existing.tier >= 3 || incoming.tier >= 3;
  if (!hasTier12 || !hasCrowdsourced) {
    return false;
  }
  return areMacrosSimilar(existing.item, incoming.item);
}

function mergeSearchWinner(
  winner: FoodItem,
  loser: FoodItem
): FoodItem {
  const mergedServingOptions = mergeServingOptions(winner.servingOptions, loser.servingOptions);
  const mergedAliases = mergeAliases(winner.name, winner.aliases, [loser]);

  return {
    ...winner,
    barcode: winner.barcode ?? loser.barcode ?? null,
    ...(mergedServingOptions ? { servingOptions: mergedServingOptions } : {}),
    ...(mergedAliases ? { aliases: mergedAliases } : {}),
  };
}

/**
 * Fast runtime deduplicator for search results (merging custom foods, local catalog,
 * foodsCache, and live API results).
 * Preserves input ranking order of surviving winners and protects custom_food/custom_barcode items.
 */
export function deduplicateSearchResults(
  items: FoodItem[],
  aliasMap?: Map<string, string>
): FoodItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const slots: SearchSlot[] = [];
  const byCanonicalId = new Map<string, number[]>();
  const byBarcode = new Map<string, number[]>();
  const byCanonicalKey = new Map<string, number[]>();
  const byUnbrandedCore = new Map<string, number[]>();

  const registerSlot = (idx: number, slot: SearchSlot) => {
    pushSlotIndex(byCanonicalId, slot.canonicalId, idx);
    if (slot.barcode) pushSlotIndex(byBarcode, slot.barcode, idx);
    if (slot.canonicalKey) pushSlotIndex(byCanonicalKey, slot.canonicalKey, idx);
    if (slot.brand === '' && slot.coreKey) {
      pushSlotIndex(byUnbrandedCore, slot.coreKey, idx);
    }
  };

  for (const item of items) {
    const incoming: SearchSlot = {
      item,
      canonicalId: aliasMap?.get(item.id) ?? item.id,
      barcode: normalizeBarcode(item.barcode),
      canonicalKey: buildCanonicalFoodKey(item.name, item.brand),
      brand: normalizeBrand(item.brand),
      prepState: extractPrepState(item.name),
      coreKey: buildCoreKey(item.name, item.brand),
      tier: getAccuracyTier(item),
      isCustom: isCustomFood(item),
    };

    let matchedIdx = -1;

    const findMatch = (
      candidates: number[] | undefined,
      kind: 'id' | 'barcode' | 'canonicalKey' | 'unbrandedCore'
    ): number => {
      if (!candidates) return -1;
      for (const idx of candidates) {
        if (canCollapseSearchItems(slots[idx], incoming, kind)) {
          return idx;
        }
      }
      return -1;
    };

    // 1. Resolved canonical ID
    matchedIdx = findMatch(byCanonicalId.get(incoming.canonicalId), 'id');

    // 2. Normalized barcode
    if (matchedIdx === -1 && incoming.barcode) {
      matchedIdx = findMatch(byBarcode.get(incoming.barcode), 'barcode');
    }

    // 3. Canonical food key
    if (matchedIdx === -1 && incoming.canonicalKey) {
      matchedIdx = findMatch(byCanonicalKey.get(incoming.canonicalKey), 'canonicalKey');
    }

    // 4. Unbranded live crowdsourced vs Tier 1/2 compiled whole food
    if (matchedIdx === -1 && incoming.brand === '' && incoming.coreKey) {
      matchedIdx = findMatch(byUnbrandedCore.get(incoming.coreKey), 'unbrandedCore');
    }

    if (matchedIdx !== -1) {
      const existing = slots[matchedIdx];
      let incomingWins = false;

      if (existing.isCustom && !incoming.isCustom) {
        incomingWins = false;
      } else if (!existing.isCustom && incoming.isCustom) {
        incomingWins = true;
      } else {
        const cmp = compareCandidatePriority(
          incoming.item,
          existing.item,
          existing.canonicalId
        );
        incomingWins = cmp < 0;
      }

      const winnerSlot = incomingWins ? incoming : existing;
      const loserSlot = incomingWins ? existing : incoming;
      const mergedItem = mergeSearchWinner(winnerSlot.item, loserSlot.item);

      const updatedSlot: SearchSlot = {
        ...winnerSlot,
        item: mergedItem,
        barcode: winnerSlot.barcode ?? loserSlot.barcode,
      };

      slots[matchedIdx] = updatedSlot;
      registerSlot(matchedIdx, updatedSlot);
      // Also bind the dropped loser's keys to matchedIdx for transitive 3-way dedup
      if (loserSlot.canonicalId && loserSlot.canonicalId !== updatedSlot.canonicalId) {
        pushSlotIndex(byCanonicalId, loserSlot.canonicalId, matchedIdx);
      }
      if (loserSlot.barcode && loserSlot.barcode !== updatedSlot.barcode) {
        pushSlotIndex(byBarcode, loserSlot.barcode, matchedIdx);
      }
    } else {
      const newIdx = slots.length;
      slots.push(incoming);
      registerSlot(newIdx, incoming);
    }
  }

  return slots.map((slot) => slot.item);
}
