use std::collections::{HashMap, HashSet};
use unicode_normalization::UnicodeNormalization;

use crate::schema::FoodRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComparableKind {
    Per100,
    PerServing,
}

#[derive(Debug, Clone, Copy)]
pub struct ComparableMacros {
    pub kind: ComparableKind,
    pub calories: f64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub fiber: f64,
}

pub fn to_comparable_macros(row: &FoodRow) -> ComparableMacros {
    if row.basis == "per100g" || row.basis == "per100ml" {
        return ComparableMacros {
            kind: ComparableKind::Per100,
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs,
            fat: row.fat,
            fiber: row.fiber,
        };
    }
    if let Some(grams) = row.serving_weight_grams {
        if grams.is_finite() && grams > 0.0 {
            let scale = 100.0 / grams;
            return ComparableMacros {
                kind: ComparableKind::Per100,
                calories: row.calories * scale,
                protein: row.protein * scale,
                carbs: row.carbs * scale,
                fat: row.fat * scale,
                fiber: row.fiber * scale,
            };
        }
    }
    ComparableMacros {
        kind: ComparableKind::PerServing,
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        fiber: row.fiber,
    }
}

fn within_tolerance(a: f64, b: f64, abs_tol: f64, pct_tol: f64) -> bool {
    let diff = (a - b).abs();
    let base = a.abs().max(b.abs());
    let limit = abs_tol.max(base * pct_tol);
    diff <= limit
}

pub fn are_macros_similar(a: ComparableMacros, b: ComparableMacros, tight: bool) -> bool {
    if a.kind != b.kind {
        return false;
    }
    if tight {
        within_tolerance(a.calories, b.calories, 15.0, 0.08)
            && within_tolerance(a.protein, b.protein, 2.0, 0.15)
            && within_tolerance(a.carbs, b.carbs, 2.0, 0.15)
            && within_tolerance(a.fat, b.fat, 2.0, 0.15)
    } else {
        within_tolerance(a.calories, b.calories, 20.0, 0.12)
            && within_tolerance(a.protein, b.protein, 3.0, 0.20)
            && within_tolerance(a.carbs, b.carbs, 3.0, 0.20)
            && within_tolerance(a.fat, b.fat, 3.0, 0.20)
    }
}

/// Normalizes barcodes: digits only, 8..=14 length, 12-digit UPC-A -> 13-digit leading-zero EAN-13.
pub fn normalize_barcode(raw: Option<&str>) -> Option<String> {
    let s = raw?;
    let digits: String = s.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() < 8 || digits.len() > 14 {
        return None;
    }
    if digits.len() == 12 {
        Some(format!("0{}", digits))
    } else {
        Some(digits)
    }
}

pub fn strip_accents_lower(s: &str) -> String {
    s.nfkd()
        .filter(|c| !('\u{0300}'..='\u{036f}').contains(c))
        .flat_map(|c| c.to_lowercase())
        .collect()
}

const GENERIC_BRANDS: &[&str] = &[
    "generic",
    "unbranded",
    "none",
    "unknown",
    "n a",
    "na",
    "usda",
    "store brand",
    "private label",
];

const CORPORATE_SUFFIXES: &[&str] = &[
    "inc",
    "incorporated",
    "llc",
    "ltd",
    "limited",
    "corp",
    "corporation",
    "co",
    "company",
    "foods",
    "food",
    "brands",
    "brand",
    "usa",
    "us",
    "international",
    "intl",
    "products",
    "holdings",
    "group",
    "enterprises",
    "distribution",
    "distributing",
    "markets",
    "market",
    "supermarkets",
    "supermarket",
    "stores",
    "store",
    "gmbh",
    "sa",
    "sas",
    "bv",
    "nv",
    "plc",
    "pty",
    "the",
];

/// Canonicalizes a brand string by stripping accents, punctuation, and corporate suffixes.
pub fn canonicalize_brand(raw: &str) -> String {
    let lower = strip_accents_lower(raw);
    let cleaned: String = lower
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { ' ' })
        .collect();
    let collapsed: Vec<&str> = cleaned.split_whitespace().collect();
    if collapsed.is_empty() {
        return String::new();
    }
    let full = collapsed.join(" ");
    if GENERIC_BRANDS.contains(&full.as_str()) {
        return String::new();
    }
    let filtered: Vec<&str> = collapsed
        .iter()
        .copied()
        .filter(|tok| !CORPORATE_SUFFIXES.contains(tok))
        .collect();
    let result = if filtered.is_empty() {
        full
    } else {
        filtered.join(" ")
    };
    if GENERIC_BRANDS.contains(&result.as_str()) {
        String::new()
    } else {
        result
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PrepGroup {
    Raw,
    Cooked,
    Dried,
    Unspecified,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PrepState {
    pub group: PrepGroup,
    pub specific: Option<&'static str>,
}

const RAW_TOKENS: &[&str] = &["raw", "uncooked", "fresh"];
const DRIED_TOKENS: &[&str] = &["dried", "dehydrated", "dry"];
const COOKED_SPECIFIC: &[&str] = &[
    "grilled",
    "fried",
    "pan-fried",
    "deep-fried",
    "baked",
    "roasted",
    "boiled",
    "hard-boiled",
    "soft-boiled",
    "steamed",
    "broiled",
    "braised",
    "stewed",
    "smoked",
    "poached",
    "scrambled",
    "sauteed",
    "rotisserie",
    "microwaved",
    "toasted",
];

pub fn extract_prep_state(name: &str) -> PrepState {
    let lower = strip_accents_lower(name);
    let mut has_raw = false;
    let mut has_dried = false;
    let mut has_cooked = false;
    let mut specific: Option<&'static str> = None;

    for word in lower.split(|c: char| !c.is_ascii_alphabetic() && c != '-') {
        if word.is_empty() {
            continue;
        }
        if DRIED_TOKENS.contains(&word) {
            has_dried = true;
        } else if word == "cooked" {
            has_cooked = true;
        } else if let Some(&spec) = COOKED_SPECIFIC.iter().find(|&&s| s == word) {
            has_cooked = true;
            if specific.is_none() {
                specific = Some(spec);
            }
        } else if RAW_TOKENS.contains(&word) {
            has_raw = true;
        }
    }

    if has_dried {
        PrepState {
            group: PrepGroup::Dried,
            specific: Some("dried"),
        }
    } else if has_cooked {
        PrepState {
            group: PrepGroup::Cooked,
            specific,
        }
    } else if has_raw {
        PrepState {
            group: PrepGroup::Raw,
            specific: Some("raw"),
        }
    } else {
        PrepState {
            group: PrepGroup::Unspecified,
            specific: None,
        }
    }
}

pub fn are_prep_states_compatible(a: &PrepState, b: &PrepState) -> bool {
    if a.group == b.group {
        if a.group == PrepGroup::Cooked {
            if let (Some(sa), Some(sb)) = (a.specific, b.specific) {
                return sa == sb;
            }
        }
        return true;
    }
    if a.group == PrepGroup::Unspecified || b.group == PrepGroup::Unspecified {
        if a.group == PrepGroup::Dried || b.group == PrepGroup::Dried {
            return false;
        }
        return true;
    }
    false
}

/// Bitmask of broad food groups inferred from category.
pub fn extract_food_groups(category: &str) -> u16 {
    if category.trim().is_empty() {
        return 0;
    }
    let c = category.to_lowercase();
    let mut mask = 0u16;
    if contains_any(&c, &["dairy", "milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "egg"]) {
        mask |= 1 << 0;
    }
    if contains_any(&c, &["poultry", "chicken", "turkey", "duck"]) {
        mask |= 1 << 1;
    }
    if contains_any(&c, &["beef", "pork", "lamb", "veal", "meat", "sausage", "bacon", "ham"]) {
        mask |= 1 << 2;
    }
    if contains_any(&c, &["fish", "seafood", "shellfish", "salmon", "tuna", "shrimp"]) {
        mask |= 1 << 3;
    }
    if contains_any(&c, &["cereal", "grain", "bread", "pasta", "rice", "oat", "flour", "baked", "bakery"]) {
        mask |= 1 << 4;
    }
    if contains_any(&c, &["fruit", "berry", "berries", "apple", "banana", "citrus"]) {
        mask |= 1 << 5;
    }
    if contains_any(&c, &["vegetable", "veggie", "salad", "potato", "mushroom"]) {
        mask |= 1 << 6;
    }
    if contains_any(&c, &["beverage", "drink", "juice", "soda", "coffee", "tea", "water", "alcohol", "beer", "wine"]) {
        mask |= 1 << 7;
    }
    if contains_any(&c, &["sweet", "candy", "chocolate", "dessert", "cake", "cookie", "ice cream", "snack", "confection"]) {
        mask |= 1 << 8;
    }
    if contains_any(&c, &["oil", "fat", "margarine", "shortening"]) {
        mask |= 1 << 9;
    }
    if contains_any(&c, &["nut", "seed", "peanut", "almond", "legume", "bean", "lentil", "tofu", "soy"]) {
        mask |= 1 << 10;
    }
    mask
}

pub fn are_food_groups_compatible(a: u16, b: u16) -> bool {
    a == 0 || b == 0 || (a & b) != 0
}

fn contains_any(haystack: &str, needles: &[&str]) -> bool {
    needles.iter().any(|n| haystack.contains(n))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VariantQualifiers {
    pub fat_level: Option<u8>,      // 1=nonfat/skim, 2=lowfat/1%/2%, 3=whole/full
    pub diet_level: Option<u8>,     // 1=diet/zero/sugar-free/unsweetened, 2=sweetened
    pub sodium_level: Option<u8>,   // 1=unsalted/no-salt, 2=salted
    pub color_or_type: Option<&'static str>,
    pub flavors: Vec<&'static str>,
    pub meat_cut: Option<&'static str>,
}

const FLAVOR_TOKENS: &[&str] = &[
    "strawberry",
    "vanilla",
    "chocolate",
    "blueberry",
    "raspberry",
    "blackberry",
    "mango",
    "peach",
    "apricot",
    "cherry",
    "grape",
    "apple",
    "banana",
    "coconut",
    "lemon",
    "lime",
    "orange",
    "pineapple",
    "watermelon",
    "honey",
    "maple",
    "cinnamon",
    "bbq",
    "barbecue",
    "spicy",
    "jalapeno",
    "habanero",
    "garlic",
    "onion",
    "ranch",
    "cheddar",
    "parmesan",
    "nacho",
    "caramel",
    "mocha",
    "coffee",
    "espresso",
    "mint",
    "peppermint",
    "hazelnut",
    "pistachio",
    "pecan",
    "walnut",
    "pumpkin",
    "ginger",
    "teriyaki",
    "buffalo",
    "cajun",
    "smoky",
    "herb",
    "basil",
    "oregano",
    "truffle",
    "matcha",
    "cookies",
    "birthday",
    "plain",
];

const MEAT_CUTS: &[&str] = &[
    "breast",
    "thigh",
    "wing",
    "drumstick",
    "tenderloin",
    "sirloin",
    "ribeye",
    "chuck",
    "brisket",
    "loin",
    "chop",
    "belly",
    "shoulder",
    "shank",
    "liver",
    "ground",
];

const COLOR_TYPES: &[&str] = &[
    "white",
    "brown",
    "black",
    "red",
    "green",
    "yellow",
    "dark",
    "milk",
    "whole-wheat",
    "wholewheat",
    "sourdough",
    "rye",
    "multigrain",
    "jasmine",
    "basmati",
    "wild",
];

pub fn extract_variant_qualifiers(name: &str) -> VariantQualifiers {
    let lower = strip_accents_lower(name);
    let tokens: Vec<&str> = lower
        .split(|c: char| !c.is_ascii_alphanumeric() && c != '%' && c != '-')
        .filter(|t| !t.is_empty())
        .collect();

    let mut fat_level = None;
    let mut diet_level = None;
    let mut sodium_level = None;
    let mut color_or_type = None;
    let mut meat_cut = None;
    let mut flavors = Vec::new();

    if lower.contains("fat free")
        || lower.contains("fat-free")
        || lower.contains("nonfat")
        || lower.contains("non-fat")
        || lower.contains("skim")
        || tokens.contains(&"0%")
    {
        fat_level = Some(1);
    } else if lower.contains("low fat")
        || lower.contains("low-fat")
        || lower.contains("lowfat")
        || lower.contains("reduced fat")
        || lower.contains("reduced-fat")
        || lower.contains("part-skim")
        || lower.contains("part skim")
        || tokens.contains(&"1%")
        || tokens.contains(&"2%")
    {
        fat_level = Some(2);
    } else if lower.contains("whole milk")
        || lower.contains("full fat")
        || lower.contains("full-fat")
    {
        fat_level = Some(3);
    }

    if lower.contains("sugar free")
        || lower.contains("sugar-free")
        || lower.contains("no sugar")
        || lower.contains("unsweetened")
        || tokens.contains(&"diet")
        || tokens.contains(&"zero")
    {
        diet_level = Some(1);
    } else if tokens.contains(&"sweetened") {
        diet_level = Some(2);
    }

    if lower.contains("unsalted")
        || lower.contains("no salt")
        || lower.contains("sodium free")
        || lower.contains("sodium-free")
        || lower.contains("low sodium")
    {
        sodium_level = Some(1);
    } else if tokens.contains(&"salted") {
        sodium_level = Some(2);
    }

    for &t in &tokens {
        if meat_cut.is_none() {
            if let Some(&cut) = MEAT_CUTS.iter().find(|&&c| c == t) {
                meat_cut = Some(cut);
            }
        }
        if color_or_type.is_none() {
            if let Some(&ct) = COLOR_TYPES.iter().find(|&&c| c == t) {
                color_or_type = Some(ct);
            }
        }
        if let Some(&fl) = FLAVOR_TOKENS.iter().find(|&&f| f == t) {
            if !flavors.contains(&fl) {
                flavors.push(fl);
            }
        }
    }
    flavors.sort_unstable();

    VariantQualifiers {
        fat_level,
        diet_level,
        sodium_level,
        color_or_type,
        flavors,
        meat_cut,
    }
}

pub fn are_variant_qualifiers_compatible(a: &VariantQualifiers, b: &VariantQualifiers) -> bool {
    if let (Some(fa), Some(fb)) = (a.fat_level, b.fat_level) {
        if fa != fb {
            return false;
        }
    }
    // Diet/zero/sugar-free never merges with regular (even if regular has diet_level == None)
    if a.diet_level != b.diet_level {
        return false;
    }
    if let (Some(sa), Some(sb)) = (a.sodium_level, b.sodium_level) {
        if sa != sb {
            return false;
        }
    }
    if let (Some(ma), Some(mb)) = (a.meat_cut, b.meat_cut) {
        if ma != mb {
            return false;
        }
    }
    if let (Some(ca), Some(cb)) = (a.color_or_type, b.color_or_type) {
        if ca != cb {
            return false;
        }
    }
    if !a.flavors.is_empty() && !b.flavors.is_empty() && a.flavors != b.flavors {
        return false;
    }
    true
}

const BOILERPLATE_PHRASES: &[&str] = &[
    "includes foods for usda s food distribution program",
    "includes foods for usdas food distribution program",
    "broilers or fryers",
    "broiler or fryer",
    "separable lean only",
    "separable lean and fat",
    "all grades",
    "all varieties",
    "salad or cooking",
    "meat only",
    "ns as to fat",
    "prepared from recipe",
    "ready to eat",
    "ready to drink",
    "ready to serve",
];

const CORE_NOISE_TOKENS: &[&str] = &[
    "a",
    "an",
    "and",
    "or",
    "of",
    "the",
    "with",
    "in",
    "on",
    "for",
    "to",
    "from",
    "by",
    "as",
    "at",
    "regular",
    "commercial",
    "classic",
    "original",
    "traditional",
    "style",
    "grade",
    "enriched",
    "unenriched",
    "fortified",
    "unfortified",
    "fluid",
    "solid",
    "natural",
    "organic",
    "authentic",
    "premium",
    "select",
    "quality",
    "fresh",
    "usda",
    "food",
    "foods",
    "distribution",
    "program",
    "includes",
    "beverages",
    "snacks",
];

const PLURAL_EXCEPTIONS: &[&str] = &[
    "hummus",
    "couscous",
    "asparagus",
    "citrus",
    "molasses",
    "swiss",
    "glass",
    "grass",
    "bass",
    "pass",
    "rice",
    "juice",
    "cheese",
    "sauce",
    "oats",
    "chips",
    "fries",
    "noodles",
    "beans",
    "peas",
    "lentils",
    "grits",
];

fn singularize(token: &str) -> String {
    if token.len() <= 3 || PLURAL_EXCEPTIONS.contains(&token) {
        return token.to_string();
    }
    if token.ends_with("ies") && token.len() > 4 {
        return format!("{}y", &token[..token.len() - 3]);
    }
    if token.ends_with("es")
        && (token.ends_with("ches")
            || token.ends_with("shes")
            || token.ends_with("xes")
            || token.ends_with("zes")
            || token.ends_with("oes"))
    {
        return token[..token.len() - 2].to_string();
    }
    if token.ends_with('s') && !token.ends_with("ss") && !token.ends_with("us") {
        return token[..token.len() - 1].to_string();
    }
    token.to_string()
}

/// Extracts sorted, deduplicated core tokens for a food name (stripping boilerplate & brand tokens).
pub fn extract_core_tokens(name: &str, canonical_brand: &str) -> Vec<String> {
    let mut clean = strip_accents_lower(name);
    for ch in ['\'', '’', '"', '(', ')', ',', '.', '/', '&', '-', ':', ';', '!', '?'] {
        clean = clean.replace(ch, " ");
    }
    clean = clean.split_whitespace().collect::<Vec<_>>().join(" ");
    for phrase in BOILERPLATE_PHRASES {
        if clean.contains(phrase) {
            clean = clean.replace(phrase, " ");
        }
    }

    let brand_tokens: HashSet<&str> = canonical_brand
        .split_whitespace()
        .filter(|t| t.len() >= 2)
        .collect();

    let all_tokens: Vec<String> = clean
        .split_whitespace()
        .filter(|t| !t.is_empty())
        .map(singularize)
        .collect();

    let mut filtered: Vec<String> = all_tokens
        .iter()
        .filter(|t| !CORE_NOISE_TOKENS.contains(&t.as_str()) && !brand_tokens.contains(t.as_str()))
        .cloned()
        .collect();

    if filtered.is_empty() {
        filtered = all_tokens;
    }

    filtered.sort();
    filtered.dedup();
    filtered
}

/// Extracts character 3-grams from a normalized string for fuzzy cosine similarity.
pub fn extract_trigrams(text: &str) -> HashMap<[u8; 3], u16> {
    let bytes: Vec<u8> = text
        .bytes()
        .filter(|b| b.is_ascii_alphanumeric() || *b == b' ')
        .collect();
    let mut map = HashMap::new();
    if bytes.len() < 3 {
        return map;
    }
    for w in bytes.windows(3) {
        let key = [w[0], w[1], w[2]];
        *map.entry(key).or_insert(0) += 1;
    }
    map
}

pub fn trigram_cosine(a: &HashMap<[u8; 3], u16>, b: &HashMap<[u8; 3], u16>) -> f64 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    let mut dot = 0.0f64;
    let mut norm_a = 0.0f64;
    let mut norm_b = 0.0f64;
    for (&k, &va) in a {
        let fa = va as f64;
        norm_a += fa * fa;
        if let Some(&vb) = b.get(&k) {
            dot += fa * (vb as f64);
        }
    }
    for &vb in b.values() {
        let fb = vb as f64;
        norm_b += fb * fb;
    }
    let denom = norm_a.sqrt() * norm_b.sqrt();
    if denom == 0.0 {
        0.0
    } else {
        dot / denom
    }
}

pub fn idf_weighted_jaccard(
    a: &[String],
    b: &[String],
    idf: &HashMap<String, f64>,
) -> f64 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    let mut i = 0;
    let mut j = 0;
    let mut inter = 0.0f64;
    let mut union = 0.0f64;
    while i < a.len() && j < b.len() {
        match a[i].cmp(&b[j]) {
            std::cmp::Ordering::Equal => {
                let w = idf.get(&a[i]).copied().unwrap_or(1.0);
                inter += w;
                union += w;
                i += 1;
                j += 1;
            }
            std::cmp::Ordering::Less => {
                union += idf.get(&a[i]).copied().unwrap_or(1.0);
                i += 1;
            }
            std::cmp::Ordering::Greater => {
                union += idf.get(&b[j]).copied().unwrap_or(1.0);
                j += 1;
            }
        }
    }
    while i < a.len() {
        union += idf.get(&a[i]).copied().unwrap_or(1.0);
        i += 1;
    }
    while j < b.len() {
        union += idf.get(&b[j]).copied().unwrap_or(1.0);
        j += 1;
    }
    if union == 0.0 {
        0.0
    } else {
        inter / union
    }
}

const COMMODITY_EXCLUDED_TOKENS: &[&str] = &[
    "bar",
    "cookie",
    "cake",
    "pie",
    "pizza",
    "soup",
    "salad",
    "sandwich",
    "burger",
    "wrap",
    "burrito",
    "taco",
    "cereal",
    "cracker",
    "chip",
    "chips",
    "pretzel",
    "candy",
    "fudge",
    "pudding",
    "muffin",
    "donut",
    "pastry",
    "breaded",
    "stuffed",
    "nugget",
    "patty",
    "kit",
    "meal",
    "bowl",
    "dressing",
    "dip",
    "glaze",
    "marinade",
    "smoothie",
    "shake",
    "latte",
    "protein",
    "supplement",
    "capsule",
    "tablet",
    "powder",
    "baby",
    "infant",
    "formula",
];

pub fn is_commodity_candidate(core_tokens: &[String]) -> bool {
    if core_tokens.is_empty() || core_tokens.len() > 4 {
        return false;
    }
    !core_tokens
        .iter()
        .any(|t| COMMODITY_EXCLUDED_TOKENS.contains(&t.as_str()))
}
