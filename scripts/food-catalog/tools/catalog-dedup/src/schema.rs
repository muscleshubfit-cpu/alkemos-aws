use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;

use chrono::Utc;
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const CATALOG_SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS catalog_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS foods (
  rowid INTEGER PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  barcode TEXT,
  source TEXT NOT NULL,
  accuracy_tier INTEGER NOT NULL,
  region TEXT NOT NULL DEFAULT 'GLOBAL',
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  aliases TEXT NOT NULL DEFAULT '',
  basis TEXT NOT NULL,
  serving_size REAL NOT NULL,
  serving_unit TEXT NOT NULL,
  serving_weight_grams REAL,
  calories REAL NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fat REAL NOT NULL,
  fiber REAL NOT NULL,
  micronutrients_json TEXT NOT NULL,
  serving_options_json TEXT NOT NULL,
  search_rank REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_foods_barcode
  ON foods(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_foods_tier_rank
  ON foods(accuracy_tier, search_rank DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
  name,
  brand,
  aliases,
  category,
  content='foods',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2',
  prefix='2 3'
);

CREATE TABLE IF NOT EXISTS food_id_aliases (
  legacy_id TEXT PRIMARY KEY,
  canonical_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food_barcode_aliases (
  barcode TEXT PRIMARY KEY,
  canonical_id TEXT NOT NULL
);
"#;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FoodRow {
    pub id: String,
    pub barcode: Option<String>,
    pub source: String,
    pub accuracy_tier: i64,
    pub region: String,
    pub category: String,
    pub name: String,
    pub brand: String,
    pub aliases: String,
    pub basis: String,
    pub serving_size: f64,
    pub serving_unit: String,
    pub serving_weight_grams: Option<f64>,
    pub calories: f64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub fiber: f64,
    pub micronutrients_json: String,
    pub serving_options_json: String,
    pub search_rank: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServingOption {
    pub id: String,
    pub label: String,
    pub unit: String,
    pub grams: f64,
    #[serde(rename = "defaultAmount", skip_serializing_if = "Option::is_none")]
    pub default_amount: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogManifest {
    pub version: String,
    pub tier: String,
    pub sha256: String,
    pub built_at: String,
    pub food_count: usize,
    pub gzip_bytes: usize,
    pub raw_bytes: usize,
    pub license: String,
}

pub struct LoadedCatalog {
    pub foods: Vec<FoodRow>,
    pub id_aliases: Vec<(String, String)>,
    pub barcode_aliases: Vec<(String, String)>,
    pub meta: BTreeMap<String, String>,
    pub input_gzip_bytes: Option<usize>,
    pub input_raw_bytes: usize,
}

pub fn load_catalog(input_path: &Path) -> Result<LoadedCatalog, String> {
    let raw_file_bytes =
        fs::read(input_path).map_err(|e| format!("Failed to read {}: {}", input_path.display(), e))?;

    let is_gzip = raw_file_bytes.len() >= 2
        && raw_file_bytes[0] == 0x1f
        && raw_file_bytes[1] == 0x8b;

    let (input_gzip_bytes, db_bytes) = if is_gzip {
        let mut decoder = GzDecoder::new(&raw_file_bytes[..]);
        let mut decompressed = Vec::with_capacity(raw_file_bytes.len() * 4);
        decoder
            .read_to_end(&mut decompressed)
            .map_err(|e| format!("Failed to decompress gzip {}: {}", input_path.display(), e))?;
        (Some(raw_file_bytes.len()), decompressed)
    } else {
        (None, raw_file_bytes)
    };

    let input_raw_bytes = db_bytes.len();
    let temp_dir = tempfile::tempdir().map_err(|e| format!("Failed to create tempdir: {}", e))?;
    let temp_db_path = temp_dir.path().join("input.db");
    fs::write(&temp_db_path, &db_bytes)
        .map_err(|e| format!("Failed to write temp input db: {}", e))?;

    let conn = Connection::open(&temp_db_path)
        .map_err(|e| format!("Failed to open sqlite db: {}", e))?;

    let mut foods = Vec::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT id, barcode, source, accuracy_tier, region, category, name, brand, aliases,
                        basis, serving_size, serving_unit, serving_weight_grams,
                        calories, protein, carbs, fat, fiber,
                        micronutrients_json, serving_options_json, search_rank
                 FROM foods
                 ORDER BY rowid ASC",
            )
            .map_err(|e| format!("Failed to prepare foods query: {}", e))?;

        let rows = stmt
            .query_map([], |r| {
                Ok(FoodRow {
                    id: r.get(0)?,
                    barcode: r.get(1)?,
                    source: r.get(2)?,
                    accuracy_tier: r.get(3)?,
                    region: r.get(4)?,
                    category: r.get(5)?,
                    name: r.get(6)?,
                    brand: r.get(7)?,
                    aliases: r.get(8)?,
                    basis: r.get(9)?,
                    serving_size: r.get(10)?,
                    serving_unit: r.get(11)?,
                    serving_weight_grams: r.get(12)?,
                    calories: r.get(13)?,
                    protein: r.get(14)?,
                    carbs: r.get(15)?,
                    fat: r.get(16)?,
                    fiber: r.get(17)?,
                    micronutrients_json: r.get(18)?,
                    serving_options_json: r.get(19)?,
                    search_rank: r.get(20)?,
                })
            })
            .map_err(|e| format!("Failed to read foods rows: {}", e))?;

        for row in rows {
            foods.push(row.map_err(|e| format!("Row decode error: {}", e))?);
        }
    }

    let mut id_aliases = Vec::new();
    if table_exists(&conn, "food_id_aliases") {
        let mut stmt = conn
            .prepare("SELECT legacy_id, canonical_id FROM food_id_aliases ORDER BY legacy_id ASC")
            .map_err(|e| format!("Failed to query food_id_aliases: {}", e))?;
        let rows = stmt
            .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .map_err(|e| format!("Failed to read food_id_aliases: {}", e))?;
        for row in rows {
            id_aliases.push(row.map_err(|e| format!("Alias decode error: {}", e))?);
        }
    }

    let mut barcode_aliases = Vec::new();
    if table_exists(&conn, "food_barcode_aliases") {
        let mut stmt = conn
            .prepare("SELECT barcode, canonical_id FROM food_barcode_aliases ORDER BY barcode ASC")
            .map_err(|e| format!("Failed to query food_barcode_aliases: {}", e))?;
        let rows = stmt
            .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .map_err(|e| format!("Failed to read food_barcode_aliases: {}", e))?;
        for row in rows {
            barcode_aliases.push(row.map_err(|e| format!("Barcode alias decode error: {}", e))?);
        }
    }

    let mut meta = BTreeMap::new();
    if table_exists(&conn, "catalog_meta") {
        let mut stmt = conn
            .prepare("SELECT key, value FROM catalog_meta")
            .map_err(|e| format!("Failed to query catalog_meta: {}", e))?;
        let rows = stmt
            .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .map_err(|e| format!("Failed to read catalog_meta: {}", e))?;
        for row in rows {
            let (k, v) = row.map_err(|e| format!("Meta decode error: {}", e))?;
            meta.insert(k, v);
        }
    }

    // Explicitly close connection before tempdir drops so Windows releases the file handle cleanly
    drop(conn);
    drop(temp_dir);

    Ok(LoadedCatalog {
        foods,
        id_aliases,
        barcode_aliases,
        meta,
        input_gzip_bytes,
        input_raw_bytes,
    })
}

fn table_exists(conn: &Connection, table_name: &str) -> bool {
    conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?1",
        params![table_name],
        |_| Ok(()),
    )
    .is_ok()
}

pub fn write_compacted_catalog(
    foods: &[FoodRow],
    id_aliases: &[(String, String)],
    barcode_aliases: &[(String, String)],
    version: &str,
    tier: &str,
    output_gz_path: &Path,
    manifest_out_path: Option<&Path>,
    output_raw_db_path: Option<&Path>,
) -> Result<CatalogManifest, String> {
    let temp_dir = tempfile::tempdir().map_err(|e| format!("Failed to create tempdir: {}", e))?;
    let temp_db_path = temp_dir.path().join("compacted.db");
    let built_at = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

    {
        let mut conn = Connection::open(&temp_db_path)
            .map_err(|e| format!("Failed to create output sqlite db: {}", e))?;

        conn.execute_batch(
            "PRAGMA journal_mode = OFF;
             PRAGMA synchronous = OFF;
             PRAGMA temp_store = MEMORY;
             PRAGMA cache_size = -65536;",
        )
        .map_err(|e| format!("Failed to set pragmas: {}", e))?;

        conn.execute_batch(CATALOG_SCHEMA_SQL)
            .map_err(|e| format!("Failed to create catalog schema: {}", e))?;

        let tx = conn
            .transaction()
            .map_err(|e| format!("Failed to start transaction: {}", e))?;

        {
            let mut insert_food = tx
                .prepare_cached(
                    "INSERT INTO foods (
                        id, barcode, source, accuracy_tier, region, category, name, brand, aliases,
                        basis, serving_size, serving_unit, serving_weight_grams,
                        calories, protein, carbs, fat, fiber,
                        micronutrients_json, serving_options_json, search_rank
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
                )
                .map_err(|e| format!("Failed to prepare food insert: {}", e))?;

            for row in foods {
                insert_food
                    .execute(params![
                        row.id,
                        row.barcode,
                        row.source,
                        row.accuracy_tier,
                        row.region,
                        row.category,
                        row.name,
                        row.brand,
                        row.aliases,
                        row.basis,
                        row.serving_size,
                        row.serving_unit,
                        row.serving_weight_grams,
                        row.calories,
                        row.protein,
                        row.carbs,
                        row.fat,
                        row.fiber,
                        row.micronutrients_json,
                        row.serving_options_json,
                        row.search_rank,
                    ])
                    .map_err(|e| format!("Failed to insert food {}: {}", row.id, e))?;
            }
        }

        {
            let mut insert_alias = tx
                .prepare_cached(
                    "INSERT OR REPLACE INTO food_id_aliases (legacy_id, canonical_id) VALUES (?1, ?2)",
                )
                .map_err(|e| format!("Failed to prepare alias insert: {}", e))?;
            for (legacy_id, canonical_id) in id_aliases {
                insert_alias
                    .execute(params![legacy_id, canonical_id])
                    .map_err(|e| format!("Failed to insert id alias: {}", e))?;
            }
        }

        {
            let mut insert_barcode_alias = tx
                .prepare_cached(
                    "INSERT OR IGNORE INTO food_barcode_aliases (barcode, canonical_id) VALUES (?1, ?2)",
                )
                .map_err(|e| format!("Failed to prepare barcode alias insert: {}", e))?;
            for (barcode, canonical_id) in barcode_aliases {
                insert_barcode_alias
                    .execute(params![barcode, canonical_id])
                    .map_err(|e| format!("Failed to insert barcode alias: {}", e))?;
            }
        }

        {
            let mut insert_meta = tx
                .prepare_cached("INSERT OR REPLACE INTO catalog_meta (key, value) VALUES (?1, ?2)")
                .map_err(|e| format!("Failed to prepare meta insert: {}", e))?;
            for (k, v) in [
                ("version", version.to_string()),
                ("tier", tier.to_string()),
                ("built_at", built_at.clone()),
                ("food_count", foods.len().to_string()),
                ("license", "ODbL-1.0".to_string()),
            ] {
                insert_meta
                    .execute(params![k, v])
                    .map_err(|e| format!("Failed to insert meta {}: {}", k, e))?;
            }
        }

        tx.commit()
            .map_err(|e| format!("Failed to commit transaction: {}", e))?;

        conn.execute_batch(
            "INSERT INTO foods_fts(foods_fts) VALUES('rebuild');
             INSERT INTO foods_fts(foods_fts) VALUES('optimize');
             ANALYZE;
             VACUUM;",
        )
        .map_err(|e| format!("Failed to rebuild FTS5 / VACUUM: {}", e))?;
    }

    let raw_bytes =
        fs::read(&temp_db_path).map_err(|e| format!("Failed to read compacted db: {}", e))?;
    let mut hasher = Sha256::new();
    hasher.update(&raw_bytes);
    let sha256 = format!("{:x}", hasher.finalize());

    if let Some(raw_out) = output_raw_db_path {
        if let Some(parent) = raw_out.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {}", e))?;
            }
        }
        atomic_write_bytes(raw_out, &raw_bytes)?;
    }

    if let Some(parent) = output_gz_path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {}", e))?;
        }
    }
    let mut encoder = GzEncoder::new(Vec::with_capacity(raw_bytes.len() / 3), Compression::best());
    encoder
        .write_all(&raw_bytes)
        .map_err(|e| format!("Gzip write error: {}", e))?;
    let compressed = encoder
        .finish()
        .map_err(|e| format!("Gzip finish error: {}", e))?;
    let gzip_bytes = compressed.len();
    atomic_write_bytes(output_gz_path, &compressed)?;

    let manifest = CatalogManifest {
        version: version.to_string(),
        tier: tier.to_string(),
        sha256,
        built_at,
        food_count: foods.len(),
        gzip_bytes,
        raw_bytes: raw_bytes.len(),
        license: "ODbL-1.0".to_string(),
    };

    if let Some(manifest_path) = manifest_out_path {
        if let Some(parent) = manifest_path.parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {}", e))?;
            }
        }
        let mut json = serde_json::to_string_pretty(&manifest)
            .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
        json.push('\n');
        atomic_write_bytes(manifest_path, json.as_bytes())?;
    }

    Ok(manifest)
}

fn atomic_write_bytes(target: &Path, bytes: &[u8]) -> Result<(), String> {
    let tmp_path = target.with_extension(format!(
        "{}.tmp",
        target
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("out")
    ));
    {
        let mut f = File::create(&tmp_path)
            .map_err(|e| format!("Failed to create {}: {}", tmp_path.display(), e))?;
        f.write_all(bytes)
            .map_err(|e| format!("Failed to write {}: {}", tmp_path.display(), e))?;
        f.sync_all()
            .map_err(|e| format!("Failed to sync {}: {}", tmp_path.display(), e))?;
    }
    // Try direct atomic rename first (succeeds atomically on POSIX and on Windows when target doesn't exist)
    if fs::rename(&tmp_path, target).is_ok() {
        return Ok(());
    }
    // Windows fallback when target already exists: backup -> rename -> delete backup
    let backup_path = target.with_extension(format!(
        "{}.bak",
        target
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("out")
    ));
    let had_target = target.exists();
    if had_target {
        if backup_path.exists() {
            let _ = fs::remove_file(&backup_path);
        }
        if let Err(e) = fs::rename(target, &backup_path) {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!(
                "Failed to stage backup {} -> {}: {}",
                target.display(),
                backup_path.display(),
                e
            ));
        }
    }
    match fs::rename(&tmp_path, target) {
        Ok(()) => {
            if had_target {
                let _ = fs::remove_file(&backup_path);
            }
            Ok(())
        }
        Err(e) => {
            if had_target {
                let _ = fs::rename(&backup_path, target);
            }
            let _ = fs::remove_file(&tmp_path);
            Err(format!(
                "Failed to rename {} -> {}: {}",
                tmp_path.display(),
                target.display(),
                e
            ))
        }
    }
}
