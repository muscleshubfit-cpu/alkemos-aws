use std::cmp::Ordering;
use std::collections::{BTreeMap, HashMap, HashSet};

use crate::normalize::{canonicalize_brand, normalize_barcode};
use crate::schema::{FoodRow, ServingOption};

pub fn count_micronutrients(json_str: &str) -> usize {
    if json_str.trim().is_empty() || json_str.trim() == "{}" {
        return 0;
    }
    match serde_json::from_str::<serde_json::Value>(json_str) {
        Ok(serde_json::Value::Object(map)) => map
            .values()
            .filter(|v| v.as_f64().map(|f| f.is_finite()).unwrap_or(false))
            .count(),
        _ => 0,
    }
}

pub fn parse_valid_serving_options(json_str: &str) -> Vec<ServingOption> {
    if json_str.trim().is_empty() || json_str.trim() == "[]" {
        return Vec::new();
    }
    match serde_json::from_str::<Vec<ServingOption>>(json_str) {
        Ok(list) => list
            .into_iter()
            .filter(|o| {
                !o.id.trim().is_empty()
                    && !o.unit.trim().is_empty()
                    && o.grams.is_finite()
                    && o.grams > 0.0
            })
            .collect(),
        Err(_) => Vec::new(),
    }
}

pub fn count_valid_serving_options(json_str: &str) -> usize {
    parse_valid_serving_options(json_str).len()
}

/// Deterministic winner priority matching `compareCandidatePriority` in `src/lib/foods/dedup.ts`.
pub fn compare_food_priority(
    a: &FoodRow,
    a_micros: usize,
    a_servings: usize,
    b: &FoodRow,
    b_micros: usize,
    b_servings: usize,
) -> Ordering {
    a.accuracy_tier
        .cmp(&b.accuracy_tier)
        .then_with(|| b_micros.cmp(&a_micros))
        .then_with(|| b_servings.cmp(&a_servings))
        .then_with(|| b.search_rank.total_cmp(&a.search_rank))
        .then_with(|| a.name.trim().len().cmp(&b.name.trim().len()))
        .then_with(|| a.id.cmp(&b.id))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum UnitBucket {
    Household,
    Metric,
    Imperial,
}

fn unit_bucket(unit: &str) -> UnitBucket {
    let lower = unit.trim().to_lowercase();
    if matches!(lower.as_str(), "g" | "gram" | "grams" | "ml" | "milliliter" | "milliliters") {
        UnitBucket::Metric
    } else if matches!(lower.as_str(), "oz" | "ounce" | "ounces" | "fl oz" | "lb" | "lbs") {
        UnitBucket::Imperial
    } else {
        UnitBucket::Household
    }
}

/// Merges serving options across a cluster, deduplicating by normalized `unit`.
/// Always preserves metric (`g`/`ml`) and imperial (`oz`/`fl oz`) options first and caps only
/// household options (max 10) so `g` and `oz` are never truncated.
pub fn merge_serving_options(members: &[&FoodRow]) -> String {
    let mut seen_units: HashSet<String> = HashSet::new();
    let mut household: Vec<ServingOption> = Vec::new();
    let mut metric: Vec<ServingOption> = Vec::new();
    let mut imperial: Vec<ServingOption> = Vec::new();

    for row in members {
        for opt in parse_valid_serving_options(&row.serving_options_json) {
            let norm_unit = opt.unit.trim().to_lowercase();
            if !seen_units.insert(norm_unit) {
                continue;
            }
            match unit_bucket(&opt.unit) {
                UnitBucket::Household => {
                    if household.len() < 10 {
                        household.push(opt);
                    }
                }
                UnitBucket::Metric => metric.push(opt),
                UnitBucket::Imperial => imperial.push(opt),
            }
        }
    }

    let mut merged = Vec::with_capacity(household.len() + metric.len() + imperial.len());
    merged.extend(household);
    merged.extend(metric);
    merged.extend(imperial);

    serde_json::to_string(&merged).unwrap_or_else(|_| "[]".to_string())
}

/// Merges aliases across winner + losers (capped at 12 distinct meaningful aliases to keep FTS5 lean).
pub fn merge_aliases(members: &[&FoodRow]) -> String {
    let winner = members[0];
    let winner_name_lower = winner.name.trim().to_lowercase();
    let mut seen: HashSet<String> = HashSet::new();
    seen.insert(winner_name_lower);

    let mut out: Vec<String> = Vec::new();
    let mut push_alias = |raw: &str| {
        if out.len() >= 12 {
            return;
        }
        let trimmed = raw.trim();
        if trimmed.len() < 2 {
            return;
        }
        let key = trimmed.to_lowercase();
        if seen.insert(key) {
            out.push(trimmed.to_string());
        }
    };

    // Winner's existing aliases first
    for part in winner.aliases.split('|') {
        push_alias(part);
    }
    // Distinct loser names and aliases
    for loser in &members[1..] {
        push_alias(&loser.name);
        for part in loser.aliases.split('|') {
            push_alias(part);
        }
    }

    out.join(" | ")
}

pub struct MergedCatalogOutput {
    pub foods: Vec<FoodRow>,
    pub id_aliases: Vec<(String, String)>,
    pub barcode_aliases: Vec<(String, String)>,
}

pub fn build_merged_catalog(
    original_foods: &[FoodRow],
    clusters: &[Vec<usize>],
    existing_id_aliases: &[(String, String)],
    existing_barcode_aliases: &[(String, String)],
    brand_display_map: &HashMap<String, String>,
) -> MergedCatalogOutput {
    let mut old_id_to_winner_id: HashMap<&str, String> = HashMap::with_capacity(original_foods.len());
    let mut merged_foods: Vec<FoodRow> = Vec::with_capacity(clusters.len());

    // Track canonical barcodes already claimed on `foods.barcode`
    let mut winner_barcodes: HashSet<String> = HashSet::new();
    // Deterministic map for `food_barcode_aliases`: barcode -> canonical_id
    let mut barcode_alias_map: BTreeMap<String, String> = BTreeMap::new();
    let mut id_alias_map: BTreeMap<String, String> = BTreeMap::new();

    for cluster in clusters {
        let members: Vec<&FoodRow> = cluster.iter().map(|&idx| &original_foods[idx]).collect();
        let winner = members[0];

        for &m in &members {
            old_id_to_winner_id.insert(m.id.as_str(), winner.id.clone());
        }

        // Normalize winner's barcode, or inherit first valid loser barcode
        let mut chosen_barcode = normalize_barcode(winner.barcode.as_deref());
        if chosen_barcode.is_none() {
            for loser in &members[1..] {
                if let Some(bc) = normalize_barcode(loser.barcode.as_deref()) {
                    chosen_barcode = Some(bc);
                    break;
                }
            }
        }
        if let Some(ref bc) = chosen_barcode {
            winner_barcodes.insert(bc.clone());
        }

        // Record loser IDs and loser barcodes
        for loser in &members[1..] {
            if loser.id != winner.id {
                id_alias_map.insert(loser.id.clone(), winner.id.clone());
            }
            if let Some(bc) = normalize_barcode(loser.barcode.as_deref()) {
                if chosen_barcode.as_deref() != Some(bc.as_str()) {
                    barcode_alias_map
                        .entry(bc)
                        .or_insert_with(|| winner.id.clone());
                }
            }
        }

        // Clean brand display spelling if brand is non-empty and has a canonical display form
        let display_brand = if !winner.brand.trim().is_empty() {
            let cb = canonicalize_brand(&winner.brand);
            if !cb.is_empty() {
                brand_display_map
                    .get(&cb)
                    .cloned()
                    .unwrap_or_else(|| winner.brand.clone())
            } else {
                winner.brand.clone()
            }
        } else {
            winner.brand.clone()
        };

        let mut merged = winner.clone();
        merged.barcode = chosen_barcode;
        merged.brand = display_brand;
        if members.len() > 1 {
            merged.serving_options_json = merge_serving_options(&members);
            merged.aliases = merge_aliases(&members);
        }
        merged_foods.push(merged);
    }

    // Transitively remap existing food_id_aliases
    for (legacy_id, old_canonical) in existing_id_aliases {
        if let Some(final_winner) = old_id_to_winner_id.get(old_canonical.as_str()) {
            if legacy_id != final_winner {
                id_alias_map.insert(legacy_id.clone(), final_winner.clone());
            }
        }
    }

    // Transitively remap existing food_barcode_aliases (idempotent across re-runs)
    for (raw_bc, old_canonical) in existing_barcode_aliases {
        if let Some(final_winner) = old_id_to_winner_id.get(old_canonical.as_str()) {
            if let Some(norm_bc) = normalize_barcode(Some(raw_bc.as_str())) {
                if !winner_barcodes.contains(&norm_bc) {
                    barcode_alias_map
                        .entry(norm_bc)
                        .or_insert_with(|| final_winner.clone());
                }
            }
        }
    }

    // Remove any barcode alias that duplicates a barcode already on `foods.barcode`
    barcode_alias_map.retain(|bc, _| !winner_barcodes.contains(bc));

    MergedCatalogOutput {
        foods: merged_foods,
        id_aliases: id_alias_map.into_iter().collect(),
        barcode_aliases: barcode_alias_map.into_iter().collect(),
    }
}
