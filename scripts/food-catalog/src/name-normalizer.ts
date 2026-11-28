const UPPERCASE_ACRONYMS = new Set([
  'BBQ',
  'UHT',
  'USDA',
  'MSG',
  'DHA',
  'EPA',
  'MCT',
  'IPA',
  'BLT',
  'PBJ',
]);

const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

const NOISE_SEGMENTS = new Set([
  'broilers or fryers',
  'broiler or fryer',
  'meat only',
  'separable lean only',
  'separable lean and fat',
  'all grades',
  'all varieties',
  'salad or cooking',
  'commercial',
  'regular',
  'fresh',
  'fluid',
  'nf',
  'ns as to fat',
]);

const STATE_QUALIFIERS = new Set([
  'raw',
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
  'dried',
  'dehydrated',
  'canned',
  'frozen',
  'uncooked',
  'dry',
]);

const CUT_OR_PART_NOUNS = new Set([
  'breast',
  'thigh',
  'wing',
  'drumstick',
  'leg',
  'tenderloin',
  'sirloin',
  'ribeye',
  'chuck',
  'brisket',
  'loin',
  'chop',
  'belly',
  'shoulder',
  'shank',
  'fillet',
  'steak',
  'roast',
  'liver',
  'heart',
  'gizzard',
  'yolk',
]);

const PREFIX_ADJECTIVES = new Set([
  'whole',
  'white',
  'brown',
  'black',
  'red',
  'green',
  'yellow',
  'sweet',
  'sour',
  'wild',
  'atlantic',
  'pacific',
  'ground',
  'lean',
  'extra-lean',
  'skim',
  'nonfat',
  'low-fat',
  'lowfat',
  'reduced-fat',
  'full-fat',
  'greek',
  'plain',
  'unsweetened',
  'sweetened',
  'rolled',
  'steel-cut',
  'instant',
  'quick',
  'jasmine',
  'basmati',
  'arborio',
  'glutinous',
  'sticky',
  'dark',
  'extra virgin',
  'virgin',
  'olive',
  'coconut',
  'canola',
  'sunflower',
  'sesame',
  'soybean',
  'peanut',
  'almond',
  'oat',
  'soy',
  'evaporated',
  'condensed',
  'cheddar',
  'mozzarella',
  'parmesan',
  'swiss',
  'cottage',
  'ricotta',
  'cream',
  'whole-wheat',
  'whole-grain',
  'russet',
  'baby',
  'cherry',
]);

const PLURAL_EXCEPTIONS = new Set([
  'hummus',
  'couscous',
  'asparagus',
  'citrus',
  'molasses',
  'swiss',
  'glass',
  'grass',
  'bass',
  'pass',
  'rice',
  'juice',
  'cheese',
  'sauce',
  'oats',
]);

function titleCaseSegment(segment: string): string {
  const words = segment.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (UPPERCASE_ACRONYMS.has(upper)) return upper;

      const lower = word.toLowerCase();
      if (index > 0 && MINOR_WORDS.has(lower)) return lower;

      return lower
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join('-');
    })
    .join(' ');
}

function isAllCapsOrAllLower(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (!letters) return false;
  return letters === letters.toUpperCase() || letters === letters.toLowerCase();
}

/**
 * Rewrites inverted USDA/national-table comma names into clean human-readable display names,
 * while preserving already-clean brand/product names.
 */
export function cleanFoodDisplayName(rawName: string, brand?: string): string {
  void brand;
  const trimmed = (rawName || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  if (!trimmed.includes(',')) {
    return isAllCapsOrAllLower(trimmed) ? titleCaseSegment(trimmed) : trimmed;
  }

  const rawSegments = trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSegments.length <= 1) {
    return isAllCapsOrAllLower(trimmed) ? titleCaseSegment(trimmed) : trimmed;
  }

  const headRaw = rawSegments[0];
  const headLower = headRaw.toLowerCase();

  let prefixAdj: string | null = null;
  const cutNouns: string[] = [];
  const secondary: string[] = [];
  const states: string[] = [];
  const seenStates = new Set<string>();

  for (let i = 1; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    const segLower = seg.toLowerCase();

    if (NOISE_SEGMENTS.has(segLower)) {
      continue;
    }

    if (STATE_QUALIFIERS.has(segLower)) {
      if (!seenStates.has(segLower)) {
        seenStates.add(segLower);
        states.push(segLower);
      }
      continue;
    }

    // Special case: "Egg, white, raw" -> "Egg White (Raw)", not "White Egg"
    if ((headLower === 'egg' || headLower === 'eggs') && segLower === 'white') {
      cutNouns.push(segLower);
      continue;
    }

    if (CUT_OR_PART_NOUNS.has(segLower)) {
      cutNouns.push(segLower);
      continue;
    }

    if (!prefixAdj && PREFIX_ADJECTIVES.has(segLower)) {
      prefixAdj = segLower;
      continue;
    }

    secondary.push(seg);
  }

  const headParts: string[] = [];
  if (prefixAdj) headParts.push(titleCaseSegment(prefixAdj));
  headParts.push(titleCaseSegment(headRaw));
  for (const cut of cutNouns) {
    headParts.push(titleCaseSegment(cut));
  }

  let result = headParts.join(' ');
  if (secondary.length > 0) {
    result += `, ${secondary.map((s) => titleCaseSegment(s)).join(', ')}`;
  }
  if (states.length > 0) {
    result += ` (${states.map((s) => titleCaseSegment(s)).join(', ')})`;
  }

  return result;
}

function singularizeToken(token: string): string {
  if (token.length <= 3 || PLURAL_EXCEPTIONS.has(token)) {
    return token;
  }
  if (token.endsWith('ss') || token.endsWith('us') || token.endsWith('is')) {
    return token;
  }
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith('oes') && token.length > 4) {
    return token.slice(0, -2);
  }
  if (/^(hal|loa|lea|cal|kni|shel|shea)ves$/.test(token)) {
    return `${token.slice(0, -3)}f`;
  }
  if (/(ches|shes|xes|zes)$/.test(token) && token.length > 4) {
    return token.slice(0, -2);
  }
  if (token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenizeNormalized(input: string): string[] {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeToken);
}

/**
 * Deterministic normalized key (lowercase, punctuation stripped, plural-normalized,
 * brand-deduped) for cross-source deduplication.
 */
export function buildCanonicalFoodKey(name: string, brand?: string): string {
  const nameTokens = tokenizeNormalized(name || '');
  const brandTokens = brand ? tokenizeNormalized(brand) : [];

  if (brandTokens.length === 0) {
    return nameTokens.join(' ');
  }

  const nameJoined = ` ${nameTokens.join(' ')} `;
  const brandJoined = ` ${brandTokens.join(' ')} `;
  if (nameJoined.includes(brandJoined)) {
    return nameTokens.join(' ');
  }

  return [...brandTokens, ...nameTokens].join(' ');
}

interface AliasRule {
  pattern: RegExp;
  exclude?: RegExp;
  aliases: string[];
}

const MULTILINGUAL_ALIAS_RULES: AliasRule[] = [
  {
    pattern: /\brice\b.*\b(short[- ]grain|japanese|sushi)\b|\b(short[- ]grain|japanese|sushi)\b.*\brice\b/i,
    aliases: ['japanese rice', 'sushi rice', 'gohan', 'kanin', 'bap', 'steamed rice'],
  },
  {
    pattern: /\bwhite\b.*\brice\b|\brice\b.*\bwhite\b/i,
    aliases: ['white rice', 'kanin', 'gohan', 'bap', 'steamed rice'],
  },
  {
    pattern: /\bbrown\b.*\brice\b|\brice\b.*\bbrown\b/i,
    aliases: ['brown rice', 'genmai', 'hyeonmi'],
  },
  {
    pattern: /\bjasmine\b.*\brice\b|\brice\b.*\bjasmine\b/i,
    aliases: ['jasmine rice', 'thai rice', 'kanin'],
  },
  {
    pattern: /\b(glutinous|sticky)\b.*\brice\b|\brice\b.*\b(glutinous|sticky)\b/i,
    aliases: ['sticky rice', 'malagkit', 'mochi rice'],
  },
  {
    pattern: /\begg(s)?\b/i,
    aliases: ['itlog', 'tamago', 'gyeran', 'huevo'],
  },
  {
    pattern: /\bchicken\b/i,
    aliases: ['manok', 'tori', 'dak', 'pollo'],
  },
  {
    pattern: /\bpork\b/i,
    aliases: ['baboy', 'buta', 'dwaeji', 'cerdo'],
  },
  {
    pattern: /\bbeef\b/i,
    aliases: ['baka', 'gyuniku', 'sogogi', 'res'],
  },
  {
    pattern: /\bsalmon\b/i,
    aliases: ['sake', 'yeoneo'],
  },
  {
    pattern: /\btuna\b/i,
    aliases: ['maguro', 'chamchi'],
  },
  {
    pattern: /\bfish\b/i,
    aliases: ['isda', 'sakana'],
  },
  {
    pattern: /\b(shrimp|prawn)(s)?\b/i,
    aliases: ['hipon', 'ebi', 'saeu'],
  },
  {
    pattern: /\bmilk\b/i,
    aliases: ['gatas', 'gyunyu', 'uyu', 'leche'],
  },
  {
    pattern: /\bbread\b/i,
    aliases: ['tinapay', 'pan', 'ppang'],
  },
  {
    pattern: /\b(noodle|noodles|ramen)\b/i,
    aliases: ['pancit', 'ramen', 'ramyeon', 'men', 'bihon', 'mami'],
  },
  {
    pattern: /\btofu\b/i,
    aliases: ['tokwa', 'dubu', 'bean curd'],
  },
  {
    pattern: /\bbanana(s)?\b/i,
    aliases: ['saging', 'platano'],
  },
  {
    pattern: /\bmango(es)?\b/i,
    aliases: ['mangga'],
  },
  {
    pattern: /\bapple(s)?\b/i,
    aliases: ['mansanas', 'ringo', 'sagwa'],
  },
  {
    pattern: /\bsweet potato(es)?\b/i,
    aliases: ['kamote', 'camote', 'satsumaimo', 'goguma'],
  },
  {
    pattern: /\bpotato(es)?\b/i,
    exclude: /\bsweet potato(es)?\b/i,
    aliases: ['patatas', 'jagaimo', 'gamja'],
  },
  {
    pattern: /\bgarlic\b/i,
    aliases: ['bawang', 'ninniku', 'maneul'],
  },
  {
    pattern: /\bonion(s)?\b/i,
    aliases: ['sibuyas', 'tamanegi', 'yangpa'],
  },
  {
    pattern: /\btomato(es)?\b/i,
    aliases: ['kamatis'],
  },
  {
    pattern: /\bcoffee\b/i,
    aliases: ['kape', 'kohi', 'keopi', 'cafe'],
  },
  {
    pattern: /\btea\b/i,
    aliases: ['tsaa', 'ocha', 'cha'],
  },
  {
    pattern: /\bsugar\b/i,
    aliases: ['asukal', 'sato', 'seoltang'],
  },
  {
    pattern: /\bsalt\b/i,
    aliases: ['asin', 'shio', 'sogeum'],
  },
  {
    pattern: /\bsoy sauce\b/i,
    aliases: ['toyo', 'shoyu', 'ganjang'],
  },
  {
    pattern: /\bvinegar\b/i,
    aliases: ['suka', 'su', 'sikcho'],
  },
  {
    pattern: /\boil\b/i,
    aliases: ['mantika', 'abura', 'gireum'],
  },
  {
    pattern: /\bcheese\b/i,
    aliases: ['keso', 'queso', 'chizu'],
  },
  {
    pattern: /\bbutter\b/i,
    exclude: /\bpeanut butter\b|\balmond butter\b/i,
    aliases: ['mantekilya', 'mantequilla', 'bata'],
  },
  {
    pattern: /\boat(s|meal)?\b/i,
    aliases: ['oatmeal', 'rolled oats'],
  },
];

/**
 * Generates deduplicated search aliases preserving rawName (when different from cleanName),
 * existing aliases, and multilingual/regional synonyms.
 */
export function generateFoodAliases(
  rawName: string,
  cleanName: string,
  existingAliases?: string[]
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  const cleanLower = (cleanName || '').trim().toLowerCase();

  const addAlias = (candidate: string | undefined) => {
    const trimmed = (candidate || '').trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === cleanLower || seen.has(lower)) return;
    seen.add(lower);
    result.push(trimmed);
  };

  if (rawName && rawName.trim().toLowerCase() !== cleanLower) {
    addAlias(rawName);
  }

  if (Array.isArray(existingAliases)) {
    for (const alias of existingAliases) {
      addAlias(alias);
    }
  }

  const combined = `${rawName || ''} ${cleanName || ''}`.trim();
  for (const rule of MULTILINGUAL_ALIAS_RULES) {
    if (rule.pattern.test(combined) && (!rule.exclude || !rule.exclude.test(combined))) {
      for (const alias of rule.aliases) {
        addAlias(alias);
      }
    }
  }

  return result;
}
