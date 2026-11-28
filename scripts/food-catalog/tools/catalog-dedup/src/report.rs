use std::collections::BTreeMap;
use serde::Serialize;

use crate::cluster::{ClusterOutput, MergePass};
use crate::hygiene::HygieneReason;
use crate::merge::MergedCatalogOutput;
use crate::schema::{CatalogManifest, FoodRow};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClusterSample {
    pub winner_id: String,
    pub winner_name: String,
    pub winner_brand: String,
    pub winner_source: String,
    pub winner_calories: f64,
    pub pass: MergePass,
    pub cluster_size: usize,
    pub sample_losers: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuarantinedSample {
    pub id: String,
    pub name: String,
    pub brand: String,
    pub reason: HygieneReason,
    pub calories: f64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditReport {
    pub input_food_count: usize,
    pub output_food_count: usize,
    pub total_removed: usize,
    pub reduction_pct: f64,
    pub quarantined_total: usize,
    pub quarantined_by_reason: BTreeMap<String, usize>,
    pub merges_by_pass: BTreeMap<String, usize>,
    pub brand_families_canonicalized: usize,
    pub id_aliases_count: usize,
    pub barcode_aliases_count: usize,
    pub input_gzip_bytes: Option<usize>,
    pub input_raw_bytes: usize,
    pub output_manifest: Option<CatalogManifest>,
    pub by_source_before: BTreeMap<String, usize>,
    pub by_source_after: BTreeMap<String, usize>,
    pub elapsed_ms: u128,
    pub top_clusters: Vec<ClusterSample>,
    pub quarantined_samples: Vec<QuarantinedSample>,
}

pub fn build_report(
    original_foods: &[FoodRow],
    cluster_out: &ClusterOutput,
    merged_out: &MergedCatalogOutput,
    input_gzip_bytes: Option<usize>,
    input_raw_bytes: usize,
    output_manifest: Option<CatalogManifest>,
    elapsed_ms: u128,
) -> AuditReport {
    let input_food_count = original_foods.len();
    let output_food_count = merged_out.foods.len();
    let total_removed = input_food_count.saturating_sub(output_food_count);
    let reduction_pct = if input_food_count > 0 {
        (total_removed as f64 / input_food_count as f64) * 100.0
    } else {
        0.0
    };

    let mut quarantined_by_reason: BTreeMap<String, usize> = BTreeMap::new();
    for (_, reason) in &cluster_out.quarantined {
        *quarantined_by_reason
            .entry(format!("{:?}", reason))
            .or_insert(0) += 1;
    }

    let mut merges_by_pass: BTreeMap<String, usize> = BTreeMap::new();
    for (pass, &cnt) in &cluster_out.pass_merges {
        merges_by_pass.insert(format!("{:?}", pass), cnt);
    }

    let mut by_source_before: BTreeMap<String, usize> = BTreeMap::new();
    for r in original_foods {
        *by_source_before.entry(r.source.clone()).or_insert(0) += 1;
    }
    let mut by_source_after: BTreeMap<String, usize> = BTreeMap::new();
    for r in &merged_out.foods {
        *by_source_after.entry(r.source.clone()).or_insert(0) += 1;
    }

    // Top 25 largest clusters
    let mut merged_clusters: Vec<&Vec<usize>> = cluster_out
        .clusters
        .iter()
        .filter(|c| c.len() > 1)
        .collect();
    merged_clusters.sort_by(|a, b| b.len().cmp(&a.len()).then_with(|| a[0].cmp(&b[0])));

    let top_clusters: Vec<ClusterSample> = merged_clusters
        .into_iter()
        .take(25)
        .map(|c| {
            let w = &original_foods[c[0]];
            let pass = cluster_out
                .cluster_pass
                .get(&c[0])
                .copied()
                .unwrap_or(MergePass::ExactIdOrBarcode);
            let sample_losers = c[1..]
                .iter()
                .take(5)
                .map(|&idx| {
                    let l = &original_foods[idx];
                    format!(
                        "{} [{} | {} | {:.0}kcal]",
                        l.name,
                        l.source,
                        if l.brand.is_empty() { "-" } else { &l.brand },
                        l.calories
                    )
                })
                .collect();
            ClusterSample {
                winner_id: w.id.clone(),
                winner_name: w.name.clone(),
                winner_brand: w.brand.clone(),
                winner_source: w.source.clone(),
                winner_calories: w.calories,
                pass,
                cluster_size: c.len(),
                sample_losers,
            }
        })
        .collect();

    let quarantined_samples: Vec<QuarantinedSample> = cluster_out
        .quarantined
        .iter()
        .take(20)
        .map(|&(idx, reason)| {
            let r = &original_foods[idx];
            QuarantinedSample {
                id: r.id.clone(),
                name: r.name.clone(),
                brand: r.brand.clone(),
                reason,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fat: r.fat,
            }
        })
        .collect();

    AuditReport {
        input_food_count,
        output_food_count,
        total_removed,
        reduction_pct: (reduction_pct * 100.0).round() / 100.0,
        quarantined_total: cluster_out.quarantined.len(),
        quarantined_by_reason,
        merges_by_pass,
        brand_families_canonicalized: cluster_out.brand_families_merged,
        id_aliases_count: merged_out.id_aliases.len(),
        barcode_aliases_count: merged_out.barcode_aliases.len(),
        input_gzip_bytes,
        input_raw_bytes,
        output_manifest,
        by_source_before,
        by_source_after,
        elapsed_ms,
        top_clusters,
        quarantined_samples,
    }
}

pub fn print_human_summary(report: &AuditReport) {
    println!("============================================================");
    println!(" openCalory Rust Catalog Deep Deduplicator Summary");
    println!("============================================================");
    println!(
        " Foods:       {} -> {} (-{} rows, -{:.2}%)",
        report.input_food_count, report.output_food_count, report.total_removed, report.reduction_pct
    );
    println!(" Quarantined: {} rows", report.quarantined_total);
    for (reason, cnt) in &report.quarantined_by_reason {
        println!("   - {}: {}", reason, cnt);
    }
    println!(" Merges by pass:");
    for (pass, cnt) in &report.merges_by_pass {
        println!("   - {}: {}", pass, cnt);
    }
    println!(
        " Brand families canonicalized: {}",
        report.brand_families_canonicalized
    );
    println!(
        " Continuity:  {} id aliases | {} barcode aliases",
        report.id_aliases_count, report.barcode_aliases_count
    );
    if let Some(ref m) = report.output_manifest {
        let in_gz_mb = report
            .input_gzip_bytes
            .map(|b| format!("{:.2} MB", b as f64 / 1024.0 / 1024.0))
            .unwrap_or_else(|| "n/a".to_string());
        let out_gz_mb = m.gzip_bytes as f64 / 1024.0 / 1024.0;
        let in_raw_mb = report.input_raw_bytes as f64 / 1024.0 / 1024.0;
        let out_raw_mb = m.raw_bytes as f64 / 1024.0 / 1024.0;
        println!(
            " Size (gz):   {} -> {:.2} MB",
            in_gz_mb, out_gz_mb
        );
        println!(
            " Size (raw):  {:.2} MB -> {:.2} MB",
            in_raw_mb, out_raw_mb
        );
        println!(" SHA-256:     {}...", &m.sha256[..16.min(m.sha256.len())]);
    }
    println!(" Elapsed:     {} ms", report.elapsed_ms);
    println!("------------------------------------------------------------");
    println!(" Top 10 Merged Clusters:");
    for c in report.top_clusters.iter().take(10) {
        println!(
            "   [{}x {:?}] {} ({}, {:.0} kcal)",
            c.cluster_size, c.pass, c.winner_name, c.winner_source, c.winner_calories
        );
    }
    println!("============================================================");
}
