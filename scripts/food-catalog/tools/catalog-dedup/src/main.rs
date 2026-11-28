mod cluster;
mod hygiene;
mod merge;
mod normalize;
mod report;
mod schema;

use std::fs;
use std::path::PathBuf;
use std::time::Instant;

use chrono::Utc;
use clap::{Parser, Subcommand};

use crate::cluster::run_dedup_pipeline;
use crate::merge::build_merged_catalog;
use crate::report::{build_report, print_human_summary};
use crate::schema::{load_catalog, write_compacted_catalog};

#[derive(Parser, Debug)]
#[command(
    name = "catalog-dedup",
    about = "High-speed multi-threaded food catalog analyzer, deep deduplicator, and SQLite FTS5 compactor"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Read-only deep audit of duplicates, brand fragmentation, and Tier-4 hygiene issues
    Audit {
        #[arg(long)]
        input: PathBuf,
        #[arg(long)]
        report: Option<PathBuf>,
    },
    /// Runs the 6-stage deduplication pipeline and writes a compacted .db.gz + catalog-manifest.json
    Compact {
        #[arg(long)]
        input: PathBuf,
        #[arg(long = "output-gz")]
        output_gz: PathBuf,
        #[arg(long)]
        manifest: Option<PathBuf>,
        #[arg(long = "output-raw-db")]
        output_raw_db: Option<PathBuf>,
        #[arg(long)]
        report: Option<PathBuf>,
        #[arg(long)]
        version: Option<String>,
        #[arg(long)]
        tier: Option<String>,
    },
}

fn default_version() -> String {
    Utc::now().format("%Y.%m.%d").to_string()
}

fn main() {
    let cli = Cli::parse();
    let started = Instant::now();

    let result = match cli.command {
        Commands::Audit { input, report } => run_audit(input, report, started),
        Commands::Compact {
            input,
            output_gz,
            manifest,
            output_raw_db,
            report,
            version,
            tier,
        } => run_compact(
            input,
            output_gz,
            manifest,
            output_raw_db,
            report,
            version,
            tier,
            started,
        ),
    };

    if let Err(err) = result {
        eprintln!("[catalog-dedup] ERROR: {}", err);
        std::process::exit(1);
    }
}

fn run_audit(input: PathBuf, report_path: Option<PathBuf>, started: Instant) -> Result<(), String> {
    let loaded = load_catalog(&input)?;
    let cluster_out = run_dedup_pipeline(&loaded.foods);
    let merged_out = build_merged_catalog(
        &loaded.foods,
        &cluster_out.clusters,
        &loaded.id_aliases,
        &loaded.barcode_aliases,
        &cluster_out.brand_display_map,
    );
    let report = build_report(
        &loaded.foods,
        &cluster_out,
        &merged_out,
        loaded.input_gzip_bytes,
        loaded.input_raw_bytes,
        None,
        started.elapsed().as_millis(),
    );

    print_human_summary(&report);

    if let Some(rp) = report_path {
        if let Some(parent) = rp.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {}", e))?;
            }
        }
        let json = serde_json::to_string_pretty(&report)
            .map_err(|e| format!("Failed to serialize report: {}", e))?;
        fs::write(&rp, format!("{}\n", json))
            .map_err(|e| format!("Failed to write report {}: {}", rp.display(), e))?;
        println!(" Audit report written to {}", rp.display());
    }

    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn run_compact(
    input: PathBuf,
    output_gz: PathBuf,
    manifest: Option<PathBuf>,
    output_raw_db: Option<PathBuf>,
    report_path: Option<PathBuf>,
    version_arg: Option<String>,
    tier_arg: Option<String>,
    started: Instant,
) -> Result<(), String> {
    // Load input completely into memory and drop file handle before writing (safe for Windows in-place overwrite)
    let loaded = load_catalog(&input)?;

    let tier = tier_arg
        .or_else(|| loaded.meta.get("tier").cloned())
        .unwrap_or_else(|| "core".to_string());
    let version = version_arg.unwrap_or_else(default_version);

    let cluster_out = run_dedup_pipeline(&loaded.foods);
    let merged_out = build_merged_catalog(
        &loaded.foods,
        &cluster_out.clusters,
        &loaded.id_aliases,
        &loaded.barcode_aliases,
        &cluster_out.brand_display_map,
    );

    let out_manifest = write_compacted_catalog(
        &merged_out.foods,
        &merged_out.id_aliases,
        &merged_out.barcode_aliases,
        &version,
        &tier,
        &output_gz,
        manifest.as_deref(),
        output_raw_db.as_deref(),
    )?;

    let report = build_report(
        &loaded.foods,
        &cluster_out,
        &merged_out,
        loaded.input_gzip_bytes,
        loaded.input_raw_bytes,
        Some(out_manifest),
        started.elapsed().as_millis(),
    );

    print_human_summary(&report);

    if let Some(rp) = report_path {
        if let Some(parent) = rp.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {}", e))?;
            }
        }
        let json = serde_json::to_string_pretty(&report)
            .map_err(|e| format!("Failed to serialize report: {}", e))?;
        fs::write(&rp, format!("{}\n", json))
            .map_err(|e| format!("Failed to write report {}: {}", rp.display(), e))?;
        println!(" Compact report written to {}", rp.display());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use super::*;
    use crate::hygiene::{check_hygiene, HygieneReason};
    use crate::normalize::canonicalize_brand;
    use crate::schema::FoodRow;

    fn make_food(
        id: &str,
        name: &str,
        brand: &str,
        source: &str,
        tier: i64,
        cal: f64,
        p: f64,
        c: f64,
        f: f64,
    ) -> FoodRow {
        FoodRow {
            id: id.to_string(),
            barcode: None,
            source: source.to_string(),
            accuracy_tier: tier,
            region: "US".to_string(),
            category: String::new(),
            name: name.to_string(),
            brand: brand.to_string(),
            aliases: String::new(),
            basis: "per100g".to_string(),
            serving_size: 100.0,
            serving_unit: "g".to_string(),
            serving_weight_grams: Some(100.0),
            calories: cal,
            protein: p,
            carbs: c,
            fat: f,
            fiber: 0.0,
            micronutrients_json: "{}".to_string(),
            serving_options_json: r#"[{"id":"g","label":"g","unit":"g","grams":1},{"id":"oz","label":"oz","unit":"oz","grams":28.35}]"#.to_string(),
            search_rank: 0.0,
        }
    }

    #[test]
    fn hygiene_prunes_junk_off_and_preserves_alcohol_and_tier1() {
        let junk_name = make_food("off:1", "Original", "Acme", "openfoodfacts", 4, 200.0, 5.0, 25.0, 8.0);
        assert_eq!(check_hygiene(&junk_name), Some(HygieneReason::UnusableName));

        let bad_coke = make_food("off:2", "Coca-Cola", "Coca Cola", "openfoodfacts", 4, 3.0, 7.0, 23.0, 1.0);
        assert_eq!(check_hygiene(&bad_coke), Some(HygieneReason::AtwaterContradiction));

        // Alcohol exemption: vodka 231 kcal with 0P/0C/0F is valid (ethanol = 7 kcal/g)
        let vodka = make_food("off:3", "Smirnoff Vodka", "Smirnoff", "openfoodfacts", 4, 231.0, 0.0, 0.0, 0.0);
        assert_eq!(check_hygiene(&vodka), None);

        // Zero-cal water is valid
        let water = make_food("off:4", "Spring Water", "Evian", "openfoodfacts", 4, 0.0, 0.0, 0.0, 0.0);
        assert_eq!(check_hygiene(&water), None);

        // Tier 1 USDA is NEVER pruned
        let usda_edge = make_food("usda:1", "Original", "", "usda_foundation", 1, 3.0, 7.0, 23.0, 1.0);
        assert_eq!(check_hygiene(&usda_edge), None);
    }

    #[test]
    fn brand_canonicalization_merges_corporate_suffixes() {
        assert_eq!(canonicalize_brand("The Kroger Co."), "kroger");
        assert_eq!(canonicalize_brand("KROGER"), "kroger");
        assert_eq!(canonicalize_brand("Kroger"), "kroger");
        assert_eq!(canonicalize_brand("Hy-Vee, Inc."), "hy vee");
        assert_eq!(canonicalize_brand("HY-VEE"), "hy vee");
        assert_eq!(canonicalize_brand("Marks & Spencer"), "marks spencer");
        assert_eq!(canonicalize_brand("Marks&spencer"), "marks spencer");
    }

    #[test]
    fn safety_guards_block_false_merges() {
        let foods = vec![
            make_food("f1", "Chicken Breast (Raw)", "", "usda_sr_legacy", 1, 120.0, 23.0, 0.0, 3.0),
            make_food("f2", "Chicken Breast (Cooked, Grilled)", "", "usda_sr_legacy", 1, 125.0, 24.0, 0.0, 3.0),
            make_food("f3", "Chicken Breast (Cooked, Fried)", "", "usda_sr_legacy", 1, 130.0, 24.0, 1.0, 3.5),
            make_food("f4", "Greek Yogurt, Plain, Nonfat", "", "usda_foundation", 1, 61.0, 10.0, 4.0, 0.0),
            make_food("f5", "Greek Yogurt, Plain, Whole Milk", "", "usda_sr_legacy", 1, 65.0, 10.0, 4.0, 1.0),
            make_food("f6", "Coca-Cola", "Coca-Cola", "openfoodfacts", 4, 42.0, 0.0, 10.6, 0.0),
            make_food("f7", "Coca-Cola Zero", "Coca-Cola", "openfoodfacts", 4, 35.0, 0.0, 9.0, 0.0),
            make_food("f8", "White Rice (Raw)", "", "usda_sr_legacy", 1, 365.0, 7.0, 80.0, 1.0),
            make_food("f9", "Brown Rice (Raw)", "", "usda_sr_legacy", 1, 362.0, 7.5, 77.0, 2.5),
            make_food("f10", "Peanut Butter", "", "usda_foundation", 1, 590.0, 25.0, 20.0, 50.0),
            make_food("f11", "Peanut Butter Granola Bar", "Nature Valley", "openfoodfacts", 4, 580.0, 24.0, 22.0, 48.0),
        ];

        let out = run_dedup_pipeline(&foods);
        assert_eq!(out.clusters.len(), foods.len(), "None of the guarded pairs should merge");
    }

    #[test]
    fn commodity_collapse_merges_store_brands_preserves_barcodes_and_metric_servings() {
        let mut usda_pb = make_food("usda:pb", "Peanut Butter", "", "usda_foundation", 1, 598.0, 22.0, 22.0, 51.0);
        usda_pb.barcode = Some("051500255162".to_string()); // 12-digit UPC-A -> 0051500255162
        usda_pb.serving_options_json = r#"[{"id":"tbsp","label":"tbsp","unit":"tbsp","grams":32},{"id":"g","label":"g","unit":"g","grams":1},{"id":"oz","label":"oz","unit":"oz","grams":28.35}]"#.to_string();

        let mut kroger_pb = make_food("off:kroger-pb", "Peanut Butter", "The Kroger Co.", "openfoodfacts", 4, 595.0, 22.5, 21.5, 50.5);
        kroger_pb.barcode = Some("011110838049".to_string()); // 12-digit -> 0011110838049

        let mut tesco_pb = make_food("off:tesco-pb", "Peanut Butter", "Tesco", "openfoodfacts", 4, 602.0, 21.8, 22.2, 51.2);
        tesco_pb.barcode = Some("5000119001234".to_string());

        let foods = vec![usda_pb, kroger_pb, tesco_pb];
        let existing_id_aliases = vec![("staple:peanut-butter".to_string(), "off:kroger-pb".to_string())];
        let existing_bc_aliases = vec![("9999999999999".to_string(), "off:tesco-pb".to_string())];

        let out = run_dedup_pipeline(&foods);
        let merged = build_merged_catalog(
            &foods,
            &out.clusters,
            &existing_id_aliases,
            &existing_bc_aliases,
            &out.brand_display_map,
        );

        assert_eq!(merged.foods.len(), 1);
        assert_eq!(merged.foods[0].id, "usda:pb");
        assert_eq!(merged.foods[0].barcode.as_deref(), Some("0051500255162"));

        // Verify g and oz are preserved in serving_options_json
        assert!(merged.foods[0].serving_options_json.contains("\"unit\":\"g\""));
        assert!(merged.foods[0].serving_options_json.contains("\"unit\":\"oz\""));

        // Verify transitive ID aliases
        let id_map: HashMap<_, _> = merged.id_aliases.into_iter().collect();
        assert_eq!(id_map.get("off:kroger-pb").map(String::as_str), Some("usda:pb"));
        assert_eq!(id_map.get("off:tesco-pb").map(String::as_str), Some("usda:pb"));
        assert_eq!(id_map.get("staple:peanut-butter").map(String::as_str), Some("usda:pb"));

        // Verify normalized & transitive barcode aliases
        let bc_map: HashMap<_, _> = merged.barcode_aliases.into_iter().collect();
        assert_eq!(bc_map.get("0011110838049").map(String::as_str), Some("usda:pb"));
        assert_eq!(bc_map.get("5000119001234").map(String::as_str), Some("usda:pb"));
        assert_eq!(bc_map.get("9999999999999").map(String::as_str), Some("usda:pb"));
    }

    #[test]
    fn roundtrip_sqlite_write_and_determinism() {
        let f1 = make_food("usda:yogurt", "Greek Yogurt, Plain, Nonfat", "", "usda_foundation", 1, 61.0, 10.0, 4.0, 0.0);
        let f2 = make_food("usda:yogurt-dup", "Greek Yogurt, Plain, Nonfat (includes Foods for Usda's Food Distribution Program)", "", "usda_sr_legacy", 1, 59.0, 10.0, 4.0, 0.0);
        let foods = vec![f1, f2];

        let out1 = run_dedup_pipeline(&foods);
        let out2 = run_dedup_pipeline(&foods);
        assert_eq!(out1.clusters, out2.clusters);
        assert_eq!(out1.clusters.len(), 1);

        let merged = build_merged_catalog(&foods, &out1.clusters, &[], &[], &out1.brand_display_map);
        let dir = tempfile::tempdir().unwrap();
        let gz_path = dir.path().join("test.db.gz");
        let manifest_path = dir.path().join("manifest.json");

        let manifest = write_compacted_catalog(
            &merged.foods,
            &merged.id_aliases,
            &merged.barcode_aliases,
            "2026.11.25",
            "core",
            &gz_path,
            Some(&manifest_path),
            None,
        )
        .unwrap();

        assert_eq!(manifest.food_count, 1);
        assert_eq!(manifest.tier, "core");

        let reloaded = load_catalog(&gz_path).unwrap();
        assert_eq!(reloaded.foods.len(), 1);
        assert_eq!(reloaded.id_aliases.len(), 1);
        assert_eq!(reloaded.meta.get("tier").map(String::as_str), Some("core"));
    }
}
