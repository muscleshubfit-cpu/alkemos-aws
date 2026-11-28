use serde::Serialize;

use crate::normalize::{to_comparable_macros, ComparableKind};
use crate::schema::FoodRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum HygieneReason {
    UnusableName,
    ImpossibleMacros,
    AtwaterContradiction,
    AllZeroNonZeroCalFood,
}

const GENERIC_ONLY_TOKENS: &[&str] = &[
    "original",
    "classic",
    "plain",
    "regular",
    "natural",
    "organic",
    "fresh",
    "light",
    "lite",
    "zero",
    "free",
    "extra",
    "special",
    "premium",
    "select",
    "family",
    "pack",
    "value",
    "size",
    "new",
    "best",
    "choice",
    "quality",
    "grade",
    "style",
    "blend",
    "mix",
    "traditional",
    "homemade",
    "artisan",
    "gourmet",
    "deluxe",
    "signature",
    "everyday",
    "essential",
    "essentials",
    "simple",
    "pure",
    "real",
    "authentic",
    "mild",
    "medium",
    "hot",
    "bold",
    "rich",
    "smooth",
    "creamy",
    "crunchy",
    "crispy",
    "soft",
    "hard",
    "sweet",
    "unsweetened",
    "salted",
    "unsalted",
    "low",
    "fat",
    "sodium",
    "carb",
    "no",
    "the",
    "and",
    "with",
    "of",
    "in",
    "for",
    "a",
    "an",
];

const ALCOHOL_KEYWORDS: &[&str] = &[
    "beer",
    "wine",
    "vodka",
    "whiskey",
    "whisky",
    "rum",
    "gin",
    "tequila",
    "sake",
    "cider",
    "spirits",
    "liqueur",
    "bourbon",
    "scotch",
    "brandy",
    "champagne",
    "prosecco",
    "soju",
    "alcohol",
    "alcoholic",
    "ale",
    "lager",
    "stout",
    "ipa",
    "pilsner",
    "seltzer",
    "cocktail",
    "mezcal",
    "cognac",
    "vermouth",
    "absinthe",
    "schnapps",
];

const ZERO_CAL_ALLOWED_KEYWORDS: &[&str] = &[
    "water",
    "coffee",
    "espresso",
    "tea",
    "matcha",
    "vinegar",
    "salt",
    "pepper",
    "spice",
    "herb",
    "seasoning",
    "sweetener",
    "stevia",
    "splenda",
    "erythritol",
    "monk",
    "diet",
    "zero",
    "sugar-free",
    "sugar free",
    "sparkling",
    "seltzer",
    "soda",
    "cola",
    "tonic",
    "gum",
    "mint",
    "broth",
    "bouillon",
    "mustard",
    "hot sauce",
    "soy sauce",
    "baking powder",
    "baking soda",
    "yeast",
    "extract",
    "gelatin",
    "ice",
    "energy drink",
    "drink",
    "beverage",
    "kombucha",
    "lemonade",
    "squash",
    "cordial",
    "electrolyte",
];

fn is_tier4_crowdsourced(row: &FoodRow) -> bool {
    row.accuracy_tier >= 4 || row.source.eq_ignore_ascii_case("openfoodfacts")
}

fn contains_keyword(haystack: &str, keywords: &[&str]) -> bool {
    for kw in keywords {
        if kw.contains(' ') || kw.contains('-') {
            if haystack.contains(kw) {
                return true;
            }
        } else if haystack
            .split(|c: char| !c.is_ascii_alphanumeric())
            .any(|tok| tok == *kw)
        {
            return true;
        }
    }
    false
}

/// Evaluates whether a Tier-4 crowdsourced row should be quarantined.
/// Never prunes Tier 1–3 (USDA, CNF, curated, staple, etc.).
pub fn check_hygiene(row: &FoodRow) -> Option<HygieneReason> {
    if !is_tier4_crowdsourced(row) {
        return None;
    }

    let name_lower = row.name.trim().to_lowercase();
    let alpha_count = name_lower.chars().filter(|c| c.is_alphabetic()).count();
    if alpha_count < 2 {
        return Some(HygieneReason::UnusableName);
    }

    let words: Vec<&str> = name_lower
        .split(|c: char| !c.is_alphanumeric())
        .filter(|w| !w.is_empty())
        .collect();
    if words.is_empty()
        || words
            .iter()
            .all(|w| w.chars().all(|c| c.is_ascii_digit()) || GENERIC_ONLY_TOKENS.contains(w))
    {
        return Some(HygieneReason::UnusableName);
    }

    // Raw macro sanity
    if !row.calories.is_finite()
        || !row.protein.is_finite()
        || !row.carbs.is_finite()
        || !row.fat.is_finite()
        || !row.fiber.is_finite()
        || row.calories < -0.1
        || row.protein < -0.1
        || row.carbs < -0.1
        || row.fat < -0.1
        || row.fiber < -0.1
    {
        return Some(HygieneReason::ImpossibleMacros);
    }

    let comp = to_comparable_macros(row);
    if comp.kind == ComparableKind::Per100 {
        let cal = comp.calories;
        let p = comp.protein;
        let c = comp.carbs;
        let f = comp.fat;
        let fib = comp.fiber.max(0.0).min(c);

        if cal > 950.0 || p > 102.0 || c > 102.0 || f > 102.0 || (p + c + f) > 105.0 {
            return Some(HygieneReason::ImpossibleMacros);
        }

        let haystack = format!("{} {}", name_lower, row.category.to_lowercase());

        // All-zero nutrition on a non-zero-cal food
        if cal == 0.0 && p == 0.0 && c == 0.0 && f == 0.0 {
            if !contains_keyword(&haystack, ZERO_CAL_ALLOWED_KEYWORDS) {
                return Some(HygieneReason::AllZeroNonZeroCalFood);
            }
            return None;
        }

        // Atwater energy check: evaluate both US (total carbs incl. fiber) and EU (available carbs excl. fiber)
        // conventions and use whichever is closer to declared calories so high-fiber EU OFF items aren't falsely pruned.
        let atwater_us = 4.0 * p + 4.0 * (c - fib).max(0.0) + 2.0 * fib + 9.0 * f;
        let atwater_eu = 4.0 * p + 4.0 * c + 2.0 * fib + 9.0 * f;
        let atwater = if (cal - atwater_us).abs() <= (cal - atwater_eu).abs() {
            atwater_us
        } else {
            atwater_eu
        };
        let max_val = cal.max(atwater);
        if max_val >= 40.0 {
            let threshold = (0.45 * max_val).max(65.0);
            let is_alcohol = contains_keyword(&haystack, ALCOHOL_KEYWORDS);
            if is_alcohol {
                // Ethanol adds 7 kcal/g outside P/C/F, so calories > atwater is valid;
                // only reject impossible atwater > calories.
                if atwater - cal > threshold {
                    return Some(HygieneReason::AtwaterContradiction);
                }
            } else if (cal - atwater).abs() > threshold {
                return Some(HygieneReason::AtwaterContradiction);
            }
        }
    }

    None
}
