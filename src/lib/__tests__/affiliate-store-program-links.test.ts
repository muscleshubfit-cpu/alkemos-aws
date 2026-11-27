import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { WORKOUT_PROGRAMS } from "@/lib/workout-programs";

/**
 * AFFILIATE-STORE PROGRAM-LINK KEYS canary (audit 530 §3.2-1 / §6 item 1 —
 * owner order 2026-11-28 «نفّذ البند الأول من خطة التدقيق»): the 40 program
 * bindings were seeded under ABBREVIATED keys (gym-strength / home-workout /
 * hiit / home-dumbbell / home-core) that match NO real program slug, so all
 * seven program pages rendered ZERO "Gear for this program" rail. Migration
 * 0122 re-keys them to the REAL slugs and binds the two empty gym programs.
 *
 * This canary pins:
 *   1. THE MAPPING — every remap target is a real slug (single source:
 *      src/lib/workout-programs.ts — WORKOUT_PROGRAMS slugs), and each
 *      legacy key is re-keyed by 0122 exactly once.
 *   2. THE RENDER WIRING — the program page passes the REAL slug to the
 *      rail (surfaceKey={slug}) with the "Gear for this program" title.
 *   3. THE FUTURE GUARD — every migration file that binds program keys
 *      must bind REAL slugs only (the five abbreviated keys are legal ONLY
 *      inside the three landed founding batches, which the migration law
 *      forbids editing). The 530 §3.2-1 defect class can never ship again.
 */
const repo = (...parts: string[]) => path.join(process.cwd(), ...parts);
const read = (...parts: string[]) => readFileSync(repo(...parts), "utf8");

const MIGRATION = "supabase/migrations/20261128120000_0122_affiliate_store_program_links_fix.sql";

/**
 * THE DOCUMENTED MAPPING (audit 530 §6 item 1 + the image-file evidence:
 * each abbreviated key IS its program's image basename in
 * workout-programs.ts — IMAGES.homeBodyweight = home-workout.webp etc.).
 */
const REMAP: Record<string, string> = {
  "gym-strength": "gym-strength-5x5",
  "home-workout": "home-beginner-fullbody",
  hiit: "home-fat-loss-hiit",
  "home-dumbbell": "home-dumbbell-ppl",
  "home-core": "home-core-specialization",
};

const REAL_SLUGS = new Set(WORKOUT_PROGRAMS.map((p) => p.slug));

/** The three LANDED founding batches carry the legacy keys (applied
 *  history — never edited, migration law); every OTHER file must bind
 *  real slugs only. 0122 is the sanctioned correction channel. */
const LEGACY_KEY_FILES = new Set([
  "20261126140000_0116_store_seed_batch_1.sql",
  "20261126150000_0117_store_clean_stack_guard_seed_fix.sql",
  "20261127120000_0119_affiliate_store_expansion.sql",
]);

// the link-seed insert shape: select p.id, 'program', '<key>' from …
const PROGRAM_KEY_INSERT_RE = /select p\.id,\s*'program',\s*'([a-z0-9-]+)'/g;

describe("AFFILIATE-STORE PROGRAM-LINK KEYS (0122)", () => {
  it("the seven real program slugs are the single source (structure pin)", () => {
    expect(REAL_SLUGS.size).toBe(7);
    expect(REAL_SLUGS.has("gym-strength-5x5")).toBe(true);
    expect(REAL_SLUGS.has("home-beginner-fullbody")).toBe(true);
    expect(REAL_SLUGS.has("home-fat-loss-hiit")).toBe(true);
    expect(REAL_SLUGS.has("home-core-specialization")).toBe(true);
    expect(REAL_SLUGS.has("home-dumbbell-ppl")).toBe(true);
    expect(REAL_SLUGS.has("gym-beginner-fullbody")).toBe(true);
    expect(REAL_SLUGS.has("gym-ppl-intermediate")).toBe(true);
  });

  it("every remap target is a real program slug (no invented keys)", () => {
    for (const [legacy, real] of Object.entries(REMAP)) {
      expect(
        REAL_SLUGS.has(real),
        `remap target '${real}' (from legacy '${legacy}') must be a real slug`,
      ).toBe(true);
    }
    // each abbreviated legacy key matches no real slug — the defect class.
    for (const legacy of Object.keys(REMAP)) {
      expect(REAL_SLUGS.has(legacy)).toBe(false);
    }
  });

  it("0122 re-keys each of the five legacy keys exactly once", () => {
    const sql = read(MIGRATION);
    for (const [legacy, real] of Object.entries(REMAP)) {
      expect(sql).toContain(`set surface_key = '${real}'`);
      expect(sql).toContain(`and surface_key = '${legacy}'`);
    }
    const targets = [...sql.matchAll(/set surface_key = '([a-z0-9-]+)'/g)].map((m) => m[1]);
    expect(targets.length).toBe(5);
    for (const t of targets) expect(REAL_SLUGS.has(t), `update target '${t}'`).toBe(true);
    const sources = [...sql.matchAll(/and surface_key = '([a-z0-9-]+)'/g)].map((m) => m[1]);
    expect(sources.length).toBe(5);
    for (const s of sources) expect(s in REMAP, `update source '${s}' is a legacy key`).toBe(true);
  });

  it("0122 binds the two previously-empty gym programs (4 real-slug inserts each)", () => {
    const sql = read(MIGRATION);
    const inserts = [...sql.matchAll(PROGRAM_KEY_INSERT_RE)].map((m) => m[1]);
    expect(inserts.length).toBe(8);
    for (const k of inserts) expect(REAL_SLUGS.has(k), `insert key '${k}'`).toBe(true);
    const perKey = inserts.reduce<Record<string, number>>((acc, k) => {
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    expect(perKey["gym-beginner-fullbody"]).toBe(4);
    expect(perKey["gym-ppl-intermediate"]).toBe(4);
  });

  it("the program surface passes the REAL slug (the render-side wiring pin)", () => {
    const page = read("src/app/(en)/programs/[slug]/page.tsx");
    expect(page).toContain('surfaceType="program"');
    expect(page).toContain("surfaceKey={slug}");
    expect(page).toContain('title="Gear for this program"');
  });

  it("FUTURE GUARD — no migration binds a program key outside the real slugs", () => {
    const dir = repo("supabase/migrations");
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBeGreaterThan(100); // sanity: the walk really walked
    let filesWithProgramKeys = 0;
    for (const f of files) {
      const sql = readFileSync(path.join(dir, f), "utf8");
      const keys = [...sql.matchAll(PROGRAM_KEY_INSERT_RE)].map((m) => m[1]);
      if (keys.length === 0) continue;
      filesWithProgramKeys += 1;
      if (LEGACY_KEY_FILES.has(f)) {
        // the landed founding batches: real slugs OR the five legacy keys.
        for (const k of keys) {
          const ok = REAL_SLUGS.has(k) || k in REMAP;
          expect(
            ok,
            `${f}: program key '${k}' is neither a real slug nor a documented legacy key`,
          ).toBe(true);
        }
      } else {
        // every other file — including any FUTURE seed: real slugs only.
        for (const k of keys) {
          expect(
            REAL_SLUGS.has(k),
            `${f}: program key '${k}' is not a real program slug — the audit-530 §3.2-1 defect class (abbreviated key matching no live slug)`,
          ).toBe(true);
        }
      }
    }
    // the four link-seeding files exist and were all actually scanned.
    expect(filesWithProgramKeys).toBeGreaterThanOrEqual(4);
  });
});
