use std::collections::{HashMap, HashSet};
use rayon::prelude::*;
use serde::Serialize;

use crate::hygiene::{check_hygiene, HygieneReason};
use crate::merge::{compare_food_priority, count_micronutrients, count_valid_serving_options};
use crate::normalize::{
    are_food_groups_compatible, are_macros_similar, are_prep_states_compatible,
    are_variant_qualifiers_compatible, canonicalize_brand, extract_core_tokens,
    extract_food_groups, extract_prep_state, extract_trigrams, extract_variant_qualifiers,
    idf_weighted_jaccard, is_commodity_candidate, normalize_barcode, strip_accents_lower,
    to_comparable_macros, trigram_cosine, ComparableMacros, PrepState, VariantQualifiers,
};
use crate::schema::FoodRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MergePass {
    ExactIdOrBarcode,
    CanonicalKey,
    FuzzyTrigram,
    CommodityCollapse,
}

pub struct PreparedFood {
    pub barcode: Option<String>,
    pub canonical_brand: String,
    pub prep: PrepState,
    pub food_groups: u16,
    pub qualifiers: VariantQualifiers,
    pub core_tokens: Vec<String>,
    pub core_key: String,
    pub macros: ComparableMacros,
    pub trigrams: HashMap<[u8; 3], u16>,
    pub micro_count: usize,
    pub serving_count: usize,
    pub is_commodity: bool,
}

pub struct UnionFind {
    parent: Vec<usize>,
}

impl UnionFind {
    pub fn new(n: usize) -> Self {
        Self {
            parent: (0..n).collect(),
        }
    }

    pub fn find(&mut self, mut x: usize) -> usize {
        while self.parent[x] != x {
            let grand = self.parent[self.parent[x]];
            self.parent[x] = grand;
            x = grand;
        }
        x
    }

    /// Unions two clusters, keeping the higher-priority food as the root representative.
    pub fn union_by_priority(
        &mut self,
        a: usize,
        b: usize,
        foods: &[FoodRow],
        prepared: &[PreparedFood],
    ) -> Option<(usize, usize)> {
        let ra = self.find(a);
        let rb = self.find(b);
        if ra == rb {
            return None;
        }
        let ord = compare_food_priority(
            &foods[ra],
            prepared[ra].micro_count,
            prepared[ra].serving_count,
            &foods[rb],
            prepared[rb].micro_count,
            prepared[rb].serving_count,
        );
        if ord.is_le() {
            self.parent[rb] = ra;
            Some((ra, rb))
        } else {
            self.parent[ra] = rb;
            Some((rb, ra))
        }
    }
}

pub struct ClusterOutput {
    pub quarantined: Vec<(usize, HygieneReason)>,
    pub clusters: Vec<Vec<usize>>, // each cluster sorted by winner priority (index 0 = winner)
    pub pass_merges: HashMap<MergePass, usize>,
    pub cluster_pass: HashMap<usize, MergePass>, // winner original idx -> highest pass that merged into it
    pub brand_families_merged: usize,
    pub brand_display_map: HashMap<String, String>,
}

fn passes_safety_guards(a: &PreparedFood, b: &PreparedFood) -> bool {
    are_prep_states_compatible(&a.prep, &b.prep)
        && are_food_groups_compatible(a.food_groups, b.food_groups)
        && are_variant_qualifiers_compatible(&a.qualifiers, &b.qualifiers)
}

pub fn run_dedup_pipeline(foods: &[FoodRow]) -> ClusterOutput {
    let n = foods.len();
    let mut quarantined = Vec::new();
    let mut active_mask = vec![true; n];

    // Stage 0: Hygiene filter (Tier 4 crowdsourced OFF only)
    for (idx, row) in foods.iter().enumerate() {
        if let Some(reason) = check_hygiene(row) {
            active_mask[idx] = false;
            quarantined.push((idx, reason));
        }
    }

    // Stage 1: Brand canonicalization & display spelling selection
    let mut brand_spelling_counts: HashMap<String, HashMap<String, usize>> = HashMap::new();
    let mut raw_canonical_brands: Vec<String> = vec![String::new(); n];

    for (idx, row) in foods.iter().enumerate() {
        if !active_mask[idx] {
            continue;
        }
        let cb = canonicalize_brand(&row.brand);
        if !cb.is_empty() {
            let trimmed = row.brand.trim().to_string();
            *brand_spelling_counts
                .entry(cb.clone())
                .or_default()
                .entry(trimmed)
                .or_insert(0) += 1;
            raw_canonical_brands[idx] = cb;
        }
    }

    // Pick cleanest most-frequent display spelling per brand family & identify well-known brands (>= 3 rows)
    let mut brand_display_map: HashMap<String, String> = HashMap::new();
    let mut known_brands: HashSet<String> = HashSet::new();
    let mut brand_families_merged = 0usize;

    for (cb, spellings) in &brand_spelling_counts {
        if spellings.len() > 1 {
            brand_families_merged += 1;
        }
        let total: usize = spellings.values().sum();
        if total >= 3 && cb.len() >= 3 {
            known_brands.insert(cb.clone());
        }
        // Prefer highest count, then mixed-case (not all caps / all lower), then shorter, then lex
        let best = spellings
            .iter()
            .max_by(|(sa, ca), (sb, cb_cnt)| {
                ca.cmp(cb_cnt)
                    .then_with(|| is_nice_case(sa).cmp(&is_nice_case(sb)))
                    .then_with(|| sb.len().cmp(&sa.len()))
                    .then_with(|| sb.cmp(sa))
            })
            .map(|(s, _)| s.clone())
            .unwrap_or_default();
        brand_display_map.insert(cb.clone(), best);
    }

    // Extract embedded brand when row.brand is empty (skip Tier 1-2 reference tables and
    // ignore generic food/adjective words like "whole", "fresh", "best", "real" that can arise
    // after corporate suffix stripping e.g. "Whole Foods Market" -> "whole").
    const EMBEDDED_BRAND_STOPWORDS: &[&str] = &[
        "whole", "fresh", "best", "real", "pure", "simple", "natural", "organic", "raw",
        "plain", "white", "brown", "black", "red", "green", "yellow", "dark", "light",
        "sweet", "salted", "unsalted", "cooked", "dried", "frozen", "canned", "sliced",
        "diced", "chopped", "ground", "boneless", "skinless", "lean", "fat", "low",
        "reduced", "nonfat", "skim", "extra", "virgin", "select", "choice", "prime",
        "classic", "original", "regular", "traditional", "homemade", "artisan", "gourmet",
        "milk", "cream", "butter", "cheese", "bread", "rice", "pasta", "chicken", "beef",
        "pork", "fish", "water", "juice", "oil", "sugar", "salt", "honey", "sauce",
    ];
    for (idx, row) in foods.iter().enumerate() {
        if !active_mask[idx] || !raw_canonical_brands[idx].is_empty() || row.accuracy_tier <= 2 {
            continue;
        }
        if row.name.contains(',') {
            for seg in row.name.split(',') {
                let cand = canonicalize_brand(seg);
                if !cand.is_empty()
                    && !EMBEDDED_BRAND_STOPWORDS.contains(&cand.as_str())
                    && known_brands.contains(&cand)
                {
                    raw_canonical_brands[idx] = cand;
                    break;
                }
            }
        }
    }

    // Parallel feature extraction for all foods
    let prepared: Vec<PreparedFood> = (0..n)
        .into_par_iter()
        .map(|idx| {
            let row = &foods[idx];
            let cb = raw_canonical_brands[idx].clone();
            let core_tokens = extract_core_tokens(&row.name, &cb);
            let core_key = core_tokens.join(" ");
            let trigrams = extract_trigrams(&strip_accents_lower(&core_key));
            let is_commodity = is_commodity_candidate(&core_tokens);
            PreparedFood {
                barcode: normalize_barcode(row.barcode.as_deref()),
                canonical_brand: cb,
                prep: extract_prep_state(&row.name),
                food_groups: extract_food_groups(&row.category),
                qualifiers: extract_variant_qualifiers(&row.name),
                core_tokens,
                core_key,
                macros: to_comparable_macros(row),
                trigrams,
                micro_count: count_micronutrients(&row.micronutrients_json),
                serving_count: count_valid_serving_options(&row.serving_options_json),
                is_commodity,
            }
        })
        .collect();

    let mut uf = UnionFind::new(n);
    let mut pass_merges: HashMap<MergePass, usize> = HashMap::new();
    let mut merge_pass_by_node: HashMap<usize, MergePass> = HashMap::new();

    // Stage 2 (Pass A): Exact ID & normalized barcode merge
    {
        let mut by_id: HashMap<&str, usize> = HashMap::new();
        let mut by_barcode: HashMap<&str, usize> = HashMap::new();
        for idx in 0..n {
            if !active_mask[idx] {
                continue;
            }
            if let Some(&prev) = by_id.get(foods[idx].id.as_str()) {
                if let Some((w, _)) = uf.union_by_priority(prev, idx, foods, &prepared) {
                    *pass_merges.entry(MergePass::ExactIdOrBarcode).or_insert(0) += 1;
                    merge_pass_by_node.insert(w, MergePass::ExactIdOrBarcode);
                }
            } else {
                by_id.insert(foods[idx].id.as_str(), idx);
            }

            if let Some(ref bc) = prepared[idx].barcode {
                if let Some(&prev) = by_barcode.get(bc.as_str()) {
                    if let Some((w, _)) = uf.union_by_priority(prev, idx, foods, &prepared) {
                        *pass_merges.entry(MergePass::ExactIdOrBarcode).or_insert(0) += 1;
                        merge_pass_by_node.insert(w, MergePass::ExactIdOrBarcode);
                    }
                } else {
                    by_barcode.insert(bc.as_str(), idx);
                }
            }
        }
    }

    // Helper: collect current active roots
    let active_roots = |uf: &mut UnionFind| -> Vec<usize> {
        let mut seen = HashSet::new();
        let mut roots = Vec::new();
        for idx in 0..n {
            if !active_mask[idx] {
                continue;
            }
            let r = uf.find(idx);
            if seen.insert(r) {
                roots.push(r);
            }
        }
        roots
    };

    // Stage 3 (Pass B): Canonical core-token key + same canonical brand + safety guards + macros
    {
        let roots = active_roots(&mut uf);
        let mut buckets: HashMap<(&str, &str), Vec<usize>> = HashMap::new();
        for &r in &roots {
            if prepared[r].core_key.is_empty() {
                continue;
            }
            buckets
                .entry((
                    prepared[r].canonical_brand.as_str(),
                    prepared[r].core_key.as_str(),
                ))
                .or_default()
                .push(r);
        }

        let mut bucket_keys: Vec<(&str, &str)> = buckets.keys().copied().collect();
        bucket_keys.sort_unstable();

        for key in bucket_keys {
            let group = &buckets[&key];
            if group.len() < 2 {
                continue;
            }
            // Compare pairs within bucket deterministically
            for i in 0..group.len() {
                for j in (i + 1)..group.len() {
                    let a = uf.find(group[i]);
                    let b = uf.find(group[j]);
                    if a == b {
                        continue;
                    }
                    if passes_safety_guards(&prepared[a], &prepared[b])
                        && are_macros_similar(prepared[a].macros, prepared[b].macros, false)
                    {
                        if let Some((w, _)) = uf.union_by_priority(a, b, foods, &prepared) {
                            *pass_merges.entry(MergePass::CanonicalKey).or_insert(0) += 1;
                            merge_pass_by_node.insert(w, MergePass::CanonicalKey);
                        }
                    }
                }
            }
        }
    }

    // Stage 4 (Pass C): Parallel IDF-weighted token Jaccard + char 3-gram cosine clustering
    {
        let roots = active_roots(&mut uf);
        let total_docs = roots.len().max(1) as f64;
        let mut df: HashMap<String, usize> = HashMap::new();
        for &r in &roots {
            for tok in &prepared[r].core_tokens {
                *df.entry(tok.clone()).or_insert(0) += 1;
            }
        }
        let idf: HashMap<String, f64> = df
            .iter()
            .map(|(tok, &cnt)| (tok.clone(), ((total_docs + 1.0) / (cnt as f64 + 1.0)).ln() + 1.0))
            .collect();

        // Build inverted index by (canonical_brand, token)
        let mut inv_index: HashMap<(String, String), Vec<usize>> = HashMap::new();
        for &r in &roots {
            for tok in &prepared[r].core_tokens {
                inv_index
                    .entry((prepared[r].canonical_brand.clone(), tok.clone()))
                    .or_default()
                    .push(r);
            }
        }

        // Evaluate candidate pairs in parallel using prefix-filtering on rarest tokens
        let candidate_pairs: Vec<(f64, usize, usize)> = roots
            .par_iter()
            .flat_map_iter(|&r| {
                let p = &prepared[r];
                let token_count = p.core_tokens.len();
                if token_count < 2 {
                    return Vec::new();
                }

                // Sort tokens by document frequency (rarest first) and take prefix of up to 2 rarest tokens
                let mut sorted_toks: Vec<(&String, usize)> = p
                    .core_tokens
                    .iter()
                    .map(|t| (t, df.get(t).copied().unwrap_or(1)))
                    .collect();
                sorted_toks.sort_by_key(|&(_, freq)| freq);
                let prefix_len = ((token_count as f64 * 0.35).floor() as usize + 1).min(sorted_toks.len());

                let mut seen_cand = HashSet::new();
                let mut local_matches = Vec::new();

                for (tok, _) in sorted_toks.into_iter().take(prefix_len) {
                    if let Some(bucket) = inv_index.get(&(p.canonical_brand.clone(), tok.clone())) {
                        // Skip ultra-giant stopword buckets within same brand (> 600 items)
                        if bucket.len() > 600 {
                            continue;
                        }
                        for &other in bucket {
                            if other <= r || !seen_cand.insert(other) {
                                continue;
                            }
                            let q = &prepared[other];
                            let min_len = token_count.min(q.core_tokens.len());
                            let max_len = token_count.max(q.core_tokens.len());
                            if max_len == 0 || (min_len as f64 / max_len as f64) < 0.55 {
                                continue;
                            }
                            if !passes_safety_guards(p, q) {
                                continue;
                            }
                            if !are_macros_similar(p.macros, q.macros, false) {
                                continue;
                            }

                            let jac = idf_weighted_jaccard(&p.core_tokens, &q.core_tokens, &idf);
                            if jac < 0.60 {
                                continue;
                            }
                            let tri = if jac >= 0.72 {
                                1.0
                            } else {
                                trigram_cosine(&p.trigrams, &q.trigrams)
                            };
                            if jac >= 0.72 || (jac >= 0.60 && tri >= 0.78) {
                                let score = jac * 0.65 + tri * 0.35;
                                local_matches.push((score, r, other));
                            }
                        }
                    }
                }
                local_matches
            })
            .collect();

        // Deterministic sort: (score DESC, min_id ASC, max_id ASC)
        let mut sorted_pairs = candidate_pairs;
        sorted_pairs.sort_by(|a, b| {
            b.0.total_cmp(&a.0)
                .then_with(|| foods[a.1].id.cmp(&foods[b.1].id))
                .then_with(|| foods[a.2].id.cmp(&foods[b.2].id))
        });

        // Apply Union-Find sequentially with cluster-diameter guard
        for (_score, a, b) in sorted_pairs {
            let ra = uf.find(a);
            let rb = uf.find(b);
            if ra == rb {
                continue;
            }
            // Diameter guard: cluster representatives themselves must still pass guards + macro + similarity
            if !passes_safety_guards(&prepared[ra], &prepared[rb]) {
                continue;
            }
            if !are_macros_similar(prepared[ra].macros, prepared[rb].macros, false) {
                continue;
            }
            let jac = idf_weighted_jaccard(&prepared[ra].core_tokens, &prepared[rb].core_tokens, &idf);
            let tri = if jac >= 0.72 {
                1.0
            } else {
                trigram_cosine(&prepared[ra].trigrams, &prepared[rb].trigrams)
            };
            if jac >= 0.72 || (jac >= 0.60 && tri >= 0.78) {
                if let Some((w, _)) = uf.union_by_priority(ra, rb, foods, &prepared) {
                    *pass_merges.entry(MergePass::FuzzyTrigram).or_insert(0) += 1;
                    merge_pass_by_node.insert(w, MergePass::FuzzyTrigram);
                }
            }
        }
    }

    // Stage 5 (Pass D): Smart Commodity Collapse (Balanced Policy)
    {
        let roots = active_roots(&mut uf);
        let mut commodity_buckets: HashMap<&str, Vec<usize>> = HashMap::new();
        for &r in &roots {
            if prepared[r].is_commodity && !prepared[r].core_key.is_empty() {
                commodity_buckets
                    .entry(prepared[r].core_key.as_str())
                    .or_default()
                    .push(r);
            }
        }

        let mut keys: Vec<&str> = commodity_buckets.keys().copied().collect();
        keys.sort_unstable();

        for key in keys {
            let mut group = commodity_buckets[key].clone();
            if group.len() < 2 {
                continue;
            }
            // Sort by priority so canonical USDA/reference entries anchor the cluster first
            group.sort_by(|&a, &b| {
                compare_food_priority(
                    &foods[a],
                    prepared[a].micro_count,
                    prepared[a].serving_count,
                    &foods[b],
                    prepared[b].micro_count,
                    prepared[b].serving_count,
                )
            });

            // Cluster against anchor representatives with tight macro tolerance + all safety guards
            let mut anchors: Vec<usize> = Vec::new();
            for idx in group {
                let r = uf.find(idx);
                let mut merged_into = None;
                for &anchor in &anchors {
                    let ra = uf.find(anchor);
                    if ra == r {
                        merged_into = Some(ra);
                        break;
                    }
                    if passes_safety_guards(&prepared[ra], &prepared[r])
                        && are_macros_similar(prepared[ra].macros, prepared[r].macros, true)
                    {
                        if let Some((w, _)) = uf.union_by_priority(ra, r, foods, &prepared) {
                            *pass_merges.entry(MergePass::CommodityCollapse).or_insert(0) += 1;
                            merge_pass_by_node.insert(w, MergePass::CommodityCollapse);
                            merged_into = Some(w);
                        }
                        break;
                    }
                }
                if merged_into.is_none() {
                    anchors.push(r);
                }
            }
        }
    }

    // Assemble final clusters sorted deterministically
    let mut grouped: HashMap<usize, Vec<usize>> = HashMap::new();
    for idx in 0..n {
        if !active_mask[idx] {
            continue;
        }
        let root = uf.find(idx);
        grouped.entry(root).or_default().push(idx);
    }

    let mut clusters: Vec<Vec<usize>> = grouped
        .into_values()
        .map(|mut members| {
            members.sort_by(|&a, &b| {
                compare_food_priority(
                    &foods[a],
                    prepared[a].micro_count,
                    prepared[a].serving_count,
                    &foods[b],
                    prepared[b].micro_count,
                    prepared[b].serving_count,
                )
            });
            members
        })
        .collect();

    // Sort clusters by winner's original row index for stable output order
    clusters.sort_by_key(|c| c[0]);

    let mut cluster_pass = HashMap::new();
    for c in &clusters {
        if c.len() > 1 {
            let winner = c[0];
            if let Some(&pass) = merge_pass_by_node.get(&uf.find(winner)) {
                cluster_pass.insert(winner, pass);
            } else {
                cluster_pass.insert(winner, MergePass::ExactIdOrBarcode);
            }
        }
    }

    ClusterOutput {
        quarantined,
        clusters,
        pass_merges,
        cluster_pass,
        brand_families_merged,
        brand_display_map,
    }
}

fn is_nice_case(s: &str) -> bool {
    let has_upper = s.chars().any(|c| c.is_uppercase());
    let has_lower = s.chars().any(|c| c.is_lowercase());
    has_upper && has_lower
}
